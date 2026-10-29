import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const taskFormSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'O título da tarefa é obrigatório')
      .max(200, 'O título deve ter no máximo 200 caracteres'),
    description: z.string().trim().max(2000).optional(),
    categoryId: z.string().optional(),
    scheduledDate: z.string().regex(dateRegex, 'Selecione uma data válida'),
    startTime: z
      .string()
      .optional()
      .refine((v) => !v || timeRegex.test(v), 'Horário inicial inválido (HH:MM)'),
    endTime: z
      .string()
      .optional()
      .refine((v) => !v || timeRegex.test(v), 'Horário final inválido (HH:MM)'),
    priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).default('MEDIUM'),
    reminderMinutesBefore: z.number().int().min(0).max(1440).nullable().optional(),
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

export const rescheduleFormSchema = z
  .object({
    scheduledDate: z.string().regex(dateRegex, 'Informe a nova data (YYYY-MM-DD)'),
    startTime: z
      .string()
      .optional()
      .refine((v) => !v || timeRegex.test(v), 'Horário inicial inválido'),
    endTime: z
      .string()
      .optional()
      .refine((v) => !v || timeRegex.test(v), 'Horário final inválido'),
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

export type TaskFormValues = z.infer<typeof taskFormSchema>;
export type RescheduleFormValues = z.infer<typeof rescheduleFormSchema>;

