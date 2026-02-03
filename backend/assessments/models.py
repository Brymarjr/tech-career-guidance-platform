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
