/**
 * SettingsModal.js — 設定モーダル（APIキー + ペット情報）
 */
import petStore from '../core/petStore.js';
import storage from '../core/storage.js';
import { showToast } from '../app.js';

export class SettingsModal {
  constructor({ onClose }) {
    this.onClose = onClose;
    this._open();
  }

  _open() {
    const settings = storage.get('settings', {});
    const pets = petStore.getAll();

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <h2 class="modal-title" id="settings-modal-title">⚙️ 設定</h2>
            <button class="modal-close" id="settings-modal-close" aria-label="閉じる">✕</button>
          </div>
          <div class="modal-body" style="padding-top: 0;">

            <!-- タブヘッダー -->
            <div class="settings-tabs" role="tablist">
              <button class="settings-tab active" data-target="tab-pets" role="tab" aria-selected="true">🐾 ペット情報</button>
              <button class="settings-tab" data-target="tab-advanced" role="tab" aria-selected="false">⚙️ 詳細設定</button>
            </div>

            <!-- 🐾 ペット情報 タブ -->
            <div class="tab-content active" id="tab-pets" role="tabpanel">
              <div class="settings-section">
                <div id="pet-cards-container">
                  ${pets.map(p => this._petCardHTML(p)).join('')}
                </div>
                <button class="btn-add-pet" id="btn-add-pet" type="button">
                  ＋ ペットを追加
                </button>
              </div>
            </div>

            <!-- ⚙️ 詳細設定 タブ -->
            <div class="tab-content" id="tab-advanced" role="tabpanel">
              <div class="settings-section">
                <div class="form-group">
                  <label class="form-label" for="input-maps-key">Google Maps APIキー</label>
                  <input type="text" class="form-input" id="input-maps-key"
                    placeholder="AIza..." value="${settings.googleMapsApiKey || ''}"
                    autocomplete="off" spellcheck="false">
                </div>
                <div class="form-group">
                  <label class="form-label" for="input-gas-health">GAS URL（体調記録用）</label>
                  <input type="url" class="form-input" id="input-gas-health"
                    placeholder="https://script.google.com/macros/s/..." 
                    value="${settings.gasHealthUrl || ''}"
                    autocomplete="off">
                </div>
                <div class="form-group">
                  <label class="form-label" for="input-gas-walk">GAS URL（散歩記録用）</label>
                  <input type="url" class="form-input" id="input-gas-walk"
                    placeholder="https://script.google.com/macros/s/..."
                    value="${settings.gasWalkUrl || ''}"
                    autocomplete="off">
                </div>
                <div class="form-group">
                  <label class="form-label" for="input-gps-frequency">GPS更新頻度（散歩の電池節約）</label>
                  <select class="form-select" id="input-gps-frequency">
                    <option value="realtime" ${settings.gpsFrequency === 'realtime' || !settings.gpsFrequency ? 'selected' : ''}>リアルタイム（なめらかな軌跡）</option>
                    <option value="30" ${settings.gpsFrequency === '30' ? 'selected' : ''}>30秒ごと</option>
                    <option value="60" ${settings.gpsFrequency === '60' ? 'selected' : ''}>1分ごと</option>
                    <option value="120" ${settings.gpsFrequency === '120' ? 'selected' : ''}>2分ごと</option>
                  </select>
                </div>
              </div>
            </div>

            <!-- 保存ボタン -->
            <button class="btn-primary" id="settings-save">💾 設定を保存する</button>
          </div>
        </div>
      </div>
    `);

    this._bindEvents();
  }

  _generateYearOptions(selectedYear) {
    let opts = '<option value="">--</option>';
    const currentYear = new Date().getFullYear() + 1; // 来年まで
    for (let y = currentYear; y >= 1990; y--) {
      opts += `<option value="${y}" ${selectedYear == y ? 'selected' : ''}>${y}</option>`;
    }
    return opts;
  }
  _generateMonthOptions(selectedMonth) {
    let opts = '<option value="">--</option>';
    for (let m = 1; m <= 12; m++) {
      opts += `<option value="${String(m).padStart(2, '0')}" ${selectedMonth == m ? 'selected' : ''}>${m}</option>`;
    }
    return opts;
  }
  _generateDayOptions(selectedDay) {
    let opts = '<option value="">--</option>';
    for (let d = 1; d <= 31; d++) {
      opts += `<option value="${String(d).padStart(2, '0')}" ${selectedDay == d ? 'selected' : ''}>${d}</option>`;
    }
    return opts;
  }

  _petCardHTML(p = {}) {
    const id = p.id || ('new_' + Date.now());

    // 誕生日のパース
    let bYear = '', bMonth = '', bDay = '';
    if (p.birthday) {
      const parts = p.birthday.split('-');
      if (parts.length === 3) {
        bYear = parseInt(parts[0]);
        bMonth = parseInt(parts[1]);
        bDay = parseInt(parts[2]);
      }
    }

    const breedType = p.breedType || 'pure';
    const hasInsurance = p.hasInsurance === true;

    return `
      <div class="pet-card" data-pet-id="${id}">
        <div class="pet-card-row">
          <div class="form-group">
            <label class="form-label">名前</label>
            <input type="text" class="form-input pet-name" placeholder="例：ちょこ"
              value="${p.name || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">体重 (kg)</label>
            <input type="number" class="form-input pet-weight" step="0.1" min="0"
              placeholder="3.2" value="${p.weight ?? ''}">
          </div>
        </div>

        <!-- 犬種 -->
        <div class="form-group">
          <label class="form-label">犬種</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="breedType_${id}" class="pet-breed-type" value="pure" ${breedType === 'pure' ? 'checked' : ''}>
              純血
            </label>
            <label class="radio-label">
              <input type="radio" name="breedType_${id}" class="pet-breed-type" value="mix" ${breedType === 'mix' ? 'checked' : ''}>
              ミックス
            </label>
          </div>
        </div>
        <div class="form-group pet-breed-pure-group ${breedType === 'mix' ? 'hidden-field' : ''}">
          <input type="text" class="form-input pet-breed" placeholder="例：チワワ" value="${p.breed || ''}">
        </div>
        <div class="pet-card-row pet-breed-mix-group ${breedType === 'pure' ? 'hidden-field' : ''}">
          <div class="form-group">
            <input type="text" class="form-input pet-mix-1" placeholder="例：チワワ" value="${p.mix1 || ''}">
          </div>
          <div class="form-group">
            <input type="text" class="form-input pet-mix-2" placeholder="例：ダックス" value="${p.mix2 || ''}">
          </div>
        </div>
        
        <div class="pet-card-row">
          <div class="form-group">
            <label class="form-label">誕生日</label>
            <div class="date-drum-group">
              <select class="pet-b-year">${this._generateYearOptions(bYear)}</select>
              <span class="date-drum-label">年</span>
              <select class="pet-b-month">${this._generateMonthOptions(bMonth)}</select>
              <span class="date-drum-label">月</span>
              <select class="pet-b-day">${this._generateDayOptions(bDay)}</select>
              <span class="date-drum-label">日</span>
            </div>
            <!-- 裏で保持するための隠しフィールド（年齢計算などに使用） -->
            <input type="hidden" class="pet-birthday" value="${p.birthday || ''}">
          </div>
        </div>
        
        <div class="pet-card-row">
          <div class="form-group">
            <label class="form-label">年齢 (歳)</label>
            <input type="number" class="form-input pet-age" min="0"
              placeholder="手入力も可" value="${p.age ?? ''}">
          </div>
        </div>

        <div class="form-group">
          <label class="form-label">一日の量</label>
          <input type="text" class="form-input pet-food"
            placeholder="例：100g、朝50g・夕50g" value="${p.foodAmount || ''}">
        </div>
        
        <div class="pet-card-row">
          <div class="form-group">
            <label class="form-label">メーカー</label>
            <input type="text" class="form-input pet-food-maker"
              placeholder="例：ロイヤルカナン" value="${p.foodMaker || ''}">
          </div>
          <div class="form-group">
            <label class="form-label">商品名</label>
            <input type="text" class="form-input pet-food-name"
              placeholder="例：消化器サポート" value="${p.foodName || ''}">
          </div>
        </div>

        <!-- 保険 -->
        <div class="form-group">
          <label class="form-label">保険の加入</label>
          <div class="radio-group">
            <label class="radio-label">
              <input type="radio" name="insuranceType_${id}" class="pet-insurance-type" value="no" ${!hasInsurance ? 'checked' : ''}>
              なし
            </label>
            <label class="radio-label">
              <input type="radio" name="insuranceType_${id}" class="pet-insurance-type" value="yes" ${hasInsurance ? 'checked' : ''}>
              あり
            </label>
          </div>
        </div>
        <div class="form-group pet-insurance-group ${!hasInsurance ? 'hidden-field' : ''}">
          <input type="text" class="form-input pet-insurance-company" placeholder="保険会社名を入力" value="${p.insuranceCompany || ''}">
        </div>

        <button class="btn-remove-pet" type="button" data-remove-id="${id}" style="margin-top: 8px;">🗑️ 削除</button>
      </div>`;
  }

  _bindEvents() {
    const modal = document.getElementById('settings-modal');
    const close = () => {
      modal?.remove();
      this.onClose?.();
    };

    document.getElementById('settings-modal-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    // タブ切り替え
    const tabs = document.querySelectorAll('.settings-tab');
    const contents = document.querySelectorAll('.tab-content');
    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        tabs.forEach(t => { t.classList.remove('active'); t.setAttribute('aria-selected', 'false'); });
        contents.forEach(c => c.classList.remove('active'));
        
        tab.classList.add('active');
        tab.setAttribute('aria-selected', 'true');
        document.getElementById(tab.dataset.target).classList.add('active');
      });
    });

    // ペット追加
    document.getElementById('btn-add-pet').addEventListener('click', () => {
      const container = document.getElementById('pet-cards-container');
      container.insertAdjacentHTML('beforeend', this._petCardHTML());
      this._bindRemoveButtons();
      this._bindAgeCalculation();
      this._bindDynamicFields();
    });

    this._bindRemoveButtons();
    this._bindAgeCalculation();
    this._bindDynamicFields();

    // 保存
    document.getElementById('settings-save').addEventListener('click', () => this._save(close));
  }

  _bindRemoveButtons() {
    document.querySelectorAll('[data-remove-id]').forEach(btn => {
      btn.onclick = () => {
        const id = btn.dataset.removeId;
        const card = document.querySelector(`[data-pet-id="${id}"]`);
        if (!id.startsWith('new_')) petStore.remove(id);
        card?.remove();
      };
    });
  }

  _bindDynamicFields() {
    document.querySelectorAll('.pet-card').forEach(card => {
      // 既にバインド済みの場合はスキップ
      if (card.dataset.dynBound === 'true') return;
      card.dataset.dynBound = 'true';

      const pureGroup = card.querySelector('.pet-breed-pure-group');
      const mixGroup = card.querySelector('.pet-breed-mix-group');
      const breedRadios = card.querySelectorAll('.pet-breed-type');
      
      breedRadios.forEach(r => {
        r.addEventListener('change', (e) => {
          if (e.target.value === 'pure') {
            pureGroup.classList.remove('hidden-field');
            mixGroup.classList.add('hidden-field');
          } else {
            pureGroup.classList.add('hidden-field');
            mixGroup.classList.remove('hidden-field');
          }
        });
      });

      const insGroup = card.querySelector('.pet-insurance-group');
      const insRadios = card.querySelectorAll('.pet-insurance-type');
      insRadios.forEach(r => {
        r.addEventListener('change', (e) => {
          if (e.target.value === 'yes') {
            insGroup.classList.remove('hidden-field');
          } else {
            insGroup.classList.add('hidden-field');
          }
        });
      });
    });
  }

  _bindAgeCalculation() {
    document.querySelectorAll('.pet-card').forEach(card => {
      const yearSel = card.querySelector('.pet-b-year');
      const monthSel = card.querySelector('.pet-b-month');
      const daySel = card.querySelector('.pet-b-day');
      const hiddenInput = card.querySelector('.pet-birthday');
      const ageInput = card.querySelector('.pet-age');
      
      // 既にバインド済みの場合はスキップ
      if (hiddenInput.dataset.bound === 'true') return;
      hiddenInput.dataset.bound = 'true';

      const updateAge = () => {
        const y = yearSel.value;
        const m = monthSel.value;
        const d = daySel.value;

        if (y && m && d) {
          const dateStr = `${y}-${m}-${d}`;
          hiddenInput.value = dateStr;
          
          const birthDate = new Date(dateStr);
          const today = new Date();
          if (!isNaN(birthDate.getTime())) {
            let age = today.getFullYear() - birthDate.getFullYear();
            const md = today.getMonth() - birthDate.getMonth();
            if (md < 0 || (md === 0 && today.getDate() < birthDate.getDate())) {
              age--;
            }
            if (age >= 0) {
              ageInput.value = age;
            }
          }
        } else {
          hiddenInput.value = '';
        }
      };

      yearSel.addEventListener('change', updateAge);
      monthSel.addEventListener('change', updateAge);
      daySel.addEventListener('change', updateAge);
    });
  }

  _save(close) {
    // APIキー・URL・GPS設定 を保存
    const settings = {
      googleMapsApiKey: document.getElementById('input-maps-key').value.trim(),
      gasHealthUrl: document.getElementById('input-gas-health').value.trim(),
      gasWalkUrl: document.getElementById('input-gas-walk').value.trim(),
      gpsFrequency: document.getElementById('input-gps-frequency').value
    };
    storage.set('settings', settings);

    // ペット情報を保存（全更新）
    const cards = document.querySelectorAll('.pet-card');
    const updatedPets = [];
    cards.forEach(card => {
      const id = card.dataset.petId;
      const name = card.querySelector('.pet-name').value.trim();
      if (!name) return;
      const breedTypeRadio = card.querySelector('.pet-breed-type:checked');
      const breedType = breedTypeRadio ? breedTypeRadio.value : 'pure';
      const insuranceRadio = card.querySelector('.pet-insurance-type:checked');
      const hasInsurance = insuranceRadio ? insuranceRadio.value === 'yes' : false;

      updatedPets.push({
        id: id.startsWith('new_') ? 'pet_' + Date.now() + Math.random().toString(36).slice(2) : id,
        name,
        weight: parseFloat(card.querySelector('.pet-weight').value) || null,
        breedType,
        breed: card.querySelector('.pet-breed').value.trim(),
        mix1: card.querySelector('.pet-mix-1').value.trim(),
        mix2: card.querySelector('.pet-mix-2').value.trim(),
        birthday: card.querySelector('.pet-birthday').value || null,
        age: parseInt(card.querySelector('.pet-age').value) ?? null,
        foodAmount: card.querySelector('.pet-food').value.trim(),
        foodMaker: card.querySelector('.pet-food-maker').value.trim(),
        foodName: card.querySelector('.pet-food-name').value.trim(),
        hasInsurance,
        insuranceCompany: card.querySelector('.pet-insurance-company').value.trim()
      });
    });
    petStore.save(updatedPets);

    showToast('設定を保存しました ⚙️');
    close();
  }
}
