import React, { useState } from 'react';
import {
  AlertTriangle,
  CalendarClock,
  Check,
  XCircle,
} from 'lucide-react';
import { rescheduleFormSchema } from '../../schemas/task.schema';
import { Task } from '../../types/api.types';
import { formatFullDateBR, getTodayISO } from '../../utils/dateHelpers';

interface OverdueTasksBannerProps {
  overdueTasks: Task[];
  onResolve: (
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
  ) => Promise<void>;
}

export const OverdueTasksBanner: React.FC<OverdueTasksBannerProps> = ({
  overdueTasks,
  onResolve,
}) => {
  const [reschedulingTaskId, setReschedulingTaskId] = useState<string | null>(
    null
  );
  const [newDate, setNewDate] = useState<string>(() => getTodayISO());
  const [newStartTime, setNewStartTime] = useState<string>('');
  const [newEndTime, setNewEndTime] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  if (overdueTasks.length === 0) {
    return null;
  }

  const openReschedule = (task: Task) => {
    setReschedulingTaskId(task.id);
    setNewDate(getTodayISO());
    setNewStartTime(task.startTime ?? '');
    setNewEndTime(task.endTime ?? '');
    setFormError(null);
  };

  const handleConfirmReschedule = async (taskId: string) => {
    const parsed = rescheduleFormSchema.safeParse({
      scheduledDate: newDate,
      startTime: newStartTime || undefined,
      endTime: newEndTime || undefined,
    });

    if (!parsed.success) {
      setFormError(
        parsed.error.issues[0]?.message || 'Dados de reagendamento inválidos'
      );
      return;
    }

    setBusyId(taskId);
    setFormError(null);
    try {
      await onResolve(taskId, {
        type: 'RESCHEDULE',
        scheduledDate: parsed.data.scheduledDate,
        startTime: parsed.data.startTime ?? null,
        endTime: parsed.data.endTime ?? null,
      });
      setReschedulingTaskId(null);
    } finally {
      setBusyId(null);
    }
  };

  const handleQuickAction = async (
    taskId: string,
    type: 'COMPLETE' | 'NOT_DONE'
  ) => {
    setBusyId(taskId);
    try {
      await onResolve(taskId, { type });
    } finally {
      setBusyId(null);
    }
  };

  return (
    <section className="rounded-2xl border border-amber-500/40 bg-amber-950/20 p-4 sm:p-5 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-amber-200">
              Tarefas Atrasadas Aguardando Decisão ({overdueTasks.length})
            </h2>
            <p className="text-xs text-amber-300/80">
              Tarefas não concluídas em dias ou semanas anteriores permanecem aqui até você reagendá-las ou marcá-las como não realizadas.
            </p>
          </div>
        </div>
      </div>

      <div className="divide-y divide-amber-500/20">
        {overdueTasks.map((task) => {
          const isEditing = reschedulingTaskId === task.id;
          const isBusy = busyId === task.id;

          return (
            <div
              key={task.id}
              className="py-3 first:pt-1 last:pb-0 flex flex-col gap-2.5"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-white">
                      {task.title}
                    </span>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                      Prazo original: {formatFullDateBR(task.scheduledDate)}
                      {task.startTime ? ` às ${task.startTime}` : ''}
                    </span>
                    {task.rescheduledCount > 0 ? (
                      <span className="text-[11px] text-slate-400">
                        (Reagendada {task.rescheduledCount}x)
                      </span>
                    ) : null}
                  </div>
                  {task.description ? (
                    <p className="text-xs text-slate-400 line-clamp-1">
                      {task.description}
                    </p>
                  ) : null}
                </div>

                <div className="flex items-center gap-2 flex-wrap shrink-0">
                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => openReschedule(task)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <CalendarClock className="w-3.5 h-3.5" />
                    <span>Reagendar</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleQuickAction(task.id, 'NOT_DONE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-500/40 bg-rose-950/40 hover:bg-rose-900/50 text-rose-200 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <XCircle className="w-3.5 h-3.5" />
                    <span>Não realizada</span>
                  </button>

                  <button
                    type="button"
                    disabled={isBusy}
                    onClick={() => void handleQuickAction(task.id, 'COMPLETE')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/50 text-emerald-200 text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>Concluir</span>
                  </button>
                </div>
              </div>

              {isEditing ? (
                <div className="rounded-xl border border-slate-800 bg-slate-900/90 p-3 space-y-2">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Nova Data *
                      </label>
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Início (opcional)
                      </label>
                      <input
                        type="time"
                        value={newStartTime}
                        onChange={(e) => setNewStartTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] text-slate-400 mb-1">
                        Fim (opcional)
                      </label>
                      <input
                        type="time"
                        value={newEndTime}
                        onChange={(e) => setNewEndTime(e.target.value)}
                        className="w-full rounded-lg border border-slate-700 bg-slate-950 px-2.5 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  {formError ? (
                    <p className="text-xs text-rose-400">{formError}</p>
                  ) : null}
                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setReschedulingTaskId(null)}
                      className="px-3 py-1 rounded-lg text-xs text-slate-400 hover:text-white"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      disabled={isBusy}
                      onClick={() => void handleConfirmReschedule(task.id)}
                      className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium"
                    >
                      Confirmar nova data
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          );
        })}
      </div>
    </section>
  );
};

