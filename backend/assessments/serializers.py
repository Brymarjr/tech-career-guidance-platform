from rest_framework import serializers
from .models import (
    Question, CareerPath, Milestone, 
    LearningResource, UserProgress, 
    Achievement, UserAchievement
)

# --- ADMIN / MANAGEMENT SERIALIZERS ---

class LearningResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = ['id', 'title', 'url', 'category', 'resource_type', 'trait_alignment']

class MilestoneSerializer(serializers.ModelSerializer):
    resources = LearningResourceSerializer(many=True, read_only=True)
    class Meta:
        model = Milestone
        fields = ['id', 'path', 'title', 'order', 'resources']

class CareerPathSerializer(serializers.ModelSerializer):
    milestones = MilestoneSerializer(many=True, read_only=True)
    class Meta:
        model = CareerPath
        fields = ['id', 'title', 'trait_type', 'duration', 'milestones']

class QuestionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Question
        fields = ['id', 'text', 'riasec_type']

# --- GAMIFICATION SERIALIZERS ---

class AchievementSerializer(serializers.ModelSerializer):
    class Meta:
        model = Achievement
        fields = ['id', 'title', 'description', 'badge_icon', 'points']

class UserAchievementSerializer(serializers.ModelSerializer):
    achievement = AchievementSerializer(read_only=True)
    class Meta:
        model = UserAchievement
        fields = ['achievement', 'earned_at']

# --- STUDENT / DASHBOARD SERIALIZERS ---

class StudentResourceSerializer(serializers.ModelSerializer):
    class Meta:
        model = LearningResource
        fields = ['id', 'title', 'url', 'resource_type']

class StudentMilestoneSerializer(serializers.ModelSerializer):
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
        progress = UserProgress.objects.filter(user=user, milestone=obj).first()
        return progress.status if progress else 'IN_PROGRESS'

    def get_feedback(self, obj):
        user = self.context.get('request').user
        if not user or user.is_anonymous:
            return None
        progress = UserProgress.objects.filter(user=user, milestone=obj).first()
        # FIXED: Use mentor_feedback which is the actual field name in models
        return progress.mentor_feedback if progress else None

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

class DashboardSummarySerializer(serializers.Serializer):
    roadmap = UserRoadmapSerializer(read_only=True)
    achievements = UserAchievementSerializer(many=True, read_only=True, source='earned_achievements')