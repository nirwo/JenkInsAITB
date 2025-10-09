#!/bin/bash

set -e

echo "╔════════════════════════════════════════════════════════════╗"
echo "║       JenKinds Ubuntu Setup & Deployment Script           ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PORT=9010
API_PORT=9011
GRAFANA_PORT=9012

# Helper functions
print_step() {
    echo -e "${BLUE}▶ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

# Get machine IP
get_machine_ip() {
    # Try multiple methods to get IP
    IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$IP" ]; then
        IP=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
    fi
    if [ -z "$IP" ]; then
        IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    echo "$IP"
}

MACHINE_IP=$(get_machine_ip)

print_step "Detected Machine IP: ${MACHINE_IP:-localhost}"
echo ""

# Step 1: Check Prerequisites
print_step "Step 1: Checking Prerequisites"

command -v node >/dev/null 2>&1 && print_success "Node.js installed: $(node --version)" || {
    print_error "Node.js not found. Please install Node.js 20+"
    exit 1
}

command -v pnpm >/dev/null 2>&1 && print_success "pnpm installed: $(pnpm --version)" || {
    print_warning "pnpm not found. Installing..."
    npm install -g pnpm
}

print_success "Prerequisites check complete"
echo ""

# Step 2: Install Dependencies
print_step "Step 2: Installing Dependencies"
pnpm install
print_success "Dependencies installed"
echo ""

# Step 3: Configure Environment
print_step "Step 3: Configuring Environment"

if [ ! -f .env ]; then
    print_warning ".env not found, creating from .env.example"
    cp .env.example .env
fi

# Update .env with correct ports and IP
cat > .env << EOF
# Application
NODE_ENV=development
PORT=${PORT}
API_PORT=${API_PORT}
APP_URL=http://${MACHINE_IP}:${PORT}
API_URL=http://${MACHINE_IP}:${API_PORT}

# Database - Using SQLite for simplicity (no connection issues!)
DATABASE_URL="file:./prisma/dev.db"

# Redis
REDIS_URL="redis://localhost:6379"
REDIS_PASSWORD=""

# Jenkins Configuration
JENKINS_URL=https://your-jenkins.com
JENKINS_USER=your-username
JENKINS_API_TOKEN=your-api-token
JENKINS_POLL_INTERVAL=5000

# AI Services
OPENAI_API_KEY=your-openai-key-here
OPENAI_MODEL=gpt-4-turbo-preview
OPENAI_MAX_TOKENS=4096
ENABLE_AI_ANALYSIS=true

# Authentication
JWT_SECRET=change-this-super-secret-key-$(openssl rand -hex 32)
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=change-this-refresh-secret-$(openssl rand -hex 32)
REFRESH_TOKEN_EXPIRES_IN=7d

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Logging
LOG_LEVEL=info
LOG_FILE_PATH=./logs

# Monitoring
ENABLE_METRICS=true
METRICS_PORT=9090
SENTRY_DSN=""
ENABLE_TRACING=false

# Features
MAX_LOG_SIZE_MB=140
LOG_PROCESSING_TIMEOUT=30000
ENABLE_CACHING=true
CACHE_TTL=300

# Email (Optional)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-password
EMAIL_FROM=noreply@jenkinds.io

VITE_API_URL=http://${MACHINE_IP}:${API_PORT}
EOF

print_success "Environment configured"
echo ""

# Step 4: Setup Database
print_step "Step 4: Setting up Database (SQLite)"
pnpm prisma generate
pnpm prisma migrate deploy || pnpm prisma db push
print_success "Database ready"
echo ""

# Step 5: Create logs directory
print_step "Step 5: Creating logs directory"
mkdir -p logs
print_success "Logs directory created"
echo ""

# Step 6: Build Application
print_step "Step 6: Building Application"
pnpm build
print_success "Application built"
echo ""

# Step 7: Check Firewall (Ubuntu specific)
print_step "Step 7: Checking Firewall"
if command -v ufw >/dev/null 2>&1; then
    print_warning "UFW detected. You may need to allow ports:"
    echo "  sudo ufw allow ${PORT}/tcp"
    echo "  sudo ufw allow ${API_PORT}/tcp"
    echo "  sudo ufw allow ${GRAFANA_PORT}/tcp"
else
    print_success "No UFW firewall detected"
fi
echo ""

# Step 8: Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                    Setup Complete! ✓                       ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo "Access URLs:"
echo "  Local:      http://localhost:${API_PORT}"
echo "  Remote:     http://${MACHINE_IP}:${API_PORT}"
echo "  Health:     http://${MACHINE_IP}:${API_PORT}/health"
echo ""
echo "Next Steps:"
echo "  1. Start Redis:        docker-compose up -d redis"
echo "  2. Start Production:   pnpm start"
echo "  3. Or Development:     pnpm dev"
echo ""
echo "Run sanity check:       bash scripts/sanity-check.sh"
echo ""
