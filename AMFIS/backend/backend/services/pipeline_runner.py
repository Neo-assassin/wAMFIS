import os
import sys
from pathlib import Path

import numpy as np
import pandas as pd
from django.conf import settings
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder

PROJECT_ROOT = Path(__file__).resolve().parents[2].parent
DATA_DIR = PROJECT_ROOT / "data"
RESULTS_DIR = PROJECT_ROOT / "results"
GRAPHS_DIR = RESULTS_DIR / "graphs"


def _infer_feature_types(X):
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = [c for c in X.columns if c not in numeric_cols]
    return numeric_cols, categorical_cols


def _build_model_pipeline(X):
    numeric_cols, categorical_cols = _infer_feature_types(X)

    numeric_transformer = Pipeline(
        steps=[("imputer", SimpleImputer(strategy="median"))]
    )
    categorical_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="most_frequent")),
            ("onehot", OneHotEncoder(handle_unknown="ignore")),
        ]
    )

    preprocessor = ColumnTransformer(
        transformers=[
            ("num", numeric_transformer, numeric_cols),
            ("cat", categorical_transformer, categorical_cols),
        ],
        remainder="drop",
        sparse_threshold=0.3,
    )

    clf = RandomForestClassifier(
        n_estimators=300,
        random_state=42,
        n_jobs=-1,
        class_weight="balanced",
    )

    return Pipeline(steps=[("preprocessor", preprocessor), ("model", clf)])


def _psi_for_numeric(expected, actual, bins=10, eps=1e-6):
    expected = np.asarray(expected, dtype=float)
    actual = np.asarray(actual, dtype=float)
    expected = expected[np.isfinite(expected)]
    actual = actual[np.isfinite(actual)]
    if expected.size == 0 or actual.size == 0:
        return 0.0

    quantiles = np.linspace(0, 1, bins + 1)
    edges = np.quantile(expected, quantiles)
    edges[0] = -np.inf
    edges[-1] = np.inf
    edges = np.unique(edges)
    if edges.size < 3:
        return 0.0

    exp_counts, _ = np.histogram(expected, bins=edges)
    act_counts, _ = np.histogram(actual, bins=edges)

    exp_pct = exp_counts / max(exp_counts.sum(), 1)
    act_pct = act_counts / max(act_counts.sum(), 1)

    exp_pct = np.clip(exp_pct, eps, 1.0)
    act_pct = np.clip(act_pct, eps, 1.0)

    return float(np.sum((act_pct - exp_pct) * np.log(act_pct / exp_pct)))


def _psi_for_categorical(expected, actual, eps=1e-6):
    expected = expected.astype("string").fillna("<<MISSING>>")
    actual = actual.astype("string").fillna("<<MISSING>>")

    exp_freq = expected.value_counts(normalize=True, dropna=False)
    act_freq = actual.value_counts(normalize=True, dropna=False)
    all_cats = exp_freq.index.union(act_freq.index)

    exp = exp_freq.reindex(all_cats, fill_value=0.0).to_numpy()
    act = act_freq.reindex(all_cats, fill_value=0.0).to_numpy()

    exp = np.clip(exp, eps, 1.0)
    act = np.clip(act, eps, 1.0)
    return float(np.sum((act - exp) * np.log(act / exp)))


def calculate_dataset_psi_breakdown(X_expected, X_actual, bins=10):
    common_cols = [c for c in X_expected.columns if c in X_actual.columns]
    if not common_cols:
        return {}

    breakdown = {}
    for c in common_cols:
        if pd.api.types.is_numeric_dtype(X_expected[c]):
            breakdown[c] = float(_psi_for_numeric(X_expected[c].to_numpy(), X_actual[c].to_numpy(), bins=bins))
        else:
            breakdown[c] = float(_psi_for_categorical(X_expected[c], X_actual[c]))
    return breakdown


def scenario_noise_injection(X_test, noise_level=0.15, seed=42):
    rng = np.random.default_rng(seed)
    X_mod = X_test.copy(deep=True)
    numeric_cols = X_mod.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        return X_mod
    for c in numeric_cols:
        col = pd.to_numeric(X_mod[c], errors="coerce")
        std = float(np.nanstd(col.to_numpy()))
        if not np.isfinite(std) or std == 0:
            std = 1.0
        noise = rng.normal(loc=0.0, scale=noise_level * std, size=len(X_mod))
        X_mod[c] = col.to_numpy() + noise
    return X_mod


