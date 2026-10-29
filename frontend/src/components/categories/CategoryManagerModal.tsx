import React, { useState } from 'react';
import { Loader2, Palette, Plus, Trash2, X } from 'lucide-react';
import { useToast } from '../../contexts/ToastContext';
import { categoryFormSchema } from '../../schemas/category.schema';
import { categoryService } from '../../services/categoryService';
import { Category } from '../../types/api.types';

const PRESET_COLORS = [
  '#6366F1', // Indigo
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Rose
  '#8B5CF6', // Violet
  '#EC4899', // Pink
  '#06B6D4', // Cyan
];

interface CategoryManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onUpdated: () => Promise<void>;
}

export const CategoryManagerModal: React.FC<CategoryManagerModalProps> = ({
  isOpen,
  onClose,
  categories,
  onUpdated,
}) => {
  const { showToast } = useToast();
  const [name, setName] = useState('');
  const [colorHex, setColorHex] = useState(PRESET_COLORS[0]);
  const [fieldError, setFieldError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFieldError(null);

    const parsed = categoryFormSchema.safeParse({ name, colorHex });
    if (!parsed.success) {
      setFieldError(parsed.error.issues[0]?.message ?? 'Dados inválidos');
      return;
    }

    setIsSubmitting(true);
    try {
      await categoryService.create(parsed.data);
      setName('');
      await onUpdated();
      showToast('Categoria criada com sucesso!', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao criar categoria.',
        'error'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await categoryService.remove(id);
      await onUpdated();
      showToast('Categoria removida.', 'success');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'Erro ao remover categoria.',
        'error'
      );
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-5">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              Gerenciar Categorias
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={(e) => void handleCreate(e)} className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Nova Categoria
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Trabalho, Estudos, Saúde..."
              className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">
              Cor da Categoria
            </label>
            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_COLORS.map((hex) => (
                <button
                  key={hex}
                  type="button"
                  onClick={() => setColorHex(hex)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    colorHex.toUpperCase() === hex
                      ? 'border-white scale-110'
                      : 'border-transparent opacity-80 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: hex }}
                />
              ))}
              <input
                type="color"
                value={colorHex}
                onChange={(e) => setColorHex(e.target.value.toUpperCase())}
                className="w-8 h-8 rounded-lg bg-transparent cursor-pointer border-0"
                title="Escolher cor personalizada"
              />
            </div>
          </div>

          {fieldError ? (
            <p className="text-xs text-rose-400">{fieldError}</p>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white transition-colors"
          >
            {isSubmitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
            <span>Adicionar Categoria</span>
          </button>
        </form>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Categorias Cadastradas ({categories.length})
          </h3>
          {categories.length === 0 ? (
            <p className="text-xs text-slate-500 py-4 text-center">
              Nenhuma categoria cadastrada ainda.
            </p>
          ) : (
            <div className="divide-y divide-slate-800/80">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="py-2.5 flex items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-3.5 h-3.5 rounded-full shrink-0"
                      style={{ backgroundColor: cat.colorHex }}
                    />
                    <span className="text-sm font-medium text-slate-200">
                      {cat.name}
                    </span>
                  </div>
                  <button
                    type="button"
                    disabled={deletingId === cat.id}
                    onClick={() => void handleDelete(cat.id)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-950/30 transition-colors"
                    title="Excluir categoria"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

