import { Request, Response } from 'express';
import {
  pushSubscriptionIdParamSchema,
  subscribePushSchema,
} from '../schemas/push.schema';
import { PushService } from '../services/pushService';
import { BaseController } from './BaseController';

export class PushController extends BaseController {
  constructor(private readonly pushService: PushService) {
    super();
  }

  async subscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const input = subscribePushSchema.parse(req.body);
      const created = await this.pushService.subscribe(userId, input);
      this.handleCreated(res, created);
    } catch (error) {
      this.handleError(error, res, 'PushController.subscribe');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const subscriptions = await this.pushService.listSubscriptions(userId);
      this.handleSuccess(res, subscriptions);
    } catch (error) {
      this.handleError(error, res, 'PushController.list');
    }
  }

  async unsubscribe(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = pushSubscriptionIdParamSchema.parse(req.params);
      await this.pushService.unsubscribe(userId, id);
      this.handleNoContent(res);
    } catch (error) {
      this.handleError(error, res, 'PushController.unsubscribe');
    }
  }
}

