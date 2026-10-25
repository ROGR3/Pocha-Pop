// 나비's hat: an overlay sprite that follows the cat sprite (position, frame,
// flip) using the per-frame head anchors exported by art/src/cat.lua.
import Phaser from 'phaser';
import head from '../../public/assets/nabi_head.json';
import { HATS } from '../data/colors';
import { G } from './state';

const CAT_W = 24, CAT_H = 16, HAT_W = 14, HAT_H = 10;

/** Attach the equipped hat (if any) to a 나비 sprite (origin 0.5, 1). */
export function attachHat(scene: Phaser.Scene, cat: Phaser.GameObjects.Sprite, hatId: string | null = G.data.cosmetics.hat): Phaser.GameObjects.Image | null {
  const idx = HATS.findIndex((h) => h.id === hatId);
  if (idx < 0) return null;
  const hat = scene.add.image(0, 0, 'hats', idx).setOrigin(0, 0);
  const sync = () => {
    if (!cat.active) { hat.destroy(); scene.events.off('postupdate', sync); return; }
    const f = Number(cat.frame.name) || 0;
    const [hx, hy] = head.frames[f] ?? head.frames[0];
    const left = Math.round(cat.x - CAT_W * cat.originX);
    const top = Math.round(cat.y - CAT_H * cat.originY);
    const x0 = hx - 2;
    hat.setFlipX(cat.flipX);
    hat.setPosition(left + (cat.flipX ? CAT_W - x0 - HAT_W : x0), top + hy + 4 - (HAT_H - 1));
    hat.setDepth(cat.depth + 0.1).setVisible(cat.visible).setAlpha(cat.alpha);
  };
  sync();
  scene.events.on('postupdate', sync);
  scene.events.once('shutdown', () => scene.events.off('postupdate', sync));
  return hat;
}
