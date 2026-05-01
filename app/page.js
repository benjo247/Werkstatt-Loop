import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function HomePage() {
  const { userId } = await auth();
  if (userId) redirect('/dashboard');

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-xl text-center">
        <div className="inline-flex items-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center shadow-lg shadow-orange-500/30">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <path d="M21 12a9 9 0 1 1-3-6.7"/>
              <polyline points="21 4 21 10 15 10"/>
            </svg>
          </div>
          <p className="font-archivo font-black text-xl text-slate-900">WerkstattLoop</p>
        </div>

        <h1 className="text-4xl md:text-5xl font-archivo font-black text-slate-900 mb-4">
          Marketing-Add-on für Kfz-Werkstätten.
        </h1>
        <p className="text-slate-600 mb-8 font-medium">
          Online-Buchung, HU-Erinnerung, digitales Bonusheft. Bringt Stammkunden zurück.
        </p>

        <div className="flex gap-3 justify-center flex-wrap">
          <Link href="/sign-in" className="bg-slate-900 text-white px-6 py-3 rounded-full font-bold hover:bg-orange-600 transition-colors">
            Anmelden
          </Link>
          <Link href="/sign-up" className="border-2 border-slate-900 text-slate-900 px-6 py-3 rounded-full font-bold hover:bg-slate-900 hover:text-white transition-colors">
            Registrieren
          </Link>
        </div>
      </div>
    </main>
  );
}
