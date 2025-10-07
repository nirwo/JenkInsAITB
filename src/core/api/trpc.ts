import { createTRPCReact } from '@trpc/react-query';
import { createTRPCProxyClient, httpBatchLink } from '@trpc/client';
import superjson from 'superjson';
import type { AppRouter } from '../../../server/router';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const trpc = createTRPCReact<AppRouter>();

export const trpcClient = trpc.createClient({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers() {
        const token = localStorage.getItem('accessToken');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});

// Vanilla client for use outside React components
export const trpcVanilla = createTRPCProxyClient<AppRouter>({
  transformer: superjson,
  links: [
    httpBatchLink({
      url: `${API_URL}/trpc`,
      headers() {
        const token = localStorage.getItem('accessToken');
        return {
          authorization: token ? `Bearer ${token}` : '',
        };
      },
    }),
  ],
});
