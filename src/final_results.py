from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import KFold, StratifiedKFold, cross_val_score

# Note: optional external dataset modules (e.g., german) are not imported here to
# keep this module self-contained. If you need to include additional datasets,
# load them from the runner or pass them into `merge_monitoring_dataframes`.


PROJECT_ROOT = Path(__file__).resolve().parents[1]
RESULTS_DIR = PROJECT_ROOT / "results"
GRAPHS_DIR = RESULTS_DIR / "graphs"


BASE_REQUIRED_COLUMNS = ["dataset", "scenario", "accuracy", "acc_drop", "psi"]
RISK_LABELS = ["Low", "Moderate", "High"]


def _read_required_csv(path: Path) -> pd.DataFrame:
    if not path.exists():
        raise FileNotFoundError(f"Required results file not found: {path}")
    df = pd.read_csv(path)
    if df is None or df.empty:
        raise ValueError(f"{path.name} is empty; cannot merge.")
    missing = [c for c in BASE_REQUIRED_COLUMNS if c not in df.columns]
    if missing:
        raise KeyError(f"{path.name} missing required columns: {missing}")

    # Keep all columns (so extra dataset-level diagnostics can pass through),
    # but enforce required numeric types.
    df = df.copy()
    # Enforce numeric types.
    for c in ["accuracy", "acc_drop", "psi"]:
        df[c] = pd.to_numeric(df[c], errors="coerce")
    return df


def analyze_risk_rule_based(psi: float, acc_drop: float) -> Tuple[str, str, str]:
    """
    Rule-based AI monitor:
    - PSI: drift severity
    - Accuracy drop: performance degradation severity
    """
    psi = float(0.0 if psi is None or not np.isfinite(psi) else psi)
    acc_drop = float(0.0 if acc_drop is None or not np.isfinite(acc_drop) else acc_drop)

    if psi >= 0.25 or acc_drop >= 0.15:
        return (
            "High",
            "Significant drift and/or accuracy degradation detected.",
            "Trigger incident workflow; retrain model and review data pipeline.",
        )
    if psi >= 0.10 or acc_drop >= 0.07:
        return (
            "Moderate",
            "Moderate drift and/or degradation detected.",
            "Monitor closely; validate recent data changes; consider scheduled retraining.",
        )
    return ("Low", "Model appears stable under current checks.", "No action required; continue monitoring.")


def compute_health(psi: float, acc_drop: float) -> float:
    psi = float(0.0 if psi is None or not np.isfinite(psi) else psi)
    acc_drop = float(0.0 if acc_drop is None or not np.isfinite(acc_drop) else acc_drop)
    # Clamp to keep frontend-friendly.
    health = 1.0 - (0.5 * acc_drop + 0.5 * min(psi, 1.0))
    return float(np.clip(health, 0.0, 1.0))


def train_risk_model_from_final_results(final_results_path: Path) -> Tuple[RandomForestClassifier, Dict[str, int]]:
    """
    Train a classifier to predict risk from [psi, acc_drop] using final_results.csv.
    Saves the trained model to results/ai_model.pkl (caller handles saving).
    """
    if not final_results_path.exists():
        raise FileNotFoundError(f"Training source not found: {final_results_path}")

    df = pd.read_csv(final_results_path)
    if df is None or df.empty:
        raise ValueError("final_results.csv is empty; cannot train risk model.")

    needed = {"psi", "acc_drop", "risk"}
    missing = sorted(list(needed - set(df.columns)))
    if missing:
        raise KeyError(f"final_results.csv missing required training columns: {missing}")

    df = df.copy()
    df["psi"] = pd.to_numeric(df["psi"], errors="coerce")
    df["acc_drop"] = pd.to_numeric(df["acc_drop"], errors="coerce")
    df["risk"] = df["risk"].astype("string")

    df = df.dropna(subset=["psi", "acc_drop", "risk"])
    df = df[df["risk"].isin(RISK_LABELS)]
    if df.empty:
        raise ValueError("No valid training rows after cleaning (risk labels or numeric coercion).")

    X = df[["psi", "acc_drop"]].to_numpy(dtype=float)
    y = df["risk"].to_numpy()

    label_to_id = {label: i for i, label in enumerate(RISK_LABELS)}
    y_enc = np.array([label_to_id[v] for v in y], dtype=int)

    model = RandomForestClassifier(
        n_estimators=400,
        random_state=42,
        class_weight="balanced",
    )

    # Cross-validation (small-data safe).
    unique, counts = np.unique(y_enc, return_counts=True)
    min_class = int(counts.min()) if counts.size else 0

    cv_scores = None
    if min_class >= 2 and unique.size >= 2:
        n_splits = min(3, min_class)
        cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y_enc, cv=cv, scoring="accuracy")
    elif len(y_enc) >= 3:
        cv = KFold(n_splits=min(3, len(y_enc)), shuffle=True, random_state=42)
        cv_scores = cross_val_score(model, X, y_enc, cv=cv, scoring="accuracy")

    if cv_scores is not None:
        print(
            f"[DEBUG] AI risk model CV accuracy: mean={cv_scores.mean():.3f}, std={cv_scores.std():.3f}, scores={np.round(cv_scores, 3)}"
        )
    else:
        print("[DEBUG] AI risk model CV skipped (too few samples per class).")

    model.fit(X, y_enc)
    return model, label_to_id


