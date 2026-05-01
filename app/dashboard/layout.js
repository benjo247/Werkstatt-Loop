import { redirect } from 'next/navigation';
import { getContext } from '@/lib/context';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }) {
  let ctx;
  try {
    ctx = await getContext();
  } catch (err) {
    if (err.code === 'NO_WORKSHOP') redirect('/onboarding');
    if (err.status === 401) redirect('/sign-in');
    throw err;
  }

  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar workshop={ctx} />
      <main className="flex-1 min-w-0 overflow-x-hidden">
        {children}
      </main>
    </div>
  );
}
