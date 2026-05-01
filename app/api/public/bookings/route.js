import { sql } from '@/lib/db';
import { PUBLIC_CORS, corsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

// OPTIONS /api/public/bookings — CORS preflight
export async function OPTIONS() {
  return new Response(null, { status: 200, headers: PUBLIC_CORS });
}

// POST /api/public/bookings — neue Buchung von externer Werkstatt-Webseite
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse({ error: 'Ungültiger JSON-Body' }, { status: 400 });
  }

  const {
    workshop_slug,
    customer_name,
    email,
    phone,
    license_plate,
    vehicle,
    service,
    preferred_date,
    preferred_time,
    notes,
  } = body || {};

  if (!workshop_slug || !customer_name || !license_plate || !service || !preferred_date || !preferred_time) {
    return corsResponse({ error: 'Pflichtfelder fehlen' }, { status: 400 });
  }
  if (!email && !phone) {
    return corsResponse({ error: 'E-Mail oder Telefon erforderlich' }, { status: 400 });
  }

  // Werkstatt per Slug auflösen
  const ws = await sql`SELECT id FROM workshops WHERE slug = ${workshop_slug} LIMIT 1`;
  if (ws.length === 0) {
    return corsResponse({ error: 'Werkstatt nicht gefunden' }, { status: 404 });
  }

  const result = await sql`
    INSERT INTO bookings (
      workshop_id, customer_name, email, phone,
      license_plate, vehicle, service,
      preferred_date, preferred_time, notes, status, source
    ) VALUES (
      ${ws[0].id}, ${customer_name}, ${email || null}, ${phone || null},
      ${license_plate}, ${vehicle || null}, ${service},
      ${preferred_date}, ${preferred_time}, ${notes || null}, 'new', 'web'
    )
    RETURNING id, created_at
  `;

  return corsResponse(result[0], { status: 201 });
}
