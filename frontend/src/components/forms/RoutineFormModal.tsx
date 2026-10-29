import React, { useEffect, useState } from 'react';
import { Loader2, Save, X } from 'lucide-react';
import { routineFormSchema } from '../../schemas/routine.schema';
import { Category, RoutineActivity } from '../../types/api.types';
import { WEEKDAY_SHORT_LABELS } from '../../utils/dateHelpers';

const ORDERED_DAYS = [1, 2, 3, 4, 5, 6, 0]; // Seg..Sáb, Dom

interface RoutineFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoutine?: RoutineActivity | null;
  categories: Category[];
  onSubmit: (payload: {
    title: string;
    description: string | null;
    categoryId: string | null;
    daysOfWeek: number[];
    startTime: string | null;
    endTime: string | null;
    active: boolean;
  }) => Promise<void>;
}

export const RoutineFormModal: React.FC<RoutineFormModalProps> = ({
  isOpen,
  onClose,
  initialRoutine,
  categories,
  onSubmit,
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [daysOfWeek, setDaysOfWeek] = useState<number[]>([1, 3, 5]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [active, setActive] = useState(true);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    if (initialRoutine) {
      setTitle(initialRoutine.title);
      setDescription(initialRoutine.description ?? '');
      setCategoryId(initialRoutine.categoryId ?? '');
      setDaysOfWeek(initialRoutine.daysOfWeek);
      setStartTime(initialRoutine.startTime ?? '');
      setEndTime(initialRoutine.endTime ?? '');
      setActive(initialRoutine.active);
    } else {
      setTitle('');
      setDescription('');
      setCategoryId('');
      setDaysOfWeek([1, 2, 3, 4, 5]);
      setStartTime('');
      setEndTime('');
      setActive(true);
    }
  }, [isOpen, initialRoutine]);

  if (!isOpen) return null;

  const toggleDay = (day: number) => {
    setDaysOfWeek((prev) =>
      prev.includes(day)
        ? prev.filter((d) => d !== day)
        : [...prev, day].sort((a, b) => a - b)
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = routineFormSchema.safeParse({
      title,
      description: description || undefined,
      categoryId: categoryId || undefined,
      daysOfWeek,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      active,
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
        daysOfWeek: parsed.data.daysOfWeek,
        startTime: parsed.data.startTime || null,
        endTime: parsed.data.endTime || null,
        active: parsed.data.active,
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
            {initialRoutine
              ? 'Editar Atividade Recorrente'
              : 'Nova Atividade Recorrente (Rotina)'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Título da Atividade *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Academia, Leitura, Estudo de Inglês..."
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
              placeholder="Ex: Treino de força + 20min cardio"
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Dias da Semana *
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {ORDERED_DAYS.map((day) => {
                const isSelected = daysOfWeek.includes(day);
                return (
                  <button
                    key={day}
                    type="button"
                    onClick={() => toggleDay(day)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-indigo-600 border-indigo-500 text-white shadow-md shadow-indigo-600/20'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {WEEKDAY_SHORT_LABELS[day]}
                  </button>
                );
              })}
            </div>
            {errors.daysOfWeek ? (
              <p className="text-xs text-rose-400 mt-1">{errors.daysOfWeek}</p>
            ) : null}
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
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

            <div className="pt-4">
              <label className="inline-flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={active}
                  onChange={(e) => setActive(e.target.checked)}
                  className="rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="text-xs font-medium text-slate-200">
                  Rotina ativa na programação semanal
                </span>
              </label>
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
              <span>
                {initialRoutine ? 'Salvar Alterações' : 'Criar Rotina'}
              </span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

