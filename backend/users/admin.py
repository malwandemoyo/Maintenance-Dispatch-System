from django.contrib import admin
from users.models import UserProfile, UserActivity


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user', 'phone', 'notifications_enabled', 'email_on_task_assigned', 'created_at']
    list_filter = ['notifications_enabled', 'email_on_task_assigned', 'created_at']
    search_fields = ['user__username', 'user__email', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'last_login_ip']
    fieldsets = (
        ('User', {
            'fields': ('user',)
        }),
        ('Contact', {
            'fields': ('phone', 'avatar', 'bio')
        }),
        ('Notifications', {
            'fields': ('notifications_enabled', 'email_on_task_assigned', 'email_on_task_completed')
        }),
        ('Activity', {
            'fields': ('last_login_ip', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(UserActivity)
class UserActivityAdmin(admin.ModelAdmin):
    list_display = ['user', 'activity_type', 'ip_address', 'created_at']
    list_filter = ['activity_type', 'created_at']
    search_fields = ['user__username', 'user__email', 'ip_address']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'

