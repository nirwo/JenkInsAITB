#!/bin/bash

###############################################################################
# JenKinds - Project Cleanup Script
# Removes unnecessary files and consolidates documentation
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo "╔════════════════════════════════════════════════════════════╗"
echo "║           JenKinds Project Cleanup                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

# Backup before cleanup
echo -e "${BLUE}📦 Creating backup...${NC}"
BACKUP_DIR="backups/cleanup-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$BACKUP_DIR"

# Files to remove
declare -a FILES_TO_REMOVE=(
    "COMMIT_SUMMARY.md"
    "CORS_DISABLED.md"
    "CORS_FULLY_DISABLED_SUMMARY.md"
    "DEPLOYMENT_STATUS.md"
    "DEV_REMOTE_ACCESS.md"
    "DEV_REMOTE_IMPLEMENTATION.md"
    "FEATURE_STATUS.md"
    "IMPLEMENTATION_SUMMARY.md"
    "PORT_CONFIG.md"
    "PORT_CONFIG_SUMMARY.md"
    "REMOTE_404_FIX.md"
    "SETUP_AUTOMATION.md"
    "SMART_FEATURES_README.md"
    "UBUNTU_CLEANUP_SUMMARY.md"
    "MACOS_VS_UBUNTU.md"
    "UBUNTU_CHECKLIST.md"
    "cors-test.html"
    ".env.bak"
    "1"
    "server.log"
)

# Old/redundant scripts to remove
declare -a SCRIPTS_TO_REMOVE=(
    "scripts/debug-remote.js"
    "scripts/configure-remote.js"
    "scripts/test-cors-complete.sh"
    "scripts/test-cors.sh"
    "scripts/start-dev-remote.ts"
    "scripts/diagnose-ubuntu.sh"
    "scripts/test-trpc-ubuntu.sh"
)

# Move files to backup and remove
echo -e "${YELLOW}🗑️  Removing unnecessary files...${NC}"
REMOVED_COUNT=0
for file in "${FILES_TO_REMOVE[@]}" "${SCRIPTS_TO_REMOVE[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$BACKUP_DIR/"
        rm "$file"
        echo -e "${GREEN}✓${NC} Removed: $file"
        ((REMOVED_COUNT++))
    fi
done

if [ $REMOVED_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC} No files to remove (already clean)"
fi

# Consolidate documentation
echo ""
echo -e "${BLUE}📚 Consolidating documentation...${NC}"

# Create docs directory if it doesn't exist
mkdir -p docs

# Move specific docs to docs folder
declare -a DOCS_TO_MOVE=(
    "ADMIN_CREDENTIALS.md"
    "AI_ANALYSIS_IMPLEMENTATION.md"
    "DESIGN_UPGRADE_GUIDE.md"
    "JENKINS_SETUP_GUIDE.md"
    "USER_MANAGEMENT.md"
)

MOVED_COUNT=0
for doc in "${DOCS_TO_MOVE[@]}"; do
    if [ -f "$doc" ]; then
        mv "$doc" "docs/"
        echo -e "${GREEN}✓${NC} Moved to docs/: $doc"
        ((MOVED_COUNT++))
    fi
done

if [ $MOVED_COUNT -eq 0 ]; then
    echo -e "${YELLOW}⚠${NC} No files to move (already organized)"
fi

# Clean up node_modules/.cache if it exists
if [ -d "node_modules/.cache" ]; then
    echo ""
    echo -e "${YELLOW}🧹 Cleaning cache...${NC}"
    rm -rf node_modules/.cache
    echo -e "${GREEN}✓${NC} Cache cleaned"
fi

# Remove .DS_Store files (macOS)
echo ""
echo -e "${YELLOW}🧹 Removing system files...${NC}"
DSSTORE_COUNT=$(find . -name ".DS_Store" -type f 2>/dev/null | wc -l | tr -d ' ')
find . -name ".DS_Store" -type f -delete 2>/dev/null || true
if [ "$DSSTORE_COUNT" -gt 0 ]; then
    echo -e "${GREEN}✓${NC} Removed $DSSTORE_COUNT .DS_Store files"
else
    echo -e "${GREEN}✓${NC} No system files found"
fi

# Update .gitignore
echo ""
echo -e "${BLUE}📝 Updating .gitignore...${NC}"
cat > .gitignore << 'GITIGNORE_END'
# Dependencies
node_modules/
.pnpm-store/

# Build output
dist/
build/
*.tsbuildinfo

# Environment files
.env
.env.local
.env.production
.env.*.local

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*
server.log

# IDE
.vscode/
.idea/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Testing
coverage/
.nyc_output/

# Prisma
prisma/dev.db
prisma/dev.db-journal

# Temporary files
*.tmp
*.temp
*.bak
backups/

# Debug
debug.log
.pnpm-debug.log
GITIGNORE_END

echo -e "${GREEN}✓${NC} .gitignore updated"

# Create consolidated README for docs
echo ""
echo -e "${BLUE}📝 Creating docs index...${NC}"
cat > docs/README.md << 'DOCS_README_END'
# JenKinds Documentation

This directory contains detailed documentation for JenKinds.

## 📚 Documentation Index

