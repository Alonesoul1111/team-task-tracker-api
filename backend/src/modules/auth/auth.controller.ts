import { Request, Response } from 'express';
import { authService } from './auth.service';
import { ApiResponse } from '../../utils/response';

export class AuthController {
  async register(req: Request, res: Response) {
    const result = await authService.register(req.body);
    return ApiResponse.created(res, result);
  }

  async login(req: Request, res: Response) {
    const result = await authService.login(req.body);
    return ApiResponse.success(res, result);
  }

  async refreshToken(req: Request, res: Response) {
    const { refreshToken } = req.body;
    const result = await authService.refreshToken(refreshToken);
    return ApiResponse.success(res, result);
  }

  async logout(req: Request, res: Response) {
    await authService.logout(req.user!.id);
    return ApiResponse.success(res, { message: 'Logged out successfully' });
  }

  async me(req: Request, res: Response) {
    return ApiResponse.success(res, req.user);
  }
}

export const authController = new AuthController();
