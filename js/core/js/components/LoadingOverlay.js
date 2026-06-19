/**
 * LoadingOverlay.js — ローディング画面コンポーネント
 */
export const LoadingOverlay = {
  _el: null,
  _isVisible: false,
  _rafId: null,

  show(message = '読み込み中') {
    this._isVisible = true;
    if (!this._el) {
      this._el = document.createElement('div');
      this._el.className = 'loading-overlay';
      this._el.innerHTML = `
        <div class="loading-spinner-container">
          <div class="loading-spinner"></div>
          <div class="loading-icon">🐾</div>
        </div>
        <div class="loading-text">
          <span id="loading-msg"></span>
          <div class="loading-dots">
            <span>.</span><span>.</span><span>.</span>
          </div>
        </div>
      `;
      document.body.appendChild(this._el);
    }
    
    this._el.querySelector('#loading-msg').textContent = message;
    
    if (this._rafId) cancelAnimationFrame(this._rafId);
    
    // アニメーション表示
    this._rafId = requestAnimationFrame(() => {
      if (this._isVisible && this._el) {
        this._el.classList.add('show');
      }
    });
  },

  hide() {
    this._isVisible = false;
    if (this._rafId) {
      cancelAnimationFrame(this._rafId);
      this._rafId = null;
    }
    if (this._el) {
      this._el.classList.remove('show');
    }
  }
};
