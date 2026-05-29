import { Server as HttpServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';
import jwt from 'jsonwebtoken';
import { env } from './config/env';
import { logger } from './utils/logger';
import { Role } from '@prisma/client';

let io: SocketIOServer;

export function initializeSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: env.CORS_ORIGIN,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // Authentication middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
        userId: string;
        email: string;
        role: Role;
        organizationId: string;
      };

      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;
    logger.info(`WebSocket connected: ${user.email} (${user.role})`);

    // Join organization room for broadcast events
    socket.join(`org:${user.organizationId}`);
    
    // Join personal room for targeted notifications
    socket.join(`user:${user.userId}`);

    socket.on('disconnect', (reason) => {
      logger.debug(`WebSocket disconnected: ${user.email} — ${reason}`);
    });

    socket.on('error', (err) => {
      logger.error(`WebSocket error for ${user.email}:`, err);
    });
  });

  logger.info('✅ WebSocket server initialized');
  return io;
}

export function getIO(): SocketIOServer {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
}
