# 🎯 Setup Automation - Complete Guide

**Complete automated setup system for JenkInsAITB**

Last Updated: October 9, 2025  
Status: ✅ Production Ready  
Commit: fa2babf

---

## 🚀 Quick Start (30 seconds)

```bash
# Clone and setup with one command
git clone https://github.com/nirwo/JenkInsAITB.git && cd JenkInsAITB && ./setup.sh
```

That's it! The script will guide you through everything.

---

## 📦 What's Included

### Scripts Created

| File | Platform | Purpose |
|------|----------|---------|
| **setup.sh** | macOS/Linux | Full interactive setup (all-in-one) |
| **setup.ps1** | Windows | PowerShell version of setup.sh |
| **scripts/quick-start.ts** | All | Fast setup with defaults |
| **scripts/create-admin-interactive.ts** | All | Create admin users |
| **scripts/test-jenkins-connection.ts** | All | Test Jenkins connectivity |
| **scripts/verify-setup.sh** | All | Verify installation |

### Documentation Created

| File | Description |
|------|-------------|
| **SETUP_GUIDE.md** | Complete setup instructions (all methods) |
| **scripts/README.md** | Detailed script reference |
| **package.json** | Updated with setup commands |

---

## 🎨 Setup Options

### Option 1: Full Interactive Setup (Recommended)

**Best for:** First-time setup, production deployment

```bash
# macOS/Linux
./setup.sh

# Windows
.\setup.ps1
```

**Features:**
- ✅ Validates system requirements
- ✅ Interactive prompts for all configuration
- ✅ Jenkins URL, credentials, API token
- ✅ Optional AI features (OpenAI)
- ✅ Auto-generates secure secrets
- ✅ Creates database with schema
- ✅ Creates admin user
- ✅ Tests Jenkins connection
- ✅ Generates startup scripts
- ⏱️ Takes: ~5 minutes

### Option 2: Quick Start

**Best for:** Development, testing, quick demos

```bash
pnpm quick-start
```

**Features:**
- ✅ Uses default configuration
- ✅ No interactive prompts
- ✅ Creates database
- ✅ Installs dependencies
- ⏭️ Skips: Admin creation, Jenkins config
- ⏱️ Takes: ~2 minutes

**You'll need to manually:**
```bash
pnpm setup:admin        # Create admin user
nano .env               # Configure Jenkins
pnpm test:jenkins       # Test connection
```

### Option 3: Manual Setup

**Best for:** Custom configurations, troubleshooting

See: [SETUP_GUIDE.md](./SETUP_GUIDE.md) - Manual Setup section

---

## 🛠️ Available Commands

### Setup Commands

```bash
pnpm quick-start        # Fast setup with defaults
pnpm setup:db           # Initialize database only
pnpm setup:admin        # Create admin user interactively
pnpm setup:verify       # Verify installation
pnpm test:jenkins       # Test Jenkins connection
```

### Development Commands

```bash
pnpm dev                # Start development server (hot reload)
pnpm build              # Build for production
pnpm start              # Start production server
pnpm db:studio          # Open database GUI
pnpm clean              # Clean build artifacts
```

### Testing Commands

```bash
pnpm test               # Run all tests
pnpm test:unit          # Run unit tests
pnpm test:e2e           # Run E2E tests
pnpm lint               # Check code quality
pnpm format             # Format code
```

### Database Commands

```bash
pnpm db:push            # Push schema changes
pnpm db:migrate         # Create migration
pnpm db:generate        # Generate Prisma client
pnpm db:seed            # Seed sample data
pnpm db:reset           # Reset database (WARNING: deletes data)
```

---

