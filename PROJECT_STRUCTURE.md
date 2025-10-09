# JenKinds Project Structure

## 📁 Directory Layout

```
JenKinds/
├── src/                   # Frontend source code
│   ├── core/             # Core functionality
│   ├── features/         # Feature modules
│   └── shared/           # Shared resources
├── server/               # Backend source code
│   ├── modules/          # Feature modules
│   ├── common/           # Common utilities
│   └── infrastructure/   # Infrastructure
├── prisma/               # Database
├── scripts/              # Build & utility scripts
├── docs/                 # Documentation
├── docker-compose.yml    # Docker services
└── package.json          # Dependencies
```

## 📄 Essential Files

### Configuration
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` / `tsconfig.server.json` - TypeScript configuration
- `vite.config.ts` - Vite bundler configuration
- `.env.example` - Environment variables template

### Documentation
- `Readme.MD` - Main project README
- `QUICKSTART.md` - 5-minute quick start
- `DEPLOYMENT_GUIDE.md` - Deployment instructions
- `SETUP_GUIDE.md` - Manual setup guide
- `ARCHITECTURE.md` - System architecture

## 🎯 Key Commands

```bash
# Development
pnpm dev                  # Start dev servers
pnpm build               # Build for production
pnpm start               # Start production server

# Management
./manage.sh start        # Start server
./manage.sh stop         # Stop server
./manage.sh status       # Show status
./manage.sh logs         # View logs

# Database
pnpm prisma:generate     # Generate Prisma Client
pnpm prisma:push         # Push schema changes

# User Management
pnpm create:admin        # Create admin user
pnpm list:users          # List users
```

## 🌐 Access Points

- **Frontend**: http://localhost:9010 (dev) / http://localhost:9011 (prod)
- **Backend API**: http://localhost:9011
- **Health**: http://localhost:9011/health
- **tRPC**: http://localhost:9011/trpc
