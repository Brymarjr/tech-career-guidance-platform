import uuid
from django.contrib.auth.models import AbstractUser
from django.db import models

class CustomUser(AbstractUser):
    # We define clear roles 
    ROLE_CHOICES = (
        ('STUDENT', 'Student/Career Seeker'),
        ('MENTOR', 'Mentor'),
        ('ADMIN', 'Administrator'),
    )
    
    # Using UUIDs for the Primary Key is a security best practice. 
    # It prevents hackers from guessing user counts or IDs.
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    
    # We make email unique and required for our professional authentication flow.
    email = models.EmailField(unique=True)
    
    # This stores the role so the system knows what dashboard to show[cite: 291, 319].
    role = models.CharField(max_length=10, choices=ROLE_CHOICES, default='STUDENT')

    # We tell Django to use the Email as the unique identifier for logging in.
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username'] # Django still requires a username field by default

    def __str__(self):
        return f"{self.email} ({self.role})"