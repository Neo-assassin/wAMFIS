"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.2/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
print("CONFIG URLS LOADED")
from django.contrib import admin
from django.urls import path
from django.http import HttpResponse
from backend.services.views import monitoring_results, predict

urlpatterns = [
    path('', lambda request: HttpResponse("AMFIS Backend Running")),
    path('admin/', admin.site.urls),

    # API routes
    path('predict/', predict),
    path('api/monitoring/results/', monitoring_results),
]