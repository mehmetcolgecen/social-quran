'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function ProfileEditor({ displayName, bio }: { displayName: string; bio: string }) {
  const router = useRouter();
  const [name, setName] = useState(displayName);
  const [about, setAbout] = useState(bio);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  async function save() {
    setSaving(true); setMsg('');
    const res = await fetch('/api/social/users/me', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ display_name: name, bio: about }),
    });
    setSaving(false);
    if (!res.ok) {
      const err = (await res.json().catch(() => null)) as { message?: string } | null;
      setMsg(err?.message ?? 'Kaydedilemedi');
      return;
    }
    setMsg('Kaydedildi ✓');
    router.refresh();
  }

  return (
    <div className="profile-editor">
      <label>Görünen ad
        <input value={name} onChange={(e) => setName(e.target.value)} maxLength={50} />
      </label>
      <label>Biyografi
        <textarea value={about} onChange={(e) => setAbout(e.target.value)} maxLength={500} rows={3} />
      </label>
      <button disabled={saving || !name.trim()} onClick={save}>Kaydet</button>
      {msg && <span className="cmuted"> {msg}</span>}
    </div>
  );
}
