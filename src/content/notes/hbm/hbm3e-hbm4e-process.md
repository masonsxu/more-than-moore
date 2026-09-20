---
title: 'HBM3E 与 HBM4E 工艺调研'
description: 'DRAM 裸片制程、base die 从存储工艺转向逻辑工艺、TSV / MR-MUF / TC-NCF / Hybrid Bonding 堆叠封装、电气规格与量产时间线；全部数值经 2026-09-19 逐条网络核对。'
date: 2026-09-18
tags: ['HBM', 'HBM3E', 'HBM4E', 'TSV', '混合键合', '封装工艺']
---

# HBM3E 与 HBM4E 工艺调研笔记

- 调研日期：2026-09-18
- 核对日期：2026-09-19（逐条网络核对后修正，修正留痕见《数据核对与落地评估报告》(/notes/hbm/hbm-fact-check-log/)）
- 调研方式：公开网络来源（厂商新闻稿、行业媒体、EDA 厂商技术指南、JEDEC 标准动态），原始摘录见 [`public/sources/hbm3e-hbm4e/`](/sources/hbm3e-hbm4e/) 目录
- 适用范围：DRAM 核心裸片制程节点、base die（基础裸片）逻辑制程、堆叠与封装工艺（TSV / MR-MUF / TC-NCF / Hybrid Bonding）、电气规格、量产时间线

---

## 1. 结论摘要

| 维度 | HBM3E（第 5 代） | HBM4（第 6 代，参照） | HBM4E（第 7 代） |
|---|---|---|---|
| JEDEC 标准 | JESD238 系列（Siemens 引用 JESD238B01；JEDEC 速率上限 9.6 Gbps） | JESD270-4（2025-04 发布；2025-12 追加 JESD270-4A） | 基于 JESD270-4 扩展，规范仍在演进 |
| 接口宽度 | 1024-bit，16 独立通道 / 32 伪通道 | 2048-bit，32 通道 / 64 伪通道 | 2048-bit（与 HBM4 相同，I/O 数不变） |
| 引脚速率 | 量产典型 9.2–9.8 Gbps；JEDEC 上限 9.6 Gbps，厂商在研 10 Gbps（原"最高 12.4 Gbps"仅出自 Siemens 博客表格、无 JEDEC/厂商背书，已删除） | 6.4–12.8 Gbps（厂商口径；JEDEC 基准 8 Gbps，三星演示 13 Gbps） | 14 Gbps 稳定 / 最高 16 Gbps（三星、SK 海力士口径一致） |
| 单堆栈带宽 | >1.2 TB/s（9.6 Gbps 时 1.23 TB/s；在研 10 Gbps 时 1.28 TB/s。原"1.33 TB/s"对应约 10.4 Gbps、与 12.4 Gbps 口径互斥，已修正） | >2.0 TB/s（JEDEC 8 Gbps 基准；3.3 TB/s 为三星官方进阶配置） | 3.6 TB/s（三星官方）/ 约 4.0 TB/s（三星 GTC 2026 演示；SK 海力士按 16 Gbps 换算 ≈4.1 TB/s，官方稿未直接给数） |
| 单堆栈容量 | 24GB（8 层）– 36GB（12 层）；SK 海力士已开发 48GB（16 层） | 36GB（12 层）；标准支持 16 层 64GB | 48GB（12 层，32Gb 裸片）；路线图含 32GB（8 层）、64GB（16 层） |
| DRAM 核心裸片节点 | 1b（第 5 代 10nm 级），24Gb 裸片 | SK 海力士用 1b；三星用 1c | 1c（第 6 代 10nm 级），32Gb（4GB）裸片；单裸片 24Gb→32Gb、单堆 36→48GB 均为 +33%（媒体口径"密度 +50%"未获官方证实，引用需谨慎） |
| base die 工艺 | DRAM 工艺（同代节点） | 逻辑工艺起步：TSMC 12FFC+/N5（SK 海力士）；三星自研 4nm | SK 海力士：TSMC 3nm 级（业界信息，未官方确认）；三星：自研 4nm；美光：TSMC（标准 + 定制逻辑裸片） |
| 核心电压 | 1.1 V | VDD 1.0 / 1.05 V 双档（JESD270-4） | 1.05 V 量级（沿用 HBM4 框架，HBM4E 官方电压口径未发布） |
| 封装工艺 | 先进 MR-MUF（SK 海力士）/ advanced TC-NCF（三星） | 先进 MR-MUF / TC-NCF 延续 | 先进 MR-MUF（SK 海力士，热阻较 HBM4 改善约 17%）；Hybrid Bonding 为 16 层以上备选 |
| 控制器兼容性 | 兼容 HBM3 控制器 | 物理接口不兼容（1024→2048-bit 决定板级不可互插）；协议层有兼容宣称，以控制器实现为准 | 不兼容前代，支持可定制 base die / 自定义接口 |
| 量产状态 | 三家均已量产（2024 起） | 三星 2026-02 宣布率先量产（单方口径；SK 海力士 2025-09-12 已宣布全球首个 HBM4 开发完成，2026Q2 起大规模出货）；三星口径稳定处理速度 11.7 Gbps（原文无"SiP"一词） | 三星 2026-05-29 首先送样；SK 海力士 2026-06-18 送样；两家量产目标 2027 |

