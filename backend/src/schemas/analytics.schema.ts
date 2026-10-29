import { z } from 'zod';

const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const weeklyAnalyticsQuerySchema = z.object({
  date: z
    .string()
    .regex(dateRegex, 'date deve estar no formato YYYY-MM-DD')
    .optional(),
  weekStartsOn: z.coerce.number().int().min(0).max(1).default(1).optional(),
});

export type WeeklyAnalyticsQuery = z.infer<typeof weeklyAnalyticsQuerySchema>;

