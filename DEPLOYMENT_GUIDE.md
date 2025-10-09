# Deployment Guide

## Prerequisites

- **Node.js 20+** (use `nvm install 20 && nvm use 20`)
- **pnpm 8+** (installed automatically by setup script)
- **Git**
- **PostgreSQL** or **SQLite** (for database)
- **Redis** (for caching and sessions)

## Quick Deployment

### 1. Clone and Setup

```bash
# Clone the repository
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Ensure Node.js 20 is active
nvm use 20

# Run automated setup
./setup.sh
```

### 2. Build for Production

```bash
# Build both client and server
pnpm build

# This will:
# 1. Compile TypeScript client code
# 2. Bundle React app with Vite
# 3. Compile TypeScript server code to CommonJS
# 4. Create dist/server/package.json to mark as CommonJS
```

### 3. Start Production Server

```bash
# Start the server
pnpm start

# Or directly with node
node dist/server/index.js
```

## Manual Deployment Steps

### Step 1: Install Dependencies

```bash
# Install Node.js 20
nvm install 20
nvm use 20

# Install pnpm
npm install -g pnpm@8

# Install project dependencies
pnpm install
```

### Step 2: Configure Environment

Create `.env` file:

```bash
# Database
DATABASE_URL="file:./prisma/dev.db"  # SQLite (default)
# DATABASE_URL="postgresql://user:pass@localhost:5432/jenkinds"  # PostgreSQL

# Jenkins
JENKINS_URL="http://your-jenkins-url:8080"
JENKINS_USERNAME="your-username"
JENKINS_API_TOKEN="your-api-token"

# Server
API_PORT=3001
CLIENT_PORT=3000

# Security
JWT_SECRET="your-generated-secret"
SESSION_SECRET="your-generated-secret"

# Redis
REDIS_URL="redis://localhost:6379"

# Optional: OpenAI
OPENAI_API_KEY="your-openai-key"
```

### Step 3: Database Setup

```bash
# Generate Prisma Client
pnpm db:generate

# Push schema to database
pnpm db:push

# Create admin user
pnpm setup:admin
```

### Step 4: Build Application

```bash
# Clean previous builds (optional)
rm -rf dist

# Build for production
pnpm build
```

**Build Output:**
- `dist/` - Client static files (index.html, assets, etc.)
- `dist/server/` - Compiled server code (CommonJS)
- `dist/server/package.json` - Marks server as CommonJS module

### Step 5: Start Server

```bash
# Production start
pnpm start

# The server will:
# - Serve client files from dist/
# - Run API server on port 3001
# - Connect to Jenkins and sync data
# - Provide tRPC endpoints at /trpc
```

## Docker Deployment

### Build Docker Image

```bash
docker build -t jenkinds:latest .
```

### Run with Docker Compose

```bash
# Start all services (PostgreSQL, Redis, Prometheus, Grafana)
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Environment Variables for Docker

Create `.env` file for docker-compose:

```bash
POSTGRES_USER=jenkinds
POSTGRES_PASSWORD=your-secure-password
POSTGRES_DB=jenkinds

DATABASE_URL=postgresql://jenkinds:your-secure-password@postgres:5432/jenkinds

JENKINS_URL=http://your-jenkins:8080
JENKINS_USERNAME=admin
JENKINS_API_TOKEN=your-token

JWT_SECRET=generated-secret
SESSION_SECRET=generated-secret

REDIS_URL=redis://redis:6379
```

## Troubleshooting

### Module Not Found Errors

**Symptom:** `Cannot find module 'logs/log.router'` or `Cannot find module './router'`

**Cause:** The `dist/server/package.json` file is missing or build didn't complete

**Solution:**
```bash
# Clean and rebuild
rm -rf dist
pnpm build

# Verify dist/server/package.json exists
cat dist/server/package.json
# Should output: { "type": "commonjs" }

