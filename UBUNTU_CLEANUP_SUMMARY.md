# 🎯 Ubuntu Deployment & CORS Fix - Complete Summary

## What Was Fixed

### 1. ✅ PostgreSQL Removed
- **Removed from**: `docker-compose.yml`
- **Reason**: Using SQLite (file-based database)
- **Benefit**: Simpler setup, no container needed

### 2. ✅ Old Port References Updated
- **Changed**: 6000/6001 → 9010/9011
- **Updated Files**:
  - `.env.example`
  - `src/core/api/trpc.ts`
  - `scripts/start-production.ts`
  - `vite.config.ts` (now dynamic)

### 3. ✅ CORS Configuration Fixed
- **Issue**: Chrome was rejecting preflight responses
- **Fix**: Changed status from `200 OK` to `204 No Content`
- **Added**: Proper `Content-Type` and `Content-Length` headers
- **Result**: Compliant with CORS spec

### 4. ✅ Dynamic Configuration
- **vite.config.ts**: Now reads ports and hostname from `.env`
- **No more hardcoded values**: Everything driven by environment variables
- **Auto-detects**: Machine IP for remote access

### 5. ✅ Ubuntu Setup Scripts
Created three powerful scripts:

#### `scripts/ubuntu-setup.sh`
- Automated initial setup
- Checks prerequisites
- Installs dependencies
- Configures environment
- Builds application
- Detects machine IP automatically

#### `scripts/sanity-check.sh`
- Comprehensive diagnostics (10 checks)
- Verifies Node.js, files, database, ports
- Tests server health, CORS, tRPC
- Checks Redis and firewall
- Color-coded output (✓/⚠/✗)

#### `scripts/quick-start-ubuntu.sh`
- One-command startup
- Starts Redis automatically
- Launches production server
- Shows all access URLs
- Tails logs

## Current Architecture

### Production Mode (Port 9011)
```
Single Server on 9011:
├── Frontend (/)          # React SPA
├── Health (/health)      # Server status
├── Ready (/ready)        # Redis check
├── Metrics (/metrics)    # Prometheus metrics
└── tRPC (/trpc/*)        # All API endpoints
```

### Development Mode
```
Port 9010: Vite dev server (frontend)
Port 9011: Fastify server (API + tRPC)
```

### Services
- **SQLite**: `prisma/dev.db` (no container)
- **Redis**: Docker, port 6379 (caching)
- **Prometheus**: Docker, port 9090 (metrics)
- **Grafana**: Docker, port 9012 (monitoring)

## Files Changed

### Configuration Files
- ✅ `.env.example` - Updated to 9010/9011 ports
- ✅ `vite.config.ts` - Dynamic ports and hostname
- ✅ `docker-compose.yml` - Removed PostgreSQL
- ✅ `src/core/api/trpc.ts` - Port 9011 default
- ✅ `scripts/start-production.ts` - Port 9011 default

### Server Configuration
- ✅ `server/index.ts` - Fixed CORS preflight (204, Content-Type, Content-Length)

### New Documentation
- ✅ `UBUNTU_DEPLOYMENT.md` - Complete Ubuntu guide
- ✅ `UBUNTU_CLEANUP_SUMMARY.md` - This file

### New Scripts
- ✅ `scripts/ubuntu-setup.sh` - Automated setup
- ✅ `scripts/sanity-check.sh` - Comprehensive diagnostics
- ✅ `scripts/quick-start-ubuntu.sh` - Quick start

## Ubuntu Deployment - Quick Reference

### Fresh Clone from GitHub
```bash
# 1. Clone
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# 2. Setup (one time)
bash scripts/ubuntu-setup.sh

# 3. Start
bash scripts/quick-start-ubuntu.sh

# 4. Verify
bash scripts/sanity-check.sh
```

### Access URLs
```
Local:      http://localhost:9011
Remote:     http://YOUR_IP:9011
Health:     http://YOUR_IP:9011/health
Metrics:    http://YOUR_IP:9011/metrics
```

## CORS Configuration

### Preflight (OPTIONS) Response
```http
HTTP/1.1 204 No Content
Access-Control-Allow-Origin: http://YOUR_IP:9010
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
Access-Control-Expose-Headers: Content-Length, Content-Type
Access-Control-Max-Age: 86400
Content-Type: text/plain
Content-Length: 0
```

### Actual Request Response
```http
HTTP/1.1 200 OK
Access-Control-Allow-Origin: http://YOUR_IP:9010
Access-Control-Allow-Credentials: true
... (same CORS headers) ...
Content-Type: application/json
```

## Troubleshooting

### CORS Still Failing?
```bash
# 1. Rebuild frontend
pnpm build

# 2. Restart server
pkill -f "node dist/server"
NODE_ENV=production node dist/server/index.js

# 3. Test CORS
curl -X OPTIONS \
  -H "Origin: http://YOUR_IP:9010" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: content-type" \
  http://localhost:9011/trpc/auth.login
```

### Run Full Diagnostics
```bash
bash scripts/sanity-check.sh
```

This will show exactly what's wrong with color-coded output.

## What's Clean Now

✅ No PostgreSQL references  
✅ No old port numbers (3000/3001/6000/6001)  
✅ No hardcoded localhost (uses .env)  
✅ CORS properly configured (204 No Content)  
✅ Dynamic configuration (IP auto-detection)  
✅ Comprehensive setup scripts  
✅ Full diagnostics available  
✅ Ubuntu-optimized deployment  

## Production Deployment

### Option 1: PM2 (Recommended)
```bash
npm install -g pm2
pm2 start dist/server/index.js --name jenkinds
pm2 save
pm2 startup
```

### Option 2: systemd
```bash
sudo cp /path/to/jenkinds.service /etc/systemd/system/
sudo systemctl enable jenkinds
sudo systemctl start jenkinds
```

### Option 3: Docker
```bash
docker build -t jenkinds .
docker run -d -p 9011:9011 jenkinds
```

## Firewall (Ubuntu UFW)
```bash
sudo ufw allow 9011/tcp
sudo ufw enable
sudo ufw status
```

## Testing Checklist

- [ ] Server starts: `curl http://localhost:9011/health`
- [ ] Remote access works: `curl http://YOUR_IP:9011/health`
- [ ] CORS preflight: Returns 204 with proper headers
- [ ] tRPC working: Returns auth error (expected)
- [ ] Frontend loads: Open in browser
- [ ] Can login: Authentication works
- [ ] Sanity check passes: All green ✓

## Next Steps

1. **Test on Ubuntu**: Clone fresh and run setup script
2. **Verify CORS**: Open browser console, no errors
3. **Run sanity check**: Confirm all systems operational
4. **Deploy to production**: Use PM2 or systemd
5. **Configure firewall**: Allow port 9011
6. **Set up monitoring**: Grafana dashboard

## Support

- **Full Guide**: See `UBUNTU_DEPLOYMENT.md`
- **Diagnostics**: Run `bash scripts/sanity-check.sh`
- **Logs**: `tail -f logs/combined.log`
- **Issues**: Check server logs and CORS headers

---

**Status**: ✅ Ready for Ubuntu deployment  
**CORS**: ✅ Fixed (204 No Content with proper headers)  
**PostgreSQL**: ✅ Removed (using SQLite)  
**Ports**: ✅ Standardized (9010/9011)  
**Configuration**: ✅ Dynamic (from .env)  
**Scripts**: ✅ Complete (setup, start, diagnostics)
