/**
 * BreakV800 worker 本地测试 — 用 miniflare/workerd 本地模式跑真实 worker 代码。
 * 运行: npm test (先 wrangler dev 起本地服务由脚本自行管理)
 *
 * 这里用更简单可靠的方式: 直接单元测试 worker.js 的 fetch handler,
 * 用内存 D1 模拟 (miniflare D1) — 通过 wrangler dev 的 HTTP 端点做黑盒测试。
 * 前置: node test/worker.test.mjs 假定 `wrangler dev --port 8787` 已可用,
 * 脚本会自己启动/停止它。
 */
import { spawn } from 'node:child_process';
import { setTimeout as sleep } from 'node:timers/promises';

const PORT = 8787;
const BASE = `http://127.0.0.1:${PORT}`;
let passed = 0, failed = 0;

function check(name, cond, extra = '') {
  if (cond) { passed++; console.log(`  ✓ ${name}`); }
  else { failed++; console.log(`  ✗ ${name} ${extra}`); }
}

async function api(path, opts) {
  const r = await fetch(BASE + path, opts);
  let body = null;
  try { body = await r.json(); } catch {}
  return { status: r.status, body, headers: r.headers };
}

const post = (data, ip = '203.0.113.1') => api('/api/score', {
  method: 'POST',
  headers: { 'content-type': 'application/json', 'CF-Connecting-IP': ip },
  body: JSON.stringify(data),
});

// ---- 启动 wrangler dev (先应用本地迁移) ----
import { execFileSync } from 'node:child_process';
const STATE = '.test-state';
try {
  execFileSync('npx', ['wrangler', 'd1', 'migrations', 'apply', 'breakv800', '--local', '--persist-to', STATE], { cwd: process.cwd(), stdio: 'pipe', shell: true });
  console.log('迁移已应用');
} catch (e) {
  console.error('迁移失败:', e.stderr?.toString() || e.message);
}

console.log('启动 wrangler dev (本地 D1)...');
const dev = spawn('npx', ['wrangler', 'dev', '--port', String(PORT), '--local', '--persist-to', STATE], {
  cwd: process.cwd(), stdio: ['ignore', 'pipe', 'pipe'], shell: true,
});
dev.stdout.on('data', d => process.env.VERBOSE && process.stdout.write(d));
dev.stderr.on('data', d => process.env.VERBOSE && process.stderr.write(d));

