import { useParams, Link } from 'react-router-dom';
import { trpc } from '@/core/api/trpc';
import {
  ArrowLeftIcon,
  PlayIcon,
  ClockIcon,
  CheckCircleIcon,
  XCircleIcon,
  SparklesIcon,
  DocumentTextIcon,
} from '@heroicons/react/24/outline';

export function JobDetailPage() {
  const { jobId } = useParams<{ jobId: string }>();

  const { data: job, isLoading } = trpc.job.getById.useQuery(
    { id: jobId! },
    { enabled: !!jobId }
  );

  const { data: buildsData } = trpc.job.getBuilds.useQuery(
    { jobId: jobId!, limit: 20 },
    { enabled: !!jobId }
  );

  const builds = buildsData?.builds || [];

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-gray-500 dark:text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Job Not Found</h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">The job you're looking for doesn't exist.</p>
          <Link to="/jobs" className="btn-primary">
            Back to Jobs
          </Link>
        </div>
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
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

  const getStatusBadge = (status: string) => {
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

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link to="/jobs" className="btn-secondary">
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {job.displayName || job.name}
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {job.jenkinsInstance.name}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <a
            href={job.url}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary"
          >
            View in Jenkins
          </a>
          {job.buildable && (
            <button className="btn-primary flex items-center space-x-2">
              <PlayIcon className="h-4 w-4" />
              <span>Build Now</span>
            </button>
          )}
        </div>
      </div>

      {/* Job Info */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400">Last Build</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            #{job.lastBuildNumber || 'N/A'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400">Status</div>
          <div className={`${getStatusBadge(job.lastBuildStatus || 'NOT_BUILT')} mt-2`}>
            {job.lastBuildStatus || 'NOT_BUILT'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400">Health Score</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {job.healthScore !== null ? `${job.healthScore}%` : 'N/A'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-gray-500 dark:text-gray-400">In Queue</div>
          <div className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
            {job.inQueue ? 'Yes' : 'No'}
          </div>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Description</h2>
          <p className="text-gray-700 dark:text-gray-300">{job.description}</p>
        </div>
      )}

      {/* Build History */}
      <div className="card">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Build History ({builds.length})
        </h2>
        {builds.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No builds yet
          </div>
        ) : (
          <div className="space-y-3">
            {builds.map((build) => (
              <div
                key={build.id}
                className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  {getStatusIcon(build.status)}
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="font-semibold text-gray-900 dark:text-white">
                        Build #{build.buildNumber}
                      </span>
                      <span className={getStatusBadge(build.status)}>{build.status}</span>
                      {build.hasLogAnalysis && (
                        <span className="badge-info text-xs flex items-center space-x-1">
                          <SparklesIcon className="h-3 w-3" />
                          <span>AI Analyzed</span>
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      {new Date(build.createdAt).toLocaleString()}
                      {build.duration && ` • Duration: ${Math.round(build.duration / 1000)}s`}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Link
                    to={`/logs/${build.id}/raw`}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <DocumentTextIcon className="h-4 w-4" />
                    <span>View Logs</span>
                  </Link>
                  <Link
                    to={`/logs/${build.id}`}
                    className="btn-secondary flex items-center space-x-2"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    <span>AI Analysis</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
