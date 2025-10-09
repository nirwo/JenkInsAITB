# Setup Troubleshooting Guide

Common issues and solutions when running the setup scripts.

---

## Table of Contents

- [Module Resolution Errors](#module-resolution-errors)
- [Database Errors](#database-errors)
- [Permission Errors](#permission-errors)
- [Dependency Installation Errors](#dependency-installation-errors)
- [Admin User Creation Errors](#admin-user-creation-errors)
- [Jenkins Connection Errors](#jenkins-connection-errors)
- [General Tips](#general-tips)

---

## Module Resolution Errors

### Error: "Cannot find module '@prisma/client'"

**Symptom:**
```
Error: Cannot find module '@prisma/client'
    at /tmp/create-admin.js:1:23
```

**Cause:** Prisma client not generated or not in the correct location.

**Solutions:**

**1. Generate Prisma Client:**
```bash
pnpm prisma generate
```

**2. Check Prisma Client Location:**
```bash
ls -la node_modules/.prisma/client/
# Should show generated files
```

**3. Re-run Setup:**
```bash
# Clean and re-run
rm -rf node_modules/.prisma
pnpm prisma generate
./setup.sh
```

**4. Manual Admin Creation:**
```bash
# If setup fails, create admin manually
pnpm setup:admin
```

**Fixed in:** Commit 4154b49 - Setup scripts now use proper Prisma client paths with fallback methods.

---

### Error: "Cannot find module 'bcrypt'"

**Symptom:**
```
Error: Cannot find module 'bcrypt'
```

**Cause:** Dependencies not installed or bcrypt build failed.

**Solutions:**

**1. Reinstall Dependencies:**
```bash
rm -rf node_modules
pnpm install
```

**2. Install bcrypt Specifically:**
```bash
pnpm add bcrypt
```

**3. Check for Build Errors:**
```bash
# bcrypt requires native compilation
# macOS: Install Xcode Command Line Tools
xcode-select --install

# Linux: Install build essentials
sudo apt-get install build-essential

# Windows: Install Windows Build Tools
npm install -g windows-build-tools
```

**4. Alternative (if bcrypt fails):**
```bash
# Use bcryptjs instead (pure JavaScript)
pnpm add bcryptjs
# Then manually create user via pnpm setup:admin
```

---

## Database Errors

### Error: "Environment variable not found: DATABASE_URL"

**Symptom:**
```
Error: Environment variable not found: DATABASE_URL
```

**Cause:** `.env` file missing or malformed.

**Solutions:**

**1. Check .env File:**
```bash
ls -la .env
# Should exist

cat .env | grep DATABASE_URL
# Should show: DATABASE_URL="file:./prisma/dev.db"
```

**2. Recreate .env:**
```bash
cp .env.example .env
# Edit and set DATABASE_URL
```

**3. Manual Setup:**
```bash
echo 'DATABASE_URL="file:./prisma/dev.db"' >> .env
```

---

### Error: "Database is locked"

**Symptom:**
```
Error: SqliteError: database is locked
```

**Cause:** Another process is using the database.

**Solutions:**

**1. Close Prisma Studio:**
```bash
# Check if running
ps aux | grep "prisma studio"
# Kill if found
pkill -f "prisma studio"
```

**2. Check for Locked Files:**
```bash
lsof prisma/dev.db
# Kill process if needed
kill -9 <PID>
```

**3. Remove Lock Files:**
```bash
rm -f prisma/dev.db-journal
rm -f prisma/dev.db-wal
rm -f prisma/dev.db-shm
```

**4. Reset Database:**
```bash
# WARNING: Deletes all data
rm prisma/dev.db
pnpm prisma db push
```

---

### Error: "Prisma schema validation failed"

**Symptom:**
```
Error validating: datasource "db" must have the url property
```

**Cause:** DATABASE_URL not set or incorrect format.

**Solutions:**

**1. For SQLite (Default):**
```bash
# In .env
DATABASE_URL="file:./prisma/dev.db"
```

**2. For PostgreSQL:**
```bash
# In .env
DATABASE_URL="postgresql://user:password@localhost:5432/jenkinds"

# Update schema
# In prisma/schema.prisma:
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**3. Validate Schema:**
```bash
pnpm prisma validate
```

---

## Permission Errors

### Error: "Permission denied: ./setup.sh"

**Symptom:**
```bash
bash: ./setup.sh: Permission denied
```

**Solutions:**

**1. Make Executable:**
```bash
chmod +x setup.sh
./setup.sh
```

**2. Run with Bash:**
```bash
bash setup.sh
```

---

### Error: PowerShell execution policy (Windows)

**Symptom:**
```
.\setup.ps1 : File cannot be loaded because running scripts is disabled
```

**Solutions:**

**1. Allow Scripts for Current User:**
```powershell
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
```

**2. Bypass for Single Script:**
```powershell
PowerShell -ExecutionPolicy Bypass -File .\setup.ps1
```

**3. Run as Administrator and Set Policy:**
```powershell
# Right-click PowerShell → Run as Administrator
Set-ExecutionPolicy RemoteSigned
```

---

## Dependency Installation Errors

### Error: "pnpm: command not found"

**Solutions:**

**1. Install pnpm:**
```bash
npm install -g pnpm
```

**2. Use npm Instead:**
```bash
npm install
npm run dev
```

**3. Use npx:**
```bash
npx pnpm install
```

---

### Error: "EACCES: permission denied"

**Symptom:**
```
Error: EACCES: permission denied, mkdir '/usr/local/lib/node_modules/pnpm'
```

**Solutions:**

**1. Use npx (Recommended):**
```bash
npx pnpm install
```

**2. Fix npm Permissions:**
```bash
# macOS/Linux
sudo chown -R $(whoami) ~/.npm
sudo chown -R $(whoami) /usr/local/lib/node_modules
```

**3. Use nvm (Recommended):**
```bash
# Install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash

# Install Node with nvm
nvm install 20
nvm use 20

# Now install pnpm
npm install -g pnpm
```

---

### Error: "Network timeout" during installation

**Solutions:**

**1. Increase Timeout:**
```bash
pnpm install --fetch-timeout 100000
```

**2. Use Different Registry:**
```bash
# China mirror
pnpm install --registry https://registry.npmmirror.com

# Or set in .npmrc
echo "registry=https://registry.npmmirror.com" > .npmrc
```

**3. Clear Cache and Retry:**
```bash
pnpm store prune
rm -rf node_modules
pnpm install
```

---

## Admin User Creation Errors

### Error: "Admin user creation failed"

**Solutions:**

**1. Manual Creation (Interactive):**
```bash
pnpm setup:admin
```

**2. Manual Creation (Script):**
```bash
./scripts/create-admin.sh
```

**3. Manual Creation (Prisma Studio):**
```bash
pnpm db:studio
# Opens browser at http://localhost:5555
# Navigate to "users" table
# Click "Add record"
# Fill in details (use bcrypt for password hash)
```

**4. Manual Creation (SQL):**
```bash
# Generate password hash first
node -e "
const bcrypt = require('bcrypt');
bcrypt.hash('your-password', 10).then(console.log);
"
# Copy the hash

# Then insert user
sqlite3 prisma/dev.db
> INSERT INTO users (id, username, email, password_hash, role, first_name, last_name, is_active, created_at, updated_at)
  VALUES (hex(randomblob(16)), 'admin', 'admin@example.com', 'HASH_HERE', 'ADMIN', 'Admin', 'User', 1, datetime('now'), datetime('now'));
```

---

### Error: "Passwords do not match"

**Solutions:**

**1. Type Carefully:**
- Passwords are hidden when typing
- Type slowly and carefully
- Remember: passwords are case-sensitive

**2. Use Simpler Password for Setup:**
- Use a simple password during setup
- Change it later via the application

**3. Skip and Create Later:**
```bash
# Setup without admin creation
# Then create manually
pnpm setup:admin
```

---

## Jenkins Connection Errors

### Error: "ECONNREFUSED"

**Cause:** Jenkins is not running or URL is incorrect.

**Solutions:**

**1. Check if Jenkins is Running:**
```bash
curl http://localhost:8080
# Should return HTML
```

**2. Start Jenkins:**
```bash
# Depends on installation method
# systemd
sudo systemctl start jenkins

# Docker
docker start jenkins

# Homebrew (macOS)
brew services start jenkins-lts
```

**3. Check URL in .env:**
```bash
cat .env | grep JENKINS_URL
# Should match your Jenkins URL
```

**4. Test Connection:**
```bash
pnpm test:jenkins
```

---

### Error: "401 Unauthorized"

**Cause:** Invalid credentials or API token.

**Solutions:**

**1. Regenerate API Token:**
- Login to Jenkins
- Click username → Configure
- API Token → Add new Token
- Copy token to .env

**2. Check Credentials in .env:**
```bash
cat .env | grep JENKINS_USER
cat .env | grep JENKINS_API_TOKEN
```

**3. Test with curl:**
```bash
curl -u username:token http://localhost:8080/api/json
# Should return JSON
```

---

### Error: "403 Forbidden"

**Cause:** User doesn't have sufficient permissions.

**Solutions:**

**1. Check User Permissions:**
- User needs at least "Overall/Read" permission
- Go to: Manage Jenkins → Manage Users → Configure

**2. Use Admin User:**
- Create API token for Jenkins admin user
- Use admin credentials in .env

---

## General Tips

### Clean Installation

If all else fails, start fresh:

```bash
# 1. Backup .env (if it exists)
cp .env .env.backup

# 2. Clean everything
rm -rf node_modules
rm -rf .prisma
rm -rf prisma/dev.db
rm -rf dist
pnpm store prune

# 3. Run setup again
./setup.sh

# 4. Restore credentials (if needed)
# Edit .env with your settings
```

---

### Check Setup Status

```bash
# Verify setup
pnpm setup:verify

# Check Prisma
pnpm prisma validate

# Test database
pnpm db:studio

# Test Jenkins
pnpm test:jenkins

# Check dependencies
pnpm list
```

---

### Get Help

**Documentation:**
- [SETUP_GUIDE.md](../SETUP_GUIDE.md)
- [SETUP_AUTOMATION.md](../SETUP_AUTOMATION.md)
- [DATABASE_CONFIGURATION.md](./DATABASE_CONFIGURATION.md)

**Logs:**
```bash
# Check setup output
./setup.sh 2>&1 | tee setup.log

# Check application logs
tail -f logs/*.log
```

**Debug Mode:**
```bash
# Run with debug output
DEBUG=* pnpm dev
```

---

## Quick Fixes Checklist

Before asking for help, try these:

- [ ] `pnpm install` - Reinstall dependencies
- [ ] `pnpm prisma generate` - Regenerate Prisma client
- [ ] `pnpm prisma validate` - Validate schema
- [ ] Check `.env` file exists and is correct
- [ ] `chmod +x setup.sh` - Make script executable
- [ ] Close Prisma Studio if running
- [ ] Check Jenkins is running
- [ ] Clear cache: `pnpm store prune`
- [ ] Check Node.js version: `node --version` (should be 18+)
- [ ] Restart terminal/shell
- [ ] Try manual setup: `pnpm setup:admin`

---

**Last Updated:** October 9, 2025  
**Repository:** https://github.com/nirwo/JenkInsAITB
