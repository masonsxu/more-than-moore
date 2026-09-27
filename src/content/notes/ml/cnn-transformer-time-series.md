---
title: 'CNN + Transformer 时间序列预测：原理拆解与本地复现实测'
description: '复现公众号 CNN+Transformer 融合时序预测案例：74,401 参数、CPU 8 s 训完；实测 R²=0.29，不敌持久性基线的 0.83——附逐图诊断、根因分析与调参清单。'
date: 2026-09-27
tags: ['机器学习', '时间序列', 'CNN', 'Transformer', 'PyTorch', '复现']
---

> 定位说明：本文是 **ML 模块第一篇**。来源为微信公众号文章[《面试官惊讶：用 Codex 十分钟搭完时序融合模型？》](https://mp.weixin.qq.com/s/tx6dHQJBwmkDjDLdvWa3Xw)（CNN+Transformer 做时间序列特征提取与预测）。本文做两件事：拆解算法原理；按文章超参数**逐行忠实复现**并给出实测指标——包括文章没有给的基线对照，结论与文章口径有出入，见下文“复现结论”一节。
>
> 复现代码：`scripts/ml/cnn-transformer-forecast/`（uv 项目，`uv run main.py` 一键跑通）。

## 一、为什么把 CNN 和 Transformer 缝起来

时间序列预测的核心矛盾：**短期波动要敏感，长期依赖也要抓得住**，单一模型很难两头兼顾。

- **CNN = 局部观察员**。卷积核在时间轴上滑小窗口（k=3 就是每次看 3 个点），擅长识别局部形状：连续上升、尖峰、下降回弹。看序列 `20, 21, 22, 23, 30, 31, 32, 33`，CNN 能立刻发现 `22, 23, 30` 的跳变，但不知道这个跳变是噪声还是趋势拐点。
- **Transformer = 全局分析师**。自注意力让每个位置与所有位置“对话”：末端的 33 可以回看开头的 20–23 和中间的 30–32，判断序列是否进入新状态。但它对局部细微形状不如卷积敏感。

融合范式因此固定为四段流水线：

```
原始序列 [B, T, D] → CNN 提局部模式 → Linear 投影到 d_model
→ Transformer 建全局依赖 → 取末时间步 → 全连接回归头输出预测
```

## 二、两个组件各自在算什么

**Conv1d：滑动窗口加权求和**（卷积核 K，窗口内输入 $x$，偏置 $b$）：

$$
y_i = \sum_{k=0}^{K-1} w_k \, x_{i+k} + b
$$

例：窗口 `2, 4, 6` 乘以核 `0.2, 0.3, 0.5` 得 `0.4 + 1.2 + 3.0 = 4.6`。它学的不是原始数值，而是“先低后高 / 高位平台 / 突然冲高”这类**局部形状模板**。

**自注意力：按相关度分配权重**（$Q$ 查询、$K$ 键、$V$ 值，$d_k$ 为键维度）：

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^\top}{\sqrt{d_k}}\right) V
$$

当前位置先问“我该重点看谁”，按相似度给全序列每个时刻打分加权汇总——第 8 个点判断“会不会继续涨”时，给与当前趋势相似的第 2 点高权重、给无关噪声的第 1 点低权重。

**张量流向**（本文模型，batch=B，时间步 T=30，特征 D=1）：

| 阶段 | 操作 | 输出形状 |
|---|---|---|
| 输入 | — | `[B, 30, 1]` |
| Conv1d ×2（k=3, 32 通道） | `permute(0,2,1)` 后卷积 | `[B, 32, 30]` |
| 投影 | `Linear(32 → 64)` | `[B, 30, 64]` |
| TransformerEncoder | 2 层、4 头、FFN 128 | `[B, 30, 64]` |
| 回归头 | 取 `x[:, -1, :]` → `64→32→1` | `[B, 1]` |

## 三、复现配置

数据为文章的合成序列（T=2000，seed=42），叠加四种成分，参数如下：

| 成分 | 表达式 | 说明 |
|---|---|---|
| 趋势 | `0.005 · t` | 全程抬升约 10 |
| 周期 | `1.5·sin(2πt/50) + 0.8·sin(2πt/120)` | 双周期叠加 |
| 突变 | `t=600–639` 上凸（峰 +4）、`t=1400–1439` 下凹（谷 −3） | 两段线性三角峰 |
| 噪声 | `N(0, 0.4²)` | 高斯白噪声 |

