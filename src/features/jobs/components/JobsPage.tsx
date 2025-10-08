import { Link } from 'react-router-dom';
import { trpc } from '@/core/api/trpc';
import { PlayIcon, ClockIcon, CheckCircleIcon, XCircleIcon } from '@heroicons/react/24/outline';

export function JobsPage() {
  const { data: instances, isLoading: loadingInstances } = trpc.jenkins.getInstances.useQuery();
  const { data: jobsData, isLoading: loadingJobs } = trpc.job.getAll.useQuery(
    { limit: 50 },
    { enabled: !!instances && instances.length > 0 }
  );

  const jobs = jobsData?.jobs || [];

  const getStatusIcon = (status: string | null) => {
    if (!status) return <ClockIcon className="h-5 w-5 text-gray-400" />;
    switch (status) {
      case 'SUCCESS':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'FAILURE':
        return <XCircleIcon className="h-5 w-5 text-error-500" />;
      case 'RUNNING':
        return <ClockIcon className="h-5 w-5 text-primary-500 animate-spin" />;
      default:
        return <ClockIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusBadge = (status: string | null) => {
    if (!status) return 'badge bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    switch (status) {
      case 'SUCCESS':
        return 'badge-success';
      case 'FAILURE':
        return 'badge-error';
      case 'RUNNING':
        return 'badge-info';
      default:
        return 'badge bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  if (loadingInstances) {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-6">Jobs</h1>
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
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Jobs</h1>
        <div className="text-sm text-gray-500 dark:text-gray-400">
          {jobsData?.total || 0} total jobs
        </div>
      </div>

      {loadingJobs ? (
        <div className="card">
          <div className="flex items-center justify-center h-32">
            <div className="text-gray-500 dark:text-gray-400">Loading jobs...</div>
          </div>
        </div>
      ) : !jobs || jobs.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">No jobs found</p>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
            Jobs will appear here once they are created in Jenkins
          </p>
        </div>
      ) : (
        <div className="grid gap-4">
          {jobs.map((job) => (
            <Link
              key={job.id}
              to={`/jobs/${job.id}`}
              className="card hover:shadow-md transition-shadow"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(job.lastBuildStatus)}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {job.displayName || job.name}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {job.jenkinsInstance.name}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={getStatusBadge(job.lastBuildStatus)}>
                      {job.lastBuildStatus || 'NOT_BUILT'}
                    </div>
                    {job.lastBuildTime && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Last build: {new Date(job.lastBuildTime).toLocaleString()}
                      </p>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      // Trigger build functionality
                    }}
                    className="btn-secondary"
                    title="Trigger build"
                  >
                    <PlayIcon className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
