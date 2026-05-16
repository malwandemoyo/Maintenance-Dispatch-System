"""
User module initialization utilities.
Helper functions to set up users, profiles, and roles.
"""
from django.contrib.auth.models import User
from users.models import UserProfile, UserActivity
from core.models import UserRole, ResidentProfile, StaffProfile


def create_user_with_profile(username, email, first_name, last_name, password, role='resident'):
    """
    Create a user with profile and role assignment.
    
    Args:
        username: User's username
        email: User's email
        first_name: User's first name
        last_name: User's last name
        password: User's password
        role: Role to assign (manager, maintenance_staff, resident)
    
    Returns:
        User instance and created flag
    """
    user, created = User.objects.get_or_create(
        username=username,
        defaults={
            'email': email,
            'first_name': first_name,
            'last_name': last_name,
            'is_staff': False,
        }
    )
    
    if created:
        user.set_password(password)
        user.save()
        
        # Create user profile
        UserProfile.objects.get_or_create(user=user)
        
        # Assign role if not admin
        if role != 'admin':
            UserRole.objects.get_or_create(
                user=user,
                defaults={'role': role}
            )
            
            # Create resident profile if resident
            if role == 'resident':
                ResidentProfile.objects.get_or_create(user=user)
            elif role == 'maintenance_staff':
                # Create a staff profile placeholder for maintenance staff
                StaffProfile.objects.get_or_create(user=user)
        
        return user, created
    
    return user, created


def log_user_activity(user, activity_type, description=None, ip_address=None):
    """
    Log user activity.
    
    Args:
        user: User instance
        activity_type: Type of activity
        description: Optional description
        ip_address: Optional IP address
    """
    UserActivity.objects.create(
        user=user,
        activity_type=activity_type,
        description=description,
        ip_address=ip_address
    )


def get_user_activities(user, activity_type=None, limit=10):
    """
    Get recent user activities.
    
    Args:
        user: User instance
        activity_type: Optional filter by activity type
        limit: Number of activities to return
    
    Returns:
        QuerySet of activities
    """
    activities = UserActivity.objects.filter(user=user)
    
    if activity_type:
        activities = activities.filter(activity_type=activity_type)
    
    return activities[:limit]
