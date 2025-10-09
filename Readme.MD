# JenKinds - Enterprise Jenkins Monitoring & Analytics Platform

<div align="center">

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.3+-blue.svg)](https://www.typescriptlang.org/)
[![Node.js](https://img.shields.io/badge/Node.js-20+-green.svg)](https://nodejs.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](CONTRIBUTING.md)
[![Code Quality](https://img.shields.io/badge/code%20quality-A+-brightgreen.svg)](https://sonarcloud.io)

**Transform Jenkins chaos into actionable insights with AI-powered log analysis and real-time monitoring.**

[Features](#-features) • [Architecture](#-architecture) • [Quick Start](#-quick-start) • [Documentation](#-documentation) • [Contributing](#-contributing)

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Core Features](#-core-features)
- [Technical Architecture](#-technical-architecture)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [Development Guidelines](#-development-guidelines)
- [QA & Testing Strategy](#-qa--testing-strategy)
- [Performance Optimization](#-performance-optimization)
- [Security Best Practices](#-security-best-practices)
- [Deployment](#-deployment)
- [Monitoring & Observability](#-monitoring--observability)
- [API Documentation](#-api-documentation)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)
- [License](#-license)

---

## 🎯 Overview

**JenKinds** is an enterprise-grade monitoring and analytics platform designed to provide unprecedented visibility into Jenkins CI/CD pipelines, with a focus on **Freestyle jobs** that traditional monitoring tools struggle to support.

### 🎨 Vision

Eliminate the productivity drain of managing thousands of browser tabs, manually parsing multi-gigabyte log files, and tracking executor status across distributed build environments. JenKinds delivers AI-powered insights that transform reactive firefighting into proactive optimization.

### 🏆 Key Differentiators

- **AI-Powered Log Analysis**: Parse and summarize logs up to 140MB in seconds using advanced NLP
- **Freestyle Job Support**: Full API support for Freestyle jobs that standard Jenkins APIs miss
- **Real-Time Monitoring**: Sub-200ms dashboard updates with WebSocket streaming
- **Intelligent Troubleshooting**: Root cause analysis with ML-based failure prediction
- **Zero Tab Chaos**: Unified dashboard replacing thousands of browser tabs

---

## 🚀 Core Features

### 1. 📊 Unified Dashboard

- **Real-time job status monitoring** across all Jenkins instances
- **Dynamic filtering** by labels, machines, worktrees, and custom tags
- **Customizable widgets** with drag-and-drop interface
- **Dark/Light themes** with accessibility compliance (WCAG 2.1 AA)

### 2. 🤖 AI-Powered Log Intelligence

```typescript
// Automatic log analysis with failure pattern recognition
{
  logSize: "140MB",
  processingTime: "< 3 seconds",
  features: [
    "Root cause identification",
    "Stack trace extraction",
    "Error pattern matching",
    "Historical correlation",
    "Actionable recommendations"
  ]
}
```

- **Smart Summarization**: Distill millions of log lines into actionable insights
- **Failure Classification**: Categorize errors (build, test, infrastructure, dependency)
- **Pattern Recognition**: Identify recurring issues across builds
- **Natural Language Summaries**: Human-readable failure explanations

### 3. ⚡ Executor Management

- **Real-time executor tracking** with health metrics
- **Build queue visualization** with predicted wait times
- **Performance analytics**: Success/failure rates, average duration, trends
- **Capacity planning**: Utilization heatmaps and bottleneck detection
- **Worktree mapping**: Visual representation of executor-to-worktree relationships

### 4. 🔍 Advanced Troubleshooting System

- **Build flow visualization**: Interactive DAG of job dependencies
- **Performance profiling**: Stage-by-stage timing analysis
- **Historical comparison**: Side-by-side build diffs
- **Anomaly detection**: ML-based deviation alerts
- **Predictive maintenance**: Failure probability scoring

### 5. 🏷️ Dynamic Label Management

- **Multi-dimensional filtering**: Combine labels, environments, versions
- **Machine correlation**: Track which machines executed specific builds
- **Geographical distribution**: Regional performance comparison
- **Custom tagging**: User-defined metadata for advanced searches

---

## 🏗️ Technical Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                       Frontend Layer                         │
│  React 18 + TypeScript + Tailwind CSS + Zustand + Vite     │
└────────────────────┬────────────────────────────────────────┘
                     │ REST API / WebSocket
┌────────────────────▼────────────────────────────────────────┐
│                    API Gateway Layer                         │
│        Node.js 20 + Fastify + tRPC + Rate Limiting         │
└────────────────────┬────────────────────────────────────────┘
                     │
        ┌────────────┼────────────┐
        │            │            │
┌───────▼──────┐ ┌──▼─────────┐ ┌▼──────────────┐
│  Jenkins API │ │   AI/ML    │ │  Data Layer   │
│   Adapter    │ │  Service   │ │  PostgreSQL   │
│              │ │  (OpenAI)  │ │  + Redis      │
└──────────────┘ └────────────┘ └───────────────┘
```

### Component Architecture

#### Frontend Architecture
```typescript
src/
├── features/            # Feature-based modules
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   └── types/
│   ├── jobs/
│   ├── executors/
│   └── logs/
├── shared/             # Shared utilities
│   ├── components/     # Reusable UI components
│   ├── hooks/          # Custom React hooks
│   ├── utils/          # Helper functions
│   └── types/          # Global TypeScript types
└── core/               # Core infrastructure
    ├── api/            # API client
    ├── router/         # Routing configuration
    └── store/          # Global state management
```

#### Backend Architecture
```typescript
src/
├── modules/
│   ├── jenkins/        # Jenkins integration
│   ├── logs/           # Log processing
│   ├── analytics/      # Data analytics
│   └── ai/             # AI/ML services
├── common/
│   ├── middleware/     # Express middleware
│   ├── guards/         # Authentication guards
│   └── decorators/     # Custom decorators
├── config/             # Configuration
└── infrastructure/
    ├── database/       # Database layer
    ├── cache/          # Redis cache
    └── queue/          # Job queue (Bull)
```

### Data Flow

1. **Jenkins Polling Service** → Fetch job/executor data every 5s
2. **Event Stream** → Push real-time updates via WebSocket
3. **Log Processor** → Async processing of large log files
4. **AI Analysis** → Batch processing with result caching
5. **State Synchronization** → Optimistic UI updates with rollback

---

## 🛠️ Technology Stack

### Frontend
- **Framework**: React 18.2+ (with Concurrent Features)
- **Language**: TypeScript 5.3+ (strict mode)
- **Build Tool**: Vite 5.0+ (with SWC)
- **Styling**: Tailwind CSS 3.4+ + CSS Modules
- **State Management**: Zustand 4.4+ (with middleware)
- **Data Fetching**: TanStack Query v5 (React Query)
- **Routing**: React Router v6.20+
- **Forms**: React Hook Form + Zod validation
- **Charts**: Recharts + D3.js
- **Real-time**: Socket.io-client
- **Testing**: Vitest + React Testing Library + Playwright

### Backend
- **Runtime**: Node.js 20.10+ LTS
- **Framework**: Fastify 4.24+ (high performance)
- **Language**: TypeScript 5.3+
- **API**: tRPC 10.45+ (end-to-end type safety)
- **Database**: PostgreSQL 16+ (with TimescaleDB for time-series)
- **Cache**: Redis 7.2+ (with Redis Stack)
- **ORM**: Prisma 5.7+
- **Queue**: BullMQ 5.0+ (background jobs)
- **Real-time**: Socket.io
- **Validation**: Zod 3.22+
- **Testing**: Vitest + Supertest + Testcontainers

### AI/ML Services
- **Log Analysis**: OpenAI GPT-4 Turbo / Claude 3 Opus
- **Pattern Recognition**: TensorFlow.js
- **Anomaly Detection**: Custom ML models (Python microservice)

### Infrastructure
- **Container**: Docker 24+ with multi-stage builds
- **Orchestration**: Kubernetes 1.28+ / Docker Compose
- **Reverse Proxy**: Nginx 1.25+ / Traefik v3
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack (Elasticsearch, Logstash, Kibana)
- **Tracing**: OpenTelemetry + Jaeger
- **CI/CD**: GitHub Actions / GitLab CI
- **Cloud**: AWS / Azure / GCP ready

### Development Tools
- **Package Manager**: pnpm 8.12+
- **Linting**: ESLint 8+ with TypeScript rules
- **Formatting**: Prettier 3.1+
- **Git Hooks**: Husky + lint-staged
- **Commit Convention**: Conventional Commits
- **API Documentation**: OpenAPI 3.1 / tRPC auto-docs
- **Code Quality**: SonarQube / SonarCloud

---

## 🚀 Getting Started

### Prerequisites

```bash
# Required versions
Node.js >= 20.10.0
pnpm >= 8.12.0
Docker >= 24.0.0
PostgreSQL >= 16.0
Redis >= 7.2.0
```

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/jenkinds.git
cd jenkinds

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Start infrastructure services
docker-compose up -d postgres redis

# Run database migrations
pnpm db:migrate

# Seed development data (optional)
pnpm db:seed

# Start development servers
pnpm dev
```

### 🔌 Port Configuration

JenKinds runs on port 6000 (frontend) and 6001 (backend) by default. If you have port conflicts, use the automated port configuration tool:

```bash
# Use 8000 range
pnpm ports 8000

# Use original 3000 range
pnpm ports 3000

# Use any base port (1024-65533)
pnpm ports 7500

# After changing ports, rebuild and restart
pnpm build
pnpm dev
```

The script automatically updates all configuration files and calculates derived ports:
- **Frontend**: Base port (e.g., 8000)
- **Backend API**: Base + 1 (e.g., 8001)
- **Grafana**: Base + 2 (e.g., 8002)

See [PORT_CONFIG.md](PORT_CONFIG.md) for detailed configuration guide.

### Environment Configuration

Create a `.env` file:

```bash
# Application
NODE_ENV=development
PORT=6000              # Frontend port (use 'pnpm ports' to change)
API_PORT=6001          # Backend API port

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/jenkinds"

# Redis
REDIS_URL="redis://localhost:6379"

# Jenkins
JENKINS_URL=https://your-jenkins.com
JENKINS_USER=your-username
JENKINS_API_TOKEN=your-api-token

# AI Services
OPENAI_API_KEY=your-openai-key
OPENAI_MODEL=gpt-4-turbo-preview

# Authentication
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Monitoring
SENTRY_DSN=your-sentry-dsn
ENABLE_METRICS=true
```

### Docker Quick Start

```bash
# Build and run all services
docker-compose up --build

# Access the application
# Frontend: http://localhost:6000
# API: http://localhost:6001
# Grafana: http://localhost:6002
```

---

## 💻 Development Guidelines

### Code Standards

#### TypeScript Best Practices

```typescript
// ✅ DO: Use strict typing with interfaces
interface BuildJob {
  id: string;
  name: string;
  status: BuildStatus;
  duration: number;
  timestamp: Date;
}

// ✅ DO: Use discriminated unions for state
type JobState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: BuildJob[] }
  | { status: 'error'; error: Error };

// ✅ DO: Use generic constraints
function processLogs<T extends { message: string }>(logs: T[]): string {
  return logs.map(log => log.message).join('\n');
}

// ❌ DON'T: Use 'any' type
function badFunction(data: any) { } // Never do this

// ✅ DO: Use 'unknown' and type guards
function goodFunction(data: unknown) {
  if (typeof data === 'string') {
    return data.toUpperCase();
  }
}
```

#### React Component Patterns

```typescript
// ✅ DO: Use functional components with TypeScript
interface JobCardProps {
  job: BuildJob;
  onSelect: (id: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect }) => {
  const handleClick = useCallback(() => {
    onSelect(job.id);
  }, [job.id, onSelect]);

  return (
    <div className="job-card" onClick={handleClick}>
      <h3>{job.name}</h3>
      <StatusBadge status={job.status} />
    </div>
  );
};

// ✅ DO: Use custom hooks for logic reuse
function useJobStatus(jobId: string) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => fetchJob(jobId),
    refetchInterval: 5000,
  });

  return { job: data, isLoading, error };
}

// ✅ DO: Implement error boundaries
class ErrorBoundary extends React.Component<Props, State> {
  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    logErrorToService(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return <ErrorFallback error={this.state.error} />;
    }
    return this.props.children;
  }
}
```

#### Performance Optimization

```typescript
// ✅ DO: Memoize expensive computations
const expensiveValue = useMemo(() => {
  return processLargeDataset(data);
}, [data]);

// ✅ DO: Use React.memo for pure components
export const JobList = React.memo<JobListProps>(
  ({ jobs, onSelect }) => {
    return (
      <ul>
        {jobs.map(job => (
          <JobCard key={job.id} job={job} onSelect={onSelect} />
        ))}
      </ul>
    );
  },
  (prevProps, nextProps) => {
    return prevProps.jobs === nextProps.jobs;
  }
);

// ✅ DO: Implement virtual scrolling for large lists
import { useVirtualizer } from '@tanstack/react-virtual';

function LogViewer({ logs }: { logs: string[] }) {
  const parentRef = useRef<HTMLDivElement>(null);
  const virtualizer = useVirtualizer({
    count: logs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 35,
  });

  return (
    <div ref={parentRef} style={{ height: '600px', overflow: 'auto' }}>
      <div style={{ height: `${virtualizer.getTotalSize()}px` }}>
        {virtualizer.getVirtualItems().map(item => (
          <div key={item.key} style={{ height: `${item.size}px` }}>
            {logs[item.index]}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### API Design Principles

```typescript
// ✅ DO: Use tRPC for type-safe APIs
import { z } from 'zod';
import { router, publicProcedure } from './trpc';

export const jobRouter = router({
  getAll: publicProcedure
    .input(z.object({
      status: z.enum(['success', 'failed', 'running']).optional(),
      limit: z.number().min(1).max(100).default(20),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input }) => {
      return await db.job.findMany({
        where: { status: input.status },
        take: input.limit,
        skip: input.offset,
      });
    }),

  analyze: publicProcedure
    .input(z.object({
      jobId: z.string().uuid(),
      buildNumber: z.number().int().positive(),
    }))
    .mutation(async ({ input }) => {
      const logs = await fetchJobLogs(input.jobId, input.buildNumber);
      const analysis = await analyzeLogsWithAI(logs);
      return analysis;
    }),
});
```

### Git Workflow

```bash
# Branch naming convention
feature/JIRA-123-add-log-analysis
bugfix/JIRA-456-fix-executor-crash
hotfix/critical-security-patch
refactor/improve-performance

# Commit message format (Conventional Commits)
git commit -m "feat(logs): add AI-powered log summarization

- Integrate OpenAI GPT-4 for log analysis
- Add streaming support for real-time summaries
- Implement error categorization

Closes #123"

# Types: feat, fix, docs, style, refactor, perf, test, chore
```

### Code Review Checklist

- [ ] Code follows TypeScript strict mode guidelines
- [ ] All functions have proper type annotations
- [ ] Tests added/updated (min 80% coverage)
- [ ] Performance impact assessed (bundle size, runtime)
- [ ] Error handling implemented
- [ ] Logging added for debugging
- [ ] Documentation updated
- [ ] Accessibility compliance (WCAG 2.1 AA)
- [ ] Security vulnerabilities checked
- [ ] No console.log() in production code

---

## 🧪 QA & Testing Strategy

### Testing Pyramid

```
        ┌─────────────┐
        │   E2E (5%)  │  Playwright - Critical user flows
        ├─────────────┤
        │ Integration │  API + DB integration tests
        │    (15%)    │
        ├─────────────┤
        │   Unit      │  Component & function tests
        │   (80%)     │
        └─────────────┘
```

### Unit Testing

```typescript
// Example: Component testing with Vitest + RTL
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { JobCard } from './JobCard';

describe('JobCard', () => {
  it('should render job details correctly', () => {
    const job = {
      id: '1',
      name: 'Build Main',
      status: 'success' as const,
      duration: 120000,
      timestamp: new Date('2024-01-01'),
    };

    render(<JobCard job={job} onSelect={vi.fn()} />);

    expect(screen.getByText('Build Main')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const mockOnSelect = vi.fn();
    const job = { id: '1', name: 'Test', status: 'success' as const };

    render(<JobCard job={job} onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByRole('button'));

    await waitFor(() => {
      expect(mockOnSelect).toHaveBeenCalledWith('1');
    });
  });

  it('should handle error state gracefully', () => {
    const job = { id: '1', name: 'Failed Build', status: 'failed' as const };

    render(<JobCard job={job} onSelect={vi.fn()} />);

    expect(screen.getByRole('alert')).toHaveTextContent('Build failed');
  });
});
```

### Integration Testing

```typescript
// Example: API integration test
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import type { AppRouter } from '../src/server/router';

describe('Job API Integration', () => {
  let trpc: ReturnType<typeof createTRPCProxyClient<AppRouter>>;

  beforeAll(async () => {
    // Start test server
    trpc = createTRPCProxyClient<AppRouter>({
      links: [httpBatchLink({ url: 'http://localhost:3001/trpc' })],
    });
  });

  it('should fetch jobs with filters', async () => {
    const result = await trpc.job.getAll.query({
      status: 'success',
      limit: 10,
    });

    expect(result).toHaveLength(10);
    expect(result[0]).toHaveProperty('id');
    expect(result[0].status).toBe('success');
  });

  it('should analyze logs and return summary', async () => {
    const result = await trpc.job.analyze.mutate({
      jobId: 'test-job-id',
      buildNumber: 42,
    });

    expect(result).toHaveProperty('summary');
    expect(result).toHaveProperty('rootCause');
    expect(result.summary).toBeTruthy();
  });
});
```

### E2E Testing

```typescript
// Example: Playwright E2E test
import { test, expect } from '@playwright/test';

test.describe('Jenkins Dashboard', () => {
  test('should display jobs and allow filtering', async ({ page }) => {
    await page.goto('http://localhost:3000');

    // Wait for jobs to load
    await expect(page.locator('[data-testid="job-card"]')).toHaveCount(20, {
      timeout: 10000,
    });

    // Apply filter
    await page.getByRole('button', { name: 'Filter' }).click();
    await page.getByLabel('Status').selectOption('failed');
    await page.getByRole('button', { name: 'Apply' }).click();

    // Verify filtered results
    await expect(page.locator('[data-testid="job-status"]')).toContainText('failed');
  });

  test('should navigate to log analysis page', async ({ page }) => {
    await page.goto('http://localhost:3000');

    await page.locator('[data-testid="job-card"]').first().click();
    await page.getByRole('button', { name: 'Analyze Logs' }).click();

    // Wait for AI analysis
    await expect(page.getByText('Analysis complete')).toBeVisible({
      timeout: 30000,
    });

    await expect(page.getByTestId('log-summary')).toBeVisible();
  });

  test('should handle executor dashboard interactions', async ({ page }) => {
    await page.goto('http://localhost:3000/executors');

    await expect(page.getByText('Active Executors')).toBeVisible();

    // Click on executor
    await page.locator('[data-testid="executor-row"]').first().click();

    // Verify executor details
    await expect(page.getByText('Build History')).toBeVisible();
    await expect(page.getByText('Performance Metrics')).toBeVisible();
  });
});
```

### Performance Testing

```typescript
// Example: Lighthouse CI configuration
// lighthouserc.js
module.exports = {
  ci: {
    collect: {
      startServerCommand: 'pnpm preview',
      url: ['http://localhost:3000', 'http://localhost:3000/executors'],
      numberOfRuns: 3,
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9 }],
        'categories:accessibility': ['error', { minScore: 0.95 }],
        'categories:best-practices': ['error', { minScore: 0.9 }],
        'categories:seo': ['warn', { minScore: 0.9 }],
        'first-contentful-paint': ['error', { maxNumericValue: 2000 }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1 }],
        'total-blocking-time': ['error', { maxNumericValue: 300 }],
      },
    },
  },
};
```

### Load Testing

```typescript
// Example: k6 load test script
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up
    { duration: '5m', target: 100 }, // Stay at 100 users
    { duration: '2m', target: 200 }, // Spike to 200 users
    { duration: '5m', target: 200 },
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500', 'p(99)<1000'],
    http_req_failed: ['rate<0.01'],
  },
};

export default function () {
  const response = http.get('http://localhost:3001/api/jobs');

  check(response, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}
```

### Test Coverage Requirements

```bash
# Minimum coverage thresholds
branches: 80%
functions: 85%
lines: 85%
statements: 85%

# Run tests with coverage
pnpm test:coverage

# View coverage report
open coverage/index.html
```

---

## ⚡ Performance Optimization

### Frontend Performance Budgets

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'chart-vendor': ['recharts', 'd3'],
          'ui-vendor': ['@headlessui/react', '@heroicons/react'],
        },
      },
    },
    chunkSizeWarningLimit: 500, // 500KB per chunk
  },
  performance: {
    maxAssetSize: 500000, // 500KB
    maxEntrypointSize: 500000,
  },
});
```

### Performance Monitoring

```typescript
// Example: Custom performance monitoring
export function measurePerformance(name: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      const start = performance.now();
      try {
        const result = await originalMethod.apply(this, args);
        const end = performance.now();
        const duration = end - start;

        // Log to monitoring service
        console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);

        // Alert if threshold exceeded
        if (duration > 1000) {
          console.warn(`[Performance Warning] ${name} took ${duration}ms`);
        }

        return result;
      } catch (error) {
        const end = performance.now();
        console.error(`[Performance Error] ${name}: ${end - start}ms`, error);
        throw error;
      }
    };

    return descriptor;
  };
}

// Usage
class LogService {
  @measurePerformance('analyzeLog')
  async analyzeLog(logContent: string): Promise<LogAnalysis> {
    // Heavy processing
    return await aiService.analyze(logContent);
  }
}
```

### Caching Strategy

```typescript
// Multi-layer caching strategy
class CacheManager {
  private memoryCache = new Map<string, CacheEntry>();
  private redis: Redis;

  async get<T>(key: string): Promise<T | null> {
    // 1. Check memory cache (fastest)
    const memoryResult = this.memoryCache.get(key);
    if (memoryResult && !this.isExpired(memoryResult)) {
      return memoryResult.data as T;
    }

    // 2. Check Redis cache
    const redisResult = await this.redis.get(key);
    if (redisResult) {
      const data = JSON.parse(redisResult) as T;
      this.memoryCache.set(key, { data, expiresAt: Date.now() + 60000 });
      return data;
    }

    return null;
  }

  async set<T>(key: string, data: T, ttl: number = 300): Promise<void> {
    // Store in both caches
    this.memoryCache.set(key, { data, expiresAt: Date.now() + 60000 });
    await this.redis.setex(key, ttl, JSON.stringify(data));
  }
}
```

### Database Optimization

```sql
-- Essential indexes for performance
CREATE INDEX idx_jobs_status_created ON jobs(status, created_at DESC);
CREATE INDEX idx_builds_job_number ON builds(job_id, build_number);
CREATE INDEX idx_executors_status ON executors(status) WHERE status = 'busy';

-- Materialized view for dashboard
CREATE MATERIALIZED VIEW mv_job_statistics AS
SELECT
  j.id,
  j.name,
  COUNT(b.id) AS total_builds,
  COUNT(CASE WHEN b.status = 'success' THEN 1 END) AS successful_builds,
  AVG(b.duration) AS avg_duration,
  MAX(b.created_at) AS last_build_time
FROM jobs j
LEFT JOIN builds b ON j.id = b.job_id
GROUP BY j.id, j.name;

-- Refresh materialized view every 5 minutes
CREATE INDEX ON mv_job_statistics(id);
```

---

## 🔒 Security Best Practices

### Authentication & Authorization

```typescript
// JWT-based authentication with refresh tokens
interface TokenPayload {
  userId: string;
  role: 'admin' | 'user' | 'viewer';
  permissions: string[];
}

class AuthService {
  generateTokens(payload: TokenPayload) {
    const accessToken = jwt.sign(payload, process.env.JWT_SECRET!, {
      expiresIn: '15m',
    });

    const refreshToken = jwt.sign(
      { userId: payload.userId },
      process.env.REFRESH_TOKEN_SECRET!,
      { expiresIn: '7d' }
    );

    return { accessToken, refreshToken };
  }

  async validateToken(token: string): Promise<TokenPayload> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as TokenPayload;
      return decoded;
    } catch (error) {
      throw new UnauthorizedError('Invalid token');
    }
  }
}

// RBAC middleware
function requirePermission(permission: string) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const user = req.user as TokenPayload;

    if (!user.permissions.includes(permission)) {
      throw new ForbiddenError('Insufficient permissions');
    }

    next();
  };
}
```

### Input Validation

```typescript
// Comprehensive input validation with Zod
const CreateJobSchema = z.object({
  name: z.string()
    .min(3, 'Name must be at least 3 characters')
    .max(100, 'Name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9-_]+$/, 'Name can only contain alphanumeric characters, hyphens, and underscores'),
  description: z.string().max(500).optional(),
  jenkinsUrl: z.string().url('Must be a valid URL'),
  credentials: z.object({
    username: z.string().min(1),
    apiToken: z.string().min(1),
  }),
  settings: z.object({
    pollInterval: z.number().min(5).max(3600),
    logRetentionDays: z.number().min(1).max(365),
  }),
});

// Sanitize user input
import DOMPurify from 'isomorphic-dompurify';

function sanitizeHtml(dirty: string): string {
  return DOMPurify.sanitize(dirty, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'code', 'pre'],
    ALLOWED_ATTR: ['href'],
  });
}
```

### Security Headers

```typescript
// Helmet configuration for security headers
import helmet from 'helmet';

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
        connectSrc: ["'self'", process.env.API_URL],
        fontSrc: ["'self'"],
        objectSrc: ["'none'"],
        mediaSrc: ["'self'"],
        frameSrc: ["'none'"],
      },
    },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    noSniff: true,
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  })
);
```

### Rate Limiting

```typescript
// Advanced rate limiting with Redis
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';

const limiter = rateLimit({
  store: new RedisStore({
    client: redisClient,
    prefix: 'rate-limit:',
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json({
      error: 'Too many requests',
      retryAfter: req.rateLimit.resetTime,
    });
  },
});

app.use('/api/', limiter);
```

---

## 🚢 Deployment

### Docker Production Build

```dockerfile
# Dockerfile (multi-stage build)
FROM node:20-alpine AS base
RUN corepack enable && corepack prepare pnpm@8.12.0 --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile --prod

FROM base AS builder
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nodejs

COPY --from=deps --chown=nodejs:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=nodejs:nodejs /app/dist ./dist
COPY --from=builder --chown=nodejs:nodejs /app/package.json ./

USER nodejs
EXPOSE 3000

CMD ["node", "dist/index.js"]
```

### Kubernetes Deployment

```yaml
# k8s/deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: jenkinds
  labels:
    app: jenkinds
spec:
  replicas: 3
  selector:
    matchLabels:
      app: jenkinds
  template:
    metadata:
      labels:
        app: jenkinds
    spec:
      containers:
      - name: jenkinds
        image: jenkinds:latest
        ports:
        - containerPort: 3000
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: jenkinds-secrets
              key: database-url
        - name: REDIS_URL
          valueFrom:
            secretKeyRef:
              name: jenkinds-secrets
              key: redis-url
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
        livenessProbe:
          httpGet:
            path: /health
            port: 3000
          initialDelaySeconds: 30
          periodSeconds: 10
        readinessProbe:
          httpGet:
            path: /ready
            port: 3000
          initialDelaySeconds: 5
          periodSeconds: 5
---
apiVersion: v1
kind: Service
metadata:
  name: jenkinds-service
spec:
  selector:
    app: jenkinds
  ports:
  - protocol: TCP
    port: 80
    targetPort: 3000
  type: LoadBalancer
```

### CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: CI/CD Pipeline

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
        with:
          version: 8.12.0
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'pnpm'

      - name: Install dependencies
        run: pnpm install --frozen-lockfile

      - name: Lint
        run: pnpm lint

      - name: Type check
        run: pnpm type-check

      - name: Run unit tests
        run: pnpm test:coverage

      - name: Run E2E tests
        run: pnpm test:e2e

      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/coverage-final.json

  build:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - name: Build Docker image
        run: docker build -t jenkinds:${{ github.sha }} .

      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push jenkinds:${{ github.sha }}

  deploy:
    needs: build
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - name: Deploy to Kubernetes
        run: |
          kubectl set image deployment/jenkinds jenkinds=jenkinds:${{ github.sha }}
          kubectl rollout status deployment/jenkinds
```

---

## 📊 Monitoring & Observability

### Metrics Collection

```typescript
// Prometheus metrics
import { Registry, Counter, Histogram, Gauge } from 'prom-client';

const register = new Registry();

// Custom metrics
export const httpRequestDuration = new Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

export const activeJobs = new Gauge({
  name: 'jenkins_active_jobs',
  help: 'Number of active Jenkins jobs',
  registers: [register],
});

export const logAnalysisCounter = new Counter({
  name: 'log_analysis_total',
  help: 'Total number of log analyses performed',
  labelNames: ['status'],
  registers: [register],
});

// Middleware to track request metrics
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    httpRequestDuration.labels(req.method, req.route?.path || 'unknown', String(res.statusCode)).observe(duration);
  });
  next();
});
```

### Logging Strategy

```typescript
// Structured logging with Winston
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'jenkinds' },
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    }),
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
  ],
});

