# AMFIS - Autonomous Model Failure Intelligence System

<p align="center">
  <img src="https://img.shields.io/badge/Version-2.0-brightgreen" alt="Version">
  <img src="https://img.shields.io/badge/Python-3.13-blue" alt="Python">
  <img src="https://img.shields.io/badge/React-Vite-orange" alt="React">
  <img src="https://img.shields.io/badge/Django-5.2-red" alt="Django">
</p>

<p align="center" style="font-size: 12px; color: #666;">
  <em>Created by neo-assassin</em>
</p>

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Features](#features)
3. [Project Structure](#project-structure)
4. [Installation & Setup](#installation--setup)
5. [Running the Project](#running-the-project)
6. [Dataset Monitoring](#dataset-monitoring)
7. [Frontend Dashboard](#frontend-dashboard)
8. [Backend API](#backend-api)
9. [Graphs & Visualization](#graphs--visualization)
10. [Technology Stack](#technology-stack)
11. [Contributors](#contributors)

---

## 🎯 Project Overview

AMFIS (Autonomous Model Failure Intelligence System) is a comprehensive machine learning monitoring platform that analyzes model performance across multiple datasets. It detects data drift, accuracy degradation, and provides actionable insights to prevent model failures in production.

**Created by:** neo-assassin  
**Version:** 2.0  
**Last Updated:** April 2026

---

## ✨ Features

### Core Features
- **4 Dataset Monitoring**: Adult Census, Loan Prediction, Bank Marketing, German Credit
- **3 Scenario Testing**: Noise injection, Distribution shift, Feature removal
- **Real-time Drift Detection**: PSI (Population Stability Index) calculation
- **Health Score Calculation**: Model health based on accuracy drops
- **Risk Classification**: High, Medium, Low risk indicators
- **Actionable Insights**: Automated recommendations for model retraining

### Dashboard Features
- Interactive dataset cards with health scores
- Risk level filtering (All/High/Medium/Low)
- Dataset comparison graphs
- Detailed scenario analysis
- Individual dataset graphs (4 per dataset)
- Real-time metric displays (PSI, Accuracy, Health, etc.)

### Backend Features
- Django REST API
- CSV-based data persistence
- Real-time monitoring results
- Health prediction endpoint

---

## 📁 Project Structure

```
AMFIS/
├── backend/                    # Django backend
│   ├── backend/
│   │   ├── urls.py             # API routes
│   │   └── settings.py        # Django settings
│   ├── services/
│   │   └── views.py           # API views
│   └── manage.py              # Django entry point
│
├── frontend/                   # React + Vite frontend
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx     # Main dashboard
│   │   │   └── DatasetDetails.jsx # Dataset detail view
│   │   ├── components/
│   │   │   ├── layout/            # Navbar, Sidebar, SummaryPanel
│   │   │   ├── dashboard/          # DatasetCard, FilterBar
│   │   │   └── details/            # DriftCharts, PerformanceMetrics, etc.
│   │   ├── styles/                # CSS variables, layout, components
│   │   └── data/                  # combinedResults.json
│   ├── public/
│   │   ├── combinedResults.json
│   │   ├── combinedResultsDetailed.json
│   │   └── graphs/                # Dataset comparison & analysis graphs
│   └── package.json
│
├── results/                   # Dataset run results
│   ├── final_results.csv      # Combined results
│   ├── results.csv           # Adult dataset
│   ├── credit_results.csv    # Loan dataset
│   ├── bank_results.csv      # Bank dataset
│   ├── german_results.csv   # German Credit dataset
│   └── graphs/               # Generated visualizations
│
├── scripts/                   # Python scripts
│   ├── run_all.ps1          # PowerShell script to run everything
│   ├── run_full_with_german.py  # Run all 4 datasets
│   └── generate_frontend_results.py  # Generate frontend JSON
│
├── src/                      # Dataset processing scripts
│   ├── main.py              # Adult dataset
│   ├── loan_data.py         # Loan dataset
│   ├── bank_data.py         # Bank dataset
│   └── german_data.py       # German Credit dataset
│
└── README.md                 # This file
```

---

## 🚀 Installation & Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- npm or yarn

### Step 1: Clone the Repository
```bash
git clone <repository-url>
cd AMFIS
```

### Step 2: Python Setup
```powershell
# Create virtual environment
python -m venv .venv

# Activate virtual environment
.venv\Scripts\Activate.ps1  # Windows

# Install dependencies
pip install -r requirements.txt
```

### Step 3: Frontend Setup
```powershell
cd frontend
npm install
```

---

## 🎮 Running the Project

### Option 1: Run All (Recommended)
```powershell
powershell -ExecutionPolicy Bypass -File .\scripts\run_all.ps1
```

This script will:
1. Run all 4 datasets
2. Generate frontend JSON files
3. Start Django backend on port 8000
4. Start Vite frontend on port 5173

### Option 2: Manual Run

#### Step 1: Run Datasets
```powershell
python scripts\run_full_with_german.py
python scripts\generate_frontend_results.py
```

#### Step 2: Start Backend
```powershell
# Terminal 1
python backend\manage.py runserver 8000
```

#### Step 3: Start Frontend
```powershell
# Terminal 2
cd frontend
npm run dev
```

---

## 📊 Dataset Monitoring

### Datasets Processed

| Dataset | Description | Scenarios |
|---------|-------------|-----------|
| **Adult** | Census Income Data | noise, shift, feature_removed |
| **Loan** | Credit Prediction | noise, shift, feature_removed |
| **Bank** | Marketing Data | noise, shift, feature_removed |
| **German Credit** | Credit Scoring | noise, shift, feature_removed |

### Metrics Calculated

| Metric | Description |
|--------|-------------|
| **PSI** | Population Stability Index - measures data drift |
| **Accuracy** | Model accuracy percentage |
| **Acc Drop** | Accuracy drop from baseline |
| **Health** | Overall model health (0-100%) |
| **Severity** | Risk severity (High/Moderate/Low) |
| **Top Drift Feature** | Feature with most significant drift |
| **Action** | Recommended action for the scenario |

### Sample Output

```
[SUMMARY] Dataset ranking (most sensitive first)
      dataset  degradation_score  avg_acc_drop  avg_psi  avg_health
German Credit           1.000000      2.833333e-02 3.295456    0.806000
         Bank           0.656250      1.445603e-19 2.292159    0.819333
        Adult           0.041905      9.315181e-03 0.409152    0.790667
         Loan           0.000000      1.377778e-02 0.274969    0.855667
```

---

## 🖥️ Frontend Dashboard

### Dashboard Page (`/dashboard`)
- **Stats Summary**: Active datasets, High Risk count, Healthy count
- **Filter Buttons**: Filter by risk level (All/High/Medium/Low)
- **Dataset Cards**: 4 cards showing:
  - Dataset name
  - Health score (with progress bar)
  - Risk level indicator
  - Accuracy drop status
  - Drift detection status
  - Alert count
- **Dataset Comparison Graph**: Visual comparison of all datasets

### Dataset Details Page (`/dataset/:id`)
- **Stats Cards**: Health Score, Accuracy Drop, Data Drift, Scenarios
- **Scenario Analysis**: Grid of scenario cards showing:
  - Scenario name
  - PSI value
  - Accuracy percentage
  - Accuracy drop
  - Health percentage
  - Top drift feature
- **Analysis Graphs**: 4 graphs per dataset:
  - PSI vs Accuracy Drop
  - Accuracy by Scenario (Bar chart)
  - Degradation Trend
  - Accuracy vs PSI
- **Action Required**: Automated recommendations

---

## 🔧 Backend API

### Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | Health check |
| `/admin/` | GET | Django admin |
| `/predict/` | POST | Predict risk/health |
| `/api/monitoring/results/` | GET | Get all monitoring results |

### API Response Format
```json
{
  "data": [
    {
      "dataset": "Adult",
      "scenario": "noise",
      "psi": 0.982598,
      "acc_drop": 0.005528,
      "accuracy": 0.850855,
      "health": 0.506,
      "risk": "High",
      "explanation": "Significant drift detected...",
      "action": "Trigger incident workflow..."
    }
  ]
}
```

---

## 📈 Graphs & Visualization

### Graphs Generated
- `dataset_comparison.png` - Main dashboard comparison
- `adult_01_psi_vs_acc_drop.png` - Adult dataset analysis
- `adult_02_accuracy_bar.png`
- `adult_03_degradation_trend.png`
- `adult_04_accuracy_vs_psi.png`
- `loan_01_psi_vs_acc_drop.png` - Loan dataset analysis
- `loan_02_accuracy_bar.png`
- `loan_03_degradation_trend.png`
- `loan_04_accuracy_vs_psi.png`

### Graph Location
- **Source**: `results/graphs/`
- **Frontend**: `frontend/public/graphs/`

---

## 🛠️ Technology Stack

### Backend
- **Framework**: Django 5.2
- **Language**: Python 3.13
- **Data Processing**: Pandas, NumPy
- **ML Metrics**: Scikit-learn

### Frontend
- **Framework**: React 18 + Vite
- **Routing**: React Router v6
- **Charts**: Chart.js (react-chartjs-2)
- **Icons**: Lucide React
- **Styling**: CSS Variables (Dark Theme)

### Development Tools
- **Version Control**: Git
- **Package Manager**: npm, pip
- **Virtual Environment**: Python venv

---

## 📝 Notes

- All real values are displayed from actual dataset runs
- No mock data - all metrics are computed from real model predictions
- Graphs are generated automatically from dataset analysis
- The frontend falls back to static JSON if backend API is unavailable

---

## 🙏 Acknowledgments

**Created by:** neo-assassin

Special thanks to all contributors and the open-source community.

---

<p align="center">
  <img src="https://img.shields.io/badge/Made%20with-❤️-red" alt="Made with love">
  <br>
  © 2026 AMFIS - Autonomous Model Failure Intelligence System
  <br>
  <strong>Created by neo-assassin</strong> | All Rights Reserved
</p>


