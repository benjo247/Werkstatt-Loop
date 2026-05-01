import { sql } from '@/lib/db';
import { PUBLIC_CORS, corsResponse } from '@/lib/cors';

export const dynamic = 'force-dynamic';

export async function OPTIONS() {
  return new Response(null, { status: 200, headers: PUBLIC_CORS });
}

/**
 * POST /api/public/bookings
 *
 * Body (JSON):
 *   workshop_slug, customer_name, email/phone, license_plate,
 *   service, preferred_date, preferred_time, notes,
 *
 *   // Optional aus Fahrzeugschein-OCR:
 *   vehicle, vin, first_registration, hu_due_date,
 *   vehicle_registration_url,
 *   vehicle_registration_data,
 *
 *   // DSGVO-Konsens (Pflicht wenn Foto verarbeitet wurde):
 *   consent_ocr_at, consent_storage_at, consent_ip
 */
export async function POST(request) {
  let body;
  try {
    body = await request.json();
  } catch {
    return corsResponse({ error: 'Ungültiger JSON-Body' }, { status: 400 });
  }

  const {
    workshop_slug,
    customer_name, email, phone,
    license_plate, vehicle, vin,
    first_registration, hu_due_date,
    service, preferred_date, preferred_time, notes,
    vehicle_registration_url,
    vehicle_registration_data,
    consent_ocr_at,
    consent_storage_at,
  } = body || {};

  if (!workshop_slug || !customer_name || !license_plate || !service || !preferred_date || !preferred_time) {
    return corsResponse({ error: 'Pflichtfelder fehlen' }, { status: 400 });
  }
  if (!email && !phone) {
    return corsResponse({ error: 'E-Mail oder Telefon erforderlich' }, { status: 400 });
  }

  const ws = await sql`SELECT id FROM workshops WHERE slug = ${workshop_slug} LIMIT 1`;
  if (ws.length === 0) {
    return corsResponse({ error: 'Werkstatt nicht gefunden' }, { status: 404 });
  }

  // IP für DSGVO-Audit
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
          || request.headers.get('x-real-ip')
          || null;

  const result = await sql`
    INSERT INTO bookings (
      workshop_id, customer_name, email, phone,
      license_plate, vehicle, vin, first_registration, hu_due_date,
      service, preferred_date, preferred_time, notes,
      vehicle_registration_url, vehicle_registration_data,
      consent_ocr_at, consent_storage_at, consent_ip,
      status, source
    ) VALUES (
      ${ws[0].id},
      ${customer_name}, ${email || null}, ${phone || null},
      ${license_plate}, ${vehicle || null}, ${vin || null},
      ${first_registration || null}, ${hu_due_date || null},
      ${service}, ${preferred_date}, ${preferred_time}, ${notes || null},
      ${vehicle_registration_url || null},
      ${vehicle_registration_data ? JSON.stringify(vehicle_registration_data) : null}::jsonb,
      ${consent_ocr_at || null}, ${consent_storage_at || null}, ${ip},
      'new', 'web'
    )
    RETURNING id, created_at
  `;

  return corsResponse(result[0], { status: 201 });
}
