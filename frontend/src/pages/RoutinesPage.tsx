import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Flame,
  Loader2,
  Palette,
  Plus,
  Repeat,
  Trash2,
  XCircle,
} from 'lucide-react';
import { CategoryManagerModal } from '../components/categories/CategoryManagerModal';
import { RoutineFormModal } from '../components/forms/RoutineFormModal';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { categoryService } from '../services/categoryService';
import { routineService } from '../services/routineService';
import {
  Category,
  RoutineActivity,
  RoutineExecution,
  RoutineExecutionStatus,
} from '../types/api.types';
import {
  formatShortDateBR,
  WEEKDAY_SHORT_LABELS,
} from '../utils/dateHelpers';

export const RoutinesPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [routines, setRoutines] = useState<RoutineActivity[]>([]);
  const [weeklyExecutions, setWeeklyExecutions] = useState<RoutineExecution[]>(
    []
  );
  const [weekRange, setWeekRange] = useState<{
    start: string;
    end: string;
  } | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [isRoutineModalOpen, setIsRoutineModalOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<RoutineActivity | null>(
    null
  );
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(
    () =>
      typeof Notification !== 'undefined' &&
      Notification.permission === 'granted'
  );

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [routineList, weeklySchedule, categoryList] = await Promise.all([
        routineService.list(),
        routineService.getWeeklySchedule({
          weekStartsOn: user?.weekStartsOn ?? 1,
        }),
        categoryService.list(),
      ]);

      setRoutines(routineList);
      setWeeklyExecutions(weeklySchedule.executions);
      setWeekRange({
        start: weeklySchedule.weekStartDate,
        end: weeklySchedule.weekEndDate,
      });
      setCategories(categoryList);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar rotinas.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [showToast, user?.weekStartsOn]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const categoryMap = useMemo(() => {
    return new Map<string, Category>(categories.map((c) => [c.id, c]));
  }, [categories]);

  const executionsByRoutineMap = useMemo(() => {
    const map = new Map<string, RoutineExecution[]>();
    for (const exec of weeklyExecutions) {
      const list = map.get(exec.routineId) ?? [];
      list.push(exec);
      map.set(exec.routineId, list);
    }
    return map;
  }, [weeklyExecutions]);

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') {
      showToast(
        'Seu navegador não suporta notificações nativas.',
        'warning'
      );
      return;
    }

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      setNotificationsEnabled(true);
      showToast('Lembretes no navegador ativados com sucesso!', 'success');
    } else {
      showToast(
        'Permissão de notificação negada nas configurações do navegador.',
        'warning'
      );
    }
  };

  const handleSaveRoutine = async (payload: {
    title: string;
    description: string | null;
    categoryId: string | null;
    daysOfWeek: number[];
    startTime: string | null;
    endTime: string | null;
    active: boolean;
  }) => {
    try {
      if (editingRoutine) {
        await routineService.update(editingRoutine.id, payload);
        showToast('Rotina atualizada com sucesso!', 'success');
      } else {
        await routineService.create(payload);
        showToast('Rotina recorrente criada com sucesso!', 'success');
      }
      await fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Falha ao salvar rotina.',
        'error'
      );
      throw err;
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      await routineService.remove(id);
      showToast('Rotina excluída.', 'success');
      await fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao excluir rotina.',
        'error'
      );
    }
  };

  const handleUpdateExecutionStatus = async (
    executionId: string,
    status: RoutineExecutionStatus
  ) => {
    try {
      await routineService.updateExecutionStatus(executionId, status);
      showToast('Execução da rotina atualizada!', 'success');
      await fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao atualizar execução.',
        'error'
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Rotinas Recorrentes & Hábitos
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Atividades fixas por dia da semana. Ocorrências não realizadas expiram automaticamente ao fim da semana.
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <button
            type="button"
            onClick={() => void handleRequestNotifications()}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border text-xs font-semibold transition-colors ${
              notificationsEnabled
                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-300'
                : 'border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200'
            }`}
          >
            <Bell className="w-4 h-4" />
            <span>
              {notificationsEnabled ? 'Lembretes Ativos' : 'Ativar Lembretes'}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setIsCategoryModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-xs font-semibold text-slate-200 transition-colors"
          >
            <Palette className="w-4 h-4 text-indigo-400" />
            <span>Categorias</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setEditingRoutine(null);
              setIsRoutineModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Rotina</span>
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          <span className="text-xs">Carregando rotinas recorrentes...</span>
        </div>
      ) : routines.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <Repeat className="w-8 h-8 text-indigo-400 mx-auto" />
          <p className="text-sm font-medium text-slate-300">
            Você ainda não configurou nenhuma atividade recorrente.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingRoutine(null);
              setIsRoutineModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeira rotina semanal</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {routines.map((routine) => {
            const category = routine.categoryId
              ? categoryMap.get(routine.categoryId)
              : undefined;
            const executions = executionsByRoutineMap.get(routine.id) ?? [];

            return (
              <div
                key={routine.id}
                className={`rounded-2xl border p-5 flex flex-col justify-between gap-4 transition-all ${
                  routine.active
                    ? 'border-slate-800/80 bg-slate-900/70'
                    : 'border-slate-800/40 bg-slate-900/30 opacity-65'
                }`}
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white">
                          {routine.title}
                        </h3>
                        {category ? (
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                            style={{
                              backgroundColor: `${category.colorHex}20`,
                              color: category.colorHex,
                            }}
                          >
                            {category.name}
                          </span>
                        ) : null}
                        {!routine.active ? (
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-400">
                            Pausada
                          </span>
                        ) : null}
                      </div>

                      {routine.description ? (
                        <p className="text-xs text-slate-400">
                          {routine.description}
                        </p>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingRoutine(routine);
                          setIsRoutineModalOpen(true);
                        }}
                        className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                        title="Editar rotina"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => void handleDeleteRoutine(routine.id)}
                        className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:border-rose-900/60 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Excluir rotina"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Dias da semana e Horário */}
                  <div className="flex items-center justify-between gap-3 flex-wrap pt-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      {routine.daysOfWeek.map((day) => (
                        <span
                          key={day}
                          className="px-2 py-0.5 rounded-lg bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[11px] font-semibold"
                        >
                          {WEEKDAY_SHORT_LABELS[day]}
                        </span>
                      ))}
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-400">
                      {routine.startTime ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          {routine.startTime}
                          {routine.endTime ? `–${routine.endTime}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">Sem hora fixa</span>
                      )}

                      <span className="inline-flex items-center gap-1 text-orange-400 font-semibold">
                        <Flame className="w-3.5 h-3.5" />
                        Streak: {routine.currentStreak} (Máx:{' '}
                        {routine.bestStreak})
                      </span>
                    </div>
                  </div>
                </div>

                {/* Ocorrências da Semana Atual */}
                {executions.length > 0 ? (
                  <div className="border-t border-slate-800/80 pt-3 space-y-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block">
                      Execuções nesta semana (
                      {weekRange
                        ? `${formatShortDateBR(weekRange.start)} – ${formatShortDateBR(weekRange.end)}`
                        : 'Semana atual'}
                      )
                    </span>
                    <div className="flex items-center gap-2 flex-wrap">
                      {executions.map((exec) => {
                        const isCompleted = exec.status === 'COMPLETED';
                        const isNotDone = exec.status === 'NOT_DONE';

                        return (
                          <div
                            key={exec.id}
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl border text-xs transition-all ${
                              isCompleted
                                ? 'border-emerald-500/40 bg-emerald-950/30 text-emerald-200'
                                : isNotDone
                                  ? 'border-rose-500/40 bg-rose-950/30 text-rose-200'
                                  : 'border-slate-800 bg-slate-950 text-slate-300'
                            }`}
                          >
                            <button
                              type="button"
                              onClick={() =>
                                void handleUpdateExecutionStatus(
                                  exec.id,
                                  isCompleted ? 'PENDING' : 'COMPLETED'
                                )
                              }
                              className="inline-flex items-center gap-1 font-medium"
                              title={
                                isCompleted
                                  ? 'Reabrir execução'
                                  : 'Marcar como concluída'
                              }
                            >
                              {isCompleted ? (
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Circle className="w-3.5 h-3.5 text-slate-400" />
                              )}
                              <span>
                                {formatShortDateBR(exec.scheduledDate)}
                              </span>
                            </button>

                            {!isNotDone ? (
                              <button
                                type="button"
                                onClick={() =>
                                  void handleUpdateExecutionStatus(
                                    exec.id,
                                    'NOT_DONE'
                                  )
                                }
                                className="text-slate-500 hover:text-rose-400 ml-1"
                                title="Marcar como não realizada"
                              >
                                <XCircle className="w-3.5 h-3.5" />
                              </button>
                            ) : null}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : null}
              </div>
            );
          })}
        </div>
      )}

      <RoutineFormModal
        isOpen={isRoutineModalOpen}
        onClose={() => setIsRoutineModalOpen(false)}
        initialRoutine={editingRoutine}
        categories={categories}
        onSubmit={handleSaveRoutine}
      />

      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onUpdated={fetchAll}
      />
    </div>
  );
};