// Usage
logger.info('Job analysis started', {
  jobId: '123',
  buildNumber: 42,
  userId: 'user@example.com',
});

logger.error('Log analysis failed', {
  jobId: '123',
  error: error.message,
  stack: error.stack,
});
```

### Distributed Tracing

```typescript
// OpenTelemetry setup
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint: 'http://localhost:14268/api/traces',
  }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();
```

### Health Checks

```typescript
// Comprehensive health check endpoint
app.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: await checkDatabase(),
      redis: await checkRedis(),
      jenkins: await checkJenkinsConnection(),
    },
  };

  const isHealthy = Object.values(health.checks).every(check => check.status === 'ok');

  res.status(isHealthy ? 200 : 503).json(health);
});

async function checkDatabase(): Promise<{ status: string; latency: number }> {
  const start = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'ok', latency: Date.now() - start };
  } catch (error) {
    return { status: 'error', latency: Date.now() - start };
  }
}
```

---

## 📚 API Documentation

### API Endpoints Overview

```typescript
// tRPC Router Structure
const appRouter = router({
  job: jobRouter,        // Job management
  executor: executorRouter,  // Executor monitoring
  log: logRouter,        // Log analysis
  dashboard: dashboardRouter, // Dashboard data
  analytics: analyticsRouter, // Analytics & reporting
});

