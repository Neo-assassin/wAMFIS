"""Run full monitoring including German dataset and merge final results.

This script uses the existing monitoring engine to run Adult/Loan/Bank,
executes the `src/german_data.py` script to produce german results, then
merges all available dataset result DataFrames into `results/final_results.csv`.
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path
import os

import pandas as pd

# Ensure repo root is on sys.path
REPO_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(REPO_ROOT))

from src import final_results as final_mod


def run_german_script():
    script = REPO_ROOT / "src" / "german_data.py"
    if not script.exists():
        print(f"German script not found at {script}; skipping German dataset")
        return False
    print(f"Running German dataset script: {script}")
    # Use the same Python interpreter running this script
    # german_data.py expects to be run from the `src/` directory (its paths are relative)
    res = subprocess.run([sys.executable, str(script)], cwd=str(REPO_ROOT / "src"))
    if res.returncode != 0:
        print(f"German script exited with code {res.returncode}")
        return False
    return True


def main(write_outputs: bool = True, save_graph: bool = True):
    print("Running dataset scripts: adult, loan, bank, (german optional) via subprocess...")

    scripts = [
        REPO_ROOT / "src" / "main.py",      # Adult
        REPO_ROOT / "src" / "loan_data.py", # Loan
        REPO_ROOT / "src" / "bank_data.py", # Bank (optional)
    ]

    for s in scripts:
        if not s.exists():
            print(f"Script missing, skipping: {s}")
            continue
        print(f"Executing: {s}")
        res = subprocess.run([sys.executable, str(s)], cwd=str(REPO_ROOT))
        if res.returncode != 0:
            print(f"Script {s} failed with exit code {res.returncode}")

    # Run german_data.py to create german_results.csv (if present)
    ran_german = run_german_script()

    # Load individual CSVs (adult, loan, bank) using expected paths
    results_dir = REPO_ROOT / "results"
    adult_path = results_dir / "results.csv"
    loan_path = results_dir / "credit_results.csv"
    bank_path = results_dir / "bank_results.csv"
    german_path = results_dir / "german_results.csv"

    def _read_if_exists(p: Path):
        if p.exists():
            try:
                return pd.read_csv(p)
            except Exception as e:
                print(f"Failed to read {p}: {e}")
        return None

    adult = _read_if_exists(adult_path)
    loan = _read_if_exists(loan_path)
    bank = _read_if_exists(bank_path)
    german = _read_if_exists(german_path) if ran_german else None

    print("Merging available dataset results into final_results.csv...")
    df_final, ranking = final_mod.merge_monitoring_dataframes(adult, loan, bank, german, write_outputs=write_outputs, save_comparison_graph=save_graph)

    print("Done. final_results.csv updated.")


if __name__ == "__main__":
    main(write_outputs=True, save_graph=True)
