import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';

export default async function OnboardingPage() {
  const { userId } = await auth();
  if (!userId) redirect('/sign-in');

  return (
    <main className="min-h-screen bg-slate-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-archivo font-black text-slate-900 mb-3">Willkommen bei WerkstattLoop</h1>
        <p className="text-slate-600 font-medium mb-6">
          Dein Account ist angelegt, aber noch nicht mit einer Werkstatt verknüpft.
          Der Onboarding-Wizard kommt als nächstes.
        </p>
        <p className="text-sm text-slate-500">
          Solange du auf der Beta-Liste stehst, hilft dir der WerkstattLoop-Support beim Setup.
          Schreib uns: <a href="mailto:hi@werkstattloop.de" className="text-orange-600 font-bold">hi@werkstattloop.de</a>
        </p>
      </div>
    </main>
  );
}
