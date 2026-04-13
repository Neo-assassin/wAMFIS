import sys
import os
import joblib

BASE_DIR = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC_PATH = os.path.join(BASE_DIR, "src")
RESULTS_PATH = os.path.join(BASE_DIR, "results", "ai_model.pkl")

if SRC_PATH not in sys.path:
    sys.path.append(SRC_PATH)

from final_results import predict_risk, compute_health


def run_model(input_data):
    try:
        psi = float(input_data.get("psi", 0))
        acc_drop = float(input_data.get("acc_drop", 0))

        # Load trained model
        if not os.path.exists(RESULTS_PATH):
            return {"error": "Model not trained yet. Run pipeline first."}

        saved = joblib.load(RESULTS_PATH)
        model = saved["model"]

        # Predict risk
        risk = predict_risk(model, psi, acc_drop)

        # Compute health
        health = compute_health(psi, acc_drop)

        return {
            "psi": psi,
            "acc_drop": acc_drop,
            "risk": risk,
            "health": round(health, 3),
            "status": "success"
        }

    except Exception as e:
        return {"error": str(e)}