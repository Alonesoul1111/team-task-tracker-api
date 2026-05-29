import { Request, Response } from 'express';
import { projectsService } from './projects.service';
import { ApiResponse } from '../../utils/response';

export class ProjectsController {
  async create(req: Request, res: Response) {
    const project = await projectsService.create(req.body, req.user!.organizationId);
    return ApiResponse.created(res, project);
  }

  async list(req: Request, res: Response) {
    const { page, limit, search } = req.query as any;
    const { projects, total } = await projectsService.list(
      req.user!.organizationId,
      { page: Number(page) || 1, limit: Number(limit) || 20, search }
    );
    return ApiResponse.paginated(res, projects, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      total,
    });
  }

  async getById(req: Request, res: Response) {
    const project = await projectsService.getById(
      req.params.id as string,
      req.user!.organizationId
    );
    return ApiResponse.success(res, project);
  }

  async update(req: Request, res: Response) {
    const project = await projectsService.update(
      req.params.id as string,
      req.body,
      req.user!.organizationId
    );
    return ApiResponse.success(res, project);
  }

  async delete(req: Request, res: Response) {
    await projectsService.delete(req.params.id as string, req.user!.organizationId);
    return ApiResponse.noContent(res);
  }
}

export const projectsController = new ProjectsController();
