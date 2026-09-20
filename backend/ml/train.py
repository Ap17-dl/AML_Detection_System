"""Model training and evaluation script for XGBoost AML classifier (AML-FR-07, AML-FR-08, AML-FR-09).

Trains an XGBoost model, computes evaluation metrics (Precision, Recall, F1,
PR-AUC, ROC-AUC, FPR, FNR), and serializes model artifacts.
"""

from __future__ import annotations

import argparse
import json
from datetime import UTC, datetime
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
from sklearn.model_selection import train_test_split
from xgboost import XGBClassifier

from ml.dataset import FEATURE_NAMES, extract_features_dataframe
from ml.generate_synthetic_data import generate_synthetic_transactions


def train_aml_model(
    data_path: str | None = None,
    model_version: str = "xgb_v1.0.0",
    artifacts_dir: str = "backend/ml/artifacts",
    random_state: int = 42,
) -> dict:
    """Trains XGBoost model, evaluates, and saves artifact."""
    if data_path and Path(data_path).exists():
        print(f"Loading data from {data_path}...")
        df = pd.read_csv(data_path)
    else:
        print("Generating synthetic dataset (5000 records, 5% positive)...")
        df = generate_synthetic_transactions(
            num_samples=5000, laundering_ratio=0.05, seed=random_state
        )

    X = extract_features_dataframe(df)
    y = df["is_laundering"].astype(int).to_numpy()

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.25, random_state=random_state, stratify=y
    )

    pos_weight = (len(y_train) - sum(y_train)) / max(sum(y_train), 1)

    print(f"Training XGBoost classifier (scale_pos_weight={pos_weight:.2f})...")
    model = XGBClassifier(
        n_estimators=120,
        max_depth=5,
        learning_rate=0.08,
        scale_pos_weight=pos_weight,
        subsample=0.85,
        colsample_bytree=0.85,
        eval_metric="logloss",
        random_state=random_state,
    )
    model.fit(X_train, y_train)

    # ── Evaluation ───────────────────────────────────────────────────────────
    y_prob = model.predict_proba(X_test)[:, 1]
    y_pred = (y_prob >= 0.5).astype(int)

    tn, fp, fn, tp = confusion_matrix(y_test, y_pred).ravel()

    precision = float(precision_score(y_test, y_pred, zero_division=0))
    recall = float(recall_score(y_test, y_pred, zero_division=0))
    f1 = float(f1_score(y_test, y_pred, zero_division=0))
    pr_auc = float(average_precision_score(y_test, y_prob))
    roc_auc = float(roc_auc_score(y_test, y_prob))
    fpr = float(fp / (fp + tn)) if (fp + tn) > 0 else 0.0
    fnr = float(fn / (fn + tp)) if (fn + tp) > 0 else 0.0

    metrics = {
        "model_version": model_version,
        "algorithm": "XGBoost",
        "trained_at": datetime.now(UTC).isoformat(),
        "training_dataset": "synthetic_aml_5000",
        "precision_score": round(precision, 4),
        "recall_score": round(recall, 4),
        "f1_score": round(f1, 4),
        "pr_auc": round(pr_auc, 4),
        "roc_auc": round(roc_auc, 4),
        "false_positive_rate": round(fpr, 4),
        "false_negative_rate": round(fnr, 4),
        "threshold_low_max": 0.30,
        "threshold_medium_max": 0.70,
        "feature_names": FEATURE_NAMES,
    }

    print("\n" + "=" * 50)
    print(f"MODEL METRICS: {model_version}")
    print("=" * 50)
    print(f"Precision:           {metrics['precision_score']:.4f}")
    print(f"Recall:              {metrics['recall_score']:.4f}")
    print(f"F1 Score:            {metrics['f1_score']:.4f}")
    print(f"PR-AUC:              {metrics['pr_auc']:.4f}")
    print(f"ROC-AUC:             {metrics['roc_auc']:.4f}")
    print(f"False Positive Rate: {metrics['false_positive_rate']:.4f}")
    print(f"False Negative Rate: {metrics['false_negative_rate']:.4f}")
    print("=" * 50 + "\n")

    # ── Save Artifacts ───────────────────────────────────────────────────────
    out_dir = Path(artifacts_dir)
    out_dir.mkdir(parents=True, exist_ok=True)
    artifact_file = out_dir / f"{model_version}.joblib"
    meta_file = out_dir / f"{model_version}_meta.json"

    payload = {
        "model": model,
        "metrics": metrics,
        "feature_names": FEATURE_NAMES,
    }
    joblib.dump(payload, artifact_file)
    with open(meta_file, "w") as f:
        json.dump(metrics, f, indent=2)

    print(f"Model artifact saved to: {artifact_file}")
    print(f"Metadata saved to:       {meta_file}")

    return metrics


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Train XGBoost AML detection model")
    parser.add_argument("--data", type=str, default=None, help="Input CSV path")
    parser.add_argument("--version", type=str, default="xgb_v1.0.0", help="Model version string")
    parser.add_argument(
        "--artifacts", type=str, default="backend/ml/artifacts", help="Artifacts directory"
    )
    args = parser.parse_args()

    train_aml_model(data_path=args.data, model_version=args.version, artifacts_dir=args.artifacts)
