import { sql } from '@/lib/db';
import { withContext } from '@/lib/context';

export const dynamic = 'force-dynamic';

// GET /api/bookings — Buchungen für die eigene Werkstatt
export const GET = withContext(async (request, ctx) => {
  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const rows = status
    ? await sql`
        SELECT * FROM bookings
        WHERE workshop_id = ${ctx.workshopId} AND status = ${status}
        ORDER BY created_at DESC LIMIT 100
      `
    : await sql`
        SELECT * FROM bookings
        WHERE workshop_id = ${ctx.workshopId}
        ORDER BY created_at DESC LIMIT 100
      `;

  return Response.json(rows);
});

// PATCH /api/bookings — Status einer Buchung ändern
export const PATCH = withContext(async (request, ctx) => {
  const body = await request.json().catch(() => null);
  if (!body || !body.id || !['new', 'confirmed', 'declined', 'completed', 'no_show'].includes(body.status)) {
    return Response.json({ error: 'Ungültige Eingabe' }, { status: 400 });
  }

  // Wichtig: workshop_id im WHERE — keine fremden Daten ändern
  const result = await sql`
    UPDATE bookings
    SET status = ${body.status}, updated_at = NOW()
    WHERE id = ${body.id} AND workshop_id = ${ctx.workshopId}
    RETURNING id, status
  `;

  if (result.length === 0) {
    return Response.json({ error: 'Nicht gefunden' }, { status: 404 });
  }

  return Response.json(result[0]);
});
