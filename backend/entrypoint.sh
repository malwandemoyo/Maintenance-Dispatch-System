#!/bin/bash
# Docker entrypoint script - handles auto-initialization based on environment
set -e

ENVIRONMENT=${DJANGO_ENV:-development}
echo "=========================================="
echo "Starting Maintenance Dispatch System"
echo "Environment: $ENVIRONMENT"
echo "=========================================="

# Wait for database to be ready
echo "Waiting for database..."
while ! nc -z $DB_HOST $DB_PORT; do
  sleep 1
done
echo "Database is ready!"

# Collect static files in production so the backend can serve admin and DRF assets.
if [ "$ENVIRONMENT" = "production" ]; then
        echo "Collecting static files..."
        python manage.py collectstatic --noinput
fi

# Run migrations
echo "Running migrations..."
python manage.py migrate --noinput

# Auto-initialize based on environment
if [ "$ENVIRONMENT" = "test" ] || [ "$ENVIRONMENT" = "development" ]; then
    echo "Loading test data..."
    python init.py
elif [ "$ENVIRONMENT" = "production" ]; then
    echo "Production mode - skipping auto-initialization"
    # In production, you'd want to run migrations only, not auto-init
fi

# Create superuser if not exists (optional, can be disabled)
if [ "$AUTO_CREATE_SUPERUSER" = "true" ]; then
    echo "Creating superuser (if needed)..."
    python manage.py shell << END
from django.contrib.auth.models import User
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@localhost', 'admin123')
    print("Superuser created")
else:
    print("Superuser already exists")
END
fi

# Start the application
echo "Starting application..."
exec "$@"
