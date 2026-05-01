#!/usr/bin/env node
/**
 * Migrations-Runner. Idempotent.
 * Liest migrations/*.sql, prüft schema_migrations, führt nur neue aus.
 *
 * Aufruf: npm run migrate
 *
 * ⚠️ Erwartet DATABASE_URL als ENV-Variable.
 *    Lokal: aus .env.local; auf Vercel via `vercel env pull .env.local` ziehen.
 */
import { neon } from '@neondatabase/serverless';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

if (!process.env.DATABASE_URL) {
  // Versuche .env.local zu laden
  const envPath = path.join(__dirname, '..', '.env.local');
  if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach(line => {
      const m = line.match(/^([A-Z_]+)=(.*)$/);
      if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^"|"$/g, '');
    });
  }
}

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL nicht gesetzt. Lege .env.local an oder export DATABASE_URL=...');
  process.exit(1);
}

const sql = neon(process.env.DATABASE_URL);

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      id           INTEGER PRIMARY KEY,
      name         TEXT NOT NULL,
      applied_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;

  const applied = await sql`SELECT id FROM schema_migrations ORDER BY id`;
  const appliedIds = new Set(applied.map(r => r.id));

  const dir = path.join(__dirname, '..', 'migrations');
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.sql')).sort();

  let ran = 0;
  for (const file of files) {
    const id = parseInt(file.split('_')[0], 10);
    if (!Number.isFinite(id)) continue;
    if (appliedIds.has(id)) continue;

    console.log(`→ ${file}`);
    const content = fs.readFileSync(path.join(dir, file), 'utf-8');

    // Statements aufteilen (einfacher Parser; reicht für unsere Migrations)
    // Splittet auf Semikolons, ignoriert solche in Strings/Kommentaren.
    const statements = splitStatements(content);

    for (const stmt of statements) {
      const trimmed = stmt.trim();
      if (!trimmed || trimmed.startsWith('--')) continue;
      try {
        await sql.query(trimmed);
      } catch (err) {
        console.error(`  ✗ Fehler in ${file}:`, err.message);
        console.error(`    Statement: ${trimmed.slice(0, 100)}...`);
        throw err;
      }
    }

    await sql`INSERT INTO schema_migrations (id, name) VALUES (${id}, ${file})`;
    console.log(`  ✓ ${file}`);
    ran++;
  }

  console.log(ran === 0 ? 'Keine neuen Migrations.' : `Fertig. ${ran} Migration(s) angewendet.`);
}

function splitStatements(sqlText) {
  // Vereinfacht: respektiert nur '--' Kommentare und einzelne Semikolons.
  // Für komplexere Migrations (Funktionen, Triggers mit $$) erweitern.
  const out = [];
  let buf = '';
  let inSingle = false;
  let inLineComment = false;
  for (let i = 0; i < sqlText.length; i++) {
    const c = sqlText[i];
    const next = sqlText[i + 1];
    if (inLineComment) {
      buf += c;
      if (c === '\n') inLineComment = false;
      continue;
    }
    if (!inSingle && c === '-' && next === '-') {
      inLineComment = true;
      buf += c;
      continue;
    }
    if (c === "'" && !inLineComment) inSingle = !inSingle;
    if (c === ';' && !inSingle) {
      out.push(buf);
      buf = '';
      continue;
    }
    buf += c;
  }
  if (buf.trim()) out.push(buf);
  return out;
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
