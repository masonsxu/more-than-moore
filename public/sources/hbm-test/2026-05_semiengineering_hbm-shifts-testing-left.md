# HBM Shifts Testing Left To Preserve AI Chip Yield

- 来源：Semiconductor Engineering（Bryon Moyer 执笔的深度报道，采访 Teradyne / FormFactor / Aehr Test / Synopsys / Amkor）
- 页面：https://semiengineering.com/hbm-shifts-testing-left-to-preserve-ai-chip-yield/
- 发表时间：2026-05（正文配图路径 2026/05）；访问日期：2026-09-25

## 关键摘录

### 背景：堆叠良率风险

> Today, HBM accounts for nearly half the cost of AI chips. So a defective memory stack found during final test is an expensive failure, which is why there is an increasing focus on known good stacks (KGS). But stacking dies is an intricate and difficult manufacturing process. Alignment of through-silicon vias (TSVs) to microbumps is measured in microns. The thinning and sawing of wafers introduce mechanical stresses that can exacerbate existing cracks, slips, and scratches. On top of that, thermal compression bonding can cause opens, shorts, and head-in-pillow and high-resistive connections.

> "Data from hyperscalers indicates that HBM failures are the number one cause of GPU failures in data centers," said Faisal Goriawalla, director of product management for SLM at Synopsys. "Studies also indicate that HBM is more prone to faults than traditional DRAM due to its complex vertical stacking, with column failure (e.g., TSV defects) being particularly common. The move from HBM3 to HBM4 will require further evolution in multi-die support. The 2,048-bit memory interface requires a significant increase in the number of TSVs routed through a memory stack. This will mean shrinking the external bump pitch as the total number of microbumps increases significantly."

### 测试插入点与次数

> Both the HBM logic and HBM DRAM dies go through wafer test. Each DRAM will go through multiple insertions — wafer-level burn-in, hot and cold testing, and repair — after which the DRAM wafer is thinned, bumped, and singulated. DRAM dies are then stacked upon the wafer of logic base die and go through a series of test insertions. Depending on the assembly manufacturer's process, the testing could be done after each DRAM die is stacked, or it could be done after 2 or 4 dies are stacked.

> The number of test insertions for a 12-stack die can range from 3 to 12, depending on the assembly house's quality levels.

### 牺牲测试焊盘与探针卡成本

> In specifying the microbump layout for HBM I/O, the JEDEC standard includes space for adding sacrificial test pads.
> "When you use a sacrificial pad and space them out, your probe card becomes much cheaper. You don't need to go spend $500,000 on a probe card. They can save up to 80% on the cost of a probe card. DFT enables quality, but what it really enables is a lower cost approach to wafer-level burn-in," noted Rodgers [Aehr Test].

### base die 是唯一访问路径

> Industry experts emphasize the importance of testing the logic base die because it provides the only access to the memory dies in the stack. … "Consider the stacked die — one base logic, and then 8 to 16 HBM," said Aehr Test's Rodgers. "Making sure that base logic device is of the highest quality is critical, because if it's bad, 16 dies get thrown away. So it's a huge multiplier in the yield curve."

> The logic base die test requirements focus on the DFT circuitry, which enables HBM DRAM test during the stacking process and throughout its lifecycle. This testing relies upon JEDEC-specified direct access [1-3] or IEEE 1500 [4] using a limited number of pads or microbumps. Applying test content at logic wafer test ensures there are no defects in the internal logic, circuitry for IEEE 1500, direct access bus, memory built-in self-test (MBiST), internal logic, TSV connectivity, and PHY circuitry.

### PSWT 扎针位置与堆栈测试

> The current approach for testing stacked die is pre-singulation, probing the backside of the logic base die on aluminum pads for which there is a specified space amid the layout of microbumps. As such, the ATE needs the instrumentation to test both logic and memory, and with up to 128 test sites for parallel test, the power delivery demand is significant.

> After the DRAM is stacked on base die, testing the core memory can be done with the logic base die's MBiST (often programmable) or a direct access bus. Repair for defective TSVs occurs during each test insertion.

> Stacked die testing requires alignment accuracy at the single-digit micron level. [FormFactor Tran]
> From generation HBM3 to HBM4, the power increase is likely to be more than 2X. [Teradyne Lai]
> Shrinking pad geometries can be addressed with advanced MEMS probe technologies… New speed and power requirements in HBM4 and HBM5 demand data transfer rates exceeding 10 Gbps in future generations, and power levels of up to 100 watts per HBM stack. [FormFactor Tran]

### 诊断粒度与 PPR

> The diagnostics performed by the BiST engine must be precise, showing the failing bank, row address, column address, etc., if there is a defect detected in the DRAM stack. [Synopsys Goriawalla]
> It may also need to support post-package repair (PPR) for HBM DRAM to delay any 'truck roll-out' for in-field service.

### 参考文献（原文脚注）

1. HBM JEDEC: https://www.jedec.org/standards-documents/docs/jesd235a
2. HBM3 JEDEC: https://www.jedec.org/system/files/docs/JESD238B.01.pdf
3. HBM4 JEDEC: https://www.jedec.org/system/files/docs/JESD270-4A.pdf
4. IEEE 1500: https://standards.ieee.org/ieee/1500/7704/
