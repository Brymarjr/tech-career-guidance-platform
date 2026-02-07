from rest_framework import serializers
from .models import Question, CareerPath, Milestone, LearningResource, UserProgress

class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = ['id', 'title', 'url', 'category', 'resource_type', 'trait_alignment']

class MilestoneSerializer(serializers.ModelSerializer):
    # This uses the related_name='resources' from your LearningResource model
    resources = LearningResourceSerializer(many=True, read_only=True)

    class Meta:
        model = Milestone
        fields = ['id', 'path', 'title', 'order', 'resources']

class CareerPathSerializer(serializers.ModelSerializer):
    # This nested serializer shows the milestones within the path
    milestones = MilestoneSerializer(many=True, read_only=True)

    class Meta:
        model = CareerPath
        fields = ['id', 'title', 'trait_type', 'duration', 'milestones']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'riasec_type', 'created_at']
        
class StudentResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        # Ensure these match your LearningResource model fields
        fields = ['id', 'title', 'url', 'resource_type']

class StudentMilestoneSerializer(serializers.ModelSerializer):
    # This allows the resources to appear inside the milestone object
    resources = StudentResourceSerializer(many=True, read_only=True)
    status = serializers.SerializerMethodField()
    feedback = serializers.SerializerMethodField()

    class Meta:
        model = Milestone
        fields = ['id', 'title', 'order', 'resources', 'status', 'feedback']

    def get_status(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return 'LOCKED'
        # Check the progress table for this specific user and milestone
        progress = UserProgress.objects.filter(user=user, milestone=obj).first()
        return progress.status if progress else 'IN_PROGRESS'

    def get_feedback(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return None
        progress = UserProgress.objects.filter(user=user, milestone=obj).first()
        return progress.feedback if progress else None

class UserRoadmapSerializer(serializers.ModelSerializer):
    milestones = StudentMilestoneSerializer(many=True, read_only=True)
    completion_percentage = serializers.SerializerMethodField()

    class Meta:
        model = CareerPath
        fields = ['id', 'title', 'trait_type', 'duration', 'milestones', 'completion_percentage']

    def get_completion_percentage(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return 0
        total = obj.milestones.count()
        if total == 0:
            return 0
        completed = UserProgress.objects.filter(
            user=user, 
            milestone__path=obj, 
            status='COMPLETED'
        ).count()
        return (completed / total) * 100