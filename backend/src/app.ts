import './instrument';
import cors from 'cors';
import express, { Express } from 'express';
import helmet from 'helmet';
import { unifiedConfig } from './config/unifiedConfig';
import { AnalyticsController } from './controllers/AnalyticsController';
import { AuthController } from './controllers/AuthController';
import { CategoryController } from './controllers/CategoryController';
import { PushController } from './controllers/PushController';
import { RoutineController } from './controllers/RoutineController';
import { TaskController } from './controllers/TaskController';
import { errorMiddleware } from './middlewares/errorMiddleware';
import {
  analyticsRoutes,
  createAnalyticsRouter,
} from './routes/analyticsRoutes';
import { authRoutes, createAuthRouter } from './routes/authRoutes';
import { categoryRoutes, createCategoryRouter } from './routes/categoryRoutes';
import { createPushRouter, pushRoutes } from './routes/pushRoutes';
import { createRoutineRouter, routineRoutes } from './routes/routineRoutes';
import { createTaskRouter, taskRoutes } from './routes/taskRoutes';
import { NotFoundError } from './utils/errors';

export interface AppDependencies {
  authController?: AuthController;
  categoryController?: CategoryController;
  routineController?: RoutineController;
  taskController?: TaskController;
  analyticsController?: AnalyticsController;
  pushController?: PushController;
}

export function createApp(deps?: AppDependencies): Express {
  const app = express();

  app.use(helmet());

  const allowedOrigins = unifiedConfig.server.corsOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/$/, ''))
    .filter((o) => Boolean(o) && o !== '*');

  const isDevOrTest = unifiedConfig.env !== 'production';

  app.use(
    cors({
      origin: (origin, callback) => {
        if (!origin) {
          callback(null, true);
          return;
        }

        const normalizedOrigin = origin.replace(/\/$/, '');
        const isExplicitlyAllowed = allowedOrigins.includes(normalizedOrigin);
        const isLocalDevOrigin =
          isDevOrTest &&
          /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(normalizedOrigin);

        if (isExplicitlyAllowed || isLocalDevOrigin) {
          callback(null, true);
        } else {
          callback(new Error(`Origin ${origin} não permitida por CORS`));
        }
      },
      credentials: true,
    })
  );
  app.use(express.json());

  app.get('/api/health', (_req, res) => {
    res.status(200).json({
      success: true,
      data: {
        status: 'ok',
        environment: unifiedConfig.env,
        timestamp: new Date().toISOString(),
      },
    });
  });

  app.use(
    '/api/auth',
    deps?.authController ? createAuthRouter(deps.authController) : authRoutes
  );
  app.use(
    '/api/categories',
    deps?.categoryController
      ? createCategoryRouter(deps.categoryController)
      : categoryRoutes
  );
  app.use(
    '/api/routines',
    deps?.routineController
      ? createRoutineRouter(deps.routineController)
      : routineRoutes
  );
  app.use(
    '/api/tasks',
    deps?.taskController ? createTaskRouter(deps.taskController) : taskRoutes
  );
  app.use(
    '/api/analytics',
    deps?.analyticsController
      ? createAnalyticsRouter(deps.analyticsController)
      : analyticsRoutes
  );
  app.use(
    '/api/push',
    deps?.pushController ? createPushRouter(deps.pushController) : pushRoutes
  );

  app.use((_req, _res, next) => {
    next(new NotFoundError('Rota não encontrada'));
  });

  app.use(errorMiddleware);

  return app;
}

export const app = createApp();
