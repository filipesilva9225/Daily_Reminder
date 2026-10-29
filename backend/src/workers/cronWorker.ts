import { and, eq, lt } from 'drizzle-orm';
import { db, DatabaseClient } from '../db';
import { routineExecutions, tasks } from '../db/schema';
import { Sentry } from '../instrument';
import { formatDateUTC, getWeekRange } from '../utils/dateUtils';

export class ScheduleReconciliationWorker {
  private timer: NodeJS.Timeout | null = null;

  constructor(private readonly database: DatabaseClient = db) {}

  async runGlobalReconciliation(referenceDate = new Date()): Promise<{
    overdueTasksMarked: number;
    expiredRoutinesMarked: number;
  }> {
    try {
      const todayStr = formatDateUTC(referenceDate);
      const currentWeek = getWeekRange(todayStr, 1);

      const overdueTasks = await this.database
        .update(tasks)
        .set({
          status: 'OVERDUE',
          updatedAt: new Date(),
        })
        .where(
          and(eq(tasks.status, 'PENDING'), lt(tasks.scheduledDate, todayStr))
        )
        .returning({ id: tasks.id });

      const expiredRoutines = await this.database
        .update(routineExecutions)
        .set({
          status: 'NOT_DONE',
        })
        .where(
          and(
            eq(routineExecutions.status, 'PENDING'),
            lt(routineExecutions.scheduledDate, currentWeek.weekStartDate)
          )
        )
        .returning({ id: routineExecutions.id });

      return {
        overdueTasksMarked: overdueTasks.length,
        expiredRoutinesMarked: expiredRoutines.length,
      };
    } catch (error) {
      Sentry.captureException(error, {
        extra: { worker: 'ScheduleReconciliationWorker' },
      });
      throw error;
    }
  }

  start(intervalMs = 60_000): void {
    if (this.timer) return;
    this.timer = setInterval(() => {
      void this.runGlobalReconciliation().catch((error) => {
        Sentry.captureException(error);
      });
    }, intervalMs);
    this.timer.unref();
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }
}

