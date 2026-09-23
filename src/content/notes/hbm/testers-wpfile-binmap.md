---
title: 'T5833 与 Magnum 7H：机台对比、WPFile 测试项与 BinMap 失效命名解读'
description: '三个盲点一次讲清：T5833（Advantest）与 M7H（Teradyne Magnum 7H）都是测试机而非键合机；WPFile 测试项按四个测量域分层读；BinMap 里 PowerShort/Crack/Bridge/SealRing/TSV 混排是「电学症状 × 物理根因」两套命名体系的惯例——附症状↔根因映射与工序归属表。'
date: 2026-09-25
tags: ['HBM', 'KGSD', '测试机台', 'T5833', 'Magnum 7H', 'WPFile', 'BinMap', '失效归因']
---

> 先纠一个会传染的误会：**M7H 不是键合机**。它是 Teradyne 的 **Magnum 7H**——HBM 专用测试平台（ATE），和 Advantest 的 T5833 是同行竞品关系。TCB（热压键合机，ASMPT/Besi/Hanmi/K&S 出品）是另一类设备，负责堆叠键合、不产 WPFile。你在 WPFile 里看到的「封装失效」，是键合/减薄/切割/TSV 环节带进来的缺陷被**测试机**暴露了——暴露者与肇事者要分清。

## 一、T5833 vs Magnum 7H：两台测试机的对比

| 维度 | Advantest T5833 | Teradyne Magnum 7H（M7H） |
|---|---|---|
| 定位 | 成本型多功能存储测试机（手机 DRAM/NAND 出身），后延伸到 HBM | **HBM 原生专用平台**（2025-08 发布），为大规模 HBM 堆叠裸片测试设计 |
| 支持器件 | 各代 DRAM、NAND、NVM、MCP | HBM2E / HBM3 / HBM3E / HBM4 / HBM4E |
| 晶圆并行 | 1,024（4 I/O）/ 2,048（2 I/O） | 高同测数：可配置 9,216 数字引脚 + 2,560 电源引脚 |
| 测试速率 | 最高 2.4 Gbps（KGD 同速） | 最高 5 Gbps（TIU 接口，覆盖 HBM3/3E 与下一代 HBM4/4E 速率） |
| HBM 覆盖阶段 | 晶圆测试 + 冗余修复分析（AFM 地址失效存储 + MRA 冗余分析选件）；HBM 测试与修复方案见 CSTIC 2024 论文 | base die 晶圆测试 → 内存核心测试（core test）→ 老化（burn-in）→ KGSD / CoW（配传统探针台）→ 切割后单颗（配裸片探针台/分选机） |
| 关键选件 | AFM、MRA（失效捕获 + 冗余分析，量产晶测两件套） | APG（算法图形）+ LVM（逻辑向量内存，测逻辑 base die）+ FLS™（Fail List Streaming 实时失效流） |
| 产能口径 | 晶圆 2,048 同测（厂商称较上代 +50%） | 量产测试产能提升 1.6×；减少 Touch Down 次数 |
| 生态 | Advantest T5800 系列 | Teradyne Magnum 系列；P52 探针 TIU 已部署数百套 |

**怎么理解两者关系**：两家 ATE 厂商的竞品、两代定位——T5833 是上一代成本型机台在 HBM 上的延伸方案（等价于"用存量机台 + 新程序/新接口改造"），Magnum 7H 是为 HBM 重新设计的新一代平台。同一条 KGSD 线上完全可能混用两家的机台；**WPFile/STDF 的数据语义与机台品牌解耦**——换机台不换数据字段语义，解析器与方法论照用（术语对照见《[术语与使用指南](/notes/method/terminology-and-usage/)》）。

**TCB 在哪**：热压键合机（ASMPT FIREBIRD、Besi TCB、Hanmi TC BONDER 系列）做的是堆叠键合这道工序，它的产物缺陷（桥连、空洞、对准偏移）要等下游测试插入点才暴露。所以机台分类记三句话：**测试机产 WPFile；键合机产缺陷；探针台决定针扎哪里**。

## 二、WPFile 里那么多测试项：按四个测量域分层读

WPFile 无公开格式规范（厂内/测试机链路私有格式，既有结论），但字段语义与国际 STDF 同构——所以**不用背字段名，按测量域分层**。每一层都能对回《[测试电路的图](/notes/hbm/test-circuit-diagrams/)》里的具体电路：

