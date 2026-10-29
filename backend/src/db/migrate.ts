import '../instrument';
import path from 'path';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, pool } from './index';
import { Sentry } from '../instrument';

async function runMigrations(): Promise<void> {
  try {
    const migrationsFolder = path.resolve(__dirname, '../../drizzle');
    await migrate(db, { migrationsFolder });
  } catch (error) {
    Sentry.captureException(error);
    throw error;
  } finally {
    await pool.end();
  }
}

void runMigrations();
