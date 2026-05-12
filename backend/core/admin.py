from django.contrib import admin
from core.models import UserRole, ResidentProfile, Property, MaintenanceTask, TaskComment, TaskHistory


@admin.register(UserRole)
class UserRoleAdmin(admin.ModelAdmin):
    list_display = ['user', 'role', 'created_at']
    list_filter = ['role', 'created_at']
    search_fields = ['user__username', 'user__email']


@admin.register(ResidentProfile)
class ResidentProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'address', 'unit_number']
    list_filter = ['created_at']
    search_fields = ['user__username', 'user__email', 'address', 'phone']
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
            'fields': ('property', 'title', 'description', 'priority', 'due_date')
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
