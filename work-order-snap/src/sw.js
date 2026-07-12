// Service Worker — Work Order Snap
// Strategy: Cache-first for shell, network-first for geocoding API
const CACHE_NAME = 'wos-v1';
const SHELL = [
  '/',
  '/index.html',
  '/css/app.css',
  '/js/app.js',
  '/js/db.js',
  '/js/camera.js',
  '/js/gps.js',
  '/js/pdf.js',
  'https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(SHELL))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);

  // Network-first za Nominatim geocoding (treba svezi rezultat)
  if (url.hostname === 'nominatim.openstreetmap.org') {
    e.respondWith(
      fetch(e.request).catch(() => new Response('{}', { headers: { 'Content-Type': 'application/json' } }))
    );
    return;
  }

  // Cache-first za sve ostalo
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
