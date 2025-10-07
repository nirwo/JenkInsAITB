import { ExclamationTriangleIcon } from '@heroicons/react/24/outline';

interface ErrorFallbackProps {
  error: Error;
  resetErrorBoundary: () => void;
}

export function ErrorFallback({ error, resetErrorBoundary }: ErrorFallbackProps) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="card text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-error-100 dark:bg-error-900">
            <ExclamationTriangleIcon className="h-8 w-8 text-error-600 dark:text-error-400" />
          </div>

          <h1 className="mt-6 text-2xl font-bold text-gray-900 dark:text-white">
            Something went wrong
          </h1>

          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            We're sorry, but an unexpected error occurred. Please try refreshing the page.
          </p>

          {import.meta.env.DEV && (
            <div className="mt-4 rounded-md bg-gray-100 p-4 text-left dark:bg-gray-800">
              <p className="text-xs font-mono text-error-600 dark:text-error-400">
                {error.message}
              </p>
              {error.stack && (
                <pre className="mt-2 overflow-x-auto text-xs text-gray-600 dark:text-gray-400">
                  {error.stack}
                </pre>
              )}
            </div>
          )}

          <div className="mt-6 flex gap-3">
            <button onClick={resetErrorBoundary} className="btn-primary flex-1">
              Try again
            </button>
            <button
              onClick={() => window.location.href = '/'}
              className="btn-secondary flex-1"
            >
              Go home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
