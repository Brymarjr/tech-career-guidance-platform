from rest_framework import serializers
from .models import CustomUser

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ('id', 'email', 'username', 'password', 'role', 
                  'full_name', 'bio', 'skills', 'career_interest')
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        # Extract password to ensure it's hashed via create_user
        password = validated_data.pop('password', None)
        user = CustomUser.objects.create_user(**validated_data)
        if password:
            user.set_password(password)
            user.save()
        return user