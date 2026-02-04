from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserSerializer
from .models import CustomUser, PasswordResetOTP
import random

User = get_user_model()

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

# --- PHASE 5: PASSWORD RESET WITH REAL EMAIL ---
class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        
        # Flowchart: Is email in database? [cite: 78]
        if not user:
            return Response({"error": "Email not found."}, status=status.HTTP_404_NOT_FOUND)
            
        otp = str(random.randint(100000, 999999)) # [cite: 79]
        PasswordResetOTP.objects.create(user=user, otp_code=otp)
        
        try:
            # SMTP Communication 
            send_mail(
                'TechPath Reset Code',
                f'Your OTP is: {otp}. It expires in 10 minutes.',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return Response({"message": "OTP sent successfully!"})
        except Exception as e:
            # Provide specific feedback to the frontend [cite: 29]
            return Response({"error": f"Mail service error: {str(e)}"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class UserProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Retrieve profile for dashboard [cite: 52, 185]
        serializer = UserSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        # Update profile info (User Story 4) [cite: 52, 63]
        serializer = UserSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        
        otp_record = PasswordResetOTP.objects.filter(
            user__email=email, 
            otp_code=otp_code, 
            is_verified=False
        ).last()

        # Flowchart: Is OTP correct? [cite: 89]
        if not otp_record or otp_record.is_expired():
            return Response({"error": "Invalid or expired OTP."}, status=status.HTTP_400_BAD_REQUEST)

        otp_record.is_verified = True
        otp_record.save()
        return Response({"message": "OTP verified. You may now reset your password."})

class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        
        otp_record = PasswordResetOTP.objects.filter(user__email=email, is_verified=True).last()
        if not otp_record:
            return Response({"error": "OTP verification required."}, status=status.HTTP_400_BAD_REQUEST)

        # Flowchart: Update Password in DB [cite: 87]
        user = otp_record.user
        user.set_password(new_password) # Per SRS: Secure hashing encryption 
        user.save()
        
        otp_record.delete() 
        return Response({"message": "Password updated successfully!"})

