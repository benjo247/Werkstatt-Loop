import { sql } from '@/lib/db';
import { notFound } from 'next/navigation';
import BookingFlow from '@/components/booking/BookingFlow';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const rows = await sql`SELECT name FROM workshops WHERE slug = ${slug} LIMIT 1`;
  if (rows.length === 0) return { title: 'Werkstatt nicht gefunden' };
  return {
    title: `Termin online buchen · ${rows[0].name}`,
    description: 'Werkstatt-Termin online buchen — kein Anruf nötig.',
  };
}

export default async function PublicBookingPage({ params }) {
  const { slug } = await params;

  const rows = await sql`
    SELECT slug, name, primary_color, logo_url, phone, email,
           street, postal_code, city, website_url
    FROM workshops
    WHERE slug = ${slug}
    LIMIT 1
  `;

  if (rows.length === 0) notFound();

  return <BookingFlow workshop={rows[0]} />;
}