## 📋 Setup Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                    Start Setup                              │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  1. Check System Requirements                               │
│     - Node.js 20+                                           │
│     - Git                                                   │
│     - pnpm (auto-install if missing)                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  2. Configure Environment                                   │
│     Prompts:                                                │
│     - Jenkins URL                                           │
│     - Jenkins username                                      │
│     - Jenkins API token                                     │
│     - Enable AI? (optional)                                 │
│     - OpenAI API key (if AI enabled)                        │
│     Auto-generates:                                         │
│     - JWT secret                                            │
│     - Session secret                                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  3. Install Dependencies                                    │
│     - pnpm install                                          │
│     - ~200 packages                                         │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  4. Setup Database                                          │
│     - Generate Prisma client                                │
│     - Create SQLite database                                │
│     - Push schema (tables)                                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  5. Create Admin User                                       │
│     Prompts:                                                │
│     - Username                                              │
│     - Email                                                 │
│     - First/Last name                                       │
│     - Password (hidden, with confirmation)                  │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  6. Test Jenkins Connection                                 │
│     Tests:                                                  │
│     - Basic connectivity                                    │
│     - Authentication                                        │
│     - API access                                            │
│     - List jobs                                             │
│     - List agents                                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  7. Generate Startup Scripts                                │
│     - start-dev.sh / start-dev.bat                          │
│     - start-prod.sh / start-prod.bat                        │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│  8. Optional: Build Application                             │
│     - Build frontend (Vite)                                 │
│     - Build backend (TypeScript)                            │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│                  ✅ Setup Complete!                         │
│                                                             │
│  Next: pnpm dev                                             │
│  Access: http://localhost:6000                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Use Cases

### Case 1: New Developer Onboarding

**Goal:** Get a new team member up and running

```bash
# Step 1: Clone
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Step 2: Run setup
./setup.sh

# Step 3: Provide them with:
# - Jenkins URL
# - Jenkins credentials
# - (Optional) OpenAI API key

# Step 4: Done!
pnpm dev
```

**Time:** 5 minutes  
**Difficulty:** 🟢 Easy

### Case 2: Quick Demo

**Goal:** Show the app quickly without full configuration

```bash
# Clone
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Quick setup (no prompts)
pnpm quick-start

# Create admin (use defaults)
pnpm setup:admin
# username: demo
# password: demo123

# Start
pnpm dev

# Access: http://localhost:6000
# Login: demo / demo123
```

**Time:** 2 minutes  
**Difficulty:** 🟢 Easy  
**Note:** Jenkins features won't work until configured

### Case 3: Production Deployment

**Goal:** Deploy to production server

```bash
# On server
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Full setup with production credentials
./setup.sh

# Build
pnpm build

# Start with PM2
pm2 start npm --name "jenkinsdtb" -- start
pm2 save
pm2 startup
```

**Time:** 10 minutes  
**Difficulty:** 🟡 Medium

### Case 4: Docker Deployment

**Goal:** Run in container

```bash
# Clone
git clone https://github.com/nirwo/JenkInsAITB.git
cd JenkInsAITB

# Create .env (required for Docker)
cp .env.example .env
nano .env  # Edit with your values

# Build and run
docker-compose up -d

# Check logs
docker-compose logs -f
```

**Time:** 3 minutes  
**Difficulty:** 🟢 Easy

---

## 🔍 Script Details

### setup.sh / setup.ps1

**What it does:**
1. Validates system requirements (Node, Git, pnpm)
2. Prompts for all configuration interactively
3. Creates `.env` file with all settings
4. Installs dependencies with pnpm
5. Initializes database (Prisma)
6. Creates admin user with password
7. Tests Jenkins connection
8. Generates startup scripts
9. Optional: Builds application

**Exit codes:**
- `0` - Success
- `1` - System requirements not met
- `2` - User cancelled
- `3` - Configuration error
- `4` - Database error
- `5` - Jenkins connection failed (warning only)

**Environment variables created:**
```bash
JENKINS_URL           # From user input
JENKINS_USER          # From user input
JENKINS_API_TOKEN     # From user input
DATABASE_URL          # Auto: file:./prisma/dev.db
JWT_SECRET            # Auto-generated (32 bytes)
SESSION_SECRET        # Auto-generated (32 bytes)
OPENAI_API_KEY        # From user input (optional)
ENABLE_AI_ANALYSIS    # true/false based on user choice
PORT                  # Default: 3000
BACKEND_PORT          # Default: 3001
NODE_ENV              # Default: development
```

