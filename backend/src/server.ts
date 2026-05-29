import http from 'http';
import { app } from './app';
import { env } from './config/env';
import { redis } from './config/redis';
import { prisma } from './config/database';
import { initializeSocket } from './socket';
import { logger } from './utils/logger';

async function bootstrap() {
  try {
    // Connect to database
    await prisma.$connect();
    logger.info('✅ PostgreSQL connected');

    // Connect to Redis
    await redis.connect();

    // Create HTTP server
    const server = http.createServer(app);

    // Initialize WebSocket
    initializeSocket(server);

    // Start listening
    server.listen(env.PORT, () => {
      logger.info(`
┌──────────────────────────────────────────┐
│     Team Task Tracker API                │
│     Running on port ${env.PORT}                │
│     Environment: ${env.NODE_ENV.padEnd(20)}│
│     API Docs: /api-docs                  │
│     Health: /health                      │
└──────────────────────────────────────────┘
      `);
    });

    // Graceful shutdown
    const shutdown = async (signal: string) => {
      logger.info(`${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        await prisma.$disconnect();
        await redis.disconnect();
        logger.info('Server closed.');
        process.exit(0);
      });

      // Force shutdown after 30s
      setTimeout(() => {
        logger.error('Forced shutdown due to timeout');
        process.exit(1);
      }, 30000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

bootstrap();
