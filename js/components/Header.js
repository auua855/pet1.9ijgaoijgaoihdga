/**
 * Header.js — ヘッダーコンポーネント
 */
export class Header {
  /**
   * @param {HTMLElement} container
   * @param {Object} opts
   * @param {Function} opts.onSettingsClick
   * @param {Function} opts.onRefreshClick
   */
  constructor(container, { onSettingsClick, onRefreshClick }) {
    this.container = container;
    this.onSettingsClick = onSettingsClick;
    this.onRefreshClick = onRefreshClick;
    this.render();
  }
  render() {
    this.container.innerHTML = `
      <header class="app-header">
        <div class="header-bg-wrapper">
          <div class="header-bg active" id="header-bg-1"></div>
          <div class="header-bg" id="header-bg-2"></div>
        </div>
        <span class="app-version">v1.1</span>
        <div class="header-content">
          <div class="header-logo">
            <img src="assets/images/icon.png" alt="choko&pero" class="header-icon">
            <h1 class="header-title">choko<span>&amp;</span>pero</h1>
          </div>
          <div class="header-actions">
            <button class="btn-refresh" id="btn-refresh" aria-label="最新状態に更新">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round">
                <path d="M21 2v6h-6"></path>
                <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
                <path d="M3 22v-6h6"></path>
                <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
              </svg>
            </button>
            <button class="btn-settings" id="btn-settings" aria-label="設定を開く">
              <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" stroke-width="2.2"
                stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="3"/>
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06
                  a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09
                  A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83
                  l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09
                  A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83
                  l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09
                  a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83
                  l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09
                  a1.65 1.65 0 0 0-1.51 1z"/>
              </svg>
            </button>
          </div>
        </div>
      </header>
    `;
    this._applyBg();
    this.container.querySelector('#btn-settings')
      .addEventListener('click', this.onSettingsClick);
    this.container.querySelector('#btn-refresh')
      .addEventListener('click', this.onRefreshClick);
  }

  /** header-bg フォルダ内の画像を背景に適用し、1分おきに交互に切り替える */
  _applyBg() {
    const images = [
      'assets/images/header-bg/20260411_215143-IMG_STYLE.jpg',
      'assets/images/header-bg/20260503_192854-IMG_STYLE.jpg'
    ];
    
    const bg1 = this.container.querySelector('#header-bg-1');
    const bg2 = this.container.querySelector('#header-bg-2');

    if (!bg1 || !bg2) return;

    // 初期状態の設定
    bg1.style.backgroundImage = `url('${images[0]}')`;
    bg2.style.backgroundImage = `url('${images[1]}')`;

    let currentIdx = 0;
    
    // 60秒（1分）おきに交互に切り替え
    setInterval(() => {
      currentIdx = (currentIdx === 0) ? 1 : 0;
      
      if (currentIdx === 0) {
        bg1.classList.add('active');
        bg2.classList.remove('active');
      } else {
        bg1.classList.remove('active');
        bg2.classList.add('active');
      }
    }, 60000);
  }
}
