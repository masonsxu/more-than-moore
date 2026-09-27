"""CNN + Transformer 时间序列预测：公众号文章算法的本地复现.

来源：微信公众号文章《CNN+Transformer 融合：时间序列特征提取与预测》。
数据：T=2000 的合成序列（趋势 + 双周期 + 两段突变 + 高斯噪声），seed=42。
模型：2 层 Conv1d(k=3) -> Linear(32->64) -> TransformerEncoder(2 层 4 头) -> MLP 回归头。
运行：uv run main.py
输出：指标(stdout 与 metrics.json)、5 张图(public/diagrams/ml/)。
"""

from __future__ import annotations

import json
import math
import os
import time
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
import seaborn as sns
import torch
import torch.nn as nn
from sklearn.preprocessing import StandardScaler
from torch.utils.data import DataLoader, Dataset

REPO = Path(__file__).resolve().parents[3]
DIAGRAMS = REPO / "public" / "diagrams" / "ml"
METRICS_PATH = Path(__file__).resolve().parent / "metrics.json"

T = 2000
WINDOW_SIZE = 30
TRAIN_RATIO = 0.8
EPOCHS = int(os.environ.get("EPOCHS", "20"))
BATCH_SIZE = 64
LR = 1e-3

np.random.seed(42)
torch.manual_seed(42)
# 复现以确定性优先：模型很小（<20 万参数、660 步），CPU 足够且逐位可复现
DEVICE = torch.device("cpu")


# ---------------------------------------------------------------- 数据
def generate_series() -> tuple[np.ndarray, np.ndarray]:
    """构造带趋势、双周期、突变与噪声的合成序列，返回 (series, spike)。"""
    t = np.arange(T)
    trend = 0.005 * t
    seasonal = 1.5 * np.sin(2 * np.pi * t / 50) + 0.8 * np.sin(2 * np.pi * t / 120)
    noise = np.random.normal(0, 0.4, T)
    spike = np.zeros(T)
    spike[600:620] += np.linspace(0, 4, 20)
    spike[620:640] += np.linspace(4, 0, 20)
    spike[1400:1420] -= np.linspace(0, 3, 20)
    spike[1420:1440] -= np.linspace(3, 0, 20)
    return trend + seasonal + spike + noise, spike


def create_dataset(data: np.ndarray, window_size: int) -> tuple[np.ndarray, np.ndarray]:
    """滑动窗口：前 window_size 个点预测下一个点。"""
    X, y = [], []
    for i in range(len(data) - window_size):
        X.append(data[i : i + window_size])
        y.append(data[i + window_size])
    return np.array(X), np.array(y)


class TimeSeriesDataset(Dataset):
    def __init__(self, X: np.ndarray, y: np.ndarray):
        self.X = torch.tensor(X, dtype=torch.float32)
        self.y = torch.tensor(y, dtype=torch.float32)

    def __len__(self) -> int:
        return len(self.X)

    def __getitem__(self, idx: int) -> tuple[torch.Tensor, torch.Tensor]:
        return self.X[idx], self.y[idx]


