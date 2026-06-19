/**
 * petStore.js — ペット情報の状態管理
 */
import storage from './storage.js';

const KEY = 'pets';

const petStore = {
  getAll() {
    return storage.get(KEY, []);
  },
  save(pets) {
    storage.set(KEY, pets);
  },
  add(pet) {
    const pets = this.getAll();
    const newPet = { id: 'pet_' + Date.now(), ...pet };
    pets.push(newPet);
    this.save(pets);
    return newPet;
  },
  update(id, updates) {
    const pets = this.getAll().map(p => p.id === id ? { ...p, ...updates } : p);
    this.save(pets);
  },
  remove(id) {
    this.save(this.getAll().filter(p => p.id !== id));
  }
};

export default petStore;
