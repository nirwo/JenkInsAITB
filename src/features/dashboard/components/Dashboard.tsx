export function Dashboard() {
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Jobs</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">0</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Builds</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">0</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Success Rate</h3>
          <p className="mt-2 text-3xl font-semibold text-success-600">0%</p>
        </div>
        <div className="card">
          <h3 className="text-sm font-medium text-gray-500 dark:text-gray-400">Active Executors</h3>
          <p className="mt-2 text-3xl font-semibold text-gray-900 dark:text-white">0</p>
        </div>
      </div>
      <div className="mt-6 card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Recent Builds
        </h2>
        <p className="text-gray-500 dark:text-gray-400">No builds yet. Connect to Jenkins to get started.</p>
      </div>
    </div>
  );
}
