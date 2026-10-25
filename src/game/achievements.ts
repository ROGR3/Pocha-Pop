// Glue between the pure achievement rules and the game: builds the input from
// the save + data, stores newly unlocked badges and shows a toast for each.
import Phaser from 'phaser';
import badgesJson from '../../public/assets/badges.json';
import { COLORS, HATS } from '../data/colors';
import { NIGHTS, jamoKnown } from '../data/levels';
import { REGULARS } from '../data/story';
import { ACHIEVEMENTS, evaluate, newlyUnlocked } from '../logic/achievements';
import { G, WORDS } from './state';
import { C, txt } from './ui';

const GROUPS: Record<string, string[]> = {
  food: ['food'], ddm: ['clothes', 'color'], hgd: ['music'], ysn: ['tech'], phm: ['body'], bsn: ['travel'],
};

export function badgeFrame(id: string): number {
  return Math.max(0, (badgesJson.names as string[]).indexOf(id));
}

export function currentAchievements(): string[] {
  const groups: Record<string, string[]> = {};
  for (const [g, cats] of Object.entries(GROUPS)) groups[g] = WORDS.filter((w) => cats.includes(w.category)).map((w) => w.id);
  const allJamo = new Set<string>();
  NIGHTS.forEach((d) => d.newJamo.forEach((j) => allJamo.add(j)));
  const met = new Set<string>();
  for (const d of NIGHTS) if (G.data.nights[d.n]) jamoKnown(d.n).forEach((j) => met.add(j));
  const bossNights: Record<string, number> = {};
  for (const d of NIGHTS) if (d.boss) bossNights[d.boss] = d.n;
  return evaluate({
    save: G.data, groups, bossNights, allJamo: [...allJamo], metJamo: met,
    regulars: Object.keys(REGULARS), colors: COLORS.map((c) => c.id), hats: HATS.map((h) => h.id), streak: G.streak(),
  });
}

/** Evaluate, persist and announce new badges. Returns the new ids. */
export function checkAchievements(scene: Phaser.Scene): string[] {
  const fresh = newlyUnlocked(G.data, currentAchievements());
  if (!fresh.length) return [];
  G.data.achievements.push(...fresh);
  G.save.save();
  fresh.forEach((id, i) => scene.time.delayedCall(i * 1600, () => badgeToast(scene, id)));
  return fresh;
}

function badgeToast(scene: Phaser.Scene, id: string) {
  if (!scene.sys.isActive()) return;
  const def = ACHIEVEMENTS.find((a) => a.id === id)!;
  const W = scene.scale.width;
  const c = scene.add.container(Math.round(W / 2), -40).setDepth(5000);
  const name = txt(scene, 0, -6, def.name, { size: 's', color: C.yellow, origin: [0.5, 0.5] });
  const sub = txt(scene, 0, 6, 'Nový odznáček!', { size: 'xs', color: C.cream, origin: [0.5, 0.5] });
  const w = Math.max(name.width, sub.width) + 44;
  const bg = scene.add.nineslice(0, 0, 'panel', undefined, w, 34, 8, 8, 8, 8);
  const icon = scene.add.image(-w / 2 + 18, 0, 'badges', badgeFrame(id));
  name.x = sub.x = 12;
  c.add([bg, icon, name, sub]);
  G.audio.play('star', { detune: 400 });
  scene.tweens.add({ targets: c, y: 40, duration: 380, ease: 'Back.easeOut', hold: 1100, yoyo: true, onComplete: () => c.destroy() });
  scene.tweens.add({ targets: icon, angle: { from: -20, to: 0 }, scale: { from: 1.6, to: 1 }, duration: 500, ease: 'Back.easeOut' });
}
