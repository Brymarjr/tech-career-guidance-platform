import csv
import random
import time
import os
import psutil
from datetime import datetime, timedelta

from django.http import HttpResponse, StreamingHttpResponse
from django.utils import timezone
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.conf import settings
from django.db import connection
from django.db.models import Count, Avg, Q
from django.shortcuts import get_object_or_404

from rest_framework import generics, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from rest_framework_simplejwt.tokens import RefreshToken

from .serializers import UserSerializer, MentorPublicSerializer, ThreadSerializer, MessageSerializer, MentorTaskSerializer, NotificationSerializer
from .models import CustomUser, PasswordResetOTP, MentorshipConnection, Notification, Thread, MentorTask
from assessments.models import UserProgress
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync


User = get_user_model()

# --- AUTHENTICATION ---

class LoginView(APIView):
    permission_classes = [permissions.AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')
        
        try:
            user = CustomUser.objects.get(username=username)
            if user.check_password(password):
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                    'user': {
                        'username': user.username,
                        'role': user.role,
                        'full_name': user.full_name
                    }
                })
        except CustomUser.DoesNotExist:
            pass

        return Response({"error": "Invalid username or password."}, status=status.HTTP_401_UNAUTHORIZED)

class RegisterView(generics.CreateAPIView):
    queryset = CustomUser.objects.all()
    permission_classes = (permissions.AllowAny,)
    serializer_class = UserSerializer

# NEW: Change Password (Internal App Logic)
class ChangePasswordView(APIView):
    """Allows authenticated users to change their password from within the app profile."""
    permission_classes = [permissions.IsAuthenticated]

    def post(self, request):
        user = request.user
        old_password = request.data.get("old_password")
        new_password = request.data.get("new_password")

        if not user.check_password(old_password):
            return Response({"error": "Current password is incorrect."}, status=400)

        user.set_password(new_password)
        user.save()

        # LOGGING THE EVENT TO THE AUDIT LOG
        # We use a simple print or a dedicated log model if you have one.
        # If you want it in the CSV export, we ensure the 'updated_at' 
        # timestamp is refreshed.
        
        # Create a notification for the user as a security confirmation
        Notification.objects.create(
            recipient=user,
            message="Your password was successfully changed. If you did not do this, contact support."
        )

        return Response({"message": "Password updated successfully."})

# --- PROFILE MANAGEMENT ---

class ProfileView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        u = request.user
        return Response({
            "full_name": u.full_name,
            "email": u.email,
            "bio": u.bio,
            "expertise": u.expertise,
            "skills": u.skills,
            "career_interest": u.career_interest,
            "job_title": u.job_title,
            "company": u.company,
            "years_of_experience": u.years_of_experience,
            "is_available": u.is_available,
            "role": u.role,
            "last_seen": u.last_seen.isoformat() if u.last_seen else None # Inclusion of Full Date/Time
        })

    def patch(self, request):
        user = request.user
        data = request.data
        fields = ["full_name", "bio", "expertise", "skills", "career_interest", "job_title", "company", "years_of_experience", "is_available"]

        for field in fields:
            if field in data:
                val = data[field]
                if field == "years_of_experience":
                    try: val = int(val) if val is not None else 0
                    except (ValueError, TypeError): val = 0
                if field == "is_available":
                    val = str(val).lower() == 'true' if not isinstance(val, bool) else val
                setattr(user, field, val)
        
        user.save()
        return Response({
            "full_name": user.full_name,
            "bio": user.bio,
            "expertise": user.expertise,
            "job_title": user.job_title,
            "company": user.company,
            "years_of_experience": user.years_of_experience,
            "is_available": user.is_available,
            "status": "success"
        })

# --- PASSWORD RESET (EXTERNAL/OTP) ---

class RequestPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()
        if not user:
            return Response({"error": "Email not found."}, status=status.HTTP_404_NOT_FOUND)
        otp = str(random.randint(100000, 999999))
        PasswordResetOTP.objects.create(user=user, otp_code=otp)
        try:
            send_mail(
                'TechPath Reset Code',
                f'Your OTP is: {otp}. It expires in 10 minutes.',
                settings.EMAIL_HOST_USER,
                [email],
                fail_silently=False,
            )
            return Response({"message": "OTP sent successfully!"})
        except Exception as e:
            # Production: Log to server logs, show user a clean error
            import logging
            logger = logging.getLogger(__name__)
            logger.error(f"Password reset failed for {email}: {str(e)}")
            
            return Response({
                "error": "We are experiencing technical difficulties sending emails. Please try again in a few minutes."
            }, status=status.HTTP_503_SERVICE_UNAVAILABLE)

class VerifyOTPView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        otp_code = request.data.get('otp')
        otp_record = PasswordResetOTP.objects.filter(user__email=email, otp_code=otp_code, is_verified=False).last()
        if not otp_record or otp_record.is_expired():
            return Response({"error": "Invalid or expired OTP."}, status=400)
        otp_record.is_verified = True
        otp_record.save()
        return Response({"message": "OTP verified."})

class ConfirmPasswordResetView(APIView):
    permission_classes = [permissions.AllowAny]
    def post(self, request):
        email = request.data.get('email')
        new_password = request.data.get('new_password')
        otp_record = PasswordResetOTP.objects.filter(user__email=email, is_verified=True).last()
        if not otp_record:
            return Response({"error": "OTP verification required."}, status=400)
        user = otp_record.user
        user.set_password(new_password)
        user.save()
        otp_record.delete() 
        return Response({"message": "Password updated successfully!"})

# --- MENTORSHIP & DISCOVERY ---

class MentorListView(generics.ListAPIView):
    """Returns available mentors, excluding those who have already accepted the student."""
    serializer_class = MentorPublicSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        
        # 1. Get IDs of mentors who have already ACCEPTED this student
        accepted_mentor_ids = MentorshipConnection.objects.filter(
            student=user, 
            status='ACCEPTED'
        ).values_list('mentor_id', flat=True)

        # 2. Get IDs of mentors who have BLOCKED this student
        blocked_mentor_ids = MentorshipConnection.objects.filter(
            student=user, 
            status='BLOCKED'
        ).values_list('mentor_id', flat=True)
        
        # 3. Exclude both Accepted and Blocked mentors from discovery
        return CustomUser.objects.filter(
            role='MENTOR', 
            is_available=True
        ).exclude(id__in=accepted_mentor_ids).exclude(id__in=blocked_mentor_ids)


