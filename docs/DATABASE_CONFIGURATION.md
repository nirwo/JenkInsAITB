# Database Configuration Guide

## Overview

JenkInsAITB supports both **SQLite** (default) and **PostgreSQL** databases.

---

## SQLite (Default - Recommended for Development)

**Pros:**
- ✅ Zero configuration
- ✅ No external database server needed
- ✅ File-based (easy backup)
- ✅ Fast for small to medium datasets
- ✅ Perfect for development and testing

**Cons:**
- ❌ Not recommended for high-concurrency production
- ❌ Single-writer limitation
- ❌ No network access (same-machine only)

### Configuration

**prisma/schema.prisma:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**.env:**
```bash
DATABASE_URL="file:./prisma/dev.db"
```

### Setup

```bash
# Generate Prisma client
pnpm prisma generate

# Create database and schema
pnpm prisma db push

# Open database GUI
pnpm db:studio
```

### Backup

```bash
# Backup database
cp prisma/dev.db prisma/dev.db.backup

# Restore database
cp prisma/dev.db.backup prisma/dev.db
```

---

## PostgreSQL (Recommended for Production)

**Pros:**
- ✅ High concurrency support
- ✅ Horizontal scaling
- ✅ Advanced features (full-text search, JSON, etc.)
- ✅ Better for large datasets
- ✅ Network accessible

**Cons:**
- ❌ Requires PostgreSQL server
- ❌ More complex setup
- ❌ Additional resource overhead

### Setup PostgreSQL

**Option 1: Docker (Easiest)**

```bash
# Create docker-compose.yml for PostgreSQL
cat > docker-compose.postgres.yml << 'EOF'
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: jenkinsdtb-postgres
    environment:
      POSTGRES_USER: jenkinds
      POSTGRES_PASSWORD: jenkinds
      POSTGRES_DB: jenkinds
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
EOF

# Start PostgreSQL
docker-compose -f docker-compose.postgres.yml up -d
```

**Option 2: Native Installation**

```bash
# macOS
brew install postgresql@15
brew services start postgresql@15
createdb jenkinds

# Ubuntu/Debian
sudo apt-get install postgresql-15
sudo systemctl start postgresql
sudo -u postgres createdb jenkinds

# Windows
# Download from: https://www.postgresql.org/download/windows/
```

### Configuration

**1. Update prisma/schema.prisma:**

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**2. Update .env:**

```bash
DATABASE_URL="postgresql://jenkinds:jenkinds@localhost:5432/jenkinds"
```

**3. Migrate database:**

```bash
# Create migration
pnpm prisma migrate dev --name init

# Or push schema directly
pnpm prisma db push
```

---

## Switching Between Databases

### SQLite → PostgreSQL

**1. Backup SQLite data:**
```bash
pnpm db:studio
# Export data manually or use Prisma migrate
```

**2. Update schema:**
```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

**3. Update .env:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

**4. Run migrations:**
```bash
pnpm prisma migrate dev --name switch-to-postgres
```

**5. Import data** (if needed):
```bash
# Use Prisma Studio or custom migration script
```

### PostgreSQL → SQLite

**1. Update schema:**
```prisma
datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}
```

**2. Update .env:**
```bash
DATABASE_URL="file:./prisma/dev.db"
```

**3. Push schema:**
```bash
pnpm prisma db push
```

**Note:** Some PostgreSQL-specific features may need adjustment.

---

## Production Recommendations

### For Small to Medium Applications
- **SQLite** is fine if:
  - Single server deployment
  - < 1000 concurrent users
  - Read-heavy workload
  - Simple backup/restore is acceptable

### For Large Applications
- **PostgreSQL** is recommended if:
  - Multiple servers/load balancing
  - High write concurrency
  - > 1000 concurrent users
  - Need advanced querying
  - Require connection pooling

---

## Database Optimization

### SQLite

**1. Enable WAL mode** (better concurrency):
```sql
PRAGMA journal_mode=WAL;
```

**2. Optimize settings in code:**
```typescript
// server/infrastructure/database/prisma.ts
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ['error', 'warn'],
});

