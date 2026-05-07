/**
 * walk-record.js — 散歩記録画面エントリーポイント
 */
import petStore from './core/petStore.js';
import walkStore from './core/walkStore.js';
import gasClient from './core/gasClient.js';
import { GPSTracker } from './core/gpsTracker.js';
import storage from './core/storage.js';

const tracker = new GPSTracker();
let map = null;
let polyline = null;
let selectedPets = new Set();

// ─── 日付文字列 'YYYY-MM-DD' ───
function todayStr() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

// ─── ペット選択ボタン生成 ───
function renderPetButtons() {
  const pets = petStore.getAll();
  const container = document.getElementById('pet-buttons');
  if (!container) return;

  if (pets.length === 0) {
    container.innerHTML = '<p class="pet-select-label" style="color:var(--color-text-muted)">設定画面でペットを登録してください</p>';
    return;
  }

  container.innerHTML = pets.map(p => `
    <button class="btn-pet-toggle active" data-pet-id="${p.id}" data-pet-name="${p.name}"
      type="button" aria-pressed="true">${p.name}</button>
  `).join('');

  // デフォルト全選択
  pets.forEach(p => selectedPets.add(p.name));

  container.querySelectorAll('.btn-pet-toggle').forEach(btn => {
    btn.addEventListener('click', () => {
      const name = btn.dataset.petName;
      if (selectedPets.has(name)) {
        selectedPets.delete(name);
        btn.classList.remove('active');
        btn.setAttribute('aria-pressed', 'false');
      } else {
        selectedPets.add(name);
        btn.classList.add('active');
        btn.setAttribute('aria-pressed', 'true');
      }
    });
  });
}

// ─── Google Maps 初期化 ───
let currentPosMarker = null;
let currentPos = null;

async function initMap() {
  const settings = storage.get('settings', {});
  const apiKey = settings.googleMapsApiKey;
  const mapEl = document.getElementById('walk-tracking-map');
  if (!mapEl) return;

  if (!apiKey) {
    mapEl.innerHTML = `
      <div style="display:flex;flex-direction:column;align-items:center;justify-content:center;
        height:100%;gap:12px;color:var(--color-text-muted);font-family:var(--font-pop)">
        <span style="font-size:2.5rem">🗺️</span>
        <p style="font-size:0.85rem;text-align:center">Google Maps APIキーを<br>設定画面から設定してください</p>
      </div>`;
    return;
  }

  await loadMapsScript(apiKey);

  // まずデフォルト位置で即座にマップを表示
  const defaultCenter = { lat: 35.6812, lng: 139.7671 };
  map = new google.maps.Map(mapEl, {
    center: defaultCenter,
    zoom: 16,
    disableDefaultUI: false,
    styles: mapStyle()
  });
  polyline = new google.maps.Polyline({
    strokeColor: '#8B5E3C',
    strokeOpacity: 0.9,
    strokeWeight: 5,
    map
  });

  // ─── 現在地ボタンを追加 ───
  const locationBtn = document.createElement('button');
  locationBtn.innerHTML = '📍';
  locationBtn.title = '現在地に戻る';
  locationBtn.style.cssText = `
    background: white; border: none; border-radius: 50%;
    width: 40px; height: 40px; font-size: 1.2rem;
    box-shadow: 0 2px 6px rgba(0,0,0,0.3); cursor: pointer;
    display: flex; align-items: center; justify-content: center;
    margin: 10px;
  `;
  locationBtn.addEventListener('click', () => {
    if (currentPos) {
      map.panTo(currentPos);
      map.setZoom(16);
    } else {
      // 再取得を試みる
      navigator.geolocation.getCurrentPosition(
        pos => {
          currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          updateCurrentPosMarker(currentPos);
          map.panTo(currentPos);
          map.setZoom(16);
        },
        () => {},
        { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
      );
    }
  });
  map.controls[google.maps.ControlPosition.RIGHT_BOTTOM].push(locationBtn);

  // ─── GPS位置を取得して現在地マーカーを表示 ───
  navigator.geolocation.getCurrentPosition(
    pos => {
      currentPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      updateCurrentPosMarker(currentPos);
      map.setCenter(currentPos);
    },
    () => {
      console.warn('GPS位置取得に失敗しました');
    },
    { enableHighAccuracy: true, timeout: 8000, maximumAge: 30000 }
  );
}

// 現在地マーカー（青い丸）の表示・更新
function updateCurrentPosMarker(pos) {
  if (!map) return;
  if (currentPosMarker) {
    currentPosMarker.setPosition(pos);
  } else {
    currentPosMarker = new google.maps.Marker({
      position: pos,
      map,
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 8,
        fillColor: '#4285F4',
        fillOpacity: 1,
        strokeColor: '#ffffff',
        strokeWeight: 3
      },
      title: '現在地',
      zIndex: 999
    });
  }
}

function loadMapsScript(apiKey) {
  if (window.google?.maps) return Promise.resolve();
  return new Promise((resolve, reject) => {
    if (document.getElementById('gmaps-script')) { resolve(); return; }
    const s = document.createElement('script');
    s.id = 'gmaps-script';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
    s.onload = resolve;
    s.onerror = reject;
    document.head.appendChild(s);
  });
}

function mapStyle() {
  return [
    { elementType: 'geometry', stylers: [{ color: '#f5ede3' }] },
    { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e0f0' }] },
    { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
    { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4edda' }] }
  ];
}

// ─── 散歩開始 ───
function startWalk() {
  if (selectedPets.size === 0) { alert('散歩するペットを選んでください'); return; }

  const started = tracker.start(({ coords, distance, elapsedStr }) => {
    // 距離・時間を更新
    const distEl = document.getElementById('stat-distance');
    const timeEl = document.getElementById('stat-time');
    if (distEl) distEl.textContent = distance.toFixed(2);
    if (timeEl) timeEl.textContent = elapsedStr;

    // ポリライン更新
    if (polyline && coords.length > 0) {
      polyline.setPath(coords);
      if (map) map.panTo(coords[coords.length - 1]);
    }
  });

  if (!started) return;

  document.getElementById('btn-walk-start')?.classList.add('hidden');
  document.getElementById('btn-walk-end')?.classList.add('visible');
  document.getElementById('pet-buttons-area')?.style.setProperty('pointer-events', 'none');
}

// ─── 散歩終了 ───
async function endWalk() {
  const result = tracker.stop();
  const dateStr = todayStr();
  const petsArr = Array.from(selectedPets);

  const walk = {
    date: dateStr,
    pets: petsArr,
    distance: result.distance,
    duration: result.duration,
    coords: result.coords
  };

  walkStore.add(walk);
  await gasClient.postWalk({
    date: dateStr,
    pets: petsArr.join(','),
    distance: result.distance,
    duration: result.duration,
    coords: JSON.stringify(result.coords)
  });

  alert(`散歩おわり！🐾\n距離: ${result.distance.toFixed(2)}km\nお疲れさまでした！`);
  window.location.href = 'index.html';
}

// ─── 初期化 ───
document.addEventListener('DOMContentLoaded', () => {
  renderPetButtons();
  initMap();

  document.getElementById('btn-walk-start')?.addEventListener('click', startWalk);
  document.getElementById('btn-walk-end')?.addEventListener('click', endWalk);
  document.getElementById('btn-back')?.addEventListener('click', () => {
    if (tracker.isTracking()) {
      if (!confirm('散歩中です。記録せずに戻りますか？')) return;
      tracker.stop();
    }
    window.location.href = 'index.html';
  });
});
