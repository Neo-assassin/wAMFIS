"""Generate a frontend-friendly JSON summary from results/final_results.csv

Writes to `Amfis_frontend/src/data/combinedResults.json` so the frontend can
display dataset cards reflecting the latest monitoring outputs.
"""
from pathlib import Path
import json
import pandas as pd


REPO_ROOT = Path(__file__).resolve().parents[1]
RESULTS = REPO_ROOT / "results" / "final_results.csv"
OUT = REPO_ROOT / "Amfis_frontend" / "src" / "data" / "combinedResults.json"
OUT_PUBLIC = REPO_ROOT / "Amfis_frontend" / "public" / "combinedResults.json"


def slug(s: str) -> str:
    return str(s).strip().lower().replace(" ", "-").replace("_", "-")


def main():
    if not RESULTS.exists():
        print(f"No final_results.csv at {RESULTS}; nothing to write")
        return

    df = pd.read_csv(RESULTS)
    if df.empty:
        print("final_results.csv empty; nothing to write")
        return

    groups = df.groupby("dataset", as_index=False)
    out = []
    detailed = {}
    for name, g in groups:
        avg_health = float(g["health"].astype(float).mean()) if "health" in g.columns else 0.0
        # choose highest severity risk label from rows if present
        risk = None
        if "risk" in g.columns:
            for r in ["High", "Moderate", "Low"]:
                if r in g["risk"].values:
                    risk = r
                    break
        risk = risk or "Unknown"

        drift_detected = bool((g["psi"].astype(float) > 0.1).any()) if "psi" in g.columns else False
        acc_drop = float(g["acc_drop"].astype(float).max()) if "acc_drop" in g.columns else 0.0

        out.append(
            {
                "id": slug(name),
                "name": name,
                "lastUpdated": "just now",
                "healthScore": int(round(avg_health * 100)),
                "riskLevel": risk.lower() if isinstance(risk, str) else "unknown",
                "accuracyDrop": acc_drop > 0,
                "driftDetected": drift_detected,
                "driftMetric": "",
                "failures": int(g.get("degradation_score", 0).sum() if "degradation_score" in g.columns else 0),
            }
        )

        # detailed rows for this dataset
        rows = []
        for _, r in g.iterrows():
            rows.append(
                {
                    "scenario": str(r.get("scenario", "")),
                    "accuracy": float(r.get("accuracy", 0.0) or 0.0),
                    "acc_drop": float(r.get("acc_drop", 0.0) or 0.0),
                    "psi": float(r.get("psi", 0.0) or 0.0),
                    "confidence_drop": float(r.get("confidence_drop", 0.0) or 0.0) if "confidence_drop" in r.index else None,
                    "explanation": str(r.get("explanation", "")),
                    "action": str(r.get("action", "")),
                    "top_drift_feature": str(r.get("top_drift_feature", "")),
                    "severity": str(r.get("severity", "")),
                    "affected_component": str(r.get("affected_component", "")),
                    "degradation_score": float(r.get("degradation_score", 0.0) or 0.0),
                    "health": float(r.get("health", 0.0) or 0.0),
                    "risk": str(r.get("risk", "")),
                }
            )
        detailed[slug(name)] = rows

    OUT.parent.mkdir(parents=True, exist_ok=True)
    with OUT.open("w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    # Also write to frontend public so vite dev server can serve it at /combinedResults.json
    OUT_PUBLIC.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PUBLIC.open("w", encoding="utf-8") as f:
        json.dump(out, f, indent=2)

    # Write detailed per-dataset rows
    detailed_path = REPO_ROOT / "Amfis_frontend" / "public" / "combinedResultsDetailed.json"
    with detailed_path.open("w", encoding="utf-8") as f:
        json.dump(detailed, f, indent=2)

    print(f"Wrote frontend summary to {OUT} and {OUT_PUBLIC}; detailed to {detailed_path}")


if __name__ == "__main__":
    main()
