"""
Notification service - handles sending emails and in-app notifications.
"""
from django.core.mail import send_mass_mail
from django.db import transaction
from .templates import (
    TaskAssignedTemplate,
    TaskCompletedTemplate,
    TaskCommentTemplate,
    WelcomeTemplate,
)
import logging

logger = logging.getLogger(__name__)


class NotificationService:
    """Central service for sending notifications."""
    
    @staticmethod
    def notify_task_assigned(task, assigned_to):
        """Send notification when task is assigned."""
        try:
            user_profile = assigned_to.userprofile
            
            if not user_profile.email_on_task_assigned:
                logger.info(f"Task assignment notifications disabled for {assigned_to.username}")
                return False
            
            TaskAssignedTemplate.send(
                recipient=assigned_to.email,
                staff_name=assigned_to.first_name or assigned_to.username,
                task_title=task.title,
                task_priority=task.get_priority_display(),
                property_name=task.property.name,
                task_description=task.description[:200],
                task_status=task.get_status_display(),
                task_id=task.id,
                created_at=task.created_at.strftime("%Y-%m-%d %H:%M"),
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send task assignment notification: {e}")
            return False
    
    @staticmethod
    def notify_task_completed(task, completed_by):
        """Send notification when task is completed."""
        try:
            # Notify the task creator (usually manager or resident)
            if task.created_by and task.created_by.email:
                if hasattr(task.created_by, 'userprofile') and not task.created_by.userprofile.email_on_task_completed:
                    logger.info(f"Task completion notifications disabled for {task.created_by.username}")
                else:
                    TaskCompletedTemplate.send(
                        recipient=task.created_by.email,
                        recipient_name=task.created_by.first_name or task.created_by.username,
                        task_title=task.title,
                        property_name=task.property.name,
                        completed_by=completed_by.first_name or completed_by.username,
                        task_id=task.id,
                        completed_at=task.updated_at.strftime("%Y-%m-%d %H:%M"),
                    )
            
            return True
        except Exception as e:
            logger.error(f"Failed to send task completion notification: {e}")
            return False
    
    @staticmethod
    def notify_task_comment(comment, task):
        """Send notification about new task comment."""
        try:
            # Notify staff if resident commented
            if task.assigned_to and task.assigned_to.email:
                TaskCommentTemplate.send(
                    recipient=task.assigned_to.email,
                    recipient_name=task.assigned_to.first_name or task.assigned_to.username,
                    task_title=task.title,
                    comment_by=comment.created_by.first_name or comment.created_by.username,
                    comment_text=comment.content[:200],
                    task_id=task.id,
                )
            
            # Notify creator if staff commented
            if task.created_by and task.created_by.email and task.created_by != comment.created_by:
                TaskCommentTemplate.send(
                    recipient=task.created_by.email,
                    recipient_name=task.created_by.first_name or task.created_by.username,
                    task_title=task.title,
                    comment_by=comment.created_by.first_name or comment.created_by.username,
                    comment_text=comment.content[:200],
                    task_id=task.id,
                )
            
            return True
        except Exception as e:
            logger.error(f"Failed to send comment notification: {e}")
            return False
    
    @staticmethod
    def welcome_new_user(user):
        """Send welcome email to new user."""
        try:
            WelcomeTemplate.send(
                recipient=user.email,
                user_name=user.first_name or user.username,
            )
            return True
        except Exception as e:
            logger.error(f"Failed to send welcome email to {user.email}: {e}")
            return False
