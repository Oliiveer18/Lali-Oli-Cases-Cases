const V = 'loc-0.7.58-202610231919';
self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(V).then((c) => c.addAll(['./', './index.html'])).catch(() => {})); });
self.addEventListener('activate', (e) => { e.waitUntil(caches.keys().then((ks) => Promise.all(ks.filter((k) => k !== V).map((k) => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', (e) => {
  const r = e.request;
  if (r.method !== 'GET') return;
  const u = new URL(r.url);
  if (u.origin !== location.origin && !/peerjs/.test(u.href)) return;
  e.respondWith(fetch(r).then((res) => { if (res && res.ok && res.status === 200) { const cp = res.clone(); caches.open(V).then((c) => c.put(r, cp)).catch(() => {}); } return res; }).catch(() => caches.match(r).then((m) => m || caches.match('./index.html'))));
});
