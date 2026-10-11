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
- 无任何外部素材：所有贴图、音效均为**程序化生成**（含车牌 `沪A·D1612F`）
- 原版含服务端排行榜（`/api/leaderboard`、`/api/score`），随原站下线已不可用——客户端对 API 失败有容错，游戏本体完全离线可玩。排行榜面板会显示“请求失败”，属正常现象

## 仓库内容

```
index.html            原始页面（仅移除了 Cloudflare 统计 beacon，游戏代码零修改）
assets/               原始打包产物（未修改）
  index-BMfj2Faj.js   three.js + cannon-es + 游戏逻辑（746KB）
  index-D0EtOSyi.css  样式
reverse/              逆向（美化）源码，供阅读学习
  reverse-game-logic.beautified.js   游戏逻辑部分（物理/状态机/UI/音效/场景，约 6100 行）
  reverse-full.beautified.js         完整 bundle 美化版
```

游戏物理速览（详见 `reverse/reverse-game-logic.beautified.js` 中的 `Pd` 配置）：

```
最高车速 260 km/h | 加速度 7.4 m/s² | 路障距离 2600 m
踏板力爬升 = 200 + 800·t N/s | 释放 900 N/s | 断裂极限 1612 N
得分 = round(v0² / 刹停用时)
```

## 来源与致谢

- 原作者：游戏随 [breakbreak.app](https://breakbreak.app) 发布，站内公告称“刹车大师原作者版已在《抖音小游戏：并非不可抗力》回归”。本仓库仅为抢救性存档，版权归原作者所有；如有异议请联系删除。
- 归档于 2026-10，抓取自原站部署（brake.tp0k.us 镜像），并与 [Wayback Machine 快照](https://web.archive.org/web/20261010141449/https://brake.tp0k.us/) 逐字节校验一致。

## 免责声明

本项目是已下线网页游戏的非官方存档，仅用于保存与学习。不隶属于原作者或任何公司；游戏内容与品牌归其各自所有者。若原作回归且作者希望收回，本仓库将配合处理。
