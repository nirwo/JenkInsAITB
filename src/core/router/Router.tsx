import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { MainLayout } from '@/shared/components/layouts/MainLayout';
import { Dashboard } from '@/features/dashboard/components/Dashboard';
import { JobsPage } from '@/features/jobs/components/JobsPage';
import { JobDetailPage } from '@/features/jobs/components/JobDetailPage';
import { ExecutorsPage } from '@/features/executors/components/ExecutorsPage';
import { LogAnalysisPage } from '@/features/logs/components/LogAnalysisPage';
import { AnalyticsPage } from '@/features/analytics/components/AnalyticsPage';
import { LoginPage } from '@/features/auth/components/LoginPage';
import { NotFoundPage } from '@/shared/components/NotFoundPage';
import { PrivateRoute } from './PrivateRoute';

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        
        <Route
          path="/"
          element={
            <PrivateRoute>
              <MainLayout />
            </PrivateRoute>
          }
        >
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="jobs/:jobId" element={<JobDetailPage />} />
          <Route path="executors" element={<ExecutorsPage />} />
          <Route path="logs/:buildId" element={<LogAnalysisPage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
        </Route>

        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </BrowserRouter>
  );
}
