---
title: '数据核对与落地评估报告'
description: '约 95 条可核验论断的逐条网络核查：45 条确认、25 条修正、13 条降级、8 条存疑；含重大修正清单、答辩七问与遗留待核项。'
date: 2026-09-19
tags: ['HBM', '事实核查', '数据可信度']
---

# 数据核对与落地评估报告

- 核对日期：2026-09-19
- 核对范围：HBM 专题全部 7 份材料（工艺调研底稿、工艺图解、测试数据分析方法论、PART 00–03 平台四篇），外围练手稿（mock 数据，方法学自洽）未迁移
- 核对方式：三路并行网络核查（厂商官方新闻稿 / JEDEC / 行业标准组织 / 论文数据库 / 官方文档）+ 本地数学复核；约 95 条可核验论断逐条判定
- 落地评估主体：公司（封测/OSAT 定位；名称属敏感信息，脱敏约定见 §4.1）
- 处理方式：**原文档中的错误已直接修正**（每处修正保留"原 X → 现 Y"留痕与依据 URL）；`sources/` 目录（现归档于 [/sources/hbm3e-hbm4e/](/sources/hbm3e-hbm4e/)）为原始摘录记录，未改动，其中个别摘录含后被推翻的说法（如 TechTimes"密度 +50%"），以主文档为准

## 1. 判定总览

| 判定 | 数量 | 说明 |
|---|---|---|
| 确认 | ~45 | 来源与数值一致，可直接上会 |
| 修正/刷新 | ~25 | 数值或出处有误，已改（版本号、密度、pitch、引用归属等） |
| 删除/降级 | ~13 | 无法溯源或已过时，已删除或标注为传闻 |
| 存疑待核 | ~8 | 概念成立但原文未定位，已标注待核 |
| 数学自查 | 15/15 通过 | 良率复利、带宽换算、逃逸放大、数据量、ROI 算术全部正确 |

数学复核结论（无需网络、全部本地验算）：0.95⁸≈66%、0.95¹⁶≈44%、0.99¹⁶≈85%；9.2 Gbps×128 B≈1.18 TB/s；12.8×256 B≈3.28 TB/s；16×256 B≈4.10 TB/s；每 die 100 DPPM 时堆叠逃逸 800/1200/1600 DPPM；64 台×12.5 万 die×6 KB≈48 GB/日、×350 日≈17 TB/年；ROI 三档算术（2500/2800、5000/2400、7500/2200）全部自洽；ISSCC 16 层 1280 GB/s ↔ 10 Gbps 换算一致。

## 2. 重大修正清单（已全部改入原文档）

### 2.1 工艺与规格（改《HBM3E 与 HBM4E 工艺调研》、《HBM 先进封装工艺图解》）

