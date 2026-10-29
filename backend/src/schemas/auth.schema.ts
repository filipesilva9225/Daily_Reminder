import { z } from 'zod';

export const registerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'O nome deve ter pelo menos 2 caracteres')
    .max(100, 'O nome deve ter no máximo 100 caracteres'),
  email: z.string().trim().email('E-mail inválido').toLowerCase(),
  password: z
    .string()
    .min(6, 'A senha deve ter pelo menos 6 caracteres')
    .max(100, 'A senha deve ter no máximo 100 caracteres'),
  timezone: z.string().default('America/Sao_Paulo').optional(),
  theme: z.enum(['LIGHT', 'DARK']).default('LIGHT').optional(),
  weekStartsOn: z.number().int().min(0).max(1).default(1).optional(),
});

export const loginSchema = z.object({
  email: z.string().trim().email('E-mail inválido').toLowerCase(),
  password: z.string().min(1, 'A senha é obrigatória'),
});

export const updatePreferencesSchema = z.object({
  name: z.string().trim().min(2).max(100).optional(),
  timezone: z.string().min(1).optional(),
  theme: z.enum(['LIGHT', 'DARK']).optional(),
  weekStartsOn: z.number().int().min(0).max(1).optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;

