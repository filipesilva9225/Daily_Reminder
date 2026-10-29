import { z } from 'zod';

const hexColorRegex = /^#([0-9A-Fa-f]{6})$/;

export const createCategorySchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'O nome da categoria é obrigatório')
    .max(60, 'O nome da categoria deve ter no máximo 60 caracteres'),
  colorHex: z
    .string()
    .regex(hexColorRegex, 'colorHex deve estar no formato hexadecimal #RRGGBB')
    .default('#3B82F6'),
  icon: z.string().trim().max(50).nullable().optional(),
});

export const updateCategorySchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  colorHex: z
    .string()
    .regex(hexColorRegex, 'colorHex deve estar no formato hexadecimal #RRGGBB')
    .optional(),
  icon: z.string().trim().max(50).nullable().optional(),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid('ID da categoria deve ser um UUID válido'),
});

export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

