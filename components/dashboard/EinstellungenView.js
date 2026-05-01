'use client';

import { useState } from 'react';
import { Save, Check, Mail, Phone, Globe, MapPin, Palette, Clock, Building2, Award, Shield } from 'lucide-react';

const PLANS = {
  free:     { label: 'Free',     color: 'bg-slate-100 text-slate-700',     desc: 'Beta-Tester · 100 Fahrzeuge · 30 SMS/Monat' },
  starter:  { label: 'Starter',  color: 'bg-blue-100 text-blue-700',       desc: 'Bis 500 Fahrzeuge · HU + Service-Reminder · 39 €/Monat' },
  pro:      { label: 'Pro',      color: 'bg-orange-100 text-orange-700',   desc: 'Bis 2.000 Fahrzeuge · WhatsApp + Bonusheft + DMS · 79 €/Monat' },
  premium:  { label: 'Premium',  color: 'bg-purple-100 text-purple-700',   desc: 'Unbegrenzt + Mehrere Standorte · 149 €/Monat' },
  pilot:    { label: 'Pilot',    color: 'bg-emerald-100 text-emerald-700', desc: 'Beta-Phase · alle Features kostenlos · Feedback erwünscht' },
};

const DAYS = [
  { key: 'mon', label: 'Montag' },
  { key: 'tue', label: 'Dienstag' },
  { key: 'wed', label: 'Mittwoch' },
  { key: 'thu', label: 'Donnerstag' },
  { key: 'fri', label: 'Freitag' },
  { key: 'sat', label: 'Samstag' },
  { key: 'sun', label: 'Sonntag' },
];

