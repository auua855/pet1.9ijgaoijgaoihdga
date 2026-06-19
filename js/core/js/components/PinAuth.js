/**
 * PinAuth.js — PINコード認証コンポーネント
 */
export class PinAuth {
  constructor(onSuccess) {
    this.onSuccess = onSuccess;
    this.correctPin = '0723';
    this.checkAuth();
  }

  checkAuth() {
    const isUnlocked = localStorage.getItem('appUnlocked');
    if (isUnlocked === 'true') {
      // 既に解除済みならコールバックを実行
      this.onSuccess?.();
    } else {
      // 未解除ならPIN入力画面を表示
      this.render();
    }
  }

  render() {
    const overlay = document.createElement('div');
    overlay.className = 'pin-auth-overlay';
    overlay.id = 'pin-auth-overlay';
    
    overlay.innerHTML = `
      <div class="pin-logo">choko<span>&amp;</span>pero</div>
      <p class="pin-message">🐾 アプリを開くには<br>PINコードを入力してね</p>
      
      <div class="pin-input-group">
        <input type="password" inputmode="numeric" pattern="[0-9]*" 
          class="pin-input" id="pin-input" placeholder="****" maxlength="4" autocomplete="off">
        <button class="pin-btn" id="pin-submit">ロック解除 🔓</button>
      </div>
    `;

    document.body.appendChild(overlay);
    this._bindEvents(overlay);
  }

  _bindEvents(overlay) {
    const input = overlay.querySelector('#pin-input');
    const submitBtn = overlay.querySelector('#pin-submit');

    const verify = () => {
      if (input.value === this.correctPin) {
        localStorage.setItem('appUnlocked', 'true');
        overlay.remove();
        this.onSuccess?.();
      } else {
        input.classList.remove('error');
        // リフローを強制してアニメーションを再トリガー
        void input.offsetWidth;
        input.classList.add('error');
        input.value = '';
        input.focus();
      }
    };

    submitBtn.addEventListener('click', verify);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') verify();
    });
    
    // スマホでの入力をスムーズにするためフォーカスを当てる
    setTimeout(() => input.focus(), 100);
  }
}
