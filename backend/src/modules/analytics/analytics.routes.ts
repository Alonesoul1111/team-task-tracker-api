import { Router } from 'express';
import { analyticsController } from './analytics.controller';
import { authenticate, authorize, asyncHandler } from '../../middleware';

const router = Router();

router.use(authenticate);

router.get(
  '/overview',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(analyticsController.overview)
);

export { router as analyticsRoutes };