export default function EinstellungenView({ initial }) {
  const [data, setData] = useState({
    ...initial,
    opening_hours: initial.opening_hours || DAYS.reduce((acc, d) => ({ ...acc, [d.key]: null }), {}),
  });
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState(null);
  const [error, setError] = useState(null);

  function update(field, value) { setData(prev => ({ ...prev, [field]: value })); }

  function updateHours(dayKey, field, value) {
    setData(prev => {
      const oh = { ...(prev.opening_hours || {}) };
      if (field === 'closed') {
        oh[dayKey] = value ? null : { open: '08:00', close: '17:00' };
      } else {
        oh[dayKey] = { ...(oh[dayKey] || { open: '08:00', close: '17:00' }), [field]: value };
      }
      return { ...prev, opening_hours: oh };
    });
  }

  async function save() {
    setSaving(true); setError(null);
    try {
      const res = await fetch('/api/workshops/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name, street: data.street, postal_code: data.postal_code, city: data.city,
          email: data.email, phone: data.phone, website_url: data.website_url,
          owner_name: data.owner_name, vat_id: data.vat_id,
          logo_url: data.logo_url, primary_color: data.primary_color,
          opening_hours: data.opening_hours,
          data_minimal_mode: data.data_minimal_mode,
        }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || `HTTP ${res.status}`);
      }
      const updated = await res.json();
      setData(prev => ({ ...prev, ...updated }));
      setSavedAt(new Date());
    } catch (e) { setError(e.message); }
    finally { setSaving(false); }
  }

  const planInfo = PLANS[data.plan] || PLANS.free;
  const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none focus:bg-white transition text-sm font-medium';
  const labelCls = 'text-xs uppercase tracking-wider text-slate-500 font-bold';

  return (
    <div className="px-5 lg:px-8 py-6 lg:py-8 max-w-5xl">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Konfiguration</p>
        <h1 className="text-3xl md:text-4xl font-archivo font-black text-slate-900">Einstellungen</h1>
      </div>

      <Section icon={Award} title="Abo & Plan">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm font-bold ${planInfo.color}`}>{planInfo.label}</span>
            <p className="text-sm text-slate-600 font-medium">{planInfo.desc}</p>
          </div>
          <a href="mailto:hi@werkstattloop.de?subject=Plan-Upgrade" className="text-sm font-bold text-orange-600 hover:text-orange-700">
            Plan ändern →
          </a>
        </div>
      </Section>

      <Section icon={Building2} title="Werkstatt-Profil">
        <Field label="Name der Werkstatt" required labelCls={labelCls}>
          <input type="text" value={data.name || ''} onChange={e => update('name', e.target.value)} className={inputCls} />
        </Field>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Inhaber" labelCls={labelCls}>
            <input type="text" value={data.owner_name || ''} onChange={e => update('owner_name', e.target.value)} className={inputCls} placeholder="Josef Müller" />
          </Field>
          <Field label="USt-IdNr (optional)" labelCls={labelCls}>
            <input type="text" value={data.vat_id || ''} onChange={e => update('vat_id', e.target.value)} className={inputCls + ' font-mono'} placeholder="DE123456789" />
          </Field>
        </div>
        <div>
          <label className={labelCls}>URL des Buchungs-Profils</label>
          <div className="mt-1.5 flex items-center bg-slate-100 rounded-lg overflow-hidden">
            <span className="px-3 py-2.5 text-xs font-mono text-slate-500">/r/</span>
            <input type="text" value={data.slug || ''} disabled className="flex-1 px-2 py-2.5 bg-slate-100 font-mono text-sm text-slate-700" />
          </div>
          <p className="text-[10px] text-slate-500 mt-1 font-medium">Slug ändert nur der Support, weil sonst bestehende Buchungs-Links brechen.</p>
        </div>
      </Section>

      <Section icon={MapPin} title="Adresse & Kontakt">
        <Field label="Straße + Hausnummer" labelCls={labelCls}>
          <input type="text" value={data.street || ''} onChange={e => update('street', e.target.value)} className={inputCls} placeholder="Moltkestraße 1" />
        </Field>
        <div className="grid grid-cols-3 gap-3">
          <Field label="PLZ" labelCls={labelCls}>
            <input type="text" value={data.postal_code || ''} onChange={e => update('postal_code', e.target.value)} className={inputCls} placeholder="34225" />
          </Field>
          <div className="col-span-2">
            <Field label="Ort" labelCls={labelCls}>
              <input type="text" value={data.city || ''} onChange={e => update('city', e.target.value)} className={inputCls} placeholder="Baunatal" />
            </Field>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-3">
          <Field label="Telefon" icon={Phone} labelCls={labelCls}>
            <input type="tel" value={data.phone || ''} onChange={e => update('phone', e.target.value)} className={inputCls} placeholder="05601 87652" />
          </Field>
          <Field label="E-Mail" icon={Mail} labelCls={labelCls}>
            <input type="email" value={data.email || ''} onChange={e => update('email', e.target.value)} className={inputCls} placeholder="info@werkstatt.de" />
          </Field>
        </div>
        <Field label="Eigene Webseite" icon={Globe} labelCls={labelCls}>
          <input type="url" value={data.website_url || ''} onChange={e => update('website_url', e.target.value)} className={inputCls} placeholder="https://..." />
        </Field>
      </Section>

      <Section icon={Palette} title="Branding">
        <Field label="Logo-URL (extern)" labelCls={labelCls}>
          <input type="url" value={data.logo_url || ''} onChange={e => update('logo_url', e.target.value)} className={inputCls} placeholder="https://...logo.png" />
        </Field>
        <Field label="Primärfarbe" labelCls={labelCls}>
          <div className="flex items-center gap-3">
            <input type="color" value={data.primary_color || '#dc2626'} onChange={e => update('primary_color', e.target.value)} className="w-12 h-10 rounded border border-slate-200 cursor-pointer" />
            <input type="text" value={data.primary_color || ''} onChange={e => update('primary_color', e.target.value)} className={inputCls + ' font-mono w-32'} />
            <span className="text-xs text-slate-500 font-medium">Wird in Buchungs-Page & Bonusheft verwendet.</span>
          </div>
        </Field>
      </Section>

      <Section icon={Clock} title="Öffnungszeiten">
        <div className="space-y-2">
          {DAYS.map(d => {
            const oh = data.opening_hours?.[d.key];
            const closed = oh === null || oh === undefined;
            return (
              <div key={d.key} className="flex items-center gap-3 py-1">
                <div className="w-24 text-sm font-bold text-slate-700">{d.label}</div>
                <label className="flex items-center gap-1.5 text-xs text-slate-600 font-medium cursor-pointer">
                  <input type="checkbox" checked={closed} onChange={e => updateHours(d.key, 'closed', e.target.checked)} className="rounded" />
                  geschlossen
                </label>
                {!closed && (
                  <>
                    <input type="time" value={oh?.open || '08:00'} onChange={e => updateHours(d.key, 'open', e.target.value)} className={inputCls + ' w-28 font-mono'} />
                    <span className="text-slate-400">–</span>
                    <input type="time" value={oh?.close || '17:00'} onChange={e => updateHours(d.key, 'close', e.target.value)} className={inputCls + ' w-28 font-mono'} />
                  </>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section icon={Shield} title="Datenschutz">
        <label className="flex items-start gap-3 cursor-pointer p-3 rounded-lg hover:bg-slate-50 transition">
          <input type="checkbox" checked={data.data_minimal_mode === true}
            onChange={e => update('data_minimal_mode', e.target.checked)}
            className="mt-0.5 w-4 h-4 rounded" />
          <div>
            <p className="text-sm font-bold text-slate-900">Datenminimal-Modus</p>
            <p className="text-xs text-slate-600 font-medium mt-1">
              Wenn aktiv, werden Fahrzeugschein-Bilder nach der OCR-Analyse <strong>sofort gelöscht</strong>.
              Nur die extrahierten Felder (Kennzeichen, FIN, etc.) bleiben in der Datenbank.
              Maximaler Datenschutz, aber: bei der Annahme im Betrieb hast du das Original-Foto nicht mehr zur Verfügung.
            </p>
            {data.data_minimal_mode && (
              <p className="text-xs text-emerald-700 font-bold mt-2">✓ Aktiv — Bilder werden nicht gespeichert</p>
            )}
          </div>
        </label>
      </Section>

      <div className="sticky bottom-4 mt-6 bg-white border border-slate-200 rounded-2xl p-4 shadow-lg flex items-center justify-between gap-4 flex-wrap">
        <div className="text-xs text-slate-500 font-medium">
          {savedAt && (
            <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
              <Check className="w-3.5 h-3.5" /> Gespeichert · {savedAt.toLocaleTimeString('de-DE')}
            </span>
          )}
          {error && <span className="text-red-600 font-bold">{error}</span>}
        </div>
        <button onClick={save} disabled={saving} className="bg-slate-900 hover:bg-orange-600 text-white px-6 py-2.5 rounded-full font-bold text-sm flex items-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition">
          <Save className="w-4 h-4" />
          {saving ? 'Speichere...' : 'Änderungen speichern'}
        </button>
      </div>
    </div>
  );
}

function Section({ icon: Icon, title, children }) {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 mb-4">
      <div className="flex items-center gap-2.5 mb-5 pb-3 border-b border-slate-100">
        <div className="w-8 h-8 rounded-lg bg-orange-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-orange-600" />
        </div>
        <h2 className="text-lg font-archivo font-black text-slate-900">{title}</h2>
      </div>
      <div className="space-y-4">{children}</div>
    </div>
  );
}

function Field({ label, required, icon: Icon, children, labelCls }) {
  return (
    <div>
      <label className={labelCls + (Icon ? ' flex items-center gap-1.5' : '')}>
        {Icon && <Icon className="w-3 h-3" />}
        {label} {required && <span className="text-orange-600">*</span>}
      </label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}
