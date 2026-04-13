from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from typing import Dict, List, Tuple

import matplotlib.pyplot as plt
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.impute import SimpleImputer
from sklearn.metrics import accuracy_score
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder


PROJECT_ROOT = Path(__file__).resolve().parents[1]
DATA_DIR = PROJECT_ROOT / "data"
RESULTS_DIR = PROJECT_ROOT / "results"
GRAPHS_DIR = RESULTS_DIR / "graphs"


@dataclass(frozen=True)
class MonitorFinding:
    dataset: str
    scenario: str
    accuracy: float
    acc_drop: float
    psi: float
    confidence_drop: float
    top_drift_feature: str


def _ensure_dirs() -> None:
    if RESULTS_DIR.exists() and RESULTS_DIR.is_file():
        raise RuntimeError(f"Expected {RESULTS_DIR} to be a directory but it's a file.")
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)

    if GRAPHS_DIR.exists() and GRAPHS_DIR.is_file():
        GRAPHS_DIR.unlink()
    GRAPHS_DIR.mkdir(parents=True, exist_ok=True)


def _validate_non_empty_df(df: pd.DataFrame, name: str) -> None:
    if df is None or df.empty:
        raise ValueError(f"{name} is empty; refusing to write empty outputs.")
    if df.shape[1] == 0:
        raise ValueError(f"{name} has 0 columns; refusing to write empty outputs.")


def _safe_to_csv(df: pd.DataFrame, path: Path) -> None:
    _validate_non_empty_df(df, f"DataFrame for {path.name}")
    print(f"[DEBUG] About to write {path} with shape={df.shape}")
    print(df.head(10).to_string(index=False))
    df.to_csv(path, index=False)
    if not path.exists() or path.stat().st_size == 0:
        raise IOError(f"Write failed or created empty file: {path}")


def _infer_feature_types(X: pd.DataFrame) -> Tuple[List[str], List[str]]:
    numeric_cols = X.select_dtypes(include=[np.number]).columns.tolist()
    categorical_cols = [c for c in X.columns if c not in numeric_cols]
    return numeric_cols, categorical_cols


def _build_model_pipeline(X: pd.DataFrame) -> Pipeline:
    numeric_cols, categorical_cols = _infer_feature_types(X)

    numeric_transformer = Pipeline(
        steps=[
            ("imputer", SimpleImputer(strategy="median")),
        ]
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


def _psi_for_numeric(expected: np.ndarray, actual: np.ndarray, bins: int = 10, eps: float = 1e-6) -> float:
    expected = np.asarray(expected, dtype=float)
    actual = np.asarray(actual, dtype=float)
    expected = expected[np.isfinite(expected)]
    actual = actual[np.isfinite(actual)]
    if expected.size == 0 or actual.size == 0:
        return 0.0

    # Quantile bins based on expected distribution.
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


def _psi_for_categorical(expected: pd.Series, actual: pd.Series, eps: float = 1e-6) -> float:
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


def calculate_dataset_psi_breakdown(X_expected: pd.DataFrame, X_actual: pd.DataFrame, bins: int = 10) -> Dict[str, float]:
    common_cols = [c for c in X_expected.columns if c in X_actual.columns]
    if not common_cols:
        return {}

    breakdown: Dict[str, float] = {}
    for c in common_cols:
        if pd.api.types.is_numeric_dtype(X_expected[c]):
            breakdown[c] = float(_psi_for_numeric(X_expected[c].to_numpy(), X_actual[c].to_numpy(), bins=bins))
        else:
            breakdown[c] = float(_psi_for_categorical(X_expected[c], X_actual[c]))
    return breakdown


def calculate_dataset_psi(X_expected: pd.DataFrame, X_actual: pd.DataFrame, bins: int = 10) -> float:
    breakdown = calculate_dataset_psi_breakdown(X_expected, X_actual, bins=bins)
    if not breakdown:
        return 0.0
    return float(np.mean(list(breakdown.values())))


def scenario_noise_injection(X_test: pd.DataFrame, noise_level: float = 0.15, seed: int = 42) -> pd.DataFrame:
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


def scenario_distribution_shift(X_test: pd.DataFrame, factor: float = 0.20) -> pd.DataFrame:
    X_mod = X_test.copy(deep=True)
    numeric_cols = X_mod.select_dtypes(include=[np.number]).columns.tolist()
    if not numeric_cols:
        return X_mod
    for c in numeric_cols:
        col = pd.to_numeric(X_mod[c], errors="coerce")
        X_mod[c] = col.to_numpy() * (1.0 + factor)
    return X_mod


def scenario_feature_removal(X_test: pd.DataFrame, feature: str | None = None) -> Tuple[pd.DataFrame, str]:
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


def _save_graphs(dataset_name: str, findings: List[MonitorFinding], baseline_acc: float) -> None:
    df = pd.DataFrame([f.__dict__ for f in findings])
    _validate_non_empty_df(df, "findings for graphs")

    # 1) PSI vs Accuracy Drop (scatter)
    plt.figure(figsize=(10, 7))
    plt.scatter(df["psi"], df["acc_drop"], s=120, alpha=0.75)
    for _, r in df.iterrows():
        plt.annotate(str(r["scenario"]), (r["psi"], r["acc_drop"]), textcoords="offset points", xytext=(6, 6))
    plt.xlabel("PSI (Data Drift)")
    plt.ylabel("Accuracy Drop")
    plt.title(f"{dataset_name}: PSI vs Accuracy Drop")
    plt.grid(True, linestyle="--", alpha=0.4)
    out = GRAPHS_DIR / f"{dataset_name.lower()}_01_psi_vs_acc_drop.png"
    plt.tight_layout()
    plt.savefig(out, dpi=160)
    plt.close()

    # 2) Accuracy Before vs After (bar)
    plt.figure(figsize=(10, 6))
    scenarios = ["baseline"] + df["scenario"].tolist()
    accuracies = [baseline_acc] + df["accuracy"].tolist()
    bars = plt.bar(scenarios, accuracies)
    for b in bars:
        h = b.get_height()
        plt.text(b.get_x() + b.get_width() / 2, h, f"{h:.3f}", ha="center", va="bottom", fontsize=9)
    plt.ylabel("Accuracy")
    plt.ylim(0, 1)
    plt.title(f"{dataset_name}: Accuracy Before vs After")
    plt.grid(axis="y", linestyle="--", alpha=0.4)
    out = GRAPHS_DIR / f"{dataset_name.lower()}_02_accuracy_bar.png"
    plt.tight_layout()
    plt.savefig(out, dpi=160)
    plt.close()

    # 3) Degradation Trend (line)
    plt.figure(figsize=(10, 6))
    plt.plot(scenarios, accuracies, marker="o", linewidth=2)
    plt.ylabel("Accuracy")
    plt.ylim(0, 1)
    plt.title(f"{dataset_name}: Degradation Trend")
    plt.grid(True, linestyle="--", alpha=0.4)
    out = GRAPHS_DIR / f"{dataset_name.lower()}_03_degradation_trend.png"
    plt.tight_layout()
    plt.savefig(out, dpi=160)
    plt.close()

    # 4) Accuracy vs PSI comparison
    plt.figure(figsize=(10, 6))
    x = df["scenario"].tolist()
    plt.plot(x, df["accuracy"].tolist(), marker="o", label="Accuracy")
    plt.plot(x, df["psi"].tolist(), marker="s", label="PSI")
    plt.title(f"{dataset_name}: Accuracy vs PSI")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.4)
    out = GRAPHS_DIR / f"{dataset_name.lower()}_04_accuracy_vs_psi.png"
    plt.tight_layout()
    plt.savefig(out, dpi=160)
    plt.close()

    print(f"[DEBUG] Saved graphs to {GRAPHS_DIR}")


