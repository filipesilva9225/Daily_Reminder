import { z } from 'zod';

export const categoryFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Informe o nome da categoria')
    .max(60, 'Máximo de 60 caracteres'),
  colorHex: z
    .string()
    .regex(/^#([0-9A-Fa-f]{6})$/, 'Selecione uma cor hexadecimal válida (#RRGGBB)'),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

