#!/bin/bash
# Traefik + Cloudflare Tunnel Setup & Deployment Script
# Run on production server to set up modern infrastructure

set -e

echo "=========================================="
echo "Traefik + Cloudflare Tunnel Setup"
echo "=========================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() { echo -e "${YELLOW}→${NC} $1"; }
log_success() { echo -e "${GREEN}✓${NC} $1"; }
log_error() { echo -e "${RED}✗${NC} $1"; }
log_section() { echo -e "\n${BLUE}=== $1 ===${NC}"; }

# ==================== PREREQUISITES ====================
log_section "Checking Prerequisites"

# Check if running as deploy user (not root)
if [ "$EUID" -eq 0 ]; then
   log_error "This script should NOT be run as root"
   echo "Run as: sudo su - deploy && bash setup-traefik.sh"
   exit 1
fi

# Check Docker
if ! command -v docker &> /dev/null; then
    log_error "Docker not installed. Run setup-server.sh first."
    exit 1
fi

log_success "Docker installed"

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    log_error "Docker Compose not installed. Run setup-server.sh first."
    exit 1
fi

log_success "Docker Compose installed"

# ==================== CLOUDFLARE SETUP ====================
log_section "Cloudflare Configuration"

read -p "Enter your Cloudflare API Email: " CF_API_EMAIL
read -sp "Enter your Cloudflare API Key: " CF_API_KEY
echo ""

read -p "Enter Cloudflare Tunnel ID: " CLOUDFLARE_TUNNEL_ID
read -p "Enter Cloudflare Tunnel Token: " CLOUDFLARE_TUNNEL_TOKEN

log_info "Verifying Cloudflare credentials..."
# Try to list tunnels to verify
if ! echo "$CLOUDFLARE_TUNNEL_TOKEN" | grep -q "eyJ"; then
    log_error "Invalid Cloudflare Tunnel Token format"
    exit 1
fi

log_success "Cloudflare credentials validated"

# ==================== TRAEFIK AUTHENTICATION ====================
log_section "Traefik Dashboard Setup"

if ! command -v htpasswd &> /dev/null; then
    log_info "Installing apache2-utils for htpasswd..."
    sudo apt-get install -y apache2-utils > /dev/null 2>&1
fi

read -p "Enter Traefik dashboard username [admin]: " TRAEFIK_USER
TRAEFIK_USER=${TRAEFIK_USER:-admin}

read -sp "Enter Traefik dashboard password: " TRAEFIK_PASSWORD
echo ""

# Generate htpasswd hash
TRAEFIK_AUTH=$(htpasswd -bc /dev/stdin "$TRAEFIK_USER" "$TRAEFIK_PASSWORD" 2>/dev/null | cut -d: -f1,2)

log_success "Traefik authentication configured"

# ==================== DOMAIN SETUP ====================
log_section "Domain Configuration"

read -p "Enter your domain (e.g., your-domain.com): " DOMAIN

if [ -z "$DOMAIN" ]; then
    log_error "Domain cannot be empty"
    exit 1
fi

log_success "Domain configured: $DOMAIN"

# ==================== CREATE ENVIRONMENT FILE ====================
log_section "Creating .env.production"

# Check if already exists
if [ -f ".env.production" ]; then
    log_info ".env.production already exists"
    read -p "Overwrite? (y/n): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        log_info "Keeping existing .env.production"
    fi
else
    cat > .env.production << EOF
# Domain Configuration
DOMAIN=$DOMAIN

# Cloudflare Integration
CF_API_EMAIL=$CF_API_EMAIL
CF_API_KEY=$CF_API_KEY
CLOUDFLARE_TUNNEL_ID=$CLOUDFLARE_TUNNEL_ID
CLOUDFLARE_TUNNEL_TOKEN=$CLOUDFLARE_TUNNEL_TOKEN

# Traefik Dashboard Authentication
TRAEFIK_AUTH=$TRAEFIK_AUTH
TRAEFIK_ADMIN_PASSWORD_HASH=$TRAEFIK_AUTH

# API URLs
NEXT_PUBLIC_API_URL=https://api.$DOMAIN
BACKEND_URL=http://backend:8000
PRODUCTION_API_URL=https://api.$DOMAIN

