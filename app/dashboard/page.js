import { getContext } from '@/lib/context';
import UbersichtView from '@/components/dashboard/UbersichtView';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const ctx = await getContext();
  return <UbersichtView workshopName={ctx.workshopName} />;
}
