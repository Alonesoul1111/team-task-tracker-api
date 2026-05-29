import { Router } from 'express';
import { projectsController } from './projects.controller';
import { authenticate, authorize, validate, asyncHandler } from '../../middleware';
import { createProjectSchema, updateProjectSchema, listProjectsQuerySchema } from './projects.validation';

const router = Router();

router.use(authenticate);

/**
 * @openapi
 * /api/projects:
 *   get:
 *     tags: [Projects]
 *     summary: List all projects in organization
 *     security:
 *       - bearerAuth: []
 */
router.get(
  '/',
  validate(listProjectsQuerySchema, 'query'),
  asyncHandler(projectsController.list)
);

/**
 * @openapi
 * /api/projects/{id}:
 *   get:
 *     tags: [Projects]
 *     summary: Get project by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', asyncHandler(projectsController.getById));

/**
 * @openapi
 * /api/projects:
 *   post:
 *     tags: [Projects]
 *     summary: Create a new project (ADMIN/MANAGER only)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createProjectSchema),
  asyncHandler(projectsController.create)
);

/**
 * @openapi
 * /api/projects/{id}:
 *   patch:
 *     tags: [Projects]
 *     summary: Update a project (ADMIN/MANAGER only)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  validate(updateProjectSchema),
  asyncHandler(projectsController.update)
);

/**
 * @openapi
 * /api/projects/{id}:
 *   delete:
 *     tags: [Projects]
 *     summary: Delete a project (ADMIN only)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize('ADMIN'), asyncHandler(projectsController.delete));

export { router as projectRoutes };
