# AMFIS Backend System

This project was developed as part of our academic work to understand model monitoring systems.

An intelligent backend system for the Automated Model Failure Identification System (AMFIS).  
This system monitors machine learning model performance using metrics such as accuracy and loss, detects potential failures, and provides structured APIs for analysis.

---

## Overview

AMFIS is designed to:

- Monitor model performance using numerical metrics
- Detect failure conditions based on thresholds
- Log model behavior for tracking and analysis
- Provide APIs for querying and summarizing data
- Secure endpoints using JWT authentication

The backend is built using Django REST Framework with a modular and scalable architecture.

---

## Key Features

- JWT Authentication (Login and Protected APIs)
- Model Performance Monitoring
- Failure Detection Logic
- Logging System for Model Metrics
- Filtering and Query APIs
- Summary Statistics API
- Input Validation and Error Handling
- Clean and Scalable Backend Architecture

---

## Tech Stack

- Backend Framework: Django
- API Framework: Django REST Framework
- Authentication: JWT (SimpleJWT)
- Database: SQLite (default)
- Language: Python

---

## Project Structure

backend/

├── config/            # Project settings and main URLs  
├── users/             # Authentication (login/register)  
├── monitoring/        # Core logic and APIs  
├── services/          # Business logic (failure detection)  
├── manage.py  
└── requirements.txt  

---

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/login/ | User login (returns JWT tokens) |
| POST | /api/register/ | Register new user |

---

### Model Monitoring

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/monitoring/ | Detect model failure |
| GET | /api/monitoring/logs/ | Retrieve all logs |
| GET | /api/monitoring/filter/ | Filter logs by model or status |
| GET | /api/monitoring/summary/ | Get aggregated statistics |

---

## Example Request

### Detect Failure

POST /api/monitoring/

{
  "model_name": "model_v1",
  "accuracy": 0.92,
  "loss": 0.1
}

---

### Example Response

{
  "success": true,
  "data": {
    "model": "model_v1",
    "accuracy": 0.92,
    "loss": 0.1,
    "status": "Healthy"
  }
}

---

## Summary API Response

{
  "success": true,
  "data": {
    "total": 10,
    "healthy": 6,
    "warning": 2,
    "failure": 2
  }
}

---

## Installation and Setup

### 1. Clone the repository

git clone <your-repo-link>  
cd backend  

---

### 2. Create virtual environment

python -m venv venv  

Activate:

Mac/Linux:
source venv/bin/activate  

Windows:
venv\Scripts\activate  

---

### 3. Install dependencies

pip install -r requirements.txt  

---

### 4. Apply migrations

python manage.py makemigrations  
python manage.py migrate  

---

### 5. Run server

python manage.py runserver  

---

## Authentication Usage

Include JWT token in request headers:

Authorization: Bearer <"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ0b2tlbl90eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzc1NDAyMDA2LCJpYXQiOjE3NzUzOTg0MDYsImp0aSI6IjZjZDEzZGNiNWJjZTRmNGQ5Yjg2ZTJmYWZhN2Y5OTRlIiwidXNlcl9pZCI6IjEifQ.DgNmqWVg5at2IuwXauuZ0NreUJ75tUHrtpePdMW5yJU">

---

## Failure Detection Logic

The system evaluates model performance using:

- Accuracy (0 to 1 range)
- Loss (non-negative)

Based on thresholds, models are classified as:

- Healthy
- Warning
- Failure

---

## Future Enhancements

- Integration with real machine learning models
- Explainability support (e.g., SHAP)
- Dashboard interface
- Model version tracking
- Alert and notification system
- Currently failure detection is based on rule logic which can be replaced with actual model prediction in services layer.
---

## Author

Developed as part of an academic project focused on intelligent model monitoring systems.

---

## Final Note

This backend demonstrates:

- Structured API design
- Proper validation and error handling
- Modular architecture
- Practical approach to ML model monitoring