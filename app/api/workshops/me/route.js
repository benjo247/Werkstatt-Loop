import { sql } from '@/lib/db';
import { withContext } from '@/lib/context';

export const dynamic = 'force-dynamic';

// GET — eigene Werkstatt laden
export const GET = withContext(async (request, ctx) => {
  const rows = await sql`
    SELECT
      id, slug, name, plan, city, postal_code, street,
      email, phone, website_url, owner_name, vat_id,
      logo_url, primary_color, opening_hours,
      created_at, updated_at
    FROM workshops
    WHERE id = ${ctx.workshopId}
    LIMIT 1
  `;
  if (rows.length === 0) {
    return Response.json({ error: 'Werkstatt nicht gefunden' }, { status: 404 });
  }
  return Response.json(rows[0]);
});

// PATCH — Werkstatt-Profil aktualisieren
export const PATCH = withContext(async (request, ctx) => {
  const body = await request.json().catch(() => null);
  if (!body) {
    return Response.json({ error: 'Ungültiger Body' }, { status: 400 });
  }

  // Whitelist erlaubter Felder. Slug & plan ändert nur der Admin separat.
  const allowed = [
    'name', 'city', 'postal_code', 'street',
    'email', 'phone', 'website_url',
    'owner_name', 'vat_id',
    'logo_url', 'primary_color', 'opening_hours',
  ];

  const updates = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Keine erlaubten Felder im Body' }, { status: 400 });
  }

  // Validierung der Hex-Farbe
  if (updates.primary_color && !/^#[0-9a-fA-F]{6}$/.test(updates.primary_color)) {
    return Response.json({ error: 'primary_color muss Hex-Code sein, z.B. #dc2626' }, { status: 400 });
  }

  // Update — wir schreiben einzelne Felder direkt, weil Neon-Driver
  // keine verschachtelten sql-Templates akzeptiert.
  const result = await sql`
    UPDATE workshops SET
      name           = COALESCE(${updates.name ?? null},           name),
      city           = COALESCE(${updates.city ?? null},           city),
      postal_code    = COALESCE(${updates.postal_code ?? null},    postal_code),
      street         = COALESCE(${updates.street ?? null},         street),
      email          = COALESCE(${updates.email ?? null},          email),
      phone          = COALESCE(${updates.phone ?? null},          phone),
      website_url    = COALESCE(${updates.website_url ?? null},    website_url),
      owner_name     = COALESCE(${updates.owner_name ?? null},     owner_name),
      vat_id         = COALESCE(${updates.vat_id ?? null},         vat_id),
      logo_url       = COALESCE(${updates.logo_url ?? null},       logo_url),
      primary_color  = COALESCE(${updates.primary_color ?? null},  primary_color),
      opening_hours  = COALESCE(${updates.opening_hours ? JSON.stringify(updates.opening_hours) : null}::jsonb,  opening_hours),
      updated_at     = NOW()
    WHERE id = ${ctx.workshopId}
    RETURNING id, slug, name, plan, city, postal_code, street, email, phone,
              website_url, owner_name, vat_id, logo_url, primary_color,
              opening_hours, updated_at
  `;

  return Response.json(result[0]);
});
