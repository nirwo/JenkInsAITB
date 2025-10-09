# Development Mode with Remote Access

This guide explains how to run the development environment accessible from remote machines via your machine's IP address.

## Quick Start

### Option 1: Automatic Remote Dev Mode (Recommended)

```bash
pnpm dev:remote
```

This automatically:
- ✅ Detects your machine IP address
- ✅ Updates `.env` file with correct URLs
- ✅ Starts both frontend and backend dev servers
- ✅ Configures servers to listen on all network interfaces

### Option 2: Manual Configuration

If you prefer manual control:

```bash
# 1. Get your machine IP
node -e "console.log(require('os').networkInterfaces().en0.find(i => i.family === 'IPv4').address)"

# 2. Update .env file
# Edit .env and set:
APP_URL=http://[your-ip]:6000
API_URL=http://[your-ip]:6001
VITE_API_URL=http://[your-ip]:6001

# 3. Start dev servers
pnpm dev
```

## Access URLs

After starting with `pnpm dev:remote`:

- **Frontend (Local):** `http://localhost:6000`
- **Frontend (Remote):** `http://[your-machine-ip]:6000`
- **Backend API (Local):** `http://localhost:6001`
- **Backend API (Remote):** `http://[your-machine-ip]:6001`

Example with IP `10.100.102.29`:
- Frontend: `http://10.100.102.29:6000`
- Backend: `http://10.100.102.29:6001`

## How It Works

### Frontend Dev Server (Vite)
- Configured to listen on `0.0.0.0` (all network interfaces)
- Uses `VITE_API_URL` environment variable for API endpoint
- Hot module replacement (HMR) works on remote connections
- Proxy configured for `/api` and `/ws` endpoints

### Backend Dev Server (Fastify)
- Already configured to listen on `0.0.0.0` (see `server/index.ts`)
- CORS completely disabled (allows all origins)
- Live reload with `tsx watch`
- Supports WebSocket connections

## Configuration Details

### vite.config.ts
```typescript
server: {
  host: '0.0.0.0', // Listen on all network interfaces
  port: 6000,
  proxy: {
    '/api': {
      target: process.env.VITE_API_URL || 'http://localhost:6001',
      changeOrigin: true,
    },
    '/ws': {
      target: process.env.VITE_API_URL?.replace('http', 'ws') || 'ws://localhost:6001',
      ws: true,
    },
  },
}
```

### server/index.ts
```typescript
const PORT = Number(process.env.API_PORT) || 6001;
const HOST = '0.0.0.0'; // All network interfaces
```

## Troubleshooting

### Cannot Access from Remote Device

**1. Check Firewall**

macOS:
```bash
# Allow Node.js through firewall
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

Windows:
```powershell
# Allow ports through Windows Firewall
New-NetFirewallRule -DisplayName "Dev Frontend" -Direction Inbound -LocalPort 6000 -Protocol TCP -Action Allow
New-NetFirewallRule -DisplayName "Dev Backend" -Direction Inbound -LocalPort 6001 -Protocol TCP -Action Allow
```

**2. Verify Servers are Listening**

```bash
# Check if servers are bound to 0.0.0.0
netstat -an | grep 6000
netstat -an | grep 6001

# Should show:
# *.6000 or 0.0.0.0:6000
# *.6001 or 0.0.0.0:6001
```

**3. Check Network Connection**

```bash
# From remote device, test connectivity
ping [your-machine-ip]
curl http://[your-machine-ip]:6001/health
```

**4. Verify Environment Variables**

```bash
# Check current configuration
cat .env | grep -E "(APP_URL|API_URL|VITE_API_URL)"
```

### Hot Module Replacement (HMR) Not Working Remotely

If HMR doesn't work when accessing via IP:

1. **Clear browser cache**
2. **Hard refresh:** `Cmd+Shift+R` (Mac) or `Ctrl+Shift+F5` (Windows)
3. **Check WebSocket connection** in DevTools > Network > WS tab

The Vite dev server should automatically handle WebSocket connections via IP.

### API Requests Failing

**Check CORS:**
- Backend has CORS completely disabled (allows all origins)
- Frontend should use `VITE_API_URL` from environment

**Verify API URL:**
```bash
# Check what the frontend is using
curl http://[your-machine-ip]:6000
# Look at the HTML source for VITE_API_URL
```

## Switching Between Local and Remote

### For Local Development Only
```bash
# Use standard dev command
pnpm dev

