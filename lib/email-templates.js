/**
 * E-Mail-Templates für WerkstattLoop
 *
 * Vier Templates für die Buchungs-Lifecycle:
 *   1. bookingReceivedTemplate     — an Kunde, sofort nach Buchung
 *   2. workshopNotificationTemplate — an Werkstatt, sofort nach Buchung
 *   3. bookingConfirmedTemplate    — an Kunde, wenn Werkstatt zusagt
 *   4. bookingCancelledTemplate    — an Kunde, wenn Werkstatt absagt
 *
 * Dynamische Variablen kommen aus Workshop-Settings:
 *   logo_url, primary_color, name, phone, email, street, postal_code, city
 */

import { formatBerlinTime, formatBerlinDate } from '@/lib/format';

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://werkstatt-loop.vercel.app';

/**
 * Gemeinsamer Wrapper für alle Mails: Header, Body, Footer, WerkstattLoop-Hinweis
 */
function emailLayout({ workshop, content, primaryColor }) {
  const color = primaryColor || workshop.primary_color || '#dc2626';

  return `<!DOCTYPE html>
<html lang="de">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<style>
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f8fafc; margin: 0; padding: 0; color: #1e293b; line-height: 1.6; }
  .wrap { max-width: 600px; margin: 0 auto; background: white; }
  .header { background: #0f172a; padding: 28px 32px; text-align: center; position: relative; }
  .header::before { content: ""; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: ${color}; }
  .header-logo { background: white; display: inline-block; padding: 10px 14px; border-radius: 10px; margin-bottom: 10px; }
  .header-logo img { max-height: 48px; display: block; }
  .header-name { color: white; font-size: 18px; font-weight: 700; margin: 4px 0 0; }
  .header-tagline { color: #94a3b8; font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 700; margin-top: 4px; }
  .body { padding: 32px; }
  .body p { margin: 0 0 14px; font-size: 15px; color: #334155; }
  .body strong { color: #0f172a; }
  h1.title { font-size: 22px; font-weight: 700; margin: 0 0 16px; color: #0f172a; }
  .info-box { background: #f8fafc; border-radius: 12px; padding: 18px 22px; margin: 20px 0; }
  .info-row { display: block; padding: 6px 0; font-size: 14px; border-bottom: 1px dashed #e2e8f0; }
  .info-row:last-child { border-bottom: 0; }
  .info-label { color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; font-weight: 700; margin-bottom: 2px; }
  .info-value { color: #0f172a; font-weight: 600; }
  .cta-wrap { text-align: center; padding: 16px 0; }
  .cta-btn { display: inline-block; background: ${color}; color: white !important; text-decoration: none; padding: 14px 32px; border-radius: 999px; font-weight: 700; font-size: 15px; }
  .footer { background: #f8fafc; padding: 18px 32px; text-align: center; border-top: 1px solid #e2e8f0; }
  .footer-name { font-weight: 700; color: #0f172a; font-size: 14px; }
  .footer-contact { font-size: 12px; color: #64748b; margin-top: 4px; }
  .footer-contact a { color: ${color}; text-decoration: none; }
  .wl-footer { background: #0f172a; padding: 14px 32px; text-align: center; color: #64748b; font-size: 10px; }
  .wl-footer strong { color: #cbd5e1; font-weight: 600; }
</style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      ${workshop.logo_url ? `<div class="header-logo"><img src="${workshop.logo_url}" alt="${escapeHtml(workshop.name)}"></div>` : ''}
      <div class="header-name">${escapeHtml(workshop.name)}</div>
      <div class="header-tagline">Kfz-Meisterbetrieb</div>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      <div class="footer-name">${escapeHtml(workshop.name)}</div>
      <div class="footer-contact">
        ${workshop.street ? `${escapeHtml(workshop.street)} · ${escapeHtml(workshop.postal_code || '')} ${escapeHtml(workshop.city || '')}<br>` : ''}
        ${workshop.phone ? `📞 <a href="tel:${workshop.phone}">${escapeHtml(workshop.phone)}</a>` : ''}
        ${workshop.phone && workshop.email ? ' · ' : ''}
        ${workshop.email ? `<a href="mailto:${workshop.email}">${escapeHtml(workshop.email)}</a>` : ''}
      </div>
    </div>
    <div class="wl-footer">
      Diese E-Mail erhalten Sie als Kunde von ${escapeHtml(workshop.name)}.<br>
      Versendet über <strong>WerkstattLoop</strong>
    </div>
  </div>
</body>
</html>`;
}

