import { and, asc, eq, gte, lt, lte, or } from 'drizzle-orm';
import { db, DatabaseClient } from '../db';
import { categories, NewTask, Task, tasks } from '../db/schema';
import { ListTasksQuery } from '../schemas/task.schema';

export class TaskRepository {
  constructor(private readonly database: DatabaseClient = db) {}

  async create(data: NewTask): Promise<Task> {
    const [created] = await this.database.insert(tasks).values(data).returning();
    return created;
  }

  async findByIdAndUser(id: string, userId: string): Promise<Task | undefined> {
    return this.database.query.tasks.findFirst({
      where: and(eq(tasks.id, id), eq(tasks.userId, userId)),
      with: {
        category: true,
      },
    });
  }

  async findCategoryByIdAndUser(
    categoryId: string,
    userId: string
  ): Promise<{ id: string } | undefined> {
    return this.database.query.categories.findFirst({
      where: and(eq(categories.id, categoryId), eq(categories.userId, userId)),
      columns: { id: true },
    });
  }

  async markPastPendingAsOverdue(userId: string, todayDate: string): Promise<number> {
    const updated = await this.database
      .update(tasks)
      .set({
        status: 'OVERDUE',
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(tasks.userId, userId),
          eq(tasks.status, 'PENDING'),
          lt(tasks.scheduledDate, todayDate)
        )
      )
      .returning({ id: tasks.id });

    return updated.length;
  }

  async findManyByUser(userId: string, filters: ListTasksQuery): Promise<Task[]> {
    const conditions = [eq(tasks.userId, userId)];

    if (filters.status) {
      conditions.push(eq(tasks.status, filters.status));
    }

    if (filters.priority) {
      conditions.push(eq(tasks.priority, filters.priority));
    }

    if (filters.categoryId) {
      conditions.push(eq(tasks.categoryId, filters.categoryId));
    }

    if (filters.startDate && filters.endDate) {
      if (filters.includeOverdue) {
        const rangeOrOverdue = or(
          and(
            gte(tasks.scheduledDate, filters.startDate),
            lte(tasks.scheduledDate, filters.endDate)
          ),
          eq(tasks.status, 'OVERDUE')
        );
        if (rangeOrOverdue) {
          conditions.push(rangeOrOverdue);
        }
      } else {
        conditions.push(gte(tasks.scheduledDate, filters.startDate));
        conditions.push(lte(tasks.scheduledDate, filters.endDate));
      }
    } else if (filters.startDate) {
      conditions.push(gte(tasks.scheduledDate, filters.startDate));
    } else if (filters.endDate) {
      conditions.push(lte(tasks.scheduledDate, filters.endDate));
    }

    return this.database.query.tasks.findMany({
      where: and(...conditions),
      with: {
        category: true,
      },
      orderBy: [asc(tasks.scheduledDate), asc(tasks.startTime), asc(tasks.createdAt)],
    });
  }

  async findOverdueByUser(userId: string): Promise<Task[]> {
    return this.database.query.tasks.findMany({
      where: and(eq(tasks.userId, userId), eq(tasks.status, 'OVERDUE')),
      with: {
        category: true,
      },
      orderBy: [asc(tasks.scheduledDate), asc(tasks.startTime)],
    });
  }

  async updateByIdAndUser(
    id: string,
    userId: string,
    data: Partial<NewTask>
  ): Promise<Task | undefined> {
    const [updated] = await this.database
      .update(tasks)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning();

    return updated;
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(tasks)
      .where(and(eq(tasks.id, id), eq(tasks.userId, userId)))
      .returning({ id: tasks.id });

    return deleted.length > 0;
  }
}

