import { z } from 'zod';
import { Role, UserStatus } from '@prisma/client';

export const updateUserRoleSchema = z.object({
  role: z.nativeEnum(Role),
});

export const updateUserStatusSchema = z.object({
  status: z.nativeEnum(UserStatus),
});

export const listUsersQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  role: z.nativeEnum(Role).optional(),
  search: z.string().optional(),
});

export type UpdateUserRoleInput = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusInput = z.infer<typeof updateUserStatusSchema>;
export type ListUsersQuery = z.infer<typeof listUsersQuerySchema>;
