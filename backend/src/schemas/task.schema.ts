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

export const taskPrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH']);
export const taskStatusSchema = z.enum([
  'PENDING',
  'OVERDUE',
  'COMPLETED',
  'NOT_DONE',
]);

export const createTaskSchema = z
  .object({
    title: z
      .string()
      .trim()
      .min(1, 'O título da tarefa é obrigatório')
      .max(200, 'O título deve ter no máximo 200 caracteres'),
    description: z.string().trim().max(2000).nullable().optional(),
    categoryId: z.string().uuid('categoryId deve ser um UUID válido').nullable().optional(),
    scheduledDate: z
      .string()
      .regex(dateRegex, 'scheduledDate deve estar no formato YYYY-MM-DD'),
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
    priority: taskPrioritySchema.default('MEDIUM'),
    reminderMinutesBefore: z.number().int().min(0).max(1440).nullable().optional(),
  })
  .refine(validateTimeRange, {
    message: 'O horário de término (endTime) deve ser posterior ao horário de início (startTime)',
    path: ['endTime'],
  });

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(200).optional(),
    description: z.string().trim().max(2000).nullable().optional(),
    categoryId: z.string().uuid().nullable().optional(),
    scheduledDate: z.string().regex(dateRegex, 'Formato YYYY-MM-DD esperado').optional(),
    startTime: z.string().regex(timeRegex, 'Formato HH:MM esperado').nullable().optional(),
    endTime: z.string().regex(timeRegex, 'Formato HH:MM esperado').nullable().optional(),
    priority: taskPrioritySchema.optional(),
    status: taskStatusSchema.optional(),
    reminderMinutesBefore: z.number().int().min(0).max(1440).nullable().optional(),
  })
  .refine(validateTimeRange, {
    message: 'O horário de término (endTime) deve ser posterior ao horário de início (startTime)',
    path: ['endTime'],
  });

export const rescheduleTaskSchema = z
  .object({
    scheduledDate: z
      .string()
      .regex(dateRegex, 'A nova data (scheduledDate) deve estar no formato YYYY-MM-DD'),
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
  })
  .refine(validateTimeRange, {
    message: 'O horário de término (endTime) deve ser posterior ao horário de início (startTime)',
    path: ['endTime'],
  });

export const updateTaskStatusSchema = z.object({
  status: z.enum(['PENDING', 'COMPLETED', 'NOT_DONE', 'OVERDUE']),
});

export const listTasksQuerySchema = z.object({
  startDate: z.string().regex(dateRegex, 'startDate deve ser YYYY-MM-DD').optional(),
  endDate: z.string().regex(dateRegex, 'endDate deve ser YYYY-MM-DD').optional(),
  status: taskStatusSchema.optional(),
  priority: taskPrioritySchema.optional(),
  categoryId: z.string().uuid('categoryId inválido').optional(),
  includeOverdue: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
});

export const taskIdParamSchema = z.object({
  id: z.string().uuid('ID da tarefa deve ser um UUID válido'),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type RescheduleTaskInput = z.infer<typeof rescheduleTaskSchema>;
export type UpdateTaskStatusInput = z.infer<typeof updateTaskStatusSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;

