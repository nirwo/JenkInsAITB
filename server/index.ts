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
import Redis from 'ioredis';

const PORT = Number(process.env.API_PORT) || 3001;
const HOST = '0.0.0.0';

// Initialize Redis
export const redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');

redis.on('connect', () => {
  logger.info('Connected to Redis');
});

redis.on('error', err => {
  logger.error('Redis connection error:', err);
});

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
        onError({ path, error }) {
          logger.error(`Error in tRPC handler on path '${path}':`, error);
        },
      },
    });

    // Health check endpoint
    server.get('/health', async (_request, reply) => {
      const health = {
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        redis: redis.status === 'ready' ? 'connected' : 'disconnected',
      };
      return reply.code(200).send(health);
    });

    // Ready check endpoint
    server.get('/ready', async (_request, reply) => {
      if (redis.status !== 'ready') {
        return reply.code(503).send({ status: 'not ready', reason: 'redis not connected' });
      }
      return reply.code(200).send({ status: 'ready' });
    });

    // Start server
    await server.listen({ port: PORT, host: HOST });
    logger.info(`🚀 Server listening on http://${HOST}:${PORT}`);
    logger.info(`📊 Metrics available at http://${HOST}:${PORT}/metrics`);
    logger.info(`🔍 Health check at http://${HOST}:${PORT}/health`);
  } catch (err) {
    logger.error('Error starting server:', err);
    process.exit(1);
  }
}

// Graceful shutdown
const gracefulShutdown = async () => {
  logger.info('Shutting down gracefully...');
  
  try {
    await server.close();
    await redis.quit();
    logger.info('Server closed successfully');
    process.exit(0);
  } catch (err) {
    logger.error('Error during shutdown:', err);
    process.exit(1);
  }
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Start the server
void main();
