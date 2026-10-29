import { Router } from 'express';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { CategoryRepository } from '../repositories/CategoryRepository';
import { RoutineRepository } from '../repositories/RoutineRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { weeklyAnalyticsQuerySchema } from '../schemas/analytics.schema';
import { AnalyticsService } from '../services/analyticsService';
import { RoutineService } from '../services/routineService';
import { TaskService } from '../services/taskService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

export function createAnalyticsRouter(
  controller?: AnalyticsController
): Router {
  const router = Router();
  const analyticsController =
    controller ??
    new AnalyticsController(
      new AnalyticsService(
        new TaskService(new TaskRepository()),
        new RoutineService(new RoutineRepository()),
        new CategoryRepository()
      )
    );

  router.use(authMiddleware);

  router.get(
    '/weekly',
    validateRequest({ query: weeklyAnalyticsQuerySchema }),
    asyncErrorWrapper((req, res) => analyticsController.getWeekly(req, res))
  );

  return router;
}

export const analyticsRoutes = createAnalyticsRouter();