# Manually set .env to localhost
APP_URL=http://localhost:6000
API_URL=http://localhost:6001
VITE_API_URL=http://localhost:6001
```

### For Remote Access
```bash
# Use remote dev command
pnpm dev:remote

# This automatically configures everything
```

## Development Workflow

### Typical Remote Development Session

```bash
# 1. Start remote dev mode
pnpm dev:remote

# 2. On remote device, open browser to:
http://[your-machine-ip]:6000

# 3. Make code changes - HMR will auto-reload
# 4. Backend changes auto-restart with tsx watch

# 5. When done, stop with Ctrl+C
```

### Testing on Multiple Devices

The same dev server can be accessed from multiple devices simultaneously:

- Your laptop: `http://10.100.102.29:6000`
- Your tablet: `http://10.100.102.29:6000`
- Your phone: `http://10.100.102.29:6000`
- Colleague's machine: `http://10.100.102.29:6000`

All devices will get HMR updates when you make changes!

## Comparison: Dev vs Production

| Feature | Dev Mode | Production Mode |
|---------|----------|----------------|
| Hot Reload | ✅ Yes | ❌ No |
| Source Maps | ✅ Yes | ❌ No |
| Minification | ❌ No | ✅ Yes |
| Server | Vite Dev + tsx watch | Single Fastify server |
| Ports | 6000 (frontend), 6001 (backend) | 6001 (serves both) |
| Start Command | `pnpm dev:remote` | `pnpm start` |
| Build Required | ❌ No | ✅ Yes (`pnpm build`) |

## Advanced Configuration

### Custom IP Address

If auto-detection doesn't work:

```bash
# Manually set environment variables
export VITE_API_URL="http://192.168.1.100:6001"
export API_URL="http://192.168.1.100:6001"
export APP_URL="http://192.168.1.100:6000"

# Start dev servers
pnpm dev
```

### Different Network Interfaces

If you have multiple network adapters:

```typescript
// Edit scripts/start-dev-remote.ts
// Change the interfaces array:
const interfaces = ['en0', 'eth0', 'en1', 'wlan0', 'your-interface'];
```

### Custom Ports

To use different ports:

```bash
# In .env
FRONTEND_PORT=3000
API_PORT=3001

# Update vite.config.ts
server: {
  port: Number(process.env.FRONTEND_PORT) || 6000,
  // ...
}
```

## Security Considerations

⚠️ **Development mode should only be used on trusted networks!**

- ✅ Development servers are NOT production-ready
- ✅ CORS is disabled for convenience
- ✅ No authentication required
- ✅ Debug information exposed
- ✅ Source maps available

**For production deployment:**
1. Run `pnpm build` to create optimized builds
2. Use `pnpm start` for production server
3. Enable proper CORS restrictions
4. Use HTTPS with valid certificates
5. Enable authentication

## Monitoring Dev Server

### Check Server Status
```bash
# Frontend dev server
curl http://[your-ip]:6000

# Backend API health
curl http://[your-ip]:6001/health

# Backend metrics
curl http://[your-ip]:6001/metrics
```

### View Server Logs
```bash
# Both servers output to console
# Or redirect to file:
pnpm dev:remote > dev.log 2>&1 &
tail -f dev.log
```

## FAQ

**Q: Can I access dev mode from anywhere on the internet?**  
A: No, only from devices on the same local network (unless you set up port forwarding).

**Q: Why use dev:remote instead of just dev?**  
A: `dev:remote` automatically configures everything for remote access. `dev` uses localhost by default.

**Q: Do I need to rebuild when switching between local and remote?**  
A: No, just restart the dev servers with the appropriate command.

**Q: Can I use Docker with remote dev mode?**  
A: Yes, but you'll need to expose ports and set appropriate host bindings in docker-compose.yml.

**Q: Does this work with WSL2 on Windows?**  
A: Yes, but you may need to use the WSL2 IP address instead of the Windows host IP.

## Related Documentation

- [Production Deployment](./DEPLOYMENT_GUIDE.md)
- [CORS Configuration](./CORS_FULLY_DISABLED_SUMMARY.md)
- [Remote Access Setup](./REMOTE_404_FIX.md)
- [Port Configuration](./PORT_CONFIG.md)

---

**Last Updated:** October 9, 2025  
**Version:** Development Mode with Remote Access  
**Status:** ✅ Fully Functional
