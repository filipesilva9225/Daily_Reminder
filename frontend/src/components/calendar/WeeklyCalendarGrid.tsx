import React from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Circle,
  Clock,
  Pin,
  Repeat,
} from 'lucide-react';
import {
  Category,
  TaskStatus,
  UnifiedScheduleItem,
  WeeklyAnalyticsResult,
} from '../../types/api.types';
import {
  formatShortDateBR,
  getTodayISO,
  WEEKDAY_FULL_LABELS,
  WEEKDAY_SHORT_LABELS,
} from '../../utils/dateHelpers';

interface WeeklyCalendarGridProps {
  analytics: WeeklyAnalyticsResult;
  selectedDayDate: string;
  onSelectDay: (date: string) => void;
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onCurrentWeek: () => void;
  categoryMap: Map<string, Category>;
  onToggleItemStatus: (
    itemId: string,
    type: 'TASK' | 'ROUTINE',
    currentStatus: TaskStatus
  ) => Promise<void>;
}

export const WeeklyCalendarGrid: React.FC<WeeklyCalendarGridProps> = ({
  analytics,
  selectedDayDate,
  onSelectDay,
  onPrevWeek,
  onNextWeek,
  onCurrentWeek,
  categoryMap,
  onToggleItemStatus,
}) => {
  const todayISO = getTodayISO();

  const selectedDaySchedule =
    analytics.dailySchedule.find((d) => d.date === selectedDayDate) ??
    analytics.dailySchedule[0];

  const renderScheduleItem = (item: UnifiedScheduleItem, compact = false) => {
    const category = item.categoryId
      ? categoryMap.get(item.categoryId)
      : undefined;
    const isCompleted = item.status === 'COMPLETED';
    const isNotDone = item.status === 'NOT_DONE';

    return (
      <div
        key={`${item.type}-${item.id}`}
        className={`group rounded-xl border p-2.5 transition-all flex items-start gap-2.5 ${
          isCompleted
            ? 'border-emerald-900/40 bg-emerald-950/15 opacity-75'
            : isNotDone
              ? 'border-rose-900/40 bg-rose-950/15 opacity-60'
              : 'border-slate-800 bg-slate-950/80 hover:border-slate-700'
        }`}
      >
        <button
          type="button"
          onClick={() =>
            void onToggleItemStatus(item.id, item.type, item.status)
          }
          className="mt-0.5 text-slate-400 hover:text-indigo-400 transition-colors shrink-0"
          title={
            isCompleted ? 'Desmarcar conclusão' : 'Marcar como concluída'
          }
        >
          {isCompleted ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <Circle className="w-4 h-4" />
          )}
        </button>

        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex items-center gap-1.5 flex-wrap">
            {item.type === 'ROUTINE' ? (
              <Repeat className="w-3 h-3 text-indigo-400 shrink-0" />
            ) : (
              <Pin className="w-3 h-3 text-sky-400 shrink-0" />
            )}
            <span
              className={`text-xs font-medium truncate ${
                isCompleted
                  ? 'line-through text-slate-400'
                  : 'text-slate-100'
              }`}
            >
              {item.title}
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            {item.startTime ? (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-400">
                <Clock className="w-3 h-3" />
                {item.startTime}
                {item.endTime ? `–${item.endTime}` : ''}
              </span>
            ) : !compact ? (
              <span className="text-[11px] text-slate-500">Sem hora fixa</span>
            ) : null}

            {category ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md font-medium"
                style={{
                  backgroundColor: `${category.colorHex}20`,
                  color: category.colorHex,
                }}
              >
                {category.name}
              </span>
            ) : null}

            {item.hasTimeConflict ? (
              <span
                className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-300"
                title="Há sobreposição de horário com outra atividade neste dia"
              >
                <AlertTriangle className="w-3 h-3" />
                Conflito
              </span>
            ) : null}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho de Navegação da Semana */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
        <div>
          <h2 className="text-base font-bold text-white">
            Semana de {formatShortDateBR(analytics.weekStartDate)} a{' '}
            {formatShortDateBR(analytics.weekEndDate)}
          </h2>
          <p className="text-xs text-slate-400">
            Selecione um dia para focar na agenda detalhada ou acompanhe os 7 dias na grade
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onPrevWeek}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Semana anterior"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={onCurrentWeek}
            className="px-3 py-1.5 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-xs font-medium text-slate-200 transition-colors"
          >
            Hoje
          </button>
          <button
            type="button"
            onClick={onNextWeek}
            className="p-2 rounded-xl border border-slate-800 bg-slate-950 hover:bg-slate-800 text-slate-300 transition-colors"
            title="Próxima semana"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Seletor de Dias & Grade de 7 Colunas (Desktop) */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
        {analytics.dailySchedule.map((day) => {
          const isToday = day.date === todayISO;
          const isSelected = day.date === selectedDayDate;
          const allItems = [...day.unscheduledItems, ...day.timedItems];
          const doneCount = allItems.filter(
            (i) => i.status === 'COMPLETED'
          ).length;

          return (
            <div
              key={day.date}
              onClick={() => onSelectDay(day.date)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  onSelectDay(day.date);
                }
              }}
              className={`rounded-2xl border p-3 flex flex-col gap-2.5 cursor-pointer transition-all ${
                isSelected
                  ? 'border-indigo-500 bg-indigo-950/20 shadow-lg shadow-indigo-500/10'
                  : isToday
                    ? 'border-indigo-500/40 bg-slate-900/80'
                    : 'border-slate-800/80 bg-slate-900/50 hover:border-slate-700'
              }`}
            >
              <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                    {WEEKDAY_SHORT_LABELS[day.dayOfWeek]}
                  </span>
                  <span className="text-sm font-semibold text-white">
                    {formatShortDateBR(day.date)}
                  </span>
                </div>
                <div className="flex flex-col items-end">
                  {isToday ? (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 font-semibold">
                      Hoje
                    </span>
                  ) : null}
                  <span className="text-[11px] text-slate-400 mt-0.5">
                    {doneCount}/{allItems.length}
                  </span>
                </div>
              </div>

              <div
                className="space-y-1.5 max-h-60 overflow-y-auto pr-0.5"
                onClick={(e) => e.stopPropagation()}
              >
                {allItems.length === 0 ? (
                  <p className="text-[11px] text-slate-500 py-4 text-center">
                    Livre
                  </p>
                ) : (
                  allItems.map((item) => renderScheduleItem(item, true))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Agenda Detalhada do Dia Selecionado */}
      {selectedDaySchedule ? (
        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-5 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-base font-bold text-white">
                Agenda de {WEEKDAY_FULL_LABELS[selectedDaySchedule.dayOfWeek]} (
                {formatShortDateBR(selectedDaySchedule.date)})
              </h3>
              <p className="text-xs text-slate-400">
                Organização híbrida: itens sem hora fixa e linha do tempo por horário
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Coluna 1: No dia (sem hora fixa) */}
            <div className="space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                No Dia — Sem Hora Fixa (
                {selectedDaySchedule.unscheduledItems.length})
              </h4>
              {selectedDaySchedule.unscheduledItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-4 text-center text-xs text-slate-500">
                  Nenhuma tarefa flexível neste dia.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDaySchedule.unscheduledItems.map((item) =>
                    renderScheduleItem(item, false)
                  )}
                </div>
              )}
            </div>

            {/* Colunas 2-3: Linha do tempo por horário */}
            <div className="lg:col-span-2 space-y-2.5">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Linha do Tempo por Horário (
                {selectedDaySchedule.timedItems.length})
              </h4>
              {selectedDaySchedule.timedItems.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-800 p-6 text-center text-xs text-slate-500">
                  Nenhuma atividade com horário marcado para este dia.
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedDaySchedule.timedItems.map((item) =>
                    renderScheduleItem(item, false)
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