| # | 原文 | 修正 | 依据 |
|---|---|---|---|
| 1 | HBM3E"最高 12.4 Gbps" | 删除。JEDEC JESD238 系列上限 9.6 Gbps；量产典型 9.2–9.8 Gbps，厂商在研 10 Gbps。"12.4"仅出自 Siemens 博客表格，无 JEDEC/厂商背书 | JEDEC JESD238；Siemens 博客（2026-04-24） |
| 2 | HBM3E"上限 1.33 TB/s" | 改 1.23 TB/s（9.6 Gbps）/ 1.28 TB/s（在研 10 Gbps）。原 1.33 TB/s 对应 10.4 Gbps，与"12.4 Gbps"互相矛盾——懂行人一眼能看出的硬伤 | Cadence HBM3E PHY 口径（2024-08） |
| 3 | HBM4E 密度"+50%" | 改 +33%：单裸片 24→32Gb、单堆 36→48GB 均为 +33%；"+50%"未见于 SK 海力士官方稿 | SK hynix Newsroom（2026-06-18） |
| 4 | 微凸点 pitch"40–55μm" | 限定为 HBM3E 世代；HBM4 约 30μm（SK Hot Chips 2026）；HB <10μm、TSMC 量产 6μm/2029 年 4.5μm | Tom's Hardware（2026-08-24、2026-09-02） |
| 5 | 混合键合"热阻 −47%（MDPI）""机台约 \$3M""Cu dishing ≤5nm""Besi Gen2 <4μm" | 整组替换为可溯源口径：三星 GTC 2026 称 HCB 较 TCB >20%、SK Hot Chips 2026 称 HB（20 层）较 MR-MUF 约 −35%；首套量产 inline 系统约 200 亿韩元（≈\$15M，AMAT+Besi）；dishing 改定性表述 | Tom's Hardware（2026-08-24） |
| 6 | "Rubin Ultra 单 GPU 384GB（8×48GB）" | 已过时。GTC 2026（2026-03）实机演示为单封装 1TB HBM4E，后续又有降配/改设计传闻——引用必须标时点 | Tom's Hardware（2026-03-17） |
| 7 | "三星 2026-02 全球首发量产 HBM4；SiP 实测 11.7 Gbps" | 改"三星宣布率先量产（单方口径）"；"SiP"一词无出处，原话是 consistent processing speed of 11.7 Gbps；SK 海力士 2025-09-12 已宣布全球首个 HBM4 开发完成 | StorageNewsletter（2026-02-18）；SK Newsroom |
| 8 | Counterpoint 1Q26 份额"58/21/21" | 无法溯源，已弃用；改用可核参照点：Counterpoint 口径 2Q25 SK 海力士份额 62% | 199IT（2025-09-25） |
| 9 | "龙仁一期提前至 2027-02" | 龙仁一期官方口径 early 2027；**M15X 厂在清州，与龙仁是两个项目**，不可混用 | SK 2Q26 财报（2026-07-29） |
| 10 | 三星 HBM5"2nm base die、2028–2029" | 降级为单一转述信源传闻；可核口径：Hot Chips 2026 zHBM 性能约为 HBM4E 两倍、无时间表 | Tom's Hardware（2026-09-02） |
| 11 | MI325X 用 12 层 36GB | MI325X 为 256GB（8×32GB）；288GB 对应 MI355X | Tom's Hardware（2025-01-10） |
| 12 | MR-MUF 良率较 TC-NCF"+20%" | 保留但标注"行业口径（Nomad Semi，YouTube 频道），未经厂商证实" | 复核未找到文字源 |
| 13 | 三星 TC-NCF"热阻 −11%" | 保留但标注"产品页口径，官方新闻稿无此数" | Samsung HBM3E 产品页 |
| 14 | 1c 产能占比出处 | 出处更正为 ChosunBiz（经 IT之家转述），非 TrendForce；三星 16%/美光 19% 是 2Q26 末口径，非 1Q26 | IT之家（2026-09-07） |
| 15 | ISSCC"2024"论文 | DOI 卷号 2024 与 16 层产品 2024-11 发布时间线矛盾，疑为 ISSCC 2025，标注"引用前需在 IEEE Xplore 复核" | 时间线交叉验证 |

### 2.2 算法、标准与文献（改《先进封装测试数据分析报告》、《未来蓝图与落地路线》）

**删除的引用（疑似不存在——这是本次核对最重要的发现，编造引用是公司汇报的最大风险）：**

| 原引用 | 处理 | 替代 |
|---|---|---|
| "Yoon 2022：CNN 99%+ @ 93% 覆盖" | 删除（OpenAlex/arXiv 均无此文） | WM-811K 标注子集可溯源最高 **98.56%**（Bao et al. 2024, arXiv:2411.11029，自编码器增广 CNN） |
| "G2LGAN · Tsai 2025" | 删除（精确短语检索 0 结果） | Park & You 2023，DCGAN 晶圆图增广（Applied Sciences，DOI 10.3390/app13095507） |
| "Saad 2026 GAN 综述" | 删除（Crossref/arXiv 无 2025–26 该作者晶圆图论文） | 同上 |
| "Bogdanov 2003 复合泊松" | 删除 | Cunningham 1990（IEEE TSM）/ Stapper 1987（IBM JRD） |
| "BISS 动态应力" | 删除（无此标准用语） | pre-bond / post-bond test、IEEE 1838 wrapper/BIST |
| "Hot Chips，SK 海力士 K. Tran：KGSD 3/5/9 组合" | 删除（Hot Chips 2022–2025 无此讲座；**K. Tran 实为 FormFactor 产品营销负责人**，张冠李戴） | KGSD 术语改引 SK hynix Newsroom 后道工艺系列（2023-10）；图改通用示意 |
| "IRDS：测试成本占营收 2–3%" | 删除（IRDS 无独立 Test 章节） | SemiEngineering 2020 原文口径（~2%、复杂器件可上升一个数量级） |
| "FormFactor：3GHz / 6Gbps" | 删除 | FormFactor 可溯源口径：HBM4/5 数据率 >10 Gbps、单堆栈功耗最高 100 W（SemiEngineering 2026-05-12） |
| "NXP 三输入框架""SIA 白皮书" | 降级为"行业通用框架，原出处未能定位"（公式本身成立） | 保留公式，去掉归属 |
| "Synopsys 2024-02 VMIN" | 标注"出处待核" | 概念保留 |
| "UCSB Hu 综述"（无监督四法出处） | 删除 | O'Neill ITC 2008 / Sakamoto IEEE TSM 2017 / Katragadda ICMTS 2018 / Niranjan IEEE VTS 2023 |

