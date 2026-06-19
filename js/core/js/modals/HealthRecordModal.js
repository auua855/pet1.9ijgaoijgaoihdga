/**
 * HealthRecordModal.js — 体調記録入力モーダル
 */
import petStore from '../core/petStore.js';
import recordStore from '../core/recordStore.js';
import gasClient from '../core/gasClient.js';
import { showToast } from '../app.js';

export class HealthRecordModal {
  constructor({ onSave }) {
    this.onSave = onSave;
    this.selectedPetId = null;
    this.photoId = null;
    this._open();
  }

  _open() {
    const pets = petStore.getAll();
    const d = new Date();
    const today = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const petChips = pets.length > 0
      ? pets.map(p => `
          <button class="chip" data-pet-id="${p.id}" data-pet-name="${p.name}"
            type="button" aria-pressed="false">${p.name}</button>
        `).join('')
      : '<p style="color:var(--color-text-muted);font-size:0.85rem">設定画面でペットを登録してください</p>';

    document.body.insertAdjacentHTML('beforeend', `
      <div class="modal-overlay" id="health-modal" role="dialog" aria-modal="true" aria-labelledby="health-modal-title">
        <div class="modal-sheet">
          <div class="modal-handle"></div>
          <div class="modal-header">
            <h2 class="modal-title" id="health-modal-title">🩺 体調を記録する</h2>
            <button class="modal-close" id="health-modal-close" aria-label="閉じる">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label class="form-label">📅 日付</label>
              <input type="date" class="form-input" id="health-date" value="${today}">
            </div>
            <div class="form-group">
              <label class="form-label">🐾 ペットを選んでね</label>
              <div class="pet-select-chips" id="pet-chips">${petChips}</div>
            </div>
            <div class="form-group">
              <label class="form-label">📝 内容</label>
              <textarea class="form-textarea" id="health-content"
                placeholder="例：元気で食欲あり、うんちの状態良好" rows="3"></textarea>
            </div>
            <div class="form-group">
              <label class="form-label">📷 写真（任意）</label>
              <div class="photo-preview" id="photo-preview" role="button" tabindex="0"
                aria-label="写真を選択">
                <div class="photo-preview-hint">
                  <span class="hint-icon">📷</span>
                  <span>タップして写真を選択</span>
                </div>
              </div>
              <input type="file" id="photo-input" accept="image/*" capture="environment"
                style="display:none" aria-hidden="true">
            </div>
            <button class="btn-primary" id="health-save">💾 記録を保存する</button>
          </div>
        </div>
      </div>
    `);

    this._bindEvents();
  }

  _bindEvents() {
    const modal = document.getElementById('health-modal');
    const close = () => modal?.remove();

    document.getElementById('health-modal-close').addEventListener('click', close);
    modal.addEventListener('click', e => { if (e.target === modal) close(); });

    // ペット選択チップ
    document.querySelectorAll('#pet-chips .chip').forEach(chip => {
      chip.addEventListener('click', () => {
        document.querySelectorAll('#pet-chips .chip').forEach(c => {
          c.classList.remove('active');
          c.setAttribute('aria-pressed', 'false');
        });
        chip.classList.add('active');
        chip.setAttribute('aria-pressed', 'true');
        this.selectedPetId = chip.dataset.petId;
        this.selectedPetName = chip.dataset.petName;
      });
    });

    // 写真選択
    const preview = document.getElementById('photo-preview');
    const photoInput = document.getElementById('photo-input');
    preview.addEventListener('click', () => photoInput.click());
    preview.addEventListener('keydown', e => { if (e.key === 'Enter') photoInput.click(); });
    photoInput.addEventListener('change', e => {
      const file = e.target.files[0];
      if (!file) return;
      this.photoFile = file; // ファイルオブジェクトを保持
      const url = URL.createObjectURL(file);
      preview.innerHTML = `<img src="${url}" alt="選択した写真">`;
    });

    // 保存
    document.getElementById('health-save').addEventListener('click', () => this._save());
  }

  // ファイルをBase64文字列に変換するヘルパー
  _fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        // "data:image/jpeg;base64,/9j/..." のカンマ以降を抽出
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = error => reject(error);
      reader.readAsDataURL(file);
    });
  }

  async _save() {
    const date = document.getElementById('health-date').value;
    const content = document.getElementById('health-content').value.trim();

    if (!this.selectedPetId) { alert('ペットを選んでください'); return; }
    if (!content) { alert('内容を入力してください'); return; }

    const record = {
      date,
      petId: this.selectedPetId,
      petName: this.selectedPetName,
      content,
      photoId: this.photoFile ? '写真あり' : null
    };

    // ローカル保存
    recordStore.add(record);

    // モーダルを閉じてUIを更新
    document.getElementById('health-modal')?.remove();
    this.onSave?.();
    showToast(this.photoFile ? '記録を保存中... (写真アップロード)' : '体調記録を保存しました 🩺');

    // GASへ送信
    try {
      let base64Data = null;
      let mimeType = null;
      let fileName = null;

      if (this.photoFile) {
        base64Data = await this._fileToBase64(this.photoFile);
        mimeType = this.photoFile.type;
        fileName = this.photoFile.name;
      }

      await gasClient.postHealth({
        ...record,
        photoBase64: base64Data,
        photoMimeType: mimeType,
        photoFileName: fileName
      });
      if (this.photoFile) {
        showToast('写真のアップロードが完了しました！');
      }
    } catch (e) {
      console.error('GASエラー:', e);
      showToast('アップロードに失敗しました。');
    }
  }
}
