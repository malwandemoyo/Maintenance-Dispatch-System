"""
Views for notifications app.
"""
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.utils import timezone

from notifications.models import NotificationPreference, EmailTemplate, Notification
from notifications.serializers import (
    NotificationPreferenceSerializer, EmailTemplateSerializer, NotificationSerializer
)


class NotificationPreferenceViewSet(viewsets.ViewSet):
    """ViewSet for managing user notification preferences."""
    permission_classes = [IsAuthenticated]
    
    def list(self, request):
        """Get current user's notification preferences."""
        preference, created = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(preference)
        return Response(serializer.data)
    
    def update(self, request, pk=None):
        """Update user's notification preferences."""
        preference, created = NotificationPreference.objects.get_or_create(user=request.user)
        serializer = NotificationPreferenceSerializer(preference, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class EmailTemplateViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet for viewing email templates (admin/staff only)."""
    queryset = EmailTemplate.objects.filter(is_active=True)
    serializer_class = EmailTemplateSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Only show active templates to non-staff."""
        if self.request.user.is_staff:
            return EmailTemplate.objects.all()
        return EmailTemplate.objects.filter(is_active=True)
    
    @action(detail=False, methods=['get'])
    def by_type(self, request):
        """Get template by type."""
        template_type = request.query_params.get('type')
        if not template_type:
            return Response(
                {'error': 'template_type query parameter is required'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        template = EmailTemplate.objects.filter(
            template_type=template_type,
            is_active=True
        ).first()
        
        if not template:
            return Response(
                {'error': f'No active template found for type: {template_type}'},
                status=status.HTTP_404_NOT_FOUND
            )
        
        serializer = self.get_serializer(template)
        return Response(serializer.data)


class NotificationViewSet(viewsets.ModelViewSet):
    """ViewSet for managing in-app notifications."""
    serializer_class = NotificationSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """Return only current user's notifications."""
        return Notification.objects.filter(user=self.request.user)
    
    def perform_create(self, serializer):
        """Set user to current user when creating notification."""
        serializer.save(user=self.request.user)
    
    @action(detail=True, methods=['post'])
    def mark_as_read(self, request, pk=None):
        """Mark a notification as read."""
        notification = self.get_object()
        notification.is_read = True
        notification.read_at = timezone.now()
        notification.save()
        serializer = self.get_serializer(notification)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def mark_all_as_read(self, request):
        """Mark all notifications as read for current user."""
        notifications = self.get_queryset().filter(is_read=False)
        updated_count = notifications.update(
            is_read=True,
            read_at=timezone.now()
        )
        return Response({
            'detail': f'{updated_count} notifications marked as read'
        })
    
    @action(detail=False, methods=['get'])
    def unread_count(self, request):
        """Get count of unread notifications."""
        unread_count = self.get_queryset().filter(is_read=False).count()
        return Response({
            'unread_count': unread_count
        })
    
    @action(detail=False, methods=['delete'])
    def clear_old(self, request):
        """Clear old/read notifications older than 30 days."""
        from datetime import timedelta
        cutoff_date = timezone.now() - timedelta(days=30)
        deleted_count, _ = self.get_queryset().filter(
            is_read=True,
            created_at__lt=cutoff_date
        ).delete()
        return Response({
            'detail': f'{deleted_count} old notifications deleted'
        })