def predict_risk(model: RandomForestClassifier, psi: float, acc_drop: float) -> str:
    psi = float(0.0 if psi is None or not np.isfinite(psi) else psi)
    acc_drop = float(0.0 if acc_drop is None or not np.isfinite(acc_drop) else acc_drop)
    pred = int(model.predict(np.array([[psi, acc_drop]], dtype=float))[0])
    return RISK_LABELS[pred] if 0 <= pred < len(RISK_LABELS) else "Moderate"


def compute_dataset_degradation_scores(df: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame]:
    # dataset-level aggregates
    agg = (
        df.groupby("dataset", as_index=False)
        .agg(avg_acc_drop=("acc_drop", "mean"), avg_psi=("psi", "mean"), avg_health=("health", "mean"))
        .copy()
    )
    agg["degradation_score_raw"] = 0.6 * agg["avg_acc_drop"] + 0.4 * agg["avg_psi"]
    mn = float(agg["degradation_score_raw"].min())
    mx = float(agg["degradation_score_raw"].max())
    if np.isfinite(mx) and np.isfinite(mn) and mx > mn:
        agg["degradation_score"] = (agg["degradation_score_raw"] - mn) / (mx - mn)
    else:
        agg["degradation_score"] = 0.0

    out = df.merge(agg[["dataset", "degradation_score"]], on="dataset", how="left")
    return out, agg.sort_values("degradation_score", ascending=False)


def diagnose_root_cause(df: pd.DataFrame) -> pd.DataFrame:
    df = df.copy()
    # Precompute within-dataset maxima for rule comparisons.
    max_drop_scenario = df.loc[df.groupby("dataset")["acc_drop"].idxmax()][["dataset", "scenario"]].rename(
        columns={"scenario": "max_drop_scenario"}
    )
    max_psi_scenario = df.loc[df.groupby("dataset")["psi"].idxmax()][["dataset", "scenario"]].rename(
        columns={"scenario": "max_psi_scenario"}
    )
    df = df.merge(max_drop_scenario, on="dataset", how="left").merge(max_psi_scenario, on="dataset", how="left")

    def _row_diag(r: pd.Series) -> Tuple[str, str, str]:
        psi = float(r.get("psi", 0.0) or 0.0)
        acc_drop = float(r.get("acc_drop", 0.0) or 0.0)
        scenario = str(r.get("scenario", ""))
        md = str(r.get("max_drop_scenario", ""))
        mp = str(r.get("max_psi_scenario", ""))

        # Severity: align to risk bands but independent of AI model.
        severity = "High" if (psi >= 0.25 or acc_drop >= 0.15) else "Moderate" if (psi >= 0.10 or acc_drop >= 0.07) else "Low"

        if psi >= 0.10 and acc_drop >= 0.07:
            root = "Data drift is the main cause of degradation."
            component = "data_distribution"
        elif psi < 0.10 and acc_drop >= 0.07:
            root = "Model weakness or feature issue is likely the main cause."
            component = "model"
        else:
            root = "No strong degradation signal; system appears stable."
            component = "monitoring"

        if md == "feature_removed":
            root = "Model is highly dependent on a specific feature (feature removal caused the largest drop)."
            component = "feature_dependency"
        if mp == "shift":
            # Add sensitivity note; keep root cause if already specific.
            if "dependent on a specific feature" not in root:
                root = "System is sensitive to distribution changes (shift caused the highest drift)."
                component = "data_distribution"

        # Scenario-specific tuning.
        if scenario == "feature_removed" and severity != "Low":
            component = "feature_dependency"

        return root, severity, component

    diags = df.apply(_row_diag, axis=1, result_type="expand")
    df["root_cause"] = diags[0]
    df["severity"] = diags[1]
    df["affected_component"] = diags[2]
    return df


