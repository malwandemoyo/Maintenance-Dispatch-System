"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    UserViewSet, UserRoleViewSet, PropertyViewSet,
    MaintenanceTaskViewSet, TaskCommentViewSet, TaskHistoryViewSet
)
from users.views import AuthViewSet
from notifications.views import NotificationPreferenceViewSet, EmailTemplateViewSet, NotificationViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'tasks', MaintenanceTaskViewSet, basename='task')
router.register(r'comments', TaskCommentViewSet, basename='comment')
router.register(r'history', TaskHistoryViewSet, basename='history')
router.register(r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preference')
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'notifications', NotificationViewSet, basename='notification')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
]

# Simple health endpoint for Docker healthchecks
from django.http import JsonResponse
from django.db import connections
from django.db.utils import OperationalError


def health(request):
    """Health endpoint that checks DB connectivity.

    Returns 200 if a lightweight DB query succeeds, otherwise 503.
    This ensures Docker healthchecks reflect actual backend readiness.
    """
    db_conn = connections['default']
    try:
        # Perform a very small query to verify DB connectivity
        with db_conn.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except OperationalError:
        return JsonResponse({"status": "error", "detail": "database unavailable"}, status=503)
    except Exception:
        return JsonResponse({"status": "error", "detail": "unexpected error"}, status=503)
    return JsonResponse({"status": "ok"})


urlpatterns += [
    path('api/health/', health),
]
