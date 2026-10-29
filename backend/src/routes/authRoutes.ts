import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middlewares/authMiddleware';
import { validateRequest } from '../middlewares/validateMiddleware';
import { UserRepository } from '../repositories/UserRepository';
import {
  loginSchema,
  registerSchema,
  updatePreferencesSchema,
} from '../schemas/auth.schema';
import { AuthService } from '../services/authService';
import { asyncErrorWrapper } from '../utils/asyncErrorWrapper';

export function createAuthRouter(controller?: AuthController): Router {
  const router = Router();
  const authController =
    controller ?? new AuthController(new AuthService(new UserRepository()));

  router.post(
    '/register',
    validateRequest({ body: registerSchema }),
    asyncErrorWrapper((req, res) => authController.register(req, res))
  );

  router.post(
    '/login',
    validateRequest({ body: loginSchema }),
    asyncErrorWrapper((req, res) => authController.login(req, res))
  );

  router.get(
    '/me',
    authMiddleware,
    asyncErrorWrapper((req, res) => authController.me(req, res))
  );

  router.patch(
    '/preferences',
    authMiddleware,
    validateRequest({ body: updatePreferencesSchema }),
    asyncErrorWrapper((req, res) => authController.updatePreferences(req, res))
  );

  return router;
}

export const authRoutes = createAuthRouter();

