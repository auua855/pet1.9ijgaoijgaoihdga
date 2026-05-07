/**
 * gasClient.js — Google Apps Script (GAS) との通信
 * APIキーはすべてLocalStorageから取得する
 */
import storage from './storage.js';

const gasClient = {
  _getSettings() {
    return storage.get('settings', {});
  },

  /**
   * 体調記録をGASに送信（スプレッドシートに追記）
   * @param {Object} record - { date, petName, content, photoId }
   */
  async postHealth(record) {
    const { gasHealthUrl } = this._getSettings();
    if (!gasHealthUrl) {
      console.warn('GAS URL（体調記録用）が未設定です');
      return false;
    }
    try {
      const response = await fetch(gasHealthUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addHealth', ...record })
      });
      const result = await response.json();
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      return true;
    } catch (e) {
      console.error('GAS送信エラー（体調）:', e);
      return false;
    }
  },

  /**
   * 散歩記録をGASに送信（散歩用スプレッドシートに追記）
   * @param {Object} walk - { date, pets, distance, coords }
   */
  async postWalk(walk) {
    const { gasWalkUrl } = this._getSettings();
    if (!gasWalkUrl) {
      console.warn('GAS URL（散歩記録用）が未設定です');
      return false;
    }
    try {
      const response = await fetch(gasWalkUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: JSON.stringify({ action: 'addWalk', ...walk })
      });
      const result = await response.json();
      if (result.status === 'error') {
        throw new Error(result.message);
      }
      return true;
    } catch (e) {
      console.error('GAS送信エラー（散歩）:', e);
      return false;
    }
  },

  /**
   * 体調記録をGASから取得
   * @returns {Array} レコード配列
   */
  async fetchHealthRecords() {
    const { gasHealthUrl } = this._getSettings();
    if (!gasHealthUrl) return [];
    try {
      const res = await fetch(`${gasHealthUrl}?action=getHealth`);
      const data = await res.json();
      return Array.isArray(data) ? data.reverse() : [];
    } catch (e) {
      console.error('GAS取得エラー（体調）:', e);
      return [];
    }
  },

  /**
   * 散歩記録をGASから取得
   * @returns {Array} レコード配列
   */
  async fetchWalkRecords() {
    const { gasWalkUrl } = this._getSettings();
    if (!gasWalkUrl) return [];
    try {
      const res = await fetch(`${gasWalkUrl}?action=getWalk`);
      const data = await res.json();
      return Array.isArray(data) ? data.reverse() : [];
    } catch (e) {
      console.error('GAS取得エラー（散歩）:', e);
      return [];
    }
  }
};

export default gasClient;
