"""
Serializers for core app models with validation and consistent formatting.
"""
from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import UserRole, ResidentProfile, Property, MaintenanceTask, TaskComment, TaskHistory


class ResidentProfileSerializer(serializers.ModelSerializer):
    """Serializer for resident profile information."""
    property = serializers.PrimaryKeyRelatedField(source='property', read_only=True)
    property_details = serializers.SerializerMethodField()

    class Meta:
        model = ResidentProfile
        fields = ['phone', 'address', 'unit_number', 'property', 'property_details']
    
    def validate_phone(self, value):
        """Validate phone number format."""
        if value and len(value) < 7:
            raise serializers.ValidationError("Phone number must be at least 7 digits.")
        return value

    def get_property_details(self, obj):
        if obj.property:
            return {
                'id': obj.property.id,
                'name': obj.property.name,
                'address': obj.property.address,
            }
        return None


class UserSerializer(serializers.ModelSerializer):
    """Serializer for User model with role information."""
    role = serializers.CharField(source='role.get_role_display', read_only=True)
    resident_profile = serializers.SerializerMethodField()
    staff_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'resident_profile', 'staff_profile']
        read_only_fields = ['id', 'role']
    
    def get_resident_profile(self, obj):
        """Include resident profile if user is a resident."""
        try:
            if obj.role.role == 'resident' and hasattr(obj, 'resident_profile'):
                return ResidentProfileSerializer(obj.resident_profile).data
        except (UserRole.DoesNotExist, ResidentProfile.DoesNotExist):
            pass
        return None

    def get_staff_profile(self, obj):
        """Include staff profile information (role title) for maintenance staff."""
        try:
            if obj.role.role == 'maintenance_staff' and hasattr(obj, 'staff_profile'):
                return {
                    'role_title': obj.staff_profile.role_title,
                    'phone': obj.staff_profile.phone,
                }
        except UserRole.DoesNotExist:
            pass
        return None
    
    def validate_username(self, value):
        """Ensure username is unique."""
        if self.instance is None and User.objects.filter(username=value).exists():
            raise serializers.ValidationError("Username already exists.")
        return value
    
    def validate_email(self, value):
        """Ensure email is unique and valid."""
        if self.instance is None and User.objects.filter(email=value).exists():
            raise serializers.ValidationError("Email already exists.")
        return value


class UserRoleSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'user_details', 'role', 'created_at']


class PropertySerializer(serializers.ModelSerializer):
    """Serializer for Property model with manager details."""
    manager_details = UserSerializer(source='manager', read_only=True)
    
    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'manager', 'manager_details', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'manager']
    
    def validate_name(self, value):
        """Validate property name is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Property name cannot be empty.")
        return value.strip()
    
    def validate_address(self, value):
        """Validate address is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Address cannot be empty.")
        return value.strip()


class TaskCommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_details', 'content', 'created_at', 'updated_at']
        read_only_fields = ['author', 'created_at', 'updated_at']


class TaskHistorySerializer(serializers.ModelSerializer):
    changed_by_details = UserSerializer(source='changed_by', read_only=True)
    
    class Meta:
        model = TaskHistory
        fields = ['id', 'task', 'changed_by', 'changed_by_details', 'change_type', 'old_value', 'new_value', 'description', 'created_at']
        read_only_fields = ['created_at']


class MaintenanceTaskSerializer(serializers.ModelSerializer):
    """Serializer for MaintenanceTask with nested relationships."""
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    creator_address = serializers.SerializerMethodField()
    creator_phone = serializers.SerializerMethodField()
    property_details = PropertySerializer(source='property', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    creator_property = serializers.SerializerMethodField()
    
    class Meta:
        model = MaintenanceTask
        fields = [
            'id', 'property', 'property_details', 'title', 'description', 'priority', 'status',
            'assigned_to', 'assigned_to_details', 'created_by', 'created_by_details',
            'creator_address', 'creator_phone',
            'creator_property',
            'photo',
            'created_at', 'due_date', 'updated_at', 'completed_at', 'completion_notes',
            'comments', 'history'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at', 'created_by']
    
    def validate_title(self, value):
        """Validate task title."""
        if not value or not value.strip():
            raise serializers.ValidationError("Task title cannot be empty.")
        if len(value) < 3:
            raise serializers.ValidationError("Task title must be at least 3 characters.")
        return value.strip()
    
    def validate_description(self, value):
        """Validate task description."""
        if not value or not value.strip():
            raise serializers.ValidationError("Task description cannot be empty.")
        if len(value) < 10:
            raise serializers.ValidationError("Task description must be at least 10 characters.")
        return value.strip()
    
    def validate_priority(self, value):
        """Validate priority field."""
        valid_priorities = ['low', 'medium', 'high', 'urgent']
        if value not in valid_priorities:
            raise serializers.ValidationError(f"Priority must be one of: {', '.join(valid_priorities)}")
        return value
    
    def get_creator_address(self, obj):
        """Get address from creator's resident profile if available."""
        if obj.created_by and hasattr(obj.created_by, 'resident_profile'):
            try:
                return obj.created_by.resident_profile.address
            except ResidentProfile.DoesNotExist:
                pass
        return None
    
    def get_creator_phone(self, obj):
        """Get phone from creator's resident profile if available."""
        if obj.created_by and hasattr(obj.created_by, 'resident_profile'):
            try:
                return obj.created_by.resident_profile.phone
            except ResidentProfile.DoesNotExist:
                pass
        return None

    def get_creator_property(self, obj):
        """Return the creator's assigned property/location if available."""
        if obj.created_by and hasattr(obj.created_by, 'resident_profile'):
            try:
                prop = obj.created_by.resident_profile.property
                if prop:
                    return {
                        'id': prop.id,
                        'name': prop.name,
                        'address': prop.address,
                    }
            except ResidentProfile.DoesNotExist:
                pass
        return None
