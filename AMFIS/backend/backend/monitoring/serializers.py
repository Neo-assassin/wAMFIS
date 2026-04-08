from rest_framework import serializers
from .models import ModelLog, Scan, DriftResult

import math
from pathlib import Path
import joblib
from collections import defaultdict


class ModelLogSerializer(serializers.ModelSerializer):
    class Meta:
        model = ModelLog
        fields = '__all__'


class ScanSerializer(serializers.ModelSerializer):
    class Meta:
        model = Scan
        fields = '__all__'


class DriftResultSerializer(serializers.ModelSerializer):
    # compute health and severity on the serialized output so frontend components
    # receive the same diagnostics fields that are produced by the final_results
    # pipeline (health: 0..1, severity: Low/Moderate/High)
    health = serializers.SerializerMethodField()
    severity = serializers.SerializerMethodField()
    class Meta:
        model = DriftResult
        # include computed fields alongside model fields
        fields = '__all__'
        extra_kwargs = {
            'health': {'read_only': True},
            'severity': {'read_only': True},
        }

    def get_health(self, obj):
        try:
            psi = float(getattr(obj, 'psi', 0.0) or 0.0)
        except Exception:
            psi = 0.0
        try:
            acc_drop = float(getattr(obj, 'acc_drop', 0.0) or 0.0)
        except Exception:
            acc_drop = 0.0
        # same formula as src.final_results.compute_health
        h = 1.0 - (0.5 * acc_drop + 0.5 * min(psi, 1.0))
        # clamp
        if math.isnan(h) or h is None:
            return 0.0
        return max(0.0, min(1.0, float(h)))

    def get_severity(self, obj):
        try:
            psi = float(getattr(obj, 'psi', 0.0) or 0.0)
        except Exception:
            psi = 0.0
        try:
            acc_drop = float(getattr(obj, 'acc_drop', 0.0) or 0.0)
        except Exception:
            acc_drop = 0.0

        if psi >= 0.25 or acc_drop >= 0.15:
            return 'High'
        if psi >= 0.10 or acc_drop >= 0.07:
            return 'Moderate'
        return 'Low'

    def _load_ai_model(self):
        # Try to load saved AI model from results/ai_model.pkl (written by final_results)
        try:
            repo_root = Path(__file__).resolve().parents[3]
            model_path = repo_root / 'results' / 'ai_model.pkl'
            if model_path.exists():
                loaded = joblib.load(model_path)
                # loaded expected to be dict with keys 'model' and 'label_to_id'
                model = loaded.get('model') if isinstance(loaded, dict) else loaded
                label_to_id = loaded.get('label_to_id') if isinstance(loaded, dict) else None
                if model is not None:
                    # build id->label mapping
                    id_to_label = None
                    if label_to_id:
                        id_to_label = {v: k for k, v in label_to_id.items()}
                    return model, id_to_label
        except Exception:
            pass
        return None, None

    def get_risk(self, obj):
        # Prefer AI model if present, else fallback to rule-based
        try:
            model, id_to_label = self._load_ai_model()
            psi = float(getattr(obj, 'psi', 0.0) or 0.0)
            acc_drop = float(getattr(obj, 'acc_drop', 0.0) or 0.0)
            if model is not None:
                try:
                    pred = int(model.predict([[psi, acc_drop]])[0])
                    if id_to_label and pred in id_to_label:
                        return id_to_label[pred]
                    # if no mapping, fall back to index on RISK_LABELS
                    from src.final_results import RISK_LABELS
                    return RISK_LABELS[pred] if 0 <= pred < len(RISK_LABELS) else 'Moderate'
                except Exception:
                    pass
        except Exception:
            pass

        # rule-based fallback (same logic as final_results.analyze_risk_rule_based)
        try:
            psi = float(getattr(obj, 'psi', 0.0) or 0.0)
        except Exception:
            psi = 0.0
        try:
            acc_drop = float(getattr(obj, 'acc_drop', 0.0) or 0.0)
        except Exception:
            acc_drop = 0.0

        if psi >= 0.25 or acc_drop >= 0.15:
            return 'High'
        if psi >= 0.10 or acc_drop >= 0.07:
            return 'Moderate'
        return 'Low'

    def get_degradation_score(self, obj):
        # compute dataset-level avg acc_drop and avg psi, normalize across datasets
        qs = DriftResult.objects.all().values('dataset', 'acc_drop', 'psi')
        agg = defaultdict(lambda: {'acc_sum': 0.0, 'psi_sum': 0.0, 'count': 0})
        for row in qs:
            ds = row.get('dataset') or ''
            try:
                acc = float(row.get('acc_drop') or 0.0)
            except Exception:
                acc = 0.0
            try:
                psi = float(row.get('psi') or 0.0)
            except Exception:
                psi = 0.0
            agg[ds]['acc_sum'] += acc
            agg[ds]['psi_sum'] += psi
            agg[ds]['count'] += 1

        scores = {}
        raw_values = {}
        for ds, v in agg.items():
            if v['count'] == 0:
                raw = 0.0
            else:
                avg_acc = v['acc_sum'] / v['count']
                avg_psi = v['psi_sum'] / v['count']
                raw = 0.6 * avg_acc + 0.4 * avg_psi
            raw_values[ds] = raw

        if raw_values:
            mn = min(raw_values.values())
            mx = max(raw_values.values())
            for ds, raw in raw_values.items():
                if mx > mn:
                    scores[ds] = (raw - mn) / (mx - mn)
                else:
                    scores[ds] = 0.0
        else:
            scores = {obj.dataset: 0.0}

        return float(scores.get(obj.dataset, 0.0))

    def get_root_cause(self, obj):
        # derive root cause using dataset-level maxima similar to diagnose_root_cause
        ds = obj.dataset
        qs = list(DriftResult.objects.filter(dataset=ds).values('scenario', 'acc_drop', 'psi'))
        if not qs:
            return 'No strong degradation signal; system appears stable.'

        # find max acc_drop scenario and max psi scenario
        max_drop = max(qs, key=lambda r: float(r.get('acc_drop') or 0.0))['scenario']
        max_psi = max(qs, key=lambda r: float(r.get('psi') or 0.0))['scenario']

        try:
            psi = float(getattr(obj, 'psi', 0.0) or 0.0)
        except Exception:
            psi = 0.0
        try:
            acc_drop = float(getattr(obj, 'acc_drop', 0.0) or 0.0)
        except Exception:
            acc_drop = 0.0

        severity = 'High' if (psi >= 0.25 or acc_drop >= 0.15) else 'Moderate' if (psi >= 0.10 or acc_drop >= 0.07) else 'Low'

        if psi >= 0.10 and acc_drop >= 0.07:
            root = 'Data drift is the main cause of degradation.'
            component = 'data_distribution'
        elif psi < 0.10 and acc_drop >= 0.07:
            root = 'Model weakness or feature issue is likely the main cause.'
            component = 'model'
        else:
            root = 'No strong degradation signal; system appears stable.'
            component = 'monitoring'

        if max_drop == 'feature_removed':
            root = 'Model is highly dependent on a specific feature (feature removal caused the largest drop).'
            component = 'feature_dependency'
        if max_psi == 'shift':
            if 'dependent on a specific feature' not in root:
                root = 'System is sensitive to distribution changes (shift caused the highest drift).'
                component = 'data_distribution'

        return root