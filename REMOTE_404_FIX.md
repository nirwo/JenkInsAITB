# Remote System 404 Fix Guide

## 🔍 Quick Diagnosis

Run this on your remote system to identify the issue:

```bash
# 1. Navigate to your project directory
cd /path/to/JenKinds

# 2. Run the diagnostic script
node scripts/debug-remote.js
```

---

## 🐛 Common 404 Causes & Fixes

### 1. **Missing Build Files** (Most Common)

**Symptom:** 404 on all routes
**Fix:**
```bash
# Pull latest changes
git pull origin master

# Install dependencies
pnpm install

# Build the application
pnpm build

# Verify build exists
ls -la dist/
# Should show: index.html, assets/, server/
```

### 2. **Missing .env File**

**Symptom:** Server starts but 404 on frontend
**Fix:**
```bash
# Copy environment template
cp .env.example .env

# Edit with your settings
nano .env
# Set: API_PORT=6001, NODE_ENV=production
```

### 3. **Wrong NODE_ENV**

**Symptom:** Static files not served
**Fix:**
```bash
# Ensure NODE_ENV is set
export NODE_ENV=production

# OR use the script that sets it
pnpm start:prod
```

### 4. **Wrong Working Directory**

**Symptom:** Server can't find static files
**Fix:**
```bash
# Always run from project root (where package.json is)
cd /path/to/JenKinds
pwd
# Should show: /your/path/JenKinds

# Then start server
pnpm start:prod
```

### 5. **Port Already in Use**

**Symptom:** Server won't start or wrong service responds
**Fix:**
```bash
# Check what's using the port
lsof -i :6001

# Kill conflicting process
sudo pkill -f "process-name"

# Or change ports
pnpm ports 7000
pnpm build
pnpm start:prod
```

---

## 🔧 Step-by-Step Remote Fix

### Step 1: Clean Setup
```bash
# Navigate to project
cd /path/to/JenKinds

# Pull latest changes
git pull origin master

# Clean install
rm -rf node_modules dist
pnpm install
```

### Step 2: Build Application
```bash
# Build everything
pnpm build

# Verify build
ls -la dist/
# Expected: index.html, assets/, fonts/, server/

# Check index.html exists
cat dist/index.html | head -5
# Should show HTML with <title>JenKinds</title>
```

### Step 3: Configure Environment
```bash
# Copy environment file
cp .env.example .env

# Edit environment (set your values)
cat > .env << 'EOF'
NODE_ENV=production
API_PORT=6001
DATABASE_URL="file:./prisma/dev.db"
REDIS_URL="redis://localhost:6379"
JENKINS_URL=https://your-jenkins.com
JENKINS_USER=your-username
JENKINS_API_TOKEN=your-token
EOF
```

### Step 4: Start Production Server
```bash
# Method 1: Direct start
NODE_ENV=production pnpm start

# Method 2: Using script
pnpm start:prod

# Method 3: With enhanced logging
pnpm start:prod 2>&1 | tee server.log
```

### Step 5: Test Access
```bash
# Test API
curl http://localhost:6001/health

# Test frontend
curl http://localhost:6001/ | grep "<title"

# Open in browser (if GUI available)
open http://localhost:6001
# OR
firefox http://localhost:6001 &
```

---

## 🔍 Debugging Commands

### Check Server Logs
```bash
# Start with verbose logging
DEBUG=* pnpm start:prod

# OR capture logs
pnpm start:prod > server.log 2>&1 &
tail -f server.log
```

### Verify File Structure
```bash
# Check project structure
find . -name "index.html" | head -5
find . -name "*.js" | grep dist/server | head -3

# Check permissions
ls -la dist/
ls -la dist/index.html
```

### Test Static File Serving
```bash
# Start server in background
pnpm start:prod &
SERVER_PID=$!

# Test endpoints
echo "Testing health..."
curl -s http://localhost:6001/health | jq .

echo "Testing frontend..."
curl -s http://localhost:6001/ | head -10

echo "Testing assets..."
curl -s http://localhost:6001/assets/ | head -5

# Stop server
kill $SERVER_PID
```

---

## 🎯 Remote System Checklist

- [ ] Git repository is up to date: `git pull origin master`
- [ ] Dependencies installed: `pnpm install`
- [ ] Application built: `pnpm build` (creates dist/)
- [ ] Environment configured: `.env` file exists with correct ports
- [ ] Running from correct directory: where `package.json` is located
- [ ] NODE_ENV=production: Use `pnpm start:prod`
- [ ] Port is available: `lsof -i :6001` shows nothing or our server
- [ ] Server starts successfully: No errors in logs
- [ ] Health endpoint works: `curl localhost:6001/health`
- [ ] Frontend serves: `curl localhost:6001/` shows HTML

---

## 🚨 Emergency Fallback

If nothing works, try this minimal setup:

```bash
# 1. Fresh clone
git clone https://github.com/nirwo/JenkInsAITB.git fresh-jenkinds
cd fresh-jenkinds

# 2. Install and build
pnpm install
pnpm build

# 3. Simple .env
echo "API_PORT=6001" > .env
echo "NODE_ENV=production" >> .env

# 4. Start
NODE_ENV=production pnpm start

# 5. Test
curl localhost:6001/health
curl localhost:6001/ | grep title
```

---

## 📞 Need Help?

If you're still getting 404 errors:

1. **Run diagnostic:** `node scripts/debug-remote.js`
2. **Share logs:** `pnpm start:prod 2>&1 | tee debug.log`
3. **Check working directory:** `pwd` should show the JenKinds project root
4. **Verify build:** `ls -la dist/index.html` should exist

**Most likely cause:** Missing build files. Solution: `pnpm build` ✅