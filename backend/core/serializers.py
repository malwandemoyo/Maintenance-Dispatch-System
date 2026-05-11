from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import UserRole, ResidentProfile, Property, MaintenanceTask, TaskComment, TaskHistory


class ResidentProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = ResidentProfile
        fields = ['phone', 'address', 'unit_number']


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.get_role_display', read_only=True)
    resident_profile = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role', 'resident_profile']
    
    def get_resident_profile(self, obj):
        """Include resident profile if user is a resident."""
        try:
            if obj.role.role == 'resident' and hasattr(obj, 'resident_profile'):
                return ResidentProfileSerializer(obj.resident_profile).data
        except (UserRole.DoesNotExist, ResidentProfile.DoesNotExist):
            pass
        return None


class UserRoleSerializer(serializers.ModelSerializer):
    user_details = UserSerializer(source='user', read_only=True)
    
    class Meta:
        model = UserRole
        fields = ['id', 'user', 'user_details', 'role', 'created_at']


class PropertySerializer(serializers.ModelSerializer):
    manager_details = UserSerializer(source='manager', read_only=True)
    
    class Meta:
        model = Property
        fields = ['id', 'name', 'address', 'manager', 'manager_details', 'description', 'status', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at', 'manager']


class TaskCommentSerializer(serializers.ModelSerializer):
    author_details = UserSerializer(source='author', read_only=True)
    
    class Meta:
        model = TaskComment
        fields = ['id', 'task', 'author', 'author_details', 'content', 'created_at', 'updated_at']
        read_only_fields = ['created_at', 'updated_at']


class TaskHistorySerializer(serializers.ModelSerializer):
    changed_by_details = UserSerializer(source='changed_by', read_only=True)
    
    class Meta:
        model = TaskHistory
        fields = ['id', 'task', 'changed_by', 'changed_by_details', 'change_type', 'old_value', 'new_value', 'description', 'created_at']
        read_only_fields = ['created_at']


class MaintenanceTaskSerializer(serializers.ModelSerializer):
    assigned_to_details = UserSerializer(source='assigned_to', read_only=True)
    created_by_details = UserSerializer(source='created_by', read_only=True)
    creator_address = serializers.SerializerMethodField()
    creator_phone = serializers.SerializerMethodField()
    property_details = PropertySerializer(source='property', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = MaintenanceTask
        fields = [
            'id', 'property', 'property_details', 'title', 'description', 'priority', 'status',
            'assigned_to', 'assigned_to_details', 'created_by', 'created_by_details',
            'creator_address', 'creator_phone',
            'created_at', 'due_date', 'updated_at', 'completed_at', 'completion_notes',
            'comments', 'history'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at']
    
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