| 测量域 | 典型测试项 | 施加/测量方式 | 电路位置 | 典型 bin 归属 |
|---|---|---|---|---|
| DC 参数层 | Contact / Open-Short | FIMV：对 pin–GND 二极管加流测压 | 焊盘 + ESD 二极管 | Bin1（Open/Short） |
| | PowerShort | FVMI：电源轨加安全电压测流 | VDD–VSS 轨 | Bin1/2 |
| | Leakage / Idd | FVMI 灵敏量程 | 输入缓冲器/电源域 | Bin1/2/3 |
| 功能层 | March 图形、位图、修复统计 | APG 写/读/比较 + 失效捕获 | 阵列列 + MBiST | Bin4 |
| 动态/速度层 | 频率扫描、时序 margin、速度分档 | 全速图形 + 眼/时序余量 | PHY/时钟 | Bin7 / speed sort |
| 修复层 | 冗余替换记录、修复后复验 | 激光/e-fuse/PPR + 复测 | fuse box | 复验不过仍淘汰 |

**BinMap 的读法**：bin 顺序是 fail-stop 的（先致命后边角），所以 bin 分布形状直接翻译成失效域占比——bin1 高 = 工艺灾难类（桥连/开路）；bin4 高 = 阵列或键合类；bin7 高 = 边缘性问题。拿到一份 WPFile 的五步阅读顺序：

1. **bin 分布**（整体形状 → 哪个失效域在涨）；
2. **每颗 die 的 first-fail 项**（fail-stop 停在哪一步 = 拦截位置）；
3. **失效位图的空间签名**（点/边/环/列——对应不同物理根因）；
4. **参数直方图与离群**（DC 项的分布漂移先于良率塌陷）；
5. **跨插入点差分**（CP 过了、PSWT 挂 → 键合/堆叠类；CP 就挂 → 裸片类）。

## 三、核心盲点：电学 bin 是「症状」，Crack/Bridge/SealRing/TSV 是「根因」

你懵的那一点，本质是 **BinMap 里混排了两套命名体系**：

- **症状名**（程序判定用）：Open/Short、PowerShort、Idd、Function……——程序只回答"电学上怎么坏"；
- **根因名**（归因标注用）：Crack、Bridge、SealRing 损伤、TSV 开路……——是工程/FA 在"签名 + 位置 + 插入点"分析后打的物理归因标签。

所以「SealRing 也是 Open&Short、TSV 也是」一点都不奇怪：**seal ring 损伤和 TSV 开路的电学症状恰好都落在 Open/Short 这个窗口里**。症状 bin 回答"怎么坏"，根因标签回答"为什么坏"——两者是**多对多映射**，不是一对一：

| 电学症状（bin） | 可能的物理根因 |
|---|---|
| Open/Short | 接触开路 / 焊盘-地桥连 / **SealRing 损伤（沿边开路漏电）** / 凸点 Bridge / **TSV 开路（列开路）** |
| PowerShort | 键合材料挤压桥连 VDD–VSS / 金属残留 |
| Function | TSV 开路（column fail）/ 弱位 / lane 失效 |
| Leakage | 栅氧弱点 / 裂纹穿氧化层 |

反向也一样：**一条裂纹（Crack）** 穿过走线表现为 Open/Short、穿氧化层表现为漏电、打在单元上表现为 Function 位失效——**从症状到根因必须补三个维度**：

1. **空间签名**：点（随机缺陷）、沿边环（SealRing/切割）、列（TSV/lane）、聚簇（工艺局部性）；
2. **跨插入点差分**：预堆叠 CP 过了、堆叠后 PSWT/KGSD 挂 = 键合/堆叠类；CP 就挂 = 裸片类；
3. **物理分析闭环**：X-ray / SAT / 切片确认（见《[HBM 测试的 3D 结构](/notes/hbm/hbm-test-3d/)》§4 的四类失效判别表）。

## 四、是 HBM 特点吗？「主要是 TCB 的锅」对吗？

**两套命名混排**：不是 HBM 特有——这是存储业惯例（Edusemi 的 0.25 μm 世代 bin 骨架沿用至今，现代工具只是加了归因标签层）。

**封装类失效占比高**：这部分是 HBM 特点。3D 堆叠让封装相关的失效从"可忽略"变成"主项"——层数多（12/16 层的良率复利：单 die 95% → 整堆约 44%~66%）、裸片减薄到 30–50 μm、TSV/微凸点/键合界面成倍增加；而且多插入点（CP → 堆叠 → KGSD）让"归因到工序"第一次有数据可用。

**「都是 TCB 机台作业的问题」**：不完全对。每个物理根因有自己的工序归属：

| 物理根因 | 责任工序 | 与 TCB 键合机的关系 |
|---|---|---|
| 凸点 Bridge / head-in-pillow | 键合（TCB / MR-MUF / TC-NCF） | **强相关**——对准、压力、温度曲线 |
| Crack | 减薄 / 切割 / 搬运应力 | 无关（30–50 μm 薄片更敏感） |
| SealRing 损伤 | 探针扎痕 / 划片 | 无关（IPFA 2021 实证：探痕可致晶圆分选失效） |
| TSV 开路 → column fail | TSV 刻蚀/铜填充/露头（堆叠之前的工艺） | 无关（发生在 TCB 上料之前） |
| PowerShort（VDD–VSS 桥） | 键合材料挤压溢出 **或** 前道金属残留 | 可能相关，需位图/物理分析定责 |