# Database (generate secure password)
POSTGRES_DB=maintenance_db_prod
POSTGRES_USER=prod_user
POSTGRES_PASSWORD=$(openssl rand -base64 32)
POSTGRES_HOST_AUTH_METHOD=md5

# Django Configuration (generate secret key)
DEBUG=false
DJANGO_ENV=production
SECRET_KEY=$(python3 -c 'import secrets; print(secrets.token_urlsafe(50))')
ALLOWED_HOSTS=$DOMAIN,www.$DOMAIN,api.$DOMAIN,traefik.$DOMAIN
AUTH_SECRET=$(python3 -c 'import secrets; print(secrets.token_urlsafe(32))')
AUTH_TRUST_HOST=true

# Logging
DJANGO_LOG_LEVEL=INFO
PYTHONUNBUFFERED=1
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1

# Email (optional)
EMAIL_BACKEND=django.core.mail.backends.console.EmailBackend
DEFAULT_FROM_EMAIL=noreply@$DOMAIN

# Monitoring (optional)
SENTRY_DSN=
EOF
    
    log_success ".env.production created"
fi

# ==================== CREATE DOCKER NETWORK ====================
log_section "Setting Up Docker Network"

if docker network inspect maintenance-network > /dev/null 2>&1; then
    log_success "Docker network 'maintenance-network' exists"
else
    log_info "Creating Docker network..."
    docker network create maintenance-network
    log_success "Docker network created"
fi

# ==================== CREATE DIRECTORIES ====================
log_section "Creating Required Directories"

mkdir -p logs
mkdir -p config
chmod 755 logs
log_success "Directories created"

# ==================== DISPLAY NEXT STEPS ====================
log_section "✅ Setup Complete!"

echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Verify environment file:"
echo "   ${BLUE}cat .env.production${NC}"
echo ""
echo "2. Configure Cloudflare DNS records:"
echo "   - Go to https://dash.cloudflare.com/"
echo "   - DNS settings for $DOMAIN"
echo "   - Create CNAME records:"
echo "     • ${BLUE}$DOMAIN${NC} → ${YELLOW}$CLOUDFLARE_TUNNEL_ID.cfargotunnel.com${NC} (Proxied)"
echo "     • ${BLUE}www${NC} → ${YELLOW}$CLOUDFLARE_TUNNEL_ID.cfargotunnel.com${NC} (Proxied)"
echo "     • ${BLUE}api${NC} → ${YELLOW}$CLOUDFLARE_TUNNEL_ID.cfargotunnel.com${NC} (Proxied)"
echo "     • ${BLUE}traefik${NC} → ${YELLOW}$CLOUDFLARE_TUNNEL_ID.cfargotunnel.com${NC} (Proxied)"
echo ""
echo "3. Start services:"
echo "   ${BLUE}docker compose \\${NC}"
echo "     ${BLUE}-f docker-compose.yml \\${NC}"
echo "     ${BLUE}-f docker-compose.prod.yml \\${NC}"
echo "     ${BLUE}-f docker-compose.traefik.yml \\${NC}"
echo "     ${BLUE}up -d${NC}"
echo ""
echo "4. Run database migrations:"
echo "   ${BLUE}docker compose -f docker-compose.yml -f docker-compose.prod.yml \\${NC}"
echo "     ${BLUE}exec backend python manage.py migrate${NC}"
echo ""
echo "5. Collect static files:"
echo "   ${BLUE}docker compose -f docker-compose.yml -f docker-compose.prod.yml \\${NC}"
echo "     ${BLUE}exec backend python manage.py collectstatic --noinput${NC}"
echo ""
echo "6. Verify Cloudflare Tunnel is connected:"
echo "   ${BLUE}docker logs cloudflare-tunnel | tail -20${NC}"
echo ""
echo "7. Access services:"
echo "   ${GREEN}• Frontend:${NC} https://$DOMAIN"
echo "   ${GREEN}• API:${NC} https://api.$DOMAIN/api/health/"
echo "   ${GREEN}• Traefik Dashboard:${NC} https://traefik.$DOMAIN"
echo "     Username: $TRAEFIK_USER"
echo ""
echo "8. Monitor logs:"
echo "   ${BLUE}docker compose -f docker-compose.yml -f docker-compose.prod.yml -f docker-compose.traefik.yml logs -f${NC}"
echo ""
echo "=========================================="
