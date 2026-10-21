// SWIM OS service worker: guarda la app completa para usarla sin conexión.
// Generado por scripts/gen-sw.mjs. Al publicar cambios, subí la versión para que los móviles se actualicen.
const CACHE = 'swim-os-v3';
const ASSETS = [
  './',
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
  './manifest.webmanifest',
  './src/app.js',
  './src/art.js',
  './src/engine/candidates.js',
  './src/engine/config.js',
  './src/engine/diagnose.js',
  './src/engine/editing.js',
  './src/engine/estimate.js',
  './src/engine/generator.js',
  './src/engine/history.js',
  './src/engine/index.js',
  './src/engine/reach.js',
  './src/engine/rng.js',
  './src/engine/session.js',
  './src/engine/validator.js',
  './src/legacy.js',
  './src/library.js',
  './src/ui/history-view.js',
  './src/ui/kit.js',
  './src/ui/library-view.js',
  './src/ui/settings.js',
  './src/ui/training.js',
  './src/ui/wizard.js',
  './src/ui/workout.js',
  './styles.css',
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
// Red primero: si hay conexión siempre se ve la versión publicada; sin conexión, la última guardada.
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  const url = new URL(e.request.url);
  if (url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request, { cache: 'no-cache' }).then(res => {
      if (res.ok) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
      return res;
    }).catch(() => caches.match(e.request, { ignoreSearch: true }).then(hit => hit || caches.match('./index.html')))
  );
});
