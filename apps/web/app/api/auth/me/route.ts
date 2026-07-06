import { getSession } from '@/lib/session';

export async function GET() {
  const session = await getSession();
  return Response.json({ user: session ? { username: session.username, name: session.name } : null });
}
