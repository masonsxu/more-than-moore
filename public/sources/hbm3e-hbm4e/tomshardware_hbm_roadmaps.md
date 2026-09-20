# 来源 8：Tom's Hardware — 美光/三星/SK 海力士 HBM 路线图（至 HBM4 及以后）

- URL: https://www.tomshardware.com/tech-industry/semiconductors/hbm-roadmaps-for-micron-samsung-and-sk-hynix-to-hbm4-and-beyond
- 发布日期: 约 2025 年（早于 2026 年实际进展，部分预测已被更新事实覆盖，注意区分）
- 抓取日期: 2026-09-18

---

## Speeds and feeds

- HBM uses a very wide interface — 1024 bits for HBM2/HBM3, 2048 bits with HBM4 — multiplying bandwidth up to 4–8 TB/s. Wide interface makes HBM difficult to produce: multiple specialized DRAM devices interconnected using TSVs stacked on a base die. Terminology: 8-Hi = eight stacked dies, 12-Hi = twelve stacked dies.

## 12-Hi HBM3E

- High-end accelerators (Nvidia H200 141GB, B200 192GB, AMD MI300X 192GB) use 24GB 8-Hi HBM3E stacks based on 24 Gb DRAM devices. Next step: 36GB 12-Hi HBM3E for Nvidia B300 and AMD MI325X.
- SK hynix began mass production of 36GB 12-Hi HBM3E; Micron sampled since September [2024]. Samsung was late with 8-Hi certification and 12-Hi suffered a slight delay — likely caused by sticking with 1α fabrication technology, unlike Micron and SK hynix which use 1β (5th-gen 10nm-class) for HBM3E DRAM.

## HBM4: 2048-bit I/O and up to 16 layers

- Preliminary HBM4 spec (July 2024): 2048-bit interface; 24 Gb and 32 Gb DRAM layers at up to 6.40 GT/s; supports 4-Hi/8-Hi/12-Hi/16-Hi.
- HBM4E may boast interface speeds around 9 GT/s（早期预测口径；2026 年实际官方口径为 14–16 Gbps，注意本文写作时间较早）.
- HBM4E enables customizable base dies (additional functions: enhanced caches, custom interface protocols).

## Production nodes（预测口径，与 2026 年事实对照）

- 无厂商在 HBM4/HBM4E 路线图上采用 32 Gb 器件（注：2026 年实际——三星与 SK 海力士 HBM4E 均已用 32Gb 裸片，此预测已过时）。
- Micron expected to keep 1β for HBM4 24Gb ICs; Samsung to transition to 1γ (6th-gen 10nm-class) with HBM4/HBM4E; SK hynix to use 1β for HBM4 and may transition to 1γ for HBM4E.
- HBM4/HBM4E base dies from logic manufacturers: TSMC and SK hynix first disclosed TSMC 12FFC+ and N5 base dies for HBM4; Micron likely TSMC (unconfirmed); Samsung expected to use its own foundry nodes.
- Layers: Micron lists 12-Hi and 16-Hi for HBM4/HBM4E; Samsung and SK hynix may go straight to 16-Hi HBM4. By HBM4E, layer count may exceed 16 — rumors of 20-layer design among Korean manufacturers (grain of salt).
- Timeline (as projected in this article): first HBM4 offerings (samples) around Q3 2025 (Samsung/SK hynix), Q4 2025 (Micron); mass production of processors supporting HBM4 in 2026; Micron official roadmap: HBM4E late 2027. HBM4E likely used in the generation after Nvidia Rubin and AMD MI400 (both HBM4 in 2026).
