import { Request, Response } from 'express';
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category.schema';
import { CategoryService } from '../services/categoryService';
import { BaseController } from './BaseController';

export class CategoryController extends BaseController {
  constructor(private readonly categoryService: CategoryService) {
    super();
  }

  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const input = createCategorySchema.parse(req.body);
      const created = await this.categoryService.createCategory(userId, input);
      this.handleCreated(res, created);
    } catch (error) {
      this.handleError(error, res, 'CategoryController.create');
    }
  }

  async list(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const categories = await this.categoryService.listCategories(userId);
      this.handleSuccess(res, categories);
    } catch (error) {
      this.handleError(error, res, 'CategoryController.list');
    }
  }

  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = categoryIdParamSchema.parse(req.params);
      const category = await this.categoryService.getCategoryById(userId, id);
      this.handleSuccess(res, category);
    } catch (error) {
      this.handleError(error, res, 'CategoryController.getById');
    }
  }

  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = categoryIdParamSchema.parse(req.params);
      const input = updateCategorySchema.parse(req.body);
      const updated = await this.categoryService.updateCategory(
        userId,
        id,
        input
      );
      this.handleSuccess(res, updated);
    } catch (error) {
      this.handleError(error, res, 'CategoryController.update');
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const { id } = categoryIdParamSchema.parse(req.params);
      await this.categoryService.deleteCategory(userId, id);
      this.handleNoContent(res);
    } catch (error) {
      this.handleError(error, res, 'CategoryController.delete');
    }
  }
}

