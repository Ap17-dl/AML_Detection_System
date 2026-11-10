"""Script to generate platform sample CSVs using the FinCEN Files & Correspondent Banking Benchmark.

Replaces artificial synthetic toy data with authentic correspondent banking clearing transactions
and real leaked Suspicious Activity Reports (SARs) from the ICIJ FinCEN Files dataset (Resolves TBD-1).

Creates:
1. sample_data/transactions_standard_batch.csv (clearing baseline interbank & commercial transactions)
2. sample_data/transactions_aml_suspicious.csv (FinCEN SAR cases, structuring, circular flows, night wires)
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure backend root is on Python path
backend_dir = Path(__file__).resolve().parent.parent
if str(backend_dir) not in sys.path:
    sys.path.insert(0, str(backend_dir))

from ml.benchmark_dataset import generate_platform_sample_csvs  # noqa: E402


def generate_sample_datasets():
    print("Generating platform sample CSVs from FinCEN Files & Correspondent Banking Benchmark...")
    project_root = backend_dir.parent
    sample_dir = project_root / "sample_data"
    frontend_sample_dir = project_root / "frontend" / "public" / "sample_data"

    generate_platform_sample_csvs(
        target_sample_dir=sample_dir,
        frontend_sample_dir=frontend_sample_dir,
    )
    print(
        "\nSuccessfully updated sample datasets with real FinCEN SAR & Correspondent Banking data."
    )


if __name__ == "__main__":
    generate_sample_datasets()
