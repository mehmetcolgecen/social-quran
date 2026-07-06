// Sosyal Kur'an service worker — statikler cache-first, sayfalar network-first.
// Ses ve API istekleri hiç önbelleklenmez (büyük/dinamik).
const VERSION = 'sk-v1';
const STATIC_CACHE = `${VERSION}-static`;
const PAGE_CACHE = `${VERSION}-pages`;

self.addEventListener('install', (e) => {
  self.skipWaiting();
  e.waitUntil(caches.open(PAGE_CACHE).then((c) => c.addAll(['/'])));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
    ).then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  if (url.pathname.startsWith('/audio/') || url.pathname.startsWith('/api/')) return; // yalnızca ağ

  // Statikler (hash'li) + fontlar + ikon: cache-first
  if (url.pathname.startsWith('/_next/static/') || url.pathname === '/icon.svg' || url.pathname.endsWith('.woff2') || url.pathname.endsWith('.ttf')) {
    e.respondWith(
      caches.open(STATIC_CACHE).then(async (cache) => {
        const hit = await cache.match(e.request);
        if (hit) return hit;
        const res = await fetch(e.request);
        if (res.ok) cache.put(e.request, res.clone());
        return res;
      }),
    );
    return;
  }

  // Sayfalar: network-first, çevrimdışıysa önbellekten (en son ziyaret edilenler okunabilir kalır)
  if (e.request.destination === 'document') {
    e.respondWith(
      fetch(e.request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGE_CACHE).then((c) => c.put(e.request, copy));
          return res;
        })
        .catch(async () => (await caches.match(e.request)) ?? (await caches.match('/')) ?? Response.error()),
    );
  }
});