一句话概括：HBM3E 的"工艺"主题是 **1b nm DRAM + 更薄裸片 + 先进 MR-MUF/TC-NCF 封装**；HBM4E 的主题是 **1c nm DRAM + 逻辑工艺 base die（3nm/4nm）+ 可定制化**，接口宽度不变，靠引脚速率（→16 Gbps）和容量密度（32Gb 裸片）提升带宽与容量。

---

## 2. HBM3E 工艺细节

### 2.1 DRAM 核心裸片制程

| 厂商 | 制程节点 | 裸片容量 | 说明 |
|---|---|---|---|
| SK 海力士 | 1b（第 5 代 10nm 级） | 24Gb（3GB） | 2024-03 全球率先供货 8 层；2024-09-26 全球率先量产 12 层 |
| 美光 | 1β（第 5 代 10nm 级） | 24Gb | 官方宣称 8/12 层 HBM3E 功耗较竞品低约 30%；12 层 2024-09 起送样 |
| 三星 | 初期 1α（第 4 代 10nm 级），后续转 1b | 24Gb | Tom's Hardware 分析：初期滞留 1α 是其 8 层认证与 12 层进度落后的原因之一 |

### 2.2 堆叠与封装

- **TSV 堆叠**：12 层 = 12×3GB 裸片垂直堆叠。SK 海力士将单颗 DRAM 裸片做薄 40%，在总厚度与 8 层产品持平的前提下容量提升 50%。
- **先进 MR-MUF**（Mass Reflow Molded Underfill，批量回流底部模制填充，SK 海力士）：芯片堆叠后以液态保护材料填充并固化。相对逐层贴膜的 TC-NCF 路线，效率与散热更优；先进 MR-MUF 增加翘曲控制（Warpage Control），12 层 HBM3E 散热性能较上代 +10%。
- **advanced TC-NCF**（Thermal Compression - Non-Conductive Film，三星）：三星 HBM3E 热阻较前代改善 11%；凸点分区设计——信号连接处用小凸点、散热路径处用大凸点。
- **供电 TSV 优化**：HBM3E 引入 all-around power TSV，TSV 数量增至约 6 倍，IR drop 降低最高 75%（Siemens 汇总数据）。
- **16 层堆叠（48GB）**：SK 海力士 2024-11-06 在 SK AI 峰会发布，沿用先进 MR-MUF，同时开发 Hybrid Bonding 作为后端工艺备选（考虑用于 16 层及以上）。对比 12 层：训练性能最高 +18%，推理性能最高 +32%，计划 2025 年商业化。ISSCC 会议论文：*A 48GB 16-High 1280GB/s HBM3E DRAM with All-Around Power TSV and a 6-Phase RDQS Scheme for TSV Area Optimization*（DOI: 10.1109/ISSCC49657.2024.10454440；注意该 DOI 归属 ISSCC 2024 卷，与 16 层产品 2024-11 才发布的时间线有出入，疑为 ISSCC 2025 论文，正式引用前需在 IEEE Xplore 复核）。
- 另有行业报道称 SK 海力士 16 层 HBM4 堆叠将继续使用 MR-MUF、暂不启用 TC-NCF（xfastest 标题信息，正文未能抓取，待验证）。

