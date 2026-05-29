import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { Role, UserStatus, Prisma } from '@prisma/client';

export class UsersService {
  async listUsers(
    organizationId: string,
    params: { page: number; limit: number; role?: Role; search?: string }
  ) {
    const where: Prisma.UserWhereInput = {
      organizationId,
      ...(params.role && { role: params.role }),
      ...(params.search && {
        OR: [
          { name: { contains: params.search, mode: 'insensitive' as const } },
          { email: { contains: params.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          status: true,
          organizationId: true,
          createdAt: true,
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return { users, total };
  }

  async getUserById(userId: string, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        status: true,
        organizationId: true,
        createdAt: true,
        _count: { select: { assignedTasks: true } },
      },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    return user;
  }

  async updateUserRole(userId: string, role: Role, organizationId: string) {
    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        organizationId: true,
      },
    });

    logger.info(`User role updated: ${updated.email} → ${role}`);
    return updated;
  }

  async deleteUser(userId: string, organizationId: string, requesterId: string) {
    if (userId === requesterId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot delete yourself');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    await prisma.user.delete({ where: { id: userId } });
    logger.info(`User deleted: ${user.email}`);
  }

  async updateUserStatus(userId: string, status: UserStatus, organizationId: string, requesterId: string) {
    if (userId === requesterId) {
      throw new AppError(400, 'VALIDATION_ERROR', 'Cannot change your own status');
    }

    const user = await prisma.user.findFirst({
      where: { id: userId, organizationId },
    });

    if (!user) {
      throw Errors.NOT_FOUND('User');
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: { status },
      select: { id: true, email: true, name: true, role: true, status: true },
    });

    logger.info(`User status updated: ${updated.email} → ${status}`);
    return updated;
  }
}

export const usersService = new UsersService();
