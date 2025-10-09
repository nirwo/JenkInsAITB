#!/bin/bash

echo "╔════════════════════════════════════════════════════════════╗"
echo "║            JenKinds Sanity Check & Diagnostics            ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

PASSED=0
FAILED=0
WARNINGS=0

check_pass() {
    echo -e "${GREEN}✓ $1${NC}"
    ((PASSED++))
}

check_fail() {
    echo -e "${RED}✗ $1${NC}"
    ((FAILED++))
}

check_warn() {
    echo -e "${YELLOW}⚠ $1${NC}"
    ((WARNINGS++))
}

# Load environment
if [ -f .env ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

API_PORT=${API_PORT:-9011}
PORT=${PORT:-9010}

# Get machine IP
get_machine_ip() {
    IP=$(hostname -I 2>/dev/null | awk '{print $1}')
    if [ -z "$IP" ]; then
        IP=$(ip addr show 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d/ -f1)
    fi
    if [ -z "$IP" ]; then
        IP=$(ifconfig 2>/dev/null | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)
    fi
    echo "$IP"
}

MACHINE_IP=$(get_machine_ip)

echo "Configuration:"
echo "  API Port: ${API_PORT}"
echo "  Frontend Port: ${PORT}"
echo "  Machine IP: ${MACHINE_IP:-localhost}"
echo ""

# 1. Check Node.js
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "1. Node.js Environment"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if command -v node >/dev/null 2>&1; then
    NODE_VERSION=$(node --version)
    check_pass "Node.js installed: ${NODE_VERSION}"
    
    # Check if version is 20+
    MAJOR_VERSION=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
    if [ "$MAJOR_VERSION" -ge 20 ]; then
        check_pass "Node.js version >= 20"
    else
        check_warn "Node.js version < 20 (recommended: 20+)"
    fi
else
    check_fail "Node.js not installed"
fi

if command -v pnpm >/dev/null 2>&1; then
    check_pass "pnpm installed: $(pnpm --version)"
else
    check_fail "pnpm not installed"
fi
echo ""

# 2. Check Files
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "2. Required Files"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
[ -f .env ] && check_pass ".env file exists" || check_fail ".env file missing"
[ -f package.json ] && check_pass "package.json exists" || check_fail "package.json missing"
[ -f prisma/schema.prisma ] && check_pass "Prisma schema exists" || check_fail "Prisma schema missing"
[ -d node_modules ] && check_pass "node_modules installed" || check_warn "node_modules missing (run: pnpm install)"
[ -d dist ] && check_pass "dist/ folder exists (built)" || check_warn "dist/ folder missing (run: pnpm build)"
[ -f dist/server/index.js ] && check_pass "Server built" || check_warn "Server not built"
[ -f dist/index.html ] && check_pass "Frontend built" || check_warn "Frontend not built"
echo ""

# 3. Check Database
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "3. Database (SQLite)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
if [ -f prisma/dev.db ]; then
    check_pass "SQLite database exists"
    DB_SIZE=$(du -h prisma/dev.db | awk '{print $1}')
    check_pass "Database size: ${DB_SIZE}"
else
    check_warn "Database not initialized (run: pnpm prisma db push)"
fi
echo ""

# 4. Check Ports
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "4. Port Availability"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

check_port() {
    local port=$1
    local name=$2
    if lsof -i :$port >/dev/null 2>&1 || ss -tuln 2>/dev/null | grep -q ":$port " || netstat -tuln 2>/dev/null | grep -q ":$port "; then
        local process=$(lsof -i :$port 2>/dev/null | tail -1 | awk '{print $1}' || echo "unknown")
        if [ "$process" = "node" ]; then
            check_pass "$name (port $port) - Running (node)"
        else
            check_warn "$name (port $port) - Used by: $process"
        fi
    else
        check_pass "$name (port $port) - Available"
    fi
}

check_port $API_PORT "API Server"
check_port $PORT "Frontend Dev Server"
check_port 6379 "Redis"
check_port 9090 "Prometheus"
check_port 9012 "Grafana"
echo ""

# 5. Check Server Health
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "5. Server Health Checks"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Check localhost
if curl -s -f -m 5 http://localhost:${API_PORT}/health >/dev/null 2>&1; then
    check_pass "Server responding on localhost:${API_PORT}"
    
    # Get health data
    HEALTH=$(curl -s http://localhost:${API_PORT}/health 2>/dev/null)
    if echo "$HEALTH" | grep -q "ok"; then
        check_pass "Health endpoint returns 'ok'"
    fi
else
    check_fail "Server not responding on localhost:${API_PORT}"
fi

# Check remote access
if [ ! -z "$MACHINE_IP" ]; then
    if curl -s -f -m 5 http://${MACHINE_IP}:${API_PORT}/health >/dev/null 2>&1; then
        check_pass "Server accessible via IP: ${MACHINE_IP}:${API_PORT}"
    else
        check_warn "Server not accessible via IP (may need firewall config)"
    fi
fi
echo ""

# 6. Check CORS
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "6. CORS Configuration"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

CORS_CHECK=$(curl -s -X OPTIONS \
  -H "Origin: http://${MACHINE_IP}:${PORT}" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type,authorization" \
  -i http://localhost:${API_PORT}/trpc/auth.login 2>/dev/null | head -20)

if echo "$CORS_CHECK" | grep -qi "access-control-allow-origin"; then
    check_pass "CORS headers present"
    
    if echo "$CORS_CHECK" | grep -qi "HTTP/.* 204"; then
        check_pass "Preflight returns 204 No Content"
    elif echo "$CORS_CHECK" | grep -qi "HTTP/.* 200"; then
        check_pass "Preflight returns 200 OK"
    fi
    
    if echo "$CORS_CHECK" | grep -qi "access-control-allow-credentials"; then
        check_pass "CORS credentials enabled"
    fi
else
    check_fail "CORS headers missing"
fi
echo ""

# 7. Check tRPC
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "7. tRPC Endpoint"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

TRPC_TEST=$(curl -s http://localhost:${API_PORT}/trpc/jenkins.getSyncStatus 2>/dev/null)
if echo "$TRPC_TEST" | grep -q "error"; then
    if echo "$TRPC_TEST" | grep -q "UNAUTHORIZED"; then
        check_pass "tRPC working (auth required - expected)"
    elif echo "$TRPC_TEST" | grep -q "NOT_FOUND"; then
        check_pass "tRPC working (endpoint found)"
    else
        check_warn "tRPC endpoint has errors"
    fi
else
    check_warn "tRPC endpoint not responding as expected"
fi
echo ""

# 8. Check Redis
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "8. Redis Connection"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v redis-cli >/dev/null 2>&1; then
    if redis-cli ping >/dev/null 2>&1; then
        check_pass "Redis is running and responding"
    else
        check_warn "Redis not responding (run: docker-compose up -d redis)"
    fi
else
    check_warn "redis-cli not installed (optional)"
fi
echo ""

# 9. Check for old port references
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "9. Configuration Cleanup Check"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if grep -r "6001\|6000\|3001\|3000" .env >/dev/null 2>&1; then
    check_warn "Old port references found in .env"
fi

if grep -r "postgres" docker-compose.yml >/dev/null 2>&1; then
    check_warn "PostgreSQL references found in docker-compose.yml (should use SQLite)"
fi

if grep -r "localhost:6001\|localhost:6000" dist/assets/*.js 2>/dev/null | head -1 >/dev/null; then
    check_warn "Old port references in built frontend (rebuild needed)"
else
    check_pass "No old port references in built code"
fi
echo ""

# 10. Firewall Check
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "10. Firewall Status (Ubuntu)"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

if command -v ufw >/dev/null 2>&1; then
    UFW_STATUS=$(sudo ufw status 2>/dev/null || echo "no-sudo")
    if echo "$UFW_STATUS" | grep -q "Status: active"; then
        check_pass "UFW firewall is active"
        
        if echo "$UFW_STATUS" | grep -q "${API_PORT}"; then
            check_pass "Port ${API_PORT} allowed in UFW"
        else
            check_warn "Port ${API_PORT} not in UFW rules (run: sudo ufw allow ${API_PORT}/tcp)"
        fi
    else
        check_pass "UFW firewall inactive or not installed"
    fi
else
    check_pass "UFW not installed (likely not needed)"
fi
echo ""

# Summary
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                      Summary                               ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""
echo -e "${GREEN}Passed:   ${PASSED}${NC}"
echo -e "${YELLOW}Warnings: ${WARNINGS}${NC}"
echo -e "${RED}Failed:   ${FAILED}${NC}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ System is healthy!${NC}"
    echo ""
    echo "Access your application:"
    echo "  http://localhost:${API_PORT}"
    [ ! -z "$MACHINE_IP" ] && echo "  http://${MACHINE_IP}:${API_PORT}"
    exit 0
else
    echo -e "${RED}✗ Issues detected. Please fix the failures above.${NC}"
    exit 1
fi
