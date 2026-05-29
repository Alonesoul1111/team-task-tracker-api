import { Request, Response } from 'express';
import { usersService } from './users.service';
import { ApiResponse } from '../../utils/response';

export class UsersController {
  async list(req: Request, res: Response) {
    const { page, limit, role, search } = req.query as any;
    const { users, total } = await usersService.listUsers(
      req.user!.organizationId,
      { page: Number(page) || 1, limit: Number(limit) || 20, role, search: search as string }
    );
    return ApiResponse.paginated(res, users, {
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      total,
    });
  }

  async getById(req: Request, res: Response) {
    const user = await usersService.getUserById(
      req.params.id,
      req.user!.organizationId
    );
    return ApiResponse.success(res, user);
  }

  async updateRole(req: Request, res: Response) {
    const user = await usersService.updateUserRole(
      req.params.id,
      req.body.role,
      req.user!.organizationId
    );
    return ApiResponse.success(res, user);
  }

  async delete(req: Request, res: Response) {
    await usersService.deleteUser(
      req.params.id,
      req.user!.organizationId,
      req.user!.id
    );
    return ApiResponse.noContent(res);
  }
}

export const usersController = new UsersController();
