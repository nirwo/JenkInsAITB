#!/bin/bash

# Quick Start Script for JenKinds on Ubuntu

set -e

echo "🚀 JenKinds Quick Start"
echo ""

# Check if setup was run
if [ ! -f .env ]; then
    echo "❌ Setup not complete. Running setup first..."
    bash scripts/ubuntu-setup.sh
    echo ""
fi

# Load environment
export $(cat .env | grep -v '^#' | xargs) 2>/dev/null || true

API_PORT=${API_PORT:-9011}

echo "Starting services..."
echo ""

# Start Redis if not running
if ! docker ps | grep -q jenkinds-redis; then
    echo "📦 Starting Redis..."
    docker-compose up -d redis
    sleep 2
fi

# Check if already built
if [ ! -d "dist" ]; then
    echo "🔨 Building application..."
    pnpm build
fi

# Start the production server
echo "🚀 Starting production server on port ${API_PORT}..."
echo ""
NODE_ENV=production node dist/server/index.js &
SERVER_PID=$!

# Wait for server to start
echo "Waiting for server to start..."
for i in {1..30}; do
    if curl -s -f http://localhost:${API_PORT}/health >/dev/null 2>&1; then
        echo ""
        echo "✅ Server started successfully!"
        break
    fi
    echo -n "."
    sleep 1
done

echo ""
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║              JenKinds is Running! ✓                        ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Get machine IP
MACHINE_IP=$(hostname -I 2>/dev/null | awk '{print $1}' || echo "localhost")

echo "Access URLs:"
echo "  Local:      http://localhost:${API_PORT}"
echo "  Remote:     http://${MACHINE_IP}:${API_PORT}"
echo "  Health:     http://${MACHINE_IP}:${API_PORT}/health"
echo "  Metrics:    http://${MACHINE_IP}:${API_PORT}/metrics"
echo ""
echo "Server PID: ${SERVER_PID}"
echo "Logs: tail -f logs/combined.log"
echo ""
echo "To stop: kill ${SERVER_PID}"
echo ""

# Keep script running and tail logs
trap "kill $SERVER_PID 2>/dev/null" EXIT
tail -f logs/combined.log 2>/dev/null || sleep infinity
