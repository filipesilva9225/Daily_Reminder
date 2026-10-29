import { Request, Response } from 'express';
import {
  createRoutineSchema,
  executionIdParamSchema,
  routineIdParamSchema,
  updateExecutionStatusSchema,
  updateRoutineSchema,
  weekRoutineQuerySchema,
} from '../schemas/routine.schema';
import { RoutineService } from '../services/routineService';
import { BaseController } from './BaseController';

export class RoutineController extends BaseController {
  constructor(private readonly routineService: RoutineService) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const input = createRoutineSchema.parse(req.body);
      const created = await this.routineService.createRoutine(userId, input);
      this.handleCreated(res, created);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.create');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const routines = await this.routineService.listRoutines(userId);
      this.handleSuccess(res, routines);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.list');
    }
  }

  async getWeeklySchedule(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const query = weekRoutineQuerySchema.parse(req.query);
      const result = await this.routineService.reconcileAndGetWeeklySchedule(
        userId,
        query
      );
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.getWeeklySchedule');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = routineIdParamSchema.parse(req.params);
      const routine = await this.routineService.getRoutineById(userId, id);
      this.handleSuccess(res, routine);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.getById');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = routineIdParamSchema.parse(req.params);
      const input = updateRoutineSchema.parse(req.body);
      const updated = await this.routineService.updateRoutine(userId, id, input);
      this.handleSuccess(res, updated);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.update');
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = routineIdParamSchema.parse(req.params);
      await this.routineService.deleteRoutine(userId, id);
      this.handleNoContent(res);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.delete');
    }
  }

  async updateExecutionStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { executionId } = executionIdParamSchema.parse(req.params);
      const input = updateExecutionStatusSchema.parse(req.body);
      const updated = await this.routineService.updateExecutionStatus(
        userId,
        executionId,
        input
      );
      this.handleSuccess(res, updated);
    } catch (error) {
      this.handleError(error, res, 'RoutineController.updateExecutionStatus');
    }
  }
}

