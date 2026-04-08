# Run Instructions — AMFIS (Frontend + Backend + Datasets)

This file describes exactly how to run the full project so the React + Vite frontend, Django backend, and data-generation pipelines run together and produce the frontend JSON files and `results/final_results.csv` outputs.

Two quick options:
- Option A (recommended on Windows): run the provided PowerShell helper that starts Django, runs dataset pipelines, generates frontend JSON and launches Vite.
- Option B (manual / cross-platform): run the three systems in separate terminals so you can watch logs.

Prerequisites
- Node.js and npm installed (for frontend).
- Python 3.10+ installed.
- Git (optional).

Project layout (important files referenced below):
- `AMFIS_backend_/backend/requirements.txt` — Django backend dependencies.
- `src/requirements.txt` — dataset scripts dependencies (pandas, numpy, scikit-learn, etc.).
- `Amfis_frontend/package.json` — frontend deps and `npm run dev` command.
- `scripts/run_all.ps1` — Windows helper that automates the full run.
- `scripts/run_full_with_german.py` — pipeline that runs dataset scripts and writes `results/final_results.csv`.
- `scripts/generate_frontend_results.py` — generates `Amfis_frontend/public/combinedResults.json` and `combinedResultsDetailed.json`.

1) Create and activate Python virtual environment (Windows PowerShell)

```powershell
cd <repo-root>
python -m venv .venv
& .\.venv\Scripts\Activate.ps1
```

On macOS / Linux (bash):

```bash
cd <repo-root>
python3 -m venv .venv
source .venv/bin/activate
```

2) Install Python dependencies

Install backend (Django) requirements:

```powershell
pip install -r AMFIS_backend_\backend\requirements.txt
```

Install dataset script dependencies:

```powershell
pip install -r src\requirements.txt
```

3) Install frontend dependencies

```bash
cd Amfis_frontend
npm install
cd ..
```

4) Option A — Run everything with the provided PowerShell helper (Windows)

From the repo root run:

```powershell
PowerShell -ExecutionPolicy Bypass -File .\scripts\run_all.ps1
```

What this does (script logic):
- Starts the Django dev server (`AMFIS_backend_/backend/manage.py runserver`) in a new process.
- Runs dataset pipelines via `scripts/run_full_with_german.py` (this writes/updates `results/*.csv`).
- Runs `scripts/generate_frontend_results.py` to produce `Amfis_frontend/public/combinedResults.json` and `combinedResultsDetailed.json`.
- Starts the Vite dev server (`npm run dev`) in a new window.

After the script finishes you should have:
- Django: http://127.0.0.1:8000/ (backend APIs)
- Frontend: http://localhost:5173/ (open in browser)
- Generated frontend JSONs: `Amfis_frontend/public/combinedResults.json` and `Amfis_frontend/public/combinedResultsDetailed.json`
- Aggregated CSV: `results/final_results.csv`

5) Option B — Manual (cross-platform) — run in three terminals

- Terminal 1 — Backend (Django)

  Activate venv (see step 1), then:

  ```powershell
  cd AMFIS_backend_\backend
  python manage.py migrate
  python manage.py runserver 0.0.0.0:8000
  ```

  Keep this terminal open to view backend logs.

- Terminal 2 — Dataset pipelines & JSON generation

  Activate venv, then run dataset scripts and generator (these will create CSVs under `results/` and JSON files under `Amfis_frontend/public`):

  ```powershell
  cd <repo-root>
  python scripts\run_full_with_german.py
  python scripts\generate_frontend_results.py
  ```

  Notes:
  - `run_full_with_german.py` executes `src/main.py`, `src/loan_data.py`, `src/bank_data.py` and optionally `src/german_data.py` (if present). It will merge available outputs into `results/final_results.csv`.
  - `generate_frontend_results.py` reads `results/*.csv` and writes `Amfis_frontend/public/combinedResults.json` and `combinedResultsDetailed.json` that the frontend consumes.

- Terminal 3 — Frontend (Vite)

  In a separate terminal (no venv needed unless you use an API proxy), run:

  ```bash
  cd Amfis_frontend
  npm run dev
  ```

6) Verifying outputs

- Open the frontend at `http://localhost:5173/` and navigate to the Dashboard and Dataset Details pages — charts pull data from `Amfis_frontend/public/combinedResults.json` and `combinedResultsDetailed.json`.
- Confirm `results/final_results.csv` exists and contains merged monitoring outputs.

Troubleshooting & tips
- If ports 8000 or 5173 are in use, provide explicit ports (e.g., `python manage.py runserver 0.0.0.0:8001` and `npm run dev -- --port 5174`).
- If `scripts/run_all.ps1` fails because `.venv` is missing, create/activate the venv first and re-run.
- To run just the frontend against the generated JSON files (no backend), ensure `Amfis_frontend/public/combinedResults.json` exists and run `npm run dev`.

Optional: single-command (Linux/macOS) shell that mimics `run_all.ps1`

```bash
# From repo root (example for bash)
./.venv/bin/python scripts/run_full_with_german.py && \
./.venv/bin/python scripts/generate_frontend_results.py & \
cd Amfis_frontend && npm run dev & \
cd ../AMFIS_backend_\backend && . .venv/bin/activate && python manage.py runserver
```

If you want, I can add a cross-platform `run_all.sh` equivalent or a Docker Compose file to start everything together. Tell me which you prefer and I'll implement it.
