import { prisma } from '../../config/database';
import { AppError, Errors } from '../../utils/errors';
import { logger } from '../../utils/logger';
import { cache } from '../../utils/cache';
import { TaskStatus, Role, Prisma } from '@prisma/client';
import {
  CreateTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
  ListTasksQuery,
} from './tasks.validation';

// ─────────── Status Transition Rules ───────────
// Centralized state machine for task status transitions.
// Valid transitions:
//   TODO → IN_PROGRESS → IN_REVIEW → DONE
//   Any active state → BLOCKED

const VALID_TRANSITIONS: Record<TaskStatus, TaskStatus[]> = {
  TODO: [TaskStatus.IN_PROGRESS, TaskStatus.BLOCKED],
  IN_PROGRESS: [TaskStatus.IN_REVIEW, TaskStatus.BLOCKED],
  IN_REVIEW: [TaskStatus.DONE, TaskStatus.BLOCKED],
  DONE: [],           // Terminal state — no transitions allowed
  BLOCKED: [TaskStatus.TODO, TaskStatus.IN_PROGRESS, TaskStatus.IN_REVIEW],
  // BLOCKED can return to previous active states
};

export class TasksService {
  /**
   * Create a new task.
   */
  async create(input: CreateTaskInput, creatorId: string, organizationId: string) {
    // Verify project belongs to organization
    const project = await prisma.project.findFirst({
      where: { id: input.projectId, organizationId },
    });

    if (!project) {
      throw Errors.NOT_FOUND('Project');
    }

    // Verify assignee belongs to organization (if provided)
    if (input.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: input.assigneeId, organizationId },
      });
      if (!assignee) {
        throw Errors.NOT_FOUND('Assignee');
      }
    }

    const task = await prisma.task.create({
      data: {
        title: input.title,
        description: input.description,
        priority: input.priority,
        assigneeId: input.assigneeId,
        creatorId,
        projectId: input.projectId,
        dueDate: input.dueDate ? new Date(input.dueDate) : null,
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    // Invalidate cache
    await cache.invalidateTaskCache(organizationId);

    logger.info(`Task created: "${task.title}" by ${creatorId}`);
    return task;
  }

  /**
   * List tasks with filtering, pagination, and caching.
   */
  async list(params: ListTasksQuery, userId: string, role: Role, organizationId: string) {
    // Build filter conditions
    const where: Prisma.TaskWhereInput = {
      project: { organizationId },
      ...(params.status && { status: params.status }),
      ...(params.priority && { priority: params.priority }),
      ...(params.projectId && { projectId: params.projectId }),
      ...(params.search && {
        OR: [
          { title: { contains: params.search, mode: 'insensitive' as const } },
          { description: { contains: params.search, mode: 'insensitive' as const } },
        ],
      }),
    };

    // MEMBER role: can only see their assigned tasks
    if (role === 'MEMBER') {
      where.assigneeId = userId;
    } else if (params.assigneeId) {
      where.assigneeId = params.assigneeId;
    }

    // Check cache
    const cacheKey = cache.buildTaskListKey({
      organizationId,
      assigneeId: role === 'MEMBER' ? userId : params.assigneeId,
      page: params.page,
      limit: params.limit,
      filters: {
        status: params.status,
        priority: params.priority,
        projectId: params.projectId,
        search: params.search,
        sortBy: params.sortBy,
        sortOrder: params.sortOrder,
      },
    });

    const cached = await cache.get<{ tasks: any[]; total: number }>(cacheKey);
    if (cached) {
      return cached;
    }

    // Build sort
    const orderBy: Prisma.TaskOrderByWithRelationInput = {
      [params.sortBy]: params.sortOrder,
    };

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          assignee: { select: { id: true, name: true, email: true } },
          creator: { select: { id: true, name: true, email: true } },
          project: { select: { id: true, name: true } },
        },
        skip: (params.page - 1) * params.limit,
        take: params.limit,
        orderBy,
      }),
      prisma.task.count({ where }),
    ]);

    const result = { tasks, total };

    // Cache the result
    await cache.set(cacheKey, result);

    return result;
  }

  /**
   * Get a single task by ID.
   */
  async getById(taskId: string, userId: string, role: Role, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId },
        // MEMBER can only see their assigned tasks
        ...(role === 'MEMBER' && { assigneeId: userId }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    if (!task) {
      throw Errors.NOT_FOUND('Task');
    }

    return task;
  }

  /**
   * Update task fields (NOT status — use updateStatus for that).
   */
  async update(
    taskId: string,
    input: UpdateTaskInput,
    userId: string,
    role: Role,
    organizationId: string
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId },
      },
    });

    if (!task) {
      throw Errors.NOT_FOUND('Task');
    }

    // MEMBER can only update their assigned tasks
    if (role === 'MEMBER' && task.assigneeId !== userId) {
      throw Errors.FORBIDDEN('Members can only update their assigned tasks');
    }

    // Verify new assignee belongs to org
    if (input.assigneeId) {
      const assignee = await prisma.user.findFirst({
        where: { id: input.assigneeId, organizationId },
      });
      if (!assignee) {
        throw Errors.NOT_FOUND('Assignee');
      }
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        ...(input.title !== undefined && { title: input.title }),
        ...(input.description !== undefined && { description: input.description }),
        ...(input.priority !== undefined && { priority: input.priority }),
        ...(input.assigneeId !== undefined && { assigneeId: input.assigneeId }),
        ...(input.dueDate !== undefined && {
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
        }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await cache.invalidateTaskCache(organizationId);

    logger.info(`Task updated: "${updated.title}" by ${userId}`);
    return updated;
  }

  /**
   * Update task status with server-enforced transition rules.
   * Only the assignee OR a MANAGER/ADMIN can advance status.
   */
  async updateStatus(
    taskId: string,
    input: UpdateTaskStatusInput,
    userId: string,
    role: Role,
    organizationId: string
  ) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId },
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    if (!task) {
      throw Errors.NOT_FOUND('Task');
    }

    const currentStatus = task.status;
    const newStatus = input.status;

    // 1. Validate transition is allowed
    const allowedTransitions = VALID_TRANSITIONS[currentStatus];
    if (!allowedTransitions.includes(newStatus)) {
      throw Errors.INVALID_STATUS_TRANSITION(currentStatus, newStatus);
    }

    // 2. Check authorization: only assignee, MANAGER, or ADMIN can change status
    if (role === 'MEMBER') {
      if (task.assigneeId !== userId) {
        throw Errors.NOT_ASSIGNEE();
      }
    }

    // 3. Record completion time if transitioning to DONE
    const completedAt = newStatus === TaskStatus.DONE ? new Date() : null;

    const updated = await prisma.task.update({
      where: { id: taskId },
      data: {
        status: newStatus,
        ...(completedAt && { completedAt }),
      },
      include: {
        assignee: { select: { id: true, name: true, email: true } },
        creator: { select: { id: true, name: true, email: true } },
        project: { select: { id: true, name: true } },
      },
    });

    await cache.invalidateTaskCache(organizationId);

    logger.info(`Task status changed: "${updated.title}" ${currentStatus} → ${newStatus}`);

    return {
      task: updated,
      transition: {
        from: currentStatus,
        to: newStatus,
      },
    };
  }

  /**
   * Delete a task.
   */
  async delete(taskId: string, userId: string, role: Role, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: {
        id: taskId,
        project: { organizationId },
      },
    });

    if (!task) {
      throw Errors.NOT_FOUND('Task');
    }

    // Only ADMIN/MANAGER or the creator can delete
    if (role === 'MEMBER' && task.creatorId !== userId) {
      throw Errors.FORBIDDEN('Members can only delete tasks they created');
    }

    await prisma.task.delete({ where: { id: taskId } });
    await cache.invalidateTaskCache(organizationId);

    logger.info(`Task deleted: ${taskId} by ${userId}`);
  }

  // ─────────── Comments ───────────

  async getComments(taskId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) throw Errors.NOT_FOUND('Task');

    return prisma.comment.findMany({
      where: { taskId },
      include: { user: { select: { id: true, name: true, role: true } } },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addComment(taskId: string, content: string, userId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) throw Errors.NOT_FOUND('Task');

    const comment = await prisma.comment.create({
      data: { content, taskId, userId },
      include: { user: { select: { id: true, name: true, role: true } } },
    });
    return comment;
  }

  // ─────────── Sub-tasks ───────────

  async getSubTasks(taskId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) throw Errors.NOT_FOUND('Task');

    return prisma.subTask.findMany({
      where: { taskId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async addSubTask(taskId: string, title: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) throw Errors.NOT_FOUND('Task');

    const subTask = await prisma.subTask.create({
      data: { title, taskId },
    });
    return subTask;
  }

  async updateSubTask(taskId: string, subTaskId: string, data: { title?: string; isDone?: boolean }, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) throw Errors.NOT_FOUND('Task');

    const subTask = await prisma.subTask.update({
      where: { id: subTaskId },
      data,
    });
    return subTask;
  }

  async deleteSubTask(taskId: string, subTaskId: string, organizationId: string) {
    const task = await prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) throw Errors.NOT_FOUND('Task');

    await prisma.subTask.delete({ where: { id: subTaskId } });
  }
}

export const tasksService = new TasksService();
