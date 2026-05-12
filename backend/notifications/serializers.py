"""
Serializers for notifications app.
"""
from rest_framework import serializers
from notifications.models import NotificationPreference, EmailTemplate, Notification


class NotificationPreferenceSerializer(serializers.ModelSerializer):
    """Serializer for user notification preferences."""
    
    class Meta:
        model = NotificationPreference
        fields = [
            'id', 'user', 'email_on_task_assigned', 'email_on_task_completed',
            'email_on_task_commented', 'email_on_status_update',
            'sms_enabled', 'sms_phone', 'in_app_enabled', 'notification_frequency',
            'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'updated_at']
    
    def validate_sms_phone(self, value):
        """Validate SMS phone number if SMS is enabled."""
        if self.initial_data.get('sms_enabled') and not value:
            raise serializers.ValidationError("Phone number is required when SMS is enabled.")
        return value


class EmailTemplateSerializer(serializers.ModelSerializer):
    """Serializer for email templates."""
    
    class Meta:
        model = EmailTemplate
        fields = [
            'id', 'name', 'template_type', 'subject', 'body',
            'is_active', 'created_at', 'updated_at'
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
    
    def validate_subject(self, value):
        """Validate email subject is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Subject cannot be empty.")
        return value.strip()
    
    def validate_body(self, value):
        """Validate email body is not empty."""
        if not value or not value.strip():
            raise serializers.ValidationError("Body cannot be empty.")
        return value.strip()


class NotificationSerializer(serializers.ModelSerializer):
    """Serializer for in-app notifications."""
    
    class Meta:
        model = Notification
        fields = [
            'id', 'user', 'notification_type', 'title', 'message',
            'related_task_id', 'related_user_id',
            'is_read', 'read_at', 'created_at'
        ]
        read_only_fields = ['id', 'user', 'created_at', 'read_at']
    
    def validate_title(self, value):
        """Validate notification title."""
        if not value or not value.strip():
            raise serializers.ValidationError("Title cannot be empty.")
        if len(value) < 3:
            raise serializers.ValidationError("Title must be at least 3 characters.")
        return value.strip()
    
    def validate_message(self, value):
        """Validate notification message."""
        if not value or not value.strip():
            raise serializers.ValidationError("Message cannot be empty.")
        return value.strip()
