import { useParams, Link } from 'react-router-dom';
import { useState } from 'react';
import { trpc } from '@/core/api/trpc';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XCircleIcon,
} from '@heroicons/react/24/outline';

export function LogViewerPage() {
  const { buildId } = useParams<{ buildId: string }>();
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch raw logs through tRPC (includes authentication)
  const { data, isLoading: isLoadingLogs, error } = trpc.log.getRawLogs.useQuery(
    { buildId: buildId! },
    { enabled: !!buildId }
  );

  const logs = data?.logs || '';
  const build = data?.build;
  const errorMessage = error?.message || null;

  const downloadLogs = () => {
    const blob = new Blob([logs], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `build-${build?.buildNumber || buildId}-logs.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const filteredLogs = searchTerm
    ? logs.split('\n').filter(line => 
        line.toLowerCase().includes(searchTerm.toLowerCase())
      ).join('\n')
    : logs;

  const highlightErrors = (logText: string) => {
    const lines = logText.split('\n');
    return lines.map((line, index) => {
      const lowerLine = line.toLowerCase();
      let className = 'font-mono text-sm';
      
      if (lowerLine.includes('error') || lowerLine.includes('failed')) {
        className += ' text-error-600 dark:text-error-400 font-semibold';
      } else if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
        className += ' text-warning-600 dark:text-warning-400';
      } else if (lowerLine.includes('success') || lowerLine.includes('passed')) {
        className += ' text-success-600 dark:text-success-400';
      } else {
        className += ' text-gray-700 dark:text-gray-300';
      }

      return (
        <div key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800 px-4 py-1">
          <span className="text-gray-400 dark:text-gray-600 mr-4 select-none inline-block w-12 text-right">
            {index + 1}
          </span>
          <span className={className}>{line || '\u00A0'}</span>
        </div>
      );
    });
  };

  if (!buildId) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Invalid Build</h2>
          <p className="text-gray-600 dark:text-gray-400">No build ID provided.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to={`/jobs/${build?.job?.id}`}
            className="btn-secondary"
          >
            <ArrowLeftIcon className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Console Output
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              {build?.job?.name} #{build?.buildNumber}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/logs/${buildId}`}
            className="btn-secondary"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>AI Analysis</span>
          </Link>
          {build?.url && (
            <a
              href={build.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View in Jenkins
            </a>
          )}
          <button
            onClick={downloadLogs}
            disabled={!logs}
            className="btn-secondary"
          >
            <ArrowDownTrayIcon className="h-4 w-4" />
            <span>Download</span>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="card mb-4">
        <div className="relative">
          <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="input pl-10 w-full"
          />
        </div>
        {searchTerm && (
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
            Showing filtered results for "{searchTerm}"
          </p>
        )}
      </div>

      {/* Logs Display */}
      <div className="card">
        <div className="flex items-center justify-between mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center space-x-2">
            <DocumentTextIcon className="h-5 w-5 text-gray-500" />
            <span className="font-medium text-gray-900 dark:text-white">
              Console Logs
            </span>
          </div>
          {logs && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {logs.split('\n').length} lines
            </span>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          {isLoadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                <p className="text-gray-500 dark:text-gray-400">Loading logs...</p>
              </div>
            </div>
          ) : errorMessage ? (
            <div className="p-6 text-center">
              <XCircleIcon className="h-12 w-12 text-error-500 mx-auto mb-4" />
              <p className="text-error-600 dark:text-error-400 font-medium mb-2">
                Failed to Load Logs
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                {errorMessage}
              </p>
              {build?.url && (
                <a
                  href={`${build.url}/console`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary inline-flex items-center"
                >
                  View in Jenkins
                </a>
              )}
            </div>
          ) : !logs ? (
            <div className="p-6 text-center text-gray-500 dark:text-gray-400">
              No logs available
            </div>
          ) : (
            <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
              {highlightErrors(filteredLogs)}
            </div>
          )}
        </div>

        {/* Quick Stats */}
        {logs && !isLoadingLogs && (
          <div className="mt-4 grid grid-cols-4 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Lines</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {logs.split('\n').length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Errors</p>
              <p className="text-2xl font-bold text-error-600 dark:text-error-400">
                {logs.split('\n').filter(line => 
                  line.toLowerCase().includes('error')
                ).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Warnings</p>
              <p className="text-2xl font-bold text-warning-600 dark:text-warning-400">
                {logs.split('\n').filter(line => 
                  line.toLowerCase().includes('warning') || line.toLowerCase().includes('warn')
                ).length}
              </p>
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500 dark:text-gray-400">Size</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {(logs.length / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
