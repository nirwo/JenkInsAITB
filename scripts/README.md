# 🔧 Setup Scripts

Automated setup scripts for JenkInsAITB application.

---

## Quick Reference

| Script | Platform | Description |
|--------|----------|-------------|
| `setup.sh` | macOS/Linux | **Full interactive setup** - Complete configuration |
| `setup.ps1` | Windows | **Full interactive setup** - Complete configuration |
| `pnpm quick-start` | All | **Fast setup** - Default configuration |
| `pnpm setup:admin` | All | Create admin user interactively |
| `pnpm test:jenkins` | All | Test Jenkins connection |
| `pnpm setup:verify` | All | Verify installation |

---

## 🚀 Quick Start (Fastest)

```bash
# Clone repository
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Quick start with defaults
pnpm quick-start

# Start development server
pnpm dev
```

This will:
- ✅ Copy `.env.example` to `.env`
- ✅ Install dependencies
- ✅ Initialize database
- ⏭️  Skip user prompts (use defaults)

**Note:** You'll need to manually:
1. Create admin user: `pnpm setup:admin`
2. Configure Jenkins in `.env`
3. Test connection: `pnpm test:jenkins`

---

## 🎯 Full Setup (Recommended)

### macOS / Linux

```bash
./setup.sh
```

### Windows (PowerShell)

```powershell
.\setup.ps1
```

### What It Does

The full setup script will **interactively**:

1. ✅ **Check System Requirements**
   - Node.js 20+
   - Git
   - pnpm (installs if missing)

2. ✅ **Configure Environment**
   - Jenkins URL, username, API token
   - OpenAI API key (optional)
   - Auto-generate secure JWT/session secrets

3. ✅ **Install Dependencies**
   - All npm packages
   - Prisma client

4. ✅ **Setup Database**
   - Generate Prisma client
   - Create SQLite database
   - Push schema

5. ✅ **Create Admin User**
   - Interactive username/password prompts
   - Secure password hashing

6. ✅ **Test Jenkins**
   - Verify connectivity
   - Test authentication
   - List jobs and agents

7. ✅ **Generate Scripts**
   - `start-dev.sh` / `start-dev.bat`
   - `start-prod.sh` / `start-prod.bat`

---

## 📋 Individual Scripts

### Create Admin User

```bash
pnpm setup:admin
```

**Prompts for:**
- Username
- Email
- First/Last name
- Password (hidden input with confirmation)

**Features:**
- ✅ Password validation (min 6 characters)
- ✅ Confirms password match
- ✅ Checks for existing users
- ✅ Updates existing users with confirmation
- ✅ Secure bcrypt hashing

### Test Jenkins Connection

```bash
pnpm test:jenkins
```

**Tests:**
1. ✅ Basic connectivity (is Jenkins reachable?)
2. ✅ Authentication (credentials valid?)
3. ✅ API access (can we fetch data?)
4. ✅ Jobs list (shows available jobs)
5. ✅ Agents/nodes (lists build agents)

**Output Example:**
```
🔍 Test 1: Basic Connectivity...
✅ Jenkins is running

🔍 Test 2: Authentication...
✅ Authentication successful

Jenkins Information:
  Version:     NORMAL
  Jobs:        15
  URL:         http://localhost:8080
```

**Error Handling:**
- Connection refused → Jenkins not running
- 401 Unauthorized → Invalid credentials
- 403 Forbidden → Insufficient permissions
- Timeout → Network issues

### Verify Setup

```bash
pnpm setup:verify
```

**Checks:**
- ✅ `.env` file exists
- ✅ All required variables set
- ✅ Database file exists
- ✅ Admin user exists
- ✅ Dependencies installed
- ✅ Prisma client generated

### Database Setup

```bash
# Generate Prisma client
pnpm db:generate

# Push schema (create/update tables)
pnpm db:push

# Full setup (both steps)
pnpm setup:db

# Open database GUI
pnpm db:studio

# Reset database (WARNING: deletes all data)
pnpm db:reset
```

---

## 🔧 Manual Setup

If you prefer manual setup or scripts fail:

### 1. Environment Configuration

```bash
# Copy example file
cp .env.example .env

# Edit with your details
nano .env
```

**Required variables:**
```bash
JENKINS_URL=http://localhost:8080
JENKINS_USER=your-username
JENKINS_API_TOKEN=your-token

DATABASE_URL="file:./prisma/dev.db"

# Generate with: openssl rand -base64 32
JWT_SECRET=your-secret
SESSION_SECRET=your-secret

# Optional
OPENAI_API_KEY=sk-your-key
ENABLE_AI_ANALYSIS=false
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Setup Database

```bash
pnpm prisma generate
pnpm prisma db push
```

### 4. Create Admin User

**Option A: Interactive script**
```bash
pnpm setup:admin
```

**Option B: Manual (Node.js)**
```bash
node -e "
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const prisma = new PrismaClient();

