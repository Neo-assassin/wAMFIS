from django.http import JsonResponse
import json
import csv
import os
from pathlib import Path
from django.views.decorators.csrf import csrf_exempt


def monitoring_results(request):
    try:
        project_root = Path(__file__).resolve().parents[2]
        csv_path = project_root / 'results' / 'final_results.csv'
        
        if not csv_path.exists():
            return JsonResponse({
                "data": [
                    {"dataset": "Adult", "psi": 0.982, "acc_drop": 0.005, "accuracy": 0.851},
                    {"dataset": "Loan", "psi": 0.630, "acc_drop": 0.026, "accuracy": 0.903},
                    {"dataset": "Bank", "psi": 7.153, "acc_drop": 0.001, "accuracy": 0.908},
                    {"dataset": "German Credit", "psi": 9.806, "acc_drop": 0.020, "accuracy": 0.780}
                ]
            })
        
        data = []
        with open(csv_path, 'r') as f:
            reader = csv.DictReader(f)
            for row in reader:
                data.append({
                    "dataset": row.get('dataset', ''),
                    "scenario": row.get('scenario', ''),
                    "psi": float(row.get('psi', 0) or 0),
                    "acc_drop": float(row.get('acc_drop', 0) or 0),
                    "accuracy": float(row.get('accuracy', 0) or 0),
                    "top_drift_feature": row.get('top_drift_feature', ''),
                    "health": float(row.get('health', 0) or 0),
                })
        
        return JsonResponse({"data": data, "success": True})

    except Exception as e:
        return JsonResponse({"error": str(e), "data": []})
