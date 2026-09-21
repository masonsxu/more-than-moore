# 来源核验增补 · 2026-09-24（二次网络核验）

- 核验动机：应用户要求，对笔记引用的关键事实做二次核验并留存引用，防止无出处引用
- 核验方式：官方新闻稿直查 + 多家独立媒体交叉；标准号在 SEMI 官方商店核对
- 与主文档关系：《数据核对与落地评估报告》（2026-09-19）的增补，不推翻任何既有判定

## 1. SK 海力士 12 层 HBM4E 送样（维持 A 级，多源确认）

| 论断 | 结果 | 依据 |
|---|---|---|
| 2026-06-18 开始向主要客户供应 12 层 HBM4E 样品 | 确认 | SK hynix Newsroom 官方新闻稿（发布时间 2026-06-18 09:16:18）：https://news.skhynix.com/en/sk-hynix-ships-samples-of-12-layer-next-gen-hbm4e-2/ |
| 引脚速率最高 16 Gbps | 确认 | 同上官方稿："Achieves a maximum speed of 16Gbps per pin"；HotHardware 独立报道标题：SK Hynix Fires Back In The AI Memory Race With Next Gen 48GB HBM4E（16Gbps / 4TB/s）：https://hothardware.com/news/sk-hynix-sampling-hbm4e-16gbps-4tb-second |
| 能效提升 >20% | 确认 | 官方稿："boosts power efficiency by over 20%"；朝鲜日报英文版同口径 |
| Advanced MR-MUF，12 层实现 48GB、热阻降低约 17% | 确认 | 官方稿原文摘录："SK hynix utilizes Advanced MR-MUF technology for HBM4E products to achieve a 48GB capacity in a 12-layer stack while ensuring structural stability"；Chosun ILBO 英文版："Improves power efficiency by 20% and reduces thermal resistance by 17%"：https://www.chosun.com/english/industry-en/2026/06/18/JIOTESGJHZA6RMN2OCH4CPBE6A/ ；另有 Asia Business Daily 同日报道：https://www.asiae.co.kr/en/article/2026061808400698313 |
| 单堆栈带宽约 4 TB/s（16 Gbps 换算口径） | 确认（换算口径） | HotHardware 标题 4TB/s；官方稿未直接给数，维持"约 4.0–4.1 TB/s 为换算值"的原判定 |

**独立性检查**：官方新闻稿 + 朝鲜日报 + Asia Business Daily + HotHardware 为四个相互独立的发布渠道，口径一致。

## 2. 标准号核对（术语笔记引用）

| 标准 | 全称 | 结果 |
|---|---|---|
| SEMI E134 | Specification for Data Collection Management（Equipment Automation Software 卷） | SEMI 官方商店在售确认：https://store-us.semi.org/products/e13400-semi-e134-specification-for-data-collection-management |
| SEMI E164 | EDA Common Metadata | SEMI 官方商店在售确认：https://store-us.semi.org/products/e16400-semi-e164-specification-for-eda-common-metadata |

背景阅读（Cimetrix，设备自动化厂商对 E134/E164 的工程解读）：https://www.cimetrix.com/semi-e134 、https://www.cimetrix.com/semi-e164

## 3. 广立微（Semitronix）产品栈核对（术语笔记引用）

| 论断 | 结果 | 依据 |
|---|---|---|
| DataExp-YMS 支持 CP、FT、WAT、Inline、Defect、WIP 多类型数据的清洗、连接、整合与良率分析 | 确认 | 广立微官网：https://www.semitronix.com/analytics/de-yms.html |
| DataExp 定位为大数据/良率分析平台（EDA 产品线） | 确认 | 官网产品页：https://www.semitronix.com/product/eda/dataexp/ |
| 晶圆级 WAT 测试设备（晶圆级电学参数测试） | 确认 | 官网：https://www.semitronix.com/tester/wat/ |

## 4. 未查证到 / 按保守口径处理

- **WPFile**：未检索到公开格式规范。按"厂内/测试机链路的实际数据文件"保守处理，笔记中不声称其为广立微官方格式；字段字典以厂内文档与厂商支持为准（这正是 S0"数据字典 v1"交付的内容）
- 三星 HBM4E 送样（2026-05-29）与 GTC 2026 演示（16 Gbps / 4.0 TB/s）：沿用 2026-09-19 核对结论（来源 1、19），本次未重复核验
