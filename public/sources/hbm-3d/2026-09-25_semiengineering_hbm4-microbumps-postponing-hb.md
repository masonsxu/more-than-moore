# 来源摘录：Semiconductor Engineering——HBM4 延续微凸点、混合键合推迟

- 抓取日期：2026-09-25（全文抓取，URL 返回 200）
- 标题：HBM4 Sticks With Microbumps, Postponing Hybrid Bonding
- 作者：Mark LaPedus（Semiconductor Engineering）
- URL：https://semiengineering.com/hbm4-sticks-with-microbumps-postponing-hybrid-bonding/
- 受访方：UMC（Pax Wang）、Brewer Science（Hamed Gholami Derami）、ASE（Vikas Gupta）、yieldWerx（Aftkhar Aslam）
- 用途：`/notes/hbm/interconnect-density/`、`/notes/hbm/integration-context/`、`/notes/hbm/materials-map-3d/` 的键合路线论断证据层

## 原文摘录（关键事实）

1. JEDEC 高度上限 720→775 μm 是 HBM4 免用混合键合的直接原因：
   > "Until recently, JEDEC had specified a maximum stack height of 720µm, and that wasn't high enough to allow 16 layers... JEDEC revised the module height limit from 720µm to 775µm, which affords enough room to allow microbump bonding for HBM4."

2. 裸片厚度现状：
   > "The die thickness is constantly decreasing (currently at 30 to 50μm) along with a decrease in bump height, die-to-die distance, and TSV pitch size to accommodate the height limitation."（Brewer Science）

3. 微凸点 pitch 的演进与混合键合的经济性门槛：
   > "Microbump pitch historically has been in the range of 40µm, but with HBM4, that pitch will be moving closer to 10µm."
   > "Current techniques work for pad pitches down to around 10 µm, so using hybrid bonding at that pitch wouldn't make economic sense. The HBM4 pad pitch is 10µm, which also supports a hybrid-bonding delay."

4. 主流量产键合方式（ASE）：
   > "Currently, mass reflow (MR) with molded underfill, and thermocompression bonding (TCB) using non-conductive film are the primary chip-to-chip stacking assembly methods."

5. 混合键合的测试难题（颗粒污染、表面平整化）：
   > "Hybrid bonding requires a very clean surface because no particles are allowed on the bonding interface. Testing is a particle source."（UMC）
   > "We use surface planarization to repair the overall interface before bonding."（UMC）

6. face-to-face HB 配对 + back-to-back 微凸点的混合方案：
   > "Companies are exploring a solution where DRAM dies are face-to-face hybrid bonded, and these bonded pairs will be stacked back-to-back using microbumps."（Brewer Science）

7. 定制 base die 与能耗：
   > "Hybrid bonding has an order of magnitude lower energy per bit as compared to current microbump solutions."（ASE）
   > "With HBM4, companies are expected to specify custom base dies to better align the stack behavior with specific applications."

## 口径冲突标注（不采信单一来源）

- 本文称 "The HBM4 pad pitch is 10µm"；而 SK 海力士 Hot Chips 2026 演示（Tom's Hardware 2026-08-24 与 ServeTheHome 现场报道口径）给出 HBM4 微凸点约 30 μm、HB 可达 <18 μm。两者分属不同定义（焊盘 pitch vs 凸点间距）且为媒体转述/演讲口径差异。本项目正文采用 Hot Chips 一手口径（HBM4 微凸点约 30 μm），本文 10 μm 仅作为"媒体口径存在分歧"的记录，引用时必须标注来源与时点。

## 可引用论断

- JEDEC 高度上限 720→775 μm 修订直接决定了 HBM4 可继续用微凸点（多受访方一致，B级媒体综述）
- 混合键合推迟是经济性 + 工艺成熟度问题，不是方向问题；HBM5 为量产预期世代（B级）
- 混合键合把测试变成颗粒污染源，需要"测试 + 表面修复"的特殊流程（B级，UMC 具名引语）
