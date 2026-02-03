import uuid
from django.db import models
from django.conf import settings

class Question(models.Model):
    # Mapping to RIASEC types
    RIASEC_CHOICES = (
        ('R', 'Realistic'),
        ('I', 'Investigative'),
        ('A', 'Artistic'),
        ('S', 'Social'),
        ('E', 'Enterprising'),
        ('C', 'Conventional'),
    )
    text = models.CharField(max_length=500)
    riasec_type = models.CharField(max_length=1, choices=RIASEC_CHOICES)
    order = models.IntegerField(default=0)

    def __str__(self):
        return f"[{self.riasec_type}] {self.text[:50]}"


class AssessmentResult(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    # Storing scores like: {"R": 10, "I": 25, "A": 5, ...}
    scores = models.JSONField()
    top_trait = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.top_trait} ({self.created_at.date()})"


class LearningResource(models.Model):
    RESOURCE_TYPES = (
        ('VIDEO', 'Video'),
        ('DOC', 'Documentation'),
        ('COURSE', 'Course'),
    )

    # RELATING TO MILESTONE: This is the key change. 
    # One milestone can have many resources (related_name='resources')
    milestone = models.ForeignKey(
        'Milestone', 
        on_delete=models.CASCADE, 
        related_name='resources',
        null=True, # Temporarily allow null while migrating
        blank=True
    )
    title = models.CharField(max_length=255)
    url = models.URLField()
    category = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    
    # We keep this for easy filtering if needed
    trait_alignment = models.CharField(max_length=1) 

    def __str__(self):
        return f"{self.milestone.title if self.milestone else 'Unassigned'} - {self.title}"
    
    
class CareerPath(models.Model):
    RIASEC_CHOICES = [
        ('R', 'Realistic'), ('I', 'Investigative'), ('A', 'Artistic'),
        ('S', 'Social'), ('E', 'Enterprising'), ('C', 'Conventional'),
    ]
    trait_type = models.CharField(max_length=1, choices=RIASEC_CHOICES, unique=True)
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration = models.CharField(max_length=50) # e.g., "12 Weeks"

    def __str__(self):
        return f"{self.get_trait_type_display()} - {self.title}"


class Milestone(models.Model):
    path = models.ForeignKey(CareerPath, related_name='milestones', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.path.title} | {self.title}"


class UserProgress(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE)
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'milestone')

    def __str__(self):
        return f"{self.user.username} - {self.milestone.title}"