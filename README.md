# Maintenance Dispatch System

This repository contains a production-ready maintenance dispatch application with a Django backend, Next.js frontend, PostgreSQL database, and Docker-based deployment.

## What this project contains

- `backend/` — Django REST API powered by Django 6.x and Django REST Framework
- `frontend/` — Next.js 15+ frontend with TypeScript and pnpm
- `docker-compose.yml` — base Docker Compose service definitions
- `docker-compose.override.yml` — development overrides for hot reload and live coding
- `docker-compose.prod.yml` — production-ready deployment configuration
- `docker-compose.test.yml` — isolated testing environment


## Architecture

The stack is designed to support local development, automated CI/CD, and secure production deployment.

- Backend: Django + Gunicorn
- Frontend: Next.js standalone build
- Database: PostgreSQL
- Deployment: Docker Compose in production
- Reverse proxy / tunnel support: Traefik + Cloudflare Tunnel

## Quick start

### Local development

```bash

docker compose up
```

Access:
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000`
- Database: `localhost:5432`

### Local production-like build

```bash
docker compose -f docker-compose.yml -f docker-compose.prod.yml build
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Run tests

```bash
docker compose -f docker-compose.yml -f docker-compose.test.yml up --build
```

## Development workflows

### Backend

- `backend/manage.py` runs Django management commands
- `backend/entrypoint.sh` handles startup, database readiness, migrations, and static collection
- Environment enters auto-initialization for `development` and `test`

### Frontend

- `frontend/package.json` contains build, lint, and typecheck scripts
- Uses `pnpm` and a multi-stage Docker build for production
- Production output is a standalone Next.js app

## CI/CD

GitHub Actions is configured to test and build both frontend and backend code and push production images when changes land on `main` or `develop`.

Key pipeline stages:
- `frontend-test` — Node.js install, lint, typecheck, format, build, and production image smoke test
- `backend-test` — Python install, PostgreSQL service, migrations, test suite, and production image build
- `build-frontend` — build and push frontend image to GHCR
- `build-backend` — build and push backend image to GHCR
- `deploy-production` — deploys on push to `main`, pulls images, restarts Docker Compose services, migrates, and collects static files

## Deployment

Production deployment is handled through Docker Compose and supports secure traffic routing with Traefik and Cloudflare Tunnel.

- Production compose file: `docker-compose.prod.yml`
- Traefik integration: `docker-compose.traefik.yml`
- Cloudflare Tunnel and direct tunnel support documented in `DOCS/`

### Common deployment commands

```bash
# Build images locally
docker compose -f docker-compose.yml -f docker-compose.prod.yml build

# Run production services
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d

# Run migrations
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py migrate

# Collect static files
docker compose -f docker-compose.yml -f docker-compose.prod.yml exec backend python manage.py collectstatic --noinput
```

## Environment configuration

This project uses environment files to separate development, test, and production settings.

- `.env` — default development values
- `.env.development` — development-specific overrides
- `.env.test` — test environment configuration
- `.env.production` — production secrets and runtime variables

**Do not commit real secrets**. Keep production credentials in secure storage or deployment server secrets.

### Important variables

- `DEBUG`
- `DJANGO_ENV`
- `ALLOWED_HOSTS`
- `AUTH_SECRET`
- `SECRET_KEY`
- `NEXT_PUBLIC_API_URL`
- `BACKEND_URL`
- Database connection variables
- Email SMTP credentials for production

## Notes

- The backend includes a friendly root landing page when served at the production host
- Production backend serves Django admin and static assets from `STATIC_ROOT`
- Frontend production builds should generate a standalone server with `server.js`
- CI workflows now include production build validation for both frontend and backend images


If you need to update deployment credentials, modify `.env.production` on the deployment server and keep secrets out of Git.
