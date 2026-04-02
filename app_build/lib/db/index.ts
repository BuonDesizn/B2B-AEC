import { Kysely, PostgresDialect } from 'kysely';
import { Pool } from 'pg';

// Import generated types
import type { DB } from './types';

// Create a connection pool
const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL || 
    `postgres://postgres:${process.env.SUPABASE_SERVICE_ROLE_KEY}@db.lwrjwshjrvntesnateea.supabase.co:5432/postgres?sslmode=require`,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

// Create the dialect
const dialect = new PostgresDialect({ pool });

// Create and export the Kysely instance
export const db = new Kysely<DB>({
  dialect,
});

// Export types for convenience
export type { DB };