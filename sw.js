// 在庫管理表 service worker
// acenext-kanri と同じドメインに置くため、自分のキャッシュ（ace-stock-*）以外には触れない。
const PREFIX = 'ace-stock-';
const CACHE = PREFIX + 'v3';
const SHELL = ['./', './index.html', './manifest.json'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(caches.keys()
    .then(ks => Promise.all(ks.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k))))
    .then(() => self.clients.claim()));
});

self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  if (req.url.indexOf('script.google.com') > -1) return;
  // このフォルダの外（管理画面など）には一切介入しない
  const scope = self.registration.scope;
  if (!req.url.startsWith(scope)) return;
  e.respondWith(fetch(req).then(res => {
    const copy = res.clone();
    caches.open(CACHE).then(c => c.put(req, copy));
    return res;
  }).catch(() => caches.match(req).then(r => r || caches.match('./index.html'))));
});
