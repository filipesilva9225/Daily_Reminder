import {
  ApiSuccessResponse,
  Task,
  TaskPriority,
  TaskStatus,
} from '../types/api.types';
import { apiClient } from './apiClient';

export interface ListTasksParams {
  startDate?: string;
  endDate?: string;
  status?: TaskStatus;
  priority?: TaskPriority;
  categoryId?: string;
  includeOverdue?: boolean;
}

export interface CreateOrUpdateTaskPayload {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  scheduledDate: string;
  startTime?: string | null;
  endTime?: string | null;
  priority?: TaskPriority;
  status?: TaskStatus;
  reminderMinutesBefore?: number | null;
}

export const taskService = {
  async list(params?: ListTasksParams): Promise<Task[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Task[]>>('/tasks', {
      params: {
        ...params,
        includeOverdue:
          params?.includeOverdue !== undefined
            ? String(params.includeOverdue)
            : undefined,
      },
    });
    return data.data;
  },

  async listOverdue(): Promise<Task[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Task[]>>(
      '/tasks/overdue'
    );
    return data.data;
  },

  async getById(id: string): Promise<Task> {
    const { data } = await apiClient.get<ApiSuccessResponse<Task>>(
      `/tasks/${id}`
    );
    return data.data;
  },

  async create(payload: CreateOrUpdateTaskPayload): Promise<Task> {
    const { data } = await apiClient.post<ApiSuccessResponse<Task>>(
      '/tasks',
      payload
    );
    return data.data;
  },

  async update(
    id: string,
    payload: Partial<CreateOrUpdateTaskPayload>
  ): Promise<Task> {
    const { data } = await apiClient.put<ApiSuccessResponse<Task>>(
      `/tasks/${id}`,
      payload
    );
    return data.data;
  },

  async reschedule(
    id: string,
    payload: {
      scheduledDate: string;
      startTime?: string | null;
      endTime?: string | null;
    }
  ): Promise<Task> {
    const { data } = await apiClient.post<ApiSuccessResponse<Task>>(
      `/tasks/${id}/reschedule`,
      payload
    );
    return data.data;
  },

  async updateStatus(id: string, status: TaskStatus): Promise<Task> {
    const { data } = await apiClient.patch<ApiSuccessResponse<Task>>(
      `/tasks/${id}/status`,
      { status }
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/tasks/${id}`);
  },
};

