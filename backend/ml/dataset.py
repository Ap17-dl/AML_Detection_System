"""Feature engineering pipeline for AML transaction prediction (AML-FR-07).

Extracts behavioral, temporal, and monetary features from transactions.
"""

from __future__ import annotations

import math
from datetime import datetime

import numpy as np
import pandas as pd

FEATURE_NAMES = [
    "amount",
    "log_amount",
    "hour_of_day",
    "day_of_week",
    "is_weekend",
    "is_night",
    "is_round_amount",
    "channel_online",
    "channel_branch",
    "channel_atm",
    "channel_wire",
    "txn_velocity_24h",
    "amount_to_avg_ratio",
]


def extract_features_single(
    amount: float,
    occurred_at: datetime,
    channel: str | None = None,
    txn_velocity_24h: float = 1.0,
    historical_avg_amount: float | None = None,
) -> np.ndarray:
    """Extracts feature vector for a single transaction during live inference."""
    amt = float(amount)
    log_amt = math.log(max(amt, 0.01) + 1.0)
    hour = occurred_at.hour
    dow = occurred_at.weekday()
    is_weekend = 1.0 if dow >= 5 else 0.0
    is_night = 1.0 if (hour < 6 or hour >= 22) else 0.0
    is_round = 1.0 if (amt >= 100.0 and amt % 100 == 0) else 0.0

    ch = (channel or "").lower()
    ch_online = 1.0 if ch == "online" else 0.0
    ch_branch = 1.0 if ch == "branch" else 0.0
    ch_atm = 1.0 if ch == "atm" else 0.0
    ch_wire = 1.0 if ch == "wire" else 0.0

    avg_amt = (
        historical_avg_amount if historical_avg_amount and historical_avg_amount > 0 else 500.0
    )
    ratio = amt / avg_amt

    return np.array(
        [
            amt,
            log_amt,
            float(hour),
            float(dow),
            is_weekend,
            is_night,
            is_round,
            ch_online,
            ch_branch,
            ch_atm,
            ch_wire,
            float(txn_velocity_24h),
            float(ratio),
        ],
        dtype=np.float32,
    ).reshape(1, -1)


def extract_features_dataframe(df: pd.DataFrame) -> pd.DataFrame:
    """Extracts features for a DataFrame of transactions."""
    out = pd.DataFrame(index=df.index)

    out["amount"] = df["amount"].astype(float)
    out["log_amount"] = np.log(np.maximum(out["amount"], 0.01) + 1.0)

    # Date/time features
    occurred = pd.to_datetime(df["occurred_at"])
    out["hour_of_day"] = occurred.dt.hour.astype(float)
    out["day_of_week"] = occurred.dt.dayofweek.astype(float)
    out["is_weekend"] = (out["day_of_week"] >= 5).astype(float)
    out["is_night"] = ((out["hour_of_day"] < 6) | (out["hour_of_day"] >= 22)).astype(float)

    # Structuring indicators
    out["is_round_amount"] = ((out["amount"] >= 100.0) & (out["amount"] % 100.0 == 0)).astype(float)

    # Channels
    ch = df["channel"].fillna("").str.lower()
    out["channel_online"] = (ch == "online").astype(float)
    out["channel_branch"] = (ch == "branch").astype(float)
    out["channel_atm"] = (ch == "atm").astype(float)
    out["channel_wire"] = (ch == "wire").astype(float)

    # Velocity and historical context
    if "txn_velocity_24h" in df.columns:
        out["txn_velocity_24h"] = df["txn_velocity_24h"].astype(float)
    else:
        out["txn_velocity_24h"] = 1.0

    if "historical_avg_amount" in df.columns:
        avg_amt = df["historical_avg_amount"].fillna(500.0).replace(0, 500.0).astype(float)
        out["amount_to_avg_ratio"] = out["amount"] / avg_amt
    else:
        out["amount_to_avg_ratio"] = out["amount"] / 500.0

    return out[FEATURE_NAMES]
