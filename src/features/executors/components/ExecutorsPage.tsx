import { Link } from 'react-router-dom';
import { trpc } from '@/core/api/trpc';
import { CpuChipIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export function ExecutorsPage() {
  const { data: instances, isLoading } = trpc.jenkins.getInstances.useQuery();

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!instances || instances.length === 0) {
    return (
      <div className="p-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Executors</h1>
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
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Executors</h1>

      <div className="grid gap-6">
        {instances.map((instance) => (
          <div key={instance.id} className="card">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <CpuChipIcon className="h-6 w-6 text-primary-500" />
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    {instance.name}
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{instance.url}</p>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                {instance.isActive ? (
                  <CheckCircleIcon className="h-5 w-5 text-success-500" />
                ) : (
                  <XCircleIcon className="h-5 w-5 text-error-500" />
                )}
                <span className={instance.isActive ? 'badge-success' : 'badge-error'}>
                  {instance.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Current Load</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {instance.currentLoad || 0}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Max Connections</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {instance.maxConnections || 0}
                </div>
              </div>
              <div className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div className="text-sm text-gray-500 dark:text-gray-400">Utilization</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                  {instance.maxConnections
                    ? Math.round(((instance.currentLoad || 0) / instance.maxConnections) * 100)
                    : 0}
                  %
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                Priority: <span className="font-medium text-gray-900 dark:text-white">{instance.priority || 0}</span>
                {instance.clusterId && (
                  <>
                    {' '}• Cluster: <span className="font-medium text-gray-900 dark:text-white">{instance.clusterId}</span>
                  </>
                )}
                {instance.isPrimary && (
                  <span className="ml-2 badge-info">Primary</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Total Executor Statistics
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Instances</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {instances.length}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Capacity</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {instances.reduce((sum, i) => sum + (i.maxConnections || 0), 0)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-500 dark:text-gray-400">Total Load</div>
            <div className="text-3xl font-bold text-gray-900 dark:text-white mt-1">
              {instances.reduce((sum, i) => sum + (i.currentLoad || 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
