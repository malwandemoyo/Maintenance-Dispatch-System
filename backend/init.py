#!/usr/bin/env python
"""
Initialize script for Maintenance Dispatch System.
Runs migrations and sets up test users with roles and sample data.

Configuration: See /backend/config/environments.py for environment-specific settings.
Automatically loads based on DJANGO_ENV environment variable.
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
from core.models import UserRole, ResidentProfile, Property, MaintenanceTask
from users.models import UserProfile
from config.environments import (
    get_users_config,
    get_properties_config,
    get_tasks_config,
    get_environment,
    should_create_superuser,
)


def _get_or_create_user(config, role=None):
    """
    Generic user creation helper to avoid repetition.
    
    Args:
        config: User configuration dict with username, email, password, etc.
        role: Optional role to assign ('admin')
    
    Returns:
        User instance and created flag
    """
    user, created = User.objects.get_or_create(
        username=config['username'],
        defaults={
            'email': config['email'],
            'first_name': config['first_name'],
            'last_name': config['last_name'],
            'is_staff': role == 'admin',
            'is_superuser': role == 'admin',
        }
    )
    
    if created:
        user.set_password(config['password'])
        user.save()
    
    return user, created


def create_users():
    """Create test users with roles and profiles."""
    print("Setting up users...")
    
    users_config = get_users_config()
    
    # Admin (superuser)
    admin_config = users_config.get('admin', {})
    if admin_config:
        admin_user, created = _get_or_create_user(admin_config, role='admin')
        UserProfile.objects.get_or_create(user=admin_user)
        if created:
            print(f"  ✓ Created admin: {admin_user.username}")
    
    # Property Manager
    mgr_config = users_config.get('manager')
    if mgr_config:
        mgr_user, created = _get_or_create_user(mgr_config)
        mgr_profile = UserProfile.objects.get_or_create(user=mgr_user)[0]
        mgr_profile.phone = mgr_config.get('phone', '')
        mgr_profile.save()
        UserRole.objects.get_or_create(user=mgr_user, defaults={'role': 'manager'})
        if created:
            print(f"  ✓ Created manager: {mgr_user.username}")
    
    # Maintenance Staff
    staff_list = users_config.get('staff', [])
    for staff_config in staff_list:
        user, created = _get_or_create_user(staff_config)
        profile = UserProfile.objects.get_or_create(user=user)[0]
        profile.phone = staff_config.get('phone', '')
        profile.save()
        UserRole.objects.get_or_create(user=user, defaults={'role': 'maintenance_staff'})
        if created:
            print(f"  ✓ Created maintenance staff: {user.username}")
    
    # Residents
    residents_list = users_config.get('residents', [])
    for resident_config in residents_list:
        user, created = _get_or_create_user(resident_config)
        profile = UserProfile.objects.get_or_create(user=user)[0]
        profile.phone = resident_config.get('phone', '')
        profile.save()
        UserRole.objects.get_or_create(user=user, defaults={'role': 'resident'})
        ResidentProfile.objects.get_or_create(
            user=user,
            defaults={
                'phone': resident_config.get('phone', ''),
                'address': resident_config.get('address', ''),
                'unit_number': resident_config.get('unit_number', ''),
            }
        )
        if created:
            print(f"  ✓ Created resident: {user.username}")


def create_sample_properties():
    """Create sample properties."""
    print("Setting up properties...")
    
    properties_config = get_properties_config()
    users_config = get_users_config()
    
    manager_username = users_config.get('manager', {}).get('username')
    if not manager_username:
        print("  ⚠ No manager configured, skipping properties")
        return
    
    manager = User.objects.get(username=manager_username)
    
    for prop_config in properties_config:
        prop, created = Property.objects.get_or_create(
            name=prop_config['name'],
            manager=manager,
            defaults={
                'address': prop_config['address'],
                'description': prop_config['description'],
                'status': 'active',
            }
        )
        if created:
            print(f"  ✓ Created property: {prop.name}")


def create_sample_tasks():
    """Create sample maintenance tasks from configuration."""
    print("Setting up maintenance tasks...")
    
    tasks_config = get_tasks_config()
    users_config = get_users_config()
    
    manager_username = users_config.get('manager', {}).get('username')
    if not manager_username:
        print("  ⚠ No manager configured, skipping tasks")
        return
    
    manager = User.objects.get(username=manager_username)
    staff_lookup = {s['username']: User.objects.get(username=s['username']) 
                    for s in users_config.get('staff', [])}
    resident_lookup = {r['username']: User.objects.get(username=r['username']) 
                       for r in users_config.get('residents', [])}
    property_lookup = {p.name: p for p in Property.objects.all()}
    
    for task_config in tasks_config:
        property_obj = property_lookup.get(task_config['property_name'])
        if not property_obj:
            print(f"  ⚠ Skipped task '{task_config['title']}' - property not found")
            continue
        
        # Resolve assigned_to user
        assigned_to = None
        if task_config.get('assigned_to'):
            assigned_to = staff_lookup.get(task_config['assigned_to'])
        
        # Resolve created_by user
        created_by = staff_lookup.get(task_config['created_by']) or \
                     resident_lookup.get(task_config['created_by']) or manager
        
        task, created = MaintenanceTask.objects.get_or_create(
            title=task_config['title'],
            property=property_obj,
            defaults={
                'description': task_config['description'],
                'priority': task_config['priority'],
                'status': task_config['status'],
                'assigned_to': assigned_to,
                'created_by': created_by,
            }
        )
        if created:
            print(f"  ✓ Created task: {task.title}")


def print_summary():
    """Print initialization summary with test credentials."""
    print("\n" + "=" * 60)
    print("Initialization Complete!")
    print("=" * 60)
    print(f"\nEnvironment: {get_environment().upper()}")
    print("\nTest Credentials:")
    
    users_config = get_users_config()
    
    if users_config.get('admin'):
        print(f"  Admin: {users_config['admin']['username']}")
    
    if users_config.get('manager'):
        print(f"  Manager: {users_config['manager']['username']}")
    
    staff_list = users_config.get('staff', [])
    if staff_list:
        staff_names = ', '.join([s['username'] for s in staff_list])
        print(f"  Maintenance Staff: {staff_names}")
    
    residents_list = users_config.get('residents', [])
    if residents_list:
        resident_names = ', '.join([r['username'] for r in residents_list])
        print(f"  Residents: {resident_names}")
    print("\nAccess:")
    print("  API: http://localhost:8000/api/")
    print("  Admin: http://localhost:8000/admin/")
    print("=" * 60)


def main():
    """Main initialization orchestrator."""
    print("=" * 60)
    print("Maintenance Dispatch System - Initialization")
    print("=" * 60)
    
    try:
        # Run migrations
        print("\nRunning database migrations...")
        from django.core.management import call_command
        call_command('migrate', verbosity=0)
        print("  ✓ Migrations completed")
        
        # Initialize data
        create_users()
        create_sample_properties()
        create_sample_tasks()
        
        print_summary()
        
    except Exception as e:
        print(f"\nError during initialization: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == '__main__':
    main()
