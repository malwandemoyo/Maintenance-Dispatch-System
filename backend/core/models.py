from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator

class UserRole(models.Model):
    """Extended user profile for role management."""
    ROLE_CHOICES = [
        ('manager', 'Property Manager'),
        ('maintenance_staff', 'Maintenance Staff'),
        ('resident', 'Resident'),
    ]
    
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='role')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.user.username} - {self.get_role_display()}"
    
    class Meta:
        verbose_name = 'User Role'
        verbose_name_plural = 'User Roles'


class ResidentProfile(models.Model):
    """Resident contact and address information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='resident_profile')
    phone = models.CharField(max_length=20, blank=True, null=True)
    address = models.CharField(max_length=500, blank=True, null=True)
    unit_number = models.CharField(max_length=50, blank=True, null=True)
    # Optional binding to a Property (resident's assigned location)
    property = models.ForeignKey('Property', on_delete=models.SET_NULL, null=True, blank=True, related_name='residents')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.first_name or self.user.username}'s Profile"
    
    class Meta:
        verbose_name = 'Resident Profile'
        verbose_name_plural = 'Resident Profiles'


class Property(models.Model):
    """Represents a property managed by a Property Manager."""
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
    ]
    
    name = models.CharField(max_length=255)
    address = models.CharField(max_length=500)
    manager = models.ForeignKey(User, on_delete=models.CASCADE, related_name='properties',
                               limit_choices_to={'role__role': 'manager'})
    description = models.TextField(blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='active')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Property'
        verbose_name_plural = 'Properties'
    
    def __str__(self):
        return self.name


class StaffProfile(models.Model):
    """Profile for maintenance staff members containing role/title information."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='staff_profile',
                                limit_choices_to={'role__role': 'maintenance_staff'})
    property = models.ForeignKey('Property', on_delete=models.SET_NULL, null=True, blank=True, related_name='staff_members')
    role_title = models.CharField(max_length=100, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = 'Staff Profile'
        verbose_name_plural = 'Staff Profiles'

    def __str__(self):
        return f"{self.user.first_name or self.user.username} - {self.role_title or 'Staff'}"


class ResidentReport(models.Model):
    """Fault report submitted by a resident for manager review and action."""
    STATUS_CHOICES = [
        ('new', 'New'),
        ('acknowledged', 'Acknowledged'),
        ('in_progress', 'In Progress'),
        ('resolved', 'Resolved'),
        ('closed', 'Closed'),
    ]

    title = models.CharField(max_length=255)
    description = models.TextField()
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='reports')
    reported_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='resident_reports')
    location = models.CharField(max_length=255, blank=True, null=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='new')
    manager_notes = models.TextField(blank=True, null=True)
    photo = models.ImageField(upload_to='report_photos/', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    resolved_at = models.DateTimeField(null=True, blank=True)
    closed_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Resident Report'
        verbose_name_plural = 'Resident Reports'

    def __str__(self):
        return f"{self.title} - {self.property.name}"


class MaintenanceTask(models.Model):
    """Represents a maintenance task that needs to be completed."""
    PRIORITY_CHOICES = [
        ('low', 'Low'),
        ('medium', 'Medium'),
        ('high', 'High'),
        ('urgent', 'Urgent'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('assigned', 'Assigned'),
        ('in_progress', 'In Progress'),
        ('completed', 'Completed'),
        ('cancelled', 'Cancelled'),
    ]
    
    property = models.ForeignKey(Property, on_delete=models.CASCADE, related_name='tasks')
    report = models.ForeignKey(ResidentReport, on_delete=models.SET_NULL, null=True, blank=True, related_name='tasks')
    title = models.CharField(max_length=255)
    description = models.TextField()
    priority = models.CharField(max_length=20, choices=PRIORITY_CHOICES, default='medium')
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    # Maintenance Staff who is assigned to this task
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name='assigned_tasks',
                                   limit_choices_to={'role__role': 'maintenance_staff'})
    # Resident or Manager who created this task
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name='created_tasks')
    created_at = models.DateTimeField(auto_now_add=True)
    due_date = models.DateField(null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    completion_notes = models.TextField(blank=True, null=True)
    # Optional photo upload for a task report
    photo = models.ImageField(upload_to='task_photos/', null=True, blank=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Maintenance Task'
        verbose_name_plural = 'Maintenance Tasks'
    
    def __str__(self):
        return f"{self.title} - {self.property.name}"


class TaskComment(models.Model):
    """Comments on maintenance tasks for communication between manager and maintenance staff."""
    task = models.ForeignKey(MaintenanceTask, on_delete=models.CASCADE, related_name='comments')
    author = models.ForeignKey(User, on_delete=models.CASCADE, related_name='task_comments')
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['created_at']
        verbose_name = 'Task Comment'
        verbose_name_plural = 'Task Comments'
    
    def __str__(self):
        return f"Comment by {self.author.username} on {self.task.title}"


class TaskHistory(models.Model):
    """Audit trail for task status changes."""
    CHANGE_TYPE_CHOICES = [
        ('status', 'Status Change'),
        ('assigned', 'Assignment'),
        ('priority', 'Priority Change'),
        ('comment', 'Comment Added'),
    ]
    
    task = models.ForeignKey(MaintenanceTask, on_delete=models.CASCADE, related_name='history')
    changed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    change_type = models.CharField(max_length=20, choices=CHANGE_TYPE_CHOICES)
    old_value = models.CharField(max_length=500, blank=True, null=True)
    new_value = models.CharField(max_length=500, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Task History'
        verbose_name_plural = 'Task History'
    
    def __str__(self):
        return f"{self.task.title} - {self.change_type}"
