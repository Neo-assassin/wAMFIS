from rest_framework.permissions import IsAuthenticated
from rest_framework.views import APIView
from rest_framework.response import Response
from django.http import StreamingHttpResponse
import time
import json
import csv
from pathlib import Path

from .models import ModelLog, Scan, DriftResult
from .serializers import DriftResultSerializer
from services.failure_detection import detect_failure
from services.pipeline_runner import run_pipeline_for_dataset, run_full_pipeline


class ModelHealthCheckAPI(APIView):
    def post(self, request):
        model_name = request.data.get("model_name")
        accuracy = request.data.get("accuracy")
        loss = request.data.get("loss")

        if model_name is None or accuracy is None or loss is None:
            return Response({
                "success": False,
                "error": "model_name, accuracy and loss are required"
            }, status=400)

        try:
            accuracy = float(accuracy)
            loss = float(loss)
        except:
            return Response({
                "success": False,
                "error": "accuracy and loss must be numbers"
            }, status=400)

        if accuracy < 0 or accuracy > 1:
            return Response({
                "success": False,
                "error": "accuracy must be between 0 and 1"
            }, status=400)

        if loss < 0:
            return Response({
                "success": False,
                "error": "loss cannot be negative"
            }, status=400)

        status = detect_failure(accuracy, loss)

        ModelLog.objects.create(
            model_name=model_name,
            accuracy=accuracy,
            loss=loss,
            status=status
        )

        return Response({
            "success": True,
            "data": {
                "model": model_name,
                "accuracy": accuracy,
                "loss": loss,
                "status": status
            }
        })


class GetLogsAPI(APIView):
    def get(self, request):
        logs = ModelLog.objects.all().values()
        return Response({
            "success": True,
            "data": list(logs)
        })


class FilterLogsAPI(APIView):
    def get(self, request):
        model_name = request.GET.get("model_name")
        status = request.GET.get("status")

        logs = ModelLog.objects.all()

        if model_name:
            logs = logs.filter(model_name=model_name)

        if status:
            logs = logs.filter(status=status)

        return Response({
            "success": True,
            "data": list(logs.values())
        })


class SummaryAPI(APIView):
    def get(self, request):
        total = ModelLog.objects.count()
        failures = ModelLog.objects.filter(status="Failure").count()
        warnings = ModelLog.objects.filter(status="Warning").count()
        healthy = ModelLog.objects.filter(status="Healthy").count()

        return Response({
            "success": True,
            "data": {
                "total": total,
                "healthy": healthy,
                "warning": warnings,
                "failure": failures
            }
        })


class UploadScanAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        image = request.FILES.get('image')

        if not image:
            return Response({
                "success": False,
                "error": "No image provided"
            }, status=400)

        result = "No Disease Detected"

        scan = Scan.objects.create(
            user=request.user,
            image=image,
            result=result
        )

        return Response({
            "success": True,
            "data": {
                "message": "Upload successful",
                "result": result
            }
        })


class RunPipelineAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        dataset = request.data.get("dataset", "Adult")

        try:
            results, baseline = run_pipeline_for_dataset(dataset)

            for r in results:
                DriftResult.objects.create(
                    dataset=r["dataset"],
                    scenario=r["scenario"],
                    accuracy=r["accuracy"],
                    acc_drop=r["acc_drop"],
                    psi=r["psi"],
                    confidence_drop=r["confidence_drop"],
                    top_drift_feature=r["top_drift_feature"],
                    baseline_accuracy=r["baseline_accuracy"],
                )

            return Response({
                "success": True,
                "data": {
                    "dataset": dataset,
                    "baseline_accuracy": baseline,
                    "scenarios": results
                }
            })
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=500)


