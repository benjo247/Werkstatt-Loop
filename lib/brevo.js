/**
 * Brevo E-Mail-Client für WerkstattLoop
 *
 * White-Label-Strategie:
 *   - Anzeigename = Werkstatt-Name (kommt aus Settings)
 *   - Technischer Absender = BREVO_SENDER_EMAIL (deine verifizierte Adresse)
 *   - Reply-To = Werkstatt-eigene E-Mail (Antworten gehen an Werkstatt)
 *   - Logo + Primärfarbe = aus Werkstatt-Settings
 *
 * Audit-Log: Jede Mail wird in email_log eingetragen (Migration 009).
 */

import { sql } from '@/lib/db';

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

/**
 * Schickt eine E-Mail via Brevo + loggt in email_log.
 *
 * @param {Object} opts
 * @param {number} opts.workshopId
 * @param {number|null} [opts.bookingId]
 * @param {string} opts.recipientEmail
 * @param {'customer'|'workshop'} opts.recipientType
 * @param {string} opts.emailType - z.B. 'booking_received'
 * @param {string} opts.senderName - Anzeigename, z.B. "Jupp's Garage"
 * @param {string} [opts.replyTo]
 * @param {string} opts.subject
 * @param {string} opts.htmlContent
 * @param {string} [opts.textContent]
 */
export async function sendEmail(opts) {
  const {
    workshopId,
    bookingId = null,
    recipientEmail,
    recipientType,
    emailType,
    senderName,
    replyTo,
    subject,
    htmlContent,
    textContent,
  } = opts;

  if (!process.env.BREVO_API_KEY) {
    console.error('[brevo] BREVO_API_KEY fehlt in Environment-Variablen');
    await logEmail({
      workshopId, bookingId, recipientEmail, recipientType, emailType,
      subject, status: 'failed', errorMessage: 'BREVO_API_KEY not configured',
    });
    return { ok: false, error: 'API-Key fehlt' };
  }

  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!senderEmail) {
    console.error('[brevo] BREVO_SENDER_EMAIL fehlt');
    return { ok: false, error: 'Sender-Adresse fehlt' };
  }

  const payload = {
    sender: { name: senderName, email: senderEmail },
    to: [{ email: recipientEmail }],
    replyTo: replyTo ? { email: replyTo, name: senderName } : undefined,
    subject,
    htmlContent,
    textContent: textContent || stripHtml(htmlContent),
  };

  try {
    const res = await fetch(BREVO_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'api-key': process.env.BREVO_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();

    if (!res.ok) {
      console.error('[brevo] Send failed:', data);
      await logEmail({
        workshopId, bookingId, recipientEmail, recipientType, emailType,
        subject, status: 'failed',
        errorMessage: data.message || `HTTP ${res.status}`,
      });
      return { ok: false, error: data.message || 'Brevo-Fehler' };
    }

    await logEmail({
      workshopId, bookingId, recipientEmail, recipientType, emailType,
      subject, status: 'sent', brevoMessageId: data.messageId,
    });

    return { ok: true, messageId: data.messageId };
  } catch (err) {
    console.error('[brevo] Exception:', err);
    await logEmail({
      workshopId, bookingId, recipientEmail, recipientType, emailType,
      subject, status: 'failed', errorMessage: err.message,
    });
    return { ok: false, error: err.message };
  }
}

async function logEmail({
  workshopId, bookingId, recipientEmail, recipientType,
  emailType, subject, status,
  brevoMessageId = null, errorMessage = null,
}) {
  try {
    await sql`
      INSERT INTO email_log (
        workshop_id, booking_id, recipient_email, recipient_type,
        email_type, subject, brevo_message_id, status, error_message
      ) VALUES (
        ${workshopId}, ${bookingId}, ${recipientEmail}, ${recipientType},
        ${emailType}, ${subject}, ${brevoMessageId}, ${status}, ${errorMessage}
      )
    `;
  } catch (err) {
    console.error('[brevo] email_log insert failed:', err);
  }
}

function stripHtml(html) {
  return html
    .replace(/<style[\s\S]*?<\/style>/g, '')
    .replace(/<script[\s\S]*?<\/script>/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}
