# 来源摘录：Semiconductor Engineering——HBM 堆叠的挑战（24 层路线）

- 抓取日期：2026-09-25（全文抓取，URL 返回 200）
- 标题：Challenges In Stacking HBM
- 作者：Ed Sperling（Semiconductor Engineering），受访者 Damon Tsai（Onto Innovation 检查产品线产品营销负责人）
- 发布：2025-09-03
- URL：https://semiengineering.com/challenges-in-stacking-hbm/
- 用途：`/notes/hbm/interconnect-density/`、`/notes/hbm/materials-map-3d/` 的层数路线与翘曲论断证据层

## 原文摘录

1. 层数路线（8→16→24）与凸点 pitch：
   > "AI data centers are pushing for higher density in high-bandwidth memory. Today, the maximum number of layers that can be stacked is 8, but that increases to as many as 24 layers by 2030. The big challenge will be in the interconnects, and making sure the microbumps align. At 16 layers, the bump pitch will be less than 10 microns, and the dies will be thinner."

2. 视频访谈主题：
   > "Damon Tsai, head of product marketing for inspection products at Onto Innovation, talks about how to reduce stress that can cause warpage, how HBM architectures will need to change, and what happens when hybrid bonding and co-packaged optics are added into these devices."

## 口径标注

- 本文为视频访谈页，正文文字极简；"8 层→2030 年 24 层""16 层凸点 pitch <10 μm"为访谈中的业界路线口径（B级）。注意与 2026-09 时点事实核对：12 层 HBM3E/HBM4 已量产（SK 海力士 2024-09-26 官方口径），本文"今日最高 8 层"为 2025-09 发布时的表述滞后，引用层数现状时以厂商官方新闻稿为准。
- "16 层 bump pitch <10 μm"与 SK 海力士 Hot Chips 2026 口径（HB 可达 <18 μm、MR-MUF 无法管理 <18 μm）方向一致：层数越高、pitch 越细、最终滑向混合键合。

## 可引用论断

- 凸点对准与翘曲是堆叠层数竞赛的核心良率约束（B级，Onto 具名）
- 混合键合与共封装光学（CPO）将进一步改变 HBM 架构（B级，方向性口径）
