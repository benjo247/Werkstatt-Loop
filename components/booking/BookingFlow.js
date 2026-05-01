'use client';

import { useState, useMemo } from 'react';
import { Wrench, Snowflake, Disc3, Search, Sparkles, ShieldCheck, ChevronRight, ChevronLeft, Check, Upload, Camera, X, Phone, Globe, MapPin } from 'lucide-react';

const SERVICES = [
  { id: 'hu', icon: ShieldCheck, name: 'HU + AU', duration: '45 Min', desc: 'Hauptuntersuchung mit Abgastest.' },
  { id: 'inspektion', icon: Wrench, name: 'Inspektion', duration: '2–3 Std', desc: 'Nach Herstellervorgaben.' },
  { id: 'klima', icon: Snowflake, name: 'Klimaservice', duration: '45 Min', desc: 'Wartung, Befüllung, Desinfektion.' },
  { id: 'reifen', icon: Disc3, name: 'Reifenservice', duration: '30 Min', desc: 'Wechsel, Auswuchten, Einlagerung.' },
  { id: 'diagnose', icon: Search, name: 'Fehlerdiagnose', duration: '60 Min', desc: 'Computergestützt.' },
  { id: 'reparatur', icon: Sparkles, name: 'Reparatur', duration: 'n. Absprache', desc: 'Bremsen, Auspuff, Motor.' },
];

