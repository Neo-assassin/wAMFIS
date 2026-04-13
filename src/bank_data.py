from pathlib import Path
import pandas as pd
import numpy as np
import logging
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier

logging.basicConfig(level=logging.INFO)


def run_monitoring_for_bank_dataset() -> pd.DataFrame:
    project_root = Path(__file__).resolve().parents[1]
    data_path = project_root / "data" / "bank.csv"
    results_dir = project_root / "results"
    results_dir.mkdir(parents=True, exist_ok=True)

    # Load
    try:
        # bank.csv uses semicolon separators
        df = pd.read_csv(data_path, sep=';')
    except Exception as e:
        logging.error("Failed to read bank.csv: %s", e)
        raise

    df = df.dropna()

    # Target
    if "y" not in df.columns:
        raise KeyError("Expected target column 'y' in bank.csv")

    y = df["y"]
    X = df.drop("y", axis=1)

    # Encoding
    X = pd.get_dummies(X)

    # Split
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2)

    # Model
    model = RandomForestClassifier()
    model.fit(X_train, y_train)
    baseline_acc = model.score(X_test, y_test)

    # Scenarios
    def add_noise(X_df: pd.DataFrame) -> pd.DataFrame:
        noise = np.random.normal(0, 0.1, X_df.shape)
        return X_df + noise

    def shift(X_df: pd.DataFrame) -> pd.DataFrame:
        return X_df * 1.2

    def remove_feature(X_df: pd.DataFrame) -> pd.DataFrame:
        X_copy = X_df.copy()
        first_col = X_copy.columns[0]
        X_copy[first_col] = 0
        return X_copy

    X_noise = add_noise(X_test)
    X_shift = shift(X_test)
    X_removed = remove_feature(X_test)

    # Accuracy
    acc_noise = model.score(X_noise, y_test)
    acc_shift = model.score(X_shift, y_test)
    acc_removed = model.score(X_removed, y_test)

    # Simple PSI (mean absolute diff across features)
    def calculate_psi(a: pd.DataFrame, b: pd.DataFrame) -> float:
        a_arr = a.to_numpy(dtype=float)
        b_arr = b.to_numpy(dtype=float)
        return float(np.mean(np.abs(a_arr - b_arr)))

    psi_noise = calculate_psi(X_test, X_noise)
    psi_shift = calculate_psi(X_test, X_shift)

    results = [
        {
            "dataset": "Bank",
            "scenario": "noise",
            "accuracy": acc_noise,
            "acc_drop": float(baseline_acc - acc_noise),
            "psi": psi_noise,
        },
        {
            "dataset": "Bank",
            "scenario": "shift",
            "accuracy": acc_shift,
            "acc_drop": float(baseline_acc - acc_shift),
            "psi": psi_shift,
        },
        {
            "dataset": "Bank",
            "scenario": "feature_removed",
            "accuracy": acc_removed,
            "acc_drop": float(baseline_acc - acc_removed),
            "psi": 0.0,
        },
    ]

    df_results = pd.DataFrame(results)
    out_path = results_dir / "bank_results.csv"
    df_results.to_csv(out_path, index=False)
    logging.info("Wrote bank results to %s", out_path)
    return df_results


if __name__ == "__main__":
    df_res = run_monitoring_for_bank_dataset()
    print(df_res)
    print("[OK] Bank dataset done")