function escapeHtml(str) {
  if (str === null || str === undefined) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDateTime(dateUTC) {
  return `${formatBerlinDate(dateUTC)} um ${formatBerlinTime(dateUTC)} Uhr`;
}

// ========================================
// Template 1: Bestätigung an Kunde (Buchungs-Eingang)
// ========================================
export function bookingReceivedTemplate({ workshop, booking, customer, vehicle }) {
  const content = `
    <h1 class="title">Termin angefragt — wir bestätigen kurz</h1>

    <p>Hallo ${escapeHtml(customer.name)},</p>

    <p>vielen Dank für Ihre Terminanfrage. Wir prüfen den Wunschtermin und melden uns innerhalb der nächsten Stunden mit einer Bestätigung.</p>

    <div class="info-box">
      <div class="info-row">
        <div class="info-label">Wunschtermin</div>
        <div class="info-value">${formatDateTime(booking.appointment_at)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Service</div>
        <div class="info-value">${escapeHtml(booking.service_name)}</div>
      </div>
      ${vehicle ? `
      <div class="info-row">
        <div class="info-label">Fahrzeug</div>
        <div class="info-value">${escapeHtml(vehicle.brand || '')} ${escapeHtml(vehicle.model || '')} · ${escapeHtml(vehicle.license_plate || '')}</div>
      </div>` : ''}
    </div>

    <p>Falls Sie etwas ändern möchten, antworten Sie einfach auf diese Mail oder rufen Sie uns an.</p>

    <p style="margin-top:24px">Beste Grüße<br><strong>${escapeHtml(workshop.name)}</strong></p>
  `;

  return {
    subject: `Termin angefragt — ${workshop.name}`,
    html: emailLayout({ workshop, content }),
  };
}

// ========================================
// Template 2: Benachrichtigung an Werkstatt
// ========================================
export function workshopNotificationTemplate({ workshop, booking, customer, vehicle }) {
  const content = `
    <h1 class="title">🔔 Neue Buchungs-Anfrage</h1>

    <p>Hi ${escapeHtml(workshop.name)},</p>

    <p>es ist eine neue Online-Buchung eingegangen:</p>

    <div class="info-box">
      <div class="info-row">
        <div class="info-label">Wunschtermin</div>
        <div class="info-value">${formatDateTime(booking.appointment_at)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Service</div>
        <div class="info-value">${escapeHtml(booking.service_name)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Kunde</div>
        <div class="info-value">${escapeHtml(customer.name)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Kontakt</div>
        <div class="info-value">
          ${customer.email ? `${escapeHtml(customer.email)}<br>` : ''}
          ${customer.phone ? escapeHtml(customer.phone) : ''}
        </div>
      </div>
      ${vehicle ? `
      <div class="info-row">
        <div class="info-label">Fahrzeug</div>
        <div class="info-value">${escapeHtml(vehicle.brand || '')} ${escapeHtml(vehicle.model || '')} · ${escapeHtml(vehicle.license_plate || '')}</div>
      </div>` : ''}
      ${booking.notes ? `
      <div class="info-row">
        <div class="info-label">Anmerkung</div>
        <div class="info-value">${escapeHtml(booking.notes)}</div>
      </div>` : ''}
    </div>

    <div class="cta-wrap">
      <a href="${APP_URL}/dashboard" class="cta-btn">Im Dashboard ansehen</a>
    </div>

    <p style="font-size:13px;color:#64748b;text-align:center">Bitte zeitnah bestätigen oder absagen — der Kunde wartet auf Rückmeldung.</p>
  `;

  return {
    subject: `Neue Buchung: ${customer.name} — ${formatBerlinDate(booking.appointment_at)}`,
    html: emailLayout({ workshop, content }),
  };
}

// ========================================
// Template 3: Bestätigung an Kunde (Werkstatt hat zugesagt)
// ========================================
export function bookingConfirmedTemplate({ workshop, booking, customer, vehicle }) {
  const content = `
    <h1 class="title">✓ Ihr Termin ist bestätigt</h1>

    <p>Hallo ${escapeHtml(customer.name)},</p>

    <p>Ihr Termin bei <strong>${escapeHtml(workshop.name)}</strong> ist fest eingeplant:</p>

    <div class="info-box">
      <div class="info-row">
        <div class="info-label">Termin</div>
        <div class="info-value" style="font-size:16px">${formatDateTime(booking.appointment_at)}</div>
      </div>
      <div class="info-row">
        <div class="info-label">Service</div>
        <div class="info-value">${escapeHtml(booking.service_name)}</div>
      </div>
      ${vehicle ? `
      <div class="info-row">
        <div class="info-label">Fahrzeug</div>
        <div class="info-value">${escapeHtml(vehicle.brand || '')} ${escapeHtml(vehicle.model || '')} · ${escapeHtml(vehicle.license_plate || '')}</div>
      </div>` : ''}
      ${workshop.street ? `
      <div class="info-row">
        <div class="info-label">Adresse</div>
        <div class="info-value">${escapeHtml(workshop.street)}<br>${escapeHtml(workshop.postal_code || '')} ${escapeHtml(workshop.city || '')}</div>
      </div>` : ''}
    </div>

    <p><strong>Was Sie mitbringen sollten:</strong></p>
    <ul style="margin:0 0 16px;padding-left:24px;color:#334155;font-size:14px">
      <li>Fahrzeugschein</li>
      <li>Bei Reparaturen: ggf. Versicherungs-Unterlagen</li>
      <li>Bei Bedarf: Ersatzfahrzeug-Wunsch vorab klären</li>
    </ul>

    <p style="margin-top:24px">Falls Sie den Termin nicht wahrnehmen können, melden Sie sich bitte rechtzeitig:</p>

    ${workshop.phone ? `
    <div class="cta-wrap">
      <a href="tel:${workshop.phone}" class="cta-btn">📞 ${escapeHtml(workshop.phone)}</a>
    </div>` : ''}

    <p style="margin-top:24px">Bis bald in der Werkstatt!<br><strong>${escapeHtml(workshop.name)}</strong></p>
  `;

  return {
    subject: `Termin bestätigt: ${formatBerlinDate(booking.appointment_at)} — ${workshop.name}`,
    html: emailLayout({ workshop, content }),
  };
}

// ========================================
// Template 4: Absage an Kunde
// ========================================
export function bookingCancelledTemplate({ workshop, booking, customer, cancellationReason }) {
  const content = `
    <h1 class="title">Leider können wir den Termin nicht annehmen</h1>

    <p>Hallo ${escapeHtml(customer.name)},</p>

    <p>vielen Dank für Ihre Anfrage. Leider können wir Ihren Wunschtermin am <strong>${formatDateTime(booking.appointment_at)}</strong> nicht annehmen.</p>

    ${cancellationReason ? `
    <div class="info-box">
      <div class="info-label">Grund</div>
      <div style="margin-top:4px;color:#334155">${escapeHtml(cancellationReason)}</div>
    </div>` : ''}

    <p>Wir würden uns freuen, Ihnen einen alternativen Termin anbieten zu können. Rufen Sie uns gern an oder buchen Sie einen neuen Termin online:</p>

    <div class="cta-wrap">
      <a href="${APP_URL}/r/${workshop.slug}" class="cta-btn">Neuen Termin buchen</a>
    </div>

    ${workshop.phone ? `
    <p style="text-align:center;color:#64748b;font-size:14px">oder anrufen: <strong>${escapeHtml(workshop.phone)}</strong></p>` : ''}

    <p style="margin-top:24px">Mit freundlichen Grüßen<br><strong>${escapeHtml(workshop.name)}</strong></p>
  `;

  return {
    subject: `Terminanfrage: leider keine freie Kapazität — ${workshop.name}`,
    html: emailLayout({ workshop, content }),
  };
}
