# Jenkins Setup Guide

## 🎯 Problem: Jobs Not Showing Up?

You just ran jobs on Jenkins but they're not appearing in JenKinds. Here's why and how to fix it:

### Root Cause
JenKinds doesn't automatically know about your Jenkins server. You need to **register your Jenkins instance** first.

## 📝 Step-by-Step Setup

### Option 1: Via Admin UI (Recommended)

1. **Login as Admin**
   ```
   Email: admin@jenkinds.io
   Password: Admin@123456
   ```

2. **Navigate to Settings** (in sidebar)

3. **Add Jenkins Instance**
   - Click "Add Jenkins Instance" button
   - Fill in the form:
     - **Name**: Give it a friendly name (e.g., "Production Jenkins")
     - **URL**: Your Jenkins URL (e.g., `https://jenkins.yourcompany.com`)
     - **Username**: Your Jenkins username
     - **API Token**: Generate one in Jenkins at:
       - Jenkins → People → Your Name → Configure → API Token → Add new Token
     - **Description**: Optional description
     - **Active**: Check this box ✅
     - **Primary**: Check if this is your main Jenkins instance ✅

4. **Test Connection**
   - Click "Test Connection" button
   - Should see "Connection successful" with Jenkins version

5. **Save**
   - Once saved, JenKinds will automatically start syncing jobs every 5 seconds!

### Option 2: Via Database (Quick Test)

If you just want to test quickly:

```sql
-- Connect to the database
sqlite3 ./prisma/dev.db

-- Add your Jenkins instance
INSERT INTO jenkins_instances (
  id,
  name,
  url,
  username,
  api_token,
  description,
  is_active,
  created_at,
  updated_at,
  last_sync_at
) VALUES (
  'jenkins-1',
  'My Jenkins',
  'https://your-jenkins-url.com',
  'your-username',
  'your-api-token',
  'Main Jenkins instance',
  1,
  datetime('now'),
  datetime('now'),
  datetime('now')
);

-- Exit SQLite
.exit
```

Then restart the server: `pnpm dev`

## 🔄 How the Sync Works

Once you've added a Jenkins instance:

1. **Automatic Sync**: Runs every 5 seconds (configurable via `JENKINS_POLL_INTERVAL` in `.env`)
2. **What Gets Synced**:
   - All jobs from Jenkins
   - Last 5 builds for each job
   - Job status (SUCCESS/FAILURE/RUNNING/etc.)
   - Build history with timestamps
3. **Database Storage**: Everything is cached in SQLite for fast access

### Manual Sync

You can also manually trigger a sync:

```typescript
// Via tRPC in the browser console:
trpc.jenkins.syncJobs.mutate()

// Or via API:
POST http://localhost:6001/trpc/jenkins.syncJobs
```

## 🔍 Verify It's Working

### Check Sync Status

1. Open browser console on any page
2. Run:
```javascript
const status = await trpc.jenkins.getSyncStatus.query();
console.log(status);
```

You should see:
```json
{
  "running": true,
  "isSyncing": false,
  "intervalMs": 5000
}
```

### Check Server Logs

Look for these messages in your terminal:
```
🔄 Jenkins sync service started (polling every 5000ms)
Syncing 1 Jenkins instance(s)...
Found 15 jobs on My Jenkins
Sync completed in 1234ms
```

### Check Database

```bash
# Count jobs in database
sqlite3 ./prisma/dev.db "SELECT COUNT(*) FROM jobs;"

# List all jobs
sqlite3 ./prisma/dev.db "SELECT name, last_build_status FROM jobs;"
```

## 🐛 Troubleshooting

### No Jobs Appearing

**Check 1: Is Jenkins instance active?**
```sql
sqlite3 ./prisma/dev.db "SELECT name, is_active, last_sync_at FROM jenkins_instances;"
```
- `is_active` should be `1`
- `last_sync_at` should be recent

**Check 2: Check server logs**
- Look for errors like:
  - `Connection failed` → Invalid credentials
  - `403 Forbidden` → Wrong API token
  - `404 Not Found` → Wrong Jenkins URL

**Check 3: Test connection manually**
```bash
# Replace with your credentials
curl -u username:api-token https://your-jenkins-url.com/api/json
```

### Sync Service Not Running

Restart the server:
```bash
# Stop (Ctrl+C)
pnpm dev
```

Look for:
```
🔄 Jenkins sync service started (polling every 5000ms)
```

### Jobs Appear but Builds Don't

The sync only fetches the **last 5 builds** initially. To get more:

```typescript
// Navigate to a job detail page
// Builds will be fetched on-demand
```

## ⚙️ Configuration

### Change Sync Interval

Edit `.env`:
```properties
# Sync every 30 seconds (default: 5000)
JENKINS_POLL_INTERVAL=30000

# Sync every minute
JENKINS_POLL_INTERVAL=60000
```

Then restart: `pnpm dev`

### Disable Auto-Sync

To sync only manually:
```properties
JENKINS_POLL_INTERVAL=9999999  # Very long interval
```

Then trigger manually:
```typescript
trpc.jenkins.syncJobs.mutate()
```

## 📊 What Gets Synced

### Jobs Table
- Job name, URL, description
- Last build status (SUCCESS/FAILURE/etc.)
- Last build time
- Health score
- Whether it's buildable/in queue

### Builds Table
- Build number
- Status (SUCCESS/FAILURE/etc.)
- Duration
- Timestamp
- URL to Jenkins build

### What Doesn't Get Synced (Yet)
- ❌ Build logs (fetched on-demand for AI analysis)
- ❌ Test results
- ❌ Artifacts
- ❌ Pipeline stages

These are fetched when you click "AI Analysis" or view a specific build.

## 🚀 Quick Start Checklist

- [ ] Login as admin (`admin@jenkinds.io` / `Admin@123456`)
- [ ] Go to Settings
- [ ] Add Jenkins instance with:
  - [ ] Valid URL
  - [ ] Valid username
  - [ ] Valid API token
  - [ ] Check "Active" ✅
- [ ] Test connection
- [ ] Save
- [ ] Wait 5 seconds
- [ ] Go to Jobs page
- [ ] Should see your jobs! 🎉

## 📚 Related Docs

- **NAVIGATION_GUIDE.md** - How to navigate the app
- **AI_ANALYSIS_IMPLEMENTATION.md** - AI log analysis setup
- **FEATURE_STATUS.md** - What features are implemented

## 💡 Pro Tips

1. **Multiple Jenkins Instances**: You can add multiple Jenkins servers!
2. **Health Checks**: The system periodically checks if Jenkins is responsive
3. **Load Balancing**: If you have multiple instances in a cluster, it will distribute load
4. **Caching**: All data is cached in SQLite for instant access
5. **Real-time**: New builds appear within 5 seconds of completion

---

**Still having issues?** Check the server logs for detailed error messages!