class RunFullPipelineAPI(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            results = run_full_pipeline()

            for r in results:
                DriftResult.objects.create(
                    dataset=r["dataset"],
                    scenario=r["scenario"],
                    accuracy=r["accuracy"],
                    acc_drop=r["acc_drop"],
                    psi=r["psi"],
                    confidence_drop=r["confidence_drop"],
                    top_drift_feature=r["top_drift_feature"],
                    baseline_accuracy=r["baseline_accuracy"],
                )

            return Response({
                "success": True,
                "data": {
                    "total_results": len(results),
                    "results": results
                }
            })
        except Exception as e:
            return Response({
                "success": False,
                "error": str(e)
            }, status=500)


class GetDriftResultsAPI(APIView):
    def get(self, request):
        dataset = request.GET.get("dataset")
        # Prefer DB-backed results; if none exist, fall back to results/final_results.csv
        qs = DriftResult.objects.all()
        if qs.exists():
            if dataset:
                qs = qs.filter(dataset=dataset)
            serializer = DriftResultSerializer(qs, many=True)
            return Response({"success": True, "data": serializer.data})

        # fallback to CSV file produced by scripts
        repo_root = Path(__file__).resolve().parents[3]
        csv_path = repo_root / 'results' / 'final_results.csv'
        out = []
        if csv_path.exists():
            with csv_path.open(newline='', encoding='utf-8') as fh:
                reader = csv.DictReader(fh)
                for row in reader:
                    if dataset and row.get('dataset') != dataset:
                        continue
                    try:
                        acc = float(row.get('accuracy') or 0)
                    except ValueError:
                        acc = 0.0
                    try:
                        acc_drop = float(row.get('acc_drop') or 0)
                    except ValueError:
                        acc_drop = 0.0
                    try:
                        psi = float(row.get('psi') or 0)
                    except ValueError:
                        psi = 0.0
                    try:
                        conf = float(row.get('confidence_drop') or 0)
                    except ValueError:
                        conf = 0.0

                    out.append({
                        'dataset': row.get('dataset', ''),
                        'scenario': row.get('scenario', ''),
                        'accuracy': acc,
                        'acc_drop': acc_drop,
                        'psi': psi,
                        'confidence_drop': conf,
                        'top_drift_feature': row.get('top_drift_feature', '') or '',
                        'baseline_accuracy': float(row.get('baseline_accuracy') or acc or 0),
                    })

        return Response({"success": True, "data": out})


class StreamDriftResultsAPI(APIView):
    """
    Simple Server-Sent Events (SSE) endpoint that streams the serialized
    DriftResult objects as JSON payloads whenever polled. This is intended
    for local/dev real-time updates. It yields the full result set every
    couple seconds; the frontend can diff/update as needed.
    """
    def get(self, request):
        # Stream DB results if present, else stream from results/final_results.csv when file changes
        repo_root = Path(__file__).resolve().parents[3]
        csv_path = repo_root / 'results' / 'final_results.csv'

        def event_stream():
            last_payload = None
            last_mtime = None
            while True:
                try:
                    qs = DriftResult.objects.all()
                    if qs.exists():
                        serializer = DriftResultSerializer(qs, many=True)
                        payload = json.dumps(serializer.data)
                        if payload != last_payload:
                            last_payload = payload
                            yield f"data: {payload}\n\n"
                    else:
                        if csv_path.exists():
                            try:
                                mtime = csv_path.stat().st_mtime
                            except Exception:
                                mtime = None
                            if mtime != last_mtime:
                                last_mtime = mtime
                                # read file and emit
                                rows = []
                                with csv_path.open(newline='', encoding='utf-8') as fh:
                                    reader = csv.DictReader(fh)
                                    for row in reader:
                                        try:
                                            acc = float(row.get('accuracy') or 0)
                                        except ValueError:
                                            acc = 0.0
                                        try:
                                            acc_drop = float(row.get('acc_drop') or 0)
                                        except ValueError:
                                            acc_drop = 0.0
                                        try:
                                            psi = float(row.get('psi') or 0)
                                        except ValueError:
                                            psi = 0.0
                                        try:
                                            conf = float(row.get('confidence_drop') or 0)
                                        except ValueError:
                                            conf = 0.0

                                        rows.append({
                                            'dataset': row.get('dataset', ''),
                                            'scenario': row.get('scenario', ''),
                                            'accuracy': acc,
                                            'acc_drop': acc_drop,
                                            'psi': psi,
                                            'confidence_drop': conf,
                                            'top_drift_feature': row.get('top_drift_feature', '') or '',
                                            'baseline_accuracy': float(row.get('baseline_accuracy') or acc or 0),
                                        })
                                payload = json.dumps(rows)
                                if payload != last_payload:
                                    last_payload = payload
                                    yield f"data: {payload}\n\n"
                    # avoid busy-looping
                except GeneratorExit:
                    break
                except Exception:
                    yield f"data: []\n\n"
                time.sleep(2)

        return StreamingHttpResponse(event_stream(), content_type='text/event-stream')