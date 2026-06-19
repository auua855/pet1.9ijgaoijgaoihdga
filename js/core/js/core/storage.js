/**
 * storage.js — LocalStorage 読み書きラッパー
 */
const storage = {
  get(key, defaultVal = null) {
    try {
      const val = localStorage.getItem(key);
      return val !== null ? JSON.parse(val) : defaultVal;
    } catch { return defaultVal; }
  },
  set(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) { console.error('storage.set error:', e); }
  },
  remove(key) { localStorage.removeItem(key); }
};

export default storage;
