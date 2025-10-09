import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react-swc';
import tsconfigPaths from 'vite-tsconfig-paths';
import UnoCSS from 'unocss/vite';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '');
  const frontendPort = Number(env.PORT) || 9010;
  const apiPort = Number(env.API_PORT) || 9011;
  
  // Extract hostname from API_URL (e.g., "http://10.100.102.29:9011" -> "10.100.102.29")
  // Falls back to localhost if not set
  const getHostname = (url: string | undefined): string => {
    if (!url) return 'localhost';
    try {
      return new URL(url).hostname;
    } catch {
      return 'localhost';
    }
  };
  
  const apiHost = getHostname(env.API_URL || env.VITE_API_URL);

  return {
    plugins: [
      UnoCSS(),
      react(),
      tsconfigPaths(),
    ],
    server: {
      host: '0.0.0.0', // Listen on all network interfaces for remote access
      port: frontendPort,
      proxy: {
        '/api': {
          target: env.VITE_API_URL || `http://${apiHost}:${apiPort}`,
          changeOrigin: true,
        },
        '/ws': {
          target: env.VITE_API_URL?.replace('http', 'ws') || `ws://${apiHost}:${apiPort}`,
          ws: true,
        },
      },
    },
    build: {
      target: 'esnext',
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],
            'query-vendor': ['@tanstack/react-query'],
            'chart-vendor': ['recharts'],
            'ui-vendor': ['@headlessui/react', '@heroicons/react'],
          },
        },
      },
      chunkSizeWarningLimit: 500,
    },
    optimizeDeps: {
      include: ['react', 'react-dom', '@tanstack/react-query'],
    },
  };
});
