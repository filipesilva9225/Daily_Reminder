import { Router } from 'express';
import { PushController } from '../controllers/PushController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { PushSubscriptionRepository } from '../repositories/PushSubscriptionRepository';
import {
  pushSubscriptionIdParamSchema,
  subscribePushSchema,
} from '../schemas/push.schema';
import { PushService } from '../services/pushService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

export function createPushRouter(controller?: PushController): Router {
  const router = Router();
  const pushController =
    controller ??
    new PushController(new PushService(new PushSubscriptionRepository()));

  router.use(authMiddleware);

  router.post(
    '/subscribe',
    validateRequest({ body: subscribePushSchema }),
    asyncErrorWrapper((req, res) => pushController.subscribe(req, res))
  );

  router.get(
    '/subscriptions',
    asyncErrorWrapper((req, res) => pushController.list(req, res))
  );

  router.delete(
    '/subscriptions/:id',
    validateRequest({ params: pushSubscriptionIdParamSchema }),
    asyncErrorWrapper((req, res) => pushController.unsubscribe(req, res))
  );

  return router;
}

export const pushRoutes = createPushRouter();

