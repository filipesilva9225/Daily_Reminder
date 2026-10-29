import {
  ApiSuccessResponse,
  WeeklyAnalyticsResult,
} from '../types/api.types';
import { apiClient } from './apiClient';

export const analyticsService = {
  async getWeekly(params?: {
    date?: string;
    weekStartsOn?: number;
  }): Promise<WeeklyAnalyticsResult> {
    const { data } = await apiClient.get<
      ApiSuccessResponse<WeeklyAnalyticsResult>
    >('/analytics/weekly', { params });
    return data.data;
  },
};