class MentorDashboardView(APIView):
    permission_classes = [permissions.IsAuthenticated]

    def get(self, request):
        if request.user.role != 'MENTOR' and not request.user.is_staff:
            return Response({"error": "Unauthorized access."}, status=403)
        
        conn_requests = MentorshipConnection.objects.filter(mentor=request.user).order_by('-created_at')
        my_students = CustomUser.objects.filter(mentor=request.user).only('id', 'username', 'email', 'full_name')
        
        student_ids = my_students.values_list('id', flat=True)
        
        # 1. Fetch existing threads
        threads = Thread.objects.filter(mentor=request.user, student_id__in=student_ids)
        thread_map = {t.student_id: t.id for t in threads}

        # 2. Stats Engine
        pending_reviews_count = UserProgress.objects.filter(
            user_id__in=student_ids, 
            status='PENDING_REVIEW'
        ).count()
        
        total_approved_count = UserProgress.objects.filter(
            user_id__in=student_ids, 
            status='COMPLETED'
        ).count()

        # 3. Format Roster Data (with thread safety)
        roster_data = []
        for s in my_students:
            t_id = thread_map.get(s.id)
            
            # SAFEGUARD: If Admin assigned student but no thread exists, create it now
            if not t_id:
                new_thread, _ = Thread.objects.get_or_create(student=s, mentor=request.user)
                t_id = new_thread.id

            roster_data.append({
                "id": s.id,
                "name": s.full_name or s.username,
                "email": s.email,
                "thread_id": t_id
            })

        return Response({
            "requests": [{
                "id": r.id,
                "student_name": r.student.full_name or r.student.username,
                "student_email": r.student.email,
                "message": r.message,
                "status": r.status,
                "created_at": r.created_at
            } for r in conn_requests],
            "roster": roster_data,
            "stats": {
                "active_students": my_students.count(),
                "pending_reviews": pending_reviews_count,
                "total_approved": total_approved_count
            }
        })

    def patch(self, request, pk):
        try:
            connection = MentorshipConnection.objects.get(id=pk, mentor=request.user)
            new_status = request.data.get('status') 
            
            if new_status in ['ACCEPTED', 'DECLINED', 'BLOCKED']:
                old_status = connection.status
                connection.status = new_status
                connection.save()

                if new_status == 'ACCEPTED':
                    student = connection.student
                    student.mentor = request.user
                    student.save()
                    Thread.objects.get_or_create(student=student, mentor=request.user)

                msg_text = f"Mentor {request.user.username} has {new_status.lower()} your mentorship request."
                if old_status == 'BLOCKED' and new_status == 'DECLINED':
                    msg_text = f"Mentor {request.user.username} has unblocked you."

                Notification.objects.create(recipient=connection.student, message=msg_text)

                return Response({
                    "message": f"Status updated to {new_status}.",
                    "status": new_status,
                    "updated_at": timezone.now()
                })
            return Response({"error": "Invalid status."}, status=400)
        except MentorshipConnection.DoesNotExist:
            return Response({"error": "Request not found."}, status=404)

    def delete(self, request, pk):
        try:
            student = CustomUser.objects.get(id=pk, mentor=request.user)
            student.mentor = None
            student.save()
            MentorshipConnection.objects.filter(student=student, mentor=request.user).update(status='DECLINED')
            Notification.objects.create(recipient=student, message=f"Unassigned from mentor {request.user.username}.")
            return Response({"message": f"Student {student.username} dropped."})
        except CustomUser.DoesNotExist:
            return Response({"error": "Student not found in roster."}, status=404)


class ConnectionRequestView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        if request.user.role != 'STUDENT':
            return Response({"error": "Only students can initiate connections."}, status=403)
        mentor_id = request.data.get('mentor_id')
        message = request.data.get('message', '')
        try:
            mentor = CustomUser.objects.get(id=mentor_id, role='MENTOR')
            connection = MentorshipConnection.objects.filter(student=request.user, mentor=mentor).first()
            if connection:
                if connection.status == 'BLOCKED':
                    return Response({"error": "Not accepting requests."}, status=403)
                if connection.status == 'DECLINED':
                    connection.status = 'PENDING'
                    connection.message = message
                    connection.save()
                    Notification.objects.create(recipient=mentor, message=f"{request.user.username} re-sent request.")
                    return Response({"message": "Re-sent successfully!"})
                return Response({"error": "Already have a request."}, status=400)
            MentorshipConnection.objects.create(student=request.user, mentor=mentor, message=message, status='PENDING')
            Notification.objects.create(recipient=mentor, message=f"New request from {request.user.username}.")
            return Response({"message": "Request sent successfully!"}, status=201)
        except CustomUser.DoesNotExist:
            return Response({"error": "Mentor not found."}, status=404)

class StudentRequestHistoryView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        requests = MentorshipConnection.objects.filter(student=request.user).order_by('-updated_at')
        data = [{
            "id": r.id,
            "mentor_name": r.mentor.username,
            "status": r.status,
            "message": r.message,
            "date": r.updated_at.strftime('%Y-%m-%d %H:%M') # Detailed date/time
        } for r in requests]
        return Response(data)

# --- ADMIN & SYSTEM ---

