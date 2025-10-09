# Contributing to JenKinds

Thank you for your interest in contributing to JenKinds! This document provides guidelines and instructions for contributing to the project.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Workflow](#development-workflow)
- [Coding Standards](#coding-standards)
- [Testing Guidelines](#testing-guidelines)
- [Pull Request Process](#pull-request-process)
- [Release Process](#release-process)

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please be respectful and professional in all interactions.

## Getting Started

### Prerequisites

- Node.js >= 20.10.0
- pnpm >= 8.12.0
- Docker >= 24.0.0 (for local development)
- PostgreSQL >= 16.0
- Redis >= 7.2.0

### Setup Development Environment

1. **Fork and Clone**

```bash
git clone https://github.com/your-username/jenkinds.git
cd jenkinds
```

2. **Install Dependencies**

```bash
pnpm install
```

3. **Set up Environment Variables**

```bash
cp .env.example .env
# Edit .env with your configuration
```

4. **Start Infrastructure**

```bash
# Start PostgreSQL and Redis
docker-compose up -d postgres redis
```

5. **Run Database Migrations**

```bash
pnpm db:migrate
pnpm db:seed  # Optional: seed with sample data
```

6. **Start Development Servers**

```bash
pnpm dev  # Starts both frontend and backend
```

The application will be available at:
- Frontend: http://localhost:6000
- Backend API: http://localhost:6001
- Grafana: http://localhost:6002

## Development Workflow

### Branch Naming Convention

- `feature/JIRA-123-short-description` - New features
- `bugfix/JIRA-456-short-description` - Bug fixes
- `hotfix/critical-issue-description` - Critical production fixes
- `refactor/improve-performance` - Code refactoring
- `docs/update-readme` - Documentation updates

### Commit Message Format

We follow [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting, etc.)
- `refactor`: Code refactoring
- `perf`: Performance improvements
- `test`: Test additions or modifications
- `chore`: Build process or auxiliary tool changes

**Examples:**

```bash
feat(logs): add AI-powered log summarization

- Integrate OpenAI GPT-4 for log analysis
- Add streaming support for real-time summaries
- Implement error categorization

Closes #123
```

```bash
fix(executor): resolve memory leak in executor monitoring

The executor service was not properly cleaning up WebSocket
connections, causing memory to grow over time.

Fixes #456
```

## Coding Standards

### TypeScript

- **Strict Mode**: Always use TypeScript strict mode
- **No `any`**: Avoid using `any` type; use `unknown` with type guards
- **Explicit Types**: Provide explicit return types for functions
- **Interfaces over Types**: Prefer interfaces for object shapes

```typescript
// ✅ Good
interface User {
  id: string;
  email: string;
  role: UserRole;
}

function getUser(id: string): Promise<User> {
  return fetchUser(id);
}

// ❌ Bad
function getUser(id: any) {
  return fetchUser(id);
}
```

### React Components

- **Functional Components**: Use functional components with hooks
- **Named Exports**: Prefer named exports over default exports
- **Props Interface**: Define explicit props interfaces
- **Memoization**: Use `React.memo` for expensive pure components

```typescript
// ✅ Good
interface JobCardProps {
  job: Job;
  onSelect: (id: string) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onSelect }) => {
  return <div onClick={() => onSelect(job.id)}>{job.name}</div>;
};

// ❌ Bad
export default function JobCard(props: any) {
  return <div onClick={() => props.onSelect(props.job.id)}>{props.job.name}</div>;
}
```

### Code Organization

```
src/
├── features/           # Feature modules
│   ├── dashboard/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── stores/
│   │   ├── types/
│   │   └── services/
├── shared/            # Shared code
│   ├── components/
│   ├── hooks/
│   ├── utils/
│   └── types/
└── core/              # Core functionality
    ├── api/
    ├── router/
    └── store/
```

### Naming Conventions

- **Components**: PascalCase (`JobCard.tsx`)
- **Hooks**: camelCase with `use` prefix (`useJobStatus.ts`)
- **Utilities**: camelCase (`formatDate.ts`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRY_ATTEMPTS`)
- **Types/Interfaces**: PascalCase (`User`, `JobCardProps`)

## Testing Guidelines

### Testing Pyramid

- **80% Unit Tests**: Test individual functions and components
- **15% Integration Tests**: Test API endpoints and database interactions
- **5% E2E Tests**: Test critical user flows

### Unit Testing

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { JobCard } from './JobCard';

describe('JobCard', () => {
  it('should render job details correctly', () => {
    const job = { id: '1', name: 'Test Job', status: 'success' };
    render(<JobCard job={job} onSelect={vi.fn()} />);
    
    expect(screen.getByText('Test Job')).toBeInTheDocument();
    expect(screen.getByText('success')).toBeInTheDocument();
  });

  it('should call onSelect when clicked', async () => {
    const mockOnSelect = vi.fn();
    const job = { id: '1', name: 'Test Job', status: 'success' };
    
    render(<JobCard job={job} onSelect={mockOnSelect} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });
});
```

### Integration Testing

```typescript
import { describe, it, expect } from 'vitest';
import { trpc } from './trpc-client';

describe('Job API Integration', () => {
  it('should fetch jobs with filters', async () => {
    const result = await trpc.job.getAll.query({
      status: 'success',
      limit: 10,
    });

    expect(result.jobs).toHaveLength(10);
    expect(result.jobs[0].status).toBe('success');
  });
});
```

### E2E Testing

```typescript
import { test, expect } from '@playwright/test';

test('user can log in and view dashboard', async ({ page }) => {
  await page.goto('/');
  
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password');
  await page.click('button[type="submit"]');
  
  await expect(page.locator('h1')).toContainText('Dashboard');
  await expect(page.locator('[data-testid="job-card"]')).toBeVisible();
});
```

### Running Tests

```bash
# Unit tests
pnpm test

# Unit tests with coverage
pnpm test:coverage

# E2E tests
pnpm test:e2e

# E2E tests with UI
pnpm test:e2e:ui
```

## Pull Request Process

### Before Submitting

1. **Update from main**
   ```bash
   git checkout main
   git pull upstream main
   git checkout your-branch
   git rebase main
   ```

2. **Run all checks**
   ```bash
   pnpm lint
   pnpm type-check
   pnpm test:coverage
   ```

3. **Update documentation**
   - Update README if you changed functionality
   - Add JSDoc comments for new functions
   - Update API documentation if you changed endpoints

### PR Template

```markdown
## Description
Brief description of what this PR does

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Testing
- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

## Checklist
- [ ] Code follows project style guidelines
- [ ] Self-review completed
- [ ] Comments added for complex code
- [ ] Documentation updated
- [ ] No new warnings introduced
- [ ] Tests pass locally
- [ ] Dependent changes merged

## Screenshots (if applicable)
Add screenshots for UI changes

## Related Issues
Closes #123
```

### Code Review Guidelines

**For Authors:**
- Keep PRs small and focused (< 500 lines if possible)
- Provide clear description and context
- Respond to feedback promptly
- Be open to suggestions

**For Reviewers:**
- Be constructive and respectful
- Ask questions instead of making demands
- Approve when satisfied, request changes if needed
- Focus on logic, not style (let linters handle that)

## Release Process

### Versioning

We follow [Semantic Versioning](https://semver.org/):

- **MAJOR**: Breaking changes
- **MINOR**: New features (backward compatible)
- **PATCH**: Bug fixes (backward compatible)

### Release Checklist

1. Update version in `package.json`
2. Update `CHANGELOG.md`
3. Create release branch: `release/v1.2.3`
4. Run full test suite
5. Create release PR to `main`
6. Merge and tag release
7. Deploy to production
8. Create GitHub release with notes

## Performance Guidelines

### Frontend

- Bundle size < 500KB per chunk
- First Contentful Paint < 1.5s
- Time to Interactive < 3.5s
- Lighthouse score > 90

### Backend

- API response time < 200ms (p95)
- Database queries < 100ms (p95)
- Memory usage < 512MB
- Zero memory leaks

## Security Guidelines

- Never commit secrets or credentials
- Use environment variables for sensitive data
- Validate all user inputs
- Sanitize HTML content
- Use parameterized queries (Prisma handles this)
- Keep dependencies updated
- Follow OWASP Top 10 guidelines

## Questions?

If you have questions, please:
1. Check existing documentation
2. Search closed issues
3. Ask in GitHub Discussions
4. Contact maintainers

Thank you for contributing! 🎉
