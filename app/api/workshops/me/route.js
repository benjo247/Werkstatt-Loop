import { sql } from '@/lib/db';
import { withContext } from '@/lib/context';

export const dynamic = 'force-dynamic';

export const GET = withContext(async (request, ctx) => {
  const rows = await sql`
    SELECT
      id, slug, name, plan, city, postal_code, street,
      email, phone, website_url, owner_name, vat_id,
      logo_url, primary_color, opening_hours, data_minimal_mode,
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

export const PATCH = withContext(async (request, ctx) => {
  const body = await request.json().catch(() => null);
  if (!body) return Response.json({ error: 'Ungültiger Body' }, { status: 400 });

  const allowed = [
    'name', 'city', 'postal_code', 'street',
    'email', 'phone', 'website_url',
    'owner_name', 'vat_id',
    'logo_url', 'primary_color', 'opening_hours',
    'data_minimal_mode',
  ];
  const updates = {};
  for (const key of allowed) {
    if (key in body) updates[key] = body[key];
  }
  if (Object.keys(updates).length === 0) {
    return Response.json({ error: 'Keine erlaubten Felder' }, { status: 400 });
  }
  if (updates.primary_color && !/^#[0-9a-fA-F]{6}$/.test(updates.primary_color)) {
    return Response.json({ error: 'primary_color muss Hex sein' }, { status: 400 });
  }

  const result = await sql`
    UPDATE workshops SET
      name              = COALESCE(${updates.name ?? null}, name),
      city              = COALESCE(${updates.city ?? null}, city),
      postal_code       = COALESCE(${updates.postal_code ?? null}, postal_code),
      street            = COALESCE(${updates.street ?? null}, street),
      email             = COALESCE(${updates.email ?? null}, email),
      phone             = COALESCE(${updates.phone ?? null}, phone),
      website_url       = COALESCE(${updates.website_url ?? null}, website_url),
      owner_name        = COALESCE(${updates.owner_name ?? null}, owner_name),
      vat_id            = COALESCE(${updates.vat_id ?? null}, vat_id),
      logo_url          = COALESCE(${updates.logo_url ?? null}, logo_url),
      primary_color     = COALESCE(${updates.primary_color ?? null}, primary_color),
      opening_hours     = COALESCE(${updates.opening_hours ? JSON.stringify(updates.opening_hours) : null}::jsonb, opening_hours),
      data_minimal_mode = COALESCE(${updates.data_minimal_mode ?? null}, data_minimal_mode),
      updated_at        = NOW()
    WHERE id = ${ctx.workshopId}
    RETURNING id, slug, name, plan, city, postal_code, street, email, phone,
              website_url, owner_name, vat_id, logo_url, primary_color,
              opening_hours, data_minimal_mode, updated_at
  `;
  return Response.json(result[0]);
});
