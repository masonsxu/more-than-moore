# 来源摘录：ATE 测量电路与 DC 参数测试（PMU / 接触测试 / Power Short / 漏电）

- 核验日期：2026-09-25
- 用途：KGSD 测试「电压/电流/电阻 → 失效判定」电路级论述的证据层（《HBM 测试的 3D 结构》测试区域下钻模型 L2–L3）

## 1. PMU 的两种基本测量模式（加压测流 / 加流测压）

- 来源：Marvin Test Solutions KB Q200207《DC Characterization of ICs Using PXI Instrumentation》（全文抓取，200）
- URL：https://www.marvintest.com/KB/Q200207/DC-Characterization-of-ICs-Using-PXI-Instrumentation

原文摘录：

> "DC Parametric Measurement Units (PMU), also known as Source Measure Units (SMU), can be used in one of two modes to perform dc characterization tests on the input and output lines of digital devices:
> Method 1: Force voltage and measure current... Method 2: Force current and measure voltage... The parametric measurement unit either forces a constant current across a device or sinks a constant current from a device pin and then measures the resultant voltage."

> "As leakage currents are often in the uA range, the PMU should be set to its more sensitive current ranges to achieve more accurate measurements."

> "At each input voltage setting the PMU measures the current being drawn by the input and then verifies the value against the DUT specification."

（另给出 VIH/VIL/VOL/VOH/IIL/IIH/IOS 参数定义与 ±2 μA–±32 mA 八档电流量程——量级参照。）

## 2. PMU 电路构成：DAC 强制 + ADC 测量 + 钳位 + 窗口比较器

- 来源 A：Analog Devices 设计笔记《How to Set PMU Voltage and Current Clamps》（MAX9979 pin electronics，全文抓取，200）
- URL：https://www.analog.com/en/resources/design-notes/how-to-set-pmu-voltage-and-current-clamps.html

原文摘录：

> "The MAX9979 parametric measurement unit (PMU) is able to both force and measure current and voltage. Setting the voltage and current clamps ensures the PMU operates in linear region."

> "The MAX9979 PMU can be configured in six modes of operation... Force-Voltage/Measure-Voltage (FVMV), Force-Voltage/Measure-Current (FVMI), Force-Current/Measure-Current (FIMI), Force-Current/Measure-Voltage (FIMV)..."

> "A voltage range of -1.5V to 6.5V and full-scale current range of ±2µA to ±50mA can be supported."

> "PMU voltage or current clamps ensure that the DUT voltage or current cannot exceed the clamped voltage or current, respectively. PMU voltage clamps are available in FI mode of operation whereas current clamps are available in FV mode."

- 来源 B：Analog Devices AD5520/AD5521 数据手册（Per-Pin PMU/SMU for ATE，URL 200）
- URL：https://www.analog.com/media/en/technical-documentation/data-sheets/AD5520.pdf

> "FEATURES Force/measure functions FIMV, FVMI, FVMV, FIMI... Clamp circuitry and window comparators on board... APPLICATIONS Automatic test equipment"
> （数据手册页首特性表；FIMV/FVMI 四种模式 + 钳位电路 + 窗口比较器——ATE 每引脚 PMU 的标准构成）

- 来源 C：AD5522 数据手册（URL 200）：https://www.analog.com/media/en/technical-documentation/data-sheets/AD5522.pdf

## 3. 接触（Contact/Continuity）测试：经保护二极管加流测压

- 来源：US5365180A《Method for measuring contact resistance》（Google Patents）
- URL：https://patents.google.com/patent/US5365180A/en
- 核验方式：搜索引擎索引摘要（本机直连 patents.google.com 不可达；摘要原文如下）

> "the most common method of calculating the contact resistance is to force a designated current through the diode that is typically present between the device pin and the ground (or power supply). The voltage drop associated with the forced current is then measured. If a bad contact exists, the voltage drop will increase."

（即：对 pin–GND 间的典型存在二极管强制电流，测压降；接触不良 → 压降增大。与 FIMV 模式直接对应。开路焊盘的判别逻辑——电压升至钳位/达标值——与 ADI 设计笔记的钳位机制一致：FI 模式下 DUT 电压不能超过电压钳位。）

## 4. DC 参数三件套与 fail-stop bin 顺序（DRAM 语境）

- Power Short / Contact / Leakage 三件套：Acco Labs TCIII-UDC-80S 直流测试机描述（项目既有归档，见 [`../hbm-test/`](../hbm-test/) 同目录 Edusemi 归档文件来源 C）
- fail-stop bin 顺序（Open/Short → Standby Idd → Active Idd → Function → Pause Refresh → Disturb Refresh → Margin）与「bin 应读作底层物理损伤的电学症状」：Edusemi-Plus DRAM wafer test bin 页（项目既有归档：`2026-09-25_edusemi_dram-wafer-test-bins.md`）
- EDS 的 ET 测试对「晶体管/电阻/电容/二极管」做 DC 参数测试：三星 Newsroom EDS 科普（项目既有归档：`2021-07_samsung_edswafer-test-bins.md`）

## 可引用论断（本级新增）

- ATE 每引脚测量由 PMU 完成：FVMI（加压测流）与 FIMV（加流测压）是两种基本模式，辅以 FVMV/FIMI（ADI 设计笔记，厂商一手，A级）
- FI 模式用电压钳位、FV 模式用电流钳位，钳位保证 PMU 工作在线性区、同时充当「开路→电压顶到钳位」的判别上界（ADI 设计笔记原文，A级）
- 接触测试的标准方法：对 pin–GND 保护二极管强制电流测压降，接触不良压降增大（US5365180A 摘要，专利一手，A级）
- 硅 PN 结正偏导通压降约 0.6–0.7 V 为半导体器件物理教科书量级，本文仅作数量级使用（C 级常识口径，非特定器件 spec）
- Power Short / Contact / Leakage 是存储 DC 参数测试的标准三件套，fail-stop 顺序先致命后边角（项目既有归档，B/A 级）
