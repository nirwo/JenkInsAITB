import { useAuthStore } from '@/features/auth/stores/authStore';
import { trpc } from '@/core/api/trpc';
import { Link } from 'react-router-dom';

export function Dashboard() {
  const { user } = useAuthStore();
  const { data: instances, isLoading: instancesLoading } = trpc.jenkins.getInstances.useQuery();
  
  const totalInstances = instances?.length || 0;
  const activeInstances = instances?.filter(i => i.isActive)?.length || 0;
  const healthyInstances = instances?.filter(i => i.isActive)?.length || 0;

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">Welcome back, {user?.firstName || user?.username}!</p>
      </div>

      <div className="grid grid-cols-1 gap-6 mb-8 lg:grid-cols-2 xl:grid-cols-4">
        <div className="card bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900 dark:to-primary-800">
          <p className="text-sm font-medium text-primary-600 dark:text-primary-300">Total Instances</p>
          <p className="text-3xl font-bold text-primary-900 dark:text-white mt-2">{instancesLoading ? '...' : totalInstances}</p>
        </div>
        <div className="card bg-gradient-to-br from-success-50 to-success-100 dark:from-success-900 dark:to-success-800">
          <p className="text-sm font-medium text-success-600 dark:text-success-300">Active</p>
          <p className="text-3xl font-bold text-success-900 dark:text-white mt-2">{instancesLoading ? '...' : activeInstances}</p>
        </div>
        <div className="card bg-gradient-to-br from-warning-50 to-warning-100 dark:from-warning-900 dark:to-warning-800">
          <p className="text-sm font-medium text-warning-600 dark:text-warning-300">Healthy</p>
          <p className="text-3xl font-bold text-warning-900 dark:text-white mt-2">{instancesLoading ? '...' : healthyInstances}</p>
        </div>
        <div className="card bg-gradient-to-br from-error-50 to-error-100 dark:from-error-900 dark:to-error-800">
          <p className="text-sm font-medium text-error-600 dark:text-error-300">Issues</p>
          <p className="text-3xl font-bold text-error-900 dark:text-white mt-2">{instancesLoading ? '...' : totalInstances - healthyInstances}</p>
        </div>
      </div>

      <div className="card mb-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">Jenkins Instances</h2>
          {user?.role === 'ADMIN' && <Link to="/settings?tab=jenkins" className="btn-primary text-sm">+ Add Instance</Link>}
        </div>
        {instancesLoading ? (
          <div className="text-center py-8"><div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div></div>
        ) : instances && instances.length > 0 ? (
          <div className="space-y-3">
            {instances.map((instance) => (
              <div key={instance.id} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${instance.isActive ? 'bg-success-500' : 'bg-error-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{instance.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{instance.url}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600 dark:text-gray-400 mb-4">No Jenkins instances configured yet.</p>
            {user?.role === 'ADMIN' && <Link to="/settings?tab=jenkins" className="btn-primary">Add Your First Instance</Link>}
          </div>
        )}
      </div>
    </div>
  );
}
