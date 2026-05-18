#!/bin/bash
# Production Deployment Server Setup Script
# Run this on a fresh Ubuntu/Debian server to prepare for deployment

set -e

echo "=========================================="
echo "Maintenance Dispatch System - Server Setup"
echo "=========================================="

# Check if running as root
if [ "$EUID" -ne 0 ]; then
   echo "This script must be run as root (use: sudo bash setup-server.sh)"
   exit 1
fi

# ==================== VARIABLES ====================
DEPLOY_USER=${DEPLOY_USER:-deploy}
DEPLOY_PATH=${DEPLOY_PATH:-/home/$DEPLOY_USER/maintenance-dispatch-system}
DOMAIN=${DOMAIN:-your-domain.com}

echo "Deploy User: $DEPLOY_USER"
echo "Deploy Path: $DEPLOY_PATH"
echo "Domain: $DOMAIN"
echo ""

# ==================== SYSTEM UPDATES ====================
echo "[1/8] Updating system packages..."
apt-get update
apt-get upgrade -y
apt-get install -y \
    curl \
    wget \
    git \
    build-essential \
    libssl-dev \
    libffi-dev \
    python3-dev \
    python3-venv \
    python3-pip \
    nano \
    htop \
    jq

# ==================== CREATE DEPLOY USER ====================
if ! id "$DEPLOY_USER" &>/dev/null; then
    echo "[2/8] Creating deploy user: $DEPLOY_USER"
    useradd -m -s /bin/bash "$DEPLOY_USER"
    echo "✓ Deploy user created"
else
    echo "[2/8] Deploy user already exists"
fi

# ==================== DOCKER INSTALLATION ====================
echo "[3/8] Installing Docker..."

# Add Docker repository
apt-get remove -y docker docker.io docker-compose || true
apt-get install -y \
    apt-transport-https \
    ca-certificates \
    curl \
    gnupg \
    lsb-release

curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg

echo "deb [arch=amd64 signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
  tee /etc/apt/sources.list.d/docker.list > /dev/null

apt-get update
apt-get install -y docker-ce docker-ce-cli containerd.io

# Enable Docker
systemctl enable docker
systemctl start docker

# Add deploy user to docker group
usermod -aG docker "$DEPLOY_USER"

echo "✓ Docker installed: $(docker --version)"

# ==================== DOCKER COMPOSE ====================
echo "[4/8] Installing Docker Compose..."

curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose

echo "✓ Docker Compose installed: $(docker-compose --version)"

# ==================== DEPLOYMENT DIRECTORY ====================
echo "[5/8] Setting up deployment directory..."

mkdir -p "$DEPLOY_PATH"
chown -R "$DEPLOY_USER:$DEPLOY_USER" "$DEPLOY_PATH"
chmod 755 "$DEPLOY_PATH"

# Create subdirectories
sudo -u "$DEPLOY_USER" mkdir -p "$DEPLOY_PATH/logs"
sudo -u "$DEPLOY_USER" mkdir -p "$DEPLOY_PATH/.ssh"

# ==================== SSH KEY SETUP ====================
echo "[6/8] Setting up SSH access..."

SSH_DIR="/home/$DEPLOY_USER/.ssh"
mkdir -p "$SSH_DIR"
chmod 700 "$SSH_DIR"

# Generate SSH key if not exists
if [ ! -f "$SSH_DIR/id_rsa" ]; then
    sudo -u "$DEPLOY_USER" ssh-keygen -t ed25519 -f "$SSH_DIR/id_ed25519" -N "" -C "deploy@$(hostname)"
    echo "✓ SSH key generated at $SSH_DIR/id_ed25519"
    echo ""
    echo "📋 Public key (add to GitHub deploy keys):"
    cat "$SSH_DIR/id_ed25519.pub"
    echo ""
else
    echo "✓ SSH keys already exist"
fi

chown -R "$DEPLOY_USER:$DEPLOY_USER" "$SSH_DIR"
chmod 600 "$SSH_DIR"/id_*

# ==================== GIT SETUP ====================
echo "[7/8] Configuring Git..."

sudo -u "$DEPLOY_USER" git config --global user.name "Deploy Bot"
sudo -u "$DEPLOY_USER" git config --global user.email "deploy@$(hostname)"

# Configure sparse checkout
cat > "$DEPLOY_PATH/.git-config" << 'EOF'
# Clone with sparse checkout for faster deployment
# git clone --sparse https://github.com/malwandemoyo/Maintenance-Dispatch-System.git .
# echo "frontend\nbackend\ndocker-compose*.yml\n.github/workflows\nDOCS" > .git/info/sparse-checkout
# git fetch origin
# git checkout main
EOF

echo "✓ Git configured"

# ==================== FIREWALL SETUP ====================
echo "[8/8] Configuring firewall..."

# Enable UFW
ufw --force enable

# Allow SSH
ufw allow 22/tcp

# Allow HTTP/HTTPS for Traefik (Cloudflare Tunnel handles proxying)
ufw allow 80/tcp
ufw allow 443/tcp

# NO need to expose app ports - Cloudflare Tunnel handles it!

echo "✓ Firewall configured"

# ==================== COMPLETION MESSAGE ====================
echo ""
echo "=========================================="
echo "✅ Server setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo ""
echo "1. SSH key for GitHub:"
echo "   - Public key: $SSH_DIR/id_ed25519.pub"
echo "   - Add to GitHub repository → Settings → Deploy keys"
echo ""
echo "2. Switch to deploy user:"
echo "   sudo su - $DEPLOY_USER"
echo ""
echo "3. Clone repository:"
echo "   cd $DEPLOY_PATH"
echo "   git clone --sparse git@github.com:malwandemoyo/Maintenance-Dispatch-System.git ."
echo "   echo 'frontend' > .git/info/sparse-checkout"
echo "   echo 'backend' >> .git/info/sparse-checkout"
echo "   echo 'docker-compose*.yml' >> .git/info/sparse-checkout"
echo "   git fetch origin"
echo "   git checkout main"
echo ""
echo "4. Create environment file:"
echo "   cp .env.production.example .env.production"
echo "   nano .env.production  # Edit with your values"
echo ""
echo "5. Start services:"
echo "   docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d"
echo ""
echo "6. Configure GitHub secrets in repository:"
echo "   DEPLOY_SERVER: $(hostname -I | awk '{print $1}')"
echo "   DEPLOY_USER: $DEPLOY_USER"
echo "   DEPLOY_PATH: $DEPLOY_PATH"
echo "   DEPLOY_KEY: [contents of $SSH_DIR/id_ed25519]"
echo ""
echo "=========================================="
