"""多变量耦合失效检测实验：CNN+Transformer 在先进封装产线场景的验证.

场景：键合机"温度 A - 键合压力 B"耦合劣化，B = 0.8·A + 自身动态 + 噪声。
两种故障模式对照（t>=3700 起 100 步渐变）：

  phase_swap    B 改挂到与 A 同分布但正交的分量（sin -> cos）：
                B 的实现轨迹整体切换，单通道可见，对照用。
  actuator_lag  B 仍挂在 A 上，但响应延迟 tau 0 -> 6 步线性增长
                （执行器劣化的典型形态）：B 波形几乎不变、边际不变，
                假设：单通道全盲，只有多变量模型能抓到。

时间轴（检验特异性）：
  [0, 2400)      训练段（正常，噪声实现 1）
  [2400, 3400)   验证段（正常，同一实现）——所有方法在此取 99.5% 分位阈值
  [3400, 3700)   良性对照段（耦合保持，噪声实现 2）——好的方法不应报警
  [3700, 4000]   故障段

运行：uv run multivariate.py（约 2 min，CPU，两种模式各训 3 个模型）
输出：指标(stdout 与 metrics-multivariate.json)、6 张图(public/diagrams/ml/)。
"""

from __future__ import annotations

import json
import time
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import torch
import torch.nn as nn
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader

from main import CNNTransformer, TimeSeriesDataset

T = 4000
WINDOW = 30
BENIGN_START = 3400  # 良性对照段起点（噪声实现切换，耦合保持）
FAULT_ONSET = 3700  # 耦合破坏起点
RAMP = 100
LAG_MAX = 6  # actuator_lag 模式的最大响应延迟（样本步）
VAL_START = 2400
EPOCHS = 30
BATCH_SIZE = 64
LR = 1e-3
SMOOTH = 30
QUANTILE = 0.995
EWMA_LAMBDA = 0.2
MODES = ("phase_swap", "actuator_lag")

REPO = Path(__file__).resolve().parents[3]
DIAGRAMS = REPO / "public" / "diagrams" / "ml"
METRICS_PATH = Path(__file__).resolve().parent / "metrics-multivariate.json"

np.random.seed(42)
torch.manual_seed(42)
DEVICE = torch.device("cpu")


# ---------------------------------------------------------------- 数据
def generate_multivariate(mode: str) -> tuple[np.ndarray, np.ndarray]:
    """两通道平稳合成数据：A 温度（慢周期+噪声），B 键合压力（耦合 A）。

    不含趋势项：趋势会让所有方法在测试窗口集体外推报警，淹没耦合效应。
    返回 (series[T,2], ramp)。ramp∈[0,1] 为耦合破坏进度（0=正常，1=完全解耦）。
    """
    t = np.arange(T)
    a_slow = 1.2 * np.sin(2 * np.pi * t / 60)
    fast = 0.5 * np.sin(2 * np.pi * t / 17)
    # 噪声实现切换 = 良性波动：分布不变，逐点数值变
    n1a, n2a = np.random.normal(0, 0.3, (2, T))
    n1b, n2b = np.random.normal(0, 0.25, (2, T))
    n_a = np.where(t < BENIGN_START, n1a, n2a)
    n_b = np.where(t < BENIGN_START, n1b, n2b)
    a = a_slow + n_a
    b_normal = 0.8 * a + fast + n_b
    ramp = np.clip((t - FAULT_ONSET) / RAMP, 0, 1)
    if mode == "phase_swap":
        # 与 a_slow 同幅同频但正交（sin -> cos）：边际与自相关不变，仅互相关消失
        a2 = 1.2 * np.cos(2 * np.pi * t / 60) + np.random.normal(0, 0.3, T)
        b_anom = 0.8 * a2 + fast + n_b
    elif mode == "actuator_lag":
        # B 仍挂在 A 上，响应延迟 0 -> LAG_MAX 步线性增长（平滑信号，波形几乎不变）
        tau = np.round(LAG_MAX * ramp).astype(int)
        a_lag = a[np.clip(t - tau, 0, None)]
        b_anom = 0.8 * a_lag + fast + n_b
    else:
        raise ValueError(f"unknown mode: {mode}")
    b = (1 - ramp) * b_normal + ramp * b_anom
    return np.stack([a, b], axis=1), ramp


