import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CalendarClock,
  CheckCircle2,
  Circle,
  Clock,
  Edit3,
  Loader2,
  Palette,
  Plus,
  Trash2,
  XCircle,
} from 'lucide-react';
import { CategoryManagerModal } from '../components/categories/CategoryManagerModal';
import { TaskFormModal } from '../components/forms/TaskFormModal';
import { OverdueTasksBanner } from '../components/tasks/OverdueTasksBanner';
import {
  TaskFiltersBar,
  TaskFilterState,
} from '../components/tasks/TaskFiltersBar';
import { useToast } from '../contexts/ToastContext';
import { categoryService } from '../services/categoryService';
import { taskService } from '../services/taskService';
import { Category, Task, TaskPriority, TaskStatus } from '../types/api.types';
import { formatFullDateBR } from '../utils/dateHelpers';

const INITIAL_FILTERS: TaskFilterState = {
  startDate: '',
  endDate: '',
  status: '',
  priority: '',
  categoryId: '',
};

const PRIORITY_BADGES: Record<
  TaskPriority,
  { label: string; className: string }
> = {
  HIGH: {
    label: 'Alta',
    className: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
  },
  MEDIUM: {
    label: 'Média',
    className: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  },
  LOW: {
    label: 'Baixa',
    className: 'bg-sky-500/20 text-sky-300 border-sky-500/30',
  },
};

const STATUS_BADGES: Record<TaskStatus, { label: string; className: string }> =
  {
    PENDING: {
      label: 'Pendente',
      className: 'bg-slate-800 text-slate-300 border-slate-700',
    },
    OVERDUE: {
      label: 'Atrasada',
      className: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
    },
    COMPLETED: {
      label: 'Concluída',
      className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    },
    NOT_DONE: {
      label: 'Não realizada',
      className: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    },
  };

