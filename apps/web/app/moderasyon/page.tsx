import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import ModerationList from '@/components/ModerationList';

export const metadata = { title: 'Moderasyon' };
export const dynamic = 'force-dynamic';

export default async function ModerasyonPage() {
  const session = await getSession();
  if (!session) redirect('/api/auth/login?next=/moderasyon');
  return (
    <main>
      <h1>Moderasyon — açık şikâyetler</h1>
      <ModerationList />
    </main>
  );
}