def scenario_distribution_shift(X_test, factor=0.20):
    X_mod = X_test.copy(deep=True)
    numeric_cols = X_mod.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        return X_mod
    for c in numeric_cols:
        col = pd.to_numeric(X_mod[c], errors="coerce")
        X_mod[c] = col.to_numpy() * (1.0 + factor)
    return X_mod


def scenario_feature_removal(X_test, feature=None):
    X_mod = X_test.copy(deep=True)
    cols = X_mod.columns.tolist()
    if not cols:
        return X_mod, ""

    if feature is None:
        numeric_cols = X_mod.select_dtypes(include=[np.number]).columns.tolist()
        feature = numeric_cols[0] if numeric_cols else cols[0]

    if feature not in X_mod.columns:
        feature = cols[0]

    if pd.api.types.is_numeric_dtype(X_mod[feature]):
        X_mod[feature] = np.nan
    else:
        X_mod[feature] = "Unknown"
    return X_mod, feature


def run_pipeline_for_dataset(dataset_name="Adult"):
    """Run the monitoring pipeline and return results."""
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

    if dataset_name == "Adult":
        data_path = DATA_DIR / "adult.csv"
        target_col = "income"
    elif dataset_name == "Loan":
        data_path = DATA_DIR / "loan_data.csv"
        target_col = "loan_status"
    else:
        raise ValueError(f"Unknown dataset: {dataset_name}")

    if not data_path.exists():
        raise FileNotFoundError(f"Dataset not found at {data_path}")

    df = pd.read_csv(data_path)

    if dataset_name == "Adult":
        df = df.replace([" ?", "?"], np.nan)
        df = df.dropna(how="all").reset_index(drop=True)
        df[target_col] = df[target_col].astype("string").apply(lambda x: 1 if ">50K" in str(x) else 0)
    elif dataset_name == "Loan":
        df[target_col] = df[target_col].map({"approved": 1, "rejected": 0}).fillna(0).astype(int)

    X = df.drop(columns=[target_col])
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y if y.nunique() > 1 else None
    )

    pipe = _build_model_pipeline(X_train)
    pipe.fit(X_train, y_train)

    baseline_pred = pipe.predict(X_test)
    baseline_acc = float(accuracy_score(y_test, baseline_pred))
    baseline_conf = float(np.mean(np.max(pipe.predict_proba(X_test), axis=1)))

    scenarios = {
        "noise": scenario_noise_injection(X_test, noise_level=0.15, seed=42),
        "shift": scenario_distribution_shift(X_test, factor=0.20),
    }
    X_removed, removed_feature = scenario_feature_removal(X_test)
    scenarios["feature_removed"] = X_removed

    results = []
    for scenario_name, X_mod in scenarios.items():
        pred = pipe.predict(X_mod)
        acc = float(accuracy_score(y_test, pred))
        acc_drop = float(baseline_acc - acc)
        psi_breakdown = calculate_dataset_psi_breakdown(X_test, X_mod, bins=10)
        psi = float(np.mean(list(psi_breakdown.values()))) if psi_breakdown else 0.0
        top_drift_feature = max(psi_breakdown, key=psi_breakdown.get) if psi_breakdown else ""
        scenario_conf = float(np.mean(np.max(pipe.predict_proba(X_mod), axis=1)))
        confidence_drop = float(baseline_conf - scenario_conf)

        results.append({
            "dataset": dataset_name,
            "scenario": scenario_name,
            "accuracy": acc,
            "acc_drop": acc_drop,
            "psi": psi,
            "confidence_drop": confidence_drop,
            "top_drift_feature": top_drift_feature,
            "baseline_accuracy": baseline_acc,
        })

    return results, baseline_acc


def run_full_pipeline():
    """Run pipeline for all datasets."""
    all_results = []

    for dataset in ["Adult", "Loan"]:
        try:
            results, baseline = run_pipeline_for_dataset(dataset)
            all_results.extend(results)
        except FileNotFoundError:
            print(f"Skipping {dataset} - data file not found")

    return all_results