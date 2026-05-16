from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from django.contrib.auth.models import User
from core.models import UserRole, ResidentProfile, Property, MaintenanceTask, TaskComment, TaskHistory, ResidentReport
from core.models import StaffProfile


# Unregister default User admin
admin.site.unregister(User)

@admin.register(User)
class CustomUserAdmin(BaseUserAdmin):
    """Customized User admin with full details."""
    list_display = ['username', 'email', 'first_name', 'last_name', 'is_staff', 'is_active', 'get_role']
    list_filter = ['is_staff', 'is_active', 'role__role', 'date_joined']
    search_fields = ['username', 'email', 'first_name', 'last_name']
    ordering = ['-date_joined']
    
    fieldsets = (
        ('Username & Password', {
            'fields': ('username', 'password')
        }),
        ('Personal Info', {
            'fields': ('first_name', 'last_name', 'email')
        }),
        ('Permissions', {
            'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')
        }),
        ('Important Dates', {
            'fields': ('last_login', 'date_joined'),
            'classes': ('collapse',)
        }),
    )
    
    def get_role(self, obj):
        """Display user role from UserRole model."""
        try:
            return obj.role.role
        except UserRole.DoesNotExist:
            return 'NO ROLE'
    get_role.short_description = 'Role'

@admin.register(ResidentReport)
class ResidentReportAdmin(admin.ModelAdmin):
    list_display = ['id', 'title', 'property', 'reported_by', 'status', 'created_at']
    list_filter = ['status', 'created_at', 'property']
    search_fields = ['title', 'description', 'reported_by__username', 'property__name']
    readonly_fields = ['created_at', 'updated_at', 'resolved_at', 'closed_at']
    fieldsets = (
        ('Report Details', {
            'fields': ('title', 'description', 'property', 'location', 'photo')
        }),
        ('Reporting', {
            'fields': ('reported_by', 'status', 'manager_notes')
        }),
        ('Timestamps', {
            'fields': ('created_at', 'updated_at', 'resolved_at', 'closed_at'),
            'classes': ('collapse',)
        }),
    )

@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'user__email']


@admin.register(ResidentProfile)
class ResidentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'address', 'unit_number', 'property']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'address', 'phone', 'property__name']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'role_title', 'phone', 'created_at']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'role_title']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Property)
class PropertyAdmin(admin.ModelAdmin):
    list_display = ['name', 'manager', 'status', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['name', 'address']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(MaintenanceTask)
class MaintenanceTaskAdmin(admin.ModelAdmin):
    list_display = ['title', 'property', 'priority', 'status', 'assigned_to', 'created_at']
    list_filter = ['status', 'priority', 'created_at']
    search_fields = ['title', 'description', 'property__name']
    readonly_fields = ['created_at', 'updated_at', 'completed_at']
    fieldsets = (
        ('Task Info', {
            'fields': ('property', 'title', 'description', 'priority', 'due_date', 'photo')
        }),
        ('Status', {
            'fields': ('status', 'assigned_to', 'completion_notes', 'completed_at')
        }),
        ('Audit', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(TaskComment)
class TaskCommentAdmin(admin.ModelAdmin):
    list_display = ['task', 'author', 'created_at']
    list_filter = ['created_at']
    search_fields = ['task__title', 'author__username', 'content']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(TaskHistory)
class TaskHistoryAdmin(admin.ModelAdmin):
    list_display = ['task', 'changed_by', 'change_type', 'created_at']
    list_filter = ['change_type', 'created_at']
    search_fields = ['task__title', 'changed_by__username']
    readonly_fields = ['created_at']
