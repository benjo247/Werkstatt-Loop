/**
 * Termine sind in der DB als TIMESTAMPTZ (UTC) gespeichert.
 * Anzeige ist immer in Europe/Berlin.
 */

export function formatBookingDate(dateStr, timeStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
  const m = d.toLocaleDateString('de-DE', { month: 'short', timeZone: 'Europe/Berlin' });
  return `${wd[d.getDay()]}. ${d.getDate()}. ${m}${timeStr ? ` · ${timeStr}` : ''}`;
}

export function relativeTime(timestamp) {
  if (!timestamp) return '';
  const diff = Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000);
  if (diff < 60) return 'gerade eben';
  if (diff < 3600) return `vor ${Math.floor(diff / 60)} Min`;
  if (diff < 86400) return `vor ${Math.floor(diff / 3600)} Std`;
  if (diff < 172800) return 'gestern';
  return `vor ${Math.floor(diff / 86400)} Tagen`;
}

export function formatTime(date) {
  return new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));
}