### quick-start.ts

**What it does:**
1. Copies `.env.example` to `.env` (if not exists)
2. Installs dependencies (if not exists)
3. Generates Prisma client
4. Creates database (if not exists)
5. Skips: User prompts, admin creation, Jenkins config

**When to use:**
- Quick testing
- Development setup
- CI/CD pipelines
- Automated testing

**When NOT to use:**
- Production deployment
- First-time setup with Jenkins
- Need admin user immediately

### create-admin-interactive.ts

**What it does:**
1. Prompts for user details (username, email, password)
2. Validates input (password length, match)
3. Checks for existing user
4. Hashes password with bcrypt
5. Creates/updates user in database
6. Sets role to ADMIN

**Password requirements:**
- Minimum 6 characters
- Must confirm (match)
- Securely hashed (bcrypt, 10 rounds)

**Features:**
- Hidden password input (shows `*`)
- Confirmation prompt
- Update existing users
- Proper error handling

### test-jenkins-connection.ts

**What it does:**
1. Loads `.env` configuration
2. Tests basic connectivity (is Jenkins reachable?)
3. Tests authentication (credentials valid?)
4. Tests API access (can fetch data?)
5. Lists jobs (if any)
6. Lists agents/nodes (if any)
7. Provides detailed error messages

**Tests performed:**

| Test | Checks | Error Codes |
|------|--------|-------------|
| Connectivity | Can reach Jenkins URL | ECONNREFUSED, ETIMEDOUT |
| Authentication | Username/token valid | 401, 403 |
| API Access | Can fetch `/api/json` | 404, 500 |
| Jobs | Lists available jobs | - |
| Agents | Lists build agents | - |

**Output:**
```
✅ Jenkins is running
✅ Authentication successful
✅ API is accessible

Jenkins Information:
  Version:     NORMAL
  Jobs:        15
  URL:         http://localhost:8080

✅ Found 15 jobs
  - backend-build (blue)
  - frontend-build (blue)
  - deploy-staging (blue)
  ... and 12 more

✅ Found 3 agents/nodes
  - master 🟢 Online
  - agent-1 🟢 Online
  - agent-2 🔴 Offline
```

---

## 🐛 Common Issues & Solutions

### Issue: "Permission Denied" on macOS/Linux

**Symptom:**
```bash
./setup.sh
bash: ./setup.sh: Permission denied
```

**Solution:**
```bash
chmod +x setup.sh
./setup.sh
```

### Issue: PowerShell Execution Policy (Windows)

**Symptom:**
```
.\setup.ps1 : File cannot be loaded because running scripts is disabled
```

**Solution:**
```powershell
# Option 1: Allow for current user
Set-ExecutionPolicy RemoteSigned -Scope CurrentUser

# Option 2: Bypass for this script only
PowerShell -ExecutionPolicy Bypass -File .\setup.ps1
```

### Issue: pnpm Not Found

**Symptom:**
```
pnpm: command not found
```

**Solution:**
```bash
# Install pnpm globally
npm install -g pnpm

# Or use npm instead
npm install
npm run dev
```

### Issue: Database Locked

**Symptom:**
```
Error: SqliteError: database is locked
```

**Solution:**
```bash
# Close Prisma Studio if open
# Then reset database
rm prisma/dev.db
pnpm db:push
pnpm setup:admin
```

### Issue: Jenkins Connection Failed

**Symptom:**
```
❌ Connection test failed!
Error: ECONNREFUSED
```

**Solutions:**

**1. Jenkins not running:**
```bash
# Check if Jenkins is running
curl http://localhost:8080

# Start Jenkins
# (depends on your installation method)
```

**2. Wrong URL:**
```bash
# Check .env file
cat .env | grep JENKINS_URL

# Update if incorrect
nano .env
```

