/**
 * recordStore.js — 体調記録の状態管理
 */
import storage from './storage.js';

const KEY = 'health_records';

const recordStore = {
  getAll() {
    return storage.get(KEY, []);
  },
  setAll(records) {
    storage.set(KEY, records);
  },
  add(record) {
    const records = this.getAll();
    const newRecord = {
      id: 'rec_' + Date.now(),
      type: 'health',
      createdAt: new Date().toISOString(),
      ...record
    };
    records.push(newRecord);
    storage.set(KEY, records);
    return newRecord;
  },
  getByDate(dateStr) {
    // dateStr: 'YYYY-MM-DD'
    return this.getAll().filter(r => r.date?.startsWith(dateStr));
  },
  remove(id) {
    storage.set(KEY, this.getAll().filter(r => r.id !== id));
  }
};

export default recordStore;
