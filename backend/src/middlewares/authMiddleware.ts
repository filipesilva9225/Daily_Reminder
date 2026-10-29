import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { unifiedConfig } from '../config/unifiedConfig';
import { UnauthorizedError } from '../utils/errors';

interface JwtPayload {
  sub: string;
  email: string;
}

export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(new UnauthorizedError('Token de autenticação ausente ou malformado'));
  }

  const token = authHeader.slice(7).trim();

  try {
    const decoded = jwt.verify(token, unifiedConfig.auth.jwtSecret) as JwtPayload;
    req.user = {
      id: decoded.sub,
      email: decoded.email,
    };
    next();
  } catch {
    next(new UnauthorizedError('Token inválido ou expirado'));
  }
}

