import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const routineFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'O título da rotina é obrigatório')
      .max(200, 'O título deve ter no máximo 200 caracteres'),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.string().optional(),
    daysOfWeek: z
      .array(z.number().int().min(0).max(6))
      .min(1, 'Selecione pelo menos 1 dia da semana'),
    startTime: z
      .string()
      .optional()
      .refine((v) => !v || timeRegex.test(v), 'Horário inicial inválido'),
    endTime: z
      .string()
      .optional()
      .refine((v) => !v || timeRegex.test(v), 'Horário final inválido'),
    active: z.boolean().default(true),
  })
  .refine(
    (data) => {
      if (data.startTime && data.endTime) {
        return data.endTime > data.startTime;
      }
      return true;
    },
    {
      message: 'O horário de término deve ser posterior ao horário de início',
      path: ['endTime'],
    }
  );

export type RoutineFormValues = z.infer<typeof routineFormSchema>;

