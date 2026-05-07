/**
 * Calendar.js — カレンダーコンポーネント
 */
import recordStore from '../core/recordStore.js';
import walkStore from '../core/walkStore.js';
import { formatDurationText } from '../core/distanceCalc.js';

const WEEK = ['日', '月', '火', '水', '木', '金', '土'];
const MONTHS = ['1月','2月','3月','4月','5月','6月','7月','8月','9月','10月','11月','12月'];

export class Calendar {
  constructor(container) {
    this.container = container;
    const now = new Date();
    this.year = now.getFullYear();
    this.month = now.getMonth(); // 0-indexed
    this.viewMode = 'calendar'; // 'calendar' or 'list'
    this.render();
  }

  // 'YYYY-MM-DD' 形式の日付キーを生成
  _dateKey(y, m, d) {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
  }

  render() {
    const { year, month } = this;
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const today = new Date();

    const healthAll = recordStore.getAll();
    const walkAll = walkStore.getAll();

    // ─── カレンダー表示の生成 ───
    const weekHeader = WEEK.map((d, i) =>
      `<div class="cal-weekday ${i === 0 ? 'cal-sun' : i === 6 ? 'cal-sat' : ''}">${d}</div>`
    ).join('');

    const emptyCells = Array.from({ length: firstDay }, () =>
      '<div class="cal-cell cal-cell--empty"></div>'
    ).join('');

    const dayCells = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const key = this._dateKey(year, month, d);
      const hasHealth = healthAll.some(r => r.date?.startsWith(key));
      const walkRecs = walkAll.filter(w => w.date?.startsWith(key));
      const walkDist = walkRecs.reduce((s, w) => s + (w.distance || 0), 0);
      const hasWalk = walkRecs.length > 0;
      const isToday = d === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const isSun = new Date(year, month, d).getDay() === 0;
      const isSat = new Date(year, month, d).getDay() === 6;

      return `
        <div class="cal-cell${isToday ? ' cal-cell--today' : ''}${hasHealth || hasWalk ? ' cal-cell--has-record' : ''}"
          data-date="${key}" role="button" tabindex="0"
          aria-label="${month + 1}月${d}日${hasHealth ? ' 体調記録あり' : ''}${hasWalk ? ` 散歩${walkDist.toFixed(1)}km` : ''}">
          <span class="cal-day${isSun ? ' cal-sun' : isSat ? ' cal-sat' : ''}">${d}</span>
          ${hasHealth ? '<span class="cal-health-dot" aria-hidden="true"></span>' : ''}
          ${hasWalk ? `<span class="cal-walk-dist">${walkDist.toFixed(1)}km</span>` : ''}
        </div>`;
    }).join('');

    // ─── 一覧表示の生成（日ごとテーブル風） ───
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}-`;
    const monthlyHealth = healthAll.filter(r => r.date?.startsWith(prefix));
    const monthlyWalk = walkAll.filter(w => w.date?.startsWith(prefix));
    
    // 日付ごとにグループ化
    const dateMap = new Map();
    monthlyHealth.forEach(r => {
      if (!dateMap.has(r.date)) dateMap.set(r.date, { health: [], walk: [] });
      dateMap.get(r.date).health.push(r);
    });
    monthlyWalk.forEach(w => {
      if (!dateMap.has(w.date)) dateMap.set(w.date, { health: [], walk: [] });
      dateMap.get(w.date).walk.push(w);
    });

    // 日付順ソート
    const sortedDates = [...dateMap.keys()].sort();

    const listHTML = sortedDates.length > 0 ? `
      <table class="cal-list-table">
        <thead>
          <tr>
            <th>日付</th>
            <th>🩺 体調</th>
            <th>🐾 散歩</th>
          </tr>
        </thead>
        <tbody>
          ${sortedDates.map(dateKey => {
            const day = parseInt(dateKey.split('-')[2]);
            const { health, walk } = dateMap.get(dateKey);
            
            // 体調セル（写真ありマーク付き）
            const healthCell = health.length > 0
              ? health.map(r => {
                  let pUrl = r.photoUrl || '';
                  if (!pUrl && r.photoId) pUrl = `https://drive.google.com/file/d/${r.photoId}/view`;
                  const photo = pUrl ? ` <a href="${pUrl}" target="_blank" rel="noopener" style="text-decoration:none">📷</a>` : '';
                  return `<span class="cal-tbl-pet">${r.petName || ''}</span> ${r.content || ''}${photo}`;
                }).join('<br>')
              : '';
            
            // 散歩セル
            const walkCell = walk.length > 0
              ? walk.map(w => {
                  const pets = Array.isArray(w.pets) ? w.pets.join('・') : (w.pets || '');
                  const dist = w.distance != null ? w.distance.toFixed(2) + 'km' : '-';
                  const dur = formatDurationText(w.duration) || '';
                  return `<span class="cal-tbl-pet">${pets}</span> ${dist}${dur ? ' / ' + dur : ''}`;
                }).join('<br>')
              : '';
            
            return `<tr>
              <td class="cal-tbl-date">${month + 1}/${day}</td>
              <td class="cal-tbl-health">${healthCell}</td>
              <td class="cal-tbl-walk">${walkCell}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>
    ` : '<div class="cal-list-empty">この月の記録はありません</div>';

    // ─── 全体のHTML生成 ───
    this.container.innerHTML = `
      <section class="calendar-section" aria-label="カレンダー">
        <div class="calendar-header">
          <div class="cal-nav-group">
            <button class="cal-nav-btn" id="cal-prev" aria-label="前の月">&#8249;</button>
            <h2 class="cal-month-title">${year}年 ${MONTHS[month]}</h2>
            <button class="cal-nav-btn" id="cal-next" aria-label="次の月">&#8250;</button>
          </div>
          <button class="cal-view-toggle" id="cal-view-toggle">
            ${this.viewMode === 'calendar' ? '📋 一覧表示' : '📅 カレンダー'}
          </button>
        </div>
        
        ${this.viewMode === 'calendar' ? `
          <div class="calendar-grid" role="grid">
            ${weekHeader}
            ${emptyCells}
            ${dayCells}
          </div>
        ` : `
          <div class="calendar-list-view">
            ${listHTML}
          </div>
        `}
      </section>
    `;

    // ─── イベントバインド ───
    this.container.querySelector('#cal-prev').addEventListener('click', () => this._prevMonth());
    this.container.querySelector('#cal-next').addEventListener('click', () => this._nextMonth());
    
    this.container.querySelector('#cal-view-toggle').addEventListener('click', () => {
      this.viewMode = this.viewMode === 'calendar' ? 'list' : 'calendar';
      this.render();
    });

    if (this.viewMode === 'calendar') {
      this.container.querySelectorAll('.cal-cell:not(.cal-cell--empty)').forEach(cell => {
        cell.addEventListener('click', () => this._showDetail(cell.dataset.date));
        cell.addEventListener('keydown', e => { if (e.key === 'Enter') this._showDetail(cell.dataset.date); });
      });
    }
  }

  refresh() { this.render(); }

  _prevMonth() {
    if (this.month === 0) { this.month = 11; this.year--; }
    else this.month--;
    this.render();
  }

  _nextMonth() {
    if (this.month === 11) { this.month = 0; this.year++; }
    else this.month++;
    this.render();
  }

  _showDetail(dateKey) {
    const [y, m, d] = dateKey.split('-');
    const healthRecs = recordStore.getByDate(dateKey);
    const walkRecs = walkStore.getByDate(dateKey);
    if (healthRecs.length === 0 && walkRecs.length === 0) return;

    let body = '';
    if (healthRecs.length > 0) {
      body += `<div class="popup-section">
        <h4>🩺 体調記録</h4>
        ${healthRecs.map(r => {
          let photoUrl = r.photoUrl || '';
          if (!photoUrl && r.photoId) {
            photoUrl = `https://drive.google.com/file/d/${r.photoId}/view`;
          }
          const photoHTML = photoUrl
            ? `<p class="popup-photo"><a href="${photoUrl}" target="_blank" rel="noopener">📷 写真を見る</a></p>`
            : '';
          return `
          <div class="popup-record">
            <span class="popup-pet">${r.petName || ''}</span>
            <p>${r.content || ''}</p>
            ${photoHTML}
          </div>`;
        }).join('')}
      </div>`;
    }
    if (walkRecs.length > 0) {
      body += `<div class="popup-section">
        <h4>🐾 散歩記録</h4>
        ${walkRecs.map(w => `
          <div class="popup-record">
            <span class="popup-pet">${Array.isArray(w.pets) ? w.pets.join('・') : (w.pets || '')}</span>
            <p>${w.distance != null ? w.distance.toFixed(2) + 'km' : ''}${w.duration ? ' / ' + formatDurationText(w.duration) : ''}</p>
          </div>`).join('')}
      </div>`;
    }

    document.getElementById('day-detail-popup')?.remove();
    document.body.insertAdjacentHTML('beforeend', `
      <div class="day-detail-popup" id="day-detail-popup" role="dialog" aria-modal="true">
        <div class="popup-overlay" id="popup-overlay"></div>
        <div class="popup-card">
          <div class="popup-handle"></div>
          <div class="popup-header">
            <h3>${parseInt(y)}年${parseInt(m)}月${parseInt(d)}日</h3>
            <button class="popup-close" id="popup-close" aria-label="閉じる">✕</button>
          </div>
          <div class="popup-body">${body}</div>
        </div>
      </div>
    `);

    const close = () => document.getElementById('day-detail-popup')?.remove();
    document.getElementById('popup-close').addEventListener('click', close);
    document.getElementById('popup-overlay').addEventListener('click', close);
  }
}
