import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

let _sql: NeonQueryFunction<false, false> | null = null;

/** Returns the Neon SQL client for the FARM database, or null if FARM_DATABASE_URL is not set. */
export function getGameDb(): NeonQueryFunction<false, false> | null {
  const url = process.env.FARM_DATABASE_URL;
  if (!url) {
    console.error('[gameDb] FARM_DATABASE_URL is not set (Netlify environment variable missing)');
    return null;
  }
  if (!_sql) _sql = neon(url);
  return _sql;
}
