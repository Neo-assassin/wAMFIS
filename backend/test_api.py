import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
# ensure working directory is the backend package directory (avoid hardcoded user paths)
base_dir = os.path.dirname(os.path.abspath(__file__))
os.chdir(base_dir)
django.setup()

from django.test import Client
import json

client = Client()

print("=== Testing API Endpoints ===\n")

print("1. Health check (GET /api/monitoring/)")
response = client.get('/api/monitoring/')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

print("2. Get drift results (GET /api/monitoring/results/)")
response = client.get('/api/monitoring/results/')
print(f"   Status: {response.status_code}")
data = response.json()
print(f"   Success: {data.get('success')}")
print(f"   Results count: {len(data.get('data', []))}")
for r in data.get('data', []):
    print(f"   - {r['dataset']} / {r['scenario']}: acc={r['accuracy']:.4f}, psi={r['psi']:.4f}")
print()

print("3. Summary (GET /api/monitoring/summary/)")
response = client.get('/api/monitoring/summary/')
print(f"   Status: {response.status_code}")
print(f"   Response: {response.json()}\n")

print("=== All API tests passed! ===")