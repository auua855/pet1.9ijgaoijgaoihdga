/**
 * WalkLogMap.js — 直近の散歩ルート表示コンポーネント
 */
import walkStore from '../core/walkStore.js';
import storage from '../core/storage.js';

export class WalkLogMap {
  constructor(container, { onMapClick }) {
    this.container = container;
    this.onMapClick = onMapClick;
    this.map = null;
    this.render();
  }

  render() {
    const recent = walkStore.getRecent(3);
    const hasWalks = recent.length > 0;

    const recentListHTML = hasWalks
      ? recent.map(w => {
          const pets = Array.isArray(w.pets) ? w.pets.join('・') : (w.pets || '');
          const dist = w.distance != null ? w.distance.toFixed(2) + 'km' : '-';
          return `
            <div class="walk-recent-item">
              <span class="walk-recent-date">${w.date || ''}</span>
              <span class="walk-recent-pets">🐾 ${pets}</span>
              <span class="walk-recent-dist">${dist}</span>
            </div>`;
        }).join('')
      : '';

    this.container.innerHTML = `
      <section class="walk-log-section" aria-label="散歩ログ">
        <h2 class="section-title">🗺️ 散歩の記録</h2>
        <div class="walk-map-wrapper" id="walk-map-wrapper" role="button" tabindex="0"
          aria-label="散歩の記録一覧を開く">
          <div id="walk-log-map"></div>
          <div class="walk-map-placeholder" id="walk-map-placeholder" style="display:none">
            <span class="placeholder-icon">🗺️</span>
            <p>Google Maps APIキーを<br>設定画面から設定してください</p>
          </div>
        </div>
        ${hasWalks ? `<div class="walk-recent-list">${recentListHTML}</div>` : ''}
      </section>
    `;

    const wrapper = this.container.querySelector('#walk-map-wrapper');
    wrapper.addEventListener('click', () => this.onMapClick?.());
    wrapper.addEventListener('keydown', e => { if (e.key === 'Enter') this.onMapClick?.(); });

    this._initMap();
  }

  _initMap() {
    const settings = storage.get('settings', {});
    const apiKey = settings.googleMapsApiKey;
    if (!apiKey) {
      this._showPlaceholder();
      return;
    }
    this._loadMaps(apiKey).then(() => this._drawLastRoute());
  }

  _showPlaceholder() {
    const mapEl = this.container.querySelector('#walk-log-map');
    const placeholder = this.container.querySelector('#walk-map-placeholder');
    if (mapEl) mapEl.style.display = 'none';
    if (placeholder) placeholder.style.display = 'flex';
  }

  _loadMaps(apiKey) {
    if (window.google?.maps) return Promise.resolve();
    return new Promise((resolve, reject) => {
      if (document.getElementById('gmaps-script')) { resolve(); return; }
      const s = document.createElement('script');
      s.id = 'gmaps-script';
      s.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
      s.onload = resolve;
      s.onerror = () => { this._showPlaceholder(); reject(); };
      document.head.appendChild(s);
    });
  }

  _drawLastRoute() {
    const mapEl = this.container.querySelector('#walk-log-map');
    if (!mapEl || !window.google?.maps) return;

    const last = walkStore.getLast();
    const center = last?.coords?.[0]
      ? { lat: last.coords[0].lat, lng: last.coords[0].lng }
      : { lat: 35.6812, lng: 139.7671 }; // 東京デフォルト

    this.map = new google.maps.Map(mapEl, {
      center,
      zoom: 15,
      disableDefaultUI: true,
      gestureHandling: 'none',
      styles: this._mapStyle()
    });

    if (last?.coords?.length > 1) {
      new google.maps.Polyline({
        path: last.coords,
        strokeColor: '#8B5E3C',
        strokeOpacity: 0.9,
        strokeWeight: 4,
        map: this.map
      });
    }
  }

  refresh() { this.render(); }

  _mapStyle() {
    return [
      { elementType: 'geometry', stylers: [{ color: '#f5ede3' }] },
      { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#c9e0f0' }] },
      { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#ffffff' }] },
      { featureType: 'road', elementType: 'geometry.stroke', stylers: [{ color: '#e8d5c0' }] },
      { featureType: 'poi.park', elementType: 'geometry', stylers: [{ color: '#d4edda' }] }
    ];
  }
}