def make_windows(scaled: np.ndarray) -> tuple[np.ndarray, np.ndarray]:
    """滑窗：前 WINDOW 步预测下一步全通道。返回 X[N,WINDOW,2], y[N,2]。"""
    X, y = [], []
    for i in range(len(scaled) - WINDOW):
        X.append(scaled[i : i + WINDOW])
        y.append(scaled[i + WINDOW])
    return np.array(X), np.array(y)


class MultiCNNTransformer(CNNTransformer):
    """多变量输出版：骨干与单变量复现完全一致，仅回归头改为 N 通道输出。"""

    def __init__(self, input_dim: int, output_dim: int, **kwargs):
        super().__init__(input_dim=input_dim, **kwargs)
        self.head = nn.Sequential(
            nn.Linear(64, 32),
            nn.ReLU(),
            nn.Linear(32, output_dim),
        )


def fit(model: nn.Module, loader: DataLoader, epochs: int) -> float:
    opt = torch.optim.Adam(model.parameters(), lr=LR)
    criterion = nn.MSELoss()
    start = time.perf_counter()
    model.train()
    for _ in range(epochs):
        for xb, yb in loader:
            loss = criterion(model(xb), yb)
            opt.zero_grad()
            loss.backward()
            opt.step()
    return time.perf_counter() - start


def channel_errors(
    model: nn.Module, X: np.ndarray, y: np.ndarray, ch: int
) -> np.ndarray:
    """每样本在指定通道上的逐步平方误差。"""
    model.eval()
    errs = []
    with torch.no_grad():
        for i in range(0, len(X), 256):
            pred = model(torch.tensor(X[i : i + 256], dtype=torch.float32))
            errs.extend(
                ((pred[:, ch] - torch.tensor(y[i : i + 256, ch])) ** 2).tolist()
            )
    return np.array(errs)


def smooth_score(errs: np.ndarray, window: int) -> np.ndarray:
    """尾随均值平滑；前 window-1 个样本不足，填 NaN。"""
    out = np.full(len(errs), np.nan)
    for j in range(window - 1, len(errs)):
        out[j] = errs[j - window + 1 : j + 1].mean()
    return out


def ewma_absz(values: np.ndarray, mu: float, sigma: float) -> np.ndarray:
    """EWMA 平滑（λ=0.2）后的标准化偏离；阈值走验证段经验分位。"""
    z, s = np.empty(len(values)), mu
    for i, v in enumerate(values):
        s = EWMA_LAMBDA * v + (1 - EWMA_LAMBDA) * s
        z[i] = (s - mu) / sigma
    return np.abs(z)


def alarm_stats(alarm: np.ndarray, lo: int, hi: int) -> tuple[float, int]:
    """[lo,hi) 内报警率与首次报警位置（绝对样本序号），无报警返回 -1。"""
    seg = alarm[lo:hi]
    idx = np.flatnonzero(seg)
    first = int(idx[0]) + lo if len(idx) else -1
    return float(seg.mean()), first


