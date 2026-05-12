"""
Management command to test email system by sending sample emails.
Usage: python manage.py test_emails --recipient your@email.co.zw
"""
from django.core.management.base import BaseCommand, CommandError
from django.contrib.auth.models import User
from core.models import Property, MaintenanceTask
from notifications.service import NotificationService
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Test email system by sending sample notifications'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--recipient',
            type=str,
            help='Email recipient for test emails'
        )
        parser.add_argument(
            '--type',
            type=str,
            choices=['all', 'task_assigned', 'task_completed', 'welcome'],
            default='all',
            help='Type of email to send'
        )
    
    def handle(self, *args, **options):
        recipient = options.get('recipient')
        email_type = options.get('type')
        
        if not recipient and email_type != 'all':
            raise CommandError('--recipient is required for email tests')
        
        try:
            # Get test users/data or create temporary ones
            manager = User.objects.filter(username='manager1').first()
            if not manager:
                self.stdout.write(self.style.WARNING('No manager found. Create test data first with: python init.py'))
                return
            
            staff = User.objects.filter(username='staff1').first()
            if not staff:
                raise CommandError('No staff found')
            
            property_obj = Property.objects.first()
            if not property_obj:
                raise CommandError('No property found')
            
            # Send test emails
            if email_type in ['all', 'task_assigned']:
                self.stdout.write('Sending task assignment email...')
                task = MaintenanceTask.objects.create(
                    property=property_obj,
                    title='[TEST] Plumbing Repair',
                    description='This is a test email notification',
                    priority='high',
                    status='pending',
                    created_by=manager
                )
                NotificationService.notify_task_assigned(task, staff)
                self.stdout.write(self.style.SUCCESS('✓ Task assignment email sent'))
            
            if email_type in ['all', 'task_completed']:
                self.stdout.write('Sending task completion email...')
                task = MaintenanceTask.objects.filter(
                    title__startswith='[TEST]'
                ).first()
                if not task:
                    task = MaintenanceTask.objects.create(
                        property=property_obj,
                        title='[TEST] Electrical Work',
                        description='Test completion email',
                        priority='medium',
                        status='in_progress',
                        assigned_to=staff,
                        created_by=manager
                    )
                NotificationService.notify_task_completed(task, staff)
                self.stdout.write(self.style.SUCCESS('✓ Task completion email sent'))
            
            if email_type in ['all', 'welcome']:
                self.stdout.write('Sending welcome email...')
                NotificationService.welcome_new_user(staff)
                self.stdout.write(self.style.SUCCESS('✓ Welcome email sent'))
            
            self.stdout.write(self.style.SUCCESS('\nAll test emails sent!'))
            self.stdout.write(self.style.WARNING('\nCheck logs/emails.log for email content'))
            
        except Exception as e:
            logger.error(f"Email test failed: {e}", exc_info=True)
            raise CommandError(f'Email test failed: {e}')
