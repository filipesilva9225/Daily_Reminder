import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import { unifiedConfig } from '../config/unifiedConfig';
import * as schema from './schema';

const isLocalhost =
  unifiedConfig.db.url.includes('localhost') ||
  unifiedConfig.db.url.includes('127.0.0.1');

const requiresSsl =
  !isLocalhost &&
  (unifiedConfig.env === 'production' ||
    unifiedConfig.db.url.includes('sslmode=require') ||
    unifiedConfig.db.url.includes('neon.tech'));

export const pool = new Pool({
  connectionString: unifiedConfig.db.url,
  max: 10,
  ...(requiresSsl ? { ssl: { rejectUnauthorized: false } } : {}),
});

export const db = drizzle(pool, { schema });
export type DatabaseClient = typeof db;
