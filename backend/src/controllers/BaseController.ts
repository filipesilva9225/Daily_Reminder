import { Request, Response } from 'express';
import { ZodError } from 'zod';
import { Sentry } from '../instrument';
import { AppError, UnauthorizedError } from '../utils/errors';

export abstract class BaseController {
  protected getAuthenticatedUserId(req: Request): string {
    if (!req.user?.id) {
      throw new UnauthorizedError('Usuário não autenticado');
    }
    return req.user.id;
  }

  protected handleSuccess<T>(res: Response, data: T, statusCode = 200): void {
    res.status(statusCode).json({
      success: true,
      data,
    });
  }

  protected handleCreated<T>(res: Response, data: T): void {
    this.handleSuccess(res, data, 201);
  }

  protected handleNoContent(res: Response): void {
    res.status(204).send();
  }

  protected handleError(error: unknown, res: Response, context: string): void {
    if (error instanceof ZodError) {
      res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Dados de entrada inválidos',
          details: error.flatten().fieldErrors,
        },
      });
      return;
    }

    if (error instanceof AppError) {
      if (error.statusCode >= 500) {
        Sentry.captureException(error, { extra: { context } });
      }
      res.status(error.statusCode).json({
        success: false,
        error: {
          code: error.code,
          message: error.message,
          ...(error.details ? { details: error.details } : {}),
        },
      });
      return;
    }

    Sentry.captureException(error, { extra: { context } });
    res.status(500).json({
      success: false,
      error: {
        code: 'INTERNAL_SERVER_ERROR',
        message: 'Erro interno ao processar a solicitação',
      },
    });
  }
}

