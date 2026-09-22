---
title: '材料地图：HBM 先进封装-3D 封装材料收集'
description: '项目聚焦转向 HBM 先进封装（3D 堆叠）后的材料底座：按结构/键合/测试/集成环境四个主题归档全部已核验来源，标注可信度分级与抓取日期，作为下一步数据科学规划的输入。'
date: 2026-09-25
tags: ['HBM', '3D 封装', '材料收集', '来源清单']
---

# 材料地图：HBM 先进封装-3D 封装

本文是项目聚焦调整（2.5D 优先 → HBM 先进封装-3D 封装优先）后的材料总底座。收集原则：

1. **每条材料都有可点开的真实 URL**，抓取日期与核验方式写在归档文件头部；
2. 原始摘录归档在 [`public/sources/`](/sources/)（`hbm-3d/` 为本轮新增，`hbm3e-hbm4e/`、`hbm-test/` 为既有证据层）；
3. 数字引用执行三档纪律：**A 官方确认 / B 业界口径 / C 设计假设**，方法见《[数据核对与落地评估报告](/notes/hbm/hbm-fact-check-log/)》。

## 主题一：3D 堆叠结构本身（TSV / base die / 层数）

| 材料 | 类型 | 日期 | URL |
|---|---|---|---|
| SK 海力士：TSV 技术如何支撑 3D-TSV DRAM 与 HBM（VP 撰文） | 厂商官方 | ~2020，2026-09-25 全文抓取 | https://news.skhynix.com/en/creating-new-values-in-dram-using-through-silicon-via-technology-for-continued-scaling-in-memory-system-performance-and-capacity/ |
| SK 海力士 Hot Chips 2026 封装演讲现场报道（base die + ≤16 core die、>20K TSV、16148 micro-bump、775 μm） | 会议现场报道 | 2026-08，2026-09-25 抓取 | https://www.servethehome.com/sk-hynix-hbm-packaging-at-hot-chips-2026/ |
| Semiconductor Engineering：HBM 堆叠的挑战（8→16→24 层路线、凸点对准与翘曲） | 行业媒体 | 2025-09-03 | https://semiengineering.com/challenges-in-stacking-hbm/ |
| SK 海力士：全球率先量产 12 层 HBM3E | 厂商官方 | 2024-09-26 | https://news.skhynix.com/en/sk-hynix-begins-volume-production-of-the-world-first-12-layer-hbm3e/ |
| SK 海力士：16 层 HBM3E 开发发布（SK AI 峰会） | 厂商官方 | 2024-11-06 | https://news.skhynix.com/en/sk-hynix-announces-16-layer-hbm3e-at-sk-ai-summit-2024/ |

对应笔记：《[TSV 硅通孔基础](/notes/3d/tsv-basics/)》《[HBM 三代堆叠的 3D 对比](/notes/hbm/hbm-generations-3d/)》。

## 主题二：堆叠键合三工艺（MR-MUF / TC-NCF / Hybrid Bonding）

| 材料 | 类型 | 日期 | URL |
|---|---|---|---|
| SK 海力士：MR-MUF 的热控制突破（官方技术长文，2019 启用、HBM2E 散热 +36%、EMC 1.6×） | 厂商官方 | 2024-07-30，2026-09-25 全文抓取 | https://news.skhynix.com/en/rulebreaker-revolutions-mr-muf-unlocks-hbm-heat-control/ |
| Semiconductor Engineering：HBM4 延续微凸点、混合键合推迟（JEDEC 720→775 μm 修订、HB 测试颗粒难题） | 行业媒体（UMC/ASE/Brewer Science 具名） | 2025-12，2026-09-25 全文抓取 | https://semiengineering.com/hbm4-sticks-with-microbumps-postponing-hybrid-bonding/ |
| Tom's Hardware：混合键合 2026 现状（TSMC SoIC 6 μm 量产、Intel Foveros Direct 9 μm 出货、HBM 推迟） | 行业媒体 | 2026-09-02 | https://www.tomshardware.com/tech-industry/semiconductors/hybrid-bonding-roadmap-examined |
| Tom's Hardware：SK 海力士 Hot Chips 2026——混合键合推迟至 HBM5、775 μm 天花板 | 行业媒体 | 2026-08-24 | https://www.tomshardware.com/tech-industry/semiconductors/sk-hynix-says-hybrid-bonding-wont-be-ready-for-hbm4e-as-ai-memory-runs-into-a-775-micron-ceiling |
| 三星 HBM 官方产品页（TC-NCF 路线） | 厂商官方 | 访问 2026-09-25 | https://semiconductor.samsung.com/dram/hbm/ |
| SK 海力士 VP 访谈：下一代封装技术（MR-MUF→混合键合储备） | 厂商官方 | 2024-08-05 | https://news.skhynix.com/en/gyujei-lee-next-gen-packaging-tech-key-to-hbm-success/ |

