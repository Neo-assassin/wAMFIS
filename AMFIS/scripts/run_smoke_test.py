"""Run all src pipelines end-to-end and verify outputs.

Usage: python AMFIS/scripts/run_smoke_test.py
"""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]  # AMFIS folder
SRC = ROOT / "src"
RESULTS = ROOT / "results"

scripts = [
    SRC / "bank_data.py",
    SRC / "loan_data.py",
    SRC / "main.py",  # adult pipeline
    SRC / "final_results.py",
]

def run_script(path: Path) -> None:
    print(f"Running: {path}")
    res = subprocess.run([sys.executable, str(path)], check=False)
    if res.returncode != 0:
        raise RuntimeError(f"Script failed: {path} (exit {res.returncode})")


def main() -> None:
    RESULTS.mkdir(parents=True, exist_ok=True)
    for s in scripts:
        run_script(s)

    expected = [RESULTS / "bank_results.csv", RESULTS / "credit_results.csv", RESULTS / "results.csv", RESULTS / "final_results.csv"]
    missing = [p for p in expected if not p.exists()]
    if missing:
        raise RuntimeError(f"Missing expected outputs: {missing}")

    print("\nSmoke test succeeded. Outputs: ")
    for p in expected:
        print(f" - {p} (size={p.stat().st_size} bytes)")


if __name__ == "__main__":
    main()