def run_monitoring_for_loan_dataset() -> pd.DataFrame:
    _ensure_dirs()

    data_path = DATA_DIR / "loan_data.csv"
    if not data_path.exists():
        raise FileNotFoundError(f"Loan dataset not found at {data_path}")

    df = pd.read_csv(data_path)
    _validate_non_empty_df(df, "loan_data.csv")

    target_col = "loan_status"
    if target_col not in df.columns:
        raise KeyError(f"Expected target column '{target_col}' not found in {data_path.name}")

    # Basic cleaning: keep NaNs (imputer will handle), but remove fully empty rows.
    df = df.dropna(how="all").reset_index(drop=True)

    X = df.drop(columns=[target_col])
    y = df[target_col]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y if y.nunique() > 1 else None,
    )

    pipe = _build_model_pipeline(X_train)
    pipe.fit(X_train, y_train)

    baseline_pred = pipe.predict(X_test)
    baseline_acc = float(accuracy_score(y_test, baseline_pred))
    baseline_conf = float(np.mean(np.max(pipe.predict_proba(X_test), axis=1)))
    print(f"[DEBUG] Loan baseline accuracy: {baseline_acc:.6f}")

    scenarios: Dict[str, pd.DataFrame] = {
        "noise": scenario_noise_injection(X_test, noise_level=0.15, seed=42),
        "shift": scenario_distribution_shift(X_test, factor=0.20),
    }
    X_removed, removed_feature = scenario_feature_removal(X_test)
    scenarios["feature_removed"] = X_removed
    print(f"[DEBUG] Loan feature_removed uses feature='{removed_feature}'")

    findings: List[MonitorFinding] = []
    for scenario_name, X_mod in scenarios.items():
        pred = pipe.predict(X_mod)
        acc = float(accuracy_score(y_test, pred))
        acc_drop = float(baseline_acc - acc)
        psi_breakdown = calculate_dataset_psi_breakdown(X_test, X_mod, bins=10)
        psi = float(np.mean(list(psi_breakdown.values()))) if psi_breakdown else 0.0
        top_drift_feature = max(psi_breakdown, key=psi_breakdown.get) if psi_breakdown else ""
        scenario_conf = float(np.mean(np.max(pipe.predict_proba(X_mod), axis=1)))
        confidence_drop = float(baseline_conf - scenario_conf)
        findings.append(
            MonitorFinding(
                dataset="Loan",
                scenario=scenario_name,
                accuracy=acc,
                acc_drop=acc_drop,
                psi=psi,
                confidence_drop=confidence_drop,
                top_drift_feature=top_drift_feature,
            )
        )

    _save_graphs("Loan", findings, baseline_acc=baseline_acc)

    out_df = pd.DataFrame([f.__dict__ for f in findings])
    out_df = out_df[
        ["dataset", "scenario", "accuracy", "acc_drop", "psi", "confidence_drop", "top_drift_feature"]
    ]
    return out_df


def main() -> None:
    df_results = run_monitoring_for_loan_dataset()
    out_path = RESULTS_DIR / "credit_results.csv"
    _safe_to_csv(df_results, out_path)
    print("[OK] Loan results saved successfully.")


if __name__ == "__main__":
    # Helps matplotlib on some Windows setups.
    os.environ.setdefault("MPLBACKEND", "Agg")
    main()
