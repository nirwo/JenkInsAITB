import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { trpc } from '@/core/api/trpc';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: (data) => {
      const user = {
        ...data.user,
        firstName: data.user.firstName ?? undefined,
        lastName: data.user.lastName ?? undefined,
        avatar: data.user.avatar ?? undefined,
      };
      setAuth(user, data.accessToken, data.refreshToken);
      navigate('/dashboard');
    },
    onError: (error) => {
      setError(error.message || 'Login failed');
      setIsLoading(false);
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    loginMutation.mutate({ email, password });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 dark:bg-gray-900">
      <div className="w-full max-w-md">
        <div className="card">
          <h1 className="text-center text-2xl font-bold text-gray-900 dark:text-white">
            JenKinds
          </h1>
          <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
            Sign in to your account
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-6">
            {error && (
              <div className="rounded-md bg-error-50 p-4 dark:bg-error-900">
                <p className="text-sm text-error-800 dark:text-error-200">{error}</p>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="input mt-1"
                required
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="input mt-1"
                required
                disabled={isLoading}
              />
            </div>

            <button type="submit" className="btn-primary w-full" disabled={isLoading}>
              {isLoading ? 'Signing in...' : 'Sign in'}
            </button>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Demo: admin@jenkinds.io / Admin@123456
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
