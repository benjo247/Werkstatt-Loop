/**
 * Neon-Postgres-Verbindung.
 *
 * ⚠️ NICHT in Client-Components importieren — nur in Server-Components,
 *    Route-Handlers, Server-Actions oder Migrations.
 *
 * ⚠️ Neon-Driver akzeptiert KEINE verschachtelten sql-Templates.
 *    Wenn du dynamisches SQL brauchst, baue Strings vor dem sql-Call,
 *    nicht im Template.
 */
import { neon } from '@neondatabase/serverless';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL ist nicht gesetzt. Siehe .env.example');
}

export const sql = neon(process.env.DATABASE_URL);
