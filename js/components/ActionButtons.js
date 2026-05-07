/**
 * ActionButtons.js — アクションボタンコンポーネント
 */
export class ActionButtons {
  /**
   * @param {HTMLElement} container
   * @param {Object} opts
   * @param {Function} opts.onHealthClick
   * @param {Function} opts.onWalkClick
   */
  constructor(container, { onHealthClick, onWalkClick }) {
    this.container = container;
    this.render(onHealthClick, onWalkClick);
  }

  render(onHealthClick, onWalkClick) {
    this.container.innerHTML = `
      <section class="action-buttons" aria-label="記録メニュー">
        <button class="btn-action btn-health" id="btn-health" aria-label="体調を記録する">
          <span class="btn-icon">🩺</span>
          <span class="btn-label">体調記録する</span>
        </button>
        <button class="btn-action btn-walk" id="btn-walk" aria-label="散歩を記録する">
          <span class="btn-icon">🐾</span>
          <span class="btn-label">散歩記録する</span>
        </button>
      </section>
    `;
    this.container.querySelector('#btn-health')
      .addEventListener('click', onHealthClick);
    this.container.querySelector('#btn-walk')
      .addEventListener('click', onWalkClick);
  }
}
