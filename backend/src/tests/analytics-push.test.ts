import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { unifiedConfig } from '../config/unifiedConfig';
import { AnalyticsController } from '../controllers/AnalyticsController';
import { PushController } from '../controllers/PushController';
import {
  Category,
  NewRoutineActivity,
  NewRoutineExecution,
  NewTask,
  RoutineActivity,
  RoutineExecution,
  Task,
} from '../db/schema';
import { CategoryRepository } from '../repositories/CategoryRepository';
import {
  NewPushSubscriptionRecord,
  PushSubscriptionRecord,
  PushSubscriptionRepository,
} from '../repositories/PushSubscriptionRepository';
import {
  RoutineExecutionWithActivity,
  RoutineRepository,
} from '../repositories/RoutineRepository';
import { TaskRepository } from '../repositories/TaskRepository';
import { ListTasksQuery } from '../schemas/task.schema';
import { AnalyticsService } from '../services/analyticsService';
import { PushService } from '../services/pushService';
import { RoutineService } from '../services/routineService';
import { TaskService } from '../services/taskService';

class StubCategoryRepository extends CategoryRepository {
  override async findAllByUser(userId: string): Promise<Category[]> {
    return [
      {
        id: '11111111-1111-4111-8111-111111111111',
        userId,
        name: 'Trabalho',
        colorHex: '#2563EB',
        icon: 'briefcase',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];
  }
}

class StubTaskRepository extends TaskRepository {
  public tasks: Task[] = [];
  private seq = 1;

  override async create(data: NewTask): Promise<Task> {
    const t: Task = {
      id: `40000000-0000-4000-8000-${String(this.seq++).padStart(12, '0')}`,
      userId: data.userId,
      categoryId: data.categoryId ?? null,
      title: data.title,
      description: data.description ?? null,
      scheduledDate: data.scheduledDate,
      originalScheduledDate: data.originalScheduledDate,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      priority: data.priority ?? 'MEDIUM',
      status: data.status ?? 'PENDING',
      rescheduledCount: data.rescheduledCount ?? 0,
      reminderMinutesBefore: null,
      reminderSent: false,
      completedAt: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.tasks.push(t);
    return t;
  }

  override async markPastPendingAsOverdue(): Promise<number> {
    return 0;
  }

  override async findManyByUser(
    userId: string,
    filters: ListTasksQuery
  ): Promise<Task[]> {
    return this.tasks.filter(
      (t) =>
        t.userId === userId &&
        (!filters.startDate || t.scheduledDate >= filters.startDate) &&
        (!filters.endDate || t.scheduledDate <= filters.endDate)
    );
  }

  override async findOverdueByUser(userId: string): Promise<Task[]> {
    return this.tasks.filter(
      (t) => t.userId === userId && t.status === 'OVERDUE'
    );
  }
}

class StubRoutineRepository extends RoutineRepository {
  public routines: RoutineActivity[] = [];
  public executions: RoutineExecution[] = [];

  override async findAllByUser(
    userId: string,
    onlyActive = false
  ): Promise<RoutineActivity[]> {
    return this.routines.filter(
      (r) => r.userId === userId && (!onlyActive || r.active)
    );
  }

  override async expirePastWeekPendingExecutions(): Promise<RoutineExecution[]> {
    return [];
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
    const exec: RoutineExecution = {
      id: `50000000-0000-4000-8000-${String(this.executions.length + 1).padStart(12, '0')}`,
      routineId: data.routineId,
      userId: data.userId,
      weekStartDate: data.weekStartDate,
      scheduledDate: data.scheduledDate,
      status: data.status ?? 'PENDING',
      completedAt: null,
      reminderSent: false,
      createdAt: new Date(),
    };
    this.executions.push(exec);
    return exec;
  }

  override async createRoutine(
    data: NewRoutineActivity
  ): Promise<RoutineActivity> {
    const r: RoutineActivity = {
      id: '60000000-0000-4000-8000-000000000001',
      userId: data.userId,
      categoryId: data.categoryId ?? null,
      title: data.title,
      description: null,
      daysOfWeek: data.daysOfWeek,
      startTime: data.startTime ?? null,
      endTime: data.endTime ?? null,
      reminderMinutesBefore: null,
      currentStreak: data.currentStreak ?? 3,
      bestStreak: data.bestStreak ?? 5,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.routines.push(r);
    return r;
  }
}

class StubPushSubscriptionRepository extends PushSubscriptionRepository {
  private subs: PushSubscriptionRecord[] = [];
  private seq = 1;

  override async create(
    data: NewPushSubscriptionRecord
  ): Promise<PushSubscriptionRecord> {
    const created: PushSubscriptionRecord = {
      id: `70000000-0000-4000-8000-${String(this.seq++).padStart(12, '0')}`,
      userId: data.userId,
      endpoint: data.endpoint,
      p256dh: data.p256dh,
      auth: data.auth,
      createdAt: new Date(),
    };
    this.subs.push(created);
    return created;
  }

