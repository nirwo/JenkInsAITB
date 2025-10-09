import Fastify from 'fastify';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import websocket from '@fastify/websocket';
import { fastifyTRPCPlugin } from '@trpc/server/adapters/fastify';
import { appRouter } from './router';
import { createContext } from './context';
import { logger } from './common/utils/logger';
import { metricsPlugin } from './common/middleware/metrics';
import { JenkinsSyncService } from './modules/jenkins/jenkins-sync.service';
import { prisma } from './infrastructure/database/prisma';
import Redis from 'ioredis';

const PORT = Number(process.env.API_PORT) || 6001;
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
    // Register plugins
    await server.register(cors, {
      origin: process.env.APP_URL || 'http://localhost:3000',
      credentials: true,
    });

    await server.register(helmet, {
      contentSecurityPolicy: false,
    });

    await server.register(rateLimit, {
      max: Number(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
      timeWindow: Number(process.env.RATE_LIMIT_WINDOW_MS) || 900000,
      redis,
    });

    await server.register(websocket);
    
    await server.register(metricsPlugin);

    // Register tRPC router
    await server.register(fastifyTRPCPlugin, {
      prefix: '/trpc',
      trpcOptions: {
        router: appRouter,
        createContext,
        onError(opts: any) {
          logger.error(`Error in tRPC handler on path '${opts.path}':`, opts.error);
        },
      },
    });

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