try {
  // 等就绪
  let up = false;
  for (let i = 0; i < 60; i++) {
    await sleep(1000);
    try { const r = await fetch(BASE + '/api/health', { signal: AbortSignal.timeout(2000) }); if (r.ok) { up = true; break; } } catch {}
    if (dev.exitCode !== null) break;
  }
  if (!up) throw new Error('wrangler dev 未就绪 (exit=' + dev.exitCode + ')');
  console.log('worker 已就绪\n');

  // ============ 测试矩阵 ============
  console.log('1. 基础');
  {
    const h = await api('/api/health');
    check('health 200 ok', h.status === 200 && h.body.ok === true);
    const cors = h.headers.get('access-control-allow-origin');
    check('CORS 头存在', cors === '*');
    const pre = await api('/api/score', { method: 'OPTIONS' });
    check('OPTIONS 预检 204', pre.status === 204);
    const nf = await api('/api/nope');
    check('未知路径 404 {error}', nf.status === 404 && !!nf.body.error);
  }

  console.log('2. 空排行榜');
  {
    const lb = await api('/api/leaderboard?limit=10');
    check('GET 空榜 200 entries=[]', lb.status === 200 && JSON.stringify(lb.body) === '{"entries":[]}');
  }

  console.log('3. POST /api/score 校验');
  {
    const bad1 = await post({ nickname: '', v0: 200, stopTime: 10 });
    check('空昵称 400', bad1.status === 400 && /昵称/.test(bad1.body.error));
    const bad2 = await post({ nickname: 'x'.repeat(13), v0: 200, stopTime: 10 });
    check('超长昵称 400', bad2.status === 400);
    const bad3 = await post({ nickname: '测试', v0: 99, stopTime: 10 });
    check('v0<100 400 (物理不可能)', bad3.status === 400);
    const bad4 = await post({ nickname: '测试', v0: 300, stopTime: 10 });
    check('v0>260 400 (超极速)', bad4.status === 400);
    const bad5 = await post({ nickname: '测试', v0: 200, stopTime: 0 });
    check('stopTime 0 400', bad5.status === 400);
    const bad6 = await api('/api/score', { method: 'POST', headers: { 'content-type': 'application/json' }, body: 'not json' });
    check('非法 JSON 400', bad6.status === 400);
    const bad7 = await api('/api/leaderboard', { method: 'POST' });
    check('leaderboard POST 405', bad7.status === 405);
  }

  console.log('4. 正常提交 + 计分');
  let firstRank;
  {
    const r = await post({ nickname: '甲', v0: 230, stopTime: 20.55 }, '198.51.100.1');
    check('提交成功 200', r.status === 200, JSON.stringify(r.body));
    check('服务端计分 = round(v0²/t)', r.body.score === Math.round(230 * 230 / 20.55), `score=${r.body?.score}`);
    check('rank=1 (首次)', r.body.rank === 1);
    check('best=score (首次)', r.body.best === r.body.score);
    firstRank = r.body;
  }

  console.log('5. 排序');
  {
    // 更高分
    const r2 = await post({ nickname: '乙', v0: 230, stopTime: 18 }, '198.51.100.2'); // 2941
    check('乙 rank=1', r2.body.rank === 1, JSON.stringify(r2.body));
    // 同分更短用时优先
    const r3 = await post({ nickname: '丙', v0: 230, stopTime: 18 }, '198.51.100.3'); // 同 2941
    check('同分并列 rank 合理', r3.body.rank >= 1 && r3.body.rank <= 2, `rank=${r3.body?.rank}`);
    // 客户端伪造低报: 上报 v0=100 但 stopTime 巨小 → 服务端重算
    const r4 = await post({ nickname: '丁', v0: 260, stopTime: 0.1 }, '198.51.100.4');
    check('极限值接受并重算 (260²/0.1)', r4.status === 200 && r4.body.score === 676000, JSON.stringify(r4.body));

    const lb = await api('/api/leaderboard?limit=50');
    const es = lb.body.entries;
    check('榜上 4 条', es.length === 4, `len=${es.length}`);
    check('按 score 降序', es[0].score >= es[1].score && es[1].score >= es[2].score);
    check('字段名匹配客户端契约', es[0].hasOwnProperty('nickname') && es[0].hasOwnProperty('v0') && es[0].hasOwnProperty('stopTime') && es[0].hasOwnProperty('score'));
    check('丁(伪造高分)排第一', es[0].nickname === '丁');
  }

  console.log('6. 限速 (同 IP 30s)');
  {
    const r = await post({ nickname: '戊', v0: 200, stopTime: 15 }, '198.51.100.1');
    check('紧接提交 429', r.status === 429 && /频繁/.test(r.body.error), JSON.stringify(r.body));
  }

  console.log('7. limit 参数');
  {
    const lb1 = await api('/api/leaderboard');
    check('默认 limit=50', Array.isArray(lb1.body.entries));
    const lb2 = await api('/api/leaderboard?limit=99999');
    check('limit 封顶 100 不报错', lb2.status === 200);
    const lb3 = await api('/api/leaderboard?limit=abc');
    check('limit 非法回退默认', lb3.status === 200);
  }

} finally {
  dev.kill('SIGTERM');
  await sleep(1500);
}

console.log(`\n结果: ${passed} 通过, ${failed} 失败`);
process.exit(failed ? 1 : 0);
