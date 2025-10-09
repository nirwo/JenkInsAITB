# 🚀 JenKinds One-Command Setup

Get JenKinds running on your server in minutes with a single command!

## 🚀 Get Started in 5 Minutes

### Prerequisites

- **Node.js** 20.10.0+ (check: `node --version`)
- **pnpm** 8.12.0+ (check: `pnpm --version`)
- **Docker** 24+ (check: `docker --version`)
- **Git** (check: `git --version`)

### Step 1: Environment Setup

Create a `.env` file in the project root:

```bash
cat > .env << 'EOF'
# Application
NODE_ENV=development
PORT=3000
API_PORT=3001

# Database
DATABASE_URL="postgresql://jenkinds:password@localhost:5432/jenkinds"

# Redis
REDIS_URL="redis://localhost:6379"

# Authentication
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=24h
REFRESH_TOKEN_SECRET=your-super-secret-refresh-key-change-this-in-production
REFRESH_TOKEN_EXPIRES_IN=7d

# Jenkins Configuration
JENKINS_URL=https://your-jenkins-instance.com
JENKINS_USER=your-username
JENKINS_API_TOKEN=your-api-token

# AI Services (Optional)
OPENAI_API_KEY=sk-your-openai-api-key
ENABLE_AI_ANALYSIS=false

# Monitoring
ENABLE_METRICS=true

# Logging
LOG_LEVEL=info
EOF
```

### Step 2: Start Infrastructure Services

```bash
# Start PostgreSQL, Redis, Prometheus, and Grafana
docker-compose up -d

# Verify services are running
docker-compose ps
```

Expected output:
```
NAME                COMMAND                  STATUS
jenkinds-postgres   "docker-entrypoint..."   Up (healthy)
jenkinds-redis      "docker-entrypoint..."   Up
jenkinds-prometheus "prometheus --config"    Up
jenkinds-grafana    "/run.sh"                Up
```

### Step 3: Database Setup

```bash
# Generate Prisma Client (already done if you followed install)
pnpm db:generate

# Run database migrations
pnpm db:migrate

# (Optional) Seed database with sample data
pnpm db:seed
```

### Step 4: Start Development Servers

```bash
# Start both frontend and backend
pnpm dev
```

This will start:
- **Frontend** at `http://localhost:6000`
- **Backend API** at `http://localhost:6001`
- **Metrics** at `http://localhost:6001/metrics`

### Step 5: Verify Installation

Open your browser and visit:
- **Application**: http://localhost:6000
- **Health Check**: http://localhost:6001/health
- **Ready Check**: http://localhost:6001/ready

You should see the login page!

---

## 📋 Common Commands

### Development

```bash
# Start development servers
pnpm dev

# Start only frontend
pnpm dev:client

# Start only backend
pnpm dev:server

# Run type checking
pnpm type-check

# Run linter
pnpm lint

# Format code
pnpm format
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Database

```bash
# Open Prisma Studio (Database GUI)
pnpm db:studio

# Create new migration
pnpm db:migrate

# Reset database (WARNING: Deletes all data)
pnpm db:reset

# Seed database
pnpm db:seed
```

### Docker

```bash
# Start all services
docker-compose up -d

# Stop all services
docker-compose down

# View logs
docker-compose logs -f

# Rebuild services
docker-compose up -d --build
```

---

## 🔧 Troubleshooting

### Port Already in Use

**Error**: `EADDRINUSE: address already in use :::6000`

**Solution**:
```bash
# Find process using port 3000
lsof -ti:6000

# Kill the process (replace <PID> with actual number)
kill -9 <PID>

# Or for port 3001
lsof -ti:6001 | xargs kill -9
```

### Database Connection Failed

**Error**: `Can't reach database server`

**Solution**:
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Redis Connection Failed

**Error**: `Redis connection error`

**Solution**:
```bash
# Check if Redis is running
docker-compose ps redis

# Restart Redis
docker-compose restart redis

# Test Redis connection
docker exec -it jenkinds-redis redis-cli ping
# Should return: PONG
```

### Module Not Found

