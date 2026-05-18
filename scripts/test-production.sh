#!/bin/bash
# Production Build & Test Script
# This script tests the production build locally before deployment

set -e

echo "=========================================="
echo "Production Build & Test"
echo "=========================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# ==================== FUNCTIONS ====================

log_info() {
    echo -e "${YELLOW}→${NC} $1"
}

log_success() {
    echo -e "${GREEN}✓${NC} $1"
}

log_error() {
    echo -e "${RED}✗${NC} $1"
}

# ==================== TESTS ====================

test_frontend_build() {
    log_info "Testing frontend production build..."
    
    cd frontend
    
    # Check for syntax errors
    log_info "  Running ESLint..."
    pnpm lint
    
    # Type checking
    log_info "  Running TypeScript type check..."
    pnpm typecheck
    
    # Format checking
    log_info "  Checking code format..."
    pnpm format:check
    
    # Build
    log_info "  Building Next.js application..."
    SKIP_ENV_VALIDATION=1 pnpm build
    
    if [ -d ".next" ]; then
        log_success "Frontend build successful"
    else
        log_error "Frontend build failed"
        return 1
    fi
    
    cd ..
}

test_backend_build() {
    log_info "Testing backend production build..."
    
    cd backend
    
    # Install dependencies
    log_info "  Installing Python dependencies..."
    pip install -r requirements.txt -q
    
    # Check for syntax errors
    log_info "  Running Python syntax check..."
    python -m py_compile $(find . -name '*.py' -not -path './migrations/*' -not -path './__pycache__/*')
    
    # Django checks
    log_info "  Running Django system checks..."
    python manage.py check
    
    # Try migrations
    log_info "  Checking migration status..."
    python manage.py showmigrations
    
    log_success "Backend checks successful"
    
    cd ..
}

test_docker_build() {
    log_info "Testing Docker production build..."
    
    # Frontend
    log_info "  Building frontend Docker image..."
    docker build -f frontend/Dockerfile --target production -t maintenance-frontend:test . > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Frontend Docker image built"
    else
        log_error "Frontend Docker build failed"
        return 1
    fi
    
    # Backend
    log_info "  Building backend Docker image..."
    docker build -f backend/Dockerfile --target production -t maintenance-backend:test . > /dev/null 2>&1
    
    if [ $? -eq 0 ]; then
        log_success "Backend Docker image built"
    else
        log_error "Backend Docker build failed"
        return 1
    fi
}

test_docker_compose_prod() {
    log_info "Testing docker-compose production configuration..."
    
    # Validate compose file
    log_info "  Validating docker-compose files..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml config > /dev/null
    
    if [ $? -eq 0 ]; then
        log_success "docker-compose configuration valid"
    else
        log_error "docker-compose validation failed"
        return 1
    fi
    
    log_info "  Building production images..."
    docker compose -f docker-compose.yml -f docker-compose.prod.yml build
    
    if [ $? -eq 0 ]; then
        log_success "Production images built successfully"
    else
        log_error "Production build failed"
        return 1
    fi
}

test_security() {
    log_info "Running security checks..."
    
    # Check for secrets in code
    log_info "  Checking for exposed secrets..."
    if grep -r "password\|secret\|token" frontend/src --include="*.ts" --include="*.tsx" --include="*.js" 2>/dev/null | grep -v "test\|example\|TODO" | grep -v node_modules; then
        log_error "Potential secrets found in code"
        return 1
    else
        log_success "No obvious secrets found in source code"
    fi
    
    # Check dependencies
    log_info "  Checking for vulnerable dependencies..."
    
    cd frontend
    npm audit --audit-level=high > /dev/null 2>&1 || {
        log_error "High severity vulnerabilities found in frontend"
        npm audit --production
        return 1
    }
    cd ..
    
    cd backend
    pip-audit --desc > /dev/null 2>&1 || {
        log_error "High severity vulnerabilities found in backend"
        return 1
    }
    cd ..
    
    log_success "Dependency security checks passed"
}

test_production_scenarios() {
    log_info "Testing production scenarios..."
    
    # Check environment validation
    log_info "  Checking environment variable handling..."
    cd frontend
    SKIP_ENV_VALIDATION=1 pnpm build > /dev/null 2>&1
    cd ..
    log_success "Environment handling verified"
}

# ==================== MAIN ====================

FAILED=0

# Run tests
test_frontend_build || FAILED=$((FAILED+1))
echo ""

test_backend_build || FAILED=$((FAILED+1))
echo ""

test_security || FAILED=$((FAILED+1))
echo ""

test_docker_compose_prod || FAILED=$((FAILED+1))
echo ""

test_production_scenarios || FAILED=$((FAILED+1))
echo ""

# ==================== SUMMARY ====================

echo "=========================================="
if [ $FAILED -eq 0 ]; then
    log_success "All production tests passed!"
    log_info "Ready for deployment"
    exit 0
else
    log_error "$FAILED test(s) failed"
    log_info "Fix issues before deployment"
    exit 1
fi