(async () => {
  const password = await bcrypt.hash('admin123', 10);
  await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@example.com',
      passwordHash: password,
      firstName: 'Admin',
      lastName: 'User',
      role: 'ADMIN'
    }
  });
  console.log('Admin created!');
  await prisma.\$disconnect();
})();
"
```

**Option C: Prisma Studio (GUI)**
```bash
pnpm db:studio
# Manually create user in browser
```

### 5. Start Application

```bash
# Development mode
pnpm dev

# Production mode
pnpm build
pnpm start
```

---

## 🐛 Troubleshooting

### Setup Script Permission Denied (macOS/Linux)

```bash
chmod +x setup.sh
chmod +x start-dev.sh
chmod +x start-prod.sh
```

### PowerShell Execution Policy (Windows)

```powershell
# Check current policy
Get-ExecutionPolicy

# Allow scripts (run as Administrator)
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Or run with bypass
PowerShell -ExecutionPolicy Bypass -File .\setup.ps1
```

### pnpm Not Found

```bash
# Install globally
npm install -g pnpm

# Or use npm/yarn instead
npm install
npm run dev
```

### Database Locked Error

```bash
# Close any open Prisma Studio instances
# Then reset database
rm prisma/dev.db
pnpm db:push
pnpm setup:admin
```

### Jenkins Connection Failed

**Error: ECONNREFUSED**
- Jenkins not running → Start Jenkins
- Wrong URL → Check `JENKINS_URL` in `.env`

**Error: 401 Unauthorized**
- Invalid credentials → Regenerate API token
- Path: Jenkins → User Menu → Configure → API Token

**Error: 403 Forbidden**
- Insufficient permissions
- User needs "Overall/Read" permission

### OpenAI API Errors

**Error: Invalid API Key**
- Check key format (starts with `sk-`)
- Verify at: https://platform.openai.com/api-keys

**Error: Rate Limit**
- You've exceeded your quota
- Check: https://platform.openai.com/account/usage

**Error: Billing Required**
- OpenAI requires payment method
- Setup: https://platform.openai.com/account/billing

---

## 📝 Environment Variables

### Required

| Variable | Description | Example |
|----------|-------------|---------|
| `JENKINS_URL` | Jenkins server URL | `http://localhost:8080` |
| `JENKINS_USER` | Jenkins username | `admin` |
| `JENKINS_API_TOKEN` | Jenkins API token | `11a1b...` |
| `DATABASE_URL` | Database connection | `file:./prisma/dev.db` |
| `JWT_SECRET` | JWT signing secret | (auto-generated) |
| `SESSION_SECRET` | Session encryption | (auto-generated) |

### Optional

| Variable | Description | Default |
|----------|-------------|---------|
| `OPENAI_API_KEY` | OpenAI API key | - |
| `ENABLE_AI_ANALYSIS` | Enable AI features | `false` |
| `PORT` | Frontend port | `3000` |
| `BACKEND_PORT` | Backend port | `3001` |
| `NODE_ENV` | Environment | `development` |
| `LOG_LEVEL` | Logging level | `info` |

### Generating Secrets

**macOS/Linux:**
```bash
openssl rand -base64 32
```

**Windows (PowerShell):**
```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

**Node.js:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## 🚢 Deployment

### Docker

```bash
# Build image
docker build -t jenkinsdtb:latest .

# Run with environment file
docker run -p 3000:3000 --env-file .env jenkinsdtb:latest

# Or use Docker Compose
docker-compose up -d
```

### PM2 (Production)

```bash
# Install PM2
npm install -g pm2

# Build
pnpm build

# Start
pm2 start npm --name "jenkinsdtb" -- start

# Save configuration
pm2 save

# Auto-start on boot
pm2 startup
```

### systemd (Linux)

```bash
# Create service file
sudo nano /etc/systemd/system/jenkinsdtb.service

# Enable and start
sudo systemctl enable jenkinsdtb
sudo systemctl start jenkinsdtb
```

---

## 📚 Additional Resources

- [Full Setup Guide](../SETUP_GUIDE.md)
- [Security Best Practices](../SECURITY.md)
- [Architecture Documentation](../ARCHITECTURE.md)
- [Feature Overview](../SMART_FEATURES_README.md)

---

## 🆘 Support

If you encounter issues:

1. **Check logs**: `pnpm dev` (watch for errors)
2. **Verify setup**: `pnpm setup:verify`
3. **Test Jenkins**: `pnpm test:jenkins`
4. **Database GUI**: `pnpm db:studio`
5. **Clean install**: 
   ```bash
   pnpm clean
   rm -rf node_modules
   pnpm install
   ```

For security issues, see [SECURITY.md](../SECURITY.md).

---

**Happy coding! 🚀**
