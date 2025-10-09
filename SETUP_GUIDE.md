# 🚀 JenkInsAITB Setup Guide

Complete guide for setting up the Jenkins AI Troubleshooting Bot application.

---

## Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Setup (Automated)](#quick-setup-automated)
- [Manual Setup](#manual-setup)
- [Configuration](#configuration)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [Advanced Setup](#advanced-setup)

---

## Prerequisites

### Required

- **Node.js** 18+ ([Download](https://nodejs.org/))
- **Git** ([Download](https://git-scm.com/))
- **pnpm** (installed automatically by setup script)

### Optional

- **Docker** (for containerized deployment)
- **Jenkins** (for integration)
- **OpenAI API Key** (for AI-powered features)

### System Requirements

- **OS**: macOS, Linux, or Windows
- **RAM**: 2GB minimum, 4GB recommended
- **Disk Space**: 500MB minimum
- **Network**: Internet connection for dependencies

---

## Quick Setup (Automated)

### macOS / Linux

```bash
# Clone the repository
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Run the automated setup script
./setup.sh
```

### Windows (PowerShell)

```powershell
# Clone the repository
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Run the automated setup script
.\setup.ps1
```

### What the Script Does

The automated setup script will:

1. ✅ **Check system requirements** (Node.js, Git, pnpm)
2. ✅ **Configure environment variables** (interactive prompts)
3. ✅ **Install dependencies** (pnpm install)
4. ✅ **Initialize database** (Prisma setup)
5. ✅ **Create admin user** (interactive prompts)
6. ✅ **Test Jenkins connection** (if Jenkins is running)
7. ✅ **Generate startup scripts** (start-dev.sh, start-prod.sh)
8. ✅ **Optional: Build application** (production build)

---

## Manual Setup

If you prefer to set up manually or the automated script fails:

### 1. Install Dependencies

```bash
# Install pnpm (if not already installed)
npm install -g pnpm

# Install project dependencies
pnpm install
```

### 2. Configure Environment

```bash
# Copy the example environment file
cp .env.example .env

# Edit .env with your favorite editor
nano .env  # or vim, code, etc.
```

**Required environment variables:**

```bash
# Jenkins Configuration
JENKINS_URL=http://localhost:8080
JENKINS_USER=your-jenkins-username
JENKINS_API_TOKEN=your-jenkins-api-token

# Database (SQLite - already configured)
DATABASE_URL="file:./prisma/dev.db"

# Security (generate using: openssl rand -base64 32)
JWT_SECRET=your-jwt-secret-here
SESSION_SECRET=your-session-secret-here

# AI Features (Optional)
OPENAI_API_KEY=your-openai-api-key  # Optional
ENABLE_AI_ANALYSIS=false  # Set to true if you have OpenAI key
```

### 3. Initialize Database

```bash
# Generate Prisma client
pnpm prisma generate

# Create database schema
pnpm prisma db push
```

### 4. Create Admin User

**Option A: Using the script**

```bash
./scripts/create-admin.sh
```

**Option B: Using Prisma Studio**

```bash
# Open Prisma Studio
pnpm db:studio

# Manually create a user with:
# - role: ADMIN
# - password: (use bcrypt hash)
```

**Option C: Using Node.js directly**

```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  const password = await bcrypt.hash('your-password', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      password: password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });
  console.log('Admin user created!');
  await prisma.\$disconnect();
})();
"
```

### 5. Start the Application

**Development mode:**

```bash
pnpm dev
```

**Production mode:**

```bash
# Build the application
pnpm build

# Start the server
pnpm start
```

---

## Configuration

### Jenkins Setup

1. **Get Jenkins API Token:**
   - Login to Jenkins
   - Go to: User Menu → Configure → API Token
   - Click "Add new Token"
   - Copy the generated token

2. **Configure in .env:**
   ```bash
   JENKINS_URL=http://your-jenkins-server:8080
   JENKINS_USER=your-username
   JENKINS_API_TOKEN=your-api-token
   ```

3. **Test Connection:**
   ```bash
   curl -u username:api-token http://localhost:8080/api/json
   ```

### OpenAI Setup (Optional)

1. **Get API Key:**
   - Go to: https://platform.openai.com/api-keys
   - Create new API key
   - Copy the key (starts with `sk-`)

2. **Configure in .env:**
   ```bash
   OPENAI_API_KEY=sk-your-key-here
   ENABLE_AI_ANALYSIS=true
   ```

3. **Test AI Features:**
   - Navigate to a build log
   - Click "AI Analysis" button
   - Should see intelligent error analysis

### Security Configuration

**Generate secure secrets:**

```bash
# On macOS/Linux
openssl rand -base64 32

# On Windows (PowerShell)
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Update .env:**

```bash
JWT_SECRET=<generated-secret-1>
SESSION_SECRET=<generated-secret-2>
```

---

## Verification

### 1. Check Application Status

```bash
# Application should start on:
# - Frontend: http://localhost:3000
# - Backend API: http://localhost:3001
```

### 2. Verify Database

```bash
# Open Prisma Studio
pnpm db:studio

# Should show:
# - User table with admin user
# - Empty Jenkins instances, jobs, builds tables
```

### 3. Test Login

1. Open browser: http://localhost:3000
2. Login with admin credentials
3. Should redirect to Dashboard

### 4. Test Jenkins Connection

```bash
# Using the application
# 1. Go to Settings → Jenkins Instances
# 2. Click "Test Connection"
# 3. Should show: ✅ Connected

# Using terminal
curl -u username:token http://localhost:8080/api/json
```

### 5. Verify Features

- ✅ **Dashboard**: Shows KPIs and statistics
- ✅ **Jobs**: List Jenkins jobs
- ✅ **Builds**: View build history
- ✅ **Logs**: Smart log viewer works
- ✅ **Agents**: Agent monitoring page
- ✅ **Settings**: Configuration pages

---

## Troubleshooting

### Issue: Dependencies Installation Failed

```bash
# Clear cache and reinstall
pnpm store prune
rm -rf node_modules
pnpm install
```

### Issue: Database Connection Error

```bash
# Reset database
rm prisma/dev.db
pnpm prisma db push

# Recreate admin user
./scripts/create-admin.sh
```

### Issue: Port Already in Use

```bash
# Change ports in .env
PORT=3002              # Frontend
BACKEND_PORT=3003      # Backend

# Or kill existing process
# macOS/Linux
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### Issue: Jenkins Connection Failed

**Check 1: Jenkins is running**
```bash
curl http://localhost:8080
```

**Check 2: Credentials are correct**
```bash
curl -u username:token http://localhost:8080/api/json
```

**Check 3: CORS settings**
```bash
# Jenkins may need CORS configuration
# Go to: Manage Jenkins → Configure System → CSRF Protection
```

**Check 4: Network accessibility**
```bash
# If Jenkins is on different machine
ping jenkins-server-ip
telnet jenkins-server-ip 8080
```

### Issue: OpenAI API Errors

**Check 1: API key is valid**
- Go to: https://platform.openai.com/api-keys
- Verify key is active

**Check 2: Billing is set up**
- OpenAI requires payment method
- Check: https://platform.openai.com/account/billing

**Check 3: Rate limits**
```bash
# Check your usage
# https://platform.openai.com/account/usage
```

### Issue: TypeScript Compilation Errors

```bash
# Clean build artifacts
rm -rf dist
rm -rf .vite

# Rebuild
pnpm build
```

### Issue: Permission Denied (macOS/Linux)

```bash
# Make scripts executable
chmod +x setup.sh
chmod +x start-dev.sh
chmod +x start-prod.sh
chmod +x scripts/*.sh
```

### Issue: Prisma Client Not Generated

```bash
# Regenerate Prisma client
pnpm prisma generate

# If still failing, clear and regenerate
rm -rf node_modules/.prisma
pnpm prisma generate
```

---

## Advanced Setup

### Docker Setup

```bash
# Build Docker image
docker build -t jenkinsdtb:latest .

# Run with Docker Compose
docker-compose up -d

# Access application
open http://localhost:3000
```

### Production Deployment

**Using PM2:**

```bash
# Install PM2
npm install -g pm2

# Build application
pnpm build

# Start with PM2
pm2 start npm --name "jenkinsdtb" -- start

# Save PM2 configuration
pm2 save

# Setup startup script
pm2 startup
```

**Using systemd (Linux):**

```bash
# Create service file
sudo nano /etc/systemd/system/jenkinsdtb.service

# Add configuration:
[Unit]
Description=JenkInsAITB
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/JenkInsAITB
ExecStart=/usr/bin/npm start
Restart=on-failure

[Install]
WantedBy=multi-user.target

# Enable and start service
sudo systemctl enable jenkinsdtb
sudo systemctl start jenkinsdtb
```

### Environment-Specific Configuration

**Development (.env.development):**
```bash
NODE_ENV=development
LOG_LEVEL=debug
ENABLE_MOCK_DATA=true
```

**Production (.env.production):**
```bash
NODE_ENV=production
LOG_LEVEL=info
ENABLE_MOCK_DATA=false
ENABLE_METRICS=true
```

### Multiple Jenkins Instances

```bash
# Configure in Settings UI
# Or edit database directly:
pnpm db:studio

# Add multiple Jenkins instances:
# 1. Name: "Production"
#    URL: http://jenkins-prod:8080
# 2. Name: "Staging"
#    URL: http://jenkins-staging:8080
```

### SSL/TLS Configuration

```bash
# Generate self-signed certificate (development)
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365 -nodes

# Update server configuration
# server/index.ts:
const https = require('https');
const fs = require('fs');

const options = {
  key: fs.readFileSync('key.pem'),
  cert: fs.readFileSync('cert.pem')
};

https.createServer(options, app).listen(3001);
```

### Load Balancer Setup

See: `server/infrastructure/loadbalancer/jenkins-loadbalancer.ts`

```typescript
// Automatically distributes requests across multiple Jenkins instances
// Includes health checks and failover
```

---

## Next Steps

After successful setup:

1. **📖 Read Documentation**
   - [SMART_FEATURES_README.md](./SMART_FEATURES_README.md) - Feature overview
   - [ARCHITECTURE.md](./ARCHITECTURE.md) - System architecture
   - [SECURITY.md](./SECURITY.md) - Security best practices

2. **🔧 Configure Jenkins**
   - Add Jenkins instance in Settings
   - Test connection
   - Sync jobs and builds

3. **👥 Create Users**
   - Add team members in Settings → Users
   - Assign appropriate roles (ADMIN, USER, VIEWER)

4. **📊 Explore Features**
   - Dashboard KPIs
   - Smart log analysis
   - Agent monitoring
   - Build history

5. **🚀 Deploy to Production**
   - Follow production deployment guide
   - Set up monitoring
   - Configure backups

---

## Support

- **Documentation**: Check the `/docs` folder
- **Issues**: https://github.com/nirwo/JenkInsAITB/issues
- **Security**: See [SECURITY.md](./SECURITY.md)

---

## Quick Command Reference

```bash
# Development
pnpm dev              # Start dev server with hot reload
pnpm build            # Build for production
pnpm start            # Start production server

# Database
pnpm db:studio        # Open Prisma Studio GUI
pnpm db:push          # Push schema changes
pnpm db:migrate       # Create migration

# Testing
pnpm test             # Run all tests
pnpm test:unit        # Run unit tests
pnpm test:e2e         # Run E2E tests

# Maintenance
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm clean            # Clean build artifacts

# Docker
docker-compose up     # Start with Docker
docker-compose down   # Stop Docker containers
```

---

**Happy troubleshooting! 🚀**
