import { and, asc, eq, gte, lt, lte } from 'drizzle-orm';
import { db, DatabaseClient } from '../db';
import {
  categories,
  NewRoutineActivity,
  NewRoutineExecution,
  routineActivities,
  RoutineActivity,
  RoutineExecution,
  routineExecutions,
} from '../db/schema';

export type RoutineExecutionWithActivity = RoutineExecution & {
  routine?: RoutineActivity | null;
};

export class RoutineRepository {
  constructor(private readonly database: DatabaseClient = db) {}

  async createRoutine(data: NewRoutineActivity): Promise<RoutineActivity> {
    const [created] = await this.database
      .insert(routineActivities)
      .values(data)
      .returning();
    return created;
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

  async findAllByUser(userId: string, onlyActive = false): Promise<RoutineActivity[]> {
    const conditions = [eq(routineActivities.userId, userId)];
    if (onlyActive) {
      conditions.push(eq(routineActivities.active, true));
    }
    return this.database.query.routineActivities.findMany({
      where: and(...conditions),
      with: {
        category: true,
      },
      orderBy: [asc(routineActivities.startTime), asc(routineActivities.title)],
    });
  }

  async findByIdAndUser(
    id: string,
    userId: string
  ): Promise<RoutineActivity | undefined> {
    return this.database.query.routineActivities.findFirst({
      where: and(
        eq(routineActivities.id, id),
        eq(routineActivities.userId, userId)
      ),
      with: {
        category: true,
      },
    });
  }

  async updateByIdAndUser(
    id: string,
    userId: string,
    data: Partial<NewRoutineActivity>
  ): Promise<RoutineActivity | undefined> {
    const [updated] = await this.database
      .update(routineActivities)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(
        and(eq(routineActivities.id, id), eq(routineActivities.userId, userId))
      )
      .returning();
    return updated;
  }

  async deleteByIdAndUser(id: string, userId: string): Promise<boolean> {
    const deleted = await this.database
      .delete(routineActivities)
      .where(
        and(eq(routineActivities.id, id), eq(routineActivities.userId, userId))
      )
      .returning({ id: routineActivities.id });
    return deleted.length > 0;
  }

  async deleteFuturePendingExecutionsByRoutine(
    routineId: string,
    userId: string,
    fromDate: string
  ): Promise<number> {
    const deleted = await this.database
      .delete(routineExecutions)
      .where(
        and(
          eq(routineExecutions.routineId, routineId),
          eq(routineExecutions.userId, userId),
          eq(routineExecutions.status, 'PENDING'),
          gte(routineExecutions.scheduledDate, fromDate)
        )
      )
      .returning({ id: routineExecutions.id });
    return deleted.length;
  }

  async expirePastWeekPendingExecutions(
    userId: string,
    currentWeekStartDate: string
  ): Promise<RoutineExecution[]> {
    const expired = await this.database
      .update(routineExecutions)
      .set({
        status: 'NOT_DONE',
      })
      .where(
        and(
          eq(routineExecutions.userId, userId),
          eq(routineExecutions.status, 'PENDING'),
          lt(routineExecutions.scheduledDate, currentWeekStartDate)
        )
      )
      .returning();
    return expired;
  }

  async findExecutionsByDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<RoutineExecutionWithActivity[]> {
    return this.database.query.routineExecutions.findMany({
      where: and(
        eq(routineExecutions.userId, userId),
        gte(routineExecutions.scheduledDate, startDate),
        lte(routineExecutions.scheduledDate, endDate)
      ),
      with: {
        routine: {
          with: {
            category: true,
          },
        },
      },
      orderBy: [asc(routineExecutions.scheduledDate)],
    });
  }

  async createExecution(data: NewRoutineExecution): Promise<RoutineExecution> {
    const [created] = await this.database
      .insert(routineExecutions)
      .values(data)
      .returning();
    return created;
  }

  async findExecutionByIdAndUser(
    executionId: string,
    userId: string
  ): Promise<RoutineExecution | undefined> {
    return this.database.query.routineExecutions.findFirst({
      where: and(
        eq(routineExecutions.id, executionId),
        eq(routineExecutions.userId, userId)
      ),
    });
  }

  async updateExecutionStatus(
    executionId: string,
    userId: string,
    status: 'PENDING' | 'COMPLETED' | 'NOT_DONE',
    completedAt: Date | null
  ): Promise<RoutineExecution | undefined> {
    const [updated] = await this.database
      .update(routineExecutions)
      .set({
        status,
        completedAt,
      })
      .where(
        and(
          eq(routineExecutions.id, executionId),
          eq(routineExecutions.userId, userId)
        )
      )
      .returning();
    return updated;
  }
}

