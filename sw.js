const CACHE = 'timetrack-v2';
const ASSETS = [
  './',
  './index.html',
  './calendar.html',
  './reports.html',
  './settings.html',
  './css/styles.css',
  './js/config.js',
  './js/utils.js',
  './js/storage.js',
  './js/attendance.js',
  './js/theme.js',
  './js/components.js',
  './js/dashboard.js',
  './js/calendar.js',
  './js/reports.js',
  './js/export.js',
  './js/settings.js',
  './manifest.json',
  './icons/icon.svg',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(ASSETS)));
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET') return;
  e.respondWith(
    caches.match(e.request).then((cached) => {
      const fetched = fetch(e.request).then((res) => {
        if (res.ok && e.request.url.startsWith(self.location.origin)) {
          const clone = res.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return res;
      }).catch(() => cached);
      return cached || fetched;
    })
  );
});
