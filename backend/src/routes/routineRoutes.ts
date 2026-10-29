import { Router } from 'express';
import { RoutineController } from '../controllers/RoutineController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { RoutineRepository } from '../repositories/RoutineRepository';
import {
  createRoutineSchema,
  executionIdParamSchema,
  routineIdParamSchema,
  updateExecutionStatusSchema,
  updateRoutineSchema,
  weekRoutineQuerySchema,
} from '../schemas/routine.schema';
import { RoutineService } from '../services/routineService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

export function createRoutineRouter(controller?: RoutineController): Router {
  const router = Router();
  const routineController =
    controller ??
    new RoutineController(new RoutineService(new RoutineRepository()));

  router.use(authMiddleware);

  router.post(
    '/',
    validateRequest({ body: createRoutineSchema }),
    asyncErrorWrapper((req, res) => routineController.create(req, res))
  );

  router.get(
    '/',
    asyncErrorWrapper((req, res) => routineController.list(req, res))
  );

  router.get(
    '/week',
    validateRequest({ query: weekRoutineQuerySchema }),
    asyncErrorWrapper((req, res) => routineController.getWeeklySchedule(req, res))
  );

  router.patch(
    '/executions/:executionId/status',
    validateRequest({
      params: executionIdParamSchema,
      body: updateExecutionStatusSchema,
    }),
    asyncErrorWrapper((req, res) =>
      routineController.updateExecutionStatus(req, res)
    )
  );

  router.get(
    '/:id',
    validateRequest({ params: routineIdParamSchema }),
    asyncErrorWrapper((req, res) => routineController.getById(req, res))
  );

  router.put(
    '/:id',
    validateRequest({ params: routineIdParamSchema, body: updateRoutineSchema }),
    asyncErrorWrapper((req, res) => routineController.update(req, res))
  );

  router.delete(
    '/:id',
    validateRequest({ params: routineIdParamSchema }),
    asyncErrorWrapper((req, res) => routineController.delete(req, res))
  );

  return router;
}

export const routineRoutes = createRoutineRouter();

