"""
Optional drift metrics for API / UI (KL, KS) on numeric baseline vs current samples.
"""
from __future__ import annotations

from typing import Any, Dict, Tuple

import numpy as np


def _safe_hist(a: np.ndarray, b: np.ndarray, bins: int = 20) -> Tuple[np.ndarray, np.ndarray]:
    a = a[np.isfinite(a)]
    b = b[np.isfinite(b)]
    if a.size == 0 or b.size == 0:
        return np.array([]), np.array([])
    lo = float(min(a.min(), b.min()))
    hi = float(max(a.max(), b.max()))
    if hi <= lo:
        hi = lo + 1e-9
    edges = np.linspace(lo, hi, bins + 1)
    ha, _ = np.histogram(a, bins=edges, density=True)
    hb, _ = np.histogram(b, bins=edges, density=True)
    ha = ha / max(ha.sum(), 1e-12)
    hb = hb / max(hb.sum(), 1e-12)
    return ha, hb


def kl_divergence_discrete(p: np.ndarray, q: np.ndarray, eps: float = 1e-9) -> float:
    p = np.clip(p, eps, 1.0)
    q = np.clip(q, eps, 1.0)
    p = p / p.sum()
    q = q / q.sum()
    return float(np.sum(p * np.log(p / q)))


def ks_statistic_and_pvalue(baseline: np.ndarray, current: np.ndarray) -> Dict[str, Any]:
    try:
        from scipy.stats import ks_2samp
    except ImportError:
        return {"ks_statistic": None, "ks_pvalue": None, "note": "scipy not installed"}
    b = baseline[np.isfinite(baseline)]
    c = current[np.isfinite(current)]
    if b.size < 2 or c.size < 2:
        return {"ks_statistic": None, "ks_pvalue": None, "note": "insufficient samples"}
    res = ks_2samp(b, c, alternative="two-sided", mode="auto")
    return {"ks_statistic": float(res.statistic), "ks_pvalue": float(res.pvalue)}


def summarize_feature_drift(
    baseline: np.ndarray,
    current: np.ndarray,
    *,
    bins: int = 20,
) -> Dict[str, Any]:
    ha, hb = _safe_hist(baseline, current, bins=bins)
    if ha.size == 0:
        return {"psi_hint": None, "kl_div": None, "ks": ks_statistic_and_pvalue(baseline, current)}
    kl = kl_divergence_discrete(ha, hb)
    ks = ks_statistic_and_pvalue(baseline, current)
    return {"kl_div": kl, "ks": ks}
