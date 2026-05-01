'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Sparkles, TrendingUp, Bell, Calendar, Wrench, Award, X, Clock, ChevronRight } from 'lucide-react';
import { formatBookingDate, relativeTime } from '@/lib/format';
import StatusPill from '@/components/ui/StatusPill';

export default function UbersichtView({ workshopName }) {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [connection, setConnection] = useState('connecting');

  async function fetchBookings(silent = false) {
    if (!silent) setConnection('connecting');
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setBookings(data);
      setConnection('connected');
    } catch (e) {
      console.error(e);
      setConnection('error');
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      const res = await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      fetchBookings(true);
    } catch (e) {
      alert('Fehler beim Speichern: ' + e.message);
    }
  }

  useEffect(() => {
    fetchBookings();
    const id = setInterval(() => fetchBookings(true), 10000);
    return () => clearInterval(id);
  }, []);

  const newBookings = bookings.filter(b => b.status === 'new');
  const confirmedBookings = bookings.filter(b => b.status === 'confirmed');
  const overviewList = [...newBookings.slice(0, 2), ...confirmedBookings.slice(0, 1)].slice(0, 3);

  const today = new Date();
  const dateStr = today.toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="px-5 lg:px-8 py-6 lg:py-8 max-w-7xl">
      <div className="mb-6 slide-up">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">{dateStr}</p>
        <h1 className="text-3xl md:text-4xl font-archivo font-black text-slate-900">
          Guten Morgen{workshopName ? `, ${workshopName.split(' ')[0]}` : ''}.
        </h1>
      </div>

      {/* Hero ROI card */}
      <div className="bg-slate-950 rounded-2xl p-6 md:p-8 mb-5 relative overflow-hidden slide-up" style={{ animationDelay: '0.05s' }}>
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500 opacity-10 rounded-full blur-3xl -mr-32 -mt-32"></div>
        <div className="relative grid md:grid-cols-3 gap-6 items-end">
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-orange-400 mb-3 font-black">
              <Sparkles className="w-3 h-3" />
              <span>Zurückgeholter Umsatz · diesen Monat</span>
            </div>
            <div className="flex items-baseline gap-3 flex-wrap">
              <span className="text-5xl md:text-6xl font-archivo font-black text-white tracking-tight">
                {bookings.length === 0 ? '0 €' : '12.430 €'}
              </span>
              {bookings.length > 0 && (
                <div className="flex items-center gap-1 bg-emerald-500/20 text-emerald-400 px-2.5 py-1 rounded-md text-xs font-bold">
                  <TrendingUp className="w-3 h-3" />
                  +34%
                </div>
              )}
            </div>
            <p className="text-sm text-slate-400 mt-2 font-medium">
              {bookings.length === 0
                ? 'Sobald Buchungen reinkommen, siehst du hier den Live-Wert.'
                : `Aus ${confirmedBookings.length} bestätigten Terminen und ${newBookings.length} neuen Anfragen.`}
            </p>
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-2">Letzte 6 Monate</p>
            <svg viewBox="0 0 200 60" className="w-full h-16">
              <path d="M0,45 L33,40 L66,42 L100,30 L133,28 L166,18 L200,8" fill="none" stroke="#f97316" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
              <circle cx="200" cy="8" r="4" fill="#f97316"/>
              <circle cx="200" cy="8" r="8" fill="#f97316" opacity="0.3"/>
            </svg>
          </div>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <KpiCard icon={Bell} iconBg="bg-blue-100" iconText="text-blue-600" value={newBookings.length} label="Neue Anfragen" />
        <KpiCard icon={Calendar} iconBg="bg-orange-100" iconText="text-orange-600" value={confirmedBookings.length} label="Bestätigt" highlight />
        <KpiCard icon={Wrench} iconBg="bg-purple-100" iconText="text-purple-600" value={0} label="Service-Reminder" />
        <KpiCard icon={Award} iconBg="bg-amber-100" iconText="text-amber-600" value={0} label="Bonusheft-Kunden" />
      </div>

      {/* Online-Buchungen Widget */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 slide-up mb-5" style={{ animationDelay: '0.3s' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-archivo font-black text-slate-900 flex items-center gap-2">
              Online-Buchungen
              {newBookings.length > 0 && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {newBookings.length} NEU
                </span>
              )}
            </h2>
            <p className="text-xs text-slate-500 font-medium mt-0.5 flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full ${connection === 'connected' ? 'bg-emerald-500 pulse-ring' : connection === 'error' ? 'bg-red-500' : 'bg-slate-400'}`}></span>
              {connection === 'connected' ? 'Live · synchron' : connection === 'error' ? 'Verbindung getrennt' : 'Synchronisiere...'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8 text-slate-400 text-sm">Lade Buchungen...</div>
        ) : overviewList.length === 0 ? (
          <div className="text-center py-12 text-slate-400 text-sm">
            <p className="font-semibold mb-1">Noch keine Buchungen.</p>
            <p className="text-xs">Sie erscheinen hier in Echtzeit, sobald ein Kunde online bucht.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-3">
            {overviewList.map(b => <BookingCard key={b.id} booking={b} onConfirm={updateStatus} onDecline={updateStatus} />)}
          </div>
        )}

        {bookings.length > 3 && (
          <Link href="/dashboard/buchungen" className="w-full mt-4 text-xs text-slate-700 font-bold border border-slate-200 hover:border-slate-300 hover:bg-slate-50 py-2 rounded-lg transition flex items-center justify-center gap-1">
            Alle {bookings.length} Buchungen ansehen
            <ChevronRight className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, iconBg, iconText, value, label, highlight }) {
  return (
    <div className={`bg-white rounded-xl p-4 ${highlight ? 'border-2 border-orange-500 shadow-lg shadow-orange-500/10' : 'border border-slate-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-8 h-8 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${iconText}`} />
        </div>
      </div>
      <p className="text-3xl font-archivo font-black text-slate-900">{value}</p>
      <p className="text-xs text-slate-500 font-bold uppercase tracking-wider mt-1">{label}</p>
    </div>
  );
}

function BookingCard({ booking: b, onConfirm, onDecline }) {
  const isNew = b.status === 'new';
  return (
    <div className={`${isNew ? 'border-orange-200 bg-orange-50/50' : 'border-slate-200'} border rounded-lg p-3 hover:border-orange-400 transition`}>
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div className="min-w-0">
          <p className="font-bold text-sm text-slate-900 truncate">{b.customer_name}</p>
          <p className="text-[11px] text-slate-500 font-mono">{b.license_plate}{b.vehicle ? ` · ${b.vehicle}` : ''}</p>
        </div>
        <StatusPill status={b.status} compact />
      </div>
      <div className="text-xs text-slate-700 font-semibold flex items-center gap-1.5 mb-2">
        <Clock className="w-3 h-3 text-slate-400" />
        {b.service} · {formatBookingDate(b.preferred_date, b.preferred_time)}
      </div>
      {isNew && (
        <div className="flex gap-1.5">
          <button onClick={() => onConfirm(b.id, 'confirmed')} className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold py-1.5 rounded transition">
            Bestätigen
          </button>
          <button onClick={() => onDecline(b.id, 'declined')} className="px-2 py-1.5 border border-slate-200 hover:border-slate-300 rounded transition" aria-label="Absagen">
            <X className="w-3.5 h-3.5 text-slate-600" />
          </button>
        </div>
      )}
    </div>
  );
}
