/**
 * distanceCalc.js — ハバーサイン公式で2点間の距離を計算
 */

/**
 * 2点間の距離を km で返す
 * @param {{lat:number, lng:number}} c1
 * @param {{lat:number, lng:number}} c2
 */
function haversine(c1, c2) {
  const R = 6371; // 地球の半径 (km)
  const dLat = (c2.lat - c1.lat) * Math.PI / 180;
  const dLng = (c2.lng - c1.lng) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(c1.lat * Math.PI / 180) *
    Math.cos(c2.lat * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 座標配列の合計距離を km で返す（小数点2桁）
 * @param {Array<{lat:number, lng:number}>} coords
 */
export function totalDistance(coords) {
  if (!coords || coords.length < 2) return 0;
  let dist = 0;
  for (let i = 1; i < coords.length; i++) {
    dist += haversine(coords[i - 1], coords[i]);
  }
  return Math.round(dist * 100) / 100;
}

/**
 * 秒数を "mm:ss" 形式に変換
 */
export function formatElapsed(seconds) {
  const m = String(Math.floor(seconds / 60)).padStart(2, '0');
  const s = String(seconds % 60).padStart(2, '0');
  return `${m}:${s}`;
}

/**
 * 秒数を "X分Y秒" 形式に変換
 */
export function formatDurationText(seconds) {
  if (typeof seconds === 'string' && isNaN(Number(seconds))) return seconds; // すでに文字列ならそのまま返す
  const sec = Number(seconds);
  if (isNaN(sec) || sec <= 0) return '';
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  if (m === 0) return `${s}秒`;
  return `${m}分${s}秒`;
}
