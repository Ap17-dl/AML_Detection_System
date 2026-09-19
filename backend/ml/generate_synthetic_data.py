"""Synthetic AML dataset generator (AML-FR-04, AML-FR-07).

Generates realistic normal and money laundering transactions for training
and benchmarking the XGBoost classifier.
"""

from __future__ import annotations

import argparse
import random
from datetime import datetime, timedelta, timezone
from pathlib import Path

import pandas as pd


def generate_synthetic_transactions(
    num_samples: int = 5000,
    laundering_ratio: float = 0.05,
    seed: int = 42,
) -> pd.DataFrame:
    """Generates synthetic transactions with labels and behavioral features."""
    random.seed(seed)

    channels = ["online", "branch", "atm", "wire"]
    channel_weights_normal = [0.65, 0.15, 0.15, 0.05]
    channel_weights_laundering = [0.40, 0.10, 0.10, 0.40]

    types = ["transfer", "deposit", "withdrawal", "wire"]

    base_time = datetime(2026, 1, 1, 0, 0, 0, tzinfo=timezone.utc)
    records = []

    num_laundering = int(num_samples * laundering_ratio)
    num_normal = num_samples - num_laundering

    # ── Normal transactions ──────────────────────────────────────────────────
    for i in range(num_normal):
        # Normal amounts follow lognormal distribution around $150
        amount = round(random.lognormvariate(4.8, 1.0), 2)
        amount = max(5.0, min(amount, 8000.0))

        # Mostly business hours (8 AM - 8 PM)
        day_offset = random.randint(0, 90)
        hour = (
            random.randint(8, 20)
            if random.random() < 0.85
            else random.choice([6, 7, 21, 22, 23])
        )
        minute = random.randint(0, 59)
        occurred_at = base_time + timedelta(days=day_offset, hours=hour, minutes=minute)

        ch = random.choices(channels, weights=channel_weights_normal)[0]
        txn_type = "wire" if ch == "wire" else random.choice(types[:3])

        records.append(
            {
                "transaction_id": f"norm_{i:06d}",
                "amount": amount,
                "currency": "USD",
                "transaction_type": txn_type,
                "channel": ch,
                "occurred_at": occurred_at.isoformat(),
                "txn_velocity_24h": max(1, int(random.expovariate(0.8))),
                "historical_avg_amount": round(amount * random.uniform(0.7, 1.4), 2),
                "is_laundering": 0,
            }
        )

    # ── Laundering transactions ──────────────────────────────────────────────
    for i in range(num_laundering):
        typ = random.choice(["structuring", "rapid_movement", "large_wire", "night_anomaly"])

        day_offset = random.randint(0, 90)

        if typ == "structuring":
            # Amounts just below reporting threshold $10,000 (e.g. 9,100 to 9,900)
            amount = float(random.choice([9200, 9500, 9800, 9900, 9950]))
            hour = random.randint(9, 18)
            ch = random.choice(["branch", "online"])
            velocity = random.randint(3, 8)
            avg_amount = 450.0  # huge spike over typical customer average
        elif typ == "large_wire":
            # High-value wire transfers
            amount = round(random.uniform(25000.0, 250000.0), 2)
            hour = random.randint(0, 23)
            ch = "wire"
            velocity = random.randint(2, 5)
            avg_amount = 1200.0
        elif typ == "night_anomaly":
            # High amounts at 2 AM - 4 AM
            amount = round(random.uniform(8000.0, 50000.0), 2)
            hour = random.choice([1, 2, 3, 4])
            ch = random.choice(["online", "wire"])
            velocity = random.randint(4, 10)
            avg_amount = 300.0
        else:  # rapid_movement
            amount = round(random.uniform(4000.0, 15000.0), 2)
            hour = random.randint(8, 22)
            ch = "online"
            velocity = random.randint(6, 15)
            avg_amount = 600.0

        minute = random.randint(0, 59)
        occurred_at = base_time + timedelta(days=day_offset, hours=hour, minutes=minute)

        records.append(
            {
                "transaction_id": f"aml_{i:06d}",
                "amount": amount,
                "currency": "USD",
                "transaction_type": "wire" if ch == "wire" else "transfer",
                "channel": ch,
                "occurred_at": occurred_at.isoformat(),
                "txn_velocity_24h": velocity,
                "historical_avg_amount": avg_amount,
                "is_laundering": 1,
            }
        )

    df = pd.DataFrame(records)
    # Shuffle dataset
    df = df.sample(frac=1.0, random_state=seed).reset_index(drop=True)
    return df


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Generate synthetic AML transaction dataset")
    parser.add_argument("--samples", type=int, default=5000, help="Number of records")
    parser.add_argument("--ratio", type=float, default=0.05, help="Laundering ratio")
    parser.add_argument("--out", type=str, default="backend/ml/data/synthetic_aml.csv", help="Output path")
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)

    print(f"Generating {args.samples} synthetic transactions ({args.ratio*100:.1f}% laundering)...")
    df = generate_synthetic_transactions(num_samples=args.samples, laundering_ratio=args.ratio)
    df.to_csv(out_path, index=False)
    print(f"Saved to {out_path} ({len(df)} rows, {df['is_laundering'].sum()} positive cases).")
