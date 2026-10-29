import { Router } from 'express';
import { CategoryController } from '../controllers/CategoryController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { CategoryRepository } from '../repositories/CategoryRepository';
import {
  categoryIdParamSchema,
  createCategorySchema,
  updateCategorySchema,
} from '../schemas/category.schema';
import { CategoryService } from '../services/categoryService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

export function createCategoryRouter(controller?: CategoryController): Router {
  const router = Router();
  const categoryController =
    controller ??
    new CategoryController(new CategoryService(new CategoryRepository()));

  router.use(authMiddleware);

  router.post(
    '/',
    validateRequest({ body: createCategorySchema }),
    asyncErrorWrapper((req, res) => categoryController.create(req, res))
  );

  router.get(
    '/',
    asyncErrorWrapper((req, res) => categoryController.list(req, res))
  );

  router.get(
    '/:id',
    validateRequest({ params: categoryIdParamSchema }),
    asyncErrorWrapper((req, res) => categoryController.getById(req, res))
  );

  router.put(
    '/:id',
    validateRequest({ params: categoryIdParamSchema, body: updateCategorySchema }),
    asyncErrorWrapper((req, res) => categoryController.update(req, res))
  );

  router.delete(
    '/:id',
    validateRequest({ params: categoryIdParamSchema }),
    asyncErrorWrapper((req, res) => categoryController.delete(req, res))
  );

  return router;
}

export const categoryRoutes = createCategoryRouter();

