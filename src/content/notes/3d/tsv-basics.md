---
title: 'TSV 硅通孔基础'
description: '穿透硅片的垂直铜互连：制造顺序（via-first / via-middle / via-last）、典型参数与热失配应力量级估算。'
date: 2026-02-20
tags: ['TSV', '3D 集成', '工艺']
---

## 定义与作用

TSV（Through-Silicon Via，硅通孔）是穿透硅裸片/中介层的垂直铜互连，是 3D 堆叠和 2.5D 中介层的物理基础：没有 TSV，堆叠上层的裸片只能靠边缘走线（wire bonding）连接，带宽和密度都上不去。

## 典型参数（行业通用量级）

| 参数 | 典型值 | 备注 |
|---|---|---|
| 直径 | 5–10 μm | HBM 堆栈内部 TSV 更细 |
| 深度 | 50–100 μm | 受晶圆减薄能力约束 |
| 深宽比 | ~10:1 | DRIE（Bosch 工艺）能力范围 |
| 填充 | 铜电镀（ECD）+ CMP | 需阻挡层/种子层防铜扩散 |

## 制造顺序

1. **via-first**：前道工艺前成形，热预算受限，应用少；
2. **via-middle**：FEOL 之后、BEOL 之前成形，主流方案（interposer 与 HBM 逻辑 die 多用此序）；
3. **via-last**：BEOL 之后从背面开口，配合减薄 + 深反应离子刻蚀，C4/凸点工艺集成度高。

关键工序链：深反应离子刻蚀（DRIE）→ 侧壁绝缘（SiO₂ 沉积）→ 阻挡层/种子层（PVD）→ 铜电镀填孔 → CMP 平坦化 → 晶圆减薄 + 露头。

## 热失配：TSV 的物理代价

硅 CTE ≈ 2.6 ppm/K，铜 ≈ 17 ppm/K。以工艺后冷却 ΔT = 200 K 估算热失配应变量级：

$$
\Delta\varepsilon = (\alpha_{Cu} - \alpha_{Si}) \cdot \Delta T \approx (17 - 2.6) \times 10^{-6} \times 200 \approx 2.9 \times 10^{-3}
$$

约 0.3% 的失配应变在 TSV 周围形成应力区，布局上需要 keep-away zone（行业经验约 10–25 μm 内不放敏感器件），这也是 TSV "引入机械应力与版图约束" 的具体含义。

## 在 HBM 中的角色

- HBM 每层 DRAM 裸片靠 TSV 连成整体堆栈的 I/O；
- HBM3E 引入 all-around power TSV 后供电 TSV 数量增至约 6 倍，IR drop 降低最高 75%（Siemens 汇总口径）；
- 12 层 HBM3E 的实现方式之一是把单颗 DRAM 裸片做薄 40%，在总厚度不变的前提下多塞 50% 容量——TSV + 减薄是层数竞赛的底座。