def run_pipeline(series: np.ndarray) -> tuple[dict, dict, dict]:
    """标准化、训练三个模型、统一阈值口径评分，返回 (metrics, scores, thresholds)。"""
    scaler = StandardScaler().fit(series[:VAL_START])
    scaled = scaler.transform(series)
    X, y = make_windows(scaled)

    X_tr, y_tr = X[: VAL_START - WINDOW], y[: VAL_START - WINDOW]
    loaders = {
        "mv": DataLoader(
            TimeSeriesDataset(X_tr, y_tr), batch_size=BATCH_SIZE, shuffle=True
        ),
        "uv_b": DataLoader(
            TimeSeriesDataset(X_tr[:, :, 1:2], y_tr[:, 1:2]),
            batch_size=BATCH_SIZE,
            shuffle=True,
        ),
        "uv_a": DataLoader(
            TimeSeriesDataset(X_tr[:, :, 0:1], y_tr[:, 0:1]),
            batch_size=BATCH_SIZE,
            shuffle=True,
        ),
    }
    models = {
        "mv": MultiCNNTransformer(input_dim=2, output_dim=2),
        "uv_b": CNNTransformer(input_dim=1),
        "uv_a": CNNTransformer(input_dim=1),
    }
    for name, model in models.items():
        seconds = fit(model.to(DEVICE), loaders[name], EPOCHS)
        print(
            f"  trained {name}: {sum(p.numel() for p in model.parameters())} params, {seconds:.1f}s"
        )

    # 通道 B 的平滑误差评分；单变量模型只喂自身通道切片
    model_inputs = {"mv": X, "uv_b": X[:, :, 1:2], "uv_a": X[:, :, 0:1]}
    scores = {}
    for name, model, ch in (
        ("mv", models["mv"], 1),
        ("uv_b", models["uv_b"], 0),
        ("uv_a", models["uv_a"], 0),
    ):
        e = channel_errors(model, model_inputs[name], y, ch)
        scores[name] = np.concatenate(
            [np.full(WINDOW, np.nan), smooth_score(e, SMOOTH)]
        )

    # EWMA 基线（逐通道，标准化空间，λ=0.2）
    mu_a, sd_a = scaled[:VAL_START, 0].mean(), scaled[:VAL_START, 0].std()
    mu_b, sd_b = scaled[:VAL_START, 1].mean(), scaled[:VAL_START, 1].std()
    scores["ewma_a"] = ewma_absz(scaled[:, 0], mu_a, sd_a)
    scores["ewma_b"] = ewma_absz(scaled[:, 1], mu_b, sd_b)

    # 所有方法统一口径：验证段（正常）99.5% 分位经验阈值
    results, thresholds, alarms = {}, {}, {}
    for name, sc in scores.items():
        th = float(np.nanquantile(sc[VAL_START:BENIGN_START], QUANTILE))
        thresholds[name] = round(th, 6)
        alarm = sc > th
        alarms[name] = alarm
        val_rate, _ = alarm_stats(alarm, VAL_START, BENIGN_START)
        benign_rate, _ = alarm_stats(alarm, BENIGN_START, FAULT_ONSET)
        fault_rate, first = alarm_stats(alarm, FAULT_ONSET, T)
        results[name] = {
            "val_alarm_rate": round(val_rate, 4),
            "benign_alarm_rate": round(benign_rate, 4),
            "fault_alarm_rate": round(fault_rate, 4),
            "detection_delay": (first - FAULT_ONSET) if first >= 0 else None,
        }
    meta = {"scaled": scaled, "alarms": alarms}
    return results, scores, thresholds, meta


def summarize(series: np.ndarray, results: dict) -> dict:
    pre = slice(1000, BENIGN_START)
    post = slice(FAULT_ONSET + RAMP, T)
    return {
        "b_marginal": {
            "pre_mean": round(float(series[pre, 1].mean()), 4),
            "post_mean": round(float(series[post, 1].mean()), 4),
            "pre_std": round(float(series[pre, 1].std()), 4),
            "post_std": round(float(series[post, 1].std()), 4),
        },
        "corr_a_b": {
            "train": round(
                float(np.corrcoef(series[:VAL_START, 0], series[:VAL_START, 1])[0, 1]),
                4,
            ),
            "benign": round(
                float(
                    np.corrcoef(
                        series[BENIGN_START:FAULT_ONSET, 0],
                        series[BENIGN_START:FAULT_ONSET, 1],
                    )[0, 1]
                ),
                4,
            ),
            "post_onset": round(
                float(np.corrcoef(series[post, 0], series[post, 1])[0, 1]), 4
            ),
        },
        "methods": results,
    }


def plot_channels(series: np.ndarray, path: Path, title: str) -> None:
    t = np.arange(T)
    fig, axes = plt.subplots(2, 1, figsize=(16, 8), sharex=True)
    for ax, ch, color, label in (
        (axes[0], 0, "teal", "A (temp)"),
        (axes[1], 1, "deeppink", "B (bond force)"),
    ):
        ax.plot(t, series[:, ch], color=color, linewidth=0.8)
        ax.axvspan(0, VAL_START, color="grey", alpha=0.12)
        ax.axvspan(BENIGN_START, FAULT_ONSET, color="limegreen", alpha=0.18)
        ax.axvline(FAULT_ONSET, color="red", linestyle="--", linewidth=1.5)
        ax.set_ylabel(label)
        ax.grid(alpha=0.3)
    axes[1].set_xlabel("Time")
    axes[0].set_title(title, fontsize=14)
    plt.savefig(path, bbox_inches="tight")
    plt.close()