**修正的表述：**

| 原表述 | 修正 | 依据 |
|---|---|---|
| AEC-Q001"x̄ ± kσ（k 通常取 3）" | "按批次样本统计计算限值（x̄±kσ，k 由统计方法与样本量确定，受 datasheet 规格限约束）"——k=3 是过度简化，被车规品质的人问到会失分 | AEC-Q001 方法论；Advantest CSTIC 2024（DOI 10.1109/cstic61820.2024.10531864） |
| "Auburn 2024 双预测器（Pan 2024）" | 论文存在但归属错误：**合肥工业大学** Yuqi Pan et al., JETTA 40(3), 2024（DOI 10.1007/s10836-024-06125-7）。Auburn 的 adaptive test 名学者是 Adit Singh，与该文无关 | JETTA 原文 |
| WM-811K"46,393 批" | 保留但标注二手来源分歧（另有 47,543 之说），以 Wu 2015 原文为准 | Bao 2024 引文差异 |

**核对通过的重点（可放心引用）：** AEC-Q002（SYL/SBL）、DPAT、GDBN（Roehr, ITC 2000）、IEEE 1838-2019、SEMI E142（Substrate Mapping）、STDF v4、WM-811K 数据集主体数字（811,457/172,950/9 类）、四条良率模型公式及归属、负二项最常用共识、Selg 2020（LATS）、Noia 2011/2014（Duke，ITC 2011+Springer 专著第 8 章）、Wan & McLoone GPR（IEEE TSM）、Jia 2026（ECS MA；正式版 Han et al. IEEE TSM 2025）、SemiEngineering 三篇文章（2020-03-10 / 2021-05-11 / 2025-12-09 / 2026-05-12 均存在）、1-10-100 法则（Labovitz & Chang 1992）。

### 2.3 平台组件与成本锚点（改《测试数据立项论证》、《测试数据平台系统架构》）

| 项 | 原文 | 修正（2026-09 快照） |
|---|---|---|
| Kafka | v3.7 | **4.x（KRaft）**。v3.7 已 EOL；4.0 起 KRaft-only、ZooKeeper 移除——新集群部署 3.7 等于"部署即落后两个大版本" |
| Iceberg | v1.6 | v1.11 |
| Spark / Flink | v3.5 / v1.19 | v4.2（3.5 为维护线）/ v2.3（1.x 已出局支持线） |
| 对象存储 | MinIO REL-2024 | **改选 Ceph（RGW）**：MinIO 官方仓库已归档（2026-04）、社区版移除管理控制台、AGPL——新建选型会被当场否掉；MinIO 降为"存量锁定版本+法务评估"备选 |
| PyTorch / MLflow / Prometheus / GitLab | v2.3 / v2.14 / v2.52 / v17 | v2.14 / v3.16 / v3.14（2.x 全系 EOL）/ v19 |
| LinkedIn 基准 | 未标年份 | 2×10⁶ msg/s 为 **2014** 文（异步 3 副本口径）；4.5×10⁶ msg/s 峰值出处为 2015-09 文 |
| Aiven 基准 | 2–3.2×10⁵ | 确认（2017），标注口径：Kafka 0.10/512B/RF=1，2022 有更新版 |
| AWS p4d | \$22–24/instance-hr | 确认 2026-09 快照（us-east-1 ≈\$21.96），但补"历史长期 \$32.77、波动大、须标快照日期与区域"；"A100 ~\$1/GPU-hr"已不成立（Lambda \$1.39–2.79） |
| anysilicon \$0.40/\$5.72 | 直接引用 | 降级为"量级参考（原文未能定位）"，¥3.5/颗 综合成本保留为显式假设 |
| Team Topologies | 三类团队 | 补第四类 complicated-subsystem team 并注明"本场景不设" |
| Pulsar 论据 | "运维更重" | 保留结论；论据改组件层级（Pulsar 4.0 起也已移除 ZooKeeper，不能再拿 ZK 说事） |
| YAGNI（不上 K8s/Flink） | 定性 | 补量化升级阈值（常驻服务 >10、持续 >5×10⁴ msg/s、需端到端 exactly-once 时重评） |

