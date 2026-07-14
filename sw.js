const CACHE_NAME = 'chokopero-v7';
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
  './css/components/loading.css',
  './css/components/pin-auth.css',
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

// インストール時：キャッシュにファイルを保存（オフライン用）
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS))
  );
  // 待機中の新しいSWを即座に有効化
  self.skipWaiting();
});

// 有効化時：古いキャッシュを全て削除
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  // 既に開いているタブも即座に新しいSWで制御する
  self.clients.claim();
});

// ★ ネットワーク優先戦略（Network First）★
// まずサーバー（GitHub Pages）に最新ファイルを取りに行く。
// 取得できたらキャッシュを更新して返す。
// オフラインなどでネットワークエラーの場合のみキャッシュを返す。
self.addEventListener('fetch', e => {
  // Google Maps APIは素通し
  if (e.request.url.includes('maps.googleapis.com')) return;
  // GASへのリクエストも素通し
  if (e.request.url.includes('script.google.com')) return;

  e.respondWith(
    fetch(e.request)
      .then(response => {
        // 正常なレスポンスをキャッシュに保存（次回オフライン用）
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(e.request, clone);
          });
        }
        return response;
      })
      .catch(() => {
        // ネットワークエラー時のみキャッシュから返す（オフライン対応）
        return caches.match(e.request);
      })
  );
});