### 2.3 电气规格（Siemens 汇总）

- 带宽：典型 1180 GB/s（三星 12 层 @9.2 Gbps 口径）；JEDEC 上限 9.6 Gbps 时约 1.23 TB/s，厂商在研 10 Gbps 时约 1.28 TB/s（原"上限 1.33 TB/s"对应约 10.4 Gbps，出处不明，2026-09-19 核对后修正）
- 能效：带宽约为 HBM2E 的 2.5 倍（约 1.2 vs 0.46 TB/s；Siemens 表格写作"能效 2.5X vs HBM2E"，系分析口径，无官方 bit/J 数据）。原"三星口径能效较前代约 +12%"未能溯源，已删除
- 部署平台：NVIDIA H200（141GB）、B200（192GB）、AMD Instinct MI300X（192GB）等，均用 8 层 24GB；12 层 36GB 用于 B300（288GB）与 MI355X（288GB）；MI325X 为 256GB（8×32GB，32Gb 裸片 8 层），原"MI325X 用 36GB"有误，已修正

---

## 3. HBM4E 工艺细节

### 3.1 DRAM 核心裸片：1c nm

- HBM4E 核心变化之一：DRAM 裸片从 HBM4 的 24Gb/1b 转向 **32Gb（4GB）/1c（第 6 代 10nm 级）**。可核验口径：单裸片 24Gb→32Gb、单堆 36GB→48GB，容量均 +33%；媒体所称"密度提升约 50%"未见于 SK 海力士官方新闻稿（2026-09-19 核对），如需引用须标注为媒体口径。
- SK 海力士 HBM4E **首次**采用 1c（HBM4 用 1b）；三星 HBM4 起即用 1c，HBM4E 沿用同一"1c + 4nm base die"组合。
- 1c 产能爬坡（Chosun Biz 数据，经 IT之家 2026-09-07 转述——原笔记标注"经 TrendForce 转述"有误，已更正；占各家 DRAM 总产出比例。注意：三星 ~16%、美光 ~19% 为 2Q26 末口径，非 1Q26）：

| 时点 | SK 海力士 | 三星 | 美光 |
|---|---|---|---|
| 1Q26 | ~10% | — | — |
| 2Q26 | 13% | ~16% | ~19% |
| 3Q26E | ~24% | — | — |
| 4Q26E | 34%（超三星的 ~31%） | ~31% | — |
| 1Q27E | 35%（首次超过 1b 的 ~33%，成为主力制程） | — | — |

### 3.2 base die：从存储工艺转向逻辑工艺

- 结构性变化（TSMC 2025-11 欧洲 OIP 论坛，TSMC 与 GUC 披露）：HBM4 起 base die 改用逻辑工艺制造；HBM4E 起支持**可定制 base die**，可挂自定义接口/缓存等附加功能；定制化版本称 **C-HBM4E**，采用 3nm 级 base die，目标到 2027 年引脚速率 12.8 GT/s、性能提升 2.5×（该 2.5× 指 HBM4E 较 HBM3E 的带宽提升口径）。
- 节点演进：HBM4 base die 用 TSMC 12FFC+（12nm 级）或 N5；HBM4E 升至 3nm 级（TSMC 路线）/ 4nm（三星自研路线）。
- 三家分工：

