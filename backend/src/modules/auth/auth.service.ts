import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { prisma } from '../../config/database';
import { env } from '../../config/env';
import { AppError, Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { RegisterInput, LoginInput } from './auth.validation';
import { Role } from '@prisma/client';

/**
 * Auth Service — all authentication business logic lives here.
 * Controllers should be thin wrappers calling these methods.
 */
export class AuthService {
  /**
   * Register a new user.
   * Creates an organization if organizationName is provided.
   */
  async register(input: RegisterInput) {
    // Check for existing user
    const existing = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existing) {
      throw Errors.CONFLICT('A user with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(input.password, 12);

    // Determine organization
    let organizationId = input.organizationId;

    if (input.organizationName && !organizationId) {
      const org = await prisma.organization.create({
        data: { name: input.organizationName },
      });
      organizationId = org.id;
    }

    if (!organizationId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Organization is required');
    }

    // Verify organization exists
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
    });

    if (!org) {
      throw Errors.NOT_FOUND('Organization');
    }

    // Check if this is the first user in the org (make them ADMIN)
    const orgUserCount = await prisma.user.count({
      where: { organizationId },
    });

    const role: Role = orgUserCount === 0 ? 'ADMIN' : 'MEMBER';

    // Create user
    const user = await prisma.user.create({
      data: {
        email: input.email,
        password: hashedPassword,
        name: input.name,
        role,
        organizationId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
        createdAt: true,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokenPair(user);

    logger.info(`User registered: ${user.email} (${user.role}) in org ${organizationId}`);

    return {
      user,
      ...tokens,
    };
  }

  /**
   * Login with email/password.
   */
  async login(input: LoginInput) {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organizationId: true,
        password: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw Errors.INVALID_CREDENTIALS();
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.password);
    if (!isPasswordValid) {
      throw Errors.INVALID_CREDENTIALS();
    }

    // Block inactive or departed users from logging in
    if (user.status !== 'ACTIVE') {
      throw new AppError(403, 'ACCOUNT_DISABLED', 'Your account has been deactivated. Please contact your administrator.');
    }

    // Generate tokens
    const tokens = await this.generateTokenPair(user);

    logger.info(`User logged in: ${user.email}`);

    const { password: _, ...userWithoutPassword } = user;

    return {
      user: userWithoutPassword,
      ...tokens,
    };
  }

  /**
   * Refresh access token using a valid refresh token.
   * Implements token rotation: old refresh token is revoked,
   * a new pair is issued.
   */
  async refreshToken(refreshTokenValue: string) {
    // Hash the incoming token to compare with stored hash
    const tokenHash = this.hashToken(refreshTokenValue);

    // Find the token
    const storedToken = await prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revoked: false,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            organizationId: true,
          },
        },
      },
    });

    if (!storedToken) {
      throw Errors.INVALID_REFRESH_TOKEN();
    }

    // Revoke the old refresh token (rotation)
    await prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revoked: true },
    });

    // Generate new token pair
    const tokens = await this.generateTokenPair(storedToken.user);

    logger.info(`Token rotated for user: ${storedToken.user.email}`);

    return {
      user: storedToken.user,
      ...tokens,
    };
  }

  /**
   * Logout: revoke all refresh tokens for the user.
   */
  async logout(userId: string) {
    await prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });

    logger.info(`User logged out: ${userId}`);
  }

  /**
   * Generate an access token + refresh token pair.
   * The refresh token is stored hashed in the database.
   */
  private async generateTokenPair(user: {
    id: string;
    email: string;
    role: Role;
    organizationId: string;
  }) {
    // Access token (short-lived, 15 min)
    const accessToken = jwt.sign(
      {
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: user.organizationId,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.JWT_ACCESS_EXPIRY as any }
    );

    // Refresh token (long-lived, 7 days)
    const refreshTokenValue = crypto.randomBytes(64).toString('hex');
    const tokenHash = this.hashToken(refreshTokenValue);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Store hashed refresh token in DB
    await prisma.refreshToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt,
      },
    });

    return {
      accessToken,
      refreshToken: refreshTokenValue,
      expiresIn: env.JWT_ACCESS_EXPIRY,
    };
  }

  /**
   * Hash a token using SHA-256.
   * Refresh tokens are stored hashed to prevent exposure
   * in case of database compromise.
   */
  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }
}

export const authService = new AuthService();
