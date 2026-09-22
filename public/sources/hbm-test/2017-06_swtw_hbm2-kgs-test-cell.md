# Verification of Singulated HBM2 stacks with a KGS Test Cell

- 来源：SWTest Workshop 2017，论文 S09_01（Nhin / Armstrong / Kiyokawa）
- 作者单位：FormFactor、Advantest；致谢名单含 SK hynix（Kim Wangki、Seo JaeHyoung）
- 原文 PDF：https://www.swtest.org/swtw_library/2017proc/PDF/S09_01_Nhin_SWTW2017R2.pdf
- 访问日期：2026-09-25

## 关键摘录

### HBM 流程与测试插入点（Page 4）

> HBM Flow and KGSD Test Challenges — Post-stack Wafer Test (PSWT) Test Pad @Test Mode Flip Dicing & Debonding Shipment wafer test stack & Mold memory core logic Wafer/TSV process Thinning & Bump formation Flip wafer test Wafer/TSV process Thinning & Bump formation Flip dicing
> Key Challenges: o Handling of bare stack die o Thermal movement o Contact stability at elevated temperature o Micro-bump "coining" behavior at high temp
> KGS Verification on μBump @Speed Test

（注：流程为 memory core 与 logic 两条晶圆线各自 wafer test → thinning & bump，堆叠键合后做 PSWT。）

### KGS 测试目标（Page 5）

> Contact all micro-bumps on HBM stacks to allow native mode functional and performance testing on all eight memory channels.
> Support at-speed testing > 2.4Gbps.
> Supports extreme temperature testing.
> Reliable contact to ~4,000 micro-bumps with a pitch of 55um.

### JEDEC HBM2 版图凸点普查（Page 6）

> JEDEC HBM2 Layout Configuration — HBM Array Structure
> Total TSV Micro Bumps: 3990 − 55μm Micro Bump Pitch (27.5 x 48um staggered)
> Total IO Micro Bumps: 1728
> Direct access micro bumps: 176
> Total Power Supplies: 3 − 1056 [power micro bumps]
> Total ground Micro Bumps: 1030
> Array size – 6022μm x 2832μm
> Test requirement – 2.133 Gb/s Functional test of the stack – All 8 device channels

### 扎痕（scrub mark）实测（Page 10–11）

> uBump Diameter: 25um, Over Drive: 60um
> Ambient：接触 6 秒 1 次 scrub 深度 0.87 μm / 2 次 1.72 μm；接触 600 秒 1 次 2.61 μm / 2 次 2.99 μm；scrub 直径 10.86–15.04 μm
> 105 degC：1 次 6 秒 1.66 μm / 2 次 1.84 μm；600 秒 1 次 2.80 μm / 2 次 3.86 μm；scrub 直径 14.34–18.71 μm
> The scrub becomes deeper as the number of contacts increases. The scrub becomes deeper as the test time becomes longer. / The scrub becomes deeper as the temperature becomes higher.

### 8 通道同步测试的眼图观察（Page 13）

> 1ch drive vs 8ch simultaneous drive actual result @ 2Gbps — With data activity on just one memory channel the output data eye width is quite large. With data activity on all eight memory channels the output data eye shrinks.

### 结论（Page 15–16）

> Advantest together with FormFactor developed a production worthy tool for confirming Known-Good Memory Stacks with ~4,000 micro-bumps and < 60um bump pitch… The solution contacts to all eight HBM channels simultaneously enabling native mode performance and functional testing of these complex devices.
