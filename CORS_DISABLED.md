# CORS Policy COMPLETELY DISABLED

## Changes Made

### Server Configuration (`server/index.ts`)

**Approach: Pure manual CORS headers - NO plugins**

1. **CORS Plugin REMOVED**
   - `@fastify/cors` plugin completely removed
   - No CORS plugin interference

2. **Helmet Plugin REMOVED**
   - `@fastify/helmet` plugin completely removed
   - No security header interference

3. **Manual CORS Headers (Only Method)**
   - Added `onRequest` hook that runs FIRST before any middleware
   - Sets wildcard CORS headers on EVERY request:
     - `Access-Control-Allow-Origin`: `*` or mirrors origin (allows ALL origins)
     - `Access-Control-Allow-Credentials`: `true`
     - `Access-Control-Allow-Methods`: `*` (ALL methods)
     - `Access-Control-Allow-Headers`: `*` (ALL headers)
     - `Access-Control-Expose-Headers`: `*` (ALL headers)
     - `Access-Control-Max-Age`: `86400` seconds (24 hours)
   - Immediately returns 200 for OPTIONS preflight requests

4. **Backup onSend Hook**
   - Additional `onSend` hook ensures CORS headers on all responses
   - Guarantees headers even if missed by onRequest

### Frontend Configuration (`src/core/api/trpc.ts`)

- Added `credentials: 'include'` to both tRPC clients
- Ensures cookies/credentials are sent with cross-origin requests

## Testing

✅ **Run Comprehensive Tests:**
```bash
./scripts/test-cors-complete.sh
```

✅ **Verified Working:**
```bash
# Test from remote origin
curl -X OPTIONS -H "Origin: http://10.100.102.29:6001" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:6001/trpc/auth.login

# Result: All CORS headers present with wildcards
access-control-allow-origin: http://10.100.102.29:6001
access-control-allow-credentials: true
access-control-allow-methods: *
access-control-allow-headers: *
access-control-expose-headers: *
```

✅ **Batch Requests Working:**
```bash
# Test tRPC batch endpoint
curl -X OPTIONS -H "Origin: http://10.100.102.29:6001" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:6001/trpc/auth.login?batch=1

# Result: Batch URLs also work
access-control-allow-origin: http://10.100.102.29:6001
access-control-allow-methods: *
```

✅ **Any Origin Accepted:**
```bash
curl -X OPTIONS -H "Origin: http://example.com" \
  -H "Access-Control-Request-Method: POST" \
  http://localhost:6001/trpc/auth.login

# Result: Accepts any origin
access-control-allow-origin: http://example.com
```

## Security Note

⚠️ **WARNING:** This configuration completely disables CORS protection!

- Any website can make requests to your API
- Suitable for development and trusted internal networks
- **NOT recommended for public-facing production deployments**

For production, consider:
- Whitelisting specific origins
- Using environment variables to control CORS settings
- Implementing proper authentication/authorization

## Access Your Application

You can now access the application from any device on your network:

- **Local:** `http://localhost:6001`
- **Remote:** `http://10.100.102.29:6001`
- **Any device:** `http://[your-machine-ip]:6001`

Authentication should work without any CORS errors.

## Troubleshooting

### Quick Tests

1. **Run comprehensive CORS test:**
   ```bash
   ./scripts/test-cors-complete.sh
   ```

2. **Use browser test page:**
   - Open: `http://[your-ip]:6001/cors-test.html`
   - Or: `http://localhost:6001/cors-test.html`
   - Run all 5 tests to identify the issue

3. **Check server logs:**
   ```bash
   cat server.log | tail -50
   ```

### Common Issues & Solutions

#### 1. Browser Cache
The browser might be caching old CORS responses.

**Solution:**
- Clear browser cache (Cmd+Shift+Delete / Ctrl+Shift+Delete)
- Open DevTools → Network tab → Check "Disable cache"
- Try in Incognito/Private mode
- Hard refresh: Cmd+Shift+R (Mac) / Ctrl+Shift+F5 (Windows)

#### 2. Wrong API URL
Frontend might be using wrong API endpoint.

**Solution:**
```bash
# Check your .env file
cat .env | grep VITE_API_URL

# Should be:
# VITE_API_URL=http://[your-machine-ip]:6001

# Rebuild frontend if changed
pnpm build:client
```

#### 3. Server Not Running
The server might have crashed or not started.

**Solution:**
```bash
# Check if server is running
ps aux | grep "node dist/server"

# Restart server
pkill -f "node dist/server" || true
NODE_ENV=production pnpm start > server.log 2>&1 &

# Check startup logs
sleep 3 && cat server.log | head -20
```

#### 4. Port Already in Use
Another process might be using port 6001.

**Solution:**
```bash
# Find what's using port 6001
lsof -i :6001

# Kill the process (replace PID)
kill -9 <PID>

# Or use different port in .env
API_PORT=6002
```

#### 5. Firewall Blocking
Firewall might block remote access.

**Solution (macOS):**
```bash
# Allow incoming connections on port 6001
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /usr/local/bin/node
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblockapp /usr/local/bin/node
```

#### 6. Network Interface
Server might be binding to wrong network interface.

**Solution:**
```bash
# Verify server is listening on 0.0.0.0
netstat -an | grep 6001

# Should show: *.6001 or 0.0.0.0:6001
# Not: 127.0.0.1:6001 (localhost only)
```

### Manual CORS Verification

Test CORS manually from command line:

```bash
# Get your machine IP
node -e "console.log(require('os').networkInterfaces().en0.find(i => i.family === 'IPv4').address)"

# Test OPTIONS preflight
curl -X OPTIONS \
  -H "Origin: http://[your-ip]:6001" \
  -H "Access-Control-Request-Method: POST" \
  -v http://localhost:6001/trpc/auth.login

# Should see these headers:
# access-control-allow-origin: http://[your-ip]:6001
# access-control-allow-credentials: true
# access-control-allow-headers: *
```

### Browser DevTools Debugging

1. **Open DevTools** (F12 or Cmd+Option+I)

2. **Go to Network tab:**
   - Enable "Disable cache"
   - Clear existing requests

3. **Attempt login**

4. **Check failed request:**
   - Click on the red/failed request
   - Go to "Headers" tab
   - Look at "Response Headers"
   - Verify CORS headers are present

5. **Check Console tab:**
   - Look for specific CORS error
   - Copy the exact error message

### Get Help

If still stuck, provide these details:

```bash
# System info
node --version
pnpm --version

# Server status
ps aux | grep "node dist/server"
cat server.log | tail -20

# Network status
netstat -an | grep 6001

# CORS test
./scripts/test-cors-complete.sh

# Environment
cat .env | grep -E "(API_PORT|VITE_API_URL|APP_URL)"
```
