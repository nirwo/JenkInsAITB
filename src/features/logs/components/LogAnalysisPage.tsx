import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { trpc } from '@/core/api/trpc';
import {
  SparklesIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ArrowPathIcon,
  DocumentTextIcon,
  LightBulbIcon,
  BeakerIcon,
} from '@heroicons/react/24/outline';

export function LogAnalysisPage() {
  const { buildId } = useParams<{ buildId: string }>();
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const { data: analysis, isLoading, refetch } = trpc.log.getAnalysis.useQuery(
    { buildId: buildId! },
    { enabled: !!buildId }
  );

  const analyzeMutation = trpc.log.analyze.useMutation({
    onSuccess: () => {
      setIsAnalyzing(false);
      refetch();
    },
    onError: () => {
      setIsAnalyzing(false);
    },
  });

  const handleAnalyze = () => {
    if (!buildId) return;
    setIsAnalyzing(true);
    analyzeMutation.mutate({ buildId, forceRefresh: true });
  };

  if (!buildId) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <ExclamationTriangleIcon className="h-12 w-12 text-error-500 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Invalid build ID</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ArrowPathIcon className="h-8 w-8 text-primary-500 animate-spin mx-auto mb-2" />
            <div className="text-gray-500 dark:text-gray-400">Loading analysis...</div>
          </div>
        </div>
      </div>
    );
  }

  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'text-success-600 dark:text-success-400';
      case 'negative':
        return 'text-error-600 dark:text-error-400';
      case 'neutral':
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return <CheckCircleIcon className="h-5 w-5 text-success-500" />;
      case 'negative':
        return <ExclamationTriangleIcon className="h-5 w-5 text-error-500" />;
      case 'neutral':
      default:
        return <DocumentTextIcon className="h-5 w-5 text-gray-500" />;
    }
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">AI Log Analysis</h1>
          {analysis?.build && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Build #{analysis.build.buildNumber} - {analysis.build.job.name}
            </p>
          )}
        </div>
        <div className="flex items-center space-x-3">
          {buildId && (
            <Link
              to={`/logs/${buildId}/raw`}
              className="btn-secondary flex items-center space-x-2"
            >
              <DocumentTextIcon className="h-4 w-4" />
              <span>View Raw Logs</span>
            </Link>
          )}
          {analysis?.build && (
            <a
              href={analysis.build.url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary"
            >
              View in Jenkins
            </a>
          )}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || analyzeMutation.isPending}
            className="btn-primary flex items-center space-x-2"
          >
            <SparklesIcon className="h-4 w-4" />
            <span>{isAnalyzing ? 'Analyzing...' : analysis ? 'Re-analyze' : 'Analyze Logs'}</span>
          </button>
        </div>
      </div>

      {!analysis && !isAnalyzing ? (
        <div className="card text-center py-12">
          <SparklesIcon className="h-16 w-16 text-primary-500 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            AI-Powered Log Analysis
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-2xl mx-auto">
            Use advanced AI to analyze build logs, identify root causes, detect error patterns, and
            get actionable recommendations to fix failures.
          </p>
          <button onClick={handleAnalyze} className="btn-primary">
            Start Analysis
          </button>
        </div>
      ) : isAnalyzing ? (
        <div className="card text-center py-12">
          <ArrowPathIcon className="h-16 w-16 text-primary-500 animate-spin mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
            Analyzing Build Logs...
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            AI is processing the build logs. This may take a moment.
          </p>
          {analyzeMutation.isPending && (
            <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
              Processing time: ~{Math.floor((Date.now() - (analyzeMutation as any).startTime) / 1000)}s
            </p>
          )}
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          {/* Summary Card */}
          <div className="card">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0">
                {getSentimentIcon(analysis.sentiment)}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Summary</h2>
                  <span className={`text-sm font-medium ${getSentimentColor(analysis.sentiment)}`}>
                    Sentiment: {analysis.sentiment || 'neutral'}
                  </span>
                </div>
                <p className="text-gray-700 dark:text-gray-300">{analysis.summary}</p>
                {analysis.processingTime && (
                  <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
                    Analysis completed in {(analysis.processingTime / 1000).toFixed(2)}s
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Root Cause */}
          {analysis.rootCause && (
            <div className="card border-l-4 border-error-500">
              <div className="flex items-start space-x-3">
                <ExclamationTriangleIcon className="h-6 w-6 text-error-500 flex-shrink-0" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Root Cause
                  </h3>
                  <p className="text-gray-700 dark:text-gray-300">{analysis.rootCause}</p>
                  {analysis.errorCategory && (
                    <div className="mt-3">
                      <span className="badge-error">{analysis.errorCategory}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Stack Trace */}
          {analysis.stackTrace && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-gray-500" />
                <span>Stack Trace</span>
              </h3>
              <pre className="bg-gray-900 dark:bg-black text-gray-100 p-4 rounded-lg overflow-x-auto text-sm">
                {analysis.stackTrace}
              </pre>
            </div>
          )}

          {/* Failed Tests */}
          {analysis.failedTests && Array.isArray(analysis.failedTests) && (analysis.failedTests as any[]).length > 0 && (
            <div className="card">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <BeakerIcon className="h-5 w-5 text-error-500" />
                <span>Failed Tests ({(analysis.failedTests as any[]).length})</span>
              </h3>
              <div className="space-y-2">
                {(analysis.failedTests as any[]).map((test: any, index: number) => (
                  <div
                    key={index}
                    className="p-3 bg-error-50 dark:bg-error-900 border border-error-200 dark:border-error-700 rounded-lg"
                  >
                    <p className="font-medium text-error-900 dark:text-error-100">
                      {test.name || test.test || `Test ${index + 1}`}
                    </p>
                    {test.message && (
                      <p className="text-sm text-error-700 dark:text-error-300 mt-1">
                        {test.message}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommendations */}
          {analysis.recommendations && Array.isArray(analysis.recommendations) && (analysis.recommendations as any[]).length > 0 && (
            <div className="card border-l-4 border-success-500">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3 flex items-center space-x-2">
                <LightBulbIcon className="h-5 w-5 text-success-500" />
                <span>Recommendations</span>
              </h3>
              <ul className="space-y-3">
                {(analysis.recommendations as any[]).map((rec: any, index: number) => (
                  <li key={index} className="flex items-start space-x-3">
                    <CheckCircleIcon className="h-5 w-5 text-success-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700 dark:text-gray-300">
                      {typeof rec === 'string' ? rec : rec.text || rec.recommendation || JSON.stringify(rec)}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Back to Jobs */}
          <div className="flex justify-center">
            <Link to="/jobs" className="btn-secondary">
              Back to Jobs
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
