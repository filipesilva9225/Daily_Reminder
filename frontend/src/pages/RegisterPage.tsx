import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Loader2, UserPlus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../contexts/ToastContext';
import { registerFormSchema } from '../schemas/auth.schema';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [weekStartsOn, setWeekStartsOn] = useState<number>(1);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldErrors({});
    setApiError(null);

    const parsed = registerFormSchema.safeParse({
      name,
      email,
      password,
      weekStartsOn,
    });

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
      await register(parsed.data);
      showToast('Conta criada com sucesso! Bem-vindo(a)!', 'success');
      navigate('/');
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : 'Falha ao cadastrar usuário.';
      setApiError(msg);
      showToast(msg, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4" noValidate>
      <div>
        <h2 className="text-lg font-bold text-white">Criar nova conta</h2>
        <p className="text-xs text-slate-400 mt-0.5">
          Organize sua rotina semanal com simplicidade e privacidade
        </p>
      </div>

      {apiError ? (
        <div className="rounded-xl border border-rose-500/40 bg-rose-950/40 px-3.5 py-2.5 text-xs text-rose-200">
          {apiError}
        </div>
      ) : null}

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Nome
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Seu nome"
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
        />
        {fieldErrors.name ? (
          <p className="text-xs text-rose-400 mt-1">{fieldErrors.name}</p>
        ) : null}
      </div>

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
          Senha (mínimo 6 caracteres)
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

      <div>
        <label className="block text-xs font-medium text-slate-300 mb-1">
          Primeiro dia da semana
        </label>
        <select
          value={weekStartsOn}
          onChange={(e) => setWeekStartsOn(Number(e.target.value))}
          className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white focus:border-indigo-500 focus:outline-none"
        >
          <option value={1}>Segunda-feira (Padrão)</option>
          <option value={0}>Domingo</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-600/20 transition-colors"
      >
        {isSubmitting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <UserPlus className="w-4 h-4" />
        )}
        <span>{isSubmitting ? 'Criando conta...' : 'Cadastrar'}</span>
      </button>

      <p className="text-center text-xs text-slate-400 pt-2">
        Já possui conta?{' '}
        <Link
          to="/login"
          className="text-indigo-400 hover:text-indigo-300 font-semibold"
        >
          Fazer login
        </Link>
      </p>
    </form>
  );
};