对应笔记：《[HBM3E 与 HBM4E 工艺调研](/notes/hbm/hbm3e-hbm4e-process/)》《[HBM 堆栈内外：互连密度阶梯](/notes/hbm/interconnect-density/)》。

## 主题三：测试与良率（KGD / KGSD / 测试左移）

| 材料 | 类型 | 日期 | URL |
|---|---|---|---|
| Semiconductor Engineering：HBM 测试左移保 AI 芯片良率 | 行业媒体 | 2026-05-12 | https://semiengineering.com/hbm-shifts-testing-left-to-preserve-ai-chip-yield/ |
| SWTest 2017 联合论文：单颗 HBM2 堆栈的 KGS 测试单元（SK 海力士/FormFactor/Advantest，3990 凸点普查） | 会议一手 | 2017-06 | https://www.swtest.org/swtw_library/2017proc/PDF/S09_01_Nhin_SWTW2017R2.pdf |
| SWTest 2025 海报：die carrier 式 HBM 测试单元（FormFactor/Advantest） | 会议一手 | 2025-06 | https://www.swtest.org/library/2025proc/pdf/P01_04_%20LIAO_SWTest-2025.pdf |
| FormFactor 博客：HBM 早期测试策略 | 测试厂商 | 2026 | https://www.formfactor.com/blog/2026/high-bandwidth-memory-testing-why-early-test-strategies-are-critical-for-yield-cost-and-performance/ |
| Semiconductor Engineering：DRAM 测试与检查越来越难 | 行业媒体 | 访问 2026-09-25 | https://semiengineering.com/dram-test-and-inspection-just-gets-tougher/ |
| ADI 设计笔记：PMU 电压/电流钳位（MAX9979，FVMI/FIMV 模式与量程） | 芯片厂商一手 | 2026-09-25 全文抓取 | https://www.analog.com/en/resources/design-notes/how-to-set-pmu-voltage-and-current-clamps.html |
| Marvin Test KB Q200207：DC 参数测试（PMU 两模式、按 spec 判定） | 测试设备商文档 | 2026-09-25 全文抓取 | https://www.marvintest.com/KB/Q200207/DC-Characterization-of-ICs-Using-PXI-Instrumentation |
| AD5520/AD5522 手册：每引脚 PMU/SMU（钳位 + 窗口比较器，ATE 应用） | 芯片厂商一手 | 2026-09-25 | https://www.analog.com/media/en/technical-documentation/data-sheets/AD5520.pdf |
| US5365180A：接触电阻测量（对 pin–GND 二极管加流测压降） | 专利 | 2026-09-25 索引核验 | https://patents.google.com/patent/US5365180A/en |

（以上电路级来源的摘录与可引用论断集中归档于 [`public/sources/hbm-test/2026-09-25_ate-pmu-dc-parametric.md`](/sources/hbm-test/2026-09-25_ate-pmu-dc-parametric.md)；这些来源的教学化重组见笔记《[测试电路的三张图](/notes/hbm/test-circuit-diagrams/)》。）

对应笔记：《[HBM 测试的 3D 结构](/notes/hbm/hbm-test-3d/)》（含 10 项来源的完整表）。

## 主题四：集成环境（2.5D 中介层 / bridge——定位为外围语境）

HBM 堆栈是 3D 集成主体；2.5D/bridge 是堆栈与 GPU 同封装互连的**宿主环境**。按"3D 为主、2.5D 为宾"的聚焦，本主题只保留理解堆栈外部约束所需的最小集合：

