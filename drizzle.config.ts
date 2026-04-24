import type { Config } from 'drizzle-kit';

export default {
  schema: './lib/db/schema.ts',
  out: './supabase/drizzle-generated',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.SUPABASE_DB_URL ?? '',
  },
  strict: true,
  verbose: true,
} satisfies Config;
