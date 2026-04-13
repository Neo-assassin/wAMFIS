import os
import sys
from pathlib import Path

# Ensure repo root
REPO_ROOT = Path(__file__).resolve().parents[1]
BACKEND_DIR = REPO_ROOT / 'AMFIS_backend_' / 'backend'

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# Run from backend dir so Django app import paths resolve
os.chdir(str(BACKEND_DIR))

# Ensure backend package dir is on sys.path so `import config` succeeds
sys.path.insert(0, str(BACKEND_DIR))

import django
django.setup()


from monitoring.models import DriftResult
from services.pipeline_runner import run_full_pipeline

print('Running backend pipelines and syncing DriftResult entries...')
results = run_full_pipeline()
print(f'Pipeline returned {len(results)} scenario results')

# Clear existing DriftResult rows (optional)
DriftResult.objects.all().delete()

for r in results:
    DriftResult.objects.create(
        dataset=r.get('dataset',''),
        scenario=r.get('scenario',''),
        accuracy=float(r.get('accuracy') or 0.0),
        acc_drop=float(r.get('acc_drop') or 0.0),
        psi=float(r.get('psi') or 0.0),
        confidence_drop=float(r.get('confidence_drop') or 0.0),
        top_drift_feature=str(r.get('top_drift_feature') or ''),
        baseline_accuracy=float(r.get('baseline_accuracy') or 0.0),
    )

print('Synced to database. Total DriftResult rows:', DriftResult.objects.count())
