"""Model evaluation harness for AML detection models (AML-FR-07)."""

from __future__ import annotations

import argparse
from pathlib import Path

import joblib
import pandas as pd
from sklearn.metrics import (
    average_precision_score,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from ml.dataset import extract_features_dataframe
from ml.generate_synthetic_data import generate_synthetic_transactions


def evaluate_model(
    artifact_path: str,
    test_data_path: str | None = None,
    samples: int = 1000,
) -> dict:
    """Loads saved model artifact and computes full evaluation suite."""
    artifact = joblib.load(artifact_path)
    model = artifact["model"]

    if test_data_path and Path(test_data_path).exists():
        df = pd.read_csv(test_data_path)
    else:
        df = generate_synthetic_transactions(num_samples=samples, laundering_ratio=0.05, seed=999)

    X = extract_features_dataframe(df)
    y = df["is_laundering"].astype(int).to_numpy()

    y_prob = model.predict_proba(X)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    tn, fp, fn, tp = confusion_matrix(y, y_pred).ravel()

    metrics = {
        "precision": float(precision_score(y, y_pred, zero_division=0)),
        "recall": float(recall_score(y, y_pred, zero_division=0)),
        "f1": float(f1_score(y, y_pred, zero_division=0)),
        "pr_auc": float(average_precision_score(y, y_prob)),
        "roc_auc": float(roc_auc_score(y, y_prob)),
        "fpr": float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0,
        "fnr": float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0,
        "true_positives": int(tp),
        "false_positives": int(fp),
        "true_negatives": int(tn),
        "false_negatives": int(fn),
    }

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Evaluate AML Model Artifact")
    parser.add_argument("--artifact", type=str, default="backend/ml/artifacts/xgb_v1.0.0.joblib")
    parser.add_argument("--test-data", type=str, default=None)
    args = parser.parse_args()

    results = evaluate_model(args.artifact, args.test_data)
    print("Evaluation Results:", results)