| 厂商 | HBM4 base die | HBM4E base die |
|---|---|---|
| SK 海力士 | TSMC（12nm 级，12FFC+/N5 口径并存） | TSMC 3nm 级（业界普遍理解，公司未官方确认）；另有报道其评估 Intel 以分散 TSMC 成本压力（TrendForce 2026-08-31，未证实） |
| 三星 | Samsung Foundry 自研 | Samsung Foundry 4nm 级（官方确认） |
| 美光 | 未正式确认（业界预期 TSMC） | TSMC 代工标准与定制逻辑裸片，2027 年量产（美光 FY Q4 财报会确认） |

- base die 的作用：堆栈底部的逻辑芯片，承担各 DRAM 层的读写控制与纠错，决定整包速率、能效与信号质量。节点越先进，控制器越快、越凉。

### 3.3 封装

- SK 海力士：12 层 HBM4E 继续用**先进 MR-MUF**，工艺优化使热阻较 HBM4 改善约 17%；Hybrid Bonding（无凸点直接键合）持续开发中，定位 16 层及以上堆叠的候选方案。
- 三星：沿用 HBM4 量产验证过的封装结构并优化，能效 +16%、热阻特性改善 >14%（官方新闻稿口径）。
- 共同点：堆栈仍为 TSV + 微凸点；引脚间距、晶圆减薄、凸点/键合精度是良率关键；2.5D 集成依赖硅 interposer（CoWoS 类）或 bridge（EMIB 类）。

### 3.4 电气规格

- 三星（2026-05-29 新闻稿）：引脚速率 14 Gbps 稳定、可扩展至 16 Gbps（较 HBM4 +20% 以上）；单堆栈带宽最高 3.6 TB/s；12 层 48GB（容量较上代 +30% 以上）；后续扩 32GB（8 层）/64GB（16 层）。16 Gbps / 4.0 TB/s 口径的可溯源出处为 NVIDIA GTC 2026 演示（2026-03，StorageNewsletter 转载）；原笔记标注"2026-04-30 财报会口径"未能直接核实，已更正出处。
- SK 海力士（2026-06-18 送样，官方新闻稿 + TechTimes 汇总）：I/O 引脚数不变（2048）；引脚速率最高 16 Gbps（官方口径；较此前约 11–13 Gbps 提升约 45% 为媒体换算）；单堆栈带宽约 4 TB/s（按 16 Gbps×2048-bit 换算 ≈4.1 TB/s，官方稿未直接给数）；能效提升 >20%（官方口径）；12 层 48GB（HBM4 12 层为 36GB）。"1c 首用"出自韩媒/IT之家转述，官方稿未写明。

### 3.5 时间线与竞争格局（截至 2026-09）

| 时点 | 事件 |
|---|---|
| 2025-04 | JEDEC 发布 HBM4 标准 JESD270-4 |
| 2025-11 | TSMC 欧洲 OIP：TSMC/GUC 披露 HBM4/HBM4E/C-HBM4E 3nm base die 路线 |
| 2026-02 | 三星宣布 HBM4 量产（自称"业界第一"；稳定处理速度 11.7 Gbps，原文无"SiP"一词。注意：SK 海力士 2025-09-12 已宣布全球首个 HBM4 开发完成、2026Q2 起大规模出货，"首发"为各家单方宣传口径，引用需加注） |
| 2026-03 | 三星在 NVIDIA GTC 2026 演示 HBM4E（16 Gbps / 4.0 TB/s 口径的可溯源出处） |
| 2026-04-30 | 三星 Q1 财报会公布 HBM4E 规格（该口径未能直接核实，以 GTC 2026 口径为准），Q2 送样 |
| 2026-05-29 | 三星全球率先送样 12 层 HBM4E |
| 2026-06 上旬 | SK 海力士于 Computex 2026 预览 HBM4E |
| 2026-06-18 | SK 海力士送样 12 层 HBM4E（"提前"为媒体表述，官方稿称原计划 2026 H2 内），量产目标 2027 |
| 2026-09-23（2025 财年 Q4 财报会口径） | 美光确认 HBM4E base die 交由 TSMC，2027 年量产 |
| 2027 | HBM4E 规模量产之年；SK 海力士龙仁一期洁净室 2027 年初投用（官方口径 early 2027，韩媒报道提前至 2027-02；注意 M15X 厂在清州，与龙仁是两个项目） |

