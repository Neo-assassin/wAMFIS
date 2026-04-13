"""
URL configuration for backend project.
"""
from django.contrib import admin
from django.urls import path
from django.http import HttpResponse, JsonResponse
from services.views import monitoring_results

def predict(request):
    return JsonResponse({"message": "Predict endpoint placeholder"})

urlpatterns = [
    path('', lambda request: HttpResponse("AMFIS Backend Running")),
    path('admin/', admin.site.urls),

    # APIs
    path('predict/', predict),
    path('api/monitoring/results/', monitoring_results),
]