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

/**
 * @openapi
 * /api/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: List tasks with filtering and pagination
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
 *         name: status
 *         schema: { type: string, enum: [TODO, IN_PROGRESS, IN_REVIEW, DONE, BLOCKED] }
 *       - in: query
 *         name: priority
 *         schema: { type: string, enum: [LOW, MEDIUM, HIGH] }
 *       - in: query
 *         name: assigneeId
 *         schema: { type: string, format: uuid }
 *       - in: query
 *         name: projectId
 *         schema: { type: string, format: uuid }
 *     responses:
 *       200:
 *         description: Paginated list of tasks
 */
router.get(
  '/',
  validate(listTasksQuerySchema, 'query'),
  asyncHandler(tasksController.list)
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Get task by ID
 *     security:
 *       - bearerAuth: []
 */
router.get('/:id', asyncHandler(tasksController.getById));

/**
 * @openapi
 * /api/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Create a new task (ADMIN/MANAGER only)
 *     security:
 *       - bearerAuth: []
 */
router.post(
  '/',
  authorize('ADMIN', 'MANAGER'),
  validate(createTaskSchema),
  asyncHandler(tasksController.create)
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task fields
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id',
  validate(updateTaskSchema),
  asyncHandler(tasksController.update)
);

/**
 * @openapi
 * /api/tasks/{id}/status:
 *   patch:
 *     tags: [Tasks]
 *     summary: Update task status (with transition validation)
 *     security:
 *       - bearerAuth: []
 */
router.patch(
  '/:id/status',
  validate(updateTaskStatusSchema),
  asyncHandler(tasksController.updateStatus)
);

/**
 * @openapi
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Delete a task (ADMIN/MANAGER or creator)
 *     security:
 *       - bearerAuth: []
 */
router.delete(
  '/:id',
  authorize('ADMIN', 'MANAGER'),
  asyncHandler(tasksController.delete)
);

// ─────────── Comments ───────────
router.get('/:id/comments', asyncHandler(tasksController.getComments));
router.post(
  '/:id/comments',
  validate(addCommentSchema),
  asyncHandler(tasksController.addComment)
);

// ─────────── Sub-tasks ───────────
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
