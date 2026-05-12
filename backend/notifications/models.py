"""
Models for notifications app.
"""
from django.db import models
from django.contrib.auth.models import User


class NotificationPreference(models.Model):
    """User's notification preferences."""
    
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Task Assigned'),
        ('task_completed', 'Task Completed'),
        ('task_commented', 'Task Commented'),
        ('status_update', 'Status Update'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='notification_preference')
    
    # Email notifications
    email_on_task_assigned = models.BooleanField(default=True)
    email_on_task_completed = models.BooleanField(default=True)
    email_on_task_commented = models.BooleanField(default=True)
    email_on_status_update = models.BooleanField(default=False)
    
    # SMS notifications (if enabled)
    sms_enabled = models.BooleanField(default=False)
    sms_phone = models.CharField(max_length=20, blank=True, null=True)
    
    # In-app notifications
    in_app_enabled = models.BooleanField(default=True)
    
    # Notification frequency
    FREQUENCY_CHOICES = [
        ('immediate', 'Immediate'),
        ('daily', 'Daily Digest'),
        ('weekly', 'Weekly Digest'),
    ]
    notification_frequency = models.CharField(
        max_length=20,
        choices=FREQUENCY_CHOICES,
        default='immediate'
    )
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        verbose_name = 'Notification Preference'
        verbose_name_plural = 'Notification Preferences'
    
    def __str__(self):
        return f"{self.user.username}'s Notification Preferences"


class EmailTemplate(models.Model):
    """Email templates for different notification types."""
    
    TEMPLATE_TYPES = [
        ('task_assigned', 'Task Assigned'),
        ('task_completed', 'Task Completed'),
        ('task_commented', 'Task Commented'),
        ('password_reset', 'Password Reset'),
        ('welcome', 'Welcome Email'),
    ]
    
    name = models.CharField(max_length=255)
    template_type = models.CharField(max_length=50, choices=TEMPLATE_TYPES)
    subject = models.CharField(max_length=255)
    body = models.TextField()
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        unique_together = ('template_type', 'is_active')
        ordering = ['-updated_at']
        verbose_name = 'Email Template'
        verbose_name_plural = 'Email Templates'
    
    def __str__(self):
        return f"{self.name} ({self.get_template_type_display()})"


class Notification(models.Model):
    """In-app notifications for users."""
    
    NOTIFICATION_TYPES = [
        ('task_assigned', 'Task Assigned'),
        ('task_completed', 'Task Completed'),
        ('task_commented', 'Task Commented'),
        ('status_update', 'Status Update'),
        ('system', 'System Message'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    notification_type = models.CharField(max_length=50, choices=NOTIFICATION_TYPES)
    title = models.CharField(max_length=255)
    message = models.TextField()
    
    # Related object references
    related_task_id = models.IntegerField(null=True, blank=True)
    related_user_id = models.IntegerField(null=True, blank=True)
    
    is_read = models.BooleanField(default=False)
    read_at = models.DateTimeField(null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Notification'
        verbose_name_plural = 'Notifications'
    
    def __str__(self):
        return f"{self.title} - {self.user.username}"
