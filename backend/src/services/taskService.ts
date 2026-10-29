import { Task } from '../db/schema';
import { TaskRepository } from '../repositories/TaskRepository';
import {
  CreateTaskInput,
  ListTasksQuery,
  RescheduleTaskInput,
  UpdateTaskInput,
  UpdateTaskStatusInput,
} from '../schemas/task.schema';
import { NotFoundError } from '../utils/errors';

export class TaskService {
  constructor(private readonly taskRepository: TaskRepository) {}

  private getTodayDateString(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private async ensureCategoryBelongsToUser(
    categoryId: string | null | undefined,
    userId: string
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.taskRepository.findCategoryByIdAndUser(
      categoryId,
      userId
    );
    if (!category) {
      throw new NotFoundError('Categoria não encontrada para este usuário');
    }
  }

  async createTask(userId: string, input: CreateTaskInput): Promise<Task> {
    await this.ensureCategoryBelongsToUser(input.categoryId, userId);

    const today = this.getTodayDateString();
    const initialStatus = input.scheduledDate < today ? 'OVERDUE' : 'PENDING';

    return this.taskRepository.create({
      userId,
      categoryId: input.categoryId ?? null,
      title: input.title,
      description: input.description ?? null,
      scheduledDate: input.scheduledDate,
      originalScheduledDate: input.scheduledDate,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      priority: input.priority ?? 'MEDIUM',
      status: initialStatus,
      rescheduledCount: 0,
      reminderMinutesBefore: input.reminderMinutesBefore ?? null,
      reminderSent: false,
    });
  }

  async listTasks(userId: string, query: ListTasksQuery): Promise<Task[]> {
    const today = this.getTodayDateString();
    await this.taskRepository.markPastPendingAsOverdue(userId, today);
    return this.taskRepository.findManyByUser(userId, query);
  }

  async listOverdueTasks(userId: string): Promise<Task[]> {
    const today = this.getTodayDateString();
    await this.taskRepository.markPastPendingAsOverdue(userId, today);
    return this.taskRepository.findOverdueByUser(userId);
  }

  async getTaskById(userId: string, taskId: string): Promise<Task> {
    const task = await this.taskRepository.findByIdAndUser(taskId, userId);
    if (!task) {
      throw new NotFoundError('Tarefa não encontrada');
    }
    return task;
  }

  async updateTask(
    userId: string,
    taskId: string,
    input: UpdateTaskInput
  ): Promise<Task> {
    const existing = await this.getTaskById(userId, taskId);
    await this.ensureCategoryBelongsToUser(input.categoryId, userId);

    const completedAt =
      input.status === 'COMPLETED'
        ? existing.completedAt ?? new Date()
        : input.status
          ? null
          : existing.completedAt;

    const updated = await this.taskRepository.updateByIdAndUser(taskId, userId, {
      ...input,
      completedAt,
    });

    if (!updated) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    return updated;
  }

  async rescheduleTask(
    userId: string,
    taskId: string,
    input: RescheduleTaskInput
  ): Promise<Task> {
    const existing = await this.getTaskById(userId, taskId);
    const today = this.getTodayDateString();
    const newStatus = input.scheduledDate < today ? 'OVERDUE' : 'PENDING';

    const updated = await this.taskRepository.updateByIdAndUser(taskId, userId, {
      scheduledDate: input.scheduledDate,
      startTime:
        input.startTime !== undefined ? input.startTime : existing.startTime,
      endTime: input.endTime !== undefined ? input.endTime : existing.endTime,
      status: newStatus,
      rescheduledCount: existing.rescheduledCount + 1,
      reminderSent: false,
      completedAt: null,
    });

    if (!updated) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    return updated;
  }

  async updateTaskStatus(
    userId: string,
    taskId: string,
    input: UpdateTaskStatusInput
  ): Promise<Task> {
    await this.getTaskById(userId, taskId);

    const completedAt = input.status === 'COMPLETED' ? new Date() : null;

    const updated = await this.taskRepository.updateByIdAndUser(taskId, userId, {
      status: input.status,
      completedAt,
    });

    if (!updated) {
      throw new NotFoundError('Tarefa não encontrada');
    }

    return updated;
  }

  async deleteTask(userId: string, taskId: string): Promise<void> {
    const deleted = await this.taskRepository.deleteByIdAndUser(taskId, userId);
    if (!deleted) {
      throw new NotFoundError('Tarefa não encontrada');
    }
  }
}

