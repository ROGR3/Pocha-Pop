// 나비's hat tower: overlay sprites that follow the cat sprite (position, frame,
// flip) using the per-frame head anchors exported by art/src/cat.lua. Only the
// hats below the top edge of the camera get an Image (lazy pool), so a tower of
// 1000 hats costs about as much as the ~100 that fit on screen.
import Phaser from 'phaser';
import head from '../../public/assets/nabi_head.json';
import { HATS, HAT_METRICS } from '../data/colors';
import { hatStackLayout, hatSway } from '../logic/cosmetics';
import { G } from './state';

const CAT_W = 24, CAT_H = 16, HAT_W = 14, HAT_H = 10;

export interface HatTower { refresh(ids?: string[]): void }

/** Attach the hat tower (if any) to a 나비 sprite (origin 0.5, 1). */
export function attachHat(scene: Phaser.Scene, cat: Phaser.GameObjects.Sprite, ids: string[] = G.data.cosmetics.hats): HatTower {
  const pool: Phaser.GameObjects.Image[] = [];
  let frames: number[] = [];
  let layout: { dx: number; dy: number }[] = [];
  const refresh = (next: string[] = G.data.cosmetics.hats) => {
    const known = next.filter((id) => HAT_METRICS[id]);
    frames = known.map((id) => HATS.findIndex((h) => h.id === id));
    layout = hatStackLayout(known, HAT_METRICS);
  };
  const destroy = () => {
    pool.forEach((im) => im.destroy());
    pool.length = 0;
    scene.events.off('postupdate', sync);
  };
  const sync = () => {
    if (!cat.active) { destroy(); return; }
    const f = Number(cat.frame.name) || 0;
    const [hx, hy] = head.frames[f] ?? head.frames[0];
    const left = Math.round(cat.x - CAT_W * cat.originX);
    const top = Math.round(cat.y - CAT_H * cat.originY);
    const x0 = hx - 2;
    const baseX = left + (cat.flipX ? CAT_W - x0 - HAT_W : x0);
    const baseY = top + hy + 4 - (HAT_H - 1);
    const camTop = scene.cameras.main.worldView.y;
    const t = scene.time.now;
    let n = 0;
    if (cat.visible) {
      for (let i = 0; i < layout.length; i++) {
        const y = baseY + layout[i].dy;
        if (y + HAT_H < camTop) break; // dy only goes up: the rest is off-screen
        const dx = layout[i].dx + hatSway(i, t);
        let im = pool[n];
        if (!im) { im = scene.add.image(0, 0, 'hats', 0).setOrigin(0, 0); pool.push(im); }
        im.setFrame(frames[i]).setFlipX(cat.flipX).setPosition(baseX + (cat.flipX ? -dx : dx), y);
        im.setDepth(cat.depth + 0.1).setAlpha(cat.alpha).setVisible(true);
        n++;
      }
    }
    for (let k = n; k < pool.length; k++) pool[k].setVisible(false);
  };
  refresh(ids);
  sync();
  scene.events.on('postupdate', sync);
  scene.events.once('shutdown', destroy);
  return { refresh(next?: string[]) { refresh(next); sync(); } };
}
