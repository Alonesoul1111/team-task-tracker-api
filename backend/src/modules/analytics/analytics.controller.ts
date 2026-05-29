import { Request, Response } from 'express';
import { analyticsService } from './analytics.service';
import { ApiResponse } from '../../utils/response';

export class AnalyticsController {
  async overview(req: Request, res: Response) {
    const data = await analyticsService.getOverview(req.user!.organizationId);
    return ApiResponse.success(res, data);
  }
}

export const analyticsController = new AnalyticsController();
