/**
 * High-Level E-Mail-Service
 *
 * Wird aus den API-Routes aufgerufen.
 * Lädt komplette Booking-Daten aus der DB und verschickt die passende Mail.
 *
 * Verwendung:
 *   import { sendBookingReceived } from '@/lib/email-service';
 *   await sendBookingReceived(bookingId);
 */

import { sql } from '@/lib/db';
import { sendEmail } from '@/lib/brevo';
import {
  bookingReceivedTemplate,
  workshopNotificationTemplate,
  bookingConfirmedTemplate,
  bookingCancelledTemplate,
} from '@/lib/email-templates';

/**
 * Lädt alle nötigen Daten für eine Booking-Mail
 */
async function loadBookingContext(bookingId) {
  const rows = await sql`
    SELECT
      b.id, b.appointment_at, b.service_name, b.notes, b.status,
      b.customer_id, b.vehicle_id,
      c.name AS customer_name, c.email AS customer_email, c.phone AS customer_phone,
      v.license_plate, v.brand, v.model,
      w.id AS workshop_id, w.slug, w.name AS workshop_name, w.email AS workshop_email,
      w.phone AS workshop_phone, w.street, w.postal_code, w.city,
      w.primary_color, w.logo_url
    FROM bookings b
    JOIN customers c ON c.id = b.customer_id
    LEFT JOIN vehicles v ON v.id = b.vehicle_id
    JOIN workshops w ON w.id = b.workshop_id
    WHERE b.id = ${bookingId}
    LIMIT 1
  `;

  if (rows.length === 0) return null;
  const r = rows[0];

  return {
    booking: {
      id: r.id,
      appointment_at: r.appointment_at,
      service_name: r.service_name,
      notes: r.notes,
      status: r.status,
    },
    customer: {
      name: r.customer_name,
      email: r.customer_email,
      phone: r.customer_phone,
    },
    vehicle: r.license_plate ? {
      license_plate: r.license_plate,
      brand: r.brand,
      model: r.model,
    } : null,
    workshop: {
      id: r.workshop_id,
      slug: r.slug,
      name: r.workshop_name,
      email: r.workshop_email,
      phone: r.workshop_phone,
      street: r.street,
      postal_code: r.postal_code,
      city: r.city,
      primary_color: r.primary_color,
      logo_url: r.logo_url,
    },
  };
}

/**
 * Bestätigung an Kunde nach Buchung
 */
export async function sendBookingReceived(bookingId) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return { ok: false, error: 'Buchung nicht gefunden' };
  if (!ctx.customer.email) return { ok: false, error: 'Keine Kunden-Mail' };

  const { subject, html } = bookingReceivedTemplate(ctx);

  return sendEmail({
    workshopId: ctx.workshop.id,
    bookingId,
    recipientEmail: ctx.customer.email,
    recipientType: 'customer',
    emailType: 'booking_received',
    senderName: ctx.workshop.name,
    replyTo: ctx.workshop.email,
    subject,
    htmlContent: html,
  });
}

/**
 * Benachrichtigung an Werkstatt über neue Buchung
 */
export async function sendWorkshopNotification(bookingId) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return { ok: false, error: 'Buchung nicht gefunden' };
  if (!ctx.workshop.email) return { ok: false, error: 'Keine Werkstatt-Mail' };

  const { subject, html } = workshopNotificationTemplate(ctx);

  return sendEmail({
    workshopId: ctx.workshop.id,
    bookingId,
    recipientEmail: ctx.workshop.email,
    recipientType: 'workshop',
    emailType: 'workshop_notification',
    senderName: 'WerkstattLoop',
    replyTo: ctx.customer.email,
    subject,
    htmlContent: html,
  });
}

/**
 * Bestätigung an Kunde wenn Werkstatt zugesagt hat
 */
export async function sendBookingConfirmed(bookingId) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return { ok: false, error: 'Buchung nicht gefunden' };
  if (!ctx.customer.email) return { ok: false, error: 'Keine Kunden-Mail' };

  const { subject, html } = bookingConfirmedTemplate(ctx);

  return sendEmail({
    workshopId: ctx.workshop.id,
    bookingId,
    recipientEmail: ctx.customer.email,
    recipientType: 'customer',
    emailType: 'booking_confirmed',
    senderName: ctx.workshop.name,
    replyTo: ctx.workshop.email,
    subject,
    htmlContent: html,
  });
}

/**
 * Absage an Kunde wenn Werkstatt nicht kann
 */
export async function sendBookingCancelled(bookingId, cancellationReason = null) {
  const ctx = await loadBookingContext(bookingId);
  if (!ctx) return { ok: false, error: 'Buchung nicht gefunden' };
  if (!ctx.customer.email) return { ok: false, error: 'Keine Kunden-Mail' };

  const { subject, html } = bookingCancelledTemplate({ ...ctx, cancellationReason });

  return sendEmail({
    workshopId: ctx.workshop.id,
    bookingId,
    recipientEmail: ctx.customer.email,
    recipientType: 'customer',
    emailType: 'booking_cancelled',
    senderName: ctx.workshop.name,
    replyTo: ctx.workshop.email,
    subject,
    htmlContent: html,
  });
}
