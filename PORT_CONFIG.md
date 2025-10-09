# Port Configuration Guide

## Quick Port Change

This project includes an easy script to change all ports at once!

### Usage

```bash
# Use the 6000 range (current default)
pnpm ports 6000

# Use the original 3000 range
pnpm ports 3000

# Use the 8000 range
pnpm ports 8000

# Use any base port (1024-65533)
pnpm ports 5000
```

### What Gets Updated

The script automatically updates:

1. **`.env.example`** - Port environment variables
2. **`.env`** - Your local environment (if exists)
3. **`vite.config.ts`** - Frontend dev server and proxy
4. **`server/index.ts`** - Backend API default port
5. **`Dockerfile`** - Docker port exposure and healthcheck
6. **`docker-compose.yml`** - Grafana port mapping

### Port Mapping

When you set a base port (e.g., `6000`), the following ports are configured:

| Service | Port | Description |
|---------|------|-------------|
| **Frontend** | Base + 0 | Vite dev server (e.g., 6000) |
| **Backend API** | Base + 1 | Express/Fastify server (e.g., 6001) |
| **Grafana** | Base + 2 | Grafana dashboard (e.g., 6002) |

Other services use fixed ports:
- PostgreSQL: `5432`
- Redis: `6379`
- Prometheus: `9090`

---

## Manual Configuration

If you prefer to configure ports manually:

### 1. Environment Variables (`.env`)

```bash
PORT=6000                           # Frontend port
API_PORT=6001                       # Backend API port
APP_URL=http://localhost:6000       # Frontend URL
API_URL=http://localhost:6001       # API URL
```

### 2. Vite Config (`vite.config.ts`)

```typescript
export default defineConfig({
  server: {
    port: 6000,                     // Frontend dev server port
    proxy: {
      '/api': {
        target: 'http://localhost:6001',  // API proxy target
      },
      '/ws': {
        target: 'ws://localhost:6001',    // WebSocket target
      },
    },
  },
});
```

### 3. Server Config (`server/index.ts`)

```typescript
const PORT = Number(process.env.API_PORT) || 6001;  // Default API port
```

### 4. Docker (`Dockerfile`)

```dockerfile
EXPOSE 6000 6001                    # Expose frontend and API ports

HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:6001/health', ...)"
```

### 5. Docker Compose (`docker-compose.yml`)

```yaml
grafana:
  ports:
    - "6002:3000"                   # Map Grafana to port 6002
```

---

## Common Port Ranges

### Development (Default)
```bash
pnpm ports 6000
```
- Frontend: http://localhost:6000
- Backend: http://localhost:6001
- Grafana: http://localhost:6002

### Original Ports
```bash
pnpm ports 3000
```
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Grafana: http://localhost:3002

### Alternative (No Conflicts)
```bash
pnpm ports 8000
```
- Frontend: http://localhost:8000
- Backend: http://localhost:8001
- Grafana: http://localhost:8002

---

## Troubleshooting

### Port Already in Use

**Error:** `EADDRINUSE: address already in use`

**Solutions:**

1. **Use different ports:**
   ```bash
   pnpm ports 7000
   ```

2. **Find and kill the process:**
   ```bash
   # macOS/Linux
   lsof -ti:6000 | xargs kill -9
   lsof -ti:6001 | xargs kill -9
   
   # Windows
   netstat -ano | findstr :6000
   taskkill /PID <PID> /F
   ```

3. **Check what's using the port:**
   ```bash
   # macOS/Linux
   lsof -i :6000
   
   # Windows
   netstat -ano | findstr :6000
   ```

### Changes Not Taking Effect

1. **Rebuild the application:**
   ```bash
   rm -rf dist
   pnpm build
   ```

2. **Restart the dev server:**
   ```bash
   # Kill existing process
   pkill -f "vite"
   pkill -f "tsx"
   
   # Start fresh
   pnpm dev
   ```

3. **Clear cache:**
   ```bash
   rm -rf node_modules/.vite
   pnpm dev
   ```

### Docker Container Issues

1. **Update exposed ports:**
   ```bash
   docker-compose down
   pnpm ports 6000  # or your desired base port
   docker-compose up -d --build
   ```

2. **Map ports explicitly:**
   ```bash
   docker run -p 6000:6000 -p 6001:6001 jenkinds:latest
   ```

---

## Production Deployment

When deploying to production, ensure:

1. **Build the application:**
   ```bash
   pnpm build
   ```

2. **Environment variables are set:**
   ```bash
   export API_PORT=6001
   export NODE_ENV=production
   ```

3. **Start the production server:**
   ```bash
   pnpm start        # Backend serves frontend + API
   # OR
   pnpm start:open   # Starts server and opens browser
   ```

4. **Access the application:**
   - **Frontend & API**: http://localhost:6001
   - **Health Check**: http://localhost:6001/health
   - **Metrics**: http://localhost:6001/metrics

---

## Script Details

### Location
`scripts/configure-ports.cjs`

### Direct Usage
```bash
node scripts/configure-ports.cjs 6000
```

### What It Does
1. Validates port number (1024-65533)
2. Calculates derived ports (API = base + 1, Grafana = base + 2)
3. Updates all configuration files
4. Reports changes made
5. Provides next steps

### Safety
- Creates backups (use git to revert if needed)
- Only updates valid port ranges
- Shows preview of changes before applying

---

## Testing New Ports

After changing ports:

1. **Verify configuration:**
   ```bash
   cat .env | grep PORT
   grep -n "port:" vite.config.ts
   grep -n "PORT" server/index.ts
   ```

2. **Test build:**
   ```bash
   pnpm build
   ```

3. **Test dev mode:**
   ```bash
   pnpm dev
   ```

4. **Access services:**
   - Frontend: http://localhost:6000
   - API Health: http://localhost:6001/health
   - API Metrics: http://localhost:6001/metrics
   - Grafana: http://localhost:6002

5. **Check logs:**
   ```bash
   tail -f logs/combined.log
   ```

---

## Quick Reference

| Command | Description |
|---------|-------------|
| `pnpm ports 6000` | Set ports to 6000 range |
| `pnpm ports 3000` | Reset to original 3000 range |
| `pnpm ports 8000` | Use 8000 range |
| `pnpm dev` | Start development server |
| `pnpm build` | Build for production |
| `lsof -i :6000` | Check what's using port 6000 |
| `git diff` | Review port changes |

---

## Need Help?

- **Check current ports:** `cat .env | grep PORT`
- **View script help:** `node scripts/configure-ports.cjs --help`
- **Revert changes:** `git checkout .env vite.config.ts server/index.ts`
- **Report issues:** https://github.com/nirwo/JenkInsAITB/issues

---

**Last Updated:** October 9, 2025
