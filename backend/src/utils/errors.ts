/**
 * Custom application error class for structured error responses.
 * Provides consistent error formatting across the API.
 */
export class AppError extends Error {
  public readonly status: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(status: number, code: string, message: string, isOperational = true) {
    super(message);
    this.status = status;
    this.code = code;
    this.isOperational = isOperational;

    // Preserve proper stack trace
    Error.captureStackTrace(this, this.constructor);
    Object.setPrototypeOf(this, AppError.prototype);
  }

  toJSON() {
    return {
      status: this.status,
      code: this.code,
      message: this.message,
    };
  }
}

// ─────────── Pre-built Error Factories ───────────

export const Errors = {
  // Auth errors
  INVALID_CREDENTIALS: () =>
    new AppError(401, 'INVALID_CREDENTIALS', 'Invalid email or password'),
  UNAUTHORIZED: () =>
    new AppError(401, 'UNAUTHORIZED', 'Authentication required'),
  TOKEN_EXPIRED: () =>
    new AppError(401, 'TOKEN_EXPIRED', 'Access token has expired'),
  INVALID_REFRESH_TOKEN: () =>
    new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or has been revoked'),
  
  // Authorization errors
  FORBIDDEN: (detail?: string) =>
    new AppError(403, 'FORBIDDEN', detail || 'You do not have permission to perform this action'),
  INSUFFICIENT_ROLE: (requiredRoles: string[]) =>
    new AppError(403, 'INSUFFICIENT_ROLE', `Required roles: ${requiredRoles.join(', ')}`),

  // Validation
  VALIDATION_ERROR: (message: string) =>
    new AppError(400, 'VALIDATION_ERROR', message),
  
  // Resource errors
  NOT_FOUND: (resource: string) =>
    new AppError(404, 'NOT_FOUND', `${resource} not found`),
  CONFLICT: (message: string) =>
    new AppError(409, 'CONFLICT', message),

  // Task-specific errors
  INVALID_STATUS_TRANSITION: (from: string, to: string) =>
    new AppError(400, 'INVALID_STATUS_TRANSITION', `Cannot transition from ${from} to ${to}`),
  NOT_ASSIGNEE: () =>
    new AppError(403, 'NOT_ASSIGNEE', 'Only the assignee or a MANAGER can update this task status'),

  // Server errors
  INTERNAL: (message = 'An unexpected error occurred') =>
    new AppError(500, 'INTERNAL_ERROR', message, false),
};
