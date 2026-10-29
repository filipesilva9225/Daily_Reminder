import { z } from 'zod';

export const subscribePushSchema = z.object({
  endpoint: z.string().url('endpoint deve ser uma URL válida'),
  keys: z.object({
    p256dh: z.string().min(1, 'Chave p256dh é obrigatória'),
    auth: z.string().min(1, 'Chave auth é obrigatória'),
  }),
});

export const pushSubscriptionIdParamSchema = z.object({
  id: z.string().uuid('ID da inscrição deve ser um UUID válido'),
});

export type SubscribePushInput = z.infer<typeof subscribePushSchema>;

