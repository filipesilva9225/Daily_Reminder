import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, Loader2, Plus, RefreshCw } from 'lucide-react';
import { WeeklyCalendarGrid } from '../components/calendar/WeeklyCalendarGrid';
import { WeeklyProgressCards } from '../components/indicators/WeeklyProgressCards';
import { OverdueTasksBanner } from '../components/tasks/OverdueTasksBanner';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { useWeeklyDashboard } from '../hooks/useWeeklyDashboard';
import { TaskStatus } from '../types/api.types';
import { getTodayISO, shiftDateISO } from '../utils/dateHelpers';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const {
    referenceDate,
    setReferenceDate,
    selectedDayDate,
    setSelectedDayDate,
    analytics,
    overdueTasks,
    categoryMap,
    isLoading,
    error,
    refresh,
    toggleScheduledItemStatus,
    resolveOverdueTask,
  } = useWeeklyDashboard(user?.weekStartsOn ?? 1);

  const handleToggleStatus = async (
    itemId: string,
    type: 'TASK' | 'ROUTINE',
    currentStatus: TaskStatus
  ) => {
    try {
      await toggleScheduledItemStatus(itemId, type, currentStatus);
      showToast('Status atualizado!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao atualizar item.',
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
    try {
      await resolveOverdueTask(taskId, action);
      const label =
        action.type === 'RESCHEDULE'
          ? 'Tarefa reagendada com sucesso!'
          : action.type === 'NOT_DONE'
            ? 'Tarefa marcada como não realizada.'
            : 'Tarefa concluída!';
      showToast(label, 'success');
    } catch (err) {
      showToast(
        err instanceof Error
          ? err.message
          : 'Falha ao atualizar tarefa atrasada.',
        'error'
      );
    }
  };

  if (isLoading && !analytics) {
    return (
      <div className="py-20 flex flex-col items-center justify-center gap-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
        <p className="text-sm font-medium">
          Carregando seu planejamento semanal...
        </p>
      </div>
    );
  }

  if (error && !analytics) {
    return (
      <div className="rounded-2xl border border-rose-500/40 bg-rose-950/20 p-6 flex flex-col items-center text-center gap-3">
        <AlertCircle className="w-8 h-8 text-rose-400" />
        <div>
          <h2 className="text-base font-bold text-white">
            Falha ao conectar com a API
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-md">{error}</p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Tentar novamente</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho do Dashboard e Atalhos Rápidos */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white">
            Olá, {user?.name?.split(' ')[0] ?? 'Usuário'} 👋
          </h1>
          <p className="text-xs sm:text-sm text-slate-400">
            Acompanhe seu progresso semanal, suas rotinas recorrentes e tarefas do dia
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Link
            to="/tarefas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/20 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span>Nova Tarefa</span>
          </Link>
          <Link
            to="/rotinas"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-800 bg-slate-900 hover:bg-slate-800 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Plus className="w-4 h-4 text-indigo-400" />
            <span>Nova Rotina</span>
          </Link>
        </div>
      </div>

      {/* Bandeja de Tarefas Atrasadas (Nunca desaparecem ao virar a semana) */}
      <OverdueTasksBanner
        overdueTasks={overdueTasks}
        onResolve={handleResolveOverdue}
      />

      {/* Indicadores de Progresso Semanal */}
      {analytics ? <WeeklyProgressCards analytics={analytics} /> : null}

      {/* Calendário Semanal de 7 Dias + Agenda Detalhada do Dia */}
      {analytics ? (
        <WeeklyCalendarGrid
          analytics={analytics}
          selectedDayDate={selectedDayDate}
          onSelectDay={setSelectedDayDate}
          onPrevWeek={() => setReferenceDate(shiftDateISO(referenceDate, -7))}
          onNextWeek={() => setReferenceDate(shiftDateISO(referenceDate, 7))}
          onCurrentWeek={() => {
            const today = getTodayISO();
            setReferenceDate(today);
            setSelectedDayDate(today);
          }}
          categoryMap={categoryMap}
          onToggleItemStatus={handleToggleStatus}
        />
      ) : null}
    </div>
  );
};

