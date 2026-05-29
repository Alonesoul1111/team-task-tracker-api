import { Request, Response } from 'express';
import { tasksService } from './tasks.service';
import { ApiResponse } from '../../utils/response';
import { getIO } from '../../socket';

export class TasksController {
  async create(req: Request, res: Response) {
    const task = await tasksService.create(
      req.body,
      req.user!.id,
      req.user!.organizationId
    );

    // Emit real-time event
    const io = getIO();
    io.to(`org:${req.user!.organizationId}`).emit('task:created', task);

    return ApiResponse.created(res, task);
  }

  async list(req: Request, res: Response) {
    const query = req.query as any;
    const { tasks, total } = await tasksService.list(
      {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 20,
        status: query.status,
        priority: query.priority,
        assigneeId: query.assigneeId,
        projectId: query.projectId,
        search: query.search,
        sortBy: query.sortBy || 'createdAt',
        sortOrder: query.sortOrder || 'desc',
      },
      req.user!.id,
      req.user!.role,
      req.user!.organizationId
    );
    return ApiResponse.paginated(res, tasks, {
      page: Number(query.page) || 1,
      limit: Number(query.limit) || 20,
      total,
    });
  }

  async getById(req: Request, res: Response) {
    const task = await tasksService.getById(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId
    );
    return ApiResponse.success(res, task);
  }

  async update(req: Request, res: Response) {
    const task = await tasksService.update(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId
    );

    const io = getIO();
    io.to(`org:${req.user!.organizationId}`).emit('task:updated', task);

    return ApiResponse.success(res, task);
  }

  async updateStatus(req: Request, res: Response) {
    const result = await tasksService.updateStatus(
      req.params.id as string,
      req.body,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId
    );

    // Emit real-time status change event
    const io = getIO();
    io.to(`org:${req.user!.organizationId}`).emit('task:status-changed', result);

    // Notify assignee specifically
    if (result.task.assignee) {
      io.to(`user:${result.task.assignee.id}`).emit('task:status-changed', {
        taskId: result.task.id,
        title: result.task.title,
        from: result.transition.from,
        to: result.transition.to,
      });
    }

    return ApiResponse.success(res, result);
  }

  async delete(req: Request, res: Response) {
    await tasksService.delete(
      req.params.id as string,
      req.user!.id,
      req.user!.role,
      req.user!.organizationId
    );

    const io = getIO();
    io.to(`org:${req.user!.organizationId}`).emit('task:deleted', { id: req.params.id });

    return ApiResponse.noContent(res);
  }

  // Comments

  async getComments(req: Request, res: Response) {
    const comments = await tasksService.getComments(req.params.id as string, req.user!.organizationId);
    return ApiResponse.success(res, comments);
  }

  async addComment(req: Request, res: Response) {
    const comment = await tasksService.addComment(
      req.params.id as string,
      req.body.content,
      req.user!.id,
      req.user!.organizationId
    );
    return ApiResponse.created(res, comment);
  }

  // Sub-tasks

  async getSubTasks(req: Request, res: Response) {
    const subtasks = await tasksService.getSubTasks(req.params.id as string, req.user!.organizationId);
    return ApiResponse.success(res, subtasks);
  }

  async addSubTask(req: Request, res: Response) {
    const subtask = await tasksService.addSubTask(
      req.params.id as string,
      req.body.title,
      req.user!.organizationId
    );
    return ApiResponse.created(res, subtask);
  }

  async updateSubTask(req: Request, res: Response) {
    const subtask = await tasksService.updateSubTask(
      req.params.id as string,
      req.params.subTaskId as string,
      req.body,
      req.user!.organizationId
    );
    return ApiResponse.success(res, subtask);
  }

  async deleteSubTask(req: Request, res: Response) {
    await tasksService.deleteSubTask(
      req.params.id as string,
      req.params.subTaskId as string,
      req.user!.organizationId
    );
    return ApiResponse.noContent(res);
  }
}

export const tasksController = new TasksController();
