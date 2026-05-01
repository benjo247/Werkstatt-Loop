/**
 * Multi-Tenant-Auflösung.
 *
 * `getContext()` liest den eingeloggten Clerk-User und ermittelt die zugehörige
 * Werkstatt aus der `users`-Tabelle. Die workshop_id ist Pflichtfilter
 * für alle weiteren DB-Queries.
 *
 * `withContext(handler)` wraps Route-Handler so, dass `ctx` als zweites
 * Argument bereitsteht und Auth-Fehler korrekt 401 zurückgeben.
 */
import { auth } from '@clerk/nextjs/server';
import { sql } from './db';

export async function getContext() {
  const { userId } = await auth();
  if (!userId) {
    const err = new Error('Unauthorized');
    err.status = 401;
    throw err;
  }

  const rows = await sql`
    SELECT
      u.id            AS user_id,
      u.role          AS role,
      u.email         AS user_email,
      w.id            AS workshop_id,
      w.slug          AS workshop_slug,
      w.name          AS workshop_name,
      w.plan          AS plan
    FROM users u
    JOIN workshops w ON w.id = u.workshop_id
    WHERE u.clerk_user_id = ${userId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    const err = new Error('Kein Werkstatt-Profil verknüpft');
    err.status = 404;
    err.code = 'NO_WORKSHOP';
    throw err;
  }

  const row = rows[0];
  return {
    clerkUserId: userId,
    userId: row.user_id,
    role: row.role,
    workshopId: row.workshop_id,
    workshopSlug: row.workshop_slug,
    workshopName: row.workshop_name,
    plan: row.plan,
  };
}

/**
 * Wrappt einen Route-Handler. Standard-Response bei Auth-Fehlern,
 * gibt sonst (request, ctx, ...args) an den eigentlichen Handler.
 */
export function withContext(handler) {
  return async (request, ...args) => {
    let ctx;
    try {
      ctx = await getContext();
    } catch (err) {
      const status = err.status || 500;
      return Response.json({ error: err.message, code: err.code }, { status });
    }
    try {
      return await handler(request, ctx, ...args);
    } catch (err) {
      console.error('[withContext] handler error:', err);
      return Response.json({ error: err.message }, { status: err.status || 500 });
    }
  };
}
