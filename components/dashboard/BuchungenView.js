'use client';

import { useEffect, useState } from 'react';
import { Image as ImageIcon, FileText } from 'lucide-react';
import { formatBookingDate, relativeTime } from '@/lib/format';
import StatusPill from '@/components/ui/StatusPill';

export default function BuchungenView({ workshopSlug }) {
  const [bookings, setBookings] = useState([]);
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [previewUrl, setPreviewUrl] = useState(null);

  async function fetchBookings(silent = false) {
    try {
      const res = await fetch('/api/bookings', { cache: 'no-store' });
      const data = await res.json();
      setBookings(data);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id, status) {
    try {
      await fetch('/api/bookings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      fetchBookings(true);
    } catch (e) {
      alert('Fehler: ' + e.message);
    }
  }

  useEffect(() => {
    fetchBookings();
    const id = setInterval(() => fetchBookings(true), 10000);
    return () => clearInterval(id);
  }, []);

  const filtered = filter === 'all' ? bookings : bookings.filter(b => b.status === filter);
  const counts = {
    all: bookings.length,
    new: bookings.filter(b => b.status === 'new').length,
    confirmed: bookings.filter(b => b.status === 'confirmed').length,
    declined: bookings.filter(b => b.status === 'declined').length,
  };

  return (
    <div className="px-5 lg:px-8 py-6 lg:py-8 max-w-7xl">
      <div className="mb-6">
        <p className="text-xs uppercase tracking-widest text-slate-500 font-bold mb-1">Posteingang</p>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-3xl md:text-4xl font-archivo font-black text-slate-900">Online-Buchungen</h1>
          {workshopSlug && (
            <span className="text-xs font-bold text-slate-900 bg-slate-100 px-2.5 py-1 rounded-full font-mono">
              {workshopSlug}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 mb-5 overflow-x-auto no-scrollbar">
        {[
          { key: 'all', label: 'Alle' },
          { key: 'new', label: 'Neu', dot: true },
          { key: 'confirmed', label: 'Bestätigt' },
          { key: 'declined', label: 'Abgesagt' },
        ].map(f => {
          const active = filter === f.key;
          return (
            <button key={f.key} onClick={() => setFilter(f.key)}
              className={`px-4 py-2 text-sm font-bold rounded-full whitespace-nowrap flex items-center gap-1.5 ${
                active && f.key === 'new' ? 'bg-orange-100 text-orange-700' :
                active ? 'bg-slate-900 text-white' :
                'bg-white border border-slate-200 text-slate-700 hover:bg-slate-50'
              }`}>
              {f.dot && <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span>}
              {f.label} <span className="ml-1 opacity-60">{counts[f.key]}</span>
            </button>
          );
        })}
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                {['Status', 'Kunde', 'Fahrzeug', 'Schein', 'Leistung', 'Wunschtermin', 'Eingang', ''].map(h => (
                  <th key={h} className="text-left px-5 py-3 text-[10px] uppercase tracking-widest text-slate-500 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">Lade...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={8} className="px-5 py-12 text-center text-slate-400 text-sm">
                  {filter === 'all' ? 'Noch keine Buchungen.' : 'Keine Buchungen mit diesem Status.'}
                </td></tr>
              ) : filtered.map(b => (
                <tr key={b.id} className="hover:bg-slate-50 transition">
                  <td className="px-5 py-3"><StatusPill status={b.status} /></td>
                  <td className="px-5 py-3">
                    <p className="font-bold text-sm text-slate-900">{b.customer_name}</p>
                    <p className="text-[11px] text-slate-500 font-medium">{b.email || b.phone}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-sm font-semibold text-slate-700">{b.vehicle || '—'}</p>
                    <p className="text-[11px] text-slate-500 font-mono">{b.license_plate}</p>
                    {b.vin && <p className="text-[10px] text-slate-400 font-mono">FIN: {b.vin.slice(-6)}</p>}
                  </td>
                  <td className="px-5 py-3">
                    {b.vehicle_registration_url ? (
                      <button onClick={() => setPreviewUrl(b.vehicle_registration_url)}
                        className="flex items-center gap-1 text-xs font-bold text-blue-600 hover:text-blue-700">
                        <ImageIcon className="w-3.5 h-3.5" /> ansehen
                      </button>
                    ) : (
                      <span className="text-[10px] text-slate-400">—</span>
                    )}
                  </td>
                  <td className="px-5 py-3 text-sm font-bold">{b.service}</td>
                  <td className="px-5 py-3 text-sm font-semibold text-slate-700">
                    {formatBookingDate(b.preferred_date, b.preferred_time)}
                  </td>
                  <td className="px-5 py-3 text-[11px] text-slate-500 font-bold">{relativeTime(b.created_at)}</td>
                  <td className="px-5 py-3 text-right">
                    {b.status === 'new' ? (
                      <div className="flex justify-end gap-1.5">
                        <button onClick={() => updateStatus(b.id, 'confirmed')} className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3 py-1.5 rounded">
                          Bestätigen
                        </button>
                        <button onClick={() => updateStatus(b.id, 'declined')} className="border border-slate-200 hover:border-slate-300 text-slate-600 text-xs font-bold px-2 py-1.5 rounded">
                          Absagen
                        </button>
                      </div>
                    ) : (
                      <button className="text-xs text-slate-500 font-bold hover:text-slate-900">Details →</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {previewUrl && (
        <div onClick={() => setPreviewUrl(null)}
          className="fixed inset-0 bg-slate-900/80 z-50 flex items-center justify-center p-4 cursor-pointer">
          <div className="bg-white rounded-2xl p-3 max-w-3xl max-h-[90vh] overflow-auto" onClick={e => e.stopPropagation()}>
            <img src={previewUrl} alt="Fahrzeugschein" className="max-w-full h-auto rounded" />
            <p className="text-xs text-slate-500 mt-2 px-2 font-medium">Klick außerhalb zum Schließen</p>
          </div>
        </div>
      )}
    </div>
  );
}
