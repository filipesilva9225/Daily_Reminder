import { Request, Response } from 'express';
import {
  loginSchema,
  registerSchema,
  updatePreferencesSchema,
} from '../schemas/auth.schema';
import { AuthService } from '../services/authService';
import { BaseController } from './BaseController';

export class AuthController extends BaseController {
  constructor(private readonly authService: AuthService) {
    super();
  }

  async register(req: Request, res: Response): Promise<void> {
    try {
      const input = registerSchema.parse(req.body);
      const result = await this.authService.register(input);
      this.handleCreated(res, result);
    } catch (error) {
      this.handleError(error, res, 'AuthController.register');
    }
  }

  async login(req: Request, res: Response): Promise<void> {
    try {
      const input = loginSchema.parse(req.body);
      const result = await this.authService.login(input);
      this.handleSuccess(res, result);
    } catch (error) {
      this.handleError(error, res, 'AuthController.login');
    }
  }

  async me(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const profile = await this.authService.getProfile(userId);
      this.handleSuccess(res, profile);
    } catch (error) {
      this.handleError(error, res, 'AuthController.me');
    }
  }

  async updatePreferences(req: Request, res: Response): Promise<void> {
    try {
      const userId = this.getAuthenticatedUserId(req);
      const input = updatePreferencesSchema.parse(req.body);
      const updated = await this.authService.updatePreferences(userId, input);
      this.handleSuccess(res, updated);
    } catch (error) {
      this.handleError(error, res, 'AuthController.updatePreferences');
    }
  }
}

