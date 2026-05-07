/**
 * walk-history.js — 散歩履歴一覧画面エントリーポイント
 */
import walkStore from './core/walkStore.js';
import storage from './core/storage.js';
import { formatDurationText } from './core/distanceCalc.js';

document.addEventListener('DOMContentLoaded', () => {
  const listEl = document.getElementById('walk-history-list');
  if (!listEl) return;

  const walks = walkStore.getAll();

  if (walks.length === 0) {
    listEl.innerHTML = `
      <div class="walk-history-empty">
        <span class="empty-icon">🐾</span>
        <p>散歩の記録がまだありません。<br>散歩記録ボタンから記録を始めましょう！</p>
      </div>`;
    return;
  }

  listEl.innerHTML = walks.map((w, i) => {
    const pets = Array.isArray(w.pets) ? w.pets.join('・') : (w.pets || '');
    const dist = w.distance != null ? w.distance.toFixed(2) + 'km' : '-';
    const dur = formatDurationText(w.duration) || '-';
    const date = w.date || '';
    const hasCoords = w.coords && w.coords.length > 1;
    return `
      <div class="walk-history-item walk-history-item--tappable" 
           role="listitem" data-walk-index="${i}">
        <span class="walk-history-icon">🐾</span>
        <div class="walk-history-info">
          <span class="walk-history-date">${date}</span>
          <span class="walk-history-pets">${pets}</span>
        </div>
        <div class="walk-history-stats">
          <span class="walk-history-dist">${dist}</span>
          <span class="walk-history-dur">${dur}</span>
        </div>
        <span class="walk-history-map-hint">${hasCoords ? '🗺️' : '▸'}</span>
      </div>`;
  }).join('');

  // ─── カードタップでルート地図を表示 ───
  listEl.querySelectorAll('.walk-history-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.walkIndex);
      const walk = walks[idx];
      if (walk?.coords?.length > 1) {
        showRouteMap(walk);
      } else {
        alert(`📋 ${walk.date || ''} の散歩記録\n\n🐾 ${Array.isArray(walk.pets) ? walk.pets.join('・') : (walk.pets || '')}\n📏 距離: ${walk.distance != null ? walk.distance.toFixed(2) + 'km' : '-'}\n⏱ 時間: ${formatDurationText(walk.duration) || '-'}\n\n※ ルートデータがないため地図は表示できません`);
      }
    });
  });

  document.getElementById('btn-back')?.addEventListener('click', () => {
    window.location.href = 'index.html';
  });
});

// ─── ルート地図ポップアップ ───
function showRouteMap(walk) {
  const settings = storage.get('settings', {});
  const apiKey = settings.googleMapsApiKey;

  if (!apiKey) {
    alert('Google Maps APIキーが設定されていません。\n設定画面からAPIキーを入力してください。');
    return;
  }

  // 既存のポップアップがあれば削除
  document.getElementById('route-map-popup')?.remove();

  const pets = Array.isArray(walk.pets) ? walk.pets.join('・') : (walk.pets || '');
  const dist = walk.distance != null ? walk.distance.toFixed(2) + 'km' : '-';
  const dur = formatDurationText(walk.duration) || '-';

  document.body.insertAdjacentHTML('beforeend', `
    <div class="route-map-popup" id="route-map-popup">
      <div class="route-map-overlay" id="route-map-overlay"></div>
      <div class="route-map-card">
        <div class="route-map-header">
          <div>
            <h3>🗺️ ${walk.date} の散歩ルート</h3>
            <p class="route-map-meta">${pets} ― ${dist} / ${dur}</p>
          </div>
          <button class="route-map-close" id="route-map-close">✕</button>
        </div>
        <div class="route-map-container" id="route-map-container"></div>
      </div>
    </div>
  `);

  const close = () => document.getElementById('route-map-popup')?.remove();
  document.getElementById('route-map-close').addEventListener('click', close);
  document.getElementById('route-map-overlay').addEventListener('click', close);

  // Google Maps を読み込んでルートを描画
  loadMapsAndDraw(apiKey, walk.coords);
}

function loadMapsAndDraw(apiKey, coords) {
  const drawRoute = () => {
    const mapEl = document.getElementById('route-map-container');
    if (!mapEl || !window.google?.maps) return;

    // ルートの中心を計算
    const bounds = new google.maps.LatLngBounds();
    coords.forEach(c => bounds.extend({ lat: c.lat, lng: c.lng }));

    const map = new google.maps.Map(mapEl, {
      center: bounds.getCenter(),
      zoom: 15,
      styles: [
        { elementType: 'geometry', stylers: [{ color: '#f5ede3' }] },
        { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e0f0' }] },
        { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
        { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4edda' }] }
      ]
    });

    map.fitBounds(bounds, 40);

    // ルートのポリライン
    new google.maps.Polyline({
      path: coords,
      strokeColor: '#8B5E3C',
      strokeOpacity: 0.9,
      strokeWeight: 5,
      map
    });

    // スタート・ゴールマーカー
    new google.maps.Marker({
      position: coords[0],
      map,
      label: { text: 'S', color: '#fff', fontWeight: '700' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#4CAF50',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });
    new google.maps.Marker({
      position: coords[coords.length - 1],
      map,
      label: { text: 'G', color: '#fff', fontWeight: '700' },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#E53935',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2
      }
    });
  };

  if (window.google?.maps) {
    drawRoute();
  } else {
    const s = document.createElement('script');
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    s.onload = drawRoute;
    document.head.appendChild(s);
  }
}
