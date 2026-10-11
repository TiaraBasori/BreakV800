# BreakV800 Leaderboard Worker

原版 breakbreak.app 排行榜 API 的 Cloudflare Workers + D1 重实现。客户端（GitHub Pages 上的游戏）通过绝对 URL 调用它。

## 端点

| 方法 | 路径 | 请求 | 响应 |
|------|------|------|------|
| GET | `/api/leaderboard?limit=50` | — | `{ entries: [{ nickname, v0, stopTime, score }] }`（score 降序） |
| POST | `/api/score` | `{ nickname, v0, stopTime }` | `{ rank, score, best }` 或 `{ error }` |
| GET | `/api/health` | — | `{ ok: true }` |

错误统一返回 `{ error: string }`——与原客户端读取 `body.error` 的契约一致。

## 契约来源（逆向）

`../reverse/reverse-game-logic.beautified.js`：

- `Gg(limit)` → `fetch('/api/leaderboard?limit=' + e).entries`，每项渲染 `nickname` / `v0.toFixed(1)` / `stopTime.toFixed(2)` / `score`
- `Kg(nickname, v0Kmh, stopSeconds)` → `POST /api/score`，成功需含 `score` / `best` / `rank`（`score >= best` 时文案为“已上榜！当前排名第 N 名”）

## 安全设计

- **服务端计分**：`score = round(v0² / stopTime)`。客户端上报的 v0/stopTime 只做区间校验，分数一律重算，改不了结果
- **物理校验**：`100 ≤ v0 ≤ 260.1`（低于 100 进不了刹车阶段，高于 260 超出极速）；`0.1 ≤ stopTime ≤ 3600`
- **限速**：每 IP（SHA-256 前 16 hex 存储，明文不入库）30 秒 1 次提交
- **自动瘦身**：仅保留前 500 名，防 D1 无限膨胀
- **CORS**：`*`（纯前端调用），OPTIONS 预检 204

## 部署

```bash
npm install
npx wrangler login
npx wrangler d1 create breakv800
# 把输出的 database_id 填进 wrangler.jsonc（替换 REPLACE_ON_DEPLOY）
npx wrangler d1 migrations apply breakv800 --remote
npx wrangler deploy
```

默认部署为 `https://breakv800-api.<你的子域>.workers.dev`。若换名字/域名，记得全局替换 `../assets/index-BMfj2Faj.js` 中的 API 地址（搜 `workers.dev/api`）。

## 本地开发与测试

```bash
npm test          # 27 项断言：CORS/校验/计分/排序/限速/limit 参数（自带本地 D1 迁移与 wrangler dev 生命周期）
npm run dev       # 手动起本地 dev server (:8787)
```

## 数据

单表 `entries`（见 `migrations/0001_init.sql`）：`nickname, v0, stop_time, score, created_ip(哈希), created_at`。需要清空排行榜时：

```bash
npx wrangler d1 execute breakv800 --remote --command 'DELETE FROM entries'
```
