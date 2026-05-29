import { z } from 'zod';
import { TaskPriority, TaskStatus } from '@prisma/client';

export const createTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).default('MEDIUM'),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid('Valid project ID is required'),
  dueDate: z
    .string()
    .datetime()
    .optional()
    .refine(
      (val) => !val || new Date(val) > new Date(),
      { message: 'due_date must be a future date' }
    ),
});

export const updateTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  description: z.string().max(5000).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().uuid().nullable().optional(),
  dueDate: z.string().datetime().nullable().optional(),
});

export const updateTaskStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export const listTasksQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  status: z.nativeEnum(TaskStatus).optional(),
  priority: z.nativeEnum(TaskPriority).optional(),
  assigneeId: z.string().uuid().optional(),
  projectId: z.string().uuid().optional(),
  search: z.string().optional(),
  sortBy: z.enum(['createdAt', 'updatedAt', 'dueDate', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Content is required').max(2000),
});

export const addSubTaskSchema = z.object({
  title: z.string().min(1, 'Title is required').max(500),
});

export const updateSubTaskSchema = z.object({
  title: z.string().min(1).max(500).optional(),
  isDone: z.boolean().optional(),
});

export type AddCommentInput = z.infer<typeof addCommentSchema>;
export type AddSubTaskInput = z.infer<typeof addSubTaskSchema>;
export type UpdateSubTaskInput = z.infer<typeof updateSubTaskSchema>;
