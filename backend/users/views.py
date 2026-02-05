from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from django.contrib.auth import get_user_model, authenticate
from django.core.mail import send_mail
from django.conf import settings
from .serializers import UserSerializer
from .models import CustomUser, PasswordResetOTP, MentorshipConnection
import random
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        print(f"DEBUG: Login attempt for username: {username}")

        try:
            # Manually fetch user by username
            user = CustomUser.objects.get(username=username)
            
            # Manually verify the hashed password
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                print(f"DEBUG: Authentication SUCCESS for {username}")
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'username': user.username,
                        'role': user.role,
                        'full_name': user.full_name
                    }
                })
            else:
                print(f"DEBUG: Password mismatch for {username}")
        except CustomUser.DoesNotExist:
            print(f"DEBUG: User {username} not found in database")

        return Response({"error": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

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


class MentorListView(generics.ListAPIView):
    serializer_class = UserSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        # Only return users who are MENTORS and are available
        return CustomUser.objects.filter(role='MENTOR', is_available=True)
    

class MentorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        # Verify the actor is a MENTOR
        if request.user.role != 'MENTOR':
            return Response({"error": "Unauthorized access."}, status=403)
            
        # Get all requests sent to THIS mentor
        requests = MentorshipConnection.objects.filter(mentor=request.user).order_by('-created_at')
        
        # We need a quick list of the students and their messages
        data = [{
            "id": r.id,
            "student_name": r.student.full_name or r.student.username,
            "student_email": r.student.email,
            "message": r.message,
            "status": r.status,
            "created_at": r.created_at
        } for r in requests]
        
        return Response(data)

    def patch(self, request, pk):
        # Allow mentor to ACCEPT or DECLINE
        try:
            connection = MentorshipConnection.objects.get(id=pk, mentor=request.user)
            new_status = request.data.get('status') # 'ACCEPTED' or 'DECLINED'
            
            if new_status in ['ACCEPTED', 'DECLINED']:
                connection.status = new_status
                connection.save()
                return Response({"message": f"Request {new_status.lower()} successfully."})
            return Response({"error": "Invalid status."}, status=400)
        except MentorshipConnection.DoesNotExist:
            return Response({"error": "Request not found."}, status=404)


class ConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        mentor_id = request.data.get('mentor_id')
        message = request.data.get('message', '')
        
        try:
            mentor = CustomUser.objects.get(id=mentor_id, role='MENTOR')
            connection, created = MentorshipConnection.objects.get_or_create(
                student=request.user,
                mentor=mentor,
                defaults={'message': message}
            )
            if not created:
                return Response({"error": "Request already sent."}, status=400)
            return Response({"message": "Connection request sent successfully!"}, status=201)
        except CustomUser.DoesNotExist:
            return Response({"error": "Mentor not found."}, status=404)