另补两条口径注记：ROI 表人力按 P2 编制 28 人年化，P3 满编 42 人时总成本约 ¥3380 万/年（回收期拉长至约 2 年内，结论方向不变）；"分析师 60% 取数"补公开调研锚（数据准备占 45–60%，Anaconda 2020），60% 为保守端。

## 3. 已确认无误、可放心上会的关键论断

- 九步封装链路（DRAM 裸片 → TSV → 减薄 → 微凸点 → KGD/WLBI → 堆叠键合 → base die → 划片/KGSD → 2.5D）与行业实际一致（已补 CP 两道、MR-MUF/TC-NCF 塑封差异的简化注记）
- JEDEC JESD270-4（2025-04，2025-12 追加 4A）、HBM4 2048-bit/16 层 64GB、HBM4E 三家 14–16 Gbps/48GB（12 层）规格与送样时间线（三星 2026-05-29、SK 2026-06-18）
- 16 层 775μm 高度上限、SK 海力士混合键合推迟至 HBM5（Hot Chips 2026）
- base die 全链条：HBM4 起 TSMC 12FFC+/N5（SK 海力士）、三星自研 4nm、美光 HBM4E 交 TSMC（2027 量产）；C-HBM4E 3nm、2027 年 12.8 GT/s（TSMC OIP 2025-11）
- 堆叠良率复利与逃逸乘法数学；KGD 测试左移的行业逻辑（SemiEngineering 2026-05-12 有专文）
- 平台方法论：Day-0 单机 → 触发式湖仓 → 统计基线先行、ML 挣增量的路线与业界实践一致

## 4. 落地可行性评估（公司场景）

### 4.1 公司定位（脱敏）

公司为一家封测（OSAT 型）企业，处于存储/先进封装供应链的测试与封装环节，产线在爬坡期。名称、工商信息与供应链关联属敏感信息，不入任何材料与提交记录（调研在项目沟通中完成，脱敏约定自 2026-09-19 生效）；本节及全部落地判定仅依赖"封测厂定位"这一层假设，与四篇报告的原生假设（64 台 tester、KGSD 全测、逃逸经济学）一致，产能/单价等数字标注为待实测量级。

### 4.2 逐项判定

| 项 | 判定 | 理由与条件 |
|---|---|---|
| 90 天 MVP（1 VM + 2 人） | **可落地** | STDF 解析 + Postgres + Grafana 是标准互联网工程栈，你的架构背景可直接把控；关键依赖是一名懂测试的工程师（公司正在招聘晶圆测试工程师，人才可得）。风险：STDF 格式与 ATE 生态知识有 2–4 周学习曲线，Day 0 先向设备/测试工程部要一份样例 STDF |
| 湖仓 P2 触发式引入（M5–M9） | **可落地** | "触发器是数据量不是日历"的设计正确；选型已按 2026-09 刷新（Kafka 4.x KRaft / Iceberg 1.11 / Ceph），三节点 48 TB 对年增 <10 TB（列存后）量级有约 3 年余量 |
| 统计基线先行（AEC-Q001/Q002、DPAT） | **可落地，优先做** | 这是业界成熟实践（SemiEngineering 2025-12：PAT/多变量离群已是产线标配），也是 90 天 MVP 的核心交付。注意 AEC 表述已修正为"样本统计动态限值" |
| 自适应闭环（预测跳项、参数回写 ATE） | **高风险，18 个月内降级为试点** | 三个独立理由：① 业界状态是试点前沿（双预测器 2024 年才发论文），不是成熟实践；② **OSAT 特有约束**——测试流程与放行规则在客户质量协议范围内，任何跳项/改限都要客户书面同意，当前治理设计只覆盖内部 MRB，必须补"客户质量协议评审"环节；③ ATE 厂商的自适应测试能力多为商业模块，采购与集成周期不受自己控制。建议：蓝图保留 L4 方向，对外承诺降级为"内部预研 + 单客户联合试点" |
| 组织 16→28→42 人 | **量级合理，起点可减配** | 公司产线在爬坡期，若当前 tester 台数明显少于 64 台，P1 可先 6–10 人（1 数据工程师 + 1 测试工程师起步是对的），扩编严格跟随接入线体数（D-06 回退线已内置）。三部门六小组与 RACI（品质握放行、模型不自批）符合行业治理惯例 |
| 18 个月四阶段里程碑 | **激进但可辩护** | 有阶段门 go/no-go 与回退线兜底。最脆弱的是 M1"源覆盖率 100%"——老旧 tester 的数据接口未必开放，建议对外表述为"试点线 + 主力机型接入" |
| ROI 三档（¥2500/5000/7500 万收益） | **算术自洽，两个锚点必须实测替换** | ¥70 万/人年（上海封测业合理区间）、¥3.5/颗（\$0.40 锚点+溢价）量级合理；但**基线逃逸 500 DPPM 是纯假设**——它是论证 A（¥1500 万/年）的乘数，汇报前务必用公司实测逃逸率替换重算。P3 满编成本注记已补入文档 |
| 数据分级 L1–L4、训练区不落地终端 | **可落地且必要** | 封测厂手里是客户 IP（客户产品的测试数据），分级管控与审计线是客户审厂的必查项，这套设计是加分项 |

