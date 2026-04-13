from django.urls import path
from .views import ProfileAPI, RegisterAPI, LoginAPI
urlpatterns = [
    path('register/', RegisterAPI.as_view()),
    path('login/', LoginAPI.as_view()),
    path('profile/', ProfileAPI.as_view()),
]