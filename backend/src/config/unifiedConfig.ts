import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().int().positive().default(3333),
  CORS_ORIGIN: z.string().default('http://localhost:5173'),
  DATABASE_URL: z
    .string()
    .min(1, 'DATABASE_URL é obrigatória')
    .default('postgresql://postgres:postgres@localhost:5433/daily_reminder'),
  JWT_SECRET: z
    .string()
    .min(16, 'JWT_SECRET deve ter pelo menos 16 caracteres')
    .default('super-secret-jwt-key-change-in-production-min-32-chars'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SENTRY_DSN: z.string().optional().default(''),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  throw new Error(
    `Falha na validação das variáveis de ambiente: ${JSON.stringify(
      parsedEnv.error.flatten().fieldErrors
    )}`
  );
}

export const unifiedConfig = {
  env: parsedEnv.data.NODE_ENV,
  server: {
    port: parsedEnv.data.PORT,
    corsOrigin: parsedEnv.data.CORS_ORIGIN,
  },
  db: {
    url: parsedEnv.data.DATABASE_URL,
  },
  auth: {
    jwtSecret: parsedEnv.data.JWT_SECRET,
    jwtExpiresIn: parsedEnv.data.JWT_EXPIRES_IN,
    bcryptSaltRounds: 10,
  },
  sentry: {
    dsn: parsedEnv.data.SENTRY_DSN,
    enabled: Boolean(parsedEnv.data.SENTRY_DSN),
  },
} as const;

