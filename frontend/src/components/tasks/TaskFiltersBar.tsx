import React from 'react';
import { Filter, RotateCcw } from 'lucide-react';
import { Category, TaskPriority, TaskStatus } from '../../types/api.types';

export interface TaskFilterState {
  startDate: string;
  endDate: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  categoryId: string;
}

interface TaskFiltersBarProps {
  filters: TaskFilterState;
  categories: Category[];
  onChange: (next: TaskFilterState) => void;
  onReset: () => void;
}

export const TaskFiltersBar: React.FC<TaskFiltersBarProps> = ({
  filters,
  categories,
  onChange,
  onReset,
}) => {
  return (
    <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-400">
          <Filter className="w-3.5 h-3.5 text-indigo-400" />
          <span>Filtros de Tarefas</span>
        </div>

        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Limpar filtros</span>
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Data Inicial
          </label>
          <input
            type="date"
            value={filters.startDate}
            onChange={(e) =>
              onChange({ ...filters, startDate: e.target.value })
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Data Final
          </label>
          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => onChange({ ...filters, endDate: e.target.value })}
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Status
          </label>
          <select
            value={filters.status}
            onChange={(e) =>
              onChange({
                ...filters,
                status: e.target.value as TaskStatus | '',
              })
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todos os status</option>
            <option value="PENDING">Pendente</option>
            <option value="OVERDUE">Atrasada</option>
            <option value="COMPLETED">Concluída</option>
            <option value="NOT_DONE">Não realizada</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Prioridade
          </label>
          <select
            value={filters.priority}
            onChange={(e) =>
              onChange({
                ...filters,
                priority: e.target.value as TaskPriority | '',
              })
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todas as prioridades</option>
            <option value="HIGH">Alta</option>
            <option value="MEDIUM">Média</option>
            <option value="LOW">Baixa</option>
          </select>
        </div>

        <div>
          <label className="block text-[11px] text-slate-400 mb-1">
            Categoria
          </label>
          <select
            value={filters.categoryId}
            onChange={(e) =>
              onChange({ ...filters, categoryId: e.target.value })
            }
            className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs text-white focus:border-indigo-500 focus:outline-none"
          >
            <option value="">Todas as categorias</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};