### Setup & Deployment
- [Quick Start](../QUICKSTART.md) - Get started in 5 minutes
- [Deployment Guide](../DEPLOYMENT_GUIDE.md) - Complete deployment instructions
- [Setup Guide](../SETUP_GUIDE.md) - Manual setup instructions

### Features & Configuration
- [Jenkins Setup Guide](JENKINS_SETUP_GUIDE.md) - Configure Jenkins integration
- [AI Analysis Implementation](AI_ANALYSIS_IMPLEMENTATION.md) - AI-powered log analysis
- [User Management](USER_MANAGEMENT.md) - User administration
- [Admin Credentials](ADMIN_CREDENTIALS.md) - Default credentials

### Design & UI
- [Design Upgrade Guide](DESIGN_UPGRADE_GUIDE.md) - UI/UX improvements

## 🔗 Quick Links

- [Main README](../Readme.MD)
- [Project Summary](../PROJECT_SUMMARY.md)
- [Project Structure](../PROJECT_STRUCTURE.md)
- [Status](../STATUS.md)
- [Architecture](../ARCHITECTURE.md)
- [Contributing](../CONTRIBUTING.md)
DOCS_README_END

echo -e "${GREEN}✓${NC} Documentation index created"

# Create PROJECT_STRUCTURE.md
echo ""
echo -e "${BLUE}📝 Creating project structure documentation...${NC}"
cat > PROJECT_STRUCTURE.md << 'STRUCTURE_END'
# JenKinds Project Structure

## 📁 Directory Layout

```
JenKinds/
├── src/                   # Frontend source code
│   ├── core/             # Core functionality
│   ├── features/         # Feature modules
│   └── shared/           # Shared resources
├── server/               # Backend source code
│   ├── modules/          # Feature modules
│   ├── common/           # Common utilities
│   └── infrastructure/   # Infrastructure
├── prisma/               # Database
├── scripts/              # Build & utility scripts
├── docs/                 # Documentation
├── docker-compose.yml    # Docker services
└── package.json          # Dependencies
```

## 📄 Essential Files

### Configuration
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` / `tsconfig.server.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `.env.example` - Environment variables template

### Documentation
- `Readme.MD` - Main project README
- `QUICKSTART.md` - 5-minute quick start
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `SETUP_GUIDE.md` - Manual setup guide
- `ARCHITECTURE.md` - System architecture

## 🎯 Key Commands

```bash
# Development
pnpm dev                  # Start dev servers
pnpm build               # Build for production
pnpm start               # Start production server

# Management
./manage.sh start        # Start server
./manage.sh stop         # Stop server
./manage.sh status       # Show status
./manage.sh logs         # View logs

# Database
pnpm prisma:generate     # Generate Prisma Client
pnpm prisma:push         # Push schema changes

# User Management
pnpm create:admin        # Create admin user
pnpm list:users          # List users
```

## 🌐 Access Points

- **Frontend**: http://localhost:9010 (dev) / http://localhost:9011 (prod)
- **Backend API**: http://localhost:9011
- **Health**: http://localhost:9011/health
- **tRPC**: http://localhost:9011/trpc
STRUCTURE_END

echo -e "${GREEN}✓${NC} Project structure documentation created"

# Summary
echo ""
echo "╔════════════════════════════════════════════════════════════╗"
echo "║                  Cleanup Complete!                         ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

if [ $REMOVED_COUNT -gt 0 ] || [ $MOVED_COUNT -gt 0 ]; then
    echo -e "${GREEN}✓ Files backed up to:${NC} $BACKUP_DIR"
    echo -e "${GREEN}✓ Removed $REMOVED_COUNT unnecessary files${NC}"
    echo -e "${GREEN}✓ Moved $MOVED_COUNT files to docs/${NC}"
else
    echo -e "${GREEN}✓ Project already clean - no changes needed${NC}"
    rm -rf "$BACKUP_DIR"
fi

echo -e "${GREEN}✓ Documentation consolidated${NC}"
echo -e "${GREEN}✓ .gitignore updated${NC}"
echo -e "${GREEN}✓ PROJECT_STRUCTURE.md created${NC}"
echo ""
echo -e "${BLUE}📊 Project Structure:${NC}"
echo "  Root Documentation:"
echo "    • Readme.MD (main)"
echo "    • QUICKSTART.md"
echo "    • DEPLOYMENT_GUIDE.md"
echo "    • SETUP_GUIDE.md"
echo "    • ARCHITECTURE.md"
echo "    • PROJECT_SUMMARY.md"
echo "    • PROJECT_STRUCTURE.md (NEW)"
echo "    • STATUS.md"
echo "    • CONTRIBUTING.md"
echo ""
echo "  Detailed Documentation:"
echo "    • docs/ (organized guides)"
echo ""

if [ $REMOVED_COUNT -gt 0 ] || [ $MOVED_COUNT -gt 0 ]; then
    echo -e "${YELLOW}📋 Next steps:${NC}"
    echo "  1. Review changes: git status"
    echo "  2. Test the system: ./scripts/sanity-check.sh"
    echo "  3. Commit changes: git add . && git commit -m 'chore: cleanup project structure'"
    echo "  4. Review backup: ls -la $BACKUP_DIR"
    echo "  5. Delete backup after verification: rm -rf $BACKUP_DIR"
else
    echo -e "${GREEN}✓ Project is clean and ready!${NC}"
fi

echo ""