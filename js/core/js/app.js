/**
 * app.js — メイン画面エントリーポイント
 */
import { Header } from './components/Header.js';
import { ActionButtons } from './components/ActionButtons.js';
import { Calendar } from './components/Calendar.js';
import { WalkLogMap } from './components/WalkLogMap.js';
import { HealthRecordModal } from './modals/HealthRecordModal.js';
import { SettingsModal } from './modals/SettingsModal.js';
import { PinAuth } from './components/PinAuth.js';
import { LoadingOverlay } from './components/LoadingOverlay.js';
import gasClient from './core/gasClient.js';
import recordStore from './core/recordStore.js';
import walkStore from './core/walkStore.js';

// ─── トースト通知（他モジュールからも使えるよう export）───
export function showToast(message, duration = 2500) {
  document.querySelector('.toast')?.remove();
  const toast = document.createElement('div');
  toast.className = 'toast';
  toast.textContent = message;
  document.body.appendChild(toast);
  requestAnimationFrame(() => {
    requestAnimationFrame(() => toast.classList.add('show'));
  });
  setTimeout(() => {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ─── アプリ初期化 ───
document.addEventListener('DOMContentLoaded', () => {
  new PinAuth(() => {
    initApp();
  });
});

function initApp() {
  let calendar = null;
  let walkMap = null;

  const syncData = async () => {
    LoadingOverlay.show('読み込み中');
    try {
      // GASから最新データを並行取得
      const [healthData, walkData] = await Promise.all([
        gasClient.fetchHealthRecords(),
        gasClient.fetchWalkRecords()
      ]);
      
      // ローカルストレージをスプレッドシートのデータで完全に上書き
      if (healthData) recordStore.setAll(healthData);
      if (walkData) walkStore.setAll(walkData);

      // コンポーネントを再描画
      calendar?.refresh();
      walkMap?.refresh();
      
      showToast('最新データを読み込みました！');
    } catch (e) {
      console.error('同期エラー:', e);
      showToast('読み込みに失敗しました');
    } finally {
      LoadingOverlay.hide();
    }
  };

  // コンポーネント初期化
  new Header(
    document.getElementById('header-area'),
    { 
      onSettingsClick: openSettings,
      onRefreshClick: syncData
    }
  );

  new ActionButtons(
    document.getElementById('action-area'),
    {
      onHealthClick: () => {
        new HealthRecordModal({
          onSave: () => {
            calendar?.refresh();
          }
        });
      },
      onWalkClick: () => {
        window.location.href = 'walk-record.html';
      }
    }
  );

  calendar = new Calendar(document.getElementById('calendar-area'));
  walkMap = new WalkLogMap(
    document.getElementById('walklog-area'),
    { onMapClick: () => { window.location.href = 'walk-history.html'; } }
  );

  // Service Worker 登録
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js')
      .then(() => console.log('SW registered'))
      .catch(e => console.error('SW error:', e));
  }

  // アプリ起動時に同期（セッション中の初回のみ実行）
  // ページ遷移（戻るボタン等）では実行しない
  if (!sessionStorage.getItem('synced')) {
    sessionStorage.setItem('synced', 'true');
    syncData();
  }
}

function openSettings() {
  new SettingsModal({ onClose: () => {} });
}
