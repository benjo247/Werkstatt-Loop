import { getContext } from '@/lib/context';
import BuchungenView from '@/components/dashboard/BuchungenView';

export const dynamic = 'force-dynamic';

export default async function BuchungenPage() {
  const ctx = await getContext();
  return <BuchungenView workshopSlug={ctx.workshopSlug} />;
}
