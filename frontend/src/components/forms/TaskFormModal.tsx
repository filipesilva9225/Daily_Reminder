import React, { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { taskFormSchema } from '../../schemas/task.schema';
import { Category, Task, TaskPriority } from '../../types/api.types';
import { getTodayISO } from '../../utils/dateHelpers';

interface TaskFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTask?: Task | null;
  categories: Category[];
  onSubmit: (payload: {
    title: string;
    description: string | null;
    categoryId: string | null;
    scheduledDate: string;
    startTime: string | null;
    endTime: string | null;
    priority: TaskPriority;
    reminderMinutesBefore: number | null;
  }) => Promise<void>;
}

export const TaskFormModal: React.FC<TaskFormModalProps> = ({
  isOpen,
  onClose,
  initialTask,
  categories,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [scheduledDate, setScheduledDate] = useState(() => getTodayISO());
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('MEDIUM');
  const [reminderMinutesBefore, setReminderMinutesBefore] =
    useState<string>('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (initialTask) {
      setTitle(initialTask.title);
      setDescription(initialTask.description ?? '');
      setCategoryId(initialTask.categoryId ?? '');
      setScheduledDate(initialTask.scheduledDate);
      setStartTime(initialTask.startTime ?? '');
      setEndTime(initialTask.endTime ?? '');
      setPriority(initialTask.priority);
      setReminderMinutesBefore(
        initialTask.reminderMinutesBefore !== null &&
          initialTask.reminderMinutesBefore !== undefined
          ? String(initialTask.reminderMinutesBefore)
          : ''
      );
    } else {
      setTitle('');
      setDescription('');
      setCategoryId('');
      setScheduledDate(getTodayISO());
      setStartTime('');
      setEndTime('');
      setPriority('MEDIUM');
      setReminderMinutesBefore('15');
    }
  }, [isOpen, initialTask]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = taskFormSchema.safeParse({
      title,
      description: description || undefined,
      categoryId: categoryId || undefined,
      scheduledDate,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      priority,
      reminderMinutesBefore:
        reminderMinutesBefore !== '' ? Number(reminderMinutesBefore) : null,
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!nextErrors[key]) nextErrors[key] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        title: parsed.data.title,
        description: parsed.data.description ?? null,
        categoryId: parsed.data.categoryId ?? null,
        scheduledDate: parsed.data.scheduledDate,
        startTime: parsed.data.startTime || null,
        endTime: parsed.data.endTime || null,
        priority: parsed.data.priority,
        reminderMinutesBefore: parsed.data.reminderMinutesBefore ?? null,
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[92vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <h2 className="text-base font-bold text-white">
            {initialTask ? 'Editar Tarefa' : 'Nova Tarefa'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título da Tarefa *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Entregar relatório financeiro"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
            {errors.title ? (
              <p className="text-xs text-rose-400 mt-1">{errors.title}</p>
            ) : null}
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Descrição (opcional)
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Detalhes, links ou observações..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Data Agendada *
              </label>
              <input
                type="date"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              {errors.scheduledDate ? (
                <p className="text-xs text-rose-400 mt-1">
                  {errors.scheduledDate}
                </p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Prioridade
              </label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as TaskPriority)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="LOW">Baixa</option>
                <option value="MEDIUM">Média</option>
                <option value="HIGH">Alta</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Horário de Início (opcional)
              </label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              {errors.startTime ? (
                <p className="text-xs text-rose-400 mt-1">{errors.startTime}</p>
              ) : null}
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Horário de Término (opcional)
              </label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              />
              {errors.endTime ? (
                <p className="text-xs text-rose-400 mt-1">{errors.endTime}</p>
              ) : null}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Categoria
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Sem categoria</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Lembrete Antes do Horário
              </label>
              <select
                value={reminderMinutesBefore}
                onChange={(e) => setReminderMinutesBefore(e.target.value)}
                className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white focus:border-indigo-500 focus:outline-none"
              >
                <option value="">Sem lembrete</option>
                <option value="0">No horário exato</option>
                <option value="10">10 minutos antes</option>
                <option value="15">15 minutos antes</option>
                <option value="30">30 minutos antes</option>
                <option value="60">1 hora antes</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-300 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-xs font-semibold text-white transition-colors"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{initialTask ? 'Salvar Alterações' : 'Criar Tarefa'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

