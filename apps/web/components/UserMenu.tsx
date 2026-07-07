'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSettings } from '@/lib/settings';
import { t } from '@/lib/i18n';

export default function UserMenu() {
  const pathname = usePathname();
  const { settings } = useSettings();
  const L = settings.uiLang;
  const [user, setUser] = useState<{ username: string; name: string } | null | undefined>(undefined);

  useEffect(() => {
    fetch('/api/auth/me')
      .then((r) => r.json())
      .then((d) => setUser(d.user))
      .catch(() => setUser(null));
  }, [pathname]);

  if (user === undefined) return <span className="user-menu" />;
  if (!user) {
    return (
      <span className="user-menu">
        <a href={`/api/auth/login?next=${encodeURIComponent(pathname)}`}>{t(L, 'signIn')}</a>
      </span>
    );
  }
  return (
    <span className="user-menu">
      <Link href="/profil"><b>{user.name || user.username}</b></Link>
      <a href="/api/auth/logout">{t(L, 'signOut')}</a>
    </span>
  );
}