### 4.3 给非半导体背景的你：三个必须内化的行业常识

1. **OSAT 的数据属于客户**。与互联网"数据是自己的资产"不同，封测厂处理的是客户产品的测试数据，出厂数据受质量协议约束。平台越强，越要先过客户合规这一关——这也是为什么自适应放行必须"品质 + 客户"双闸门。
2. **精度指标在产线上会缩水**。WM-811K 上 98.56% 是学术数据集成绩；自家产线的图案分布、噪声、类别定义都不同，直接迁移会掉点。汇报时说"以 WM-811K 为能力基线、产线数据重训后另行评测"，不要承诺数据集精度。
3. **工艺数字保鲜期只有几个月**。HBM 竞争格局月度在变（本次就修掉了多条已过时口径）。每次对外汇报前，把《工艺调研》的"可信度分级"区过一遍：官方确认才进正文，业界口径加注，传闻不上会。

## 5. 汇报答辩要点（最可能被懂行的人挑战的 7 问）

| 问题 | 回答要点 |
|---|---|
| "HBM3E 到底多快？我听说 12.4 Gbps" | JEDEC 上限 9.6 Gbps（≈1.23 TB/s/堆栈）；量产 9.2–9.8；12.4 是无背书的博客口径，我们不用 |
| "Rubin Ultra 到底带多少 HBM？" | 规格仍在变动（GTC 2025 报 384GB → GTC 2026 实机演示 1TB HBM4E）；引数字必标时点与"以量产为准" |
| "混合键合是不是马上替代 TCB？" | 不是。16 层 775μm 限高内 HB 难铺开，SK 海力士 Hot Chips 2026 已表态推迟至 HBM5；HBM4E 仍以 TCB（MR-MUF/TC-NCF）为主 |
| "晶圆图 CNN 99% 有出处吗？" | 可溯源最高 98.56%（Bao 2024）；我们以 98% 设里程碑（M12），且明确这是数据集基线、产线需重训评测 |
| "模型跳过测试项，出了批量事故谁负责？" | 双闸门：内部品质 MRB 唯一放行（模型不能给自己放行）+ 客户质量协议评审；灰度有回退线与抽验复核 |
| "选型为什么不用 MinIO/Kafka 3.7？" | MinIO 官方仓库 2026-04 已归档、社区版功能收缩；Kafka 3.7 已 EOL。按 2026-09 快照选 Kafka 4.x + Ceph，全部版本标了支持线 |
| "500 DPPM 基线哪来的？" | 立项假设，已在文档标注"以实测重校"；PPT 版将替换为公司实测逃逸率并给出三档敏感性 |

## 6. 遗留待核（Blocked / 上会前人工复核）

- **Blocked**：ISSCC 48GB 16-Hi 论文 DOI 卷号（2024 vs 2025）——需 IEEE Xplore 人工确认（订阅墙）
- **Blocked**：WM-811K 批数 46,393 vs 47,543——需 Wu 2015 原文（IEEE TSM）定谳
- 待核：三星 TC-NCF"热阻 −11%"（产品页口径；如需硬出处查三星 ISSCC 论文）；Synopsys VMIN 公开材料；Counterpoint 分季 HBM 份额原报告（如需引用须订阅）
- AEC-Q001 原文为付费标准，本次按文献共识改写表述；汇报如被追问条款号，以公司购买的标准文本为准

