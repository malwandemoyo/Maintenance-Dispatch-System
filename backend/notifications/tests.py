"""
Tests for email and notification system.
"""
from django.test import TestCase
from django.test.utils import override_settings
from django.contrib.auth.models import User
from django.core import mail
from core.models import UserRole, Property, MaintenanceTask
from users.models import UserProfile
from notifications.service import NotificationService
from notifications.templates import (
    TaskAssignedTemplate,
    TaskCompletedTemplate,
    WelcomeTemplate,
)


@override_settings(EMAIL_BACKEND='django.core.mail.backends.locmem.EmailBackend')
class EmailNotificationTestCase(TestCase):
    """Test email notifications are sent correctly."""
    
    def setUp(self):
        """Set up test users and data."""
        # Create manager
        self.manager = User.objects.create_user(
            username='manager1',
            email='manager@test.co.zw',
            first_name='Manager',
            password='test123'
        )
        UserRole.objects.create(user=self.manager, role='manager')
        UserProfile.objects.create(
            user=self.manager,
            email_on_task_assigned=True,
            email_on_task_completed=True
        )
        
        # Create maintenance staff
        self.staff = User.objects.create_user(
            username='staff1',
            email='staff@test.co.zw',
            first_name='Staff',
            password='test123'
        )
        UserRole.objects.create(user=self.staff, role='maintenance_staff')
        UserProfile.objects.create(
            user=self.staff,
            email_on_task_assigned=True,
            email_on_task_completed=True
        )
        
        # Create resident
        self.resident = User.objects.create_user(
            username='resident1',
            email='resident@test.co.zw',
            first_name='Resident',
            password='test123'
        )
        UserRole.objects.create(user=self.resident, role='resident')
        UserProfile.objects.create(user=self.resident)
        
        # Create property
        self.property = Property.objects.create(
            name='Test Property',
            address='123 Test St',
            manager=self.manager,
            status='active'
        )
    
    def test_task_assigned_notification(self):
        """Test task assignment email is sent."""
        task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test description',
            priority='medium',
            status='pending',
            created_by=self.manager
        )
        
        NotificationService.notify_task_assigned(task, self.staff)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertIn('Test Task', email.subject)
        self.assertIn(self.staff.email, email.to)
        self.assertIn('New Task Assigned', email.body)
    
    def test_task_completed_notification(self):
        """Test task completion email is sent."""
        task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test description',
            priority='medium',
            status='in_progress',
            assigned_to=self.staff,
            created_by=self.manager
        )
        
        NotificationService.notify_task_completed(task, self.staff)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertIn('Completed', email.subject)
        self.assertIn(self.manager.email, email.to)
    
    def test_welcome_email_sent(self):
        """Test welcome email is sent to new user."""
        new_user = User.objects.create_user(
            username='newuser',
            email='newuser@test.co.zw',
            first_name='New',
            password='test123'
        )
        
        NotificationService.welcome_new_user(new_user)

        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertIn('Welcome', email.subject)
        self.assertIn(new_user.email, email.to)
    
    def test_disabled_notifications(self):
        """Test notifications respect user preference."""
        self.staff.userprofile.email_on_task_assigned = False
        self.staff.userprofile.save()
        
        task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test description',
            priority='medium',
            status='pending',
            created_by=self.manager
        )
        
        result = NotificationService.notify_task_assigned(task, self.staff)

        self.assertFalse(result)
        self.assertEqual(len(mail.outbox), 0)
    
    def test_email_contains_required_fields(self):
        """Test email contains all required information."""
        task = MaintenanceTask.objects.create(
            property=self.property,
            title='Plumbing Repair',
            description='Fix leaking tap in bathroom',
            priority='high',
            status='pending',
            created_by=self.manager
        )
        
        NotificationService.notify_task_assigned(task, self.staff)

        email = mail.outbox[0]
        self.assertIn('Plumbing Repair', email.body)
        self.assertIn('high', email.body.lower())
        self.assertIn('Test Property', email.body)
    
    def test_multiple_notifications_queued(self):
        """Test multiple notifications can be sent."""
        task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test description',
            priority='medium',
            status='pending',
            created_by=self.manager
        )
        
        NotificationService.notify_task_assigned(task, self.staff)
        NotificationService.welcome_new_user(self.resident)

        self.assertEqual(len(mail.outbox), 2)
    
    def test_html_email_alternative(self):
        """Test HTML alternative is included in emails."""
        task = MaintenanceTask.objects.create(
            property=self.property,
            title='Test Task',
            description='Test description',
            priority='medium',
            status='pending',
            created_by=self.manager
        )
        
        NotificationService.notify_task_assigned(task, self.staff)
        
        email = mail.outbox[0]
        # Check for HTML alternative
        self.assertTrue(any(
            'text/html' in alt[1]
            for alt in email.alternatives
        ))
