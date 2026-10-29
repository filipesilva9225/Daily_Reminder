import {
  ApiSuccessResponse,
  RoutineActivity,
  RoutineExecution,
  RoutineExecutionStatus,
  WeeklyRoutineScheduleResult,
} from '../types/api.types';
import { apiClient } from './apiClient';

export interface CreateOrUpdateRoutinePayload {
  title: string;
  description?: string | null;
  categoryId?: string | null;
  daysOfWeek: number[];
  startTime?: string | null;
  endTime?: string | null;
  reminderMinutesBefore?: number | null;
  active?: boolean;
}

export const routineService = {
  async list(): Promise<RoutineActivity[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<RoutineActivity[]>>(
      '/routines'
    );
    return data.data;
  },

  async getWeeklySchedule(params?: {
    date?: string;
    weekStartsOn?: number;
  }): Promise<WeeklyRoutineScheduleResult> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<WeeklyRoutineScheduleResult>
    >('/routines/week', { params });
    return data.data;
  },

  async create(payload: CreateOrUpdateRoutinePayload): Promise<RoutineActivity> {
    const { data } = await apiClient.post<ApiSuccessResponse<RoutineActivity>>(
      '/routines',
      payload
    );
    return data.data;
  },

  async update(
    id: string,
    payload: Partial<CreateOrUpdateRoutinePayload>
  ): Promise<RoutineActivity> {
    const { data } = await apiClient.put<ApiSuccessResponse<RoutineActivity>>(
      `/routines/${id}`,
      payload
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/routines/${id}`);
  },

  async updateExecutionStatus(
    executionId: string,
    status: RoutineExecutionStatus
  ): Promise<RoutineExecution> {
    const { data } = await apiClient.patch<ApiSuccessResponse<RoutineExecution>>(
      `/routines/executions/${executionId}/status`,
      { status }
    );
    return data.data;
  },
};

