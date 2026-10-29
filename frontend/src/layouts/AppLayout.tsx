import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  CalendarCheck2,
  CheckSquare,
  LayoutDashboard,
  LogOut,
  Moon,
  Repeat,
  Sun,
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const AppLayout: React.FC = () => {
  const { user, logout, toggleTheme } = useAuth();

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-3.5 py-2 rounded-xl text-sm font-medium transition-colors ${
      isActive
        ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/20'
        : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100">
      <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-900/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
                <CalendarCheck2 className="w-5 h-5" />
              </div>
              <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
                Rotina Semanal
              </span>
            </div>

            <nav className="flex items-center gap-1">
              <NavLink to="/" end className={navLinkClass}>
                <LayoutDashboard className="w-4 h-4" />
                <span>Dashboard</span>
              </NavLink>
              <NavLink to="/tarefas" className={navLinkClass}>
                <CheckSquare className="w-4 h-4" />
                <span>Tarefas</span>
              </NavLink>
              <NavLink to="/rotinas" className={navLinkClass}>
                <Repeat className="w-4 h-4" />
                <span>Rotinas</span>
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => void toggleTheme()}
              className="p-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-white hover:border-slate-700 transition-colors"
              title="Alternar tema Claro/Escuro"
            >
              {user?.theme === 'LIGHT' ? (
                <Moon className="w-4 h-4" />
              ) : (
                <Sun className="w-4 h-4 text-amber-400" />
              )}
            </button>

            <div className="hidden md:flex flex-col items-end">
              <span className="text-xs font-semibold text-slate-200">
                {user?.name}
              </span>
              <span className="text-[11px] text-slate-400">{user?.email}</span>
            </div>

            <button
              type="button"
              onClick={logout}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-800 bg-slate-900 text-slate-300 hover:text-rose-400 hover:border-rose-900/60 text-xs font-medium transition-colors"
              title="Sair da conta"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Outlet />
      </main>
    </div>
  );
};

