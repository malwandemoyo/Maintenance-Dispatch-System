from rest_framework import serializers
from django.contrib.auth.models import User
from core.models import UserRole, Property, MaintenanceTask, TaskComment, TaskHistory


class UserSerializer(serializers.ModelSerializer):
    role = serializers.CharField(source='role.get_role_display', read_only=True)
    
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'role']


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
    property_details = PropertySerializer(source='property', read_only=True)
    comments = TaskCommentSerializer(many=True, read_only=True)
    history = TaskHistorySerializer(many=True, read_only=True)
    
    class Meta:
        model = MaintenanceTask
        fields = [
            'id', 'property', 'property_details', 'title', 'description', 'priority', 'status',
            'assigned_to', 'assigned_to_details', 'created_by', 'created_by_details',
            'created_at', 'due_date', 'updated_at', 'completed_at', 'completion_notes',
            'comments', 'history'
        ]
        read_only_fields = ['created_at', 'updated_at', 'completed_at']