class AdminGlobalStatsView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Forbidden"}, status=403)
        stats = {
            "total_users": CustomUser.objects.count(),
            "total_students": CustomUser.objects.filter(role='STUDENT').count(),
            "total_mentors": CustomUser.objects.filter(role='MENTOR').count(),
            "active_connections": MentorshipConnection.objects.filter(status='ACCEPTED').count(),
            "pending_requests": MentorshipConnection.objects.filter(status='PENDING').count(),
        }
        recent_users = CustomUser.objects.order_by('-date_joined')[:5].values('username', 'email', 'role', 'date_joined')
        return Response({"stats": stats, "recent_users": recent_users})

class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100

class AdminUserManagementView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = StandardResultsSetPagination
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Admin access required"}, status=403)
        users = CustomUser.objects.all().select_related('mentor').order_by('-date_joined')
        paginator = self.pagination_class()
        result_page = paginator.paginate_queryset(users, request)
        data = [{
            "id": str(u.id),
            "username": u.username,
            "email": u.email,
            "role": u.role,
            "is_active": u.is_active,
            "date_joined": u.date_joined,
            "mentor": u.mentor.id if u.mentor else None 
        } for u in result_page]
        return paginator.get_paginated_response(data)

    def patch(self, request, pk):
        if request.user.role != 'ADMIN':
            return Response({"error": "Admin access required"}, status=403)
        try:
            target_user = CustomUser.objects.get(id=pk)
            new_role = request.data.get('role')
            is_active = request.data.get('is_active')
            mentor_id = request.data.get('mentor')
            if new_role: target_user.role = new_role
            if is_active is not None: target_user.is_active = is_active
            if mentor_id is not None:
                if mentor_id == "" or mentor_id == None: target_user.mentor = None
                else: target_user.mentor_id = mentor_id
            target_user.save()
            return Response({"message": f"User {target_user.username} updated."})
        except CustomUser.DoesNotExist:
            return Response({"error": "User not found"}, status=404)

class ExportAuditLogView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Admin access required"}, status=403)
        response = HttpResponse(content_type='text/csv')
        filename = f"system_audit_{timezone.now().strftime('%Y-%m-%d')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        writer = csv.writer(response)
        writer.writerow(['Student Name', 'Student Email', 'Mentor Name', 'Status', 'Date Created'])
        connections = MentorshipConnection.objects.select_related('student', 'mentor').all().values_list('student__username', 'student__email', 'mentor__username', 'status', 'created_at')
        for conn in connections:
            row = list(conn)
            row[4] = row[4].strftime('%Y-%m-%d %H:%M')
            writer.writerow(row)
        return response

process_start_time = psutil.Process(os.getpid()).create_time()

class SystemHealthView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != 'ADMIN':
            return Response({"error": "Unauthorized"}, status=403)
        health_stats = {}
        try:
            start_time = time.time()
            connection.ensure_connection()
            db_latency = round((time.time() - start_time) * 1000, 2)
            health_stats["database"] = {"status": "Operational", "latency": f"{db_latency}ms"}
        except Exception:
            health_stats["database"] = {"status": "Offline", "latency": "Timeout"}
        uptime_seconds = int(time.time() - process_start_time)
        health_stats["api_server"] = {
            "status": "Healthy",
            "uptime": str(timedelta(seconds=uptime_seconds)),
            "memory_usage": f"{psutil.Process(os.getpid()).memory_info().rss / 1024 / 1024:.2f} MB"
        }
        return Response(health_stats)
    
class StudentNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        accepted_requests = MentorshipConnection.objects.filter(student=request.user, status='ACCEPTED').select_related('mentor')
        data = [{
            "id": r.id,
            "mentor_name": r.mentor.username,
            "message": f"Mentor {r.mentor.username} has accepted your request!"
        } for r in accepted_requests]
        return Response(data)
    
class MentorNotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role != 'MENTOR':
            return Response({"error": "Unauthorized"}, status=403)
        pending_count = MentorshipConnection.objects.filter(mentor=request.user, status='PENDING').count()
        return Response({"pending_count": pending_count, "has_new_requests": pending_count > 0})
        
