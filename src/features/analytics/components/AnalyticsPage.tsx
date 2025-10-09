import { Link } from 'react-router-dom';
import { trpc } from '@/core/api/trpc';
import {
  ChartBarIcon,
  CheckCircleIcon,
  XCircleIcon,
  ClockIcon,
  ServerIcon,
} from '@heroicons/react/24/outline';

export function AnalyticsPage() {
  const { data: instances, isLoading } = trpc.jenkins.getInstances.useQuery();
  const { data: jobsData } = trpc.job.getAll.useQuery({ limit: 100 }, { enabled: !!instances });

  const jobs = jobsData?.jobs || [];

  // Calculate statistics
  const successfulBuilds = jobs.filter((job) => job.lastBuildStatus === 'SUCCESS').length;
  const failedBuilds = jobs.filter((job) => job.lastBuildStatus === 'FAILURE').length;
  const runningBuilds = jobs.filter((job) => job.lastBuildStatus === 'RUNNING').length;
  const successRate =
    successfulBuilds + failedBuilds > 0
      ? Math.round((successfulBuilds / (successfulBuilds + failedBuilds)) * 100)
      : 0;

  // Calculate instance statistics
  const totalLoad = instances?.reduce((sum, i) => sum + (i.currentLoad || 0), 0) || 0;
  const totalCapacity = instances?.reduce((sum, i) => sum + (i.maxConnections || 0), 0) || 0;
  const utilizationRate = totalCapacity > 0 ? Math.round((totalLoad / totalCapacity) * 100) : 0;

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading analytics...</div>
        </div>
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400 mb-4">No Jenkins instances configured</p>
          <Link to="/settings" className="btn-primary">
            Add Jenkins Instance
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Analytics</h1>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Jobs</p>
              <p className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
                {jobs.length}
              </p>
            </div>
            <ChartBarIcon className="h-10 w-10 text-primary-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Success Rate</p>
              <p className="text-3xl font-bold text-success-600 dark:text-success-400 mt-1">
                {successRate}%
              </p>
            </div>
            <CheckCircleIcon className="h-10 w-10 text-success-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Failed Builds</p>
              <p className="text-3xl font-bold text-error-600 dark:text-error-400 mt-1">
                {failedBuilds}
              </p>
            </div>
            <XCircleIcon className="h-10 w-10 text-error-500" />
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Running</p>
              <p className="text-3xl font-bold text-primary-600 dark:text-primary-400 mt-1">
                {runningBuilds}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-primary-500" />
          </div>
        </div>
      </div>

      {/* Build Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Build Status Distribution
          </h2>
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Successful</span>
                <span className="text-sm font-medium text-success-600 dark:text-success-400">
                  {successfulBuilds}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-success-500 h-2 rounded-full"
                  style={{
                    width: `${jobs.length > 0 ? (successfulBuilds / jobs.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Failed</span>
                <span className="text-sm font-medium text-error-600 dark:text-error-400">
                  {failedBuilds}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-error-500 h-2 rounded-full"
                  style={{ width: `${jobs.length > 0 ? (failedBuilds / jobs.length) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 dark:text-gray-400">Running</span>
                <span className="text-sm font-medium text-primary-600 dark:text-primary-400">
                  {runningBuilds}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-500 h-2 rounded-full"
                  style={{
                    width: `${jobs.length > 0 ? (runningBuilds / jobs.length) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
            Instance Utilization
          </h2>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">Overall Utilization</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {utilizationRate}%
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                <div
                  className={`h-3 rounded-full ${
                    utilizationRate > 80
                      ? 'bg-error-500'
                      : utilizationRate > 60
                        ? 'bg-warning-500'
                        : 'bg-success-500'
                  }`}
                  style={{ width: `${utilizationRate}%` }}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Current Load</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{totalLoad}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Capacity</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {totalCapacity}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Instance Performance */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Instance Performance
        </h2>
        <div className="space-y-3">
          {instances.map((instance) => {
            const instanceUtilization =
              instance.maxConnections && instance.maxConnections > 0
                ? Math.round(((instance.currentLoad || 0) / instance.maxConnections) * 100)
                : 0;
            return (
              <div key={instance.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3 flex-1">
                  <ServerIcon className="h-5 w-5 text-gray-400" />
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium text-gray-900 dark:text-white">
                        {instance.name}
                      </span>
                      {instance.isPrimary && <span className="badge-info text-xs">Primary</span>}
                      <span
                        className={instance.isActive ? 'badge-success text-xs' : 'badge-error text-xs'}
                      >
                        {instance.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Load: {instance.currentLoad || 0} / {instance.maxConnections || 0} •
                      Utilization: {instanceUtilization}%
                    </div>
                  </div>
                </div>
                <div className="w-48">
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${
                        instanceUtilization > 80
                          ? 'bg-error-500'
                          : instanceUtilization > 60
                            ? 'bg-warning-500'
                            : 'bg-success-500'
                      }`}
                      style={{ width: `${Math.min(instanceUtilization, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
