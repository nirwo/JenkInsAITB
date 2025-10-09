import { config } from 'dotenv';
config(); // Load .env file at startup

import Fastify from 'fastify';
// CORS and Helmet plugins completely removed - using manual headers only
// import cors from '@fastify/cors';
// import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import staticFiles from '@fastify/static';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './router';
import { createContext } from './context';
import { logger } from './common/utils/logger';
import { metricsPlugin } from './common/middleware/metrics';
import { JenkinsSyncService } from './modules/jenkins/jenkins-sync.service';
import { prisma } from './infrastructure/database/prisma';
import Redis from 'ioredis';
import path from 'path';
import fs from 'fs';

const PORT = Number(process.env.API_PORT) || 9011;
const HOST = '0.0.0.0';

// Initialize Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', err => {
  logger.error('Redis connection error:', err);
});

// Initialize Jenkins Sync Service
const pollInterval = Number(process.env.JENKINS_POLL_INTERVAL) || 30000;
export const jenkinsSyncService = new JenkinsSyncService(prisma, pollInterval);

// Create Fastify server
const server = Fastify({
  logger: false, // Using our custom logger
  maxParamLength: 5000,
});

async function main() {
  try {
    // ===== COMPLETELY DISABLE CORS =====
    // Set the most permissive CORS headers possible on EVERY request
    server.addHook('onRequest', async (request, reply) => {
      // Accept ANY origin
      const origin = request.headers.origin || '*';
      
      // Set all CORS headers to maximum permissiveness
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      reply.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
      reply.header('Access-Control-Max-Age', '86400');
      
      // Log requests for debugging
      if (request.url.includes('trpc') || request.url.includes('auth')) {
        logger.info(`${request.method} ${request.url} from: ${origin}`);
      }
      
      // Immediately handle OPTIONS preflight with proper Content-Type
      if (request.method === 'OPTIONS') {
        reply.header('Content-Type', 'text/plain');
        reply.header('Content-Length', '0');
        reply.status(204).send();
        return reply;
      }
    });
    
        // Add onSend hook to ensure CORS headers on ALL responses (including errors)
    server.addHook('onSend', async (request, reply, payload) => {
      const origin = request.headers.origin || '*';
      // Always set CORS headers, even if already present (override)
      reply.header('Access-Control-Allow-Origin', origin);
      reply.header('Access-Control-Allow-Credentials', 'true');
      reply.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD');
      reply.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
      reply.header('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
      return payload;
    });

    // CORS plugin completely removed - using manual headers only
    // This prevents ANY CORS restrictions

    // Helmet also completely removed to avoid any interference
    // await server.register(helmet, { ... });

    await server.register(rateLimit, {
      max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      redis,
    });

    await server.register(websocket);
    
    await server.register(metricsPlugin);

    // Register tRPC router with explicit response handler
    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
        onError(opts: any) {
          logger.error(`Error in tRPC handler on path '${opts.path}':`, opts.error);
          logger.error(`Request origin: ${opts.req.headers.origin}`);
          logger.error(`Request method: ${opts.req.method}`);
        },
        responseMeta(opts: any) {
          const { ctx } = opts;
          // Force CORS headers on every response
          return {
            headers: {
              'access-control-allow-origin': ctx?.req?.headers?.origin || '*',
              'access-control-allow-credentials': 'true',
              'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH',
              'access-control-allow-headers': '*',
              'access-control-expose-headers': '*',
            },
          };
        },
      },
    });

    // CORS debugging endpoint
    server.get('/cors-test', async (request) => {
      const origin = request.headers.origin;
      const method = request.method;
      const userAgent = request.headers['user-agent'];
      
      return {
        message: 'CORS test endpoint',
        origin: origin,
        method: method,
        userAgent: userAgent,
        timestamp: new Date().toISOString(),
        env: process.env.NODE_ENV,
        corsEnabled: true
      };
    });

    // Serve static files in production
    if (process.env.NODE_ENV === 'production') {
      // Resolve static path relative to the project root
      const staticPath = path.resolve(process.cwd(), 'dist');
      const indexPath = path.join(staticPath, 'index.html');
      
      logger.info(`Static files configuration:`);
      logger.info(`  - Static path: ${staticPath}`);
      logger.info(`  - Index file: ${indexPath}`);
      logger.info(`  - Static path exists: ${fs.existsSync(staticPath)}`);
      logger.info(`  - Index file exists: ${fs.existsSync(indexPath)}`);
      
      if (!fs.existsSync(staticPath)) {
        logger.error(`❌ Static files directory not found: ${staticPath}`);
        logger.error(`   Current working directory: ${process.cwd()}`);
        logger.error(`   Please run 'pnpm build' to create the dist/ directory`);
      } else if (!fs.existsSync(indexPath)) {
        logger.error(`❌ index.html not found: ${indexPath}`);
        logger.error(`   Please run 'pnpm build:client' to create the frontend build`);
      } else {
        logger.info(`✅ Static files ready to serve from: ${staticPath}`);
      }
      
      await server.register(staticFiles, {
        root: staticPath,
        prefix: '/',
      });

      // Fallback to index.html for SPA routing
      server.setNotFoundHandler(async (request, reply) => {
        if (request.url.startsWith('/trpc') || request.url.startsWith('/health') || request.url.startsWith('/ready') || request.url.startsWith('/metrics')) {
          reply.code(404).send({ error: 'Not Found' });
          return;
        }
        logger.info(`SPA fallback for: ${request.url} -> index.html`);
        return reply.sendFile('index.html');
      });
    }

    // Health check endpoint
    server.get('/health', async () => {
      return {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
      };
    });

    // Ready check endpoint (includes Redis connectivity)
    server.get('/ready', async () => {
      try {
        await redis.ping();
        return {
          status: 'ready',
          redis: 'connected',
          timestamp: new Date().toISOString(),
        };
      } catch (error) {
        return {
          status: 'not_ready',
          redis: 'disconnected',
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString(),
        };
      }
    });

    // Start server
    await server.listen({ port: PORT, host: HOST });
    logger.info(`🚀 Server listening on http://${HOST}:${PORT}`);
    logger.info(`📊 Metrics available at http://${HOST}:${PORT}/metrics`);
    logger.info(`🔌 tRPC endpoint at http://${HOST}:${PORT}/trpc`);
    
    // Start Jenkins sync service
    jenkinsSyncService.start();
    logger.info(`🔄 Jenkins sync service started (polling every ${pollInterval}ms)`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info(`${signal} received, closing server gracefully...`);
  
  try {
    jenkinsSyncService.stop();
    await server.close();
    await redis.quit();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start the server
main();
