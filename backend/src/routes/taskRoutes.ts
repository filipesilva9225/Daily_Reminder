import { Router } from 'express';
import { TaskController } from '../controllers/TaskController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { TaskRepository } from '../repositories/TaskRepository';
import {
  createTaskSchema,
  listTasksQuerySchema,
  rescheduleTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/task.schema';
import { TaskService } from '../services/taskService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

export function createTaskRouter(controller?: TaskController): Router {
  const router = Router();
  const taskController =
    controller ?? new TaskController(new TaskService(new TaskRepository()));

  router.use(authMiddleware);

  router.post(
    '/',
    validateRequest({ body: createTaskSchema }),
    asyncErrorWrapper((req, res) => taskController.create(req, res))
  );

  router.get(
    '/',
    validateRequest({ query: listTasksQuerySchema }),
    asyncErrorWrapper((req, res) => taskController.list(req, res))
  );

  router.get(
    '/overdue',
    asyncErrorWrapper((req, res) => taskController.listOverdue(req, res))
  );

  router.get(
    '/:id',
    validateRequest({ params: taskIdParamSchema }),
    asyncErrorWrapper((req, res) => taskController.getById(req, res))
  );

  router.put(
    '/:id',
    validateRequest({ params: taskIdParamSchema, body: updateTaskSchema }),
    asyncErrorWrapper((req, res) => taskController.update(req, res))
  );

  router.post(
    '/:id/reschedule',
    validateRequest({ params: taskIdParamSchema, body: rescheduleTaskSchema }),
    asyncErrorWrapper((req, res) => taskController.reschedule(req, res))
  );

  router.patch(
    '/:id/status',
    validateRequest({ params: taskIdParamSchema, body: updateTaskStatusSchema }),
    asyncErrorWrapper((req, res) => taskController.updateStatus(req, res))
  );

  router.delete(
    '/:id',
    validateRequest({ params: taskIdParamSchema }),
    asyncErrorWrapper((req, res) => taskController.delete(req, res))
  );

  return router;
}

export const taskRoutes = createTaskRouter();