// Auto-generated API documentation available at:
// http://localhost:3001/api/docs
```

### Example API Calls

```typescript
// Fetch all jobs with pagination
const jobs = await trpc.job.getAll.query({
  status: 'running',
  limit: 20,
  offset: 0,
  sortBy: 'created_at',
  sortOrder: 'desc',
});

// Analyze job logs
const analysis = await trpc.log.analyze.mutate({
  jobId: 'job-123',
  buildNumber: 42,
  options: {
    includeStackTraces: true,
    maxSummaryLength: 500,
  },
});

// Get executor statistics
const stats = await trpc.executor.getStats.query({
  timeRange: '24h',
  groupBy: 'worktree',
});
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: High Memory Usage

```bash
# Check Node.js memory usage
node --max-old-space-size=4096 dist/index.js

# Monitor memory in real-time
pnpm add -D clinic
clinic doctor -- node dist/index.js
```

#### Issue: Slow Log Processing

```typescript
// Solution: Implement streaming with backpressure
import { Transform } from 'stream';

class LogChunker extends Transform {
  _transform(chunk: Buffer, encoding: string, callback: Function) {
    // Process in 1MB chunks
    const chunkSize = 1024 * 1024;
    for (let i = 0; i < chunk.length; i += chunkSize) {
      this.push(chunk.slice(i, i + chunkSize));
    }
    callback();
  }
}
```

