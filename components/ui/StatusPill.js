export default function StatusPill({ status, compact = false }) {
  const cls = compact
    ? 'text-[9px] px-1.5 py-0.5'
    : 'text-[10px] px-2 py-0.5';
  const map = {
    new:       { label: 'Neu',       cls: 'bg-orange-500 text-white' },
    confirmed: { label: '✓ Bestätigt', cls: 'bg-emerald-100 text-emerald-700' },
    declined:  { label: 'Abgesagt',  cls: 'bg-slate-100 text-slate-600' },
    completed: { label: '✓ Erledigt', cls: 'bg-blue-100 text-blue-700' },
    no_show:   { label: 'No-Show',   cls: 'bg-red-100 text-red-700' },
  };
  const s = map[status] || map.new;
  return (
    <span className={`inline-flex items-center gap-1 ${s.cls} ${cls} rounded font-bold uppercase tracking-wider whitespace-nowrap`}>
      {s.label}
    </span>
  );
}
