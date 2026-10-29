import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { unifiedConfig } from '../config/unifiedConfig';
import { CategoryController } from '../controllers/CategoryController';
import { RoutineController } from '../controllers/RoutineController';
import {
  Category,
  NewCategory,
  NewRoutineActivity,
  NewRoutineExecution,
  RoutineActivity,
  RoutineExecution,
} from '../db/schema';
import { CategoryRepository } from '../repositories/CategoryRepository';
import {
  RoutineExecutionWithActivity,
  RoutineRepository,
} from '../repositories/RoutineRepository';
import { CategoryService } from '../services/categoryService';
import { RoutineService } from '../services/routineService';

class InMemoryCategoryRepository extends CategoryRepository {
  private items: Category[] = [];
  private seq = 1;

  override async create(data: NewCategory): Promise<Category> {
    const id = `10000000-0000-4000-8000-${String(this.seq++).padStart(12, '0')}`;
    const created: Category = {
      id,
      userId: data.userId,
      name: data.name,
      colorHex: data.colorHex ?? '#3B82F6',
      icon: data.icon ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(created);
    return created;
  }

  override async findAllByUser(userId: string): Promise<Category[]> {
    return this.items.filter((c) => c.userId === userId);
  }

  override async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<Category | undefined> {
    return this.items.find((c) => c.id === id && c.userId === userId);
  }

  override async updateByIdAndUser(
    id: string,
    userId: string,
    data: Partial<NewCategory>
  ): Promise<Category | undefined> {
    const idx = this.items.findIndex((c) => c.id === id && c.userId === userId);
    if (idx === -1) return undefined;
    this.items[idx] = {
      ...this.items[idx],
      ...data,
      updatedAt: new Date(),
    } as Category;
    return this.items[idx];
  }

  override async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((c) => !(c.id === id && c.userId === userId));
    return this.items.length < before;
  }
}

class InMemoryRoutineRepository extends RoutineRepository {
  private routines: RoutineActivity[] = [];
  public executions: RoutineExecution[] = [];
  private routineSeq = 1;
  private execSeq = 1;

  override async createRoutine(
    data: NewRoutineActivity
  ): Promise<RoutineActivity> {
    const id = `20000000-0000-4000-8000-${String(this.routineSeq++).padStart(12, '0')}`;
    const created: RoutineActivity = {
      id,
      userId: data.userId,
      categoryId: data.categoryId ?? null,
      title: data.title,
      description: data.description ?? null,
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      reminderMinutesBefore: data.reminderMinutesBefore ?? null,
      currentStreak: data.currentStreak ?? 0,
      bestStreak: data.bestStreak ?? 0,
      active: data.active ?? true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.routines.push(created);
    return created;
  }

  override async findAllByUser(
    userId: string,
    onlyActive = false
  ): Promise<RoutineActivity[]> {
    return this.routines.filter(
      (r) => r.userId === userId && (!onlyActive || r.active)
    );
  }

  override async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<RoutineActivity | undefined> {
    return this.routines.find((r) => r.id === id && r.userId === userId);
  }

  override async updateByIdAndUser(
    id: string,
    userId: string,
    data: Partial<NewRoutineActivity>
  ): Promise<RoutineActivity | undefined> {
    const idx = this.routines.findIndex(
      (r) => r.id === id && r.userId === userId
    );
    if (idx === -1) return undefined;
    this.routines[idx] = {
      ...this.routines[idx],
      ...data,
      updatedAt: new Date(),
    } as RoutineActivity;
    return this.routines[idx];
  }

  override async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const before = this.routines.length;
    this.routines = this.routines.filter(
      (r) => !(r.id === id && r.userId === userId)
    );
    return this.routines.length < before;
  }

  override async deleteFuturePendingExecutionsByRoutine(
    routineId: string,
    userId: string,
    fromDate: string
  ): Promise<number> {
    const before = this.executions.length;
    this.executions = this.executions.filter(
      (e) =>
        !(
          e.routineId === routineId &&
          e.userId === userId &&
          e.status === 'PENDING' &&
          e.scheduledDate >= fromDate
        )
    );
    return before - this.executions.length;
  }

  override async expirePastWeekPendingExecutions(
    userId: string,
    currentWeekStartDate: string
  ): Promise<RoutineExecution[]> {
    const expired: RoutineExecution[] = [];
    this.executions = this.executions.map((e) => {
      if (
        e.userId === userId &&
        e.status === 'PENDING' &&
        e.scheduledDate < currentWeekStartDate
      ) {
        const updated: RoutineExecution = { ...e, status: 'NOT_DONE' };
        expired.push(updated);
        return updated;
      }
      return e;
    });
    return expired;
  }

  override async findExecutionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<RoutineExecutionWithActivity[]> {
    return this.executions
      .filter(
        (e) =>
          e.userId === userId &&
          e.scheduledDate >= startDate &&
          e.scheduledDate <= endDate
      )
      .map((e) => ({
        ...e,
        routine: this.routines.find((r) => r.id === e.routineId) ?? null,
      }));
  }

