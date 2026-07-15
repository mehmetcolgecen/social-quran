import { redirect } from 'next/navigation';
import { getSession } from '@/lib/session';
import ModerationPanel from '@/components/ModerationPanel';

export const metadata = { title: 'Yönetim' };
export const dynamic = 'force-dynamic';

export default async function ModerasyonPage() {
  const session = await getSession();
  if (!session) redirect('/api/auth/login?next=/moderasyon');
  return (
    <main>
      <h1>Yönetim paneli</h1>
      <ModerationPanel />
    </main>
  );
}