export default function BookingFlow({ workshop }) {
  const primary = workshop.primary_color || '#dc2626';
  const [step, setStep] = useState(1);
  const [service, setService] = useState(null);
  const [skipUpload, setSkipUpload] = useState(false);
  const [registrationData, setRegistrationData] = useState(null);
  const [registrationUrl, setRegistrationUrl] = useState(null);
  const [consentOcr, setConsentOcr] = useState(false);
  const [consentStorage, setConsentStorage] = useState(false);
  const [consentTimestamps, setConsentTimestamps] = useState({ ocr: null, storage: null });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [date, setDate] = useState(null);
  const [time, setTime] = useState(null);
  const [form, setForm] = useState({
    name: '', kennzeichen: '', vehicle: '',
    vin: '', first_registration: '', hu_due_date: '',
    email: '', phone: '', notes: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  // Step 2: Schein-Upload
  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!consentOcr) {
      setUploadError('Bitte stimme der KI-Verarbeitung zu, bevor du das Foto hochlädst.');
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('image', file);
    formData.append('workshop_slug', workshop.slug);
    formData.append('consent_ocr', 'true');
    formData.append('consent_storage', consentStorage ? 'true' : 'false');

    try {
      const res = await fetch('/api/public/ocr/vehicle-registration', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setRegistrationData(data.extracted);
      setRegistrationUrl(data.blob_pathname);
      setConsentTimestamps({
        ocr: new Date().toISOString(),
        storage: consentStorage ? new Date().toISOString() : null,
      });

      // Felder vorausfüllen
      setForm(prev => ({
        ...prev,
        kennzeichen: data.extracted.license_plate || prev.kennzeichen,
        vehicle: [data.extracted.brand, data.extracted.model].filter(Boolean).join(' ') || prev.vehicle,
        vin: data.extracted.vin || prev.vin,
        first_registration: data.extracted.first_registration || prev.first_registration,
        hu_due_date: data.extracted.hu_due_date || prev.hu_due_date,
      }));

      setStep(3);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function submitBooking() {
    setSubmitting(true);
    setSubmitError(null);

    const payload = {
      workshop_slug: workshop.slug,
      customer_name: form.name,
      email: form.email || null,
      phone: form.phone || null,
      license_plate: form.kennzeichen,
      vehicle: form.vehicle || null,
      vin: form.vin || null,
      first_registration: form.first_registration || null,
      hu_due_date: form.hu_due_date || null,
      service: service.name,
      preferred_date: date.toISOString().split('T')[0],
      preferred_time: time,
      notes: form.notes || null,
      vehicle_registration_url: registrationUrl,
      vehicle_registration_data: registrationData,
      consent_ocr_at: consentTimestamps.ocr,
      consent_storage_at: consentTimestamps.storage,
    };

    try {
      const res = await fetch('/api/public/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setStep(5);
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const canSubmit = form.name && form.kennzeichen && (form.email || form.phone);

  return (
    <div className="min-h-screen bg-slate-50" style={{ '--primary': primary }}>
      {/* Header mit Werkstatt-Branding */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-3xl mx-auto px-5 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {workshop.logo_url ? (
              <img src={workshop.logo_url} alt={workshop.name} className="h-10 w-auto" />
            ) : (
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-archivo font-black" style={{ background: primary }}>
                {workshop.name?.[0] || 'W'}
              </div>
            )}
            <div>
              <p className="text-xs uppercase tracking-widest text-slate-500 font-bold">Online-Termin</p>
              <p className="font-archivo font-black text-slate-900">{workshop.name}</p>
            </div>
          </div>
          {workshop.phone && (
            <a href={`tel:${workshop.phone.replace(/\s/g, '')}`} className="hidden md:flex items-center gap-1.5 text-sm text-slate-600 hover:text-slate-900 font-bold">
              <Phone className="w-4 h-4" /> {workshop.phone}
            </a>
          )}
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-5 py-8">
        {/* Stepper */}
        <div className="flex items-center justify-between mb-8">
          {['Leistung', 'Schein', 'Termin', 'Daten', 'Fertig'].map((label, i) => {
            const n = i + 1;
            const active = step >= n;
            const done = step > n;
            return (
              <div key={n} className="flex flex-col items-center gap-1.5 flex-1 first:items-start last:items-end">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${active ? 'text-white' : 'bg-slate-100 text-slate-400'}`} style={active ? { background: primary } : {}}>
                  {done ? <Check className="w-3.5 h-3.5" /> : n}
                </div>
                <span className={`text-[10px] uppercase tracking-wider font-bold ${active ? 'text-slate-900' : 'text-slate-400'}`}>
                  {label}
                </span>
              </div>
            );
          })}
        </div>

        <div className="bg-white rounded-2xl p-6 md:p-8 shadow-sm border border-slate-200">

          {/* STEP 1: Service */}
          {step === 1 && (
            <div>
              <h2 className="text-2xl font-archivo font-black mb-1">Welche Leistung?</h2>
              <p className="text-sm text-slate-600 mb-6 font-medium">Wähle den Service, den du brauchst.</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {SERVICES.map(s => {
                  const Icon = s.icon;
                  const active = service?.id === s.id;
                  return (
                    <button key={s.id} onClick={() => { setService(s); setStep(2); }}
                      className={`text-left p-4 rounded-xl border-2 transition-all ${active ? 'border-orange-500 bg-orange-50' : 'border-slate-200 hover:border-slate-300 bg-white'}`}>
                      <Icon className={`w-5 h-5 ${active ? 'text-orange-600' : 'text-slate-700'}`} />
                      <p className="font-archivo font-black mt-3 text-sm">{s.name}</p>
                      <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mt-0.5">{s.duration}</p>
                      <p className="text-xs text-slate-600 font-medium mt-1.5 leading-snug">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 2: Vehicle Registration Upload */}
          {step === 2 && (
            <div>
              <h2 className="text-2xl font-archivo font-black mb-1">Fahrzeugschein hochladen?</h2>
              <p className="text-sm text-slate-600 mb-6 font-medium">
                Du kannst ein Foto deines Fahrzeugscheins hochladen, dann werden die Daten automatisch übernommen.
                Oder du tippst sie selbst ein — beides funktioniert.
              </p>

              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-5">
                <p className="text-xs font-bold text-orange-900 uppercase tracking-wider mb-3">Datenschutz-Einwilligung</p>

                <label className="flex items-start gap-3 cursor-pointer mb-3">
                  <input type="checkbox" checked={consentOcr} onChange={e => setConsentOcr(e.target.checked)} className="mt-0.5 w-4 h-4 rounded" />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">
                    Ich willige ein, dass mein Fahrzeugschein-Foto zur automatischen Datenextraktion an
                    <strong> Anthropic PBC (USA, EU-US Data Privacy Framework zertifiziert)</strong> übertragen
                    und dort verarbeitet wird.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer">
                  <input type="checkbox" checked={consentStorage} onChange={e => setConsentStorage(e.target.checked)} className="mt-0.5 w-4 h-4 rounded" />
                  <span className="text-xs text-slate-700 font-medium leading-relaxed">
                    Ich willige ein, dass das Foto in der <strong>Cloud (Vercel Blob, Frankfurt)</strong> gespeichert wird
                    und der Werkstatt für die Auftragsbearbeitung zur Verfügung steht. Speicherdauer: max. 30 Tage nach Termin.
                    <br />
                    <span className="text-slate-500">Ohne diese Einwilligung wird das Foto nur kurz für die Datenerkennung verwendet und sofort verworfen.</span>
                  </span>
                </label>

                <p className="text-[10px] text-slate-500 mt-3">
                  <a href={`https://${typeof window !== 'undefined' ? window.location.host : ''}/datenschutz`} target="_blank" rel="noopener" className="underline">Vollständige Datenschutzerklärung lesen</a>
                </p>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-lg p-3 mb-4">
                  {uploadError}
                </div>
              )}

              <label className={`block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
                consentOcr ? 'border-slate-300 hover:border-orange-400 hover:bg-orange-50/50' : 'border-slate-200 cursor-not-allowed opacity-50'
              }`}>
                <input type="file" accept="image/*" capture="environment" onChange={handleFileUpload} disabled={!consentOcr || uploading} className="hidden" />
                {uploading ? (
                  <>
                    <div className="w-12 h-12 mx-auto mb-3 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
                    <p className="font-bold text-slate-900">Daten werden ausgelesen...</p>
                    <p className="text-xs text-slate-500 mt-1">Das dauert ~5 Sekunden</p>
                  </>
                ) : (
                  <>
                    <Camera className="w-12 h-12 mx-auto mb-3 text-slate-400" />
                    <p className="font-bold text-slate-900">Foto vom Fahrzeugschein</p>
                    <p className="text-xs text-slate-500 mt-1">JPG, PNG oder HEIC · max. 10 MB · Foto machen oder hochladen</p>
                  </>
                )}
              </label>

              <div className="flex justify-between items-center pt-5 mt-5 border-t border-slate-200">
                <button onClick={() => setStep(1)} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold">
                  <ChevronLeft className="w-4 h-4" /> zurück
                </button>
                <button onClick={() => { setSkipUpload(true); setStep(3); }} className="text-sm font-bold text-orange-600 hover:text-orange-700">
                  Lieber manuell eingeben →
                </button>
              </div>
            </div>
          )}

          {/* STEP 3: Termin */}
          {step === 3 && <DateTimeStep date={date} setDate={setDate} time={time} setTime={setTime} onBack={() => setStep(2)} onNext={() => setStep(4)} service={service} primary={primary} />}

          {/* STEP 4: Daten */}
          {step === 4 && (
            <div>
              <h2 className="text-2xl font-archivo font-black mb-1">Deine Daten</h2>
              <p className="text-sm text-slate-600 mb-6 font-medium">
                {registrationData ? 'Wir haben deinen Schein ausgelesen — bitte prüfe & ergänze noch deinen Namen und Kontakt.' : 'Damit wir dich erreichen können.'}
              </p>

              <div className="space-y-3">
                <Field label="Name *">
                  <input type="text" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Max Mustermann" className={inputCls} />
                </Field>
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="Kennzeichen *">
                    <input type="text" value={form.kennzeichen} onChange={e => setForm(f => ({ ...f, kennzeichen: e.target.value.toUpperCase() }))} className={inputCls + ' uppercase font-mono'} placeholder="KS-MM 1234" />
                  </Field>
                  <Field label="Fahrzeug">
                    <input type="text" value={form.vehicle} onChange={e => setForm(f => ({ ...f, vehicle: e.target.value }))} placeholder="VW Golf VII" className={inputCls} />
                  </Field>
                </div>
                {form.vin && (
                  <div className="text-[11px] text-slate-500 font-mono bg-slate-50 rounded-lg px-3 py-2">
                    FIN automatisch erkannt: <strong>{form.vin}</strong>
                    {form.hu_due_date && <span> · HU bis {form.hu_due_date}</span>}
                  </div>
                )}
                <div className="grid md:grid-cols-2 gap-3">
                  <Field label="E-Mail">
                    <input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className={inputCls} />
                  </Field>
                  <Field label="Telefon">
                    <input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className={inputCls} />
                  </Field>
                </div>
                <p className="text-[10px] text-slate-500">E-Mail oder Telefon — eines reicht.</p>
                <Field label="Anmerkung (optional)">
                  <textarea rows={3} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="z.B. Geräusch beim Bremsen" className={inputCls + ' resize-none'} />
                </Field>
              </div>

              {submitError && (
                <div className="bg-red-50 border border-red-200 text-red-700 text-sm font-bold rounded-lg p-3 mt-4">
                  {submitError}
                </div>
              )}

              <div className="flex justify-between items-center pt-5 mt-5 border-t border-slate-200">
                <button onClick={() => setStep(3)} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold">
                  <ChevronLeft className="w-4 h-4" /> zurück
                </button>
                <button onClick={submitBooking} disabled={!canSubmit || submitting} className="px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-1.5 text-white disabled:opacity-30" style={{ background: primary }}>
                  {submitting ? 'Sende...' : 'Termin verbindlich anfragen'} <Check className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Done */}
          {step === 5 && (
            <div className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mx-auto mb-5">
                <Check className="w-8 h-8 text-emerald-600" strokeWidth={3} />
              </div>
              <h2 className="text-2xl font-archivo font-black mb-2">Termin angefragt!</h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto mb-6 font-medium">
                Die Werkstatt bestätigt deinen Termin per {form.email ? 'E-Mail' : 'SMS'} — meist innerhalb weniger Stunden.
              </p>
              <div className="bg-slate-900 text-white rounded-2xl p-5 max-w-sm mx-auto text-left mb-6">
                <p className="text-[10px] uppercase tracking-widest text-orange-400 font-black mb-3">Deine Anfrage</p>
                <SummaryRow label="Werkstatt" value={workshop.name} />
                <SummaryRow label="Leistung" value={service?.name} />
                <SummaryRow label="Wunschtermin" value={`${date?.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })} · ${time}`} />
                <SummaryRow label="Fahrzeug" value={form.kennzeichen} mono last />
              </div>
            </div>
          )}
        </div>

        <p className="text-center text-xs text-slate-400 mt-6 font-medium">
          Buchungs-System bereitgestellt von <span className="text-slate-600 font-bold">WerkstattLoop</span>
        </p>
      </main>
    </div>
  );
}

const inputCls = 'w-full px-3 py-2.5 bg-slate-50 border-2 border-slate-200 rounded-lg focus:border-orange-500 focus:outline-none focus:bg-white transition text-sm font-medium';

function Field({ label, children }) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wider text-slate-500 font-bold">{label}</label>
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

function DateTimeStep({ date, setDate, time, setTime, onBack, onNext, service, primary }) {
  const days = useMemo(() => {
    const out = [];
    const today = new Date();
    let d = new Date(today);
    d.setDate(d.getDate() + 1);
    while (out.length < 12) {
      const day = d.getDay();
      if (day !== 0 && day !== 6) out.push(new Date(d));
      d.setDate(d.getDate() + 1);
    }
    return out;
  }, []);

  const slots = ['08:00', '09:30', '11:00', '13:00', '14:30', '16:00'];
  const wd = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

  return (
    <div>
      <h2 className="text-2xl font-archivo font-black mb-1">Wann passt es dir?</h2>
      <p className="text-sm text-slate-600 mb-6 font-medium">Für <strong>{service?.name}</strong> · ca. {service?.duration}</p>

      <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Tag wählen</p>
      <div className="flex gap-2 overflow-x-auto pb-2 mb-5">
        {days.map((d, i) => {
          const sel = date?.toDateString() === d.toDateString();
          const m = d.toLocaleDateString('de-DE', { month: 'short' });
          return (
            <button key={i} onClick={() => { setDate(d); setTime(null); }}
              className={`flex-shrink-0 w-16 py-3 rounded-xl border-2 text-center transition ${sel ? 'text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
              style={sel ? { background: primary, borderColor: primary } : {}}>
              <div className="text-[10px] uppercase font-bold opacity-80">{wd[d.getDay()]}</div>
              <div className="text-xl font-archivo font-black">{d.getDate()}</div>
              <div className="text-[10px] font-bold opacity-80">{m}</div>
            </button>
          );
        })}
      </div>

      {date && (
        <>
          <p className="text-xs uppercase tracking-wider text-slate-500 font-bold mb-2">Uhrzeit</p>
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mb-5">
            {slots.map(s => {
              const sel = time === s;
              return (
                <button key={s} onClick={() => setTime(s)}
                  className={`py-2.5 rounded-lg border-2 text-sm font-bold font-mono transition ${sel ? 'text-white' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  style={sel ? { background: primary, borderColor: primary } : {}}>
                  {s}
                </button>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-between items-center pt-5 border-t border-slate-200">
        <button onClick={onBack} className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1 font-semibold">
          <ChevronLeft className="w-4 h-4" /> zurück
        </button>
        <button onClick={onNext} disabled={!date || !time} className="px-5 py-2.5 rounded-full font-bold text-sm flex items-center gap-1.5 text-white disabled:opacity-30" style={{ background: primary }}>
          weiter <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function SummaryRow({ label, value, mono, last }) {
  return (
    <div className={`flex justify-between items-baseline py-2 ${last ? '' : 'border-b border-white/10'}`}>
      <span className="text-xs text-slate-400 uppercase tracking-wider font-bold">{label}</span>
      <span className={`text-sm font-bold ${mono ? 'font-mono' : ''}`}>{value || ''}</span>
    </div>
  );
}
