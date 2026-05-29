import { Router } from 'express';
import { usersController } from './users.controller';
import { authenticate, authorize, validate, asyncHandler } from '../../middleware';
import { updateUserRoleSchema, updateUserStatusSchema, listUsersQuerySchema } from './users.validation';

const router = Router();

// All user management routes require ADMIN role
router.use(authenticate);

router.get(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(listUsersQuerySchema, 'query'),
  asyncHandler(usersController.list)
);

router.get('/:id', authorize('ADMIN', 'MANAGER'), asyncHandler(usersController.getById));

router.patch(
  '/:id/role',
  authorize('ADMIN'),
  validate(updateUserRoleSchema),
  asyncHandler(usersController.updateRole)
);

router.delete('/:id', authorize('ADMIN'), asyncHandler(usersController.delete));

router.patch(
  '/:id/status',
  authorize('ADMIN'),
  validate(updateUserStatusSchema),
  asyncHandler(usersController.updateStatus)
);

export { router as userRoutes };
