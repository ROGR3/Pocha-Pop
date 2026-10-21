// Live view of what the IME is composing: finished syllables in white, the
// syllable being composed in yellow with its jamo underneath (ㅎ → 하 → 한),
// a "click" when a new syllable starts, red shake on mistakes.
import Phaser from 'phaser';
import { toJamo } from '../logic/hangul';
import { G } from './state';
import { C, panel, snapText, textW, txt } from './ui';

export class TypeBox {
  scene: Phaser.Scene;
  root: Phaser.GameObjects.Container;
  bg: Phaser.GameObjects.NineSlice;
  done: Phaser.GameObjects.Text;
  cur: Phaser.GameObjects.Text;
  jamo: Phaser.GameObjects.Text;
  hint: Phaser.GameObjects.Text;
  caret: Phaser.GameObjects.Rectangle;
  w: number;
  h: number;
  placeholder: string;
  private prev = '';
  private errorUntil = 0;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, placeholder = 'Piš korejsky…') {
    this.scene = scene;
    this.w = w;
    this.h = h;
    this.placeholder = placeholder;
    this.root = scene.add.container(Math.round(x), Math.round(y));
    this.bg = panel(scene, 0, 0, w, h);
    this.done = txt(scene, 0, 0, '', { size: 'xl', color: C.white, origin: [0, 0.5] });
    this.cur = txt(scene, 0, 0, '', { size: 'xl', color: C.yellow, origin: [0.5, 0.5] });
    this.jamo = txt(scene, 0, 0, '', { size: 'xs', color: C.grey, origin: [0.5, 0] });
    this.hint = txt(scene, w / 2, h / 2 - 1, placeholder, { size: 's', color: C.grey, origin: [0.5, 0.5] });
    this.caret = scene.add.rectangle(0, 0, 2, 16, 0xfee761).setOrigin(0, 0.5);
    this.root.add([this.bg, this.done, this.cur, this.jamo, this.hint, this.caret]);
    scene.tweens.add({ targets: this.caret, alpha: { from: 1, to: 0 }, yoyo: true, repeat: -1, duration: 450, hold: 200 });
    this.render('', false);
  }

  setPosition(x: number, y: number, w?: number) {
    this.root.setPosition(Math.round(x), Math.round(y));
    if (w && w !== this.w) {
      this.w = w;
      this.bg.setSize(w, this.h);
      this.hint.x = Math.round(w / 2);
    }
    this.render(this.prev, false, true);
  }

  /** Update from the IME. Returns true if a new syllable was started. */
  set(text: string, composing: boolean): boolean {
    const old = this.prev;
    this.prev = text;
    const oldChars = [...old], newChars = [...text];
    let newSyl = false;
    if (newChars.length > oldChars.length && text.startsWith(old.slice(0, -1))) {
      newSyl = oldChars.length > 0;
      G.audio.play(oldChars.length > 0 ? 'syllable' : 'type', { detune: (newChars.length % 4) * 80 });
    } else if (text !== old && text.length > 0) {
      G.audio.play('type', { detune: (toJamo(text).length % 5) * 70 });
    }
    this.render(text, composing);
    if (text !== old && text.length > 0) {
      // squash & stretch on the composing syllable
      this.scene.tweens.killTweensOf(this.cur);
      this.cur.setScale(newSyl ? 1.35 : 1.15);
      this.scene.tweens.add({ targets: this.cur, scale: 1, duration: newSyl ? 220 : 120, ease: 'Back.easeOut' });
      if (newSyl) {
        this.scene.tweens.killTweensOf(this.done);
        this.done.y = this.h / 2 - 3;
        this.scene.tweens.add({ targets: this.done, y: this.h / 2 - 1, duration: 120, ease: 'Quad.easeOut' });
      }
    }
    return newSyl;
  }

  private render(text: string, composing: boolean, keepAnim = false) {
    const chars = [...text];
    const last = chars.length ? chars[chars.length - 1] : '';
    const isComposing = composing || (last !== '' && /[ㄱ-ㆎ]/.test(last));
    const doneStr = isComposing ? chars.slice(0, -1).join('') : text;
    const curStr = isComposing ? last : '';
    this.done.setText(doneStr);
    this.cur.setText(curStr);
    snapText(this.done);
    snapText(this.cur);
    const dw = textW(this.done), cw = textW(this.cur);
    const total = dw + cw;
    const x0 = Math.round((this.w - total) / 2);
    const cy = Math.round(this.h / 2) - (curStr ? 4 : 1);
    this.done.setPosition(x0, keepAnim ? this.done.y : cy);
    this.done.y = cy;
    this.cur.setPosition(Math.round(x0 + dw + cw / 2), cy);
    const j = curStr ? toJamo(curStr).join('+') : '';
    this.jamo.setText(j).setPosition(this.cur.x, cy + 11);
    snapText(this.jamo);
    this.caret.setPosition(x0 + total + 1, cy);
    this.hint.setVisible(text.length === 0);
    this.caret.setVisible(text.length > 0 || !this.hint.visible);
    if (this.scene.time.now > this.errorUntil) this.done.setColor(C.white);
  }

  setHint(s: string, color = C.grey) {
    this.hint.setText(s).setColor(color);
    snapText(this.hint);
  }

  error() {
    this.errorUntil = this.scene.time.now + 450;
    this.done.setColor(C.red);
    this.cur.setColor(C.red);
    this.bg.setTint(0xff8888);
    const x = this.root.x;
    this.scene.tweens.killTweensOf(this.root);
    this.root.x = x;
    this.scene.tweens.add({ targets: this.root, x: { from: x - 4, to: x }, duration: 260, ease: 'Elastic.easeOut' });
    this.scene.time.delayedCall(450, () => { this.bg.clearTint(); this.done.setColor(C.white); this.cur.setColor(C.yellow); });
  }

  success() {
    this.bg.setTint(0xa0ffa0);
    this.scene.time.delayedCall(200, () => this.bg.clearTint());
  }
}