模型与训练超参数（与文章一致）：

| 项 | 值 |
|---|---|
| CNN | Conv1d(1→32, k=3, pad=1) + ReLU × 2 层 |
| 投影 | Linear(32→64) |
| Transformer | 2 层 encoder，nhead=4，d_model=64，FFN=128，dropout=0.1，batch_first |
| 回归头 | Linear(64→32) + ReLU + Linear(32→1) |
| 参数量 | **74,401** |
| 窗口 / 划分 | 滑窗 30 预测下一点；80/20 按时间切（1,576 / 394 样本） |
| 训练 | Adam lr=1e-3，MSE，batch=64，20 epochs，seed=42，**CPU 7.5 s** |

核心代码（完整脚本：`scripts/ml/cnn-transformer-forecast/main.py`）：

```python
class CNNTransformer(nn.Module):
    def __init__(self, input_dim=1, cnn_channels=32, d_model=64,
                 nhead=4, num_layers=2, dropout=0.1):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv1d(input_dim, cnn_channels, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(cnn_channels, cnn_channels, kernel_size=3, padding=1),
            nn.ReLU(),
        )
        self.project = nn.Linear(cnn_channels, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, nhead=nhead, dim_feedforward=128,
            dropout=dropout, batch_first=True)
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.head = nn.Sequential(nn.Linear(d_model, 32), nn.ReLU(), nn.Linear(32, 1))

    def forward(self, x):                      # x: [B, T, D]
        x = x.permute(0, 2, 1)                 # [B, D, T]  Conv1d 要求通道在前
        x = self.cnn(x)                        # [B, C, T]  局部模式 + 降噪
        x = x.permute(0, 2, 1)                 # [B, T, C]
        x = self.project(x)                    # [B, T, 64]
        x = self.transformer(x)                # [B, T, 64] 全局依赖
        return self.head(x[:, -1, :])          # 取末时间步回归
```

本地运行：

```bash
cd scripts/ml/cnn-transformer-forecast
uv run main.py              # 默认 20 epochs
EPOCHS=100 uv run main.py   # 加长训练对照实验
```

产出：5 张图写入 `public/diagrams/ml/`，指标写入 `metrics.json`。

## 四、实测结果

所有数值来自本机实跑（CPU，seed=42，20 epochs）：

| 指标 | 本文模型 | 持久性基线（用窗口末点当预测） |
|---|---|---|
| MAE（原始量纲） | 0.9283 | **0.4554** |
| RMSE（原始量纲） | 1.1869 | **0.5759** |
| R² | 0.2864 | **0.8320** |
| MSE（标准化空间，末 epoch） | train 0.0267 / test 0.1324 | — |

![原始合成时间序列：趋势 + 双周期 + 两段突变 + 噪声](/diagrams/ml/ml-cnn-transformer-raw-series.png)

![损失曲线：train 收敛到 0.027，test 在 0.09–0.13 振荡](/diagrams/ml/ml-cnn-transformer-loss-curve.png)

损失曲线形态：train loss 第 1 个 epoch 就从 0.227 骤降到 0.043，此后平缓降到 0.027；**test loss 从 epoch 2 起在 0.09–0.13 之间震荡，20 个 epoch 内没有跟随下降**——train/test 差距约 5.0 倍，模型在拟合训练集特有模式，而非可泛化规律。

![预测 vs 真实：相位与周期跟踪良好，峰值被压缩](/diagrams/ml/ml-cnn-transformer-prediction.png)

预测曲线：模型**周期相位跟得很准**（波峰波谷位置对齐），但幅度被系统性压缩——真实值冲到 10–11 时预测停在 9 附近，这是回归模型典型的“向均值收缩”。

![残差分布：均值 +0.87，右偏长尾到 +4](/diagrams/ml/ml-cnn-transformer-residuals.png)

残差分布：不是以 0 为中心的对称钟形，而是**右偏**——均值 +0.87、标准差 0.81、长尾伸到 +4。右偏意味着“真实值普遍高于预测值”，即模型在测试段**系统性低估**，不是随机误差。

![散点图：实际值超过 9 后预测饱和在 9.2 附近](/diagrams/ml/ml-cnn-transformer-scatter.png)

