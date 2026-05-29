import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, authorize, asyncHandler } from '../../middleware';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/analytics/overview:
 *   get:
 *     tags: [Analytics]
 *     summary: Get analytics overview (ADMIN/MANAGER only)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Analytics data with aggregations
 */
router.get(
  '/overview',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(analyticsController.overview)
);

export { router as analyticsRoutes };
