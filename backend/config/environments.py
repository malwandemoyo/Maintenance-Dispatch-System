"""
Environment-specific configuration and initialization logic.
Determines which data to load based on DJANGO_ENV.
"""
import os
from pathlib import Path

# Current environment
ENVIRONMENT = os.getenv('DJANGO_ENV', 'development').lower()

# Base configurations that work everywhere
BASE_CONFIG = {
    'admin': {
        'username': 'admin',
        'email': 'admin@maintenanceservices.co.zw',
        'password': 'Admin@123',
        'first_name': 'System',
        'last_name': 'Administrator'
    },
}

# Development environment - full test data
DEVELOPMENT_CONFIG = {
    'users': {
        'admin': {
            'username': 'admin',
            'email': 'admin@maintenanceservices.co.zw',
            'password': 'Admin@123',
            'first_name': 'System',
            'last_name': 'Administrator'
        },
        'manager': {
            'username': 'manager1',
            'email': 'manager@maintenanceservices.co.zw',
            'password': 'Manager@123',
            'first_name': 'Tafadzwa',
            'last_name': 'Mutambara'
        },
        'staff': [
            {
                'username': 'staff1',
                'email': 'staff1@maintenanceservices.co.zw',
                'password': 'Staff@123',
                'first_name': 'Tendai',
                'last_name': 'Mupaso',
                'phone': '+263712345678'
            },
            {
                'username': 'staff2',
                'email': 'staff2@maintenanceservices.co.zw',
                'password': 'Staff@123',
                'first_name': 'Blessing',
                'last_name': 'Ncube',
                'phone': '+263712345679'
            },
        ],
        'residents': [
            {
                'username': 'resident1',
                'email': 'resident1@example.com',
                'password': 'Resident@123',
                'first_name': 'Precious',
                'last_name': 'Moyo',
                'phone': '+263787654321',
                'address': 'Apt 101, Century Estate, Harare'
            },
            {
                'username': 'resident2',
                'email': 'resident2@example.com',
                'password': 'Resident@123',
                'first_name': 'Given',
                'last_name': 'Magada',
                'phone': '+263787654322',
                'address': 'Apt 205, Century Estate, Harare'
            },
            {
                'username': 'resident3',
                'email': 'resident3@example.com',
                'password': 'Resident@123',
                'first_name': 'Chiedza',
                'last_name': 'Zvobgo',
                'phone': '+263787654323',
                'address': 'Apt 303, Century Estate, Harare'
            },
        ],
    },
    'properties': [
        {
            'name': 'Century Estate',
            'address': '45 Fifth Street, Harare',
            'description': 'Modern residential complex with 50 units in Harare CBD',
        },
        {
            'name': 'Borrowdale Plaza',
            'address': 'Borrowdale Road, Harare',
            'description': 'Commercial shopping center with 20+ retail outlets',
        },
        {
            'name': 'Avondale Executive Office Park',
            'address': 'Quill Road, Avondale, Harare',
            'description': 'Premium office space with 12 floors, 150+ offices',
        },
    ],
    'tasks': [
        {
            'property_name': 'Century Estate',
            'title': 'Plumbing Inspection - Block A',
            'description': 'Inspect all plumbing lines in Block A units for leaks',
            'priority': 'medium',
            'status': 'assigned',
            'assigned_to': 'staff1',
            'created_by': 'manager1',
        },
        {
            'property_name': 'Century Estate',
            'title': 'Electrical System Upgrade',
            'description': 'Upgrade electrical panels to meet current standards',
            'priority': 'high',
            'status': 'pending',
            'assigned_to': None,
            'created_by': 'manager1',
        },
        {
            'property_name': 'Borrowdale Plaza',
            'title': 'Parking Area Maintenance',
            'description': 'Pothole repair and resurfacing of parking area',
            'priority': 'medium',
            'status': 'in_progress',
            'assigned_to': 'staff2',
            'created_by': 'manager1',
        },
        {
            'property_name': 'Avondale Executive Office Park',
            'title': 'HVAC System Maintenance',
            'description': 'Annual HVAC inspection and filter replacement for all floors',
            'priority': 'urgent',
            'status': 'pending',
            'assigned_to': None,
            'created_by': 'manager1',
        },
        {
            'property_name': 'Century Estate',
            'title': 'AC Unit Not Working',
            'description': 'Air conditioner in my unit (Apt 101) is not cooling properly',
            'priority': 'high',
            'status': 'assigned',
            'assigned_to': 'staff1',
            'created_by': 'resident1',
        },
        {
            'property_name': 'Century Estate',
            'title': 'Leaking Roof in Unit 205',
            'description': 'Water dripping from ceiling during rain in bedroom',
            'priority': 'high',
            'status': 'pending',
            'assigned_to': None,
            'created_by': 'resident2',
        },
    ],
    'create_superuser': True,
}

