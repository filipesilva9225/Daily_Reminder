import {
  ApiSuccessResponse,
  AuthResponse,
  ThemeMode,
  User,
} from '../types/api.types';
import { LoginFormValues, RegisterFormValues } from '../schemas/auth.schema';
import { apiClient } from './apiClient';

export const authService = {
  async register(payload: RegisterFormValues): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
      '/auth/register',
      payload
    );
    return data.data;
  },

  async login(payload: LoginFormValues): Promise<AuthResponse> {
    const { data } = await apiClient.post<ApiSuccessResponse<AuthResponse>>(
      '/auth/login',
      payload
    );
    return data.data;
  },

  async getMe(): Promise<User> {
    const { data } = await apiClient.get<ApiSuccessResponse<User>>('/auth/me');
    return data.data;
  },

  async updatePreferences(payload: {
    name?: string;
    theme?: ThemeMode;
    timezone?: string;
    weekStartsOn?: number;
  }): Promise<User> {
    const { data } = await apiClient.patch<ApiSuccessResponse<User>>(
      '/auth/preferences',
      payload
    );
    return data.data;
  },
};