结论：**"封装失效多"是 HBM 的特点，"都是 TCB 的锅"是归因懒惰**——跨插入点差分和空间签名就是用来把责任拆到正确工序的。

## 五、给你的三条数据侧行动建议

1. **bin 位移监控**：按 lot 对比各 bin 占比的时间序列——工艺变更（换键合机/换针卡/加减薄量）后 bin1 或 bin4 的位移是最早的信号；
2. **空间签名聚类**：把失效位图按点/边环/列/聚簇自动归类（SPR 思路），直接输出"疑似 SealRing / 疑似 TSV / 疑似键合"的分布报表；
3. **跨插入点差分报表**：同一颗 die 在 CP/PSWT/KGSD 各插入点的 pass-fail 关联表——"CP 过 PSWT 挂"的清单就是给键合与减薄工序的工单。

## 来源清单

| # | 来源 | 日期 | URL |
|---|---|---|---|
| 1 | Advantest T5833 数据手册（晶圆并行 1,024/2,048、封装 512、KGD 2.4 Gbps、AFM/MRA 选件；© 2015） | 访问 2026-09-25 全文抓取 | https://www3.advantest.com/documents/11348/146262/pdf_datasheet_T5833_8.5x11.pdf/1cdd5237-a694-4e0d-b1d9-6c4eb430519d |
| 2 | Advantest T5833 产品页（wafer sort + final test；DRAM/NAND） | 访问 2026-09-25 | https://www.advantest.com/en/products/semiconductor-test-system/memory/t5833/ |
| 3 | Advantest T5833 日文页（晶圆 2,048 同测为上代 1.5 倍、封装 2.4 Gbps/512 同测、KGD 对应 2.4 Gbps） | 访问 2026-09-25 | https://www.advantest.com/ja/products/semiconductor-test-system/memory/t5833/ |
| 4 | CSTIC 2024 论文：HBM Device Test & Repair Solution on T5833（DOI 10.1109/cstic61820.2024.10532065） | 访问 2026-09-25 | https://doi.org/10.1109/cstic61820.2024.10532065 |
| 5 | Teradyne 官方新闻稿（中文）：推出 Magnum 7H（2025-08-08；5 Gbps、9,216 数字 + 2,560 电源脚、HBM2E–HBM4E、KGSD/CoW/切割后单颗、APG+LVM+FLS、产能 +1.6×） | 访问 2026-09-25 全文抓取 | https://teradyne.cn/releases/magnum-7h/ |
| 6 | Teradyne Magnum 7H 产品页 | 访问 2026-09-25 | https://www.teradyne.com/products/magnum-7h/ |
| 7 | Teradyne Magnum 7H 产品页（中文站，TIU 4.5 Gbps 口径、P52 探针 TIU） | 访问 2026-09-25 | https://teradyne.cn/products/magnum-7h/ |
| 8 | ASMC 2024 论文：KGSD Testing of 2.5D/3D Stacked Dies with Emphasis on HBM（DOI 10.1109/asmc61125.2024.10545488） | 访问 2026-09-25 | https://doi.org/10.1109/asmc61125.2024.10545488 |
| 9 | 既有归档：Edusemi bin 体系、三星 EDS、SWTest 2017、semiengineering 系列（见《[HBM 测试的 3D 结构](/notes/hbm/hbm-test-3d/)》来源清单） | — | 见该笔记 |

## 口径与可信度

- **速率口径差异**：Magnum 7H 官方新闻稿写"高达 5 Gbps"（来源 5），中文产品页写 TIU "高达 4.5 Gbps"（来源 7）——前者为平台数据速率、后者为 TIU 接口口径，引用时注明出处；
- **T5833 年代**：数据手册版权 2015，属上一代成本型平台；其 HBM 能力由 CSTIC 2024 论文（来源 4）与厂商方案延伸证明，**具体到某产线的 HBM 程序能力以设备厂商与厂内 TE 确认为准**；
- **Blocked（公开渠道不可得，以厂内为准）**：WPFile 字段字典（无公开规范）；厂内 BinMap 的物理命名标签规则（Crack/Bridge/SealRing/TSV 标签的判定标准属厂内/FA 团队约定，无公开统一标准）；M7H 为 Magnum 7H 的业内简称，若与贵司设备铭牌不一致以铭牌为准。

## 相关

- 电路原理：《[测试电路的图：三张总图 + 六张失效电路图](/notes/hbm/test-circuit-diagrams/)》
- 失效判别表与良率经济学：《[HBM 测试的 3D 结构](/notes/hbm/hbm-test-3d/)》
- 厂内栈术语对照：《[术语与使用指南](/notes/method/terminology-and-usage/)》
