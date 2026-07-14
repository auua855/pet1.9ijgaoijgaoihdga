const CACHE_NAME = 'chokopero-v6';
const ASSETS = [
  './',
  './index.html',
  './walk-record.html',
  './walk-history.html',
  './manifest.json',
  './css/reset.css',
  './css/variables.css',
  './css/layout.css',
  './css/components/header.css',
  './css/components/buttons.css',
  './css/components/calendar.css',
  './css/components/walk-log.css',
  './css/components/walk-record.css',
  './css/components/walk-history.css',
  './css/components/modal.css',
  './js/app.js',
  './js/components/ActionButtons.js',
  './js/components/Calendar.js',
  './js/components/Header.js',
  './js/components/LoadingOverlay.js',
  './js/components/PinAuth.js',
  './js/components/WalkLogMap.js',
  './js/modals/HealthRecordModal.js',
  './js/modals/SettingsModal.js',
  './js/core/storage.js',
  './js/core/petStore.js',
  './js/core/recordStore.js',
  './js/core/walkStore.js',
  './js/core/gasClient.js',
  './js/core/gpsTracker.js',
  './js/core/distanceCalc.js',
  './js/walk-record.js',
  './js/walk-history.js',
  './assets/images/icon.png'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
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
  if (e.request.url.includes('maps.googleapis.com')) return;
  e.respondWith(
    caches.match(e.request).then(cached => cached || fetch(e.request))
  );
});
