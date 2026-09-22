# 来源摘录：TSMC 官方页面——CoWoS 与 SoIC（HBM 的宿主与前端 3D 平台）

- 核验日期：2026-09-25（官方页面经搜索引擎索引确认存在；直接抓取返回 403 反爬，引用以官方页原文为准）
- 用途：`/notes/hbm/integration-context/` 的集成环境论断证据层

## TSMC CoWoS 官方页

- URL：https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/cowos.htm
- 官方原文（搜索引擎索引摘要）：
  > "TSMC's world-leading CoWoS advanced 2.5D packaging technology provides the essential foundation for high-performance computing (HPC) and artificial intelligence (AI) products. By integrating multiple SoCs and high-bandwidth memory stacks, CoWoS empowers products with high-performance compute and memory bandwidth. CoWoS-S can accommodate an interposer up to 3.3X-reticle size (or ~2700mm2). CoWoS-L or CoWoS-R are recommended for..."

## TSMC SoIC 官方页

- URL：https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/SoIC.htm
- 官方原文（搜索引擎索引摘要）：
  > "TSMC-SoIC is an innovative wafer-level 3D IC chip stacking platform... SoIC integrated chips can be subsequently assembled by using conventional packages or new TSMC 3DFabric technology services, such as CoWoS or TSMC-SoW, for next-generation high-performance computing (HPC), artificial intelligence (AI), and mobile applications."

## TSMC 3DFabric 总览页

- URL：https://3dfabric.tsmc.com/english/dedicatedFoundry/technology/3DFabric.htm
- 官方原文（搜索引擎索引摘要）：
  > "TSMC 3DFabric is the Company's comprehensive family of 3D silicon stacking and advanced packaging solutions... TSMC 3DFabric solutions consist of both frontend and backend technologies, including TSMC-SoIC, CoWoS, and InFO."

## 可引用论断

- TSMC 官方把 CoWoS 定位为集成"SoC 与 HBM 堆栈"的 2.5D 平台——即官方叙事中 HBM 堆栈是集成对象、CoWoS 是集成环境（A级，厂商官方页）
- CoWoS-S 中介层最大支持约 3.3 倍 reticle（~2700 mm²）——突破单片光刻 reticle（26×33 mm）限制靠拼接
- SoIC 是 3D 前端堆叠平台（逻辑芯片堆叠），与 CoWoS（2.5D 后端集成）在 3DFabric 家族内互补
- TSMC SoIC 键合 pitch 量产 6 μm、2029 年路线 4.5 μm（Tom's Hardware 2026-04-29 与 2026-09-02 报道口径，URL 见主调研来源 21）：
  https://www.tomshardware.com/tech-industry/semiconductors/tsmc-soic-3d-stacking-roadmap-outlines-path-from-6-micron-pitches-today-to-4-5-micron-in-2029-fujitsus-monaka-cpu-to-benefit-from-face-to-face-chiplet-stacking
