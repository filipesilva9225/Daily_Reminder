import { Category } from '../db/schema';
import { CategoryRepository } from '../repositories/CategoryRepository';
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from '../schemas/category.schema';
import { NotFoundError } from '../utils/errors';

export class CategoryService {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async createCategory(
    userId: string,
    input: CreateCategoryInput
  ): Promise<Category> {
    return this.categoryRepository.create({
      userId,
      name: input.name,
      colorHex: input.colorHex ?? '#3B82F6',
      icon: input.icon ?? null,
    });
  }

  async listCategories(userId: string): Promise<Category[]> {
    return this.categoryRepository.findAllByUser(userId);
  }

  async getCategoryById(userId: string, categoryId: string): Promise<Category> {
    const category = await this.categoryRepository.findByIdAndUser(
      categoryId,
      userId
    );
    if (!category) {
      throw new NotFoundError('Categoria não encontrada');
    }
    return category;
  }

  async updateCategory(
    userId: string,
    categoryId: string,
    input: UpdateCategoryInput
  ): Promise<Category> {
    await this.getCategoryById(userId, categoryId);
    const updated = await this.categoryRepository.updateByIdAndUser(
      categoryId,
      userId,
      input
    );
    if (!updated) {
      throw new NotFoundError('Categoria não encontrada');
    }
    return updated;
  }

  async deleteCategory(userId: string, categoryId: string): Promise<void> {
    const deleted = await this.categoryRepository.deleteByIdAndUser(
      categoryId,
      userId
    );
    if (!deleted) {
      throw new NotFoundError('Categoria não encontrada');
    }
  }
}