# If missing, run post-build script manually
node scripts/post-build-server.cjs
```

### ES Module vs CommonJS Errors

**Symptom:** `exports is not defined in ES module scope` or `require is not defined`

**Cause:** Module type mismatch between root and dist/server

**Solution:**
- Root `package.json` has `"type": "module"` (for client)
- `dist/server/package.json` has `"type": "commonjs"` (for server)
- Both are needed and created automatically by the build process

### Build Fails on Remote System

**Symptom:** Build succeeds locally but fails on remote

**Causes & Solutions:**

1. **Node.js version mismatch**
   ```bash
   # Ensure Node.js 20
   node --version  # Should be v20.x.x
   nvm use 20
   ```

2. **Missing dependencies**
   ```bash
   # Clean install
   rm -rf node_modules pnpm-lock.yaml
   pnpm install --frozen-lockfile
   ```

3. **Build script not running**
   ```bash
   # Run build steps manually
   pnpm build:client
   pnpm build:server
   
   # Verify post-build ran
   ls -la dist/server/package.json
   ```

### Server Won't Start

**Symptom:** `node dist/server/index.js` fails

**Check:**

1. **dist/server/package.json exists**
   ```bash
   cat dist/server/package.json
   ```

2. **All files compiled**
   ```bash
   ls dist/server/modules/logs/
   # Should show log.router.js
   ```

3. **Database is accessible**
   ```bash
   pnpm prisma validate
   pnpm db:push
   ```

4. **Redis is running**
   ```bash
   redis-cli ping
   # Should output: PONG
   ```

## Performance Optimization

### 1. Database

For production, use PostgreSQL instead of SQLite:

```bash
# Update .env
DATABASE_URL="postgresql://user:pass@host:5432/db"

# Migrate
pnpm db:push
```

### 2. Caching

Ensure Redis is properly configured:

```bash
# Check Redis connection
redis-cli
> ping
PONG
> keys *
```

### 3. Process Management

Use PM2 for process management:

```bash
# Install PM2
npm install -g pm2

# Start with PM2
pm2 start dist/server/index.js --name jenkinds

# Save configuration
pm2 save
pm2 startup
```

### 4. Reverse Proxy

Use Nginx for better performance:

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Client files
    location / {
        root /path/to/jenkinds/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # WebSocket
    location /ws {
        proxy_pass http://localhost:6001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
    }
}
```

## Health Checks

### Server Health

```bash
# HTTP health check
curl http://localhost:6001/health

# tRPC endpoint
curl http://localhost:6001/trpc
```

### Database Health

```bash
# Prisma Studio
pnpm prisma studio

# Check connection
pnpm prisma db pull
```

### Redis Health

```bash
redis-cli ping
```

## Monitoring

- **Metrics**: http://localhost:6001/metrics (Prometheus format)
- **Grafana**: http://localhost:6002 (if using docker-compose)
- **Logs**: `logs/combined.log` and `logs/error.log`

## Backup

### Database Backup

**SQLite:**
```bash
cp prisma/dev.db prisma/dev.db.backup
```

**PostgreSQL:**
```bash
pg_dump -U jenkinds jenkinds > backup.sql
```

### Configuration Backup

```bash
# Backup .env
cp .env .env.backup

# Backup database
tar -czf backup-$(date +%Y%m%d).tar.gz .env prisma/
```

## Scaling

### Horizontal Scaling

1. Use PostgreSQL (not SQLite)
2. Use Redis for session storage
3. Run multiple server instances
4. Use a load balancer

### Load Balancing

The application supports multiple Jenkins instances with built-in load balancing:

1. Add multiple Jenkins instances via the UI
2. Configure priority and max connections
3. The load balancer will distribute requests automatically

## Security Checklist

- [ ] Change default JWT_SECRET and SESSION_SECRET
- [ ] Use strong Jenkins API tokens
- [ ] Enable HTTPS in production
- [ ] Configure firewall rules
- [ ] Use environment variables (not hardcoded secrets)
- [ ] Regular database backups
- [ ] Update dependencies regularly
- [ ] Use PostgreSQL with SSL in production
- [ ] Configure Redis authentication

## Updates

### Updating the Application

```bash
# Pull latest changes
git pull origin master

# Install dependencies
pnpm install

# Rebuild
pnpm build

# Migrate database if needed
pnpm db:push

# Restart server
pm2 restart jenkinds
# Or
pnpm start
```

---

**Support:** https://github.com/nirwo/JenkInsAITB/issues
**Documentation:** See README.md and docs/ folder
