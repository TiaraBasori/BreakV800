/**
 * BreakV800 — Cloudflare Workers API (D1 后端)
 *
 * 为 GitHub Pages 版本 (https://tiarabasori.github.io/BreakV800/) 提供排行榜:
 *   GET  /api/leaderboard?limit=50   → { entries: [{nickname, v0, stopTime, score}] }
 *   POST /api/score {nickname, v0, stopTime} → {rank, score, best} | {error}
 *
 * 与原版客户端契约完全一致 (字段名/错误格式见 reverse/ 逆向笔记):
 *   - 客户端期望 GET 返回 .entries 数组, 元素含 nickname/v0/stopTime/score
 *   - POST 成功响应需含 score/best/rank 供结果面板展示
 *   - 错误统一 { error: string } (客户端读取 body.error)
 *   - score 由服务端计算: round(v0² / stopTime) — 客户端上报值不可信
 */

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Max-Age': '86400',
};

const JSON_HEADERS = { 'content-type': 'application/json; charset=utf-8', ...CORS };

// 与游戏物理一致的合法区间 (reverse: Pd = {car:{maxSpeedKmh:260}, brake:{minSpeedKmh:100}})
const PHYS = {
  minV0: 100,        // 低于 100 km/h 无法进入刹车阶段
  maxV0: 260.1,      // 车辆极速 260 km/h (+ 浮点余量)
  minStopTime: 0.1,  // 理论最短刹停时间 (v0=100 全力也要 >3s, 但留余量)
  maxStopTime: 3600, // 1 小时封顶
  maxNicknameLen: 12, // 客户端 maxlength=12
};
const LIMIT_MAX = 100;
const RATE_LIMIT_SECONDS = 30; // 每 IP 每 30s 一次提交
const KEEP_TOP = 500;          // 只保留前 500 名, 防止无限膨胀

export default {
  async fetch(request, env) {
    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    if (url.pathname === '/api/health') {
      return json({ ok: true });
    }
    if (url.pathname !== '/api/leaderboard' && url.pathname !== '/api/score') {
      return json({ error: 'not found' }, 404);
    }

    try {
      if (url.pathname === '/api/leaderboard') {
        if (request.method !== 'GET') return json({ error: 'method not allowed' }, 405);
        return handleLeaderboard(url, env);
      }
      if (request.method !== 'POST') return json({ error: 'method not allowed' }, 405);
      return handleScore(request, env);
    } catch (e) {
      return json({ error: 'internal error' }, 500);
    }
  },
};

function json(body, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: JSON_HEADERS });
}

async function handleLeaderboard(url, env) {
  let limit = parseInt(url.searchParams.get('limit') ?? '50', 10);
  if (!Number.isFinite(limit) || limit <= 0) limit = 50;
  limit = Math.min(limit, LIMIT_MAX);

  const { results } = await env.DB.prepare(
    'SELECT nickname, v0, stop_time AS stopTime, score FROM entries ORDER BY score DESC, stop_time ASC, created_at ASC LIMIT ?'
  ).bind(limit).all();

  return json({ entries: results ?? [] });
}

async function handleScore(request, env) {
  // ---- 解析与校验 ----
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'invalid JSON body' }, 400);
  }

  const nickname = typeof body.nickname === 'string' ? body.nickname.trim() : '';
  const v0 = Number(body.v0);
  const stopTime = Number(body.stopTime);

  if (!nickname) return json({ error: '请输入昵称' }, 400);
  if (nickname.length > PHYS.maxNicknameLen) return json({ error: '昵称过长' }, 400);
  if (!/^[^\u0000-\u001f\u007f]*$/.test(nickname)) return json({ error: '昵称含非法字符' }, 400);

  if (!Number.isFinite(v0) || !Number.isFinite(stopTime)) return json({ error: '成绩数据无效' }, 400);
  if (v0 < PHYS.minV0 || v0 > PHYS.maxV0) return json({ error: '初速度超出物理极限' }, 400);
  if (stopTime < PHYS.minStopTime || stopTime > PHYS.maxStopTime) return json({ error: '刹停用时无效' }, 400);

  // ---- 服务端计分 (客户端值仅作参考) ----
  const score = Math.round((v0 * v0) / stopTime);

  // ---- 简单限速: 每 IP 30 秒一次 ----
  const ipHash = await hashIp(request);
  const { results: recent } = await env.DB.prepare(
    'SELECT created_at FROM entries WHERE created_ip = ? AND created_at > datetime(\'now\', \'-30 seconds\') LIMIT 1'
  ).bind(ipHash).all();
  if (recent && recent.length > 0) {
    return json({ error: '提交太频繁，请稍后再试' }, 429);
  }

  // ---- 写入 ----
  await env.DB.prepare(
    'INSERT INTO entries (nickname, v0, stop_time, score, created_ip) VALUES (?, ?, ?, ?, ?)'
  ).bind(nickname, v0, stopTime, score, ipHash).run();

  // ---- 名次 / 该玩家最佳 ----
  const rankRow = await env.DB.prepare(
    'SELECT COUNT(*) + 1 AS rank FROM entries WHERE score > ? OR (score = ? AND stop_time < ?)'
  ).bind(score, score, stopTime).first();

  const bestRow = await env.DB.prepare(
    'SELECT MAX(score) AS best FROM entries WHERE nickname = ?'
  ).bind(nickname).first();

  // ---- 异步瘦身: 保留前 500 名 (不阻塞响应) ----
  env.DB.prepare(
    'DELETE FROM entries WHERE id NOT IN (SELECT id FROM entries ORDER BY score DESC, stop_time ASC, created_at ASC LIMIT ?)'
  ).bind(KEEP_TOP).run().catch(() => {});

  return json({
    rank: rankRow?.rank ?? 1,
    score,
    best: bestRow?.best ?? score,
  });
}

/** IP 不明文存储: 存 SHA-256 前 16 hex (限速够用, 不可逆推) */
async function hashIp(request) {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'unknown';
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('breakv800:' + ip));
  return [...new Uint8Array(digest)].slice(0, 8).map(b => b.toString(16).padStart(2, '0')).join('');
}
