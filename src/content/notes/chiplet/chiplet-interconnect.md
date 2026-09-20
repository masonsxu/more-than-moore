---
title: 'Chiplet 互连：UCIe 与 D2D 接口'
description: '为什么 die-to-die 互连放弃长距 SerDes：UCIe 的速率档位、bump pitch、能效量级，以及混合键合的下一步。'
date: 2026-03-05
tags: ['Chiplet', 'UCIe', 'D2D', '异构集成']
---

## 为什么要切 Chiplet

单片大芯片（monolithic）撞上两面墙：

1. **良率**：缺陷密度固定时，良率随裸片面积非线性下跌。泊松/负二项模型下，$Y \approx (1 + A D_0 / \alpha)^{-\alpha}$——面积翻倍不是良率减半，是断崖。
2. **光刻 reticle**：单次曝光上限 26 mm × 33 mm（≈858 mm²），再大就要拼版。

切小后再拼（2.5D/3D），牺牲的是 die 间互连带宽与功耗——所以 D2D 互连标准是 chiplet 生态的根。

## UCIe 要点

UCIe（Universal Chiplet Interconnect Express）是主流 D2D 互连标准（1.0 版要点）：

| 维度 | 数值 | 说明 |
|---|---|---|
| 信号速率 | 4–32 Gt/s | 远低于长距 SerDes（数十 Gbps），换取低功耗 |
| bump pitch（先进 2D 封装） | 25–45 μm | 标准封装 100–150 μm |
| 能效 | 亚 pJ/bit 量级 | 长距 SerDes 约 2–5 pJ/bit |
| 互连距离 | 封装内 | 依赖 2.5D interposer 或有机基板 |

设计逻辑：die 间距离只有几毫米、误码环境可控，就把均衡器、重定时这些"长距税"全砍掉，用并行宽接口换带宽密度——比 PCIe 类串行方案高一个数量级。

## 协议栈分层

- **PHY 层**：物理通路（驱动器、接收器、时钟前传）；
- **D2D 适配层**：链路重试、CRC、流量控制（把不可靠物理层包装成可靠链路）；
- **协议层**：直接映射 PCIe/CXL 等上层协议，兼容既有软件生态。

## 混合键合：下一档密度

micro-bump 的 pitch 下限约在 10–20 μm（凸点自身有体积）；Cu-Cu 混合键合（Hybrid Bonding）去掉凸点，pitch 直接进亚 10 μm：

- 现状：TSMC 量产 6 μm，2029 年规划 4.5 μm（Tom's Hardware 2026-09 路线图口径）；
- 制约：对 CMP 平坦度、颗粒污染极敏感，键合机台成本高（首套量产 inline 系统约 200 亿韩元 ≈ $15M）；
- 在 HBM 上的应用节奏：SK 海力士 Hot Chips 2026 表态混合键合推迟到 HBM5，16 层堆叠仍在 775 μm 高度上限内用 TCB 路线解决。

## 案例

- AMD EPYC：多计算 die + IO die；
- Apple M1/M2 Ultra：两颗 die 经 UltraFusion 拼接；
- Intel Ponte Vecchio：计算/缓存/HBM tile 多工艺混合堆叠。
