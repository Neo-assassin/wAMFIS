"""Load src pipelines via importlib and run in-process (no subprocess)."""
from __future__ import annotations

import importlib.util
import os
from pathlib import Path
from typing import Callable

import pandas as pd

REPO_ROOT = Path(__file__).resolve().parent.parent


def _load_module(mod_name: str, path: Path):
    spec = importlib.util.spec_from_file_location(mod_name, path)
    if spec is None or spec.loader is None:
        raise ImportError(f"Cannot load {path}")
    mod = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(mod)
    return mod


def get_run_adult() -> Callable[[], pd.DataFrame]:
    os.environ.setdefault("MPLBACKEND", "Agg")
    mod = _load_module("adult_pipeline", REPO_ROOT / "src" / "main.py")
    return mod.run_monitoring_for_adult_dataset


def get_run_loan() -> Callable[[], pd.DataFrame]:
    os.environ.setdefault("MPLBACKEND", "Agg")
    mod = _load_module("loan_pipeline", REPO_ROOT / "src" / "loan_data.py")
    return mod.run_monitoring_for_loan_dataset


def get_merge_final():
    mod = _load_module("final_results_mod", REPO_ROOT / "src" / "final_results.py")
    return mod.merge_monitoring_dataframes


def run_full_monitoring(
    *,
    write_csv_outputs: bool = False,
    save_graph: bool = False,
) -> tuple[pd.DataFrame, pd.DataFrame]:
    adult_df = get_run_adult()()
    loan_df = get_run_loan()()
    merge = get_merge_final()
    df_final, ranking = merge(
        adult_df,
        loan_df,
        write_outputs=write_csv_outputs,
        save_comparison_graph=save_graph,
    )
    return df_final, ranking