def plot_scores(scores: dict, thresholds: dict, path: Path) -> None:
    t = np.arange(T)
    fig, axes = plt.subplots(2, 1, figsize=(16, 8), sharex=True)
    axes[0].plot(
        t, scores["mv"], color="magenta", linewidth=1.2, label="multivariate score"
    )
    axes[0].plot(
        t,
        scores["uv_b"],
        color="darkorange",
        linewidth=1.2,
        alpha=0.8,
        label="univariate-B score",
    )
    axes[0].axhline(thresholds["mv"], color="magenta", linestyle="--", linewidth=1)
    axes[0].axhline(thresholds["uv_b"], color="darkorange", linestyle="--", linewidth=1)
    axes[0].axvspan(BENIGN_START, FAULT_ONSET, color="limegreen", alpha=0.18)
    axes[0].axvline(FAULT_ONSET, color="red", linestyle="--", linewidth=1.5)
    axes[0].set_yscale("log")
    axes[0].set_ylabel("Score (smoothed sq. err)")
    axes[0].legend()
    axes[0].grid(alpha=0.3)
    axes[1].plot(t, scores["ewma_a"], color="teal", linewidth=0.9, label="|EWMA| A")
    axes[1].plot(
        t, scores["ewma_b"], color="slateblue", linewidth=0.9, label="|EWMA| B"
    )
    axes[1].axhline(thresholds["ewma_b"], color="black", linestyle="--", linewidth=1)
    axes[1].axvspan(BENIGN_START, FAULT_ONSET, color="limegreen", alpha=0.18)
    axes[1].axvline(FAULT_ONSET, color="red", linestyle="--", linewidth=1.5)
    axes[1].set_ylabel("|EWMA| (empirical th.)")
    axes[1].set_xlabel("Time")
    axes[1].legend()
    axes[1].grid(alpha=0.3)
    axes[0].set_title("Anomaly Scores vs Empirical Thresholds", fontsize=14)
    plt.savefig(path, bbox_inches="tight")
    plt.close()


def plot_coupling(series: np.ndarray, corr: dict, path: Path) -> None:
    fig, axes = plt.subplots(1, 2, figsize=(14, 6), sharex=True, sharey=True)
    sel_tr = slice(0, VAL_START, 5)
    axes[0].scatter(series[sel_tr, 0], series[sel_tr, 1], s=6, alpha=0.4, color="teal")
    axes[0].set_title(f"train: corr={corr['train']:.3f}")
    axes[0].set_xlabel("A (temp)")
    axes[0].set_ylabel("B (bond force)")
    axes[0].grid(alpha=0.3)
    post = slice(FAULT_ONSET + RAMP, T)
    axes[1].scatter(series[post, 0], series[post, 1], s=6, alpha=0.4, color="crimson")
    axes[1].set_title(f"post-onset: corr={corr['post_onset']:.3f}")
    axes[1].set_xlabel("A (temp)")
    axes[1].grid(alpha=0.3)
    fig.suptitle("Coupling Degradation: A-B Cross-correlation", fontsize=14)
    plt.savefig(path, bbox_inches="tight")
    plt.close()


def main() -> None:
    all_metrics, all_scores, all_thresholds, all_series = {}, {}, {}, {}
    for mode in MODES:
        print(f"[{mode}]")
        series, _ = generate_multivariate(mode)
        results, scores, thresholds, _ = run_pipeline(series)
        all_metrics[mode] = summarize(series, results)
        all_metrics[mode]["methods"] = results
        all_scores[mode], all_thresholds[mode], all_series[mode] = (
            scores,
            thresholds,
            series,
        )
        plot_channels(
            series,
            DIAGRAMS / f"ml-mv-{mode}-channels.png",
            f"Two-channel Stream ({mode})",
        )
        plot_scores(scores, thresholds, DIAGRAMS / f"ml-mv-{mode}-scores.png")
        plot_coupling(
            series,
            all_metrics[mode]["corr_a_b"],
            DIAGRAMS / f"ml-mv-{mode}-coupling.png",
        )

    report = {
        "benign_start": BENIGN_START,
        "fault_onset": FAULT_ONSET,
        "ramp": RAMP,
        "lag_max": LAG_MAX,
        "train_targets": VAL_START - WINDOW,
        "val_targets": BENIGN_START - VAL_START,
        "benign_targets": FAULT_ONSET - BENIGN_START,
        "fault_targets": T - FAULT_ONSET,
        "threshold_quantile": QUANTILE,
        "modes": all_metrics,
    }
    METRICS_PATH.write_text(json.dumps(report, indent=2, ensure_ascii=False) + "\n")
    print(json.dumps(report, indent=2, ensure_ascii=False))
    print(f"plots -> {DIAGRAMS}")
    print(f"metrics -> {METRICS_PATH}")


if __name__ == "__main__":
    main()
