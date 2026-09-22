# 来源摘录：ServeTheHome 现场报道——SK 海力士 Hot Chips 2026 HBM 封装演讲

- 抓取日期：2026-09-25（全文抓取，URL 返回 200）
- 标题：SK hynix HBM Packaging at Hot Chips 2026
- 作者：Patrick Kennedy（ServeTheHome）
- URL：https://www.servethehome.com/sk-hynix-hbm-packaging-at-hot-chips-2026/
- 用途：`/notes/hbm/hbm-generations-3d/`、`/notes/hbm/integration-context/`、`/notes/hbm/materials-map-3d/` 的堆叠结构论断证据层

## 原文摘录（关键事实，均对应演讲 slide）

1. HBM 是 3D 堆叠结构（base die + 至多 16 片 core die）：
   > "SK hynix began by explaining that HBM is a 3D-stacked structure comprising a base die and a stack of core dies, up to 16 slices in total. GPU and HBM sit together on a silicon interposer in a 2.5D package and communicate via 1024 IOs across 16 channels, with four slices per rank and four ranks in a 16-high stack."

2. HBM4 世代堆栈的量化规格（12.8×11 mm、775 μm 高度、TSV 与凸点数）：
   > "HBM4 has more TSVs and micro-bumps. SK hynix lists over 20K TSVs and 16148 base micro-bumps on a 12.8×11 mm part with a 775 um Z-height, targeting more than 2 TB/s of bandwidth with a 40+ percent power-efficiency gain and improved thermal resistance. Capacity climbs to 48 GB, with 12-high in production and 16-high under qualification."

3. TC+NCF vs MR+MUF 的官方取舍表述：
   > "TC+NCF offers high productivity and low thermal resistivity but is sensitive to chip warpage, while MR+MUF handles thin-die warpage better at the cost of higher thermal resistivity and a narrower gap-fill window."

4. KGSD 晶圆级测试流程：
   > "SK hynix runs a full wafer-level flow behind HBM assembly, from silicon etch and TSV copper fill through BEOL metallization, wafer thinning, back-side processing, singulation, and testing. A known-good stacked die (KGSD) wafer step allows SK hynix to test each cube before it reaches system-level packaging, preventing defective units from consuming costly interposer real estate."

5. HBM3E 16 层的工程手段（厚度/间隙/凸点 pitch 近乎减半）：
   > "SK hynix had to cut chip thickness, gap height, and bump pitch roughly in half to fit the taller stack while keeping gap-fill quality intact."

6. 混合键合工艺机理（室温贴合 + >200°C 退火）：
   > "Pick and place occurs at room temperature, and an anneal above 200C forms SiO2-to-SiO2 and Cu-to-Cu bonds, which is the mechanism that enables the stack to shed the bumps and gap-fill of older approaches."
   > "At a fixed Z-height, hybrid bonding allows the die to use a thicker core and pushes bump pitch below 18 um, which MR-MUF cannot manage."

7. i-HBM 内嵌散热与 PDN 改善：
   > "Its i-HBM embeds a high-thermal-conductivity, electrically insulating cooling component within the hot die-to-die PHY area to create a dedicated heat path, targeting a reduction in thermal resistance of over 30 percent."
   > "SK hynix highlights a 75 percent PDN improvement across recent HBM generations as the low-power logic approach keeps scaling."

8. 组装顺序反转（先进封装时代 HBM 先装）：
   > "In advanced packaging for AI, HBM is now assembled first, which puts the cubes and the interposer under much stronger reliability pressure before the rest of the package is built."

9. 封装平台对照（CoWoS-S / CoWoS-L / EMIB 对堆栈应力不同）：
   > "SK hynix is now comparing the major advanced packaging approaches, including CoWoS-S, CoWoS-L, and EMIB, and where each puts stress on the HBM cubes and the silicon interposer."

## 可引用论断

- HBM = base die + core die 堆叠的 3D 结构，16 层为当前上限（厂商演讲一手口径，A级）
- HBM4 世代量化规格：>20K TSV、16148 个 base micro-bump、775 μm、12.8×11 mm（A级，演讲 slide 数据）
- 混合键合可把 bump pitch 压到 18 μm 以下（MR-MUF 做不到）——注意与 2026-09-02 Tom's Hardware 路线图口径（HBM4 微凸点约 30 μm）分属不同维度：18 μm 是 HB 的可达 pitch，30 μm 是 HBM4 微凸点现状
- 2.5D（CoWoS-S/L、EMIB）在 SK 海力士叙事中是 HBM 的"系统集成环境"而非主体——与本项目"3D 为主、2.5D 为宾"的聚焦一致
