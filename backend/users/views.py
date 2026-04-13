from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework.views import APIView


class RegisterAPI(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            return Response({"error": "Username and password are required"})

        if User.objects.filter(username=username).exists():
            return Response({"error": "User already exists"})

        User.objects.create_user(username=username, password=password)

        return Response({"message": "User created successfully"})


class LoginAPI(APIView):
    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            return Response({"error": "Invalid credentials"})

        refresh = RefreshToken.for_user(user)

        return Response({
            "message": "Login successful",
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        })

class ProfileAPI(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({
            "username": request.user.username
        })