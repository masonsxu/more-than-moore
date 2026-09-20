# 来源 9：Siemens Blog — HBM3E 与 HBM4 IC 设计指南

- URL: https://blogs.sw.siemens.com/semiconductor-packaging/2026/04/24/hbm3e-hbm4-ic-design-guide/
- 作者: Emily Yan
- 发布日期: 2026-04-24
- 抓取日期: 2026-09-18

---

## HBM3E key specifications (JEDEC JESD238 系列，文中引用 JESD238B01)

- Interface: 1024-bit, 16 independent channels, 32 pseudo-channels
- Pin speeds: 9.2 to 9.8 Gbps typical, up to 12.4 Gbps in advanced implementations
- Bandwidth: Over 1.2 TB/s per stack (up to 1.33 TB/s)
- Capacity: 24GB at 8-high to 36GB at 12-high stack
- Power efficiency: 2.5X improvement per watt vs. HBM2E
- Interconnect: TSV stacked die architecture
- Power delivery: All-around power TSVs, 6X increase in TSV count, 75% lower IR drop
- Controller compatibility: Backward compatible with HBM3 controllers
- Deployed in NVIDIA H200, AMD MI300 series

## HBM4 key specifications (JEDEC JESD270-4, published April 2025)

- Interface: 2048-bit, 32 independent channels, 64 pseudo-channels
- Pin speeds: 6.4 to 12.8 Gbps, demonstrated up to 13 Gbps by Samsung
- Bandwidth: Over 2.0 TB/s per stack, up to 3.3 TB/s in advanced configurations
- Capacity: Up to 64GB per stack via 16-high stack with 32Gb layers
- Core voltage: 1.05V vs. 1.1V in HBM3/3e; 60% improved efficiency over HBM2/2E
- New reliability feature: Directed Refresh Management (DRFM)
- Controller compatibility: Not backward compatible with HBM3/3e
- HBM4 integrates logic die and turns the memory stack into a co-processor

## Side-by-side

| Specification | HBM3e | HBM4 |
|---|---|---|
| Interface width | 1024-bit | 2048-bit |
| Independent channels | 16 | 32 |
| Pin speeds | 9.2 to 12.4 Gbps | 6.4 to 12.8 Gbps (up to 13 Gbps) |
| Bandwidth per stack | >1.2 TB/s (up to 1.33 TB/s) | >2.0 TB/s (up to 3.3 TB/s) |
| Capacity per stack | Up to 36GB | Up to 64GB |
| Core voltage | 1.1V | 1.05V |
| Power efficiency gain | 2.5X vs. HBM2E | 60% vs. HBM2/2E |
| HBM3 controller compat. | Yes | No |
| Production status | In production | 2026 (Samsung, SK Hynix, Micron) |

## Design considerations

- Signal integrity: >9.2 Gb/s per pin across 1024-bit interface requires PDN design, clock distribution, impedance discontinuity control across base die, interposer and package. HBM4: 2048-bit doubles I/O density; tighter jitter budgets, crosstalk susceptibility, reflection sensitivity across multi-die interconnect paths.
- Thermal: vertical thermal gradients through multiple silicon layers, bonding interfaces, packaging materials; HBM3E requires managing localized hotspots in logic and I/O regions; HBM4 intensifies with I/O density, stack height, power delivery demands.
- Physical: TSVs introduce mechanical stress, layout constraints; wafer thinning, high-aspect-ratio etching, precise copper fill; microbump and hybrid bonding precision yield-critical.
- Packaging: TSMC CoWoS and Intel EMIB support the routing density required for HBM interfaces.
- Roadmap: HBM4 production from Samsung, SK hynix, Micron expected late 2025 to 2026; NVIDIA Rubin and AMD MI455X pull HBM4 into volume; customized HBM4 base die configurations with embedded logic/accelerator circuitry expected as differentiation layer. Beyond: HBM4E and custom HBM signaled by vendors.
