"""
Permission classes for role-based access control.
"""
from rest_framework import permissions
from core.models import UserRole


class IsAdmin(permissions.BasePermission):
    """Allow access only to admin/superuser."""
    message = "Admin access required."
    
    def has_permission(self, request, view):
        return request.user and request.user.is_superuser


class IsManager(permissions.BasePermission):
    """Allow access only to Property Managers."""
    message = "Property Manager access required."
    
    def has_permission(self, request, view):
        try:
            return (request.user and 
                    request.user.is_authenticated and 
                    request.user.role.role == 'manager')
        except UserRole.DoesNotExist:
            return False


class IsMaintenanceStaff(permissions.BasePermission):
    """Allow access only to Maintenance Staff."""
    message = "Maintenance Staff access required."
    
    def has_permission(self, request, view):
        try:
            return (request.user and 
                    request.user.is_authenticated and 
                    request.user.role.role == 'maintenance_staff')
        except UserRole.DoesNotExist:
            return False


class IsResident(permissions.BasePermission):
    """Allow access only to Residents."""
    message = "Resident access required."
    
    def has_permission(self, request, view):
        try:
            return (request.user and 
                    request.user.is_authenticated and 
                    request.user.role.role == 'resident')
        except UserRole.DoesNotExist:
            return False


class IsPropertyManager(permissions.BasePermission):
    """Allow property managers to manage their own properties."""
    message = "You can only manage your own properties."
    
    def has_object_permission(self, request, view, obj):
        return obj.manager == request.user or request.user.is_superuser


class IsTaskOwnerOrAssigned(permissions.BasePermission):
    """Allow access to tasks that user created or is assigned to."""
    message = "You do not have access to this task."
    
    def has_object_permission(self, request, view, obj):
        return (obj.created_by == request.user or 
                obj.assigned_to == request.user or 
                obj.property.manager == request.user or
                request.user.is_superuser)