// Enable SQLite optimizations
await prisma.$executeRaw`PRAGMA journal_mode=WAL;`;
await prisma.$executeRaw`PRAGMA synchronous=NORMAL;`;
await prisma.$executeRaw`PRAGMA cache_size=1000000;`;
await prisma.$executeRaw`PRAGMA temp_store=MEMORY;`;
```

### PostgreSQL

**1. Connection pooling:**
```bash
DATABASE_URL="postgresql://user:password@localhost:5432/db?connection_limit=10"
```

**2. Use PgBouncer** (recommended for production):
```bash
# Install PgBouncer
sudo apt-get install pgbouncer

# Configure connection pooling
# Connect app to PgBouncer instead of PostgreSQL directly
DATABASE_URL="postgresql://user:password@localhost:6432/db"
```

---

## Troubleshooting

### SQLite: "Database is locked"

**Cause:** Multiple processes trying to write simultaneously

**Solutions:**
1. Close all connections (including Prisma Studio)
2. Enable WAL mode (see optimization above)
3. Ensure no orphaned connections

```bash
# Check for locked database
lsof prisma/dev.db

# Kill process if needed
kill -9 <PID>
```

### PostgreSQL: "Connection refused"

**Solutions:**
```bash
# Check if PostgreSQL is running
# macOS
brew services list

# Linux
sudo systemctl status postgresql

# Check connection
psql -U jenkinds -d jenkinds -h localhost
```

### Prisma: "Environment variable not found"

**Solution:**
```bash
# Ensure .env file exists
ls -la .env

# Check DATABASE_URL is set
cat .env | grep DATABASE_URL

# Regenerate Prisma client
pnpm prisma generate
```

---

## Migration Guide

### Creating Migrations

```bash
# Development (auto-creates migration)
pnpm prisma migrate dev --name add-new-field

# Production (applies existing migrations)
pnpm prisma migrate deploy
```

### Reset Database

```bash
# WARNING: Deletes all data
pnpm prisma migrate reset

# Or manually
rm prisma/dev.db
pnpm prisma db push
```

### Seed Database

```bash
# Run seed script
pnpm db:seed

# Seed script location: prisma/seeds/index.ts
```

---

## Environment-Specific Configuration

### Development (.env)
```bash
DATABASE_URL="file:./prisma/dev.db"
```

### Testing (.env.test)
```bash
DATABASE_URL="file:./prisma/test.db"
```

### Production (.env.production)
```bash
DATABASE_URL="postgresql://user:password@prod-server:5432/jenkinds?sslmode=require"
```

---

## Backup Strategy

### SQLite
```bash
# Automated backup script
#!/bin/bash
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR
cp prisma/dev.db "$BACKUP_DIR/dev_$DATE.db"

# Keep only last 7 days
find $BACKUP_DIR -name "dev_*.db" -mtime +7 -delete
```

### PostgreSQL
```bash
# Backup
pg_dump -U jenkinds jenkinds > backup_$(date +%Y%m%d).sql

# Restore
psql -U jenkinds jenkinds < backup_20251009.sql
```

---

## Summary

| Feature | SQLite | PostgreSQL |
|---------|--------|------------|
| **Setup Difficulty** | 🟢 Easy | 🟡 Medium |
| **Configuration** | Zero | Moderate |
| **Performance** | Good (small data) | Excellent (all sizes) |
| **Concurrency** | Limited | High |
| **Scaling** | Vertical only | Horizontal + Vertical |
| **Best For** | Dev, Small apps | Production, Large apps |
| **Cost** | Free | Free (self-hosted) |

**Default Choice:** SQLite (already configured)  
**Upgrade When:** You need high concurrency or multi-server deployment

---

For more help, see:
- [Prisma SQLite Documentation](https://www.prisma.io/docs/concepts/database-connectors/sqlite)
- [Prisma PostgreSQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/postgresql)
