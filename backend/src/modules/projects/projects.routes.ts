import { Router } from 'express';
import { projectsController } from './projects.controller';
import { authenticate, authorize, validate, asyncHandler } from '../../middleware';
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from './projects.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  asyncHandler(projectsController.list)
);

router.get('/:id', asyncHandler(projectsController.getById));

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createProjectSchema),
  asyncHandler(projectsController.create)
);

router.patch(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateProjectSchema),
  asyncHandler(projectsController.update)
);

router.delete('/:id', authorize('ADMIN'), asyncHandler(projectsController.delete));

export { router as projectRoutes };