  override async createExecution(
    data: NewRoutineExecution
  ): Promise<RoutineExecution> {
    const id = `30000000-0000-4000-8000-${String(this.execSeq++).padStart(12, '0')}`;
    const created: RoutineExecution = {
      id,
      routineId: data.routineId,
      userId: data.userId,
      weekStartDate: data.weekStartDate,
      scheduledDate: data.scheduledDate,
      status: data.status ?? 'PENDING',
      completedAt: data.completedAt ?? null,
      reminderSent: data.reminderSent ?? false,
      createdAt: new Date(),
    };
    this.executions.push(created);
    return created;
  }

  override async findExecutionByIdAndUser(
    executionId: string,
    userId: string
  ): Promise<RoutineExecution | undefined> {
    return this.executions.find(
      (e) => e.id === executionId && e.userId === userId
    );
  }

  override async updateExecutionStatus(
    executionId: string,
    userId: string,
    status: 'PENDING' | 'COMPLETED' | 'NOT_DONE',
    completedAt: Date | null
  ): Promise<RoutineExecution | undefined> {
    const idx = this.executions.findIndex(
      (e) => e.id === executionId && e.userId === userId
    );
    if (idx === -1) return undefined;
    this.executions[idx] = {
      ...this.executions[idx],
      status,
      completedAt,
    };
    return this.executions[idx];
  }
}

describe('Categories & Routines Module (Etapa 2)', () => {
  const userAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  let tokenA: string;
  let tokenB: string;
  let routineRepo: InMemoryRoutineRepository;
  let routineService: RoutineService;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    tokenA = jwt.sign({ email: 'a@example.com' }, unifiedConfig.auth.jwtSecret, {
      subject: userAId,
    });
    tokenB = jwt.sign({ email: 'b@example.com' }, unifiedConfig.auth.jwtSecret, {
      subject: userBId,
    });

    const categoryRepo = new InMemoryCategoryRepository();
    const categoryService = new CategoryService(categoryRepo);
    const categoryController = new CategoryController(categoryService);

    routineRepo = new InMemoryRoutineRepository();
    routineService = new RoutineService(routineRepo);
    const routineController = new RoutineController(routineService);

    app = createApp({
      categoryController,
      routineController,
    });
  });

  it('deve realizar CRUD de categorias e impedir que outro usuário acesse', async () => {
    const createRes = await request(app)
      .post('/api/categories')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        name: 'Saúde',
        colorHex: '#10B981',
        icon: 'dumbbell',
      });

    expect(createRes.status).toBe(201);
    const categoryId = createRes.body.data.id as string;

    const getByB = await request(app)
      .get(`/api/categories/${categoryId}`)
      .set('Authorization', `Bearer ${tokenB}`);
    expect(getByB.status).toBe(404);
  });

  it('deve criar rotina recorrente, materializar ocorrências semanais, atualizar streak e expirar rotinas não feitas de semanas passadas como NOT_DONE', async () => {
    const createRoutineRes = await request(app)
      .post('/api/routines')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Academia',
        daysOfWeek: [1, 3, 5], // Seg, Qua, Sex
        startTime: '07:00',
        endTime: '08:00',
      });

    expect(createRoutineRes.status).toBe(201);
    const routineId = createRoutineRes.body.data.id as string;

    // Simular execução pendente de semana passada (ex: 2020-01-06)
    const pastExec = await routineRepo.createExecution({
      routineId,
      userId: userAId,
      weekStartDate: '2020-01-06',
      scheduledDate: '2020-01-06',
      status: 'PENDING',
    });

    // Consultar a grade semanal atual
    const weekRes = await request(app)
      .get('/api/routines/week')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(weekRes.status).toBe(200);
    // Deve ter gerado 3 ocorrências para a semana atual (Seg, Qua, Sex)
    expect(weekRes.body.data.executions).toHaveLength(3);

    // E a ocorrência antiga de semana passada deve ter expirado automaticamente como NOT_DONE
    const expiredPastExec = await routineRepo.findExecutionByIdAndUser(
      pastExec.id,
      userAId
    );
    expect(expiredPastExec?.status).toBe('NOT_DONE');

    // Concluir uma ocorrência da semana atual e verificar incremento do streak
    const currentExecId = weekRes.body.data.executions[0].id as string;
    const completeRes = await request(app)
      .patch(`/api/routines/executions/${currentExecId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'COMPLETED' });

    expect(completeRes.status).toBe(200);
    expect(completeRes.body.data.status).toBe('COMPLETED');

    const updatedRoutineRes = await request(app)
      .get(`/api/routines/${routineId}`)
      .set('Authorization', `Bearer ${tokenA}`);

    expect(updatedRoutineRes.body.data.currentStreak).toBe(1);
    expect(updatedRoutineRes.body.data.bestStreak).toBe(1);
  });
});