# ---------------------------------------------------------------- 模型
class CNNTransformer(nn.Module):
    """CNN 提局部模式，Transformer 建模全局依赖，取末时间步回归。"""

    def __init__(
        self,
        input_dim: int = 1,
        cnn_channels: int = 32,
        d_model: int = 64,
        nhead: int = 4,
        num_layers: int = 2,
        dropout: float = 0.1,
    ):
        super().__init__()
        self.cnn = nn.Sequential(
            nn.Conv1d(input_dim, cnn_channels, kernel_size=3, padding=1),
            nn.ReLU(),
            nn.Conv1d(cnn_channels, cnn_channels, kernel_size=3, padding=1),
            nn.ReLU(),
        )
        self.project = nn.Linear(cnn_channels, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model,
            nhead=nhead,
            dim_feedforward=128,
            dropout=dropout,
            batch_first=True,
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers=num_layers)
        self.head = nn.Sequential(
            nn.Linear(d_model, 32),
            nn.ReLU(),
            nn.Linear(32, 1),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        # x: [B, T, D]
        x = x.permute(0, 2, 1)  # [B, D, T] Conv1d 要求通道在前
        x = self.cnn(x)  # [B, C, T]
        x = x.permute(0, 2, 1)  # [B, T, C]
        x = self.project(x)  # [B, T, d_model]
        x = self.transformer(x)  # [B, T, d_model]
        x = x[:, -1, :]  # 最后一个时间步
        return self.head(x)


# ---------------------------------------------------------------- 训练与评估
def train(
    model: CNNTransformer,
    train_loader: DataLoader,
    test_loader: DataLoader,
) -> tuple[list[float], list[float], float]:
    criterion = nn.MSELoss()
    optimizer = torch.optim.Adam(model.parameters(), lr=LR)
    train_losses: list[float] = []
    test_losses: list[float] = []
    start = time.perf_counter()
    for _ in range(EPOCHS):
        model.train()
        total_loss = 0.0
        for xb, yb in train_loader:
            pred = model(xb)
            loss = criterion(pred, yb)
            optimizer.zero_grad()
            loss.backward()
            optimizer.step()
            total_loss += loss.item()
        train_losses.append(total_loss / len(train_loader))

        model.eval()
        test_loss = 0.0
        with torch.no_grad():
            for xb, yb in test_loader:
                loss = criterion(model(xb), yb)
                test_loss += loss.item()
        test_losses.append(test_loss / len(test_loader))
    return train_losses, test_losses, time.perf_counter() - start


def regression_metrics(y_true: np.ndarray, y_pred: np.ndarray) -> dict[str, float]:
    mae = float(np.mean(np.abs(y_true - y_pred)))
    rmse = float(math.sqrt(float(np.mean((y_true - y_pred) ** 2))))
    ss_res = float(np.sum((y_true - y_pred) ** 2))
    ss_tot = float(np.sum((y_true - y_true.mean()) ** 2))
    return {
        "MAE": round(mae, 4),
        "RMSE": round(rmse, 4),
        "R2": round(1 - ss_res / ss_tot, 4),
    }


def collect_predictions(
    model: CNNTransformer, test_loader: DataLoader
) -> tuple[np.ndarray, np.ndarray]:
    model.eval()
    preds, targets = [], []
    with torch.no_grad():
        for xb, yb in test_loader:
            preds.extend(model(xb).flatten().tolist())
            targets.extend(yb.flatten().tolist())
    return np.array(preds), np.array(targets)


# ---------------------------------------------------------------- 主流程
def main() -> None:
    series, spike = generate_series()

    scaler = StandardScaler()
    series_scaled = scaler.fit_transform(series.reshape(-1, 1)).flatten()
    X, y = create_dataset(series_scaled, WINDOW_SIZE)
    X = X[:, :, None]  # [N, T, D]
    y = y[:, None]

    split = int(len(X) * TRAIN_RATIO)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]
    train_loader = DataLoader(
        TimeSeriesDataset(X_train, y_train), batch_size=BATCH_SIZE, shuffle=True
    )
    test_loader = DataLoader(
        TimeSeriesDataset(X_test, y_test), batch_size=BATCH_SIZE, shuffle=False
    )

    model = CNNTransformer().to(DEVICE)
    n_params = sum(p.numel() for p in model.parameters())
    train_losses, test_losses, seconds = train(model, train_loader, test_loader)

    preds, targets = collect_predictions(model, test_loader)
    preds_inv = scaler.inverse_transform(preds.reshape(-1, 1)).flatten()
    targets_inv = scaler.inverse_transform(targets.reshape(-1, 1)).flatten()

    # 基线：持久性预测（用窗口最后一个点当作预测值）
    persist = scaler.inverse_transform(X_test[:, -1, 0].reshape(-1, 1)).flatten()
    m_model = regression_metrics(targets_inv, preds_inv)
    m_persist = regression_metrics(targets_inv, persist)

    # ---------------------------------------------------------------- 图
    DIAGRAMS.mkdir(parents=True, exist_ok=True)

    plt.figure(figsize=(16, 5))
    plt.plot(series, color="deeppink", linewidth=2)
    plt.title("Raw Time Series", fontsize=16)
    plt.xlabel("Time")
    plt.ylabel("Value")
    plt.grid(alpha=0.3)
    plt.savefig(DIAGRAMS / "ml-cnn-transformer-raw-series.png", bbox_inches="tight")
    plt.close()

    plt.figure(figsize=(14, 5))
    plt.plot(train_losses, label="Train Loss", color="cyan", linewidth=2)
    plt.plot(test_losses, label="Test Loss", color="orange", linewidth=2)
    plt.title("Loss Curve", fontsize=16)
    plt.xlabel("Epoch")
    plt.ylabel("MSE Loss")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.savefig(DIAGRAMS / "ml-cnn-transformer-loss-curve.png", bbox_inches="tight")
    plt.close()

    plt.figure(figsize=(16, 5))
    plt.plot(targets_inv[:200], label="True", color="lime", linewidth=2)
    plt.plot(
        preds_inv[:200], label="Predicted", color="magenta", linewidth=2, alpha=0.9
    )
    plt.title("Prediction vs True Value", fontsize=16)
    plt.xlabel("Sample")
    plt.ylabel("Value")
    plt.legend()
    plt.grid(alpha=0.3)
    plt.savefig(DIAGRAMS / "ml-cnn-transformer-prediction.png", bbox_inches="tight")
    plt.close()

    residuals = targets_inv - preds_inv
    residual_stats = {
        "mean": round(float(np.mean(residuals)), 4),
        "std": round(float(np.std(residuals)), 4),
    }
    plt.figure(figsize=(14, 5))
    sns.histplot(residuals, kde=True, color="dodgerblue", bins=40)
    plt.title("Residual Distribution", fontsize=16)
    plt.xlabel("Residual")
    plt.ylabel("Count")
    plt.grid(alpha=0.3)
    plt.savefig(DIAGRAMS / "ml-cnn-transformer-residuals.png", bbox_inches="tight")
    plt.close()

    plt.figure(figsize=(7, 7))
    plt.scatter(
        targets_inv,
        preds_inv,
        c=np.linspace(0, 1, len(targets_inv)),
        cmap="rainbow",
        alpha=0.7,
    )
    lim = [targets_inv.min(), targets_inv.max()]
    plt.plot(lim, lim, "k--", linewidth=2)
    plt.title("Predicted vs Actual Scatter", fontsize=16)
    plt.xlabel("Actual")
    plt.ylabel("Predicted")
    plt.grid(alpha=0.3)
    plt.savefig(DIAGRAMS / "ml-cnn-transformer-scatter.png", bbox_inches="tight")
    plt.close()

    # ---------------------------------------------------------------- 汇总
    metrics = {
        "device": str(DEVICE),
        "seed": 42,
        "params": n_params,
        "train_samples": len(X_train),
        "test_samples": len(X_test),
        "train_mse_scaled": round(train_losses[-1], 6),
        "test_mse_scaled": round(test_losses[-1], 6),
        "train_seconds": round(seconds, 2),
        "model_inverse": m_model,
        "persistence_inverse": m_persist,
        "residual": residual_stats,
    }
    METRICS_PATH.write_text(json.dumps(metrics, indent=2, ensure_ascii=False) + "\n")

    print(f"params={n_params}  train/test samples={len(X_train)}/{len(X_test)}")
    print(
        f"final epoch MSE (scaled): train={train_losses[-1]:.6f}  test={test_losses[-1]:.6f}"
    )
    print(f"training time: {seconds:.1f}s on {DEVICE}")
    print(f"model       (inverse): {m_model}")
    print(f"persistence (inverse): {m_persist}")
    print(f"plots -> {DIAGRAMS}")
    print(f"metrics -> {METRICS_PATH}")


if __name__ == "__main__":
    main()
