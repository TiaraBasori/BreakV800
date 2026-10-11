# BreakV800 — 极限刹车挑战

> 原自 **breakbreak.app**（《极限刹车挑战 / 刹车大师》）。原站已下线（现为抖音小游戏回归公告页），此仓库是玩家保存的完整客户端代码存档，供大家继续游玩。

**🎮 在线游玩**: https://tiarabasori.github.io/BreakV800/

## 玩法

- 车辆自动全力加速，**100 km/h 后**才能踩刹车
- 一踩刹车动力立即切断，**按得越久力度越大**
- 踏板力达到 **1612 N** 时刹车踏板断裂，整车翻滚失败
- 得分 = **刹车初速度² ÷ 刹停用时**，越高越好
- 别把刹车踏板踩断（点刹是王道）

手机：按住屏幕任意位置或右下角按钮；电脑：按住空格 / 鼠标左键。

## 技术说明

- Vite + esbuild 打包，单 JS bundle（746 KB），内含 **three.js r186** + **cannon-es** 物理引擎 + 全部游戏代码
- 无任何外部素材：所有贴图、音效均为**程序化生成**
- 原版排行榜服务端随原站下线失效，本仓库附带了一个 **Cloudflare Workers 重实现**（见下），排行榜功能已恢复；Worker 不可用时游戏本体完全离线可玩，排行榜面板显示“请求失败”，属正常现象

## 仓库内容

```
index.html            原始页面（移除了统计 beacon；资源路径改为相对路径以适配 GitHub Pages）
assets/               原始打包产物
  index-BMfj2Faj.js   three.js + cannon-es + 游戏逻辑（746KB；仅把 2 处 API 地址指向自建 Worker）
  index-D0EtOSyi.css  样式（未修改）
reverse/              逆向（美化）源码，供阅读学习
  reverse-game-logic.beautified.js   游戏逻辑部分（物理/状态机/UI/音效/场景，约 6100 行）
  reverse-full.beautified.js         完整 bundle 美化版
worker/               Cloudflare Workers 排行榜 API（D1 存储），详见 worker/README.md
```

游戏物理速览（详见 `reverse/reverse-game-logic.beautified.js` 中的 `Pd` 配置）：

```
最高车速 260 km/h | 加速度 7.4 m/s² | 路障距离 2600 m
踏板力爬升 = 200 + 800·t N/s | 释放 900 N/s | 断裂极限 1612 N
得分 = round(v0² / 刹停用时)
```

## 排行榜 API（Cloudflare Workers + D1）

`worker/` 是原版 `/api/leaderboard` 与 `/api/score` 的重实现，供 GitHub Pages 版本使用：

- **GET** `/api/leaderboard?limit=50` → `{ entries: [{ nickname, v0, stopTime, score }] }`
- **POST** `/api/score` `{ nickname, v0, stopTime }` → `{ rank, score, best }`

安全设计：**得分由服务端重算**（round(v0²/stopTime)，客户端上报值仅作参考）、物理区间校验（100 ≤ v0 ≤ 260）、每 IP 30 秒限速（IP 以 SHA-256 摘要存储）、榜内只保留前 500 名。

### 部署自己的实例

```bash
cd worker
npm install
npx wrangler login
npx wrangler d1 create breakv800          # 输出 database_id，填入 wrangler.jsonc
npx wrangler d1 migrations apply breakv800 --remote
npx wrangler deploy                       # 得到 https://<name>.<account>.workers.dev
```

客户端 API 地址写死在 `assets/index-BMfj2Faj.js` 中（搜 `workers.dev/api`），换 Worker 域名时全局替换即可。本地测试：`npm test`（27 项断言，含计分/校验/排序/限速矩阵）。

## 来源

- 游戏原作者：游戏随 breakbreak.app 发布，站内公告称“刹车大师原作者版已在《抖音小游戏：并非不可抗力》回归”
- 本仓库为抢救性存档，版权归原作者所有；如有异议请联系删除
- 归档于 2026-10，抓取自原站部署（brake.tp0k.us 镜像），并与 [Wayback Machine 快照](https://web.archive.org/web/20261010141449/https://brake.tp0k.us/) 逐字节校验一致
