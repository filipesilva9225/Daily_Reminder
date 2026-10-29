import { z } from 'zod';

const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const validateTimeRange = (data: {
  startTime?: string | null;
  endTime?: string | null;
}) => {
  if (data.startTime && data.endTime) {
    return data.endTime > data.startTime;
  }
  return true;
};

export const daysOfWeekSchema = z
  .array(z.number().int().min(0).max(6))
  .min(1, 'Selecione pelo menos 1 dia da semana (0=Dom a 6=Sáb)')
  .transform((days) => Array.from(new Set(days)).sort((a, b) => a - b));

export const createRoutineSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'O título da atividade recorrente é obrigatório')
      .max(200, 'O título deve ter no máximo 200 caracteres'),
    description: z.string().trim().max(2000).nullable().optional(),
    categoryId: z.string().uuid('categoryId deve ser um UUID válido').nullable().optional(),
    daysOfWeek: daysOfWeekSchema,
    startTime: z
      .string()
      .regex(timeRegex, 'startTime deve estar no formato HH:MM')
      .nullable()
      .optional(),
    endTime: z
      .string()
      .regex(timeRegex, 'endTime deve estar no formato HH:MM')
      .nullable()
      .optional(),
    reminderMinutesBefore: z.number().int().min(0).max(1440).nullable().optional(),
    active: z.boolean().default(true).optional(),
  })
  .refine(validateTimeRange, {
    message: 'O horário de término (endTime) deve ser posterior ao horário de início (startTime)',
    path: ['endTime'],
  });

export const updateRoutineSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    daysOfWeek: daysOfWeekSchema.optional(),
    startTime: z.string().regex(timeRegex, 'Formato HH:MM esperado').nullable().optional(),
    endTime: z.string().regex(timeRegex, 'Formato HH:MM esperado').nullable().optional(),
    reminderMinutesBefore: z.number().int().min(0).max(1440).nullable().optional(),
    active: z.boolean().optional(),
  })
  .refine(validateTimeRange, {
    message: 'O horário de término (endTime) deve ser posterior ao horário de início (startTime)',
    path: ['endTime'],
  });

export const routineIdParamSchema = z.object({
  id: z.string().uuid('ID da rotina deve ser um UUID válido'),
});

export const executionIdParamSchema = z.object({
  executionId: z.string().uuid('ID da execução deve ser um UUID válido'),
});

export const updateExecutionStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'NOT_DONE']),
});

export const weekRoutineQuerySchema = z.object({
  date: z
    .string()
    .regex(dateRegex, 'date deve estar no formato YYYY-MM-DD')
    .optional(),
  weekStartsOn: z.coerce.number().int().min(0).max(1).default(1).optional(),
});

export type CreateRoutineInput = z.infer<typeof createRoutineSchema>;
export type UpdateRoutineInput = z.infer<typeof updateRoutineSchema>;
export type UpdateExecutionStatusInput = z.infer<typeof updateExecutionStatusSchema>;
export type WeekRoutineQuery = z.infer<typeof weekRoutineQuerySchema>;

