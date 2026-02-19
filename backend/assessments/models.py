"""
Module: assessments.models
Defines the core data structures for the career guidance system, including
psychometric questions, career roadmaps, and student progress tracking.
"""

import uuid
from django.db import models
from django.conf import settings

class Question(models.Model):
    """
    Represents a single psychometric question mapped to a RIASEC personality type.
    """
    RIASEC_CHOICES = (
        ('R', 'Realistic'), ('I', 'Investigative'), ('A', 'Artistic'),
        ('S', 'Social'), ('E', 'Enterprising'), ('C', 'Conventional'),
    )
    text = models.CharField(max_length=500, help_text="The assessment question text.")
    riasec_type = models.CharField(max_length=1, choices=RIASEC_CHOICES)
    order = models.IntegerField(default=0, help_text="Sequence order for the quiz.")

    def __str__(self):
        return f"[{self.riasec_type}] {self.text[:50]}"

class AssessmentResult(models.Model):
    """
    Stores the outcome of a user's RIASEC assessment including raw score data.
    """
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    scores = models.JSONField(help_text="Dictionary of RIASEC scores: {'R': 10, ...}")
    top_trait = models.CharField(max_length=50, help_text="Primary trait or blended code (e.g., 'IR').")
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.username} - {self.top_trait} ({self.created_at.date()})"

class LearningResource(models.Model):
    """
    Educational content (videos, docs) linked to specific milestones.
    """
    RESOURCE_TYPES = (
        ('VIDEO', 'Video'), ('DOC', 'Documentation'), ('COURSE', 'Course'),
    )
    milestone = models.ForeignKey(
        'Milestone', on_delete=models.CASCADE, related_name='resources', null=True, blank=True
    )
    title = models.CharField(max_length=255)
    url = models.URLField()
    category = models.CharField(max_length=100)
    resource_type = models.CharField(max_length=20, choices=RESOURCE_TYPES)
    trait_alignment = models.CharField(max_length=1, help_text="RIASEC code this resource aligns with.") 

    def __str__(self):
        return f"{self.milestone.title if self.milestone else 'Unassigned'} - {self.title}"

class CareerPath(models.Model):
    """
    High-level career roadmap associated with a RIASEC personality type.
    """
    trait_type = models.CharField(max_length=2, unique=True, help_text="The code (e.g., 'I') that triggers this path.")
    title = models.CharField(max_length=255)
    description = models.TextField()
    duration = models.CharField(max_length=50) # e.g., "12 Weeks"

    def __str__(self):
        return f"{self.trait_type} - {self.title}"

class Milestone(models.Model):
    """
    A specific learning objective within a CareerPath.
    """
    path = models.ForeignKey(CareerPath, related_name='milestones', on_delete=models.CASCADE)
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']

    def __str__(self):
        return f"{self.path.title} | {self.title}"

class UserProgress(models.Model):
    """
    Tracks a student's submission and mentor feedback for a specific milestone.
    """
    STATUS_CHOICES = [
        ('IN_PROGRESS', 'In Progress'), ('PENDING_REVIEW', 'Pending Review'),
        ('COMPLETED', 'Completed'), ('REJECTED', 'Rejected'),
    ]
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    milestone = models.ForeignKey(Milestone, on_delete=models.CASCADE)
    submission_url = models.URLField(blank=True, null=True)
    submission_notes = models.TextField(blank=True, null=True)
    mentor_feedback = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='IN_PROGRESS')
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'milestone')

class ChatMessage(models.Model):
    """
    Logs history for the AI Mentor chat service.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    role = models.CharField(max_length=10, choices=(('user', 'User'), ('assistant', 'Assistant')))
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']

class Achievement(models.Model):
    """
    Defines badges/awards available in the system.
    """
    title = models.CharField(max_length=100)
    description = models.TextField()
    badge_icon = models.CharField(max_length=50, help_text="Lucide icon identifier.")
    points = models.IntegerField(default=10)
    trait_requirement = models.CharField(max_length=1, blank=True, null=True) 
    created_at = models.DateTimeField(auto_now_add=True)

class UserAchievement(models.Model):
    """
    Intersection table for users and their earned badges.
    """
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='earned_achievements')
    achievement = models.ForeignKey(Achievement, on_delete=models.CASCADE)
    earned_at = models.DateTimeField(auto_now_add=True)
    is_notified = models.BooleanField(default=False)

    class Meta:
        unique_together = ('user', 'achievement')