## 7. 主要来源（本次核对新增/依据）

- JEDEC：JESD270-4 发布稿（2025-04-16）；Tom's Hardware JEDEC HBM4 解读（2025-04-17）
- SK hynix Newsroom：12 层 HBM3E 量产（2024-09-26）、16 层发布（2024-11-06）、HBM4 开发完成（2025-09-12）、HBM4E 送样（2026-06-18）、2Q26 财报（2026-07-29）、后道工艺系列 KGSD（2023-10）
- 三星（经 StorageNewsletter/澎湃转载）：HBM4 量产（2026-02-18）、GTC 2026 HBM4E 演示（2026-03-19）、HBM4E 送样（2026-05-29）
- Tom's Hardware：Hot Chips 2026 SK 海力士演讲（2026-08-24）、混合键合路线图（2026-09-02）、Rubin Ultra tray（2026-03-17）、HBM 路线图（2025-08-06）、MI325X（2025-01-10）、TSMC/GUC C-HBM4E（2025-12-02）、美光 HBM4E 交 TSMC（2025-09-25）
- 论文/标准：Bao et al. arXiv:2411.11029（2024）；Pan et al. JETTA 40(3) 2024（DOI 10.1007/s10836-024-06125-7）；Selg LATS 2020；Noia & Chakrabarty ITC 2011 + Springer 2014；Wan & McLoone IEEE TSM；Park & You 2023（10.3390/app13095507）；Cunningham IEEE TSM 1990；Stapper IBM JRD 1987；Roehr ITC 2000；Advantest CSTIC 2024（DOI 10.1109/cstic61820.2024.10531864）
- SemiEngineering：Test Costs Spiking（2020-03-10）、Chasing Test Escapes（2021-05-11）、Adaptive Test Gaining Ground（2025-12-09）、HBM Shifts Testing Left（2026-05-12）
- 平台：LinkedIn Kafka 基准（2014-04）、Kafka at LinkedIn（2015-09）、Aiven 基准（2017-03）、endoflife.date（Kafka/Spark/Flink/Prometheus 支持线，2026-09）、GitHub minio/minio（archived，2026-04）、Vantage/instances.vantage.sh（p4d 价格，2026-09）、AWS 定价 API、Lambda 云定价（2026-09）、Databricks medallion glossary、teamtopologies.com/key-concepts
- 公司：落地主体的工商/招聘/供应链公开调研在项目沟通中完成；名称与出处属敏感信息，不入材料

## 8. 2026-09-24 复核增补（二次网络核验）

应用户要求对关键事实做二次核验并留存引用，方法为官方新闻稿直查 + 多家独立媒体交叉，结果见归档文件：[`public/sources/hbm3e-hbm4e/2026-09-24_source-check-addendum.md`](/sources/hbm3e-hbm4e/2026-09-24_source-check-addendum.md)。

- SK 海力士 HBM4E 送样口径（2026-06-18、12 层、16 Gbps、能效 +20%、Advanced MR-MUF 热阻 −17%）：经官方新闻稿 + 朝鲜日报 + Asia Business Daily + HotHardware 四个独立渠道交叉确认，维持 A 级
- SEMI E134（Data Collection Management）、SEMI E164（EDA Common Metadata）标准号在 SEMI 官方商店核对确认
- 广立微 DataExp-YMS 产品口径（CP/FT/WAT/Inline/Defect/WIP 数据分析）经官网确认
- WPFile 未检索到公开格式规范，按厂内/测试机私有格式保守处理；术语对照见《[术语对照与使用指南](/notes/method/terminology-and-usage/)》

## 9. 2026-09-25 聚焦调整增补（HBM 先进封装-3D 封装）

项目从 2.5D 优先调整为 **HBM 先进封装-3D 封装优先**。本轮调整的材料收集与改动留痕：

