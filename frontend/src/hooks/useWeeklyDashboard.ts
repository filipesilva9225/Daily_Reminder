import { useCallback, useEffect, useMemo, useState } from 'react';
import { analyticsService } from '../services/analyticsService';
import { categoryService } from '../services/categoryService';
import { routineService } from '../services/routineService';
import { taskService } from '../services/taskService';
import {
  Category,
  RoutineExecutionStatus,
  Task,
  TaskStatus,
  WeeklyAnalyticsResult,
} from '../types/api.types';
import { getTodayISO } from '../utils/dateHelpers';

export function useWeeklyDashboard(weekStartsOn = 1) {
  const [referenceDate, setReferenceDate] = useState<string>(() =>
    getTodayISO()
  );
  const [selectedDayDate, setSelectedDayDate] = useState<string>(() =>
    getTodayISO()
  );
  const [analytics, setAnalytics] = useState<WeeklyAnalyticsResult | null>(
    null
  );
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Busca paralela com Promise.all (react-best-practices: async-parallel)
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [weeklyData, overdueData, categoryList] = await Promise.all([
        analyticsService.getWeekly({ date: referenceDate, weekStartsOn }),
        taskService.listOverdue(),
        categoryService.list(),
      ]);

      setAnalytics(weeklyData);
      setOverdueTasks(overdueData);
      setCategories(categoryList);

      // Garantir que o dia selecionado esteja dentro da semana exibida
      const dayExistsInWeek = weeklyData.dailySchedule.some(
        (d) => d.date === selectedDayDate
      );
      if (!dayExistsInWeek && weeklyData.dailySchedule.length > 0) {
        const todayStr = getTodayISO();
        const hasToday = weeklyData.dailySchedule.some(
          (d) => d.date === todayStr
        );
        setSelectedDayDate(
          hasToday ? todayStr : weeklyData.dailySchedule[0].date
        );
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Falha ao carregar os dados da semana.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, [referenceDate, selectedDayDate, weekStartsOn]);

  useEffect(() => {
    void fetchDashboardData();
  }, [fetchDashboardData]);

  // Mapa O(1) de categorias por ID (react-best-practices: js-index-maps)
  const categoryMap = useMemo(() => {
    return new Map<string, Category>(categories.map((cat) => [cat.id, cat]));
  }, [categories]);

  const toggleScheduledItemStatus = useCallback(
    async (
      itemId: string,
      type: 'TASK' | 'ROUTINE',
      currentStatus: TaskStatus
    ) => {
      const nextStatus =
        currentStatus === 'COMPLETED' ? 'PENDING' : 'COMPLETED';

      if (type === 'TASK') {
        await taskService.updateStatus(itemId, nextStatus);
      } else {
        await routineService.updateExecutionStatus(
          itemId,
          nextStatus as RoutineExecutionStatus
        );
      }
      await fetchDashboardData();
    },
    [fetchDashboardData]
  );

  const resolveOverdueTask = useCallback(
    async (
      taskId: string,
      action:
        | { type: 'COMPLETE' }
        | { type: 'NOT_DONE' }
        | {
            type: 'RESCHEDULE';
            scheduledDate: string;
            startTime?: string | null;
            endTime?: string | null;
          }
    ) => {
      if (action.type === 'COMPLETE') {
        await taskService.updateStatus(taskId, 'COMPLETED');
      } else if (action.type === 'NOT_DONE') {
        await taskService.updateStatus(taskId, 'NOT_DONE');
      } else {
        await taskService.reschedule(taskId, {
          scheduledDate: action.scheduledDate,
          startTime: action.startTime ?? null,
          endTime: action.endTime ?? null,
        });
      }
      await fetchDashboardData();
    },
    [fetchDashboardData]
  );

  return {
    referenceDate,
    setReferenceDate,
    selectedDayDate,
    setSelectedDayDate,
    analytics,
    overdueTasks,
    categories,
    categoryMap,
    isLoading,
    error,
    refresh: fetchDashboardData,
    toggleScheduledItemStatus,
    resolveOverdueTask,
  };
}

