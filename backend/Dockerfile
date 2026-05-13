FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1
ENV DJANGO_ENV=development

WORKDIR /app

RUN apt-get update --fix-missing && apt-get install -y --no-install-recommends libpq-dev gcc netcat-openbsd && rm -rf /var/lib/apt/lists/*

COPY requirements.txt /app/
RUN pip install --upgrade pip && pip install -r requirements.txt

COPY . /app/

# Collect static files
RUN python manage.py collectstatic --noinput

# Make entrypoint executable before setting it as entrypoint
RUN chmod +x /app/entrypoint.sh && ls -la /app/entrypoint.sh

# Set entrypoint
ENTRYPOINT ["/bin/bash", "/app/entrypoint.sh"]
CMD ["gunicorn", "config.wsgi:application", "--bind", "0.0.0.0:8000"]