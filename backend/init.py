#!/usr/bin/env python
"""
Initialize script for Maintenance Dispatch System.
Runs migrations and sets up test users with roles and sample data.
"""
import os
import sys
import django
from pathlib import Path

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
sys.path.insert(0, str(Path(__file__).parent))
django.setup()

from django.contrib.auth.models import User
from core.models import UserRole, Property, MaintenanceTask


def create_users():
    """Create test users with roles."""
    print("Setting up users...")
    
    # Create Superuser/Admin (no UserRole needed - uses Django's is_superuser)
    admin_user, created = User.objects.get_or_create(
        username='admin',
        defaults={
            'email': 'admin@example.com',
            'first_name': 'Admin',
            'last_name': 'User',
            'is_staff': True,
            'is_superuser': True,
        }
    )
    if created:
        admin_user.set_password('admin123')
        admin_user.save()
        print(f"  ✓ Created admin: {admin_user.username}")
    
    # Create Property Manager
    manager_user, created = User.objects.get_or_create(
        username='manager1',
        defaults={
            'email': 'manager1@example.com',
            'first_name': 'John',
            'last_name': 'Manager',
            'is_staff': False,
        }
    )
    if created:
        manager_user.set_password('manager123')
        manager_user.save()
        print(f"  ✓ Created manager: {manager_user.username}")
    
    UserRole.objects.get_or_create(
        user=manager_user,
        defaults={'role': 'manager'}
    )
    
    # Create Maintenance Staff
    for i in range(1, 3):
        staff_user, created = User.objects.get_or_create(
            username=f'staff{i}',
            defaults={
                'email': f'staff{i}@example.com',
                'first_name': f'Maintenance',
                'last_name': f'Staff {i}',
                'is_staff': False,
            }
        )
        if created:
            staff_user.set_password('staff123')
            staff_user.save()
            print(f"  ✓ Created maintenance staff: {staff_user.username}")
        
        UserRole.objects.get_or_create(
            user=staff_user,
            defaults={'role': 'maintenance_staff'}
        )
    
    # Create Residents
    for i in range(1, 4):
        resident_user, created = User.objects.get_or_create(
            username=f'resident{i}',
            defaults={
                'email': f'resident{i}@example.com',
                'first_name': f'Resident',
                'last_name': f'User {i}',
                'is_staff': False,
            }
        )
        if created:
            resident_user.set_password('resident123')
            resident_user.save()
            print(f"  ✓ Created resident: {resident_user.username}")
        
        UserRole.objects.get_or_create(
            user=resident_user,
            defaults={'role': 'resident'}
        )


def create_sample_properties():
    """Create sample properties."""
    print("\nSetting up properties...")
    
    manager = User.objects.get(username='manager1')
    
    properties_data = [
        {
            'name': 'Downtown Office Building',
            'address': '123 Main St, Downtown',
            'description': 'Modern office building with 10 floors',
        },
        {
            'name': 'Shopping Center',
            'address': '456 Market Ave, Commercial District',
            'description': 'Multi-tenant shopping center',
        },
        {
            'name': 'Residential Complex',
            'address': '789 Elm Road, Suburbs',
            'description': 'Apartment complex with 50 units',
        },
    ]
    
    for prop_data in properties_data:
        prop, created = Property.objects.get_or_create(
            name=prop_data['name'],
            manager=manager,
            defaults={
                'address': prop_data['address'],
                'description': prop_data['description'],
                'status': 'active',
            }
        )
        if created:
            print(f"  ✓ Created property: {prop.name}")


def create_sample_tasks():
    """Create sample maintenance tasks."""
    print("\nSetting up tasks...")
    
    manager = User.objects.get(username='manager1')
    staff1 = User.objects.get(username='staff1')
    staff2 = User.objects.get(username='staff2')
    resident1 = User.objects.get(username='resident1')
    resident2 = User.objects.get(username='resident2')
    properties = Property.objects.filter(manager=manager)
    
    tasks_data = [
        {
            'property': properties.first(),
            'title': 'HVAC System Inspection',
            'description': 'Quarterly inspection of HVAC system on floors 1-5',
            'priority': 'medium',
            'status': 'assigned',
            'assigned_to': staff1,
            'created_by': manager,
        },
        {
            'property': properties.first(),
            'title': 'Elevator Maintenance',
            'description': 'Monthly elevator maintenance and safety check',
            'priority': 'high',
            'status': 'pending',
            'assigned_to': None,
            'created_by': manager,
        },
        {
            'property': properties.get(name='Shopping Center'),
            'title': 'Parking Lot Repair',
            'description': 'Repaint parking lot lines and fix potholes',
            'priority': 'medium',
            'status': 'in_progress',
            'assigned_to': staff2,
            'created_by': manager,
        },
        {
            'property': properties.get(name='Residential Complex'),
            'title': 'Roof Leak Investigation',
            'description': 'Investigate and fix roof leaks in Unit 203',
            'priority': 'urgent',
            'status': 'pending',
            'assigned_to': None,
            'created_by': manager,
        },
        # Resident-created tasks
        {
            'property': properties.get(name='Residential Complex'),
            'title': 'Bathroom Sink Leaking',
            'description': 'Bathroom sink in apartment 102 is leaking',
            'priority': 'medium',
            'status': 'pending',
            'assigned_to': None,
            'created_by': resident1,
        },
        {
            'property': properties.get(name='Residential Complex'),
            'title': 'AC Unit Not Working',
            'description': 'Air conditioning unit in unit 305 is not working',
            'priority': 'high',
            'status': 'pending',
            'assigned_to': None,
            'created_by': resident2,
        },
    ]
    
    for task_data in tasks_data:
        task, created = MaintenanceTask.objects.get_or_create(
            title=task_data['title'],
            property=task_data['property'],
            defaults={
                'description': task_data['description'],
                'priority': task_data['priority'],
                'status': task_data['status'],
                'assigned_to': task_data['assigned_to'],
                'created_by': task_data['created_by'],
            }
        )
        if created:
            print(f"  ✓ Created task: {task.title}")


def main():
    """Run all initialization steps."""
    print("=" * 60)
    print("Maintenance Dispatch System - Initialization")
    print("=" * 60)
    
    try:
        # Run migrations
        print("\nRunning database migrations...")
        from django.core.management import call_command
        call_command('migrate', verbosity=0)
        print("  ✓ Migrations completed")
        
        # Create users
        create_users()
        
        # Create sample data
        create_sample_properties()
        create_sample_tasks()
        
        print("\n" + "=" * 60)
        print("Initialization Complete!")
        print("=" * 60)
        print("\nTest Credentials:")
        print("  Manager:")
        print("    Username: manager1")
        print("    Password: manager123")
        print("\n  Technicians:")
        print("    Username: technician1 / technician2")
        print("    Password: tech123")
        print("\n  Admin:")
        print("    Create via: python manage.py createsuperuser")
        print("\nAPI Access:")
        print("  http://localhost:8000/api/")
        print("  http://localhost:8000/admin/")
        print("=" * 60)
        
    except Exception as e:
        print(f"\nError during initialization: {str(e)}")
        sys.exit(1)


if __name__ == '__main__':
    main()
