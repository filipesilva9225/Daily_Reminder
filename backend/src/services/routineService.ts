import { RoutineActivity, RoutineExecution } from '../db/schema';
import {
  RoutineExecutionWithActivity,
  RoutineRepository,
} from '../repositories/RoutineRepository';
import {
  CreateRoutineInput,
  UpdateExecutionStatusInput,
  UpdateRoutineInput,
  WeekRoutineQuery,
} from '../schemas/routine.schema';
import { formatDateUTC, getWeekRange } from '../utils/dateUtils';
import { NotFoundError } from '../utils/errors';

export interface WeeklyRoutineScheduleResult {
  weekStartDate: string;
  weekEndDate: string;
  executions: RoutineExecutionWithActivity[];
}

export class RoutineService {
  constructor(private readonly routineRepository: RoutineRepository) {}

  private getTodayDateString(): string {
    return formatDateUTC(new Date());
  }

  private async ensureCategoryBelongsToUser(
    categoryId: string | null | undefined,
    userId: string
  ): Promise<void> {
    if (!categoryId) return;
    const category = await this.routineRepository.findCategoryByIdAndUser(
      categoryId,
      userId
    );
    if (!category) {
      throw new NotFoundError('Categoria não encontrada para este usuário');
    }
  }

  async createRoutine(
    userId: string,
    input: CreateRoutineInput
  ): Promise<RoutineActivity> {
    await this.ensureCategoryBelongsToUser(input.categoryId, userId);

    return this.routineRepository.createRoutine({
      userId,
      categoryId: input.categoryId ?? null,
      title: input.title,
      description: input.description ?? null,
      daysOfWeek: input.daysOfWeek,
      startTime: input.startTime ?? null,
      endTime: input.endTime ?? null,
      reminderMinutesBefore: input.reminderMinutesBefore ?? null,
      active: input.active ?? true,
      currentStreak: 0,
      bestStreak: 0,
    });
  }

  async listRoutines(userId: string): Promise<RoutineActivity[]> {
    return this.routineRepository.findAllByUser(userId);
  }

  async getRoutineById(
    userId: string,
    routineId: string
  ): Promise<RoutineActivity> {
    const routine = await this.routineRepository.findByIdAndUser(
      routineId,
      userId
    );
    if (!routine) {
      throw new NotFoundError('Atividade recorrente não encontrada');
    }
    return routine;
  }

  async updateRoutine(
    userId: string,
    routineId: string,
    input: UpdateRoutineInput
  ): Promise<RoutineActivity> {
    await this.getRoutineById(userId, routineId);
    await this.ensureCategoryBelongsToUser(input.categoryId, userId);

    const updated = await this.routineRepository.updateByIdAndUser(
      routineId,
      userId,
      input
    );
    if (!updated) {
      throw new NotFoundError('Atividade recorrente não encontrada');
    }

    if (input.daysOfWeek !== undefined || input.active === false) {
      const today = this.getTodayDateString();
      await this.routineRepository.deleteFuturePendingExecutionsByRoutine(
        routineId,
        userId,
        today
      );
    }

    return updated;
  }

  async deleteRoutine(userId: string, routineId: string): Promise<void> {
    const deleted = await this.routineRepository.deleteByIdAndUser(
      routineId,
      userId
    );
    if (!deleted) {
      throw new NotFoundError('Atividade recorrente não encontrada');
    }
  }

  async reconcileAndGetWeeklySchedule(
    userId: string,
    query: WeekRoutineQuery,
    referenceTodayOverride?: string
  ): Promise<WeeklyRoutineScheduleResult> {
    const todayStr = referenceTodayOverride ?? this.getTodayDateString();
    const weekStartsOn = query.weekStartsOn ?? 1;
    const currentWeek = getWeekRange(todayStr, weekStartsOn);

    // 1. Expirar ocorrências de semanas anteriores que ficaram PENDING -> NOT_DONE
    const expiredExecutions =
      await this.routineRepository.expirePastWeekPendingExecutions(
        userId,
        currentWeek.weekStartDate
      );

    // Se alguma rotina teve execução expirada na virada de semana, zera o currentStreak
    const expiredRoutineIds = new Set(
      expiredExecutions.map((exec) => exec.routineId)
    );
    for (const routineId of expiredRoutineIds) {
      await this.routineRepository.updateByIdAndUser(routineId, userId, {
        currentStreak: 0,
      });
    }

    // 2. Calcular a semana solicitada
    const targetDateStr = query.date ?? todayStr;
    const targetWeek = getWeekRange(targetDateStr, weekStartsOn);

    // 3. Buscar execuções existentes na semana solicitada
    const existingExecutions =
      await this.routineRepository.findExecutionsByDateRange(
        userId,
        targetWeek.weekStartDate,
        targetWeek.weekEndDate
      );

    // 4. Se a semana solicitada for a semana atual ou futura, materializar ocorrências faltantes
    if (targetWeek.weekStartDate >= currentWeek.weekStartDate) {
      const activeRoutines = await this.routineRepository.findAllByUser(
        userId,
        true
      );
      const existingKeys = new Set(
        existingExecutions.map((e) => `${e.routineId}:${e.scheduledDate}`)
      );

      for (const routine of activeRoutines) {
        for (const day of targetWeek.days) {
          if (routine.daysOfWeek.includes(day.dayOfWeek)) {
            const key = `${routine.id}:${day.date}`;
            if (!existingKeys.has(key)) {
              await this.routineRepository.createExecution({
                routineId: routine.id,
                userId,
                weekStartDate: targetWeek.weekStartDate,
                scheduledDate: day.date,
                status: 'PENDING',
                reminderSent: false,
              });
            }
          }
        }
      }
    }

    const finalExecutions =
      await this.routineRepository.findExecutionsByDateRange(
        userId,
        targetWeek.weekStartDate,
        targetWeek.weekEndDate
      );

    return {
      weekStartDate: targetWeek.weekStartDate,
      weekEndDate: targetWeek.weekEndDate,
      executions: finalExecutions,
    };
  }

  async updateExecutionStatus(
    userId: string,
    executionId: string,
    input: UpdateExecutionStatusInput
  ): Promise<RoutineExecution> {
    const existing = await this.routineRepository.findExecutionByIdAndUser(
      executionId,
      userId
    );
    if (!existing) {
      throw new NotFoundError('Execução de rotina não encontrada');
    }

    const routine = await this.getRoutineById(userId, existing.routineId);
    const completedAt = input.status === 'COMPLETED' ? new Date() : null;

    const updatedExecution = await this.routineRepository.updateExecutionStatus(
      executionId,
      userId,
      input.status,
      completedAt
    );

    if (!updatedExecution) {
      throw new NotFoundError('Execução de rotina não encontrada');
    }

    // Atualizar Streak da atividade recorrente
    if (existing.status !== 'COMPLETED' && input.status === 'COMPLETED') {
      const nextStreak = routine.currentStreak + 1;
      const nextBest = Math.max(routine.bestStreak, nextStreak);
      await this.routineRepository.updateByIdAndUser(routine.id, userId, {
        currentStreak: nextStreak,
        bestStreak: nextBest,
      });
    } else if (input.status === 'NOT_DONE') {
      await this.routineRepository.updateByIdAndUser(routine.id, userId, {
        currentStreak: 0,
      });
    } else if (
      existing.status === 'COMPLETED' &&
      input.status === 'PENDING'
    ) {
      await this.routineRepository.updateByIdAndUser(routine.id, userId, {
        currentStreak: Math.max(0, routine.currentStreak - 1),
      });
    }

    return updatedExecution;
  }
}

