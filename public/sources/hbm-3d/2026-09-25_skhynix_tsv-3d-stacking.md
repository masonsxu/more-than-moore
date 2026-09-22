# 来源摘录：SK 海力士官方技术文章——TSV 是 3D 堆叠与 HBM 的基础技术

- 抓取日期：2026-09-25（全文抓取，URL 返回 200）
- 标题：Creating New Values in DRAM Using Through-Silicon-Via Technology for Continued Scaling in Memory System Performance and Capacity
- 作者：Uksong Kang（SK hynix DRAM Product Planning 负责人，VP）
- URL：https://news.skhynix.com/en/creating-new-values-in-dram-using-through-silicon-via-technology-for-continued-scaling-in-memory-system-performance-and-capacity/
- 用途：`/notes/hbm/tsv-basics/`、`/notes/hbm/materials-map-3d/` 的 TSV 论断证据层

## 原文摘录（关键句）

1. TSV 定义与角色：
   > "Through-Silicon-Via (TSV) in memories has emerged as an efficient foundational technology for capacity expansion and bandwidth extension. It is a technology where vias are perforated through the entire silicon wafer thickness, in order to form thousands of vertical interconnections from the front to the back-side of the die and vice versa."

2. DRAM 行业 TSV 的两大量产用例：
   > "Today, there are two main use cases in the DRAM industry, where TSVs have been successfully productized to overcome capacity and bandwidth scaling limitations. These are 3D-TSV DRAM and High-Bandwidth-Memory (HBM)."

3. HBM 与 SoC 的集成方式（硅中介层、同封装）：
   > "HBM is an in-package memory where it is integrated with a SoC through a silicon interposer inside the same package. This allows it to overcome the maximum number of data I/O package pin limitations, which would otherwise exist in conventional off-chip packages."

4. 后续挑战（pitch/直径/深宽比/减薄）：
   > "In the future, however, decreasing the TSV pitch/diameter/aspect-ratio and the die thickness, while still maintaining high assembly yields, will become more challenging and essential for continued future device performance and capacity scaling."

5. 12 层以上堆叠的前置条件：
   > "Such improvements will allow decreased TSV loadings, reduced TSV relative die size portions, and the extended number of stacks beyond 12Highs while still maintaining the same total physical stack height."

## 可引用论断

- TSV 是 HBM 与 3D-TSV DRAM 的共同物理基础（厂商官方口径，A级）
- HBM 与 SoC 通过硅中介层在同一封装内集成——注意这是该文（HBM2E 时代，~2020）的表述；HBM4 世代起 bridge 类方案（EMIB 等）也成为量产选项，引用时标注时点
- 12 层以上堆叠要求 TSV pitch/直径/深宽比与裸片厚度同步微缩（厂商官方口径）
