# 🚀 Ubuntu Deployment Guide

Complete guide for deploying JenKinds on Ubuntu (fresh clone from GitHub).

## Quick Start (5 minutes)

```bash
# 1. Clone the repository
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# 2. Run automated setup
chmod +x scripts/ubuntu-setup.sh
bash scripts/ubuntu-setup.sh

# 3. Start the application
chmod +x scripts/quick-start-ubuntu.sh
bash scripts/quick-start-ubuntu.sh
```

That's it! Your application is running.

---

## Prerequisites

### Required
- **Ubuntu** 20.04+ (also works on 22.04, 24.04)
- **Node.js** 20+ 
- **Docker** (for Redis, optional)
- **Git**

### Install Prerequisites

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install pnpm
npm install -g pnpm

# Install Docker (optional, for Redis)
sudo apt install -y docker.io docker-compose
sudo systemctl start docker
sudo systemctl enable docker
sudo usermod -aG docker $USER
```

Logout and login again for Docker permissions to take effect.

---

## Architecture

### Production Mode (Single Server)
```
Port 9011: Everything on one server
├── Frontend (/)          → React SPA
├── API (/health, /ready) → Health checks
└── tRPC (/trpc/*)        → All API endpoints
```

### Database
- **SQLite** (file-based, no container needed)
- Location: `prisma/dev.db`
- No PostgreSQL required

### Services
- **Redis** (Docker) - Port 6379
- **Prometheus** (Docker) - Port 9090  
- **Grafana** (Docker) - Port 9012

---

## Configuration

### Ports
- **Frontend Dev**: 9010 (development mode only)
- **Backend/API**: 9011 (production & development)
- **Grafana**: 9012

### Environment Variables
All configuration is in `.env` (auto-generated during setup):

```bash
PORT=9010                # Frontend dev server
API_PORT=9011            # Backend API
APP_URL=http://YOUR_IP:9011
API_URL=http://YOUR_IP:9011
VITE_API_URL=http://YOUR_IP:9011
DATABASE_URL="file:./prisma/dev.db"  # SQLite
```

---

## Deployment Steps

### Step 1: Clone Repository
```bash
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB
```

### Step 2: Run Setup
```bash
chmod +x scripts/ubuntu-setup.sh
bash scripts/ubuntu-setup.sh
```

This script will:
- ✅ Check Node.js version
- ✅ Install dependencies (`pnpm install`)
- ✅ Generate `.env` with your machine IP
- ✅ Initialize SQLite database
- ✅ Build the application
- ✅ Check firewall settings

### Step 3: Start Services
```bash
# Start Redis (required)
docker-compose up -d redis

# Start application
bash scripts/quick-start-ubuntu.sh

# OR manually
NODE_ENV=production node dist/server/index.js
```

### Step 4: Verify
```bash
# Run sanity checks
chmod +x scripts/sanity-check.sh
bash scripts/sanity-check.sh
```

---

## Firewall Configuration

### UFW (Ubuntu Firewall)

```bash
# Allow ports
sudo ufw allow 9011/tcp   # API/Frontend
sudo ufw allow 9012/tcp   # Grafana
sudo ufw allow 6379/tcp   # Redis (if external access needed)

# Enable firewall
sudo ufw enable

# Check status
sudo ufw status
```

### Check if ports are accessible

```bash
# From the server
curl http://localhost:9011/health

# From another machine
curl http://YOUR_SERVER_IP:9011/health
```

---

## Troubleshooting

### Run Diagnostics
```bash
bash scripts/sanity-check.sh
```

This comprehensive check will verify:
- ✅ Node.js version
- ✅ Files and build status
- ✅ Database
- ✅ Port availability
- ✅ Server health
- ✅ CORS configuration
- ✅ tRPC endpoints
- ✅ Redis connection
- ✅ Firewall rules

### Common Issues

#### 1. CORS Errors
**Symptom**: "Access-Control-Allow-Origin" errors in browser

**Solution**:
```bash
# Rebuild with correct configuration
pnpm build

# Restart server
pkill -f "node dist/server"
NODE_ENV=production node dist/server/index.js
```

#### 2. Port Already in Use
**Symptom**: "EADDRINUSE" error

**Solution**:
```bash
# Find what's using the port
sudo lsof -i :9011
# or
sudo ss -tulpn | grep 9011

# Kill the process
sudo kill -9 <PID>
```

#### 3. Server Not Accessible Remotely
**Symptom**: Works on localhost but not via IP

**Solution**:
```bash
# Check server is listening on 0.0.0.0
sudo netstat -tulpn | grep 9011
# Should show: 0.0.0.0:9011 (not 127.0.0.1:9011)

# Check firewall
sudo ufw status
sudo ufw allow 9011/tcp

# Test from server
curl http://localhost:9011/health

# Test from another machine
curl http://YOUR_SERVER_IP:9011/health
```

#### 4. Redis Connection Failed
**Symptom**: Redis errors in logs

**Solution**:
```bash
# Start Redis
docker-compose up -d redis

# Verify Redis is running
docker ps | grep redis
redis-cli ping  # Should return: PONG
```

#### 5. Database Errors
**Symptom**: Prisma/SQLite errors

**Solution**:
```bash
# Regenerate database
rm -f prisma/dev.db
pnpm prisma generate
pnpm prisma db push

# Or migrate
pnpm prisma migrate deploy
```

---

## Production Deployment

### Using PM2 (Recommended)

```bash
# Install PM2
npm install -g pm2

# Start application
pm2 start dist/server/index.js --name jenkinds

# Save PM2 configuration
pm2 save

# Auto-start on boot
pm2 startup
# Follow the instructions printed

# Manage
pm2 status
pm2 logs jenkinds
pm2 restart jenkinds
pm2 stop jenkinds
```

### Using systemd

```bash
# Create service file
sudo nano /etc/systemd/system/jenkinds.service
```

```ini
[Unit]
Description=JenKinds Application
After=network.target

[Service]
Type=simple
User=YOUR_USERNAME
WorkingDirectory=/path/to/JenkInsAITB
Environment="NODE_ENV=production"
ExecStart=/usr/bin/node dist/server/index.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
```

```bash
# Enable and start
sudo systemctl daemon-reload
sudo systemctl enable jenkinds
sudo systemctl start jenkinds

# Check status
sudo systemctl status jenkinds

# View logs
sudo journalctl -u jenkinds -f
```

### Using Docker

```bash
# Build image
docker build -t jenkinds:latest .

# Run container
docker run -d \
  --name jenkinds \
  -p 9011:9011 \
  -v $(pwd)/prisma:/app/prisma \
  -v $(pwd)/logs:/app/logs \
  --restart unless-stopped \
  jenkinds:latest
```

---

## Monitoring

### Health Check
```bash
curl http://localhost:9011/health
# Returns: {"status":"ok","timestamp":"...","uptime":123.45}
```

### Metrics (Prometheus)
```bash
curl http://localhost:9011/metrics
```

### Grafana Dashboard
Access at: `http://YOUR_SERVER_IP:9012`
- Username: `admin`
- Password: `admin`

---

## Maintenance

### Update Application
```bash
# Pull latest changes
git pull origin master

# Install dependencies
pnpm install

# Rebuild
pnpm build

# Restart
pm2 restart jenkinds
# or
sudo systemctl restart jenkinds
```

### Backup Database
```bash
# SQLite is just a file
cp prisma/dev.db prisma/dev.db.backup

# Or use cron for automatic backups
crontab -e
# Add: 0 2 * * * cp /path/to/JenkInsAITB/prisma/dev.db /path/to/backups/dev.db.$(date +\%Y\%m\%d)
```

### View Logs
```bash
# Application logs
tail -f logs/combined.log

# Error logs only
tail -f logs/error.log

# PM2 logs
pm2 logs jenkinds

# systemd logs
sudo journalctl -u jenkinds -f
```

---

## Security Checklist

- [ ] Change JWT secrets in `.env`
- [ ] Set strong admin password
- [ ] Enable UFW firewall
- [ ] Use HTTPS in production (nginx + Let's Encrypt)
- [ ] Keep Node.js and dependencies updated
- [ ] Regular database backups
- [ ] Monitor logs for suspicious activity
- [ ] Restrict Redis access (localhost only)

---

## Performance Tuning

### For Production
```bash
# In .env
NODE_ENV=production
ENABLE_CACHING=true
CACHE_TTL=300
RATE_LIMIT_MAX_REQUESTS=100
```

### Nginx Reverse Proxy (Optional)
```nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:9011;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }
}
```

---

## Support

- **Documentation**: See `/docs` folder
- **Issues**: https://github.com/nirwo/JenkInsAITB/issues
- **Sanity Check**: `bash scripts/sanity-check.sh`

---

## Clean Installation Commands

```bash
# Complete fresh start
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB
chmod +x scripts/ubuntu-setup.sh scripts/quick-start-ubuntu.sh scripts/sanity-check.sh
bash scripts/ubuntu-setup.sh
bash scripts/quick-start-ubuntu.sh

# Wait for server to start, then in another terminal:
bash scripts/sanity-check.sh
```

Done! 🎉