- 市场份额：原引"Counterpoint 1Q26：SK 58% / 三星 ~21% / 美光 ~21%"在公开渠道未能溯源（2026-09-19 核对），已弃用；可核参照点为 Counterpoint 口径 2Q25 SK 海力士 HBM 份额 62%（199IT 转述）。
- 需求侧：SK 集团会长在 Computex 2026 表示当前明确要求 HBM4E 的客户只有 Nvidia（媒体转述口径）；NVIDIA Rubin Ultra 规格仍在变动中——GTC 2025 曾报单 GPU 384GB（8×48GB），GTC 2026（2026-03）实机演示为单封装 1TB HBM4E，后续又有降配/改设计传闻，引用必须标注时点；AMD 下一代 Instinct MI500 预计搭载 HBM4E（2027 年，CDNA6，Tom's Hardware 2026-01）。
- 竞争焦点：送样先后不决定胜负，客户认证（qualification）通过速度与产能爬坡准时性才是决定量价的关键变量（DigitalToday 分析）。

### 3.6 后续路线（HBM5 / 1d）

- 1d（第 7 代 10nm 级）竞赛：三星计划 2026-09 完成开发、12 月启动量产准备、2027 年底前后小规模量产；SK 海力士计划 2026-12 完成开发、2027-06 启动量产准备（较三星晚约 6 个月）（The Bell 报道，经 TrendForce 转述）。
- 三星规划 HBM5（约 2028–2029）采用 2nm 级 base die，HBM5E（约 2030）采用 1d DRAM（TrendForce 2026-03-18 报道；该组数字与时间表在公开渠道未能二次溯源，已降级为单一信源传闻。可核口径：三星 Hot Chips 2026 给出 cHBM/aHBM/zHBM 三阶段路线图，zHBM（HBM5 级）性能约为 HBM4E 的两倍、指向 4 TB/s，未给时间表）。
- 层数：HBM4E 阶段 16 层为确定性路线，20 层为传闻，未获厂商确认。

---

## 4. 关键工艺对照（HBM3E → HBM4E 变更点）

| 工艺要素 | HBM3E | HBM4E | 变更幅度 |
|---|---|---|---|
| DRAM 裸片制程 | 1b（第 5 代 10nm 级） | 1c（第 6 代 10nm 级） | 单裸片 24Gb → 32Gb（+33%）；单堆 36GB → 48GB（+33%） |
| 裸片厚度/堆叠 | 12 层，单裸片较上代薄 40% | 12 层（16 层在路线图） | 更薄裸片 + 更高密度堆叠延续 |
| 堆叠键合 | 先进 MR-MUF（SK 海力士）/ advanced TC-NCF（三星） | 先进 MR-MUF 延续（热阻 −17%）；Hybrid Bonding 为 16 层+ 备选 | 渐进优化，未全面切换键合方式 |
| base die | 存储工艺（与 DRAM 同代） | 逻辑工艺：TSMC 3nm 级 / 三星 4nm | 存储工艺 → 先进逻辑工艺，代际跨越 |
| 接口 | 1024-bit | 2048-bit（I/O 数与 HBM4 持平） | HBM4 已翻倍，HBM4E 靠速率提升 |
| 引脚速率 | 9.2–9.8 Gbps（JEDEC 上限 9.6） | 14–16 Gbps | 最高约 +45%（相对 11–13 Gbps 的 HBM4 实装水平） |
| 单堆栈带宽 | 1.2–1.28 TB/s（量产/在研口径） | 3.6–4.0 TB/s | 约 3×（对比 HBM3E 上限） |
| 电压 | 1.1 V | 1.05 V 量级 | −约 4.5% |
| 定制化 | 无 | 可定制 base die + 自定义接口（C-HBM4E） | 从标准品走向可定制 |

