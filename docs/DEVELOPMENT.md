# JenKinds Development Guide

## Quick Start

```bash
# 1. Install dependencies
pnpm install

# 2. Start infrastructure
docker-compose up -d

# 3. Setup database
pnpm db:generate
pnpm db:migrate

# 4. Start development servers
pnpm dev
```

## Project Structure

```
jenkinds/
├── src/                        # Frontend source code
│   ├── features/              # Feature modules
│   │   ├── dashboard/         # Dashboard feature
│   │   ├── jobs/              # Jobs management
│   │   ├── executors/         # Executor monitoring
│   │   ├── logs/              # Log analysis
│   │   ├── analytics/         # Analytics & reporting
│   │   └── auth/              # Authentication
│   ├── shared/                # Shared components & utilities
│   │   ├── components/        # Reusable UI components
│   │   ├── hooks/             # Custom React hooks
│   │   ├── utils/             # Utility functions
│   │   └── types/             # Shared TypeScript types
│   └── core/                  # Core functionality
│       ├── api/               # API client (tRPC)
│       ├── router/            # React Router setup
│       └── store/             # Global state management
│
├── server/                     # Backend source code
│   ├── modules/               # Feature modules
│   │   ├── jenkins/           # Jenkins integration
│   │   ├── logs/              # Log processing
│   │   ├── analytics/         # Analytics engine
│   │   ├── ai/                # AI/ML services
│   │   ├── auth/              # Authentication
│   │   └── executor/          # Executor monitoring
│   ├── common/                # Common utilities
│   │   ├── middleware/        # Express middleware
│   │   ├── guards/            # Auth guards
│   │   └── utils/             # Utility functions
│   ├── infrastructure/        # Infrastructure layer
│   │   ├── database/          # Database connection
│   │   ├── cache/             # Redis cache
│   │   └── queue/             # Background jobs
│   └── config/                # Configuration
│
├── prisma/                    # Database schema & migrations
├── tests/                     # Test files
│   ├── unit/                  # Unit tests
│   ├── integration/           # Integration tests
│   └── e2e/                   # End-to-end tests
├── docs/                      # Documentation
└── public/                    # Static assets
```

## Available Scripts

### Development

```bash
# Start both frontend and backend
pnpm dev

# Start frontend only
pnpm dev:client

# Start backend only
pnpm dev:server
```

### Building

```bash
# Build for production
pnpm build

# Build frontend only
pnpm build:client

# Build backend only
pnpm build:server

# Preview production build
pnpm preview
```

### Testing

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test --watch

# Run tests with UI
pnpm test:ui

# Run tests with coverage
pnpm test:coverage

# Run E2E tests
pnpm test:e2e

# Run E2E tests with UI
pnpm test:e2e:ui
```

### Code Quality

```bash
# Lint code
pnpm lint

# Fix linting issues
pnpm lint:fix

# Format code
pnpm format

# Type check
pnpm type-check
```

### Database

```bash
# Generate Prisma Client
pnpm db:generate

# Create migration
pnpm db:migrate

# Deploy migrations
pnpm db:migrate:deploy

# Seed database
pnpm db:seed

# Open Prisma Studio
pnpm db:studio

# Push schema changes
pnpm db:push
```

### Docker

```bash
# Start all services
pnpm docker:dev

# Stop all services
pnpm docker:down

# View logs
pnpm docker:logs
```

### Analysis

```bash
# Analyze bundle size
pnpm analyze
```

## Environment Variables

### Required Variables

```bash
# Application
NODE_ENV=development
PORT=3000
API_PORT=3001

# Database
DATABASE_URL="postgresql://user:pass@localhost:5432/jenkinds"

# Redis
REDIS_URL="redis://localhost:6379"

# Jenkins
JENKINS_URL=https://your-jenkins.com
JENKINS_USER=your-username
JENKINS_API_TOKEN=your-api-token

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h
```

### Optional Variables

```bash
# AI Services
OPENAI_API_KEY=your-openai-key
ENABLE_AI_ANALYSIS=true

# Monitoring
ENABLE_METRICS=true
SENTRY_DSN=your-sentry-dsn

# Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
```

## Development Workflow

### 1. Create Feature Branch

```bash
git checkout -b feature/JIRA-123-add-feature
```

### 2. Make Changes

- Follow coding standards
- Write tests
- Update documentation

### 3. Run Quality Checks

```bash
pnpm lint
pnpm type-check
pnpm test:coverage
```

### 4. Commit Changes

```bash
git add .
git commit -m "feat(scope): add new feature

- Detailed description
- What changed
- Why it changed

Closes #123"
```

### 5. Push and Create PR

```bash
git push origin feature/JIRA-123-add-feature
```

## Debugging

### Frontend Debugging

1. **React DevTools**: Install browser extension
2. **React Query DevTools**: Automatically enabled in dev mode
3. **Redux DevTools**: Available if using Redux

```typescript
// Add debugger statements
debugger;

// Console logging
console.log('Debug info:', data);

// React Query cache inspection
import { useQueryClient } from '@tanstack/react-query';

const queryClient = useQueryClient();
console.log(queryClient.getQueryData(['jobs']));
```

### Backend Debugging

1. **Node Inspector**:
```bash
node --inspect server/index.ts
```

2. **VS Code Launch Configuration**:
```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Server",
  "program": "${workspaceFolder}/server/index.ts",
  "preLaunchTask": "tsc",
  "outFiles": ["${workspaceFolder}/dist/**/*.js"]
}
```

3. **Logging**:
```typescript
import { logger } from './common/utils/logger';

logger.info('Info message');
logger.error('Error message', error);
logger.debug('Debug info', { data });
```

### Database Debugging

```bash
# View database in Prisma Studio
pnpm db:studio

# Check database connection
psql -h localhost -U jenkinds -d jenkinds

# View logs
docker-compose logs postgres
```

## Performance Optimization

### Frontend

1. **Code Splitting**:
```typescript
const Dashboard = lazy(() => import('./features/dashboard/Dashboard'));
```

2. **Memoization**:
```typescript
const expensiveValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
```

3. **Virtual Scrolling**:
```typescript
import { useVirtualizer } from '@tanstack/react-virtual';
```

### Backend

1. **Database Indexing**:
```sql
CREATE INDEX idx_jobs_status ON jobs(status);
```

2. **Caching**:
```typescript
const cached = await redis.get(key);
if (cached) return JSON.parse(cached);
```

3. **Query Optimization**:
```typescript
// Use select to fetch only needed fields
const jobs = await prisma.job.findMany({
  select: { id: true, name: true, status: true }
});
```

## Troubleshooting

### Port Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>
```

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart PostgreSQL
docker-compose restart postgres

# Check logs
docker-compose logs postgres
```

### Module Not Found

```bash
# Clear node_modules and reinstall
rm -rf node_modules
pnpm install

# Clear pnpm cache
pnpm store prune
```

### TypeScript Errors

```bash
# Regenerate types
pnpm db:generate

# Check tsconfig.json paths
```

## Best Practices

### Component Structure

```typescript
// 1. Imports
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types
interface Props {
  userId: string;
}

// 3. Component
export const UserProfile: React.FC<Props> = ({ userId }) => {
  // 4. Hooks
  const { data, isLoading } = useQuery(['user', userId], () => fetchUser(userId));
  
  // 5. Event handlers
  const handleClick = () => {
    // ...
  };
  
  // 6. Render
  if (isLoading) return <Loader />;
  
  return (
    <div>
      {/* ... */}
    </div>
  );
};
```

### API Endpoint Structure

```typescript
// 1. Input validation
const inputSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['active', 'inactive']),
});

// 2. Route definition
export const userRouter = router({
  getById: protectedProcedure
    .input(inputSchema)
    .query(async ({ ctx, input }) => {
      // 3. Business logic
      const user = await ctx.prisma.user.findUnique({
        where: { id: input.id },
      });
      
      // 4. Response
      return user;
    }),
});
```

## Additional Resources

- [React Documentation](https://react.dev)
- [TypeScript Documentation](https://www.typescriptlang.org/docs)
- [tRPC Documentation](https://trpc.io/docs)
- [Prisma Documentation](https://www.prisma.io/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Vitest Documentation](https://vitest.dev)
- [Playwright Documentation](https://playwright.dev)

## Support

- GitHub Issues: Report bugs and request features
- GitHub Discussions: Ask questions and share ideas
- Email: support@jenkinds.io
