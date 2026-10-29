import { CategoryRepository } from '../repositories/CategoryRepository';
import { WeeklyAnalyticsQuery } from '../schemas/analytics.schema';
import { formatDateUTC, getWeekRange } from '../utils/dateUtils';
import { RoutineService } from './routineService';
import { TaskService } from './taskService';

export interface UnifiedScheduleItem {
  id: string;
  type: 'TASK' | 'ROUTINE';
  title: string;
  scheduledDate: string;
  startTime: string | null;
  endTime: string | null;
  status: 'PENDING' | 'OVERDUE' | 'COMPLETED' | 'NOT_DONE';
  categoryId: string | null;
  hasTimeConflict: boolean;
}

export interface CategoryProgressStat {
  categoryId: string | null;
  name: string;
  colorHex: string;
  total: number;
  completed: number;
  notDone: number;
  pending: number;
  completionRate: number;
}

export interface WeeklyAnalyticsResult {
  weekStartDate: string;
  weekEndDate: string;
  summary: {
    totalPlanned: number;
    completedCount: number;
    notDoneCount: number;
    pendingCount: number;
    overdueTasksCount: number;
    rescheduledTasksCount: number;
    completionRate: number;
  };
  byCategory: CategoryProgressStat[];
  streaks: Array<{
    routineId: string;
    title: string;
    currentStreak: number;
    bestStreak: number;
  }>;
  dailySchedule: Array<{
    date: string;
    dayOfWeek: number;
    unscheduledItems: UnifiedScheduleItem[];
    timedItems: UnifiedScheduleItem[];
  }>;
}

export class AnalyticsService {
  constructor(
    private readonly taskService: TaskService,
    private readonly routineService: RoutineService,
    private readonly categoryRepository: CategoryRepository
  ) {}

  private hasOverlap(
    startA: string | null,
    endA: string | null,
    startB: string | null,
    endB: string | null
  ): boolean {
    if (!startA || !startB) return false;
    const effectiveEndA = endA ?? startA;
    const effectiveEndB = endB ?? startB;
    if (startA === startB) return true;
    return startA < effectiveEndB && startB < effectiveEndA;
  }

