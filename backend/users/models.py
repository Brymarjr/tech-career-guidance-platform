import uuid
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.conf import settings
from django.utils import timezone
import datetime

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
    full_name = models.CharField(max_length=255, blank=True) # 
    bio = models.TextField(max_length=500, blank=True) # 
    skills = models.CharField(max_length=255, blank=True) # 
    career_interest = models.CharField(max_length=255, blank=True) # 

    objects = CustomUserManager()

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    def __str__(self):
        return f"{self.email} ({self.role})"
    
    
class PasswordResetOTP(models.Model):
    # Link to your existing User model
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    otp_code = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)

    def is_expired(self):
        # Per SRS: Metrics require quick completion. OTP valid for 10 mins [cite: 52]
        return timezone.now() > self.created_at + datetime.timedelta(minutes=10)