---

## 5. 设计/制造难点（Siemens 3D IC 指南归纳）

1. 信号完整性：1024→2048 bit 使 I/O 密度翻倍，抖动预算收紧、串扰与反射敏感性上升；PDN、时钟分配、阻抗不连续控制须在 base die–interposer–封装三个层级协同。
2. 热管理：垂直堆叠形成复杂纵向热梯度；层数与 I/O 密度增加使热阻上升、热密度提高，热分析必须前置于布局冻结。
3. TSV 与物理实现：TSV 引入机械应力与版图约束；晶圆减薄、高深宽比刻蚀、铜填充精度要求随层数增加而叠加。
4. 键合良率：微凸点与 Hybrid Bonding 的对准容差随堆叠高度收紧，是良率关键控制点。
5. 2.5D 集成：HBM 接口走线密度超出 PCB 能力，依赖硅 interposer（CoWoS）或 bridge（EMIB）方案。

---

## 6. 来源清单

原始全文摘录归档于 [`public/sources/hbm3e-hbm4e/`](/sources/hbm3e-hbm4e/) 子目录（文件名 = 日期 + 主题）。

| # | 来源 | 日期 | URL |
|---|---|---|---|
| 1 | Samsung Newsroom：全球首发 HBM4E 样品出货 | 2026-05-29 | https://news.samsungsemiconductor.com/global/samsung-electronics-begins-shipment-of-industry-first-hbm4e-samples/ |
| 2 | SK hynix Newsroom（中文）：全球率先量产 12 层 HBM3E | 2024-09-26 | https://news.skhynix.com/cn/sk-hynix-begins-volume-production-of-the-world-first-12-layer-hbm3e/ |
| 3 | SK hynix Newsroom（中文）：16 层 HBM3E 开发发布（SK AI 峰会） | 2024-11-06 | https://news.skhynix.com/cn/sk-hynix-announces-16-layer-hbm3e-at-sk-ai-summit-2024/ |
| 4 | TechTimes：SK 海力士 12 层 HBM4E 提前送样（含 HBM4E 规格细节与 FAQ） | 2026-06-19 | https://www.techtimes.com/articles/318633/20260619/sk-hynix-ships-12-layer-hbm4e-samples-ahead-schedule-tightening-race-samsung.htm |
| 5 | TrendForce：SK 海力士 1c DRAM 产能占比与 HBM4E 准备（原引 TrendForce 转述；2026-09-19 核对后以 ChosunBiz 经 IT之家转述为准，见来源 24） | 2026-09-07 | https://www.trendforce.com/news/2026/09/07/news-sk-hynix-1c-dram-reportedly-to-overtake-1b-as-main-process-in-1q27-as-it-prepares-for-hbm4e/ |
| 6 | DigitalToday：三星/SK 海力士 HBM4E 量产时间线竞争 | 2026-05 | https://www.digitaltoday.co.kr/en/view/53615/memory-big-two-near-hbm4e-race-mass-production-timeline-becomes-key-battleground |
| 7 | Tom's Hardware：TSMC/GUC 披露 HBM4/HBM4E/C-HBM4E 3nm base die | 2025-11 | https://www.tomshardware.com/pc-components/dram/hbm-undergoes-major-architectural-shakeup-as-tsmc-and-guc-detail-hbm4-hbm4e-and-c-hbm4e-3nm-base-dies-to-enable-2-5x-performance-boost-with-speeds-of-up-to-12-8gt-s-by-2027 |
| 8 | Tom's Hardware：美光/三星/SK 海力士 HBM 路线图 | 2025 | https://www.tomshardware.com/tech-industry/semiconductors/hbm-roadmaps-for-micron-samsung-and-sk-hynix-to-hbm4-and-beyond |
| 9 | Tom's Hardware：美光将 HBM4E base die 交由 TSMC | 2025-09 财报会 | https://www.tomshardware.com/micron-hands-tsmc-the-keys-to-hbm4e |
| 10 | Siemens Blog：HBM3E/HBM4 IC 设计指南（规格对照表） | 2026-04-24 | https://blogs.sw.siemens.com/semiconductor-packaging/2026/04/24/hbm3e-hbm4-ic-design-guide/ |
| 11 | Samsung Semiconductor 官网：HBM3E 产品页（advanced TC-NCF、11% 热阻改善） | 访问 2026-09-18 | https://semiconductor.samsung.com/dram/hbm/hbm3e/ |
| 12 | JEDEC：JESD270-4（HBM4）标准发布（2025-04-16；2025-12 追加 JESD270-4A） | 2025-04-16 | https://www.jedec.org/news/pressreleases/jedec%C2%AE-and-industry-leaders-collaborate-release-jesd270-4-hbm4-standard-advancing |
| 13 | ISSCC 论文：48GB 16-Hi 1280GB/s HBM3E（all-around power TSV；DOI 卷号为 2024，疑为 ISSCC 2025 论文，引用前需复核） | 2024/2025 | https://doi.org/10.1109/ISSCC49657.2024.10454440 |
| 14 | TrendForce：三星拟 HBM5 用 2nm base die、HBM5E 用 1d DRAM | 2026-03-18 | https://www.trendforce.com/news/2026/03/18/news-samsung-reportedly-eyes-2nm-base-die-for-hbm5-1d-dram-for-hbm5e-hbm4-to-exceed-50-of-output/ |
| 15 | TrendForce：SK 海力士评估 Intel 供应 HBM4E base die（未证实） | 2026-08-31 | https://www.trendforce.com/news/2026/08/31/news-sk-hynix-reportedly-weighs-intel-for-hbm4e-base-dies-amid-tsmc-cost-pressure-and-supply-diversification/ |
| 16 | 美光 HBM3E 产品页（功耗低 30% 宣称） | 访问 2026-09-18 | https://dev-cloud.micron.cn/products/memory/hbm/hbm3e （直接抓取 403，数据来自搜索摘要） |
| 17 | SK hynix Newsroom：12 层 HBM4E 送样（官方稿：16 Gbps、能效 +20%、MR-MUF 热阻较 HBM4 −17%） | 2026-06-18 | https://news.skhynix.com/en/sk-hynix-ships-samples-of-12-layer-next-gen-hbm4e-2/ |
| 18 | StorageNewsletter：三星 HBM4 量产（稳定 11.7 Gbps、3.3 TB/s、自称业界第一） | 2026-02-18 | https://www.storagenewsletter.com/2026/02/18/samsung-begin-mass-production-of-up-to-36gb-hbm4-memory-with-performance-for-ai-computing/ |
| 19 | StorageNewsletter：三星 GTC 2026 HBM4E 演示（16 Gbps / 4.0 TB/s 口径的可溯源出处） | 2026-03-19 | https://www.storagenewsletter.com/2026/03/19/nvidia-gtc-2026-samsung-unveils-hbm4e-showcasing-comprehensive-ai-solutions-nvidia-partnership-and-vision/ |
| 20 | Tom's Hardware：SK 海力士 Hot Chips 2026 演讲（16 层 775μm 上限、混合键合推迟至 HBM5） | 2026-08-24 | https://www.tomshardware.com/tech-industry/semiconductors/sk-hynix-says-hybrid-bonding-wont-be-ready-for-hbm4e-as-ai-memory-runs-into-a-775-micron-ceiling |
| 21 | Tom's Hardware：混合键合路线图（TSMC 量产 6μm、2029 年 4.5μm；CEA-Leti 演示 1μm D2W；HBM4 MR-MUF 微凸点约 30μm） | 2026-09-02 | https://www.tomshardware.com/tech-industry/semiconductors/hybrid-bonding-roadmap-examined |
| 22 | SK hynix Newsroom：全球首个 HBM4 开发完成（1bnm 裸片） | 2025-09-12 | https://news.skhynix.com/en/sk-hynix-completes-worlds-first-hbm4-development/ |
| 23 | SK hynix Newsroom：2Q26 财报（龙仁一期洁净室 early 2027；HBM4 出货节奏） | 2026-07-29 | https://news.skhynix.com/en/q2-2026-business-results/ |
| 24 | IT之家：ChosunBiz 1c DRAM 产能占比转述（SK 1Q26 ~10%、1Q27E 35% 超 1b） | 2026-09-07 | https://www.ithome.com/0/999/152.htm |
| 25 | 199IT：Counterpoint 口径 2Q25 SK 海力士 HBM 份额 62%（1Q26 份额数据未能溯源后的替代参照） | 2025-09-25 | https://www.199it.com/archives/1787054.html |
| 26 | Tom's Hardware：JEDEC HBM4 标准定稿解读（VDD 1.0/1.05 V 双档、VDDQ 0.7–0.9 V） | 2025-04-17 | https://www.tomshardware.com/pc-components/ram/jedec-finalizes-hbm4-memory-standard-with-major-bandwidth-and-efficiency-upgrades |
| 27 | Tom's Hardware：NVIDIA Rubin Ultra tray 实机演示（单封装 1TB HBM4E） | 2026-03-17 | https://www.tomshardware.com/pc-components/gpus/nvidia-demonstrates-rubin-ultra-tray-worlds-1st-ai-gpu-with-1tb-of-hbm4e |
| 28 | Tom's Hardware：AMD MI325X 256GB HBM3E（规格修正依据） | 2025-01-10 | https://www.tomshardware.com/tech-industry/artificial-intelligence/amds-instinct-mi325x-smiles-for-the-camera-256-gb-of-hbm3e |
| 29 | Cadence Community：HBM3E PHY 1.33 TB/s @ 10.4 Gbps（带宽↔速率换算依据） | 2024-08 | https://community.cadence.com |

