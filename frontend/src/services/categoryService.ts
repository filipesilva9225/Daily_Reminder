import { ApiSuccessResponse, Category } from '../types/api.types';
import { apiClient } from './apiClient';

export const categoryService = {
  async list(): Promise<Category[]> {
    const { data } = await apiClient.get<ApiSuccessResponse<Category[]>>(
      '/categories'
    );
    return data.data;
  },

  async create(payload: {
    name: string;
    colorHex: string;
    icon?: string | null;
  }): Promise<Category> {
    const { data } = await apiClient.post<ApiSuccessResponse<Category>>(
      '/categories',
      payload
    );
    return data.data;
  },

  async update(
    id: string,
    payload: Partial<{ name: string; colorHex: string; icon?: string | null }>
  ): Promise<Category> {
    const { data } = await apiClient.put<ApiSuccessResponse<Category>>(
      `/categories/${id}`,
      payload
    );
    return data.data;
  },

  async remove(id: string): Promise<void> {
    await apiClient.delete(`/categories/${id}`);
  },
};

