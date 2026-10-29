import { Request, Response } from 'express';
import {
  createTaskSchema,
  listTasksQuerySchema,
  rescheduleTaskSchema,
  taskIdParamSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../schemas/task.schema';
import { TaskService } from '../services/taskService';
import { BaseController } from './BaseController';

export class TaskController extends BaseController {
  constructor(private readonly taskService: TaskService) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const input = createTaskSchema.parse(req.body);
      const created = await this.taskService.createTask(userId, input);
      this.handleCreated(res, created);
    } catch (error) {
      this.handleError(error, res, 'TaskController.create');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const query = listTasksQuerySchema.parse(req.query);
      const tasks = await this.taskService.listTasks(userId, query);
      this.handleSuccess(res, tasks);
    } catch (error) {
      this.handleError(error, res, 'TaskController.list');
    }
  }

  async listOverdue(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const overdueTasks = await this.taskService.listOverdueTasks(userId);
      this.handleSuccess(res, overdueTasks);
    } catch (error) {
      this.handleError(error, res, 'TaskController.listOverdue');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = taskIdParamSchema.parse(req.params);
      const task = await this.taskService.getTaskById(userId, id);
      this.handleSuccess(res, task);
    } catch (error) {
      this.handleError(error, res, 'TaskController.getById');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = taskIdParamSchema.parse(req.params);
      const input = updateTaskSchema.parse(req.body);
      const updated = await this.taskService.updateTask(userId, id, input);
      this.handleSuccess(res, updated);
    } catch (error) {
      this.handleError(error, res, 'TaskController.update');
    }
  }

  async reschedule(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = taskIdParamSchema.parse(req.params);
      const input = rescheduleTaskSchema.parse(req.body);
      const rescheduled = await this.taskService.rescheduleTask(userId, id, input);
      this.handleSuccess(res, rescheduled);
    } catch (error) {
      this.handleError(error, res, 'TaskController.reschedule');
    }
  }

  async updateStatus(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = taskIdParamSchema.parse(req.params);
      const input = updateTaskStatusSchema.parse(req.body);
      const updated = await this.taskService.updateTaskStatus(userId, id, input);
      this.handleSuccess(res, updated);
    } catch (error) {
      this.handleError(error, res, 'TaskController.updateStatus');
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = taskIdParamSchema.parse(req.params);
      await this.taskService.deleteTask(userId, id);
      this.handleNoContent(res);
    } catch (error) {
      this.handleError(error, res, 'TaskController.delete');
    }
  }
}

