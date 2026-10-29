import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, LogIn } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { loginFormSchema } from '../schemas/auth.schema';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    const parsed = loginFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      const errors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!errors[key]) errors[key] = issue.message;
      }
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    try {
      await login(parsed.data);
      showToast('Login realizado com sucesso!', 'success');
      navigate('/');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao autenticar usuário.';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-bold text-white">Entrar na sua conta</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Acesse seu planejamento semanal e suas tarefas sincronizadas
        </p>
      </div>

      {apiError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200">
          {apiError}
        </div>
      ) : null}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          E-mail
        </label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="seu@email.com"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        {fieldErrors.email ? (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.email}</p>
        ) : null}
      </div>

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Senha
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        {fieldErrors.password ? (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.password}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <LogIn className="w-4 h-4" />
        )}
        <span>{isSubmitting ? 'Entrando...' : 'Entrar'}</span>
      </button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Ainda não tem uma conta?{' '}
        <Link
          to="/cadastro"
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Criar conta gratuita
        </Link>
      </p>
    </form>
  );
};