  override async findAllByUser(
    userId: string
  ): Promise<PushSubscriptionRecord[]> {
    return this.subs.filter((s) => s.userId === userId);
  }

  override async deleteByIdAndUser(
    id: string,
    userId: string
  ): Promise<boolean> {
    const before = this.subs.length;
    this.subs = this.subs.filter((s) => !(s.id === id && s.userId === userId));
    return this.subs.length < before;
  }
}

describe('Analytics & Push Module (Etapa 3)', () => {
  const userAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  let tokenA: string;
  let taskRepo: StubTaskRepository;
  let routineRepo: StubRoutineRepository;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    tokenA = jwt.sign({ email: 'a@example.com' }, unifiedConfig.auth.jwtSecret, {
      subject: userAId,
    });

    taskRepo = new StubTaskRepository();
    routineRepo = new StubRoutineRepository();
    const categoryRepo = new StubCategoryRepository();
    const pushRepo = new StubPushSubscriptionRepository();

    const taskService = new TaskService(taskRepo);
    const routineService = new RoutineService(routineRepo);
    const analyticsService = new AnalyticsService(
      taskService,
      routineService,
      categoryRepo
    );
    const pushService = new PushService(pushRepo);

    app = createApp({
      analyticsController: new AnalyticsController(analyticsService),
      pushController: new PushController(pushService),
    });
  });

  it('deve calcular estatísticas semanais, progresso por categoria, streaks e detectar conflitos de horário no dia', async () => {
    const categoryId = '11111111-1111-4111-8111-111111111111';

    // Duas tarefas na segunda-feira 2099-11-02 que conflitam no horário (09:00-10:00 e 09:30-10:30)
    await taskRepo.create({
      userId: userAId,
      categoryId,
      title: 'Daily Scrum',
      scheduledDate: '2099-11-02',
      originalScheduledDate: '2099-11-02',
      startTime: '09:00',
      endTime: '10:00',
      status: 'COMPLETED',
    });

    await taskRepo.create({
      userId: userAId,
      categoryId,
      title: 'Revisão de Arquitetura',
      scheduledDate: '2099-11-02',
      originalScheduledDate: '2099-10-25',
      startTime: '09:30',
      endTime: '10:30',
      status: 'PENDING',
      rescheduledCount: 1,
    });

    // Tarefa atrasada de semana anterior aguardando decisão
    await taskRepo.create({
      userId: userAId,
      categoryId,
      title: 'Tarefa Atrasada Pendente de Decisão',
      scheduledDate: '2020-05-01',
      originalScheduledDate: '2020-05-01',
      status: 'OVERDUE',
    });

    const res = await request(app)
      .get('/api/analytics/weekly?date=2099-11-02')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(res.status).toBe(200);
    expect(res.body.data.summary.totalPlanned).toBe(2);
    expect(res.body.data.summary.completedCount).toBe(1);
    expect(res.body.data.summary.completionRate).toBe(50);
    expect(res.body.data.summary.overdueTasksCount).toBe(1);
    expect(res.body.data.summary.rescheduledTasksCount).toBe(1);

    // Verificar estatísticas por categoria
    expect(res.body.data.byCategory).toHaveLength(1);
    expect(res.body.data.byCategory[0].name).toBe('Trabalho');
    expect(res.body.data.byCategory[0].completionRate).toBe(50);

    // Verificar conflito de horário detectado na segunda-feira (2099-11-02)
    const monday = res.body.data.dailySchedule.find(
      (d: { date: string }) => d.date === '2099-11-02'
    );
    expect(monday.timedItems).toHaveLength(2);
    expect(monday.timedItems[0].hasTimeConflict).toBe(true);
    expect(monday.timedItems[1].hasTimeConflict).toBe(true);
  });

  it('deve registrar, listar e remover inscrição de Web Push para lembretes', async () => {
    const subRes = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        endpoint: 'https://fcm.googleapis.com/fcm/send/fake-endpoint-123',
        keys: {
          p256dh: 'fake-p256dh-key',
          auth: 'fake-auth-key',
        },
      });

    expect(subRes.status).toBe(201);
    const subId = subRes.body.data.id as string;

    const listRes = await request(app)
      .get('/api/push/subscriptions')
      .set('Authorization', `Bearer ${tokenA}`);
    expect(listRes.status).toBe(200);
    expect(listRes.body.data).toHaveLength(1);

    const delRes = await request(app)
      .delete(`/api/push/subscriptions/${subId}`)
      .set('Authorization', `Bearer ${tokenA}`);
    expect(delRes.status).toBe(204);
  });
});

