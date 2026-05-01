import { getContext } from '@/lib/context';
import { sql } from '@/lib/db';
import EinstellungenView from '@/components/dashboard/EinstellungenView';

export const dynamic = 'force-dynamic';

export default async function EinstellungenPage() {
  const ctx = await getContext();
  const rows = await sql`
    SELECT
      id, slug, name, plan, city, postal_code, street,
      email, phone, website_url, owner_name, vat_id,
      logo_url, primary_color, opening_hours
    FROM workshops
    WHERE id = ${ctx.workshopId}
    LIMIT 1
  `;
  return <EinstellungenView initial={rows[0]} />;
}
