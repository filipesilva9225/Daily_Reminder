import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { CalendarCheck2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AuthLayout: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (!isLoading && isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen flex flex-col justify-center items-center px-4 py-12 bg-slate-950 text-slate-100">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center text-center gap-2">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-lg shadow-indigo-500/10">
            <CalendarCheck2 className="w-6 h-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            Rotina Semanal
          </h1>
          <p className="text-sm text-slate-400">
            Planejamento por horários, hábitos recorrentes e controle total de pendências
          </p>
        </div>

        <div className="rounded-2xl border border-slate-800/80 bg-slate-900/70 backdrop-blur-md p-6 sm:p-8 shadow-2xl">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