散点图是最直白的证据：实际值 6–9 区间点云贴着对角线，**超过 9 后点云整体弯离对角线、水平压平在 9.2 附近**——预测上限饱和。

## 五、复现结论：文章说“效果还不错”，实测如何

按文章原样复现后，**模型显著不如最朴素的持久性基线**（MAE 差 2.0 倍、R² 差 0.55）。用四个量化事实定位根因：

**1. 不是训练不足。** 加练到 100 epochs：test MSE 0.1336（20 epochs 为 0.1324），R² 反而微降到 0.2662；train/test 差距从 5.0 倍扩大到 5.7 倍。延长训练只加深过拟合。

**2. 测试段是全程趋势的最高处，模型在“外推”。** 按时间 80/20 切分后，测试目标覆盖 t=1606–1999，趋势项抬到 8.0–10.0，叠加周期后序列最大值（≈13）只出现在测试段——训练时几乎没见过这个量级，模型预测上限饱和在 9.2（散点图弯折处），产生 +0.87 的系统性低估。窗口回归模型天然不擅长超出训练分布的水平外推，而持久性基线“上一帧是多少就猜多少”对此完全免疫。

**3. 单步预测场景下持久性基线本来就极强。** 序列相邻点差分主要由噪声决定（σ=0.4），“猜下一个点等于当前点”的 MAE 只有 0.455。任何模型要先打赢这条基线，才谈得上“效果不错”。**任何时序模型论文/文章都应报告这条基线，本文复现的文章没有报告。**

**4. 架构层面还有一个隐患：没有位置编码。** `nn.TransformerEncoderLayer` 的注意力对输入顺序置换不变——不做位置编码，Transformer 本身分不清 t 与 t+1，时序信息只能靠 CNN 局部特征间接带入。NLP 里“位置编码是 Transformer 标配”，这篇教程代码省掉了它。

次要问题：`StandardScaler` 在切分前对全长序列 fit，测试段信息（均值/方差）泄漏进训练——本例影响小（标准化是逐点仿射），但在非平稳真实数据上会放大评估失真。

**结论**：文章的融合结构本身是合理范式（CNN 局部 + Transformer 全局），合成数据上模型也确实学会了周期与相位；但“效果还不错”的口径经不起基线对照——在这份数据上，它输给“明天的值 = 今天的值”。

## 六、调参清单（自文章第 05 节浓缩）

| 部件 | 建议 | 依据 |
|---|---|---|
| CNN 深度 | 2 层起步，k=3 或 5，通道 16/32 起步 | 太浅提不出局部模式；太深压缩时间轴，Transformer 可看的信息变少 |
| Transformer 层数 | 2–4 层够用 | 时序序列短，盲目堆深只会过拟合（本次 2 层即见 train/test 5 倍差） |
| 标准化 | 必做，且只在训练段 fit | 量纲差异大时模型无法稳定学习；全文泄漏问题见上 |
| 窗口大小 | 与业务周期对齐：分钟级传感器 30/60/120，日级销量 7/14/30 | 太短看不到周期，太长噪声与成本一起涨 |
| 评价指标 | MSE 之外必看 MAE、RMSE、拐点命中率、异常段召回率，**外加持久性基线** | 拐点错判的业务代价（如故障预警提前量）与 MSE 不成正比 |

## 七、改进方向（下一步实验）

1. **差分目标**：不预测 $y_{t+1}$，改预测 $\Delta = y_{t+1} - y_t$，把趋势水平外推问题变成小量预测问题（预期直接改善 +0.87 偏置）。
2. **位置编码**：给 Transformer 加正弦/可学习位置编码，恢复时序敏感性。
3. **多步预测**：输出未来 k 步（k=7/30），检验长 horizon 下 CNN+Transformer 相对基线的真正优势区间——单步是基线的主场，多步才是融合结构该赢的地方。
4. **滚动标准化**：scaler 只在训练段 fit，测试段 transform，消除泄漏。

以上改造已在产线场景落地验证：把单通道输入改为多变量、单步回归改为预测误差预警，对照单通道 EWMA/单变量模型检验耦合失效检出能力，实测结果与场景匹配见《[CNN + Transformer 用于先进封装产线](/notes/ml/cnn-transformer-advanced-packaging/)》。