- 新增材料收集 6 份（全文抓取或官方页索引核验），归档于 [`public/sources/hbm-3d/`](/sources/hbm-3d/)；总目录见《[材料地图](/notes/hbm/materials-map-3d/)》
- 删除《CoWoS：2.5D 封装的旗舰平台》笔记，改写为《[HBM 堆栈的集成环境](/notes/hbm/integration-context/)》（3D 为主、2.5D 为宾；2.5D 相关事实全部保留且带源）
- 《Chiplet 互连》笔记改写为《[HBM 堆栈内外：互连密度阶梯](/notes/hbm/interconnect-density/)》（UCIe 降为堆栈外语境）
- 新增口径冲突记录：HBM4 微凸点 pitch 存在两种媒体口径——Hot Chips 2026 一手口径约 30 μm vs Semiconductor Engineering（2025-12）"HBM4 pad pitch 10 μm"；本项目正文采用 Hot Chips 口径，分歧留痕见 [`sources/hbm-3d/2026-09-25_semiengineering_hbm4-microbumps-postponing-hb.md`](/sources/hbm-3d/2026-09-25_semiengineering_hbm4-microbumps-postponing-hb.md)
- 新增修正：SK 海力士 MR-MUF 长文确认"12 层 HBM3E 散热 +10%"的对比基数为 8 层 HBM3（非 HBM3 12 层版），引用时必须写明基数（A级，官方原文）；HBM2E 散热较 HBM2 +36%、Advanced MR-MUF EMC 热导率 1.6× 为新增可引用官方口径
- 403 说明：TSMC 3DFabric 官方页、JEDEC 新闻稿页直接抓取返回 403（反爬），页面真实存在（搜索引擎索引正文 + 既有归档），引用不受影响

## 10. 2026-09-25 测试模型拆分增补（电路级下钻）

应用户要求把「测试区域 vs GPU 通讯区域」拆为两个独立可下钻模型（各四级，下钻到电路设计与测试程序逻辑），改动与新增证据留痕：

- 新增来源 4 份，归档于 [`public/sources/hbm-test/2026-09-25_ate-pmu-dc-parametric.md`](/sources/hbm-test/2026-09-25_ate-pmu-dc-parametric.md)：ADI MAX9979 设计笔记（PMU 六模式/钳位/量程，全文抓取）、Marvin Test KB Q200207（FVMI/FIMV 两模式与 μA 级灵敏量程，全文抓取）、AD5520/AD5522 手册（每引脚 PMU + 钳位 + 窗口比较器，URL 200）、US5365180A（接触测试：对 pin–GND 二极管加流测压降；专利页本机直连不可达，按搜索引擎索引摘要核验并如实标注）
- 判定链口径：接触开路 → FIMV 加流测压、开路时电压顶到 FI 模式钳位（钳位机制出自 ADI 原文）；「硅 PN 结导通压降约 0.6–0.7 V」按器件物理教科书量级使用，标注 C 级示意；Power Short/Contact/Leakage 三件套与 fail-stop bin 顺序沿用既有归档（Edusemi/三星 EDS/Acco Labs）
- 组件拆分：HBMTest3D 删除，拆为 HBMTestZone3D（测试区域四级：扎针姿态→版图分区→DFT 电路→测量与判定）与 HBMCommZone3D（GPU 通讯区域四级：装配→通道版图→PHY 电路→眼图与测试边界）；原三模式下的全部已核事实保留并重新归位
- 验证：astro check 0 错误、bun run build 通过、Playwright 运行时冒烟（4 画布 0 报错、L3 判定链与 8 通道切换渲染正常）

## 11. 2026-09-25 二次优化增补（穿模修复 + 原理组图）

- 测试区 L0 穿模修复：原实现翻转姿态下爆炸层片沿翻转轴展开，尾部裸片穿过基板/地面；改为抬升量与层距联立求解（lift = FIRST_DIE_Y + (N-1)·(PITCH+e·STEP) + DIE_H/2 + 安全距离，e 为阻尼系数），探针卡/针/线缆/ATE 同步抬升，针尖始终贴住暴露面；几何约束已注释在代码内
- L3 可读性：新增 PMU 数字表头（强制值/读数/限值/PASS-FAIL，随选中失效更新）、①施加→②路径→③读数→④判定四步编号标注、阵列处处置铭牌（fail-stop 淘汰 / 冗余替换→复验）；读数量级保持示意口径
- 新增笔记《[测试电路的三张图](/notes/hbm/test-circuit-diagrams/)》：设计/逻辑/物理三张手绘 SVG 原理图（public/diagrams/test-*.svg）；用户口述「波及电路图」按语音相近理解为「逻辑电路图」，已在交付说明中声明该解释，如有出入以用户后续更正为准；三张图为教学示意，机制描述全部引用既有已归档来源（ADI/Marvin/US5365180A/Edusemi/三星 EDS），无新增外部事实、无杜撰
