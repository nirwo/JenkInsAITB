# Port Configuration - Problem Solved! ✅

## The Issue

When running `pnpm start` (production mode), the server wasn't reading port values from `.env` - it was using hardcoded defaults instead of the ports configured with the automation script.

**Root Cause:** Node.js doesn't automatically load `.env` files. Development mode worked because `tsx` (the TypeScript runner) loads `.env`, but production mode uses plain `node` which doesn't.

---

## The Solution

### 1. **Added dotenv Package**
```bash
pnpm add dotenv
```

### 2. **Load .env at Server Startup**
```typescript
// server/index.ts (top of file)
import { config } from 'dotenv';
config(); // Load .env file at startup
```

Now when you run `pnpm start`, it automatically loads `.env` and uses the correct ports!

---

## How Port Configuration Works Now

### Quick Start
```bash
# Change ports
pnpm ports 8000

# Rebuild
pnpm build

# Run in production - NOW WORKS! ✅
pnpm start
```

### What Happens
1. **Development Mode** (`pnpm dev`):
   - ✅ Works: `tsx` loads `.env` automatically
   - Reads `PORT=6000` and `API_PORT=6001`

2. **Production Mode** (`pnpm start`):
   - ✅ **NOW WORKS**: `dotenv` loads `.env` on startup
   - Reads `PORT=6000` and `API_PORT=6001`
   - Server listens on correct ports!

---

## Testing Verification

```bash
# Build the application
pnpm build

# Start in production mode
pnpm start
```

**Expected Output:**
```
🚀 Server listening on http://0.0.0.0:6001
```

If you changed ports:
```bash
pnpm ports 7500
pnpm build
pnpm start
# 🚀 Server listening on http://0.0.0.0:7501
```

---

## Complete Port Workflow

### Step 1: Configure Ports
```bash
# Use the automated script
pnpm ports 6000    # Frontend: 6000, API: 6001, Grafana: 6002
```

### Step 2: Rebuild
```bash
pnpm build
```

### Step 3: Run
```bash
# Development (frontend + backend separate)
pnpm dev           # ✅ Loads .env

# Production (single server serves both)
pnpm start         # ✅ NOW loads .env + serves frontend
pnpm start:open    # ✅ Starts server + opens browser
```

### Step 4: Verify
```bash
# Check frontend (now served by backend)
curl http://localhost:6001/

# Check API health
curl http://localhost:6001/health

# Check API metrics
curl http://localhost:6001/metrics

# Open in browser
open http://localhost:6001
```

---

## Files Updated

| File | Purpose | Change |
|------|---------|--------|
| `server/index.ts` | Server entry point | Added `dotenv.config()` at top |
| `package.json` | Dependencies | Added `dotenv@17.2.3` + `ports` script |
| `PORT_CONFIG.md` | Documentation | Complete port management guide |
| `README.md` | Quick start | Added port configuration section |
| `scripts/configure-ports.cjs` | Automation | Better guidance for rebuild steps |

---

## Key Takeaways

### ✅ What's Fixed
- Production server (`pnpm start`) now loads `.env` correctly
- Port configuration tool works for both dev and prod
- Automatic port changes apply everywhere

### 📝 Best Practices
1. **Always rebuild after changing ports:**
   ```bash
   pnpm ports 8000
   pnpm build      # IMPORTANT!
   ```

2. **For immediate effect in dev mode:**
   ```bash
   pnpm ports 8000
   pnpm dev        # No rebuild needed for dev
   ```

3. **For Docker deployment:**
   ```bash
   pnpm ports 8000
   docker-compose down
   docker-compose up --build
   ```

### 🎯 Port Script Features
- Changes all config files at once (6 files updated)
- Validates port range (1024-65533)
- Calculates derived ports automatically
- Shows summary and next steps
- Works for both dev and production ✅

---

## Quick Reference

```bash
# Port Management
pnpm ports 6000           # Set to 6000 range
pnpm ports 3000           # Back to 3000 range
pnpm ports 8000           # Custom range

# After Port Change
pnpm build                # Always rebuild
pnpm start                # Production (loads .env)
pnpm dev                  # Development (loads .env)

# Verify Ports
cat .env | grep PORT      # Check configuration
lsof -i :6001            # Check what's using port
curl http://localhost:6001/health  # Test API
```

---

## Troubleshooting

### Port Still Wrong?
1. **Check .env file exists:**
   ```bash
   ls -la .env
   cat .env | grep PORT
   ```

2. **Rebuild after port changes:**
   ```bash
   rm -rf dist
   pnpm build
   ```

3. **Verify dotenv is loaded:**
   ```bash
   grep "dotenv" dist/server/index.js
   # Should see: require("dotenv")
   ```

### Environment Variables Not Loading?
```bash
# Check the file is readable
cat .env

# Restart the server
pkill -f "node dist/server"
pnpm start

# Check logs
tail -f logs/combined.log
```

---

## Documentation

- **Full Guide:** [PORT_CONFIG.md](PORT_CONFIG.md)
- **Setup Guide:** [SETUP_GUIDE.md](SETUP_GUIDE.md)
- **README:** [README.md](README.md)

---

**Status:** ✅ **RESOLVED**  
**Tested:** Production mode now correctly loads `.env` and uses configured ports  
**Version:** After commit `0bc3374`  
**Date:** October 9, 2025
