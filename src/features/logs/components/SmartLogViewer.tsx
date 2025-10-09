import { useParams, Link } from 'react-router-dom';
import { useState, useMemo, useRef, useEffect } from 'react';
import { trpc } from '@/core/api/trpc';
import {
  ArrowLeftIcon,
  DocumentTextIcon,
  ArrowDownTrayIcon,
  MagnifyingGlassIcon,
  SparklesIcon,
  XCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  LightBulbIcon,
  ClockIcon,
  ChevronRightIcon,
  ChevronDownIcon,
  BookOpenIcon,
} from '@heroicons/react/24/outline';
import { analyzeLogs, groupIssuesByCategory, generateRecommendations } from '@/shared/utils/logAnalyzer';

export function SmartLogViewer() {
  const { buildId } = useParams<{ buildId: string }>();
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const logContainerRef = useRef<HTMLDivElement>(null);

  // Fetch raw logs through tRPC
  const { data, isLoading: isLoadingLogs, error } = trpc.log.getRawLogs.useQuery(
    { buildId: buildId! },
    { enabled: !!buildId }
  );

  const logs = data?.logs || '';
  const build = data?.build;
  const errorMessage = error?.message || null;

  // Analyze logs with smart patterns
  const analysis = useMemo(() => {
    if (!logs) return null;
    return analyzeLogs(logs);
  }, [logs]);

  const groupedIssues = useMemo(() => {
    if (!analysis) return {};
    return groupIssuesByCategory(analysis.issues);
  }, [analysis]);

  const recommendations = useMemo(() => {
    if (!analysis) return [];
    return generateRecommendations(analysis);
  }, [analysis]);

  // Scroll to specific line
  const scrollToLine = (lineNumber: number) => {
    const lineElement = document.getElementById(`log-line-${lineNumber}`);
    if (lineElement) {
      lineElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      lineElement.classList.add('bg-primary-500/20', 'animate-pulse');
      setTimeout(() => {
        lineElement.classList.remove('animate-pulse');
      }, 2000);
    }
  };

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
        className += ' text-error-400 font-semibold';
      } else if (lowerLine.includes('warning') || lowerLine.includes('warn')) {
        className += ' text-warning-400';
      } else if (lowerLine.includes('success') || lowerLine.includes('passed')) {
        className += ' text-success-400';
      } else {
        className += ' text-slate-300';
      }

      return (
        <div 
          key={index} 
          id={`log-line-${index + 1}`}
          className="hover:bg-slate-800/50 px-4 py-1 transition-colors"
        >
          <span className="text-slate-600 mr-4 select-none inline-block w-16 text-right">
            {index + 1}
          </span>
          <span className={className}>{line || '\u00A0'}</span>
        </div>
      );
    });
  };

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) {
        next.delete(category);
      } else {
        next.add(category);
      }
      return next;
    });
  };

  useEffect(() => {
    // Expand first category by default
    const firstCategory = Object.keys(groupedIssues)[0];
    if (firstCategory) {
      setExpandedCategories(new Set([firstCategory]));
    }
  }, [groupedIssues]);

  if (!buildId) {
    return (
      <div className="p-6">
        <div className="card text-center py-12">
          <h2 className="text-2xl font-bold mb-2">Invalid Build</h2>
          <p className="text-slate-400">No build ID provided.</p>
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
            <h1 className="text-3xl font-bold">
              Smart Log Analyzer
            </h1>
            <p className="text-sm text-slate-400 mt-1">
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

      <div className="grid grid-cols-12 gap-6">
        {/* Analysis Sidebar */}
        {analysis && (
          <div className="col-span-12 lg:col-span-4 space-y-4">
            {/* Summary Card */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <InformationCircleIcon className="h-5 w-5 text-primary-400" />
                Analysis Summary
              </h3>
              
              {analysis.buildPhase && (
                <div className="mb-4 p-3 bg-slate-800/50 rounded-lg">
                  <div className="text-sm text-slate-400">Build Phase</div>
                  <div className="text-lg font-semibold">{analysis.buildPhase}</div>
                </div>
              )}

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="text-center p-3 bg-error-950/30 border border-error-800 rounded-lg">
                  <div className="text-2xl font-bold text-error-400">
                    {analysis.summary.totalErrors}
                  </div>
                  <div className="text-xs text-slate-400">Errors</div>
                </div>
                <div className="text-center p-3 bg-warning-950/30 border border-warning-800 rounded-lg">
                  <div className="text-2xl font-bold text-warning-400">
                    {analysis.summary.totalWarnings}
                  </div>
                  <div className="text-xs text-slate-400">Warnings</div>
                </div>
                <div className="text-center p-3 bg-slate-800 border border-slate-700 rounded-lg">
                  <div className="text-2xl font-bold text-slate-300">
                    {analysis.summary.categories.length}
                  </div>
                  <div className="text-xs text-slate-400">Categories</div>
                </div>
              </div>

              {analysis.estimatedFixTime && (
                <div className="flex items-center gap-2 p-3 bg-primary-950/30 border border-primary-800 rounded-lg">
                  <ClockIcon className="h-5 w-5 text-primary-400" />
                  <div>
                    <div className="text-sm text-slate-400">Est. Fix Time</div>
                    <div className="font-semibold text-primary-300">{analysis.estimatedFixTime}</div>
                  </div>
                </div>
              )}
            </div>

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="card">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <LightBulbIcon className="h-5 w-5 text-warning-400" />
                  Quick Fixes
                </h3>
                <div className="space-y-2">
                  {recommendations.map((rec, idx) => (
                    <div key={idx} className="p-3 bg-slate-800/50 rounded-lg text-sm">
                      {rec}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Issues by Category */}
            <div className="card">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-error-400" />
                Issues ({analysis.issues.length})
              </h3>
              <div className="space-y-2">
                {Object.entries(groupedIssues).map(([category, issues]) => (
                  <div key={category} className="border border-slate-700 rounded-lg overflow-hidden">
                    <button
                      onClick={() => toggleCategory(category)}
                      className="w-full flex items-center justify-between p-3 bg-slate-800/50 hover:bg-slate-800 transition-colors"
                    >
                      <div className="flex items-center gap-2">
                        {expandedCategories.has(category) ? (
                          <ChevronDownIcon className="h-4 w-4" />
                        ) : (
                          <ChevronRightIcon className="h-4 w-4" />
                        )}
                        <span className="font-medium">{category}</span>
                        <span className="badge badge-error text-xs">{issues.length}</span>
                      </div>
                    </button>
                    {expandedCategories.has(category) && (
                      <div className="p-3 space-y-2 bg-slate-900/50">
                        {issues.map((issue, idx) => (
                          <button
                            key={idx}
                            onClick={() => {
                              scrollToLine(issue.line);
                            }}
                            className="w-full text-left p-2 rounded hover:bg-slate-800 transition-colors"
                          >
                            <div className="flex items-start gap-2">
                              {issue.severity === 'error' && (
                                <XCircleIcon className="h-4 w-4 text-error-400 flex-shrink-0 mt-0.5" />
                              )}
                              {issue.severity === 'warning' && (
                                <ExclamationTriangleIcon className="h-4 w-4 text-warning-400 flex-shrink-0 mt-0.5" />
                              )}
                              <div className="flex-1 min-w-0">
                                <div className="text-sm font-mono truncate text-slate-300">
                                  Line {issue.line}
                                </div>
                                <div className="text-xs text-slate-500 truncate">
                                  {issue.message.substring(0, 60)}...
                                </div>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Root Cause */}
            {analysis.summary.likelyRootCause && (
              <div className="card border-2 border-error-500/50">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2 text-error-400">
                  🎯 Likely Root Cause
                </h3>
                <div className="space-y-3">
                  <div className="p-3 bg-error-950/30 rounded-lg">
                    <div className="text-sm text-slate-400 mb-1">Line {analysis.summary.likelyRootCause.line}</div>
                    <div className="font-mono text-sm text-error-300 mb-2">
                      {analysis.summary.likelyRootCause.message}
                    </div>
                    {analysis.summary.likelyRootCause.suggestion && (
                      <div className="text-sm text-slate-300 flex items-start gap-2">
                        <LightBulbIcon className="h-4 w-4 text-warning-400 flex-shrink-0 mt-0.5" />
                        {analysis.summary.likelyRootCause.suggestion}
                      </div>
                    )}
                  </div>
                  {analysis.summary.likelyRootCause.docs && (
                    <a
                      href={analysis.summary.likelyRootCause.docs}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn-secondary w-full justify-center"
                    >
                      <BookOpenIcon className="h-4 w-4" />
                      View Documentation
                    </a>
                  )}
                  <button
                    onClick={() => scrollToLine(analysis.summary.likelyRootCause!.line)}
                    className="btn-primary w-full justify-center"
                  >
                    Jump to Error
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Log Display */}
        <div className={`col-span-12 ${analysis ? 'lg:col-span-8' : ''}`}>
          {/* Search Bar */}
          <div className="card mb-4">
            <div className="relative">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search logs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input pl-10 w-full"
              />
            </div>
            {searchTerm && (
              <p className="text-sm text-slate-400 mt-2">
                Showing filtered results for "{searchTerm}"
              </p>
            )}
          </div>

          {/* Logs Display */}
          <div className="card">
            <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-700">
              <div className="flex items-center space-x-2">
                <DocumentTextIcon className="h-5 w-5 text-slate-400" />
                <span className="font-medium">
                  Console Logs
                </span>
              </div>
              {logs && (
                <span className="text-sm text-slate-400">
                  {logs.split('\n').length} lines
                </span>
              )}
            </div>

            <div 
              ref={logContainerRef}
              className="terminal overflow-x-auto max-h-[70vh] overflow-y-auto"
            >
              {isLoadingLogs ? (
                <div className="flex items-center justify-center py-12">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-slate-400">Loading logs...</p>
                  </div>
                </div>
              ) : errorMessage ? (
                <div className="p-6 text-center">
                  <XCircleIcon className="h-12 w-12 text-error-500 mx-auto mb-4" />
                  <p className="text-error-400 font-medium mb-2">
                    Failed to Load Logs
                  </p>
                  <p className="text-sm text-slate-400 mb-4">
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
                <div className="p-6 text-center text-slate-400">
                  No logs available
                </div>
              ) : (
                highlightErrors(filteredLogs)
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
