import { Request, Response } from 'express';
import { weeklyAnalyticsQuerySchema } from '../schemas/analytics.schema';
import { AnalyticsService } from '../services/analyticsService';
import { BaseController } from './BaseController';

export class AnalyticsController extends BaseController {
  constructor(private readonly analyticsService: AnalyticsService) {
    super();
  }

  async getWeekly(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const query = weeklyAnalyticsQuerySchema.parse(req.query);
      const analytics = await this.analyticsService.getWeeklyAnalytics(
        userId,
        query
      );
      this.handleSuccess(res, analytics);
    } catch (error) {
      this.handleError(error, res, 'AnalyticsController.getWeekly');
    }
  }
}