def save_dataset_comparison_graph(final_df: pd.DataFrame) -> Path:
    import matplotlib.pyplot as plt

    GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

    if final_df is None or final_df.empty:
        raise ValueError("final_df is empty; cannot generate dataset comparison graph.")
    for col in ["dataset", "scenario", "accuracy"]:
        if col not in final_df.columns:
            raise KeyError(f"final_df missing required column '{col}' for graph.")

    scenario_order = ["noise", "shift", "feature_removed"]
    df = final_df.copy()
    df["scenario"] = df["scenario"].astype("string")
    if df["scenario"].isin(scenario_order).any():
        df["scenario"] = pd.Categorical(df["scenario"], categories=scenario_order, ordered=True)
        df = df.sort_values(["dataset", "scenario"])

    plt.figure(figsize=(10, 6))

    for dataset in df["dataset"].astype("string").unique():
        subset = df[df["dataset"].astype("string") == dataset]
        plt.plot(subset["scenario"], subset["accuracy"], marker="o", label=str(dataset))

    plt.title("Dataset Comparison - Accuracy Degradation")
    plt.xlabel("Scenario")
    plt.ylabel("Accuracy")
    plt.legend()
    plt.grid(True, linestyle="--", alpha=0.4)

    out_path = GRAPHS_DIR / "dataset_comparison.png"
    plt.tight_layout()
    plt.savefig(out_path, dpi=160)
    plt.close()

    if not out_path.exists() or out_path.stat().st_size == 0:
        raise IOError(f"Failed to write graph or wrote empty file: {out_path}")

    return out_path