### 数据可信度分级

- **厂商官方确认**：三星 HBM4E 全部规格与时间线（来源 1）、SK 海力士 12/16 层 HBM3E（来源 2/3）、SK 海力士 HBM4E 送样规格（来源 17）、JESD270-4（来源 12）、美光与 TSMC 合作（来源 9，财报会口径）。
- **业界普遍报道但未官方确认**：SK 海力士 HBM4E base die 为 TSMC 3nm 级（来源 4 明确标注 unconfirmed）；1c 产能占比（转述韩媒供应链数据）；1d 开发时间表（The Bell 单一信源）；HBM4E"密度 +50%"（官方口径为容量 +33%）；SK 海力士 HBM4E"1c 首用"（韩媒转述，官方稿未写）；三星 TC-NCF"热阻 −11%"（官网产品页口径，官方新闻稿无此数，待 ISSCC 原文复核）。
- **传闻级**：HBM4E 20 层堆叠；Intel 供应 base die；16 层 HBM4 继续 MR-MUF（xfastest 标题，正文未验证；但 Hot Chips 2026 已确认 SK 海力士 MR-MUF 延续至 Rubin 世代、混合键合推迟 HBM5，见来源 20）；三星 HBM5 用 2nm base die 与 2028–2029 时间表（单一转述信源）。
- **已弃用（2026-09-19 核对无法溯源或自相矛盾）**：HBM3E"最高 12.4 Gbps"（JEDEC 上限 9.6）；HBM3E"上限 1.33 TB/s"（对应 10.4 Gbps，与 12.4 Gbps 互斥）；Counterpoint 1Q26"58/21/21"份额；三星"能效较前代 +12%"。

### 未决问题

- 阻塞：SK 海力士 HBM4E base die 的代工厂与节点无官方确认，若需引用于正式材料，须以 SK 海力士官方披露为准。
- 阻塞：美光 HBM4E 具体引脚速率/容量规格未见官方新闻稿，仅有"2027 年量产 + TSMC base die"的财报会口径。
- 待定：HBM4E 的 JEDEC 正式标准号（JESD270-4A 或后续版本）在本次调研中未获得直接文本，引用前需查 JEDEC 官网。
