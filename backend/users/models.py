import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime
from django.db.models import Avg
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync

class CustomUserManager(BaseUserManager):
    def create_user(self, email, username, password=None, **extra_fields):
        if not email:
            raise ValueError('The Email field must be set')
        email = self.normalize_email(email)
        user = self.model(email=email, username=username, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        # Here is the fix: explicitly set the role to ADMIN for superusers
        extra_fields.setdefault('role', 'ADMIN')

        return self.create_user(email, username, password, **extra_fields)

class CustomUser(AbstractUser):
    ROLE_CHOICES = (
        ('STUDENT', 'Student/Career Seeker'),
        ('MENTOR', 'Mentor'),
        ('ADMIN', 'Administrator'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    email = models.EmailField(unique=True)
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')
    full_name = models.CharField(max_length=255, blank=True, null=True) 
    bio = models.TextField(max_length=500, blank=True) 
    expertise = models.CharField(max_length=255, blank=True, null=True)
    skills = models.CharField(max_length=255, blank=True)  
    career_interest = models.CharField(max_length=255, blank=True) 
    job_title = models.CharField(max_length=100, blank=True)
    company = models.CharField(max_length=100, blank=True)
    years_of_experience = models.PositiveIntegerField(default=0)
    is_available = models.BooleanField(default=True)
    last_activity = models.DateTimeField(null=True, blank=True)
    is_online_status = models.BooleanField(default=False)
    last_seen = models.DateTimeField(null=True, blank=True)
    xp_total = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    has_seen_onboarding = models.BooleanField(default=False)
    mentor = models.ForeignKey(
        'self', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='students',
        limit_choices_to={'role': 'MENTOR'}
    )
    has_celebrated_mentor = models.BooleanField(default=False)

    objects = CustomUserManager()

    USERNAME_FIELD = 'username'
    REQUIRED_FIELDS = ['email']
    
    def add_xp(self, amount):
        self.xp_total += amount
        # Simple leveling logic: every 500 XP is a new level
        self.level = (self.xp_total // 500) + 1
        self.save()
    
    @property
    def average_rating(self):
        # Calculates rating from real student feedback
        avg = self.received_feedbacks.aggregate(Avg('rating'))['rating__avg']
        return round(avg, 1) if avg else 0.0
    
    @property
    def is_currently_online(self):
        """
        Hard check for WebSocket status. 
        Falls back to last_activity if socket is disconnected but active within 2 mins.
        """
        # Must have the socket status AND have been active in the last 60 seconds
        if self.is_online_status and self.last_activity:
            return timezone.now() < self.last_activity + datetime.timedelta(seconds=60)
        return False
    
    
class MentorshipConnection(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('ACCEPTED', 'Accepted'),
        ('DECLINED', 'Declined'),
    )

    # The student requesting help
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='sent_requests', 
        on_delete=models.CASCADE
    )
    # The mentor receiving the request
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        related_name='received_requests', 
        on_delete=models.CASCADE
    )
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='PENDING')
    message = models.TextField(blank=True) # Student's introductory note
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        # Prevent duplicate requests to the same mentor
        unique_together = ('student', 'mentor')

    def __str__(self):
        return f"{self.student.username} -> {self.mentor.username} ({self.status})"
    
    
class PasswordResetOTP(models.Model):
    # Link to your existing User model
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        # Per SRS: Metrics require quick completion. OTP valid for 10 mins 
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)
    
    
class Notification(models.Model):
    recipient = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='notifications')
    message = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def save(self, *args, **kwargs):
        is_new = self.pk is None
        super().save(*args, **kwargs)
        if is_new:
            # Automatically push to WebSocket whenever a new notification is created
            try:
                channel_layer = get_channel_layer()
                async_to_sync(channel_layer.group_send)(
                    "presence_tracking",
                    {
                        "type": "bell_notification", # Handled in PresenceConsumer
                        "recipient_id": str(self.recipient.id),
                        "message": self.message,
                    }
                )
            except Exception as e:
                print(f"WebSocket notification failed: {e}")

    def __str__(self):
        return f"Note for {self.recipient.username}: {self.message[:20]}"
    
    
class Thread(models.Model):
    """
    Acts as a conversation container between a student and a mentor.
    """
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='student_threads'
    )
    mentor = models.ForeignKey(
        settings.AUTH_USER_MODEL, 
        on_delete=models.CASCADE, 
        related_name='mentor_threads'
    )
    # Useful for sorting the inbox by the most recent activity
    updated_at = models.DateTimeField(auto_now=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        # A student and mentor should only ever have ONE thread together
        unique_together = ('student', 'mentor')
        ordering = ['-updated_at']

    def __str__(self):
        return f"Chat: {self.student.username} & {self.mentor.username}"


class Message(models.Model):
    """
    A single message within a Thread.
    """
    thread = models.ForeignKey(Thread, on_delete=models.CASCADE, related_name='messages')
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    content = models.TextField()
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"From {self.sender.username} at {self.created_at}"
    
    
class MentorTask(models.Model):
    STATUS_CHOICES = (
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'), # Set by Student
        ('APPROVED', 'Approved'),   # Set by Mentor (Awards XP)
        ('REDO', 'Needs Revision'), # Set by Mentor
    )

    mentor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='assigned_tasks')
    student = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='received_tasks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    due_date = models.DateField(null=True, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    xp_reward = models.PositiveIntegerField(default=100)
    mentor_feedback = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.title} - {self.student.username}"