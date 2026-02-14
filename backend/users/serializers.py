from rest_framework import serializers
from .models import CustomUser, Thread, Message, MentorTask

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'password', 'role', 
                  'full_name', 'bio', 'skills', 'career_interest', 'mentor')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Extract password to ensure it's hashed via create_user
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user
    
    
class MentorPublicSerializer(serializers.ModelSerializer):
    rating = serializers.ReadOnlyField(source='average_rating')

    class Meta:
        model = CustomUser
        fields = [
            'id', 'username', 'email', 'full_name', 
            'bio', 'expertise', 'job_title', 'company', 
            'years_of_experience', 'rating'
        ]
        
        
class MessageSerializer(serializers.ModelSerializer):
    sender_username = serializers.ReadOnlyField(source='sender.username')

    class Meta:
        model = Message
        fields = ['id', 'thread', 'sender', 'sender_username', 'content', 'is_read', 'created_at']
        read_only_fields = ['sender', 'thread', 'is_read']


class ThreadSerializer(serializers.ModelSerializer):
    other_user = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()
    unread_count = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField() 
    student_name = serializers.ReadOnlyField(source='student.username') # For UI context
    mentor_name = serializers.ReadOnlyField(source='mentor.username')   # For UI context

    class Meta:
        model = Thread
        fields = [
            'id', 'other_user', 'last_message', 'unread_count', 
            'updated_at', 'is_active', 'student_name', 'mentor_name'
        ]
        
    def get_is_active(self, obj):
        """
        Logic: A thread is active ONLY if the student's mentor field 
        is still set to the mentor in this thread.
        """
        return obj.student.mentor_id == obj.mentor_id

    def get_unread_count(self, obj):
        request_user = self.context['request'].user
        return obj.messages.filter(is_read=False).exclude(sender=request_user).count()

    def get_other_user(self, obj):
        request_user = self.context['request'].user
        other = obj.mentor if obj.student == request_user else obj.student
        
        from django.utils import timezone
        import datetime
        from .models import CustomUser

        latest_data = CustomUser.objects.filter(id=other.id).values('last_activity').first()
        actual_last_activity = latest_data['last_activity'] if latest_data else None

        is_online = False
        if actual_last_activity:
            is_online = timezone.now() < actual_last_activity + datetime.timedelta(minutes=2)

        return {
            "id": str(other.id),
            "username": other.username,
            "full_name": other.full_name,
            "role": other.role,
            "is_online": is_online,
            "last_seen": actual_last_activity
        }

    def get_last_message(self, obj):
        last_msg = obj.messages.last()
        if last_msg:
            return {
                "content": last_msg.content[:50],
                "created_at": last_msg.created_at,
                "is_read": last_msg.is_read,
                "sender_id": str(last_msg.sender.id)
            }
        return None
    
    
class MentorTaskSerializer(serializers.ModelSerializer):
    student_username = serializers.ReadOnlyField(source='student.username')
    mentor_username = serializers.ReadOnlyField(source='mentor.username')

    class Meta:
        model = MentorTask
        fields = [
            'id', 'mentor', 'student', 'student_username', 'mentor_username', 
            'title', 'description', 'due_date', 'status', 'xp_reward', 
            'mentor_feedback', 'created_at'
        ]
        read_only_fields = ['mentor', 'status', 'created_at']