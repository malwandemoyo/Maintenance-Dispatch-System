"""
Initialization configuration for Maintenance Dispatch System.
Centralized configuration for test users, properties, and sample tasks.
"""

# Test Users Configuration
USERS_CONFIG = {
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
}

# Properties Configuration
PROPERTIES_CONFIG = [
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
]

# Sample Tasks Configuration
TASKS_CONFIG = [
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
]