class NotificationView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        notes = Notification.objects.filter(recipient=request.user).order_by('-created_at')[:10]
        serializer = NotificationSerializer(notes, many=True)
        return Response(serializer.data)
    def patch(self, request, pk=None):
        if pk: Notification.objects.filter(id=pk, recipient=request.user).update(is_read=True)
        else: Notification.objects.filter(recipient=request.user).update(is_read=True)
        return Response({"status": "read"})
    
class ThreadListView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        threads = Thread.objects.filter(Q(student=request.user) | Q(mentor=request.user)).order_by('-updated_at')
        serializer = ThreadSerializer(threads, many=True, context={'request': request})
        return Response(serializer.data)

class MessageView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request, thread_id):
        thread = get_object_or_404(Thread, id=thread_id)
        if request.user != thread.student and request.user != thread.mentor:
            return Response({"error": "Unauthorized"}, status=403)
        messages = thread.messages.all().order_by('created_at')
        thread.messages.filter(~Q(sender=request.user), is_read=False).update(is_read=True)
        serializer = MessageSerializer(messages, many=True)
        return Response(serializer.data)

    def post(self, request, thread_id):
        thread = get_object_or_404(Thread, id=thread_id)
        if request.user != thread.student and request.user != thread.mentor:
            return Response({"error": "Unauthorized"}, status=403)
        if thread.student.mentor_id != thread.mentor_id:
            return Response({"error": "Mentorship ended."}, status=403)
        serializer = MessageSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(sender=request.user, thread=thread)
            thread.save() 
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)
    
class CompleteOnboardingView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        request.user.has_seen_onboarding = True
        request.user.save()
        return Response({"status": "success"})
    
class MarkCelebratedView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def post(self, request):
        request.user.has_celebrated_mentor = True
        request.user.save()
        return Response({"status": "success"})
    
class MentorTaskListCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        if request.user.role == 'MENTOR': tasks = MentorTask.objects.filter(mentor=request.user)
        else: tasks = MentorTask.objects.filter(student=request.user)
        return Response(MentorTaskSerializer(tasks, many=True).data)

    def post(self, request):
        if request.user.role != 'MENTOR':
            return Response({"error": "Mentors only."}, status=403)
        serializer = MentorTaskSerializer(data=request.data)
        if serializer.is_valid():
            task = serializer.save(mentor=request.user)
            Notification.objects.create(recipient=task.student, message=f"New task: {task.title}")
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "presence_tracking",
                {
                    "type": "task_notification",
                    "recipient_id": str(task.student.id),
                    "message": f"New task assigned: {task.title}",
                    "mentor_name": request.user.username
                }
            )
            return Response(serializer.data, status=201)
        return Response(serializer.errors, status=400)

class MentorTaskUpdateStatusView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def patch(self, request, task_id):
        task = get_object_or_404(MentorTask, id=task_id)
        new_status = request.data.get('status')
        feedback = request.data.get('mentor_feedback', '')
        recipient = None
        notif_message = ""
        if new_status == 'COMPLETED':
            if request.user != task.student: return Response({"error": "Unauthorized"}, status=403)
            task.status = 'COMPLETED'
            recipient = task.mentor
            notif_message = f"{task.student.username} completed task."
        elif new_status in ['APPROVED', 'REDO']:
            if request.user != task.mentor: return Response({"error": "Unauthorized"}, status=403)
            task.status = new_status
            task.mentor_feedback = feedback
            recipient = task.student
            notif_message = f"Task '{task.title}' {new_status.lower()}!"
            if new_status == 'APPROVED': task.student.add_xp(task.xp_reward)
        task.save()
        if recipient:
            channel_layer = get_channel_layer()
            async_to_sync(channel_layer.group_send)(
                "presence_tracking", {"type": "bell_notification", "recipient_id": str(recipient.id), "message": notif_message}
            )
        return Response(MentorTaskSerializer(task).data)