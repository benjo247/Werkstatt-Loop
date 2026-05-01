import { Webhook } from 'svix';
import { headers } from 'next/headers';
import { sql } from '@/lib/db';

export const dynamic = 'force-dynamic';

/**
 * Clerk-Webhook: legt bei user.created automatisch eine Werkstatt + Verknüpfung an.
 * Webhook-Secret aus dem Clerk-Dashboard kommt via CLERK_WEBHOOK_SECRET.
 */
export async function POST(request) {
  const secret = process.env.CLERK_WEBHOOK_SECRET;
  if (!secret) {
    return Response.json({ error: 'Webhook-Secret nicht konfiguriert' }, { status: 500 });
  }

  const hdrs = await headers();
  const svix_id = hdrs.get('svix-id');
  const svix_ts = hdrs.get('svix-timestamp');
  const svix_sig = hdrs.get('svix-signature');

  if (!svix_id || !svix_ts || !svix_sig) {
    return Response.json({ error: 'Fehlende svix-Header' }, { status: 400 });
  }

  const payload = await request.text();
  let evt;
  try {
    const wh = new Webhook(secret);
    evt = wh.verify(payload, {
      'svix-id': svix_id,
      'svix-timestamp': svix_ts,
      'svix-signature': svix_sig,
    });
  } catch (err) {
    console.error('Webhook-Signatur ungültig:', err);
    return Response.json({ error: 'Ungültige Signatur' }, { status: 401 });
  }

  if (evt.type === 'user.created') {
    const userId = evt.data.id;
    const email = evt.data.email_addresses?.[0]?.email_address || null;

    // Idempotenz: prüfen, ob User schon existiert
    const existing = await sql`SELECT id FROM users WHERE clerk_user_id = ${userId} LIMIT 1`;
    if (existing.length > 0) {
      return Response.json({ ok: true, note: 'already linked' });
    }

    // Neue Werkstatt anlegen mit Default-Werten;
    // der Owner kann sie später im Onboarding personalisieren.
    const slug = `werkstatt-${userId.slice(-8).toLowerCase()}`;
    const ws = await sql`
      INSERT INTO workshops (slug, name, plan, email)
      VALUES (${slug}, 'Meine Werkstatt', 'free', ${email})
      RETURNING id
    `;

    await sql`
      INSERT INTO users (clerk_user_id, workshop_id, email, role)
      VALUES (${userId}, ${ws[0].id}, ${email}, 'owner')
    `;

    console.log(`[clerk webhook] User ${userId} → Workshop ${ws[0].id} (${slug})`);
  }

  return Response.json({ ok: true });
}
