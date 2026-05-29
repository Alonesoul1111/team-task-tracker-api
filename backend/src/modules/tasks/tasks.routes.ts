import { Router } from 'express';
import { tasksController } from './tasks.controller';
import { authenticate, authorize, validate, asyncHandler } from '../../middleware';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
  listTasksQuerySchema,
  addCommentSchema,
  addSubTaskSchema,
  updateSubTaskSchema,
} from './tasks.validation';

const router = Router();

router.use(authenticate);

router.get(
  '/',
  validate(listTasksQuerySchema, 'query'),
  asyncHandler(tasksController.list)
);

router.get('/:id', asyncHandler(tasksController.getById));

router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createTaskSchema),
  asyncHandler(tasksController.create)
);

router.patch(
  '/:id',
  validate(updateTaskSchema),
  asyncHandler(tasksController.update)
);

router.patch(
  '/:id/status',
  validate(updateTaskStatusSchema),
  asyncHandler(tasksController.updateStatus)
);

router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(tasksController.delete)
);

// Comments
router.get('/:id/comments', asyncHandler(tasksController.getComments));
router.post(
  '/:id/comments',
  validate(addCommentSchema),
  asyncHandler(tasksController.addComment)
);

// Sub-tasks
router.get('/:id/subtasks', asyncHandler(tasksController.getSubTasks));
router.post(
  '/:id/subtasks',
  validate(addSubTaskSchema),
  asyncHandler(tasksController.addSubTask)
);
router.patch(
  '/:id/subtasks/:subTaskId',
  validate(updateSubTaskSchema),
  asyncHandler(tasksController.updateSubTask)
);
router.delete(
  '/:id/subtasks/:subTaskId',
  asyncHandler(tasksController.deleteSubTask)
);

export { router as taskRoutes };
