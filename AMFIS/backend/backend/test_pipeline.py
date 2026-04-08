import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# ensure working directory is the backend package directory (avoid hardcoded user paths)
base_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(base_dir)
django.setup()

from services.pipeline_runner import run_pipeline_for_dataset
from monitoring.models import DriftResult

print("Running pipeline for Adult dataset...")
results, baseline = run_pipeline_for_dataset('Adult')

print(f"\nBaseline accuracy: {baseline:.4f}")
print("\nResults:")
for r in results:
    print(f"  Scenario: {r['scenario']}")
    print(f"    Accuracy: {r['accuracy']:.4f}")
    print(f"    PSI: {r['psi']:.4f}")
    print(f"    Acc Drop: {r['acc_drop']:.4f}")
    print(f"    Top drift feature: {r['top_drift_feature']}")
    print()

print("Saving to database...")
for r in results:
    DriftResult.objects.create(
        dataset=r['dataset'],
        scenario=r['scenario'],
        accuracy=r['accuracy'],
        acc_drop=r['acc_drop'],
        psi=r['psi'],
        confidence_drop=r['confidence_drop'],
        top_drift_feature=r['top_drift_feature'],
        baseline_accuracy=r['baseline_accuracy'],
    )
print("Done!")

print("\nStored results in DB:")
for dr in DriftResult.objects.all():
    print(f"  {dr.dataset} - {dr.scenario}: acc={dr.accuracy:.4f}, psi={dr.psi:.4f}")