def merge_monitoring_dataframes(
    adult: pd.DataFrame,
    loan: pd.DataFrame,
    *others: pd.DataFrame,
    write_outputs: bool = True,
    save_comparison_graph: bool = True,
) -> Tuple[pd.DataFrame, pd.DataFrame]:
    """
    Merge precomputed adult + loan monitoring DataFrames (same schema as CSV outputs)
    and apply AI risk, degradation score, and diagnostics. Optionally write CSV/model/graph.
    """
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

    parts = [adult, loan] + list(others)
    # filter out any empty/None frames
    parts = [p for p in parts if p is not None and not p.empty]
    if not parts:
        raise ValueError("No input dataframes provided to merge_monitoring_dataframes")
    df = pd.concat(parts, ignore_index=True)
    if df.empty:
        raise ValueError("Merged DataFrame is empty; aborting final_results.csv write.")

    # Health (needed for dataset-level scoring)
    df["health"] = df.apply(lambda r: round(compute_health(r["psi"], r["acc_drop"]), 3), axis=1)

    # Train AI model from existing final_results.csv (rule-based labels from previous runs).
    training_path = RESULTS_DIR / "final_results.csv"
    if not training_path.exists():
        # Bootstrap training labels if the file doesn't exist yet.
        risks_boot = df.apply(lambda r: analyze_risk_rule_based(r["psi"], r["acc_drop"]), axis=1, result_type="expand")
        boot = df.copy()
        boot["risk"] = risks_boot[0]
        training_path = RESULTS_DIR / "_final_results_bootstrap_training.csv"
        boot.to_csv(training_path, index=False)

    model, label_to_id = train_risk_model_from_final_results(training_path)
    model_path = RESULTS_DIR / "ai_model.pkl"
    if write_outputs:
        joblib.dump({"model": model, "label_to_id": label_to_id, "features": ["psi", "acc_drop"]}, model_path)
        if not model_path.exists() or model_path.stat().st_size == 0:
            raise IOError(f"Failed to write AI model: {model_path}")
        print(f"[OK] Saved trained AI model to {model_path}")

    # AI-predicted risk
    df["risk"] = df.apply(lambda r: predict_risk(model, r["psi"], r["acc_drop"]), axis=1)

    # Keep explanations/actions rule-based (hybrid) but aligned to AI output.
    expl = df.apply(lambda r: analyze_risk_rule_based(r["psi"], r["acc_drop"]), axis=1, result_type="expand")
    df["explanation"] = expl[1]
    df["action"] = expl[2]

    # Dataset comparison score system
    df, ranking = compute_dataset_degradation_scores(df)

    # Diagnostics engine
    df = diagnose_root_cause(df)

    # Ensure top_drift_feature exists (populated by dataset pipelines if available).
    if "top_drift_feature" not in df.columns:
        df["top_drift_feature"] = ""

    # Required final columns (plus a few useful extras).
    final_cols = [
        "dataset",
        "scenario",
        "accuracy",
        "acc_drop",
        "psi",
        "confidence_drop",
        "health",
        "risk",
        "explanation",
        "action",
        "degradation_score",
        "root_cause",
        "top_drift_feature",
        "severity",
        "affected_component",
    ]
    for c in final_cols:
        if c not in df.columns:
            df[c] = ""
    df_final = df[final_cols].copy()

    if write_outputs:
        out_path = RESULTS_DIR / "final_results.csv"
        print(f"[DEBUG] About to write {out_path} with shape={df.shape}")
        print(df_final.head(10).to_string(index=False))
        df_final.to_csv(out_path, index=False)
        if not out_path.exists() or out_path.stat().st_size == 0:
            raise IOError(f"Write failed or created empty file: {out_path}")

    if save_comparison_graph and write_outputs:
        graph_path = save_dataset_comparison_graph(df_final)
        print(f"[OK] dataset comparison graph saved: {graph_path}")

    # Summary report
    print("\n[SUMMARY] Dataset ranking (most sensitive first)")
    print(ranking[["dataset", "degradation_score", "avg_acc_drop", "avg_psi", "avg_health"]].to_string(index=False))

    most_sensitive = str(ranking.iloc[0]["dataset"]) if not ranking.empty else "N/A"
    print(f"\n[SUMMARY] Most sensitive dataset: {most_sensitive}")

    worst_row = df_final.sort_values("acc_drop", ascending=False).head(1)
    if not worst_row.empty:
        wr = worst_row.iloc[0]
        print(f"[SUMMARY] Worst scenario overall: dataset={wr['dataset']}, scenario={wr['scenario']}, acc_drop={wr['acc_drop']:.4f}, psi={wr['psi']:.4f}")

    # Correlation between PSI and accuracy drop
    if df_final["psi"].notna().sum() >= 2 and df_final["acc_drop"].notna().sum() >= 2:
        corr = float(pd.Series(df_final["psi"]).corr(pd.Series(df_final["acc_drop"])))
        print(f"[SUMMARY] Correlation(psi, acc_drop): {corr:.3f}")

    if write_outputs:
        print("[OK] final_results.csv created.")

    return df_final, ranking


def main() -> None:
    RESULTS_DIR.mkdir(parents=True, exist_ok=True)
    GRAPHS_DIR.mkdir(parents=True, exist_ok=True)

    adult_path = RESULTS_DIR / "results.csv"
    loan_path = RESULTS_DIR / "credit_results.csv"
    bank_path = RESULTS_DIR / "bank_results.csv"
    german_path = RESULTS_DIR / "german_results.csv"

    adult = _read_required_csv(adult_path)
    loan = _read_required_csv(loan_path)
    bank = None
    if bank_path.exists():
        bank = _read_required_csv(bank_path)
    german = None
    if german_path.exists():
        german = _read_required_csv(german_path)

    merge_monitoring_dataframes(adult, loan, bank, german, write_outputs=True, save_comparison_graph=True)


if __name__ == "__main__":
    main()
