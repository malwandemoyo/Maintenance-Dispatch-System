"""
Email template management and notification service.
"""
from django.template.loader import render_to_string
from django.core.mail import send_mail, EmailMultiAlternatives
from django.conf import settings
import logging

logger = logging.getLogger(__name__)


class EmailTemplate:
    """Base class for email templates."""
    
    subject_template = ""
    text_template = ""
    html_template = ""
    
    @classmethod
    def get_context(cls, **kwargs):
        """Override to build template context."""
        return {
            'site_name': 'Maintenance Dispatch System',
            'site_url': 'http://localhost:8000',
            **kwargs
        }
    
    @classmethod
    def send(cls, recipient, **context):
        """Send email using template."""
        ctx = cls.get_context(**context)
        
        subject = cls.subject_template.format(**ctx)
        text_content = cls.text_template.format(**ctx)
        html_content = cls.html_template.format(**ctx) if cls.html_template else None
        
        msg = EmailMultiAlternatives(
            subject=subject,
            body=text_content,
            from_email=settings.DEFAULT_FROM_EMAIL,
            to=[recipient]
        )
        
        if html_content:
            msg.attach_alternative(html_content, "text/html")
        
        msg.send(fail_silently=False)
        logger.info(f"Sent {cls.__name__} to {recipient}")


class TaskAssignedTemplate(EmailTemplate):
    """Notification when task is assigned to maintenance staff."""
    
    subject_template = "[{site_name}] New Task Assigned: {task_title}"
    text_template = """
New Task Assigned

Hello {staff_name},

A new maintenance task has been assigned to you:

Task: {task_title}
Priority: {task_priority}
Property: {property_name}
Description: {task_description}

Status: {task_status}
Created on: {created_at}

Please log in to {site_url} to view full details and update the task status.

Best regards,
{site_name}
"""
    
    html_template = """
<html>
<body>
<h2>New Task Assignment</h2>
<p>Hello {staff_name},</p>
<p>A new maintenance task has been assigned to you:</p>
<table style="border-collapse: collapse;">
    <tr><td style="padding: 5px;"><strong>Task:</strong></td><td style="padding: 5px;">{task_title}</td></tr>
    <tr><td style="padding: 5px;"><strong>Priority:</strong></td><td style="padding: 5px;"><strong>{task_priority}</strong></td></tr>
    <tr><td style="padding: 5px;"><strong>Property:</strong></td><td style="padding: 5px;">{property_name}</td></tr>
    <tr><td style="padding: 5px;"><strong>Description:</strong></td><td style="padding: 5px;">{task_description}</td></tr>
</table>
<p><a href="{site_url}/tasks/{task_id}">View Task</a></p>
<p>Best regards,<br/>{site_name}</p>
</body>
</html>
"""


class TaskCompletedTemplate(EmailTemplate):
    """Notification when task is marked complete."""
    
    subject_template = "[{site_name}] Task Completed: {task_title}"
    text_template = """
Hello {recipient_name},

The following maintenance task has been completed:

Task: {task_title}
Property: {property_name}
Completed by: {completed_by}
Completed on: {completed_at}

For more details, visit: {site_url}

Best regards,
{site_name}
"""
    
    html_template = """
<html>
<body>
<h2>Task Completed</h2>
<p>Hello {recipient_name},</p>
<p>The following maintenance task has been completed:</p>
<table style="border-collapse: collapse;">
    <tr><td style="padding: 5px;"><strong>Task:</strong></td><td style="padding: 5px;">{task_title}</td></tr>
    <tr><td style="padding: 5px;"><strong>Property:</strong></td><td style="padding: 5px;">{property_name}</td></tr>
    <tr><td style="padding: 5px;"><strong>Completed by:</strong></td><td style="padding: 5px;">{completed_by}</td></tr>
</table>
<p><a href="{site_url}/tasks/{task_id}">View Details</a></p>
<p>Best regards,<br/>{site_name}</p>
</body>
</html>
"""


class TaskCommentTemplate(EmailTemplate):
    """Notification for new comments on task."""
    
    subject_template = "[{site_name}] New Comment on Task: {task_title}"
    text_template = """
Hello {recipient_name},

A new comment has been added to the task:

Task: {task_title}
Comment by: {comment_by}
Comment: {comment_text}

View the full discussion: {site_url}/tasks/{task_id}

Best regards,
{site_name}
"""
    
    html_template = """
<html>
<body>
<h2>New Comment on Task</h2>
<p>Hello {recipient_name},</p>
<p>A new comment has been added:</p>
<blockquote style="border-left: 4px solid #ccc; padding-left: 10px; margin: 10px 0;">
    <p><strong>{comment_by}:</strong></p>
    <p>{comment_text}</p>
</blockquote>
<p><a href="{site_url}/tasks/{task_id}">View Discussion</a></p>
<p>Best regards,<br/>{site_name}</p>
</body>
</html>
"""


class WelcomeTemplate(EmailTemplate):
    """Welcome email for new users."""
    
    subject_template = "Welcome to {site_name}"
    text_template = """
Hello {user_name},

Welcome to {site_name}!

Your account has been created. You can now log in using your credentials.

Login: {site_url}/login
API: {site_url}/api/

If you have any questions, please contact support.

Best regards,
{site_name}
"""
    
    html_template = """
<html>
<body>
<h2>Welcome to {site_name}</h2>
<p>Hello {user_name},</p>
<p>Your account has been successfully created!</p>
<p>You can now access the system:</p>
<ul>
    <li><a href="{site_url}/login">Login to Dashboard</a></li>
    <li><a href="{site_url}/api/">API Documentation</a></li>
</ul>
<p>Best regards,<br/>{site_name}</p>
</body>
</html>
"""