**Error**: `Cannot find module ...`

**Solution**:
```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Regenerate Prisma Client
pnpm db:generate
```

### TypeScript Errors

**Solution**:
```bash
# Check for type errors
pnpm type-check

# Regenerate types
pnpm db:generate
```

---

## 🎯 Next Steps

### 1. Configure Jenkins Connection

Edit your `.env` file with your actual Jenkins credentials:

```bash
JENKINS_URL=https://your-jenkins-instance.com
JENKINS_USER=admin
JENKINS_API_TOKEN=11234567890abcdef
```

### 2. Enable AI Log Analysis (Optional)

Get an OpenAI API key from https://platform.openai.com/api-keys and add to `.env`:

```bash
OPENAI_API_KEY=sk-proj-your-actual-key-here
ENABLE_AI_ANALYSIS=true
```

### 3. Create Your First User

The application uses JWT authentication. You can:

**Option A**: Use the registration endpoint
```bash
curl -X POST http://localhost:6001/trpc/auth.register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@jenkinds.io",
    "password": "your-secure-password",
    "name": "Admin User"
  }'
```

**Option B**: Use Prisma Studio
```bash
pnpm db:studio
# Navigate to User table and create a user manually
# Note: Password must be bcrypt hashed
```

### 4. Explore the Application

Visit http://localhost:6000 and login with your credentials!

**Available Pages**:
- `/dashboard` - Overview of Jenkins jobs and builds
- `/jobs` - Manage and monitor Jenkins jobs
- `/executors` - Monitor Jenkins executors
- `/logs` - AI-powered log analysis
- `/analytics` - Performance analytics and insights

---

## 📊 Monitoring

### Prometheus Metrics

Visit http://localhost:9090 to access Prometheus UI

**Available Metrics**:
- HTTP request duration
- Request count by endpoint
- Error rates
- Database query performance
- Redis operations

### Grafana Dashboards

Visit http://localhost:6001 (default login: admin/admin)

Import the pre-configured dashboard from `prometheus.yml`

---

## 🔐 Security Notes

### Development vs Production

**⚠️ IMPORTANT**: The default `.env` values are for development only!

**Before deploying to production**:

1. **Change all secrets**:
   ```bash
   # Generate secure secrets
   openssl rand -base64 32  # For JWT_SECRET
   openssl rand -base64 32  # For REFRESH_TOKEN_SECRET
   ```

2. **Enable HTTPS**:
   - Use a reverse proxy (nginx, traefik)
   - Configure SSL certificates
   - Update CORS settings

3. **Secure database**:
   - Use strong passwords
   - Enable SSL connections
   - Restrict network access

4. **Rate limiting**:
   - Adjust rate limits based on your needs
   - Consider IP-based restrictions

5. **Environment variables**:
   - Use a secrets manager (AWS Secrets Manager, HashiCorp Vault)
   - Never commit `.env` to version control

---

## 📚 Additional Resources

- [Full Documentation](./Readme.MD)
- [Development Guide](./docs/DEVELOPMENT.md)
- [Contributing Guidelines](./CONTRIBUTING.md)
- [API Documentation](./docs/API.md) (coming soon)
- [Deployment Guide](./docs/DEPLOYMENT.md) (coming soon)

---

## 🆘 Getting Help

- **Issues**: https://github.com/your-org/jenkinds/issues
- **Discussions**: https://github.com/your-org/jenkinds/discussions
- **Email**: support@jenkinds.io

---

## ✅ Checklist

Use this checklist to verify your setup:

- [ ] Node.js 20.10+ installed
- [ ] pnpm 8.12+ installed
- [ ] Docker running
- [ ] `.env` file created with all required variables
- [ ] `docker-compose up -d` successful
- [ ] `pnpm db:migrate` successful
- [ ] `pnpm dev` starts both servers
- [ ] Can access http://localhost:6000
- [ ] Can access http://localhost:6001/health
- [ ] Jenkins credentials configured
- [ ] Can login to the application

**Status**: ✅ All checks passed? You're ready to rock! 🎸

---

**Happy monitoring! 🚀**
