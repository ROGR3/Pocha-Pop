// Android back button (and Esc on desktop): go to the previous screen instead
// of closing the app. Only the title screen exits.
import Phaser from 'phaser';
import { IS_ANDROID } from './ime';
import { G } from './state';
import { isTauri } from '../logic/save';

export interface BackAware { onBack?: () => void }

export function setupBack(game: Phaser.Game) {
  const handle = () => {
    const sc = game.scene.getScenes(true)[0] as Phaser.Scene & BackAware;
    if (!sc) return;
    if (sc.onBack) { sc.onBack(); return; }
    if (sc.scene.key === 'Title') { exitApp(); return; }
    if (sc.scene.key !== 'Boot') sc.scene.start('Map');
  };
  if (isTauri() && IS_ANDROID) {
    import('@tauri-apps/api/app').then((m) => m.onBackButtonPress(() => handle())).catch((e) => console.warn('back button', e));
  }
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && e.target !== G.ime?.el) handle();
  });
}

function exitApp() {
  if (!isTauri()) return;
  import('@tauri-apps/api/app').then((m) => m.exit(0)).catch(() => {});
}
