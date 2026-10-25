// Order bubble: food icon(s), Czech meaning, Korean hint (by mastery),
// patience bar with mood face. 9-slice, highlighted while it matches input.
import Phaser from 'phaser';
import { mood } from '../logic/rules';
import { koreanHint, type Order } from './orders';
import { iconTex } from './state';
import { DEPTH } from './street';
import { C, snapText, txt } from './ui';

export class Bubble extends Phaser.GameObjects.Container {
  order: Order;
  bg: Phaser.GameObjects.NineSlice;
  tail: Phaser.GameObjects.Image;
  ko: Phaser.GameObjects.Text;
  bar: Phaser.GameObjects.Rectangle;
  barBg: Phaser.GameObjects.Rectangle;
  face: Phaser.GameObjects.Image;
  bw: number;
  bh: number;
  private lastMood = 2;
  private matchState: 'normal' | 'hi' | 'dim' = 'normal';

  constructor(scene: Phaser.Scene, order: Order, maxW: number) {
    super(scene, 0, 0);
    this.order = order;
    const critic = order.kind === 'boss';
    const bw = (this.bw = Math.min(maxW, critic ? 124 : order.tokens.length > 1 ? 92 : 64));
    const pad = 4;
    const parts: Phaser.GameObjects.GameObject[] = [];
    let y = pad;
    // icons
    const n = order.icons.length;
    order.icons.forEach((ic, i) => {
      const x = Math.round(bw / 2 + (i - (n - 1) / 2) * 26);
      parts.push(scene.add.image(x, y, ...iconTex(ic)).setOrigin(0.5, 0));
    });
    y += 25;
    let cs: Phaser.GameObjects.Text | null = null;
    if (order.kind !== 'nabi') {
      cs = txt(scene, bw / 2, y, order.cs, { size: 's', color: C.ink, origin: [0.5, 0], align: 'center', wrap: bw - 6, lineSpacing: 0 });
      parts.push(cs);
      y += cs.height + 2;
    }
    if (order.extra) {
      // loanword: the original spelling, small
      const ex = txt(scene, bw / 2, y - 2, order.extra, { size: 'xs', color: C.grey, origin: [0.5, 0] });
      parts.push(ex);
      y += 9;
    }
    const kh = koreanHint(order);
    this.ko = txt(scene, bw / 2, y, kh.text || ' ', { size: 'm', color: C.brown, origin: [0.5, 0], align: 'center', wrap: bw - 6, lineSpacing: 0 });
    parts.push(this.ko);
    // reserve room for the fully revealed Korean (hint button) – measured
    const probe = txt(scene, 0, 0, order.target, { size: 'm', wrap: bw - 6, lineSpacing: 0 });
    const koLines = Math.max(1, Math.round(probe.height / 13));
    probe.destroy();
    y += order.kind === 'nabi' ? 0 : 15 * koLines;
    // patience
    this.face = scene.add.image(pad + 5, y + 4, 'faces', 0).setOrigin(0.5);
    this.barBg = scene.add.rectangle(pad + 12, y + 3, bw - pad * 2 - 13, 4, 0x3e2731).setOrigin(0, 0);
    this.bar = scene.add.rectangle(pad + 13, y + 4, bw - pad * 2 - 15, 2, 0x63c74d).setOrigin(0, 0);
    parts.push(this.barBg, this.bar, this.face);
    y += 11;
    const bh = (this.bh = y + pad - 1);
    this.bg = scene.add.nineslice(0, 0, 'bubble', undefined, bw, bh, 5, 5, 5, 5).setOrigin(0, 0);
    this.tail = scene.add.image(Math.round(bw / 2) - 3, bh - 2, 'bubble_tail').setOrigin(0, 0);
    this.add([this.bg, this.tail, ...parts]);
    this.setKorean(kh.text, kh.alpha);
    this.setDepth(DEPTH.bubble);
    this.setSize(bw, bh + 6);
    scene.add.existing(this);
  }

  setKorean(text: string, alpha: number) {
    this.ko.setText(text).setAlpha(alpha);
    snapText(this.ko);
  }

  refreshHint() {
    const k = koreanHint(this.order);
    this.setKorean(k.text, k.alpha);
  }

  setPatience(frac: number) {
    const f = Math.max(0, Math.min(1, frac));
    const full = this.barBg.width - 2;
    this.bar.width = Math.max(0, Math.round(full * f));
    const m = mood(f);
    this.bar.fillColor = m === 2 ? 0x63c74d : m === 1 ? 0xfeae34 : 0xe43b44;
    if (m !== this.lastMood) {
      this.lastMood = m;
      this.face.setFrame(2 - m);
      this.scene.tweens.add({ targets: this.face, scale: { from: 1.6, to: 1 }, duration: 250, ease: 'Back.easeOut' });
    }
    if (m === 0 && Math.floor(this.scene.time.now / 120) % 2 === 0) this.bar.fillColor = 0xff0044;
  }

  setMatch(s: 'normal' | 'hi' | 'dim') {
    if (s === this.matchState) return;
    this.matchState = s;
    this.bg.setTexture(s === 'hi' ? 'bubble_hi' : 'bubble');
    this.setAlpha(s === 'dim' ? 0.55 : 1);
    if (s === 'hi') this.scene.tweens.add({ targets: this, scale: { from: 1.06, to: 1 }, duration: 140 });
  }

  shake() {
    const x = this.x;
    this.scene.tweens.add({ targets: this, x: { from: x - 3, to: x }, duration: 250, ease: 'Elastic.easeOut' });
  }
}
