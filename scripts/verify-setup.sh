#!/bin/bash

# JenKinds - Complete Setup Verification Script
# This script verifies that your development environment is ready

set -e

echo "🔍 JenKinds Setup Verification"
echo "=============================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check functions
check_command() {
    if command -v $1 &> /dev/null; then
        echo -e "${GREEN}✓${NC} $1 is installed"
        return 0
    else
        echo -e "${RED}✗${NC} $1 is NOT installed"
        return 1
    fi
}

check_version() {
    local cmd=$1
    local min_version=$2
    local current_version=$($cmd)
    echo -e "${GREEN}✓${NC} $cmd version: $current_version"
}

# Start verification
echo "1️⃣  Checking Prerequisites..."
echo "--------------------------------"

# Node.js
if check_command node; then
    check_version "node --version" "20.10.0"
fi

# pnpm
if check_command pnpm; then
    check_version "pnpm --version" "8.12.0"
fi

# Docker
if check_command docker; then
    check_version "docker --version" "24.0.0"
fi

# Git
if check_command git; then
    check_version "git --version" "2.0.0"
fi

echo ""
echo "2️⃣  Checking Project Files..."
echo "--------------------------------"

# Check key files
files=(
    "package.json"
    "tsconfig.json"
    "prisma/schema.prisma"
    "docker-compose.yml"
    ".env.example"
    "Readme.MD"
    "QUICKSTART.md"
)

for file in "${files[@]}"; do
    if [ -f "$file" ]; then
        echo -e "${GREEN}✓${NC} $file exists"
    else
        echo -e "${RED}✗${NC} $file is missing"
    fi
done

echo ""
echo "3️⃣  Checking Dependencies..."
echo "--------------------------------"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✓${NC} node_modules exists"
    count=$(find node_modules -maxdepth 1 -type d | wc -l)
    echo -e "   $count packages installed"
else
    echo -e "${RED}✗${NC} node_modules missing - run: pnpm install"
fi

echo ""
echo "4️⃣  Checking Docker Services..."
echo "--------------------------------"

if docker-compose ps 2>/dev/null | grep -q "Up"; then
    echo -e "${GREEN}✓${NC} Docker services are running"
    docker-compose ps --format "table {{.Name}}\t{{.Status}}"
else
    echo -e "${YELLOW}⚠${NC}  Docker services not running - run: docker-compose up -d"
fi

echo ""
echo "5️⃣  Checking TypeScript Compilation..."
echo "--------------------------------"

if pnpm type-check &> /dev/null; then
    echo -e "${GREEN}✓${NC} TypeScript compilation successful"
else
    echo -e "${RED}✗${NC} TypeScript compilation has errors"
fi

echo ""
echo "6️⃣  Checking Environment Variables..."
echo "--------------------------------"

if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} .env file exists"
    
    # Check for required variables
    required_vars=("DATABASE_URL" "REDIS_URL" "JWT_SECRET" "JENKINS_URL")
    for var in "${required_vars[@]}"; do
        if grep -q "^$var=" .env; then
            echo -e "${GREEN}✓${NC} $var is set"
        else
            echo -e "${YELLOW}⚠${NC}  $var is not set"
        fi
    done
else
    echo -e "${YELLOW}⚠${NC}  .env file missing - copy from .env.example"
fi

echo ""
echo "7️⃣  Checking Database..."
echo "--------------------------------"

if [ -d "node_modules/.prisma" ]; then
    echo -e "${GREEN}✓${NC} Prisma Client is generated"
else
    echo -e "${YELLOW}⚠${NC}  Prisma Client not generated - run: pnpm db:generate"
fi

if [ -d "prisma/migrations" ] && [ "$(ls -A prisma/migrations)" ]; then
    echo -e "${GREEN}✓${NC} Database migrations exist"
else
    echo -e "${YELLOW}⚠${NC}  No migrations - run: pnpm db:migrate"
fi

echo ""
echo "8️⃣  Checking Ports..."
echo "--------------------------------"

check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null 2>&1; then
        echo -e "${YELLOW}⚠${NC}  Port $1 is in use"
    else
        echo -e "${GREEN}✓${NC} Port $1 is available"
    fi
}

check_port 3000  # Frontend
check_port 3001  # Backend
check_port 5432  # PostgreSQL
check_port 6379  # Redis

echo ""
echo "=============================="
echo "📊 Verification Summary"
echo "=============================="

# Simple readiness check
if [ -d "node_modules" ] && [ -f ".env" ] && pnpm type-check &> /dev/null; then
    echo ""
    echo -e "${GREEN}✅ Your JenKinds development environment is READY!${NC}"
    echo ""
    echo "🚀 Next steps:"
    echo "   1. Start services: docker-compose up -d"
    echo "   2. Run migrations: pnpm db:migrate"
    echo "   3. Start dev servers: pnpm dev"
    echo "   4. Open browser: http://localhost:3000"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some setup steps are incomplete${NC}"
    echo ""
    echo "📋 To complete setup:"
    echo "   1. Install dependencies: pnpm install"
    echo "   2. Copy environment: cp .env.example .env"
    echo "   3. Start Docker: docker-compose up -d"
    echo "   4. Generate Prisma: pnpm db:generate"
    echo "   5. Run migrations: pnpm db:migrate"
    echo "   6. Start dev: pnpm dev"
fi

echo ""
echo "📚 For detailed instructions, see:"
echo "   - QUICKSTART.md"
echo "   - STATUS.md"
echo "   - Readme.MD"
echo ""
