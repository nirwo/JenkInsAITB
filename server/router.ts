import { router } from './context';
import { authRouter } from './modules/auth/auth.router';
import { jobRouter } from './modules/jenkins/job.router';
import { executorRouter } from './modules/executor/executor.router';
import { logRouter } from './modules/logs/log.router';
import { analyticsRouter } from './modules/analytics/analytics.router';

export const appRouter = router({
  auth: authRouter,
  job: jobRouter,
  executor: executorRouter,
  log: logRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;
