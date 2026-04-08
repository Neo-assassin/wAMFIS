from django.urls import path
from .views import (
    ModelHealthCheckAPI,
    GetLogsAPI,
    UploadScanAPI,
    FilterLogsAPI,
    SummaryAPI,
    RunPipelineAPI,
    RunFullPipelineAPI,
    GetDriftResultsAPI,
    StreamDriftResultsAPI,
)

urlpatterns = [
    path('', ModelHealthCheckAPI.as_view()),
    path('logs/', GetLogsAPI.as_view()),
    path('upload/', UploadScanAPI.as_view()),
    path('filter/', FilterLogsAPI.as_view()),
    path('summary/', SummaryAPI.as_view()),
    path('run/', RunPipelineAPI.as_view()),
    path('run-full/', RunFullPipelineAPI.as_view()),
    path('results/', GetDriftResultsAPI.as_view()),
    path('stream/', StreamDriftResultsAPI.as_view()),
]