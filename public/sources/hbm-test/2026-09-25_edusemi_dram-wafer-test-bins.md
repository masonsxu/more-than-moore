# DRAM 晶圆测试 Bin 分类（0.25 μm 世代，fail-stop 策略）与量产测试基础文献

- 来源 A：Edusemi-Plus（samizo-aitl），Legacy DRAM wafer test bin 分类
  - 页面：https://samizo-aitl.github.io/Edusemi-Plus/archive/legacy/dram_025um/wafer_test_bin/
  - 访问日期：2026-09-25
- 来源 B：A. J. van de Goor，《Testing Semiconductor Memories: Theory and Practice》，John Wiley & Sons 1998（DRAM 测试算法经典教材，semiengineering 2026 文章脚注引用）
- 来源 C：Acco Labs TCIII-UDC-80S 直流测试机描述（"fast DC parametric testing: Power Short Test, Contact Test and Leakage Test"）——Power Short / Contact / Leakage 是 DC 参数测试的标准三件套
  - 检索摘要，访问日期：2026-09-25

## 来源 A 摘录：wafer test bin 分类

> Tests are executed sequentially in order of severity and irreversibility: 1. Fatal DC defects 2. Functional correctness 3. Retention-related behavior 4. Voltage / timing margin checks
> Why Fail-Stop: Early termination on fatal failures; Fast yield visibility at wafer level; Clear attribution of dominant failure modes.

| Bin | Category | 物理含义 |
|---|---|---|
| 1 | Open / Short | 灾难性布线/桥连缺陷 |
| 2 | Standby Idd | 关态漏电过大 |
| 3 | Active Idd | 工作电流异常 |
| 4 | Function | 读/写/译码失效 |
| 5 | Pause Refresh | 本征保持失效（结漏电主导，强温依赖） |
| 6 | Disturb Refresh | 邻行访问扰动致保持劣化（WL 耦合） |
| 7 | Margin | 电压/时序余量不足 |

> Wafer test bins should be read as: Electrical symptoms of underlying physical damage — not merely as quality labels.

## 使用说明

该 bin 体系是现代存储测试程序的骨架：PowerShort（电源-地短路，属 Bin1/2 的 DC 灾难类）、功能失效（Bin4）、保持/扰动（Bin5/6）、余量（Bin7）的次序即"先致命后边角"的 fail-stop 顺序。
