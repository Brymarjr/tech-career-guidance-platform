from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        # Include all fields required by the ERD and User Story 4 [cite: 63, 141]
        fields = ('id', 'email', 'username', 'password', 'role', 
                  'full_name', 'bio', 'skills', 'career_interest')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = CustomUser.objects.create_user(**validated_data)
        return user