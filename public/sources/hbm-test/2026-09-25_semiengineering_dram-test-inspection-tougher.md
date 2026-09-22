# DRAM Test And Inspection Just Gets Tougher

- 来源：Semiconductor Engineering（Ann Steffora Mutschler，采访 Advantest / Neumonda / Teradyne / Keysight / Onto / Bruker / Synopsys / Aehr Test）
- 页面：https://semiengineering.com/dram-test-and-inspection-just-gets-tougher/
- 发表时间：以页面为准（正文引用 A. Meixner 配图）；访问日期：2026-09-25

## 关键摘录

### 两速测试插入

> Engineers use two insertions to manage the long test times for enormous DRAM arrays and the requirements for high-speed interfaces. In the first, all the memory test algorithms are applied at lower speed. For the second (a.k.a., known good die) the die's high-speed interface is utilized, and memory test algorithms are run at operational speeds. These two insertions are performed during wafer test, and both may be repeated for package test.

> "Wafer tests are conducted at relatively low frequencies of around 100MHz to identify weak cells and then repair them. For cost reasons, parallelism needs to be high and is achieved by about four touchdowns per wafer," said Neumonda's Pöchmüller. "This requires high-cost probe cards with 20,000 needles and with 2.5g per needle. It adds a high pressure of about 50kg per wafer. KGD tests require higher-speed arrays and full-speed testing at the back end, which needs to be executed through the probe card. This requires low parallelism and high-speed probe cards. For this reason, KGD typically doesn't support the highest speed classes."

### 内存 ATE 的特殊性

> "The major difference is that ATE solution for memory needs to equip APG (algorithmic pattern generator) and fail capture memory (or error catch RAM) to store fail information," said Advantest's Oda. "At wafer sort, failure analysis for memory repair is a must, and a key for process feedback purposes. The memory repair analysis on-the-fly is very high computing power."

### 冗余修复

> Decades ago, these realities prompted design engineers to add spare rows and columns, and the associated methods to execute repairs during testing. At wafer level, repair can be performed by a laser or electric fusing (e-fuse), but only e-fuse can be done at the package level. Error correction code (ECC) circuitry can manage single-bit failures during manufacturing test and system use. The chip area devoted to repair can be anywhere from 5% to 10% of the total area.

> In the past decade, JEDEC DRAM standards defined a post-package repair (PPR), which provides one row repair per bank. [3]

### HBM 堆叠的检查与测试

> The HBM interface offers significantly higher data rates at lower power. It was designed as a wide interface (1,024 lanes), to be used in 2.5D and 3D package solutions. Yet the bump-pitch size and numerous connections for stacked die necessitate a lane repair option to accommodate faulty bonding between dies. … This necessitates specific test strategies to find failing lanes and enable lane repair which DFT facilitates.

> For micro-bumps, CD and height metrology is required, along with residue defect detection in the bump top. For direct bonding, inspection is needed to detect cracks, voids, and delamination. [Onto Peng]

> "With vertical stacking, die placement accuracy is critical to monitor and maintain. Excess shift causes bumps to stretch and disconnect, resulting in non-wets. Equally important is the compression which is measured as the bond line thickness (BLT). A large BLT can result in non-wets and small BLT can result in solder squeeze out. In some cases, the solder gets squeezed all the way out." [Bruker Chen]

> As part of known good die expectations, test flows typically screen defective TSVs prior to die-thinning steps. Then, once the bonds between all the stacked dies are connected, they can be inspected and tested. Inspection plays a role in assessing bonding quality, die alignment (overlay), and die warpage.

### 多芯堆栈的诊断

> "Also, HBM presents a challenge, as you cannot separately test logic die and memory die. You must test the two together. You need to test the interconnect between them. With this stack of die you need to be able to access it, which IEEE standard 1500 enables. And then, of course, your diagnosis needs to differentiate and isolate to do physical failure analysis. The DRAM-based engine needs to be on the logic chiplet. … In the test mode, it takes control of the PHY to run read/write instructions through the PHY to test the external memory and interconnect." [Synopsys Goriawalla]

### 匹配与追溯

> The best example is matching memory performance to the performance of the other chips in a package. This is a must. The consequences of placing a slow memory chip in a high-performance package could result in a downgrade of the entire package. [Onto McIntyre]
