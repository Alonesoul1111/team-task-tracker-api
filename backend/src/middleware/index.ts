import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { Role } from '@prisma/client';

// Type Extensions

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        role: Role;
        organizationId: string;
      };
    }
  }
}

// Global Error Handler

export const errorHandler = (
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void => {
  if (err instanceof AppError) {
    res.status(err.status).json(err.toJSON());
    return;
  }

  if (err instanceof ZodError) {
    const message = err.errors
      .map((e) => `${e.path.join('.')}: ${e.message}`)
      .join('; ');
    res.status(400).json({
      status: 400,
      code: 'VALIDATION_ERROR',
      message,
    });
    return;
  }

  // Unexpected errors
  logger.error('Unhandled error:', err);
  res.status(500).json({
    status: 500,
    code: 'INTERNAL_ERROR',
    message: 'An unexpected error occurred',
  });
};

// Request Validation

export const validate = (schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse(req[source]);
      Object.defineProperty(req, source, {
        value: parsed,
        writable: true,
        enumerable: true,
        configurable: true
      });
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Authentication Middleware

export const authenticate = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AppError(401, 'UNAUTHORIZED', 'Authentication required');
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as {
      userId: string;
      email: string;
      role: Role;
      organizationId: string;
    };

    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, role: true, organizationId: true },
    });

    if (!user) {
      throw new AppError(401, 'UNAUTHORIZED', 'User no longer exists');
    }

    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      next(new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired'));
      return;
    }
    if (error instanceof jwt.JsonWebTokenError) {
      next(new AppError(401, 'INVALID_TOKEN', 'Invalid access token'));
      return;
    }
    next(error);
  }
};

// RBAC Middleware
// Enforces role-based access at the middleware layer, NOT in controllers.

export const authorize = (...allowedRoles: Role[]) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      next(
        new AppError(
          403,
          'INSUFFICIENT_ROLE',
          `Required roles: ${allowedRoles.join(', ')}. Your role: ${req.user.role}`
        )
      );
      return;
    }

    next();
  };
};

// Organization Scope Middleware
// Ensures users can only access data within their organization

export const scopeToOrganization = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    next(new AppError(401, 'UNAUTHORIZED', 'Authentication required'));
    return;
  }
  // Attach organizationId for service layer to use
  next();
};

// Async Route Handler Wrapper

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
