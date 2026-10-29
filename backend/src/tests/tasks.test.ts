import jwt from 'jsonwebtoken';
import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../app';
import { unifiedConfig } from '../config/unifiedConfig';
import { TaskController } from '../controllers/TaskController';
import { NewTask, Task } from '../db/schema';
import { TaskRepository } from '../repositories/TaskRepository';
import { ListTasksQuery } from '../schemas/task.schema';
import { TaskService } from '../services/taskService';

class InMemoryTaskRepository extends TaskRepository {
  private items: Task[] = [];
  private seq = 1;

  override async create(data: NewTask): Promise<Task> {
    const id = `00000000-0000-4000-8000-${String(this.seq++).padStart(12, '0')}`;
    const created: Task = {
      id,
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
      reminderMinutesBefore: data.reminderMinutesBefore ?? null,
      reminderSent: data.reminderSent ?? false,
      completedAt: data.completedAt ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.items.push(created);
    return created;
  }

  override async findByIdAndUser(id: string, userId: string): Promise<Task | undefined> {
    return this.items.find((t) => t.id === id && t.userId === userId);
  }

  override async markPastPendingAsOverdue(
    userId: string,
    todayDate: string
  ): Promise<number> {
    let count = 0;
    this.items = this.items.map((t) => {
      if (
        t.userId === userId &&
        t.status === 'PENDING' &&
        t.scheduledDate < todayDate
      ) {
        count++;
        return { ...t, status: 'OVERDUE', updatedAt: new Date() };
      }
      return t;
    });
    return count;
  }

  override async findManyByUser(
    userId: string,
    filters: ListTasksQuery
  ): Promise<Task[]> {
    return this.items.filter((t) => {
      if (t.userId !== userId) return false;
      if (filters.status && t.status !== filters.status) return false;
      if (filters.priority && t.priority !== filters.priority) return false;
      if (filters.startDate && filters.endDate) {
        const inRange =
          t.scheduledDate >= filters.startDate &&
          t.scheduledDate <= filters.endDate;
        if (filters.includeOverdue) {
          return inRange || t.status === 'OVERDUE';
        }
        return inRange;
      }
      return true;
    });
  }

  override async findOverdueByUser(userId: string): Promise<Task[]> {
    return this.items.filter(
      (t) => t.userId === userId && t.status === 'OVERDUE'
    );
  }

  override async updateByIdAndUser(
    id: string,
    userId: string,
    data: Partial<NewTask>
  ): Promise<Task | undefined> {
    const idx = this.items.findIndex((t) => t.id === id && t.userId === userId);
    if (idx === -1) return undefined;
    this.items[idx] = {
      ...this.items[idx],
      ...data,
      updatedAt: new Date(),
    } as Task;
    return this.items[idx];
  }

  override async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const before = this.items.length;
    this.items = this.items.filter((t) => !(t.id === id && t.userId === userId));
    return this.items.length < before;
  }
}

describe('Tasks Module (CRUD, Isolamento e Tarefas Atrasadas - Etapa 1)', () => {
  const userAId = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';
  const userBId = 'bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
  let tokenA: string;
  let tokenB: string;
  let app: ReturnType<typeof createApp>;

  beforeEach(() => {
    tokenA = jwt.sign({ email: 'a@example.com' }, unifiedConfig.auth.jwtSecret, {
      subject: userAId,
    });
    tokenB = jwt.sign({ email: 'b@example.com' }, unifiedConfig.auth.jwtSecret, {
      subject: userBId,
    });

    const repo = new InMemoryTaskRepository();
    const service = new TaskService(repo);
    const controller = new TaskController(service);
    app = createApp({ taskController: controller });
  });

  it('deve criar, listar e filtrar tarefas por período e validar horário (endTime > startTime)', async () => {
    const invalidRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Reunião Inválida',
        scheduledDate: '2026-11-10',
        startTime: '15:00',
        endTime: '14:00',
      });

    expect(invalidRes.status).toBe(400);

    const createRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Entregar relatório semanal',
        description: 'Revisar métricas',
        scheduledDate: '2026-11-10',
        startTime: '09:00',
        endTime: '10:30',
        priority: 'HIGH',
      });

    expect(createRes.status).toBe(201);
    expect(createRes.body.data.priority).toBe('HIGH');
    expect(createRes.body.data.status).toBe('PENDING');
  });

  it('deve manter tarefas atrasadas visíveis quando a semana termina e permitir reagendar ou marcar como NOT_DONE', async () => {
    const pastTaskRes = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Pagar boleto da semana passada',
        scheduledDate: '2020-01-05',
        priority: 'HIGH',
      });

    const taskId = pastTaskRes.body.data.id as string;

    const overdueRes = await request(app)
      .get('/api/tasks/overdue')
      .set('Authorization', `Bearer ${tokenA}`);

    expect(overdueRes.status).toBe(200);
    expect(overdueRes.body.data).toHaveLength(1);
    expect(overdueRes.body.data[0].id).toBe(taskId);
    expect(overdueRes.body.data[0].status).toBe('OVERDUE');

    const rescheduleRes = await request(app)
      .post(`/api/tasks/${taskId}/reschedule`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        scheduledDate: '2099-12-31',
        startTime: '14:00',
        endTime: '15:00',
      });

    expect(rescheduleRes.status).toBe(200);
    expect(rescheduleRes.body.data.status).toBe('PENDING');
    expect(rescheduleRes.body.data.rescheduledCount).toBe(1);

    const markNotDoneRes = await request(app)
      .patch(`/api/tasks/${taskId}/status`)
      .set('Authorization', `Bearer ${tokenA}`)
      .send({ status: 'NOT_DONE' });

    expect(markNotDoneRes.status).toBe(200);
    expect(markNotDoneRes.body.data.status).toBe('NOT_DONE');
  });

  it('deve garantir isolamento total de dados entre usuários (Usuário B não acessa tarefa do Usuário A)', async () => {
    const createdByA = await request(app)
      .post('/api/tasks')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        title: 'Tarefa Secreta do Usuário A',
        scheduledDate: '2026-11-15',
      });

    const taskId = createdByA.body.data.id as string;

    const getByB = await request(app)
      .get(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(getByB.status).toBe(404);

    const deleteByB = await request(app)
      .delete(`/api/tasks/${taskId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteByB.status).toBe(404);
  });
});