  async getWeeklyAnalytics(
    userId: string,
    query: WeeklyAnalyticsQuery
  ): Promise<WeeklyAnalyticsResult> {
    const todayStr = formatDateUTC(new Date());
    const weekStartsOn = query.weekStartsOn ?? 1;
    const targetWeek = getWeekRange(query.date ?? todayStr, weekStartsOn);

    const [weekTasks, overdueTasks, routineWeek, routines, categories] =
      await Promise.all([
        this.taskService.listTasks(userId, {
          startDate: targetWeek.weekStartDate,
          endDate: targetWeek.weekEndDate,
        }),
        this.taskService.listOverdueTasks(userId),
        this.routineService.reconcileAndGetWeeklySchedule(userId, {
          date: targetWeek.weekStartDate,
          weekStartsOn,
        }),
        this.routineService.listRoutines(userId),
        this.categoryRepository.findAllByUser(userId),
      ]);

    const categoryMap = new Map(
      categories.map((cat) => [
        cat.id,
        { name: cat.name, colorHex: cat.colorHex },
      ])
    );

    const routineMap = new Map(routines.map((r) => [r.id, r]));

    // Unificar itens da semana para estatísticas e grade diária
    const unifiedItems: UnifiedScheduleItem[] = [
      ...weekTasks.map((t) => ({
        id: t.id,
        type: 'TASK' as const,
        title: t.title,
        scheduledDate: t.scheduledDate,
        startTime: t.startTime ?? null,
        endTime: t.endTime ?? null,
        status: t.status,
        categoryId: t.categoryId ?? null,
        hasTimeConflict: false,
      })),
      ...routineWeek.executions.map((exec) => {
        const routine = exec.routine ?? routineMap.get(exec.routineId);
        return {
          id: exec.id,
          type: 'ROUTINE' as const,
          title: routine?.title ?? 'Rotina',
          scheduledDate: exec.scheduledDate,
          startTime: routine?.startTime ?? null,
          endTime: routine?.endTime ?? null,
          status: exec.status,
          categoryId: routine?.categoryId ?? null,
          hasTimeConflict: false,
        };
      }),
    ];

    const totalPlanned = unifiedItems.length;
    const completedCount = unifiedItems.filter(
      (i) => i.status === 'COMPLETED'
    ).length;
    const notDoneCount = unifiedItems.filter(
      (i) => i.status === 'NOT_DONE'
    ).length;
    const pendingCount = unifiedItems.filter(
      (i) => i.status === 'PENDING' || i.status === 'OVERDUE'
    ).length;
    const rescheduledTasksCount = weekTasks.filter(
      (t) => t.rescheduledCount > 0
    ).length;

    const completionRate =
      totalPlanned > 0
        ? Math.round((completedCount / totalPlanned) * 1000) / 10
        : 0;

    // Agrupar por categoria
    const catBuckets = new Map<
      string | null,
      { total: number; completed: number; notDone: number; pending: number }
    >();

    for (const item of unifiedItems) {
      const key = item.categoryId ?? null;
      const bucket = catBuckets.get(key) ?? {
        total: 0,
        completed: 0,
        notDone: 0,
        pending: 0,
      };
      bucket.total += 1;
      if (item.status === 'COMPLETED') bucket.completed += 1;
      else if (item.status === 'NOT_DONE') bucket.notDone += 1;
      else bucket.pending += 1;
      catBuckets.set(key, bucket);
    }

    const byCategory: CategoryProgressStat[] = Array.from(
      catBuckets.entries()
    ).map(([categoryId, stats]) => {
      const catMeta = categoryId ? categoryMap.get(categoryId) : undefined;
      return {
        categoryId,
        name: catMeta?.name ?? 'Sem Categoria',
        colorHex: catMeta?.colorHex ?? '#64748B',
        total: stats.total,
        completed: stats.completed,
        notDone: stats.notDone,
        pending: stats.pending,
        completionRate:
          stats.total > 0
            ? Math.round((stats.completed / stats.total) * 1000) / 10
            : 0,
      };
    });

    // Streaks
    const streaks = routines
      .filter((r) => r.active)
      .sort((a, b) => b.currentStreak - a.currentStreak)
      .map((r) => ({
        routineId: r.id,
        title: r.title,
        currentStreak: r.currentStreak,
        bestStreak: r.bestStreak,
      }));

    // Grade diária com detecção de conflitos de horário
    const dailySchedule = targetWeek.days.map((day) => {
      const dayItems = unifiedItems.filter((i) => i.scheduledDate === day.date);
      const unscheduledItems = dayItems.filter((i) => !i.startTime);
      const timedItems = dayItems
        .filter((i) => Boolean(i.startTime))
        .sort((a, b) => (a.startTime ?? '').localeCompare(b.startTime ?? ''));

      for (let i = 0; i < timedItems.length; i++) {
        for (let j = i + 1; j < timedItems.length; j++) {
          if (
            this.hasOverlap(
              timedItems[i].startTime,
              timedItems[i].endTime,
              timedItems[j].startTime,
              timedItems[j].endTime
            )
          ) {
            timedItems[i].hasTimeConflict = true;
            timedItems[j].hasTimeConflict = true;
          }
        }
      }

      return {
        date: day.date,
        dayOfWeek: day.dayOfWeek,
        unscheduledItems,
        timedItems,
      };
    });

    return {
      weekStartDate: targetWeek.weekStartDate,
      weekEndDate: targetWeek.weekEndDate,
      summary: {
        totalPlanned,
        completedCount,
        notDoneCount,
        pendingCount,
        overdueTasksCount: overdueTasks.length,
        rescheduledTasksCount,
        completionRate,
      },
      byCategory,
      streaks,
      dailySchedule,
    };
  }
}