| 材料 | 类型 | 日期 | URL |
|---|---|---|---|
| TSMC CoWoS 官方页（集成"SoC 与 HBM 堆栈"的 2.5D 平台；CoWoS-S 最大 ~2700 mm²） | 厂商官方 | 访问 2026-09-25 | https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm |
| TSMC SoIC 官方页（3D 前端堆叠平台，与 CoWoS 互补） | 厂商官方 | 访问 2026-09-25 | https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/SoIC.htm |
| TSMC SoIC 路线图：6 μm → 2029 年 4.5 μm | 行业媒体 | 2026-04-29 | https://www.tomshardware.com/tech-industry/semiconductors/tsmc-soic-3d-stacking-roadmap-outlines-path-from-6-micron-pitches-today-to-4-5-micron-in-2029-fujitsus-monaka-cpu-to-benefit-from-face-to-face-chiplet-stacking |

对应笔记：《[HBM 堆栈的集成环境](/notes/hbm/integration-context/)》。

## 主题五：标准与规格基线

| 材料 | 类型 | 日期 | URL |
|---|---|---|---|
| JEDEC：JESD270-4 HBM4 标准发布稿 | 标准组织 | 2025-04-16 | https://www.jedec.org/news/pressreleases/jedec%C2%AE-and-industry-leaders-collaborate-release-jesd270-4-hbm4-standard-advancing |
| SK 海力士：12 层 HBM4E 送样（16 Gbps、能效 +20%、Advanced MR-MUF 热阻 −17%） | 厂商官方 | 2026-06-18 | https://news.skhynix.com/en/sk-hynix-ships-samples-of-12-layer-next-gen-hbm4e-2/ |
| 三星：全球首发 HBM4E 样品出货 | 厂商官方 | 2026-05-29 | https://news.samsungsemiconductor.com/global/samsung-electronics-begins-shipment-of-industry-first-hbm4e-samples/ |
| Micron HBM3E 官方产品页（8/12 层、1β 裸片） | 厂商官方 | 访问 2026-09-25 | https://www.micron.com/products/memory/hbm/hbm3e |

完整规格对照与逐条可信度分级见《[HBM3E 与 HBM4E 工艺调研](/notes/hbm/hbm3e-hbm4e-process/)》；规格冲突（如 HBM4 微凸点 30 μm vs 10 μm 两种媒体口径）的处理规则见《[数据核对与落地评估报告](/notes/hbm/hbm-fact-check-log/)》§2.1 与 [`sources/hbm-3d/`](/sources/hbm-3d/) 归档内的口径冲突标注。

## 本轮新增归档（2026-09-25）

原始摘录（含原文引句与可引用论断）写入 [`public/sources/hbm-3d/`](/sources/hbm-3d/)：

1. `2026-09-25_skhynix_tsv-3d-stacking.md` — TSV 基础技术（全文抓取）
2. `2026-09-25_skhynix_mr-muf-heat-control.md` — MR-MUF 热控制（全文抓取）
3. `2026-09-25_skhynix_hotchips2026-packaging_servethehome.md` — Hot Chips 2026 封装演讲（全文抓取）
4. `2026-09-25_semiengineering_hbm4-microbumps-postponing-hb.md` — HBM4 微凸点决策（全文抓取）
5. `2026-09-25_semiengineering_challenges-in-stacking-hbm.md` — 堆叠层数路线（全文抓取）
6. `2026-09-25_tsmc-3dfabric-official-pages.md` — TSMC 官方页（索引核验，直抓 403 反爬）

## 与数据科学规划的衔接（下一步）

材料底座就绪后，数据科学部分的规划输入已经齐备，三条主线各有数据锚点：

1. **测试数据链**：HBM 多插入点测试（晶圆 CP → 堆叠 PSWT → KGSD → 2.5D 组装联测）决定数据管道的谱系主键设计——锚点见《[HBM 测试的 3D 结构](/notes/hbm/hbm-test-3d/)》；
2. **良率经济学**：堆叠复利（0.95¹⁶≈44%）与测试左移的拦截成本逻辑——锚点见《[数据核对与落地评估报告](/notes/hbm/hbm-fact-check-log/)》§1/§4；
3. **工艺参数侧**：键合三工艺、减薄、凸点 pitch 等过程数据的监测点——锚点见本页主题二与《[HBM3E 与 HBM4E 工艺调研](/notes/hbm/hbm3e-hbm4e-process/)》。

规划的承载文档：技术视角《[数据科学在先进封装厂的落地方案](/notes/smart-mfg/data-science-roadmap/)》、硬件视角《[配套硬件准备](/notes/smart-mfg/hardware-readiness/)》、个人视角《[测试数据科学工程师 24 个月计划](/notes/career/test-ds-24mo-plan/)》。
