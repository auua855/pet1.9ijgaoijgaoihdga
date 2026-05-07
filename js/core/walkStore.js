/**
 * walkStore.js — 散歩記録の状態管理
 */
import storage from './storage.js';

const KEY = 'walk_records';

const walkStore = {
  getAll() {
    return storage.get(KEY, []);
  },
  setAll(records) {
    storage.set(KEY, records);
  },
  add(walk) {
    const walks = this.getAll();
    const newWalk = {
      id: 'walk_' + Date.now(),
      createdAt: new Date().toISOString(),
      ...walk
    };
    walks.unshift(newWalk); // 新しいものを先頭に
    storage.set(KEY, walks);
    return newWalk;
  },
  getByDate(dateStr) {
    return this.getAll().filter(w => w.date?.startsWith(dateStr));
  },
  getRecent(n = 5) {
    return this.getAll().slice(0, n);
  },
  getLast() {
    const walks = this.getAll();
    return walks.length > 0 ? walks[0] : null;
  },
  remove(id) {
    storage.set(KEY, this.getAll().filter(w => w.id !== id));
  }
};

export default walkStore;
