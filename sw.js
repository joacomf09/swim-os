// SWIM OS service worker: guarda la app completa para usarla sin conexión.
// Al publicar cambios, sube el número de versión para que los móviles se actualicen.
const CACHE = 'swim-os-v1';
const ASSETS = [
    './fonts/barlow-condensed-latin-500-normal.woff2',
    './fonts/barlow-condensed-latin-600-normal.woff2',
    './fonts/barlow-condensed-latin-700-normal.woff2',
    './fonts/barlow-condensed-latin-800-normal.woff2',
    './fonts/dm-sans-latin-400-normal.woff2',
    './fonts/dm-sans-latin-500-normal.woff2',
    './fonts/dm-sans-latin-600-normal.woff2',
    './fonts/dm-sans-latin-700-normal.woff2',
    './icons/apple-touch-icon.png',
    './icons/favicon-32.png',
    './icons/icon-192.png',
    './icons/icon-512.png',
    './icons/icon-maskable-512.png',
    './index.html',
    './',
    './manifest.webmanifest',
    './vendor/htm.umd.js',
    './vendor/react-dom.production.min.js',
    './vendor/react.production.min.js',
];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
      if (res.ok && new URL(e.request.url).origin === location.origin) {
        const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy));
      }
      return res;
    }).catch(() => caches.match('./index.html')))
  );
});
