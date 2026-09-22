# Innovations in Testing for Truly Known Good High Bandwidth Memory Stacks（Die Carrier 方案）

- 来源：SWTest Conference 2025 海报 P01_04
- 作者：Alan Liao（FormFactor）、Hiromitsu Takasu（Advantest）
- 原文 PDF：https://www.swtest.org/library/2025proc/pdf/P01_04_%20LIAO_SWTest-2025.pdf
- 访问日期：2026-09-25

## 关键摘录

### 测试插入点与流程图

> Typical HBM Test Insertion — Pros & Cons on KGD PAD
> Known Good Stack Wafer Test Flow / Known Good Stack Die Test Flow: DC & Simple Function Test → Cold & Hot Temp Test → High Freq Test
> 流程节点：Memory core：Wafer/TSV process → Wafer test → Thinning & Bump；Base Logic：Wafer/TSV process → Wafer test；Stack & Mold → KGS Test: Post-stack Wafer Test → Thinning & Bump → dicing（→ Die Carrier 单颗堆栈测试）
> Package final test is necessary, but provides limited insight to improve performance & yield. Ideally, each component is good before integration — Nirvana is Known Good Die (KGD), just test everything. Economics may dictate something shy of KGD.

### DFT 焊盘 vs micro-bump 直接扎针

> DFT Pads 48um / 55um Micro Bump
> Micro-bump probing test — Pros: All 8ch simultaneously test can be executed. Test close to actual usage conditions. Cons: Deep bump coining unusable in production. Small number of parallel test due to many I/O pins.
> DFT pad probing test — Pros: Do not damage Micro-bumps. Big number of parallel test can be executed. Cons: Test different from actual usage conditions.

### Die Carrier（单颗堆栈测试）方案

> Die Carrier (Interposer, Lid, Probe) — Contact to HBM device: MEMS Probe; Contact to test socket: Interposer
> Compatible with T11 series probe; Offer same high-speed performance as HFTAP; Cold and Hot temperature capability; HBM KGD test capability up to 4GHz
> Alignment accuracy: less than ± 1.4um；4σ: less than ± 3um（视觉对准验证结果）
> Thermal: Parallelism 64, Heat generation 15W, temperature 105℃, Tj rise (all Die) ≦ 3℃（memory handler 冷风吹扫）

### 测试效率

> Test efficiency: 90% 80% 70%（逐级淘汰） vs 100% 100% 100%（*reject a failure die between the test steps and keep efficiency）
> Singulated die testing allows full-speed, multi-temperature screening before stacking. One-time contact via die carrier achieves complete test coverage (DC, functional, etc.) in a single insertion.
