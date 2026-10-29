import React from 'react';
import {
  AlertCircle,
  CheckCircle2,
  Flame,
  RefreshCw,
  TrendingUp,
} from 'lucide-react';
import { WeeklyAnalyticsResult } from '../../types/api.types';

interface WeeklyProgressCardsProps {
  analytics: WeeklyAnalyticsResult;
}

export const WeeklyProgressCards: React.FC<WeeklyProgressCardsProps> =
  React.memo(({ analytics }) => {
    const { summary, streaks, byCategory } = analytics;
    const topStreak = streaks.length > 0 ? streaks[0] : null;

    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Progresso Geral */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Progresso da Semana
              </span>
              <TrendingUp className="w-4 h-4 text-indigo-400" />
            </div>
            <div>
              <div className="flex items-baseline justify-between mb-1.5">
                <span className="text-2xl font-bold text-white">
                  {summary.completionRate}%
                </span>
                <span className="text-xs text-slate-400">
                  {summary.completedCount}/{summary.totalPlanned} concluídas
                </span>
              </div>
              <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                <div
                  className="h-full bg-indigo-500 rounded-full transition-all duration-300"
                  style={{
                    width: `${Math.min(100, Math.max(0, summary.completionRate))}%`,
                  }}
                />
              </div>
            </div>
          </div>

          {/* Concluídas vs Não Realizadas */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Balanço de Execução
              </span>
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400">Concluídas</p>
                <p className="text-lg font-bold text-emerald-400">
                  {summary.completedCount}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Pendentes</p>
                <p className="text-lg font-bold text-slate-200">
                  {summary.pendingCount}
                </p>
              </div>
              <div>
                <p className="text-slate-400">Não realizadas</p>
                <p className="text-lg font-bold text-rose-400">
                  {summary.notDoneCount}
                </p>
              </div>
            </div>
          </div>

          {/* Atrasadas e Reagendadas */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Atrasos & Reagendamentos
              </span>
              {summary.overdueTasksCount > 0 ? (
                <AlertCircle className="w-4 h-4 text-amber-400" />
              ) : (
                <RefreshCw className="w-4 h-4 text-slate-400" />
              )}
            </div>
            <div className="flex items-center justify-between text-xs">
              <div>
                <p className="text-slate-400">Aguardando decisão</p>
                <p
                  className={`text-lg font-bold ${
                    summary.overdueTasksCount > 0
                      ? 'text-amber-400'
                      : 'text-slate-200'
                  }`}
                >
                  {summary.overdueTasksCount}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400">Reagendadas na semana</p>
                <p className="text-lg font-bold text-sky-400">
                  {summary.rescheduledTasksCount}
                </p>
              </div>
            </div>
          </div>

          {/* Melhor Streak de Hábito */}
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-400">
                Destaque de Consistência
              </span>
              <Flame className="w-4 h-4 text-orange-400" />
            </div>
            {topStreak ? (
              <div>
                <p className="text-sm font-semibold text-white truncate">
                  {topStreak.title}
                </p>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sequência atual:{' '}
                  <strong className="text-orange-400">
                    {topStreak.currentStreak}
                  </strong>{' '}
                  (Recorde: {topStreak.bestStreak})
                </p>
              </div>
            ) : (
              <p className="text-xs text-slate-500">
                Cadastre rotinas recorrentes para acompanhar seus streaks.
              </p>
            )}
          </div>
        </div>

        {/* Barra de Desempenho por Categoria */}
        {byCategory.length > 0 ? (
          <div className="rounded-2xl border border-slate-800/80 bg-slate-900/50 p-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
              Progresso por Categoria na Semana
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {byCategory.map((cat) => (
                <div
                  key={cat.categoryId ?? 'uncategorized'}
                  className="rounded-xl border border-slate-800/80 bg-slate-950/60 p-3 flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: cat.colorHex }}
                      />
                      <span className="text-xs font-medium text-slate-200 truncate">
                        {cat.name}
                      </span>
                    </div>
                    <span className="text-xs font-semibold text-slate-300">
                      {cat.completionRate}%
                    </span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-slate-800 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, Math.max(0, cat.completionRate))}%`,
                        backgroundColor: cat.colorHex,
                      }}
                    />
                  </div>
                  <span className="text-[11px] text-slate-400">
                    {cat.completed} de {cat.total} concluídas
                  </span>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    );
  });

