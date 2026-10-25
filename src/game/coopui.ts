// Shared bits of the co-op screens: player colours, name tags, the night picker data.
import Phaser from 'phaser';
import { NIGHTS, type District } from '../data/levels';
import type { PlayerColor, PlayerInfo } from '../logic/netproto';
import { G } from './state';
import { C, snapText, txt } from './ui';

export const PCOL: Record<PlayerColor, string> = { orange: C.orange, blue: C.blue, green: C.green };
export const PHEX: Record<PlayerColor, number> = { orange: 0xf77622, blue: 0x0099db, green: 0x63c74d };
export const PFRAME: Record<PlayerColor, number> = { orange: 0, blue: 1, green: 2 };
export const PCS: Record<PlayerColor, string> = { orange: 'oranžová', blue: 'modrá', green: 'zelená' };

const MAIN: District[] = ['euljiro', 'hangang', 'dongdaemun', 'hongdae', 'yongsan', 'busan'];

/** Regular nights the host has unlocked (no bosses, 약국, holidays, daily), by district. */
export function coopNights(): { district: District; nights: number[] }[] {
  return MAIN.map((d) => ({ district: d, nights: NIGHTS.filter((x) => x.district === d && !x.boss && G.isUnlocked(x.n)).map((x) => x.n) }))
    .filter((g) => g.nights.length > 0);
}

/** First letter of a name (shown on bubbles someone else served). */
export function initial(name: string): string {
  return [...name][0]?.toUpperCase() ?? '?';
}

/** Small name tag: coloured dot + name (+ optional value on the right). */
export class PlayerTag extends Phaser.GameObjects.Container {
  bg: Phaser.GameObjects.NineSlice;
  dot: Phaser.GameObjects.Image;
  label: Phaser.GameObjects.Text;
  value: Phaser.GameObjects.Text;
  w: number;

  constructor(scene: Phaser.Scene, x: number, y: number, p: PlayerInfo, w: number, value = '') {
    super(scene, Math.round(x), Math.round(y));
    this.w = w;
    this.bg = scene.add.nineslice(0, 0, `ptag_${p.color}`, undefined, w, 13, 4, 4, 4, 4).setOrigin(0, 0);
    this.dot = scene.add.image(7, 6, 'pdot', PFRAME[p.color]);
    this.label = txt(scene, 13, 2, p.name, { size: 'xs', color: C.white });
    this.value = txt(scene, w - 4, 2, value || ' ', { size: 'xs', color: C.yellow, origin: [1, 0] });
    this.add([this.bg, this.dot, this.label, this.value]);
    this.setSize(w, 13);
    scene.add.existing(this);
  }

  setValue(v: string) {
    this.value.setText(v);
    snapText(this.value);
    return this;
  }

  setGone(gone: boolean) {
    this.setAlpha(gone ? 0.45 : 1);
    return this;
  }
}
