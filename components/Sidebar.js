'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UserButton } from '@clerk/nextjs';
import {
  LayoutGrid,
  CalendarDays,
  Users,
  Bell,
  Award,
  Settings,
  Cable,
  ChevronDown,
} from 'lucide-react';

const NAV = [
  { href: '/dashboard',              label: 'Übersicht',     icon: LayoutGrid },
  { href: '/dashboard/buchungen',    label: 'Buchungen',     icon: CalendarDays, badgeKey: 'newBookings' },
  { href: '/dashboard/kunden',       label: 'Kunden',        icon: Users },
  { href: '/dashboard/erinnerungen', label: 'Erinnerungen',  icon: Bell },
  { href: '/dashboard/bonusheft',    label: 'Bonusheft',     icon: Award },
];

export default function Sidebar({ workshop, newBookingsCount = 0 }) {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-950 text-slate-300 flex-shrink-0 flex flex-col border-r border-slate-800 hidden lg:flex">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-slate-800">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-3-6.7"/>
              <polyline points="21 4 21 10 15 10"/>
            </svg>
          </div>
          <div>
            <p className="text-white font-archivo font-black text-base leading-none">WerkstattLoop</p>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest font-bold">Marketing-Suite</p>
          </div>
        </div>
      </div>

      {/* Workshop selector */}
      <div className="px-3 py-3 border-b border-slate-800">
        <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-900 transition group">
          <div className="w-8 h-8 rounded-md bg-white p-1 flex-shrink-0 flex items-center justify-center">
            <span className="text-[10px] font-archivo font-black text-slate-700">
              {(workshop?.workshop_name || 'WL').split(' ').map(s => s[0]).join('').slice(0, 2).toUpperCase()}
            </span>
          </div>
          <div className="text-left flex-1 min-w-0">
            <p className="text-sm font-bold text-white truncate">{workshop?.workshop_name || 'Werkstatt'}</p>
            <p className="text-[10px] text-slate-500 truncate uppercase tracking-wider">{workshop?.plan || 'free'}</p>
          </div>
          <ChevronDown className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold px-3 mb-2">Steuerung</p>

        {NAV.map(item => {
          const Icon = item.icon;
          const active = pathname === item.href;
          const showBadge = item.badgeKey === 'newBookings' && newBookingsCount > 0;
          return (
            <Link key={item.href} href={item.href}
              className={`w-full flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition ${
                active ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-900 hover:text-white'
              }`}>
              <span className="flex items-center gap-2.5">
                <Icon className="w-4 h-4" strokeWidth={2} />
                {item.label}
              </span>
              {showBadge && (
                <span className="bg-orange-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full pulse-ring">
                  {newBookingsCount}
                </span>
              )}
            </Link>
          );
        })}

        <p className="text-[10px] uppercase tracking-widest text-slate-600 font-bold px-3 mb-2 mt-6">Konfiguration</p>
        <Link href="/dashboard/einstellungen" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition text-slate-400 hover:bg-slate-900 hover:text-white">
          <Settings className="w-4 h-4" strokeWidth={2} />
          Einstellungen
        </Link>
        <Link href="/dashboard/dms" className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-semibold transition text-slate-400 hover:bg-slate-900 hover:text-white">
          <Cable className="w-4 h-4" strokeWidth={2} />
          DMS-Verbindung
        </Link>
      </nav>

      {/* User button */}
      <div className="p-3 border-t border-slate-800 flex items-center gap-3">
        <UserButton afterSignOutUrl="/" />
        <div className="text-xs">
          <p className="text-white font-bold">Eingeloggt</p>
          <p className="text-slate-500">{workshop?.user_email || ''}</p>
        </div>
      </div>
    </aside>
  );
}