# Test environment - minimal data for testing
TEST_CONFIG = {
    'users': {
        'admin': {
            'username': 'admin',
            'email': 'admin@test.co.zw',
            'password': 'admin123',
            'first_name': 'Test',
            'last_name': 'Admin'
        },
        'manager': {
            'username': 'manager1',
            'email': 'manager@test.co.zw',
            'password': 'manager123',
            'first_name': 'Test',
            'last_name': 'Manager'
        },
        'staff': [
            {
                'username': 'staff1',
                'email': 'staff@test.co.zw',
                'password': 'staff123',
                'first_name': 'Test',
                'last_name': 'Staff',
                'phone': '+263712345678'
            },
        ],
        'residents': [
            {
                'username': 'resident1',
                'email': 'resident@test.co.zw',
                'password': 'resident123',
                'first_name': 'Test',
                'last_name': 'Resident',
                'phone': '+263787654321',
                'address': 'Apt 1, Test Property'
            },
        ],
    },
    'properties': [
        {
            'name': 'Test Property',
            'address': '123 Test Street',
            'description': 'Test property for automated testing',
        },
    ],
    'tasks': [
        {
            'property_name': 'Test Property',
            'title': 'Test Task',
            'description': 'Test maintenance task',
            'priority': 'medium',
            'status': 'pending',
            'assigned_to': None,
            'created_by': 'manager1',
        },
    ],
    'create_superuser': True,
}

# Production environment - no auto-initialization
PRODUCTION_CONFIG = {
    'users': {
        'admin': BASE_CONFIG['admin'],
    },
    'properties': [],
    'tasks': [],
    'create_superuser': False,  # Manual setup only
}

# Staging environment - like production but with test data
STAGING_CONFIG = {
    'users': DEVELOPMENT_CONFIG['users'],
    'properties': DEVELOPMENT_CONFIG['properties'],
    'tasks': DEVELOPMENT_CONFIG['tasks'],
    'create_superuser': False,  # Manual setup
}

# Configuration selector
CONFIG_MAP = {
    'development': DEVELOPMENT_CONFIG,
    'dev': DEVELOPMENT_CONFIG,
    'test': TEST_CONFIG,
    'testing': TEST_CONFIG,
    'production': PRODUCTION_CONFIG,
    'prod': PRODUCTION_CONFIG,
    'staging': STAGING_CONFIG,
    'stage': STAGING_CONFIG,
}


def get_config():
    """Get configuration for current environment."""
    config = CONFIG_MAP.get(ENVIRONMENT, DEVELOPMENT_CONFIG)
    print(f"[CONFIG] Using {ENVIRONMENT.upper()} configuration")
    return config


def get_users_config():
    """Get users configuration."""
    return get_config().get('users', {})


def get_properties_config():
    """Get properties configuration."""
    return get_config().get('properties', [])


def get_tasks_config():
    """Get tasks configuration."""
    return get_config().get('tasks', [])


def should_create_superuser():
    """Check if superuser should be auto-created."""
    return get_config().get('create_superuser', False)


def get_environment():
    """Get current environment name."""
    return ENVIRONMENT
