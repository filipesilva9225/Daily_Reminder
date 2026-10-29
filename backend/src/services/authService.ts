import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
import { unifiedConfig } from '../config/unifiedConfig';
import { User } from '../db/schema';
import { UserRepository } from '../repositories/UserRepository';
import {
  LoginInput,
  RegisterInput,
  UpdatePreferencesInput,
} from '../schemas/auth.schema';
import {
  ConflictError,
  NotFoundError,
  UnauthorizedError,
} from '../utils/errors';

export type PublicUser = Omit<User, 'passwordHash'>;

export interface AuthResponse {
  user: PublicUser;
  token: string;
}

export class AuthService {
  constructor(private readonly userRepository: UserRepository) {}

  private sanitizeUser(user: User): PublicUser {
    const { passwordHash: _passwordHash, ...publicUser } = user;
    return publicUser;
  }

  private generateToken(user: User): string {
    const options: SignOptions = {
      subject: user.id,
      expiresIn: unifiedConfig.auth.jwtExpiresIn as SignOptions['expiresIn'],
    };

    return jwt.sign(
      { email: user.email },
      unifiedConfig.auth.jwtSecret,
      options
    );
  }

  async register(input: RegisterInput): Promise<AuthResponse> {
    const existing = await this.userRepository.findByEmail(input.email);
    if (existing) {
      throw new ConflictError('Já existe uma conta cadastrada com este e-mail');
    }

    const passwordHash = await bcrypt.hash(
      input.password,
      unifiedConfig.auth.bcryptSaltRounds
    );

    const createdUser = await this.userRepository.create({
      name: input.name,
      email: input.email,
      passwordHash,
      timezone: input.timezone ?? 'America/Sao_Paulo',
      theme: input.theme ?? 'LIGHT',
      weekStartsOn: input.weekStartsOn ?? 1,
    });

    const token = this.generateToken(createdUser);

    return {
      user: this.sanitizeUser(createdUser),
      token,
    };
  }

  async login(input: LoginInput): Promise<AuthResponse> {
    const user = await this.userRepository.findByEmail(input.email);
    if (!user) {
      throw new UnauthorizedError('E-mail ou senha inválidos');
    }

    const isPasswordValid = await bcrypt.compare(
      input.password,
      user.passwordHash
    );
    if (!isPasswordValid) {
      throw new UnauthorizedError('E-mail ou senha inválidos');
    }

    const token = this.generateToken(user);

    return {
      user: this.sanitizeUser(user),
      token,
    };
  }

  async getProfile(userId: string): Promise<PublicUser> {
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('Usuário não encontrado');
    }
    return this.sanitizeUser(user);
  }

  async updatePreferences(
    userId: string,
    input: UpdatePreferencesInput
  ): Promise<PublicUser> {
    const updated = await this.userRepository.updatePreferences(userId, input);
    if (!updated) {
      throw new NotFoundError('Usuário não encontrado');
    }
    return this.sanitizeUser(updated);
  }
}

