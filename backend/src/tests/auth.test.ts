import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { AuthController } from '../controllers/AuthController';
import { NewUser, User } from '../db/schema';
import { UserRepository } from '../repositories/UserRepository';
import { AuthService } from '../services/authService';

class InMemoryUserRepository extends UserRepository {
  private users: User[] = [];

  override async findByEmail(email: string): Promise<User | undefined> {
    return this.users.find((u) => u.email === email.toLowerCase());
  }

  override async findById(id: string): Promise<User | undefined> {
    return this.users.find((u) => u.id === id);
  }

  override async create(data: NewUser): Promise<User> {
    const newUser: User = {
      id: '11111111-1111-4111-8111-111111111111',
      name: data.name,
      email: data.email.toLowerCase(),
      passwordHash: data.passwordHash,
      timezone: data.timezone ?? 'America/Sao_Paulo',
      theme: data.theme ?? 'LIGHT',
      weekStartsOn: data.weekStartsOn ?? 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.push(newUser);
    return newUser;
  }

  override async updatePreferences(
    userId: string,
    data: Partial<Pick<User, 'name' | 'timezone' | 'theme' | 'weekStartsOn'>>
  ): Promise<User | undefined> {
    const idx = this.users.findIndex((u) => u.id === userId);
    if (idx === -1) return undefined;
    this.users[idx] = {
      ...this.users[idx],
      ...data,
      updatedAt: new Date(),
    };
    return this.users[idx];
  }
}

describe('Auth Module (Unit & Integration - Etapa 1)', () => {
  let userRepo: InMemoryUserRepository;
  let authService: AuthService;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    userRepo = new InMemoryUserRepository();
    authService = new AuthService(userRepo);
    const authController = new AuthController(authService);
    app = createApp({ authController });
  });

  it('deve registrar um novo usuário e retornar token JWT sem expor passwordHash', async () => {
    const res = await request(app).post('/api/auth/register').send({
      name: 'Filipe',
      email: 'filipe@example.com',
      password: 'password123',
      theme: 'DARK',
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.token).toBeDefined();
    expect(res.body.data.user.email).toBe('filipe@example.com');
    expect(res.body.data.user.theme).toBe('DARK');
    expect(res.body.data.user.passwordHash).toBeUndefined();
  });

  it('deve bloquear cadastro com e-mail duplicado (409 Conflict)', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Filipe',
      email: 'filipe@example.com',
      password: 'password123',
    });

    const duplicate = await request(app).post('/api/auth/register').send({
      name: 'Outro',
      email: 'FILIPE@example.com',
      password: 'password123',
    });

    expect(duplicate.status).toBe(409);
    expect(duplicate.body.error.code).toBe('CONFLICT');
  });

  it('deve autenticar usuário no login e permitir consulta em /api/auth/me', async () => {
    await request(app).post('/api/auth/register').send({
      name: 'Filipe',
      email: 'filipe@example.com',
      password: 'password123',
    });

    const loginRes = await request(app).post('/api/auth/login').send({
      email: 'filipe@example.com',
      password: 'password123',
    });

    expect(loginRes.status).toBe(200);
    const token = loginRes.body.data.token as string;

    const meRes = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${token}`);

    expect(meRes.status).toBe(200);
    expect(meRes.body.data.email).toBe('filipe@example.com');
  });

  it('deve rejeitar requisição sem token em rota protegida (401 Unauthorized)', async () => {
    const res = await request(app).get('/api/auth/me');
    expect(res.status).toBe(401);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });
});

