// Order bubble: food icon(s), Czech meaning, Korean hint (by mastery),
// patience bar with mood face. 9-slice, highlighted while it matches input.
import Phaser from 'phaser';
import { mood } from '../logic/rules';
import { koreanHint, listenKoreanHint, type Order } from './orders';
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
  /** Co-op: served by another player – their frame colour + runoff bar. */
  private taken?: string;
  private runoffBar?: Phaser.GameObjects.NineSlice;
  private runoffW = 0;
  /** Poslech: speaker instead of picture + Czech; tap = hear it again. */
  readonly listen: boolean;
  speaker?: Phaser.GameObjects.Sprite;

  constructor(scene: Phaser.Scene, order: Order, maxW: number, opts: { listen?: boolean } = {}) {
    super(scene, 0, 0);
    this.order = order;
    this.listen = !!opts.listen;
    const critic = order.kind === 'boss';
    // wide enough for the whole Korean on one line (크리스마스), within maxW
    const probeW = txt(scene, 0, 0, order.target, { size: 'm' });
    const need = probeW.width + 10;
    probeW.destroy();
    const bw = (this.bw = Math.min(maxW, critic ? 124 : Math.max(64, Math.min(order.tokens.length > 1 ? 96 : 84, need))));
    const pad = 4;
    const parts: Phaser.GameObjects.GameObject[] = [];
    let y = pad;
    // icons (Poslech: the speaker)
    const n = order.icons.length;
    if (this.listen) {
      this.speaker = scene.add.sprite(Math.round(bw / 2), y + 1, 'speaker', 0).setOrigin(0.5, 0);
      parts.push(this.speaker);
      y += 17;
    } else order.icons.forEach((ic, i) => {
      const x = Math.round(bw / 2 + (i - (n - 1) / 2) * 26);
      parts.push(scene.add.image(x, y, ...iconTex(ic)).setOrigin(0.5, 0));
    });
    if (!this.listen) y += 25;
    let cs: Phaser.GameObjects.Text | null = null;
    if (order.kind !== 'nabi' && !this.listen) {
      cs = txt(scene, bw / 2, y, order.cs, { size: 's', color: C.ink, origin: [0.5, 0], align: 'center', wrap: bw - 6, lineSpacing: 0 });
      parts.push(cs);
      y += cs.height + 2;
    }
    if (order.extra && !this.listen) {
      // loanword: the original spelling, small
      const ex = txt(scene, bw / 2, y - 2, order.extra, { size: 'xs', color: C.grey, origin: [0.5, 0] });
      parts.push(ex);
      y += 9;
    }
    const kh = this.hintOf();
    this.ko = txt(scene, bw / 2, y, kh.text || ' ', { size: 'm', color: C.brown, origin: [0.5, 0], align: 'center', wrap: bw - 6, lineSpacing: 0 });
    parts.push(this.ko);
    // reserve room for the fully revealed Korean (hint button) – measured
    const probe = txt(scene, 0, 0, order.target, { size: 'm', wrap: bw - 6, lineSpacing: 0 });
    const koLines = Math.max(1, Math.round(probe.height / 13));
    probe.destroy();
    y += 15 * koLines;
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

  private hintOf() { return this.listen ? listenKoreanHint(this.order) : koreanHint(this.order); }

  /** Poslech: sound waves while the customer speaks. */
  setTalking(on: boolean) {
    if (!this.speaker) return;
    if (on && !this.speaker.anims.isPlaying) this.speaker.play('speaker:talk');
    if (!on && this.speaker.anims.isPlaying) this.speaker.stop().setFrame(0);
  }

  /** After serving: no patience row any more (the reveal bubble). */
  hidePatience() {
    this.face.setVisible(false);
    this.bar.setVisible(false);
    this.barBg.setVisible(false);
  }

  setKorean(text: string, alpha: number) {
    this.ko.setText(text).setAlpha(alpha);
    snapText(this.ko);
  }

  refreshHint() {
    const k = this.hintOf();
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
    this.bg.setTexture(s === 'hi' ? 'bubble_hi' : this.taken ?? 'bubble');
    this.setAlpha(s === 'dim' ? 0.55 : 1);
    if (s === 'hi') this.scene.tweens.add({ targets: this, scale: { from: 1.06, to: 1 }, duration: 140 });
  }

  /**
   * Co-op: somebody else served this order first. The frame takes their colour,
   * their initial sits on the corner, and the patience row becomes the runoff bar.
   */
  markTaken(color: string, frame: number, initial: string) {
    this.taken = `bubble_p_${color}`;
    if (this.matchState !== 'hi') this.bg.setTexture(this.taken);
    const badge = this.scene.add.image(3, 3, 'pdot', frame).setScale(2);
    const t = txt(this.scene, 3, 2, initial, { size: 'xs', color: C.white, origin: [0.5, 0.5], shadow: true });
    this.face.setVisible(false);
    this.bar.setVisible(false);
    this.barBg.setVisible(false);
    this.runoffW = this.bw - 8;
    this.runoffBar = this.scene.add.nineslice(4, this.barBg.y - 1, 'ui_runoff', frame, this.runoffW, 6, 3, 3, 2, 2).setOrigin(0, 0);
    this.add([this.runoffBar, badge, t]);
    this.scene.tweens.add({ targets: badge, scale: { from: 4, to: 2 }, duration: 220, ease: 'Back.easeOut' });
    this.scene.tweens.add({ targets: t, scale: { from: 2, to: 1 }, duration: 220, ease: 'Back.easeOut' });
  }

  /** Runoff left 0..1. */
  setRunoff(frac: number) {
    if (!this.runoffBar) return;
    const w = Math.round(this.runoffW * Math.max(0, Math.min(1, frac)));
    this.runoffBar.setVisible(w >= 6);
    if (w >= 6) this.runoffBar.width = w;
  }

  shake() {
    const x = this.x;
    this.scene.tweens.add({ targets: this, x: { from: x - 3, to: x }, duration: 250, ease: 'Elastic.easeOut' });
  }
}