export const TasksPage: React.FC = () => {
  const { showToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [filters, setFilters] = useState<TaskFilterState>(INITIAL_FILTERS);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    setIsLoading(true);
    try {
      const [taskList, overdueList, categoryList] = await Promise.all([
        taskService.list({
          startDate: filters.startDate || undefined,
          endDate: filters.endDate || undefined,
          status: filters.status || undefined,
          priority: filters.priority || undefined,
          categoryId: filters.categoryId || undefined,
        }),
        taskService.listOverdue(),
        categoryService.list(),
      ]);

      setTasks(taskList);
      setOverdueTasks(overdueList);
      setCategories(categoryList);
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao carregar tarefas.',
        'error'
      );
    } finally {
      setIsLoading(false);
    }
  }, [filters, showToast]);

  useEffect(() => {
    void fetchAll();
  }, [fetchAll]);

  const categoryMap = useMemo(() => {
    return new Map<string, Category>(categories.map((c) => [c.id, c]));
  }, [categories]);

  const handleSaveTask = async (payload: {
    title: string;
    description: string | null;
    categoryId: string | null;
    scheduledDate: string;
    startTime: string | null;
    endTime: string | null;
    priority: TaskPriority;
    reminderMinutesBefore: number | null;
  }) => {
    try {
      if (editingTask) {
        await taskService.update(editingTask.id, payload);
        showToast('Tarefa atualizada com sucesso!', 'success');
      } else {
        await taskService.create(payload);
        showToast('Tarefa criada com sucesso!', 'success');
      }
      await fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Falha ao salvar tarefa.',
        'error'
      );
      throw err;
    }
  };

  const handleChangeStatus = async (taskId: string, status: TaskStatus) => {
    try {
      await taskService.updateStatus(taskId, status);
      showToast('Status da tarefa atualizado!', 'success');
      await fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Falha ao atualizar status.',
        'error'
      );
    }
  };

  const handleDeleteTask = async (taskId: string) => {
    try {
      await taskService.remove(taskId);
      showToast('Tarefa excluída com sucesso.', 'success');
      await fetchAll();
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Falha ao excluir tarefa.',
        'error'
      );
    }
  };

  const handleResolveOverdue = async (
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
      showToast('Tarefa concluída!', 'success');
    } else if (action.type === 'NOT_DONE') {
      await taskService.updateStatus(taskId, 'NOT_DONE');
      showToast('Tarefa marcada como não realizada.', 'success');
    } else {
      await taskService.reschedule(taskId, {
        scheduledDate: action.scheduledDate,
        startTime: action.startTime ?? null,
        endTime: action.endTime ?? null,
      });
      showToast('Tarefa reagendada com sucesso!', 'success');
    }
    await fetchAll();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Gerenciamento de Tarefas
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Crie, filtre, reagende ou marque o resultado das suas tarefas pontuais
          </p>
        </div>

        <div className="flex items-center gap-2.5">
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
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </button>
        </div>
      </div>

      {/* Bandeja de Atrasadas */}
      <OverdueTasksBanner
        overdueTasks={overdueTasks}
        onResolve={handleResolveOverdue}
      />

      {/* Barra de Filtros */}
      <TaskFiltersBar
        filters={filters}
        categories={categories}
        onChange={setFilters}
        onReset={() => setFilters(INITIAL_FILTERS)}
      />

      {/* Lista de Tarefas */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center gap-2 text-slate-400">
          <Loader2 className="w-7 h-7 animate-spin text-indigo-400" />
          <span className="text-xs">Carregando tarefas...</span>
        </div>
      ) : tasks.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-800 bg-slate-900/40 p-12 text-center space-y-3">
          <p className="text-sm font-medium text-slate-300">
            Nenhuma tarefa encontrada para os filtros selecionados.
          </p>
          <button
            type="button"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Criar primeira tarefa</span>
          </button>
        </div>
      ) : (
        <div className="space-y-2.5">
          {tasks.map((task) => {
            const category = task.categoryId
              ? categoryMap.get(task.categoryId)
              : undefined;
            const priorityBadge = PRIORITY_BADGES[task.priority];
            const statusBadge = STATUS_BADGES[task.status];
            const isCompleted = task.status === 'COMPLETED';

            return (
              <div
                key={task.id}
                className="rounded-2xl border border-slate-800/80 bg-slate-900/70 hover:border-slate-700 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all"
              >
                <div className="flex items-start gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() =>
                      void handleChangeStatus(
                        task.id,
                        isCompleted ? 'PENDING' : 'COMPLETED'
                      )
                    }
                    className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
                    title={
                      isCompleted
                        ? 'Reabrir tarefa'
                        : 'Marcar como concluída'
                    }
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <Circle className="w-5 h-5" />
                    )}
                  </button>

                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-sm font-semibold ${
                          isCompleted
                            ? 'line-through text-slate-400'
                            : 'text-white'
                        }`}
                      >
                        {task.title}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${statusBadge.className}`}
                      >
                        {statusBadge.label}
                      </span>

                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${priorityBadge.className}`}
                      >
                        Prioridade {priorityBadge.label}
                      </span>

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
                    </div>

                    {task.description ? (
                      <p className="text-xs text-slate-400">
                        {task.description}
                      </p>
                    ) : null}

                    <div className="flex items-center gap-3 text-xs text-slate-400 flex-wrap pt-0.5">
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="w-3.5 h-3.5 text-indigo-400" />
                        {formatFullDateBR(task.scheduledDate)}
                      </span>

                      {task.startTime ? (
                        <span className="inline-flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-sky-400" />
                          {task.startTime}
                          {task.endTime ? ` – ${task.endTime}` : ''}
                        </span>
                      ) : (
                        <span className="text-slate-500">Sem hora fixa</span>
                      )}

                      {task.rescheduledCount > 0 ? (
                        <span className="text-[11px] text-amber-300/90">
                          Reagendada {task.rescheduledCount}x
                        </span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                  {task.status !== 'NOT_DONE' ? (
                    <button
                      type="button"
                      onClick={() =>
                        void handleChangeStatus(task.id, 'NOT_DONE')
                      }
                      className="px-2.5 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:border-rose-500/40 hover:text-rose-300 text-xs text-slate-300 inline-flex items-center gap-1 transition-colors"
                      title="Marcar como não realizada"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span className="hidden md:inline">Não realizada</span>
                    </button>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => {
                      setEditingTask(task);
                      setIsTaskModalOpen(true);
                    }}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                    title="Editar tarefa"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    type="button"
                    onClick={() => void handleDeleteTask(task.id)}
                    className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:border-rose-900/60 text-slate-400 hover:text-rose-400 transition-colors"
                    title="Excluir tarefa"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal de Criar/Editar Tarefa */}
      <TaskFormModal
        isOpen={isTaskModalOpen}
        onClose={() => setIsTaskModalOpen(false)}
        initialTask={editingTask}
        categories={categories}
        onSubmit={handleSaveTask}
      />

      {/* Modal de Categorias */}
      <CategoryManagerModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        categories={categories}
        onUpdated={fetchAll}
      />
    </div>
  );
};

