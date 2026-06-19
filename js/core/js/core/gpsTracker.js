/**
 * gpsTracker.js — GPSトラッキングロジック
 */
import { totalDistance, formatElapsed } from './distanceCalc.js';
import storage from './storage.js';

export class GPSTracker {
  constructor() {
    this.coords = [];
    this.watchId = null;
    this.gpsIntervalId = null;
    this.startTime = null;
    this.timerInterval = null;
    this.onUpdate = null;
  }

  /**
   * トラッキング開始
   * @param {function} onUpdate - ({coords, distance, elapsed}) を受け取るコールバック
   * @returns {boolean} 開始できたか
   */
  start(onUpdate) {
    if (!navigator.geolocation) {
      alert('このデバイスはGPSに対応していません');
      return false;
    }
    this.coords = [];
    this.startTime = Date.now();
    this.onUpdate = onUpdate;

    const settings = storage.get('settings', {});
    const freq = settings.gpsFrequency || 'realtime';

    const handleSuccess = (pos) => {
      const coord = { lat: pos.coords.latitude, lng: pos.coords.longitude };
      this.coords.push(coord);
      this._notify();
    };
    const handleError = (err) => console.error('GPS Error:', err.message);

    if (freq === 'realtime') {
      this.watchId = navigator.geolocation.watchPosition(
        handleSuccess, handleError,
        { enableHighAccuracy: true, maximumAge: 2000, timeout: 10000 }
      );
    } else {
      const intervalMs = parseInt(freq) * 1000;
      
      const getPos = () => {
        navigator.geolocation.getCurrentPosition(
          handleSuccess, handleError,
          { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
        );
      };
      
      getPos(); // 最初の1回
      this.gpsIntervalId = setInterval(getPos, intervalMs);
      this.watchId = 'polling'; // トラッキング中のフラグとして使用
    }

    // タイマー（1秒ごとに経過時間を更新）
    this.timerInterval = setInterval(() => this._notify(), 1000);
    return true;
  }

  /**
   * トラッキング終了
   * @returns {{coords, distance, duration}} 記録データ
   */
  stop() {
    if (this.watchId !== null && typeof this.watchId === 'number') {
      navigator.geolocation.clearWatch(this.watchId);
    }
    this.watchId = null;

    if (this.gpsIntervalId !== null) {
      clearInterval(this.gpsIntervalId);
      this.gpsIntervalId = null;
    }

    if (this.timerInterval !== null) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
    const duration = this.startTime
      ? Math.floor((Date.now() - this.startTime) / 1000)
      : 0;
    return {
      coords: [...this.coords],
      distance: totalDistance(this.coords),
      duration
    };
  }

  isTracking() { return this.watchId !== null; }

  _notify() {
    if (!this.onUpdate) return;
    const elapsed = this.startTime
      ? Math.floor((Date.now() - this.startTime) / 1000)
      : 0;
    this.onUpdate({
      coords: this.coords,
      distance: totalDistance(this.coords),
      elapsed,
      elapsedStr: formatElapsed(elapsed)
    });
  }
}
