import { sql } from '@/lib/db';
import { withContext } from '@/lib/context';

export const dynamic = 'force-dynamic';

/**
 * GET /api/bookings/[id]/registration-image
 *
 * Auth: Werkstatt-Owner über Clerk + getContext
 * Prüft, dass Buchung zur eigenen Werkstatt gehört.
 * Loggt Zugriff fürs Audit.
 *
 * Antwort: { url: string, expires_in_minutes: 5 }
 *
 * Hinweis: Auf Vercel Blob Free Tier sind URLs technisch "public",
 * werden aber NUR über diesen authentifizierten Endpoint herausgegeben.
 * Sobald Pro-Tier verfügbar: Umstellung auf echte Signed URLs.
 */
export const GET = withContext(async (request, ctx, { params }) => {
  const id = params?.id;
  if (!id) {
    return Response.json({ error: 'ID fehlt' }, { status: 400 });
  }

  const rows = await sql`
    SELECT vehicle_registration_url
    FROM bookings
    WHERE id = ${id} AND workshop_id = ${ctx.workshopId}
    LIMIT 1
  `;

  if (rows.length === 0) {
    return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
  }
  if (!rows[0].vehicle_registration_url) {
    return Response.json({ error: 'Kein Bild vorhanden' }, { status: 404 });
  }

  // Audit-Log
  console.log(`[audit] User ${ctx.clerkUserId} (workshop ${ctx.workshopId}) abgerufen: registration image für booking ${id}`);

  return Response.json({
    url: rows[0].vehicle_registration_url,
    expires_in_minutes: 5,
  });
});
