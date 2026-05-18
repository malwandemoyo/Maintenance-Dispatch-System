"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/6.0/topics/http/urls/
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import HttpResponse, JsonResponse
from django.urls import path, include
from rest_framework.routers import DefaultRouter

from core.views import (
    UserViewSet,
    UserRoleViewSet,
    PropertyViewSet,
    ResidentReportViewSet,
    MaintenanceTaskViewSet,
    TaskCommentViewSet,
    TaskHistoryViewSet,
)
from notifications.views import (
    NotificationPreferenceViewSet,
    EmailTemplateViewSet,
    NotificationViewSet,
)
from users.views import AuthViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'users', UserViewSet, basename='user')
router.register(r'roles', UserRoleViewSet, basename='role')
router.register(r'properties', PropertyViewSet, basename='property')
router.register(r'reports', ResidentReportViewSet, basename='report')
router.register(r'tasks', MaintenanceTaskViewSet, basename='task')
router.register(r'comments', TaskCommentViewSet, basename='comment')
router.register(r'history', TaskHistoryViewSet, basename='history')
router.register(
    r'notification-preferences', NotificationPreferenceViewSet, basename='notification-preference'
)
router.register(r'email-templates', EmailTemplateViewSet, basename='email-template')
router.register(r'notifications', NotificationViewSet, basename='notification')


def health(request):
    """Health endpoint that checks DB connectivity.

    Returns 200 if a lightweight DB query succeeds, otherwise 503.
    """
    from django.db import connections
    from django.db.utils import OperationalError

    db_conn = connections['default']
    try:
        with db_conn.cursor() as cursor:
            cursor.execute('SELECT 1')
            cursor.fetchone()
    except OperationalError:
        return JsonResponse({"status": "error", "detail": "database unavailable"}, status=503)
    except Exception:
        return JsonResponse({"status": "error", "detail": "unexpected error"}, status=503)
    return JsonResponse({"status": "ok"})


def root_page(request):
    """Humorous root page for the backend."""
    html = """
    <!DOCTYPE html>
    <html>
    <head>
        <title>Maintenance Dispatch System — Backend</title>
        <style>
            body {
                font-family: Arial, sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex;
                justify-content: center;
                align-items: center;
                height: 100vh;
                margin: 0;
                color: white;
                text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
            }
            .container {
                text-align: center;
                background: rgba(0,0,0,0.2);
                padding: 50px;
                border-radius: 15px;
                backdrop-filter: blur(10px);
            }
            h1 {
                font-size: 3em;
                margin: 0 0 20px 0;
            }
            p {
                font-size: 1.2em;
                line-height: 1.6;
                margin: 10px 0;
            }
            .emoji {
                font-size: 4em;
                margin: 20px 0;
            }
            a {
                color: #ffd700;
                text-decoration: none;
                font-weight: bold;
            }
            a:hover {
                text-decoration: underline;
            }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="emoji">⚙️🔧🚀</div>
            <h1>Backend API</h1>
            <p>Welcome to the <strong>Maintenance Dispatch System</strong> backend!</p>
            <p>You've reached the API server at <strong>mb.malwande.me</strong></p>
            <p>If you're looking for something to click, try:</p>
            <ul style="list-style: none; padding: 0;">
                <li><a href="/admin/">🔐 Admin Panel</a> (for the brave)</li>
                <li><a href="/api/">📡 API Router</a> (for the curious)</li>
                <li><a href="/api/health/">💓 Health Check</a> (for the paranoid)</a></li>
            </ul>
            <p style="margin-top: 40px; font-size: 0.9em; opacity: 0.8;">
                💡 Pro tip: This is not a website. It's an API. If you're seeing this, you're probably lost.
            </p>
        </div>
    </body>
    </html>
    """
    return HttpResponse(html)


urlpatterns = [
    path('', root_page),
    path('admin/', admin.site.urls),
    path('api/', include(router.urls)),
    path('api-auth/', include('rest_framework.urls')),
    path('api/health/', health),
]

urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
