import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize, validate, asyncHandler } from '../../middleware';
import { updateUserRoleSchema, updateUserStatusSchema, listUsersQuerySchema } from './users.validation';

const router = Router();

// All user management routes require ADMIN role
router.use(authenticate);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Users]
 *     summary: List all users in organization
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *       - in: query
 *         name: role
 *         schema: { type: string, enum: [ADMIN, MANAGER, MEMBER] }
 *     responses:
 *       200:
 *         description: Paginated list of users
 */
router.get(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(listUsersQuerySchema, 'query'),
  asyncHandler(usersController.list)
);

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Users]
 *     summary: Get user by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', authorize('ADMIN', 'MANAGER'), asyncHandler(usersController.getById));

/**
 * @openapi
 * /api/users/{id}/role:
 *   patch:
 *     tags: [Users]
 *     summary: Update user role (ADMIN only)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/role',
  authorize('ADMIN'),
  validate(updateUserRoleSchema),
  asyncHandler(usersController.updateRole)
);

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Users]
 *     summary: Delete user (ADMIN only)
 *     security:
 *       - bearerAuth: []
 */
router.delete('/:id', authorize('ADMIN'), asyncHandler(usersController.delete));

router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(updateUserStatusSchema),
  asyncHandler(usersController.updateStatus)
);

export { router as userRoutes };
