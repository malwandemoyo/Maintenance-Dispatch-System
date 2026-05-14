from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from core.models import UserRole, ResidentProfile


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.role', read_only=True)
    role_display = serializers.CharField(source='role.get_role_display', read_only=True)
    resident_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'role_display', 'resident_profile']
    
    def get_resident_profile(self, obj):
        """Include resident profile if user is a resident."""
        try:
            if obj.role.role == 'resident' and hasattr(obj, 'resident_profile'):
                return {
                    'phone': obj.resident_profile.phone,
                    'address': obj.resident_profile.address,
                    'unit_number': obj.resident_profile.unit_number,
                }
        except (UserRole.DoesNotExist, ResidentProfile.DoesNotExist):
            pass
        return None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    class Meta:
        model = User
        fields = ['username', 'email', 'first_name', 'last_name', 'password', 'password2']
        extra_kwargs = {
            'email': {'required': True},
            'first_name': {'required': False},
            'last_name': {'required': False},
        }
    
    def validate_username(self, value):
        """Validate username is unique."""
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        """Validate email is unique."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value
    
    def validate(self, attrs):
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError(
                {'password': "Password fields didn't match."}
            )
        return attrs
    
    def create(self, validated_data):
        validated_data.pop('password2')
        user = User.objects.create_user(**validated_data)
        # Create resident profile by default for new users
        UserRole.objects.get_or_create(
            user=user,
            defaults={'role': 'resident'}
        )
        ResidentProfile.objects.get_or_create(user=user)
        return user


class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    new_password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password],
        style={'input_type': 'password'}
    )
    new_password2 = serializers.CharField(
        write_only=True,
        required=True,
        style={'input_type': 'password'}
    )
    
    def validate(self, attrs):
        if attrs['new_password'] != attrs['new_password2']:
            raise serializers.ValidationError(
                {'new_password': "Password fields didn't match."}
            )
        return attrs
    
    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError(
                {'old_password': "Old password is incorrect."}
            )
        return value
    
    def create(self, validated_data):
        user = self.context['request'].user
        user.set_password(validated_data['new_password'])
        user.save()
        return user


class UserProfileUpdateSerializer(serializers.ModelSerializer):
    phone = serializers.CharField(write_only=True, required=False, allow_blank=True)
    address = serializers.CharField(write_only=True, required=False, allow_blank=True)
    unit_number = serializers.CharField(write_only=True, required=False, allow_blank=True)
    
    class Meta:
        model = User
        fields = ['email', 'first_name', 'last_name', 'phone', 'address', 'unit_number']
    
    def update(self, instance, validated_data):
        # Extract resident profile fields
        phone = validated_data.pop('phone', None)
        address = validated_data.pop('address', None)
        unit_number = validated_data.pop('unit_number', None)
        
        # Update user fields
        instance.email = validated_data.get('email', instance.email)
        instance.first_name = validated_data.get('first_name', instance.first_name)
        instance.last_name = validated_data.get('last_name', instance.last_name)
        instance.save()
        
        # Update resident profile if user is a resident
        try:
            if instance.role.role == 'resident':
                profile, created = ResidentProfile.objects.get_or_create(user=instance)
                if phone is not None:
                    profile.phone = phone
                if address is not None:
                    profile.address = address
                if unit_number is not None:
                    profile.unit_number = unit_number
                profile.save()
        except UserRole.DoesNotExist:
            pass
        
        return instance