**3. Invalid credentials:**
```bash
# Regenerate API token:
# 1. Login to Jenkins
# 2. Click your username → Configure
# 3. API Token → Add new Token
# 4. Copy token to .env
```

---

## 📊 Setup Comparison

| Feature | Full Setup | Quick Start | Manual |
|---------|-----------|-------------|--------|
| **Time** | ~5 min | ~2 min | ~10 min |
| **Difficulty** | 🟢 Easy | 🟢 Easy | 🟡 Medium |
| **Interactive** | ✅ Yes | ❌ No | ✅ Yes |
| **Environment config** | ✅ Auto | ⚠️ Manual | ✅ Manual |
| **Dependencies** | ✅ Auto | ✅ Auto | ✅ Manual |
| **Database** | ✅ Auto | ✅ Auto | ✅ Manual |
| **Admin user** | ✅ Auto | ❌ Skip | ✅ Manual |
| **Jenkins test** | ✅ Auto | ❌ Skip | ⚠️ Optional |
| **Startup scripts** | ✅ Yes | ❌ No | ❌ No |
| **Best for** | Production | Testing | Custom |

---

## 🎓 Best Practices

### For Development

1. **Use Full Setup first time:**
   ```bash
   ./setup.sh
   ```

2. **Use Quick Start for rebuilds:**
   ```bash
   rm -rf node_modules
   pnpm quick-start
   ```

3. **Test Jenkins regularly:**
   ```bash
   pnpm test:jenkins
   ```

### For Production

1. **Always use Full Setup:**
   ```bash
   ./setup.sh
   ```

2. **Secure your secrets:**
   ```bash
   # Generate strong secrets
   openssl rand -base64 32
   ```

3. **Enable HTTPS:**
   - Use reverse proxy (nginx, Apache)
   - Or configure SSL in server

4. **Use environment-specific configs:**
   ```bash
   cp .env .env.production
   # Edit .env.production with prod values
   ```

5. **Setup monitoring:**
   - PM2 for process management
   - Prometheus for metrics
   - Sentry for error tracking

### For CI/CD

1. **Use Quick Start in pipelines:**
   ```yaml
   # .github/workflows/test.yml
   - run: pnpm quick-start
   - run: pnpm test
   ```

2. **Don't commit .env:**
   - Already in .gitignore
   - Use secrets manager (GitHub Secrets, etc.)

3. **Verify setup in CI:**
   ```yaml
   - run: pnpm setup:verify
   ```

---

## 📚 Related Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** - Complete setup instructions
- **[scripts/README.md](./scripts/README.md)** - Detailed script reference
- **[SECURITY.md](./SECURITY.md)** - Security best practices
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
- **[SMART_FEATURES_README.md](./SMART_FEATURES_README.md)** - Feature overview

---

## 🎉 Success Criteria

After running setup, you should have:

- ✅ `.env` file with all configuration
- ✅ `node_modules/` with all dependencies
- ✅ `prisma/dev.db` database file
- ✅ `.prisma/` generated client
- ✅ Admin user in database
- ✅ Jenkins connection tested (if Jenkins running)
- ✅ Application starts with `pnpm dev`
- ✅ Can login at http://localhost:6000
- ✅ Dashboard loads without errors

**Verify with:**
```bash
pnpm setup:verify
```

---

## 🆘 Getting Help

1. **Check documentation:**
   - README files in each directory
   - Comments in scripts

2. **Verify setup:**
   ```bash
   pnpm setup:verify
   ```

3. **Check logs:**
   ```bash
   pnpm dev
   # Watch for errors in output
   ```

4. **Test components:**
   ```bash
   pnpm test:jenkins    # Test Jenkins
   pnpm db:studio       # Check database
   ```

5. **Clean and retry:**
   ```bash
   pnpm clean
   rm -rf node_modules
   ./setup.sh
   ```

---

**🚀 You're all set! Happy coding!**

**Repository:** https://github.com/nirwo/JenkInsAITB  
**Commit:** fa2babf  
**Last Updated:** October 9, 2025