#### Issue: Database Connection Pool Exhausted

```typescript
// Solution: Configure connection pool properly
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  connection: {
    pool: {
      min: 2,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 2000,
    },
  },
});
```

### Debug Mode

```bash
# Enable debug logging
DEBUG=jenkinds:* pnpm dev

# Enable Node.js inspector
node --inspect dist/index.js

# Profile application
node --prof dist/index.js
node --prof-process isolate-*.log > processed.txt
```

---

## 🤝 Contributing

We welcome contributions! Please follow these guidelines:

### Development Process

1. **Fork & Clone**: Fork the repo and clone your fork
2. **Branch**: Create a feature branch (`git checkout -b feature/amazing-feature`)
3. **Install**: Run `pnpm install`
4. **Develop**: Make your changes following our coding standards
5. **Test**: Ensure all tests pass (`pnpm test`)
6. **Commit**: Use conventional commits
7. **Push**: Push to your fork
8. **PR**: Open a Pull Request with a clear description

### Pull Request Guidelines

- **Title**: Use conventional commit format (e.g., `feat: add log streaming`)
- **Description**: Explain what, why, and how
- **Tests**: Include tests for new features
- **Documentation**: Update relevant docs
- **Changelog**: Add entry to CHANGELOG.md
- **Screenshots**: Include for UI changes

### Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please read our [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- Jenkins community for excellent CI/CD tooling
- OpenAI for AI-powered log analysis capabilities
- All contributors who have helped shape this project

---

## 📞 Support

- **Documentation**: https://jenkinds.io/docs
- **Issues**: https://github.com/your-org/jenkinds/issues
- **Discussions**: https://github.com/your-org/jenkinds/discussions
- **Email**: support@jenkinds.io
- **Slack**: [Join our community](https://jenkinds.slack.com)

---

<div align="center">

**Built with ❤️ by the JenKinds Team**

[Website](https://jenkinds.io) • [Documentation](https://docs.jenkinds.io) • [Blog](https://blog.jenkinds.io)

</div> 

