"""Legacy module notice: synthetic data generation has been deprecated.

Please use `ml.benchmark_dataset` which provides the authentic FinCEN Files &
Correspondent Banking AML benchmark dataset (Resolves TBD-1).
"""

from __future__ import annotations

import warnings

import pandas as pd

from ml.benchmark_dataset import generate_benchmark_transactions


def generate_synthetic_transactions(
    num_samples: int = 5000,
    laundering_ratio: float = 0.05,
    seed: int = 42,
) -> pd.DataFrame:
    """[DEPRECATED] Re-routes to generate_benchmark_transactions using the FinCEN Files AML benchmark."""
    warnings.warn(
        "generate_synthetic_transactions is deprecated in favor of the FinCEN Files "
        "& Correspondent Banking Benchmark dataset in `ml.benchmark_dataset`.",
        DeprecationWarning,
        stacklevel=2,
    )
    return generate_benchmark_transactions(
        num_samples=num_samples,
        laundering_ratio=laundering_ratio,
        seed=seed,
    )


if __name__ == "__main__":
    import argparse
    from pathlib import Path

    parser = argparse.ArgumentParser(description="Generate AML Benchmark Dataset (FinCEN Files)")
    parser.add_argument("--samples", type=int, default=5000, help="Number of records")
    parser.add_argument("--ratio", type=float, default=0.05, help="Laundering ratio")
    parser.add_argument(
        "--out", type=str, default="backend/ml/data/aml_benchmark_dataset.csv", help="Output path"
    )
    args = parser.parse_args()

    out_path = Path(args.out)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    print(f"Generating {args.samples} benchmark transactions from FinCEN Files...")
    df = generate_benchmark_transactions(num_samples=args.samples, laundering_ratio=args.ratio)
    df.to_csv(out_path, index=False)
    print(f"Saved to {out_path} ({len(df)} rows, {df['is_laundering'].sum()} positive cases).")
