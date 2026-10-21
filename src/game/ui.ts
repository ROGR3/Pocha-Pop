// Small UI toolkit on top of Phaser: pixel text, 9-slice buttons/panels,
// icon buttons, fades and toasts.
import Phaser from 'phaser';
import uiIcons from '../../public/assets/uiicons.json';
import { G } from './state';

export const C = {
  white: '#ffffff', cream: '#ead4aa', yellow: '#fee761', orange: '#f77622', red: '#e43b44', pink: '#f6757a',
  green: '#63c74d', cyan: '#2ce8f5', grey: '#8b9bb4', light: '#c0cbdc', dark: '#181425', brown: '#733e39', ink: '#3e2731', blue: '#0099db',
};
export const HEX = {
  dark: 0x181425, night: 0x262b44, navy: 0x3a4466, red: 0xe43b44, orange: 0xf77622, yellow: 0xfee761, green: 0x63c74d,
  white: 0xffffff, cream: 0xead4aa, ink: 0x3e2731, grey: 0x8b9bb4, pink: 0xf6757a,
};

// Phaser Text created/updated with '' sometimes never re-uploads its texture
// in WebGL; never hand it an empty string.
const origSetText = Phaser.GameObjects.Text.prototype.setText;
Phaser.GameObjects.Text.prototype.setText = function (this: Phaser.GameObjects.Text, v: string | string[]) {
  return origSetText.call(this, v === '' || v == null || (Array.isArray(v) && v.length === 0) ? ' ' : v);
};

/** Width of a text, 0 when it only holds the placeholder space. */
export function textW(t: Phaser.GameObjects.Text): number {
  return t.text.trim() === '' ? 0 : t.width;
}

type Size = 'xs' | 's' | 'm' | 'l' | 'xl';
const FONTS: Record<Size, [string, number]> = {
  xs: ['Galmuri7', 8],
  s: ['Galmuri9', 10],
  m: ['Galmuri11', 12],
  l: ['Galmuri14', 15],
  xl: ['Galmuri11', 24],
};

export interface TextOpts {
  size?: Size;
  color?: string;
  align?: 'left' | 'center' | 'right';
  wrap?: number;
  origin?: [number, number];
  shadow?: boolean;
  lineSpacing?: number;
}

export function txt(scene: Phaser.Scene, x: number, y: number, s: string, o: TextOpts = {}): Phaser.GameObjects.Text {
  const [family, px] = FONTS[o.size ?? 'm'];
  const t = scene.add.text(Math.round(x), Math.round(y), s || ' ', {
    fontFamily: family,
    fontSize: `${px}px`,
    color: o.color ?? C.white,
    align: o.align ?? 'left',
    wordWrap: o.wrap ? { width: o.wrap, useAdvancedWrap: true } : undefined,
    lineSpacing: o.lineSpacing ?? 1,
    resolution: 1,
  });
  if (o.shadow) t.setShadow(1, 1, C.dark, 0, false, true);
  const [ox, oy] = o.origin ?? [0, 0];
  t.setOrigin(ox, oy);
  snapText(t);
  return t;
}

/** Keep text on whole pixels even with a centred origin. */
export function snapText(t: Phaser.GameObjects.Text) {
  const w = t.width, h = t.height;
  t.setDisplayOrigin(Math.round(w * t.originX), Math.round(h * t.originY));
  return t;
}

export function iconFrame(name: string): number {
  const i = uiIcons.names.indexOf(name);
  return i < 0 ? 0 : i;
}

export function panel(scene: Phaser.Scene, x: number, y: number, w: number, h: number, kind: 'panel' | 'paper' = 'panel') {
  const corner = kind === 'panel' ? 8 : 6;
  const p = scene.add.nineslice(Math.round(x), Math.round(y), kind, undefined, Math.round(w), Math.round(h), corner, corner, corner, corner);
  p.setOrigin(0, 0);
  return p;
}

export interface ButtonOpts {
  style?: 'red' | 'wood' | 'off';
  icon?: string;
  size?: Size;
  disabled?: boolean;
}

export class Button extends Phaser.GameObjects.Container {
  bg: Phaser.GameObjects.NineSlice;
  label: Phaser.GameObjects.Text;
  icon?: Phaser.GameObjects.Image;
  private style: 'red' | 'wood' | 'off';
  private onClick: () => void;
  enabled = true;

  constructor(scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string, onClick: () => void, o: ButtonOpts = {}) {
    super(scene, Math.round(x), Math.round(y));
    this.style = o.disabled ? 'off' : (o.style ?? 'red');
    this.onClick = onClick;
    this.bg = scene.add.nineslice(0, 0, this.tex(false), undefined, w, h, 5, 5, 5, 6).setOrigin(0.5);
    this.add(this.bg);
    let tx = 0;
    if (o.icon) {
      this.icon = scene.add.image(0, -1, 'uiicons', iconFrame(o.icon)).setOrigin(0.5);
      this.add(this.icon);
      if (text) { tx = 8; this.icon.x = -Math.round((w / 2) - 12); }
    }
    this.label = txt(scene, tx, -2, text, { size: o.size ?? 'm', origin: [0.5, 0.5], color: this.style === 'wood' ? C.cream : C.white, shadow: true });
    if (o.icon && text) this.label.x = Math.round(this.icon!.x + 10 + this.label.width / 2);
    snapText(this.label);
    this.add(this.label);
    this.setSize(w, h);
    this.setInteractive({ useHandCursor: true });
    this.on('pointerdown', () => { if (this.enabled) this.press(true); });
    this.on('pointerout', () => this.press(false));
    this.on('pointerup', () => {
      if (!this.enabled) return;
      this.press(false);
      G.audio.play('click');
      this.onClick();
    });
    if (o.disabled) this.setEnabled(false);
    scene.add.existing(this);
  }

  private tex(down: boolean) {
    if (this.style === 'off') return 'btn_off';
    const base = this.style === 'wood' ? 'btn_wood' : 'btn';
    return down ? base + '_down' : base;
  }

  press(down: boolean) {
    this.bg.setTexture(this.tex(down));
    const dy = down ? 2 : 0;
    this.label.y = -2 + dy;
    if (this.icon) this.icon.y = -1 + dy;
  }

  setEnabled(on: boolean) {
    this.enabled = on;
    this.style = on ? (this.style === 'off' ? 'red' : this.style) : 'off';
    this.bg.setTexture(this.tex(false));
    this.label.setColor(on ? C.white : C.grey);
    return this;
  }

  setText(s: string) {
    this.label.setText(s);
    snapText(this.label);
    return this;
  }
}

export function button(scene: Phaser.Scene, x: number, y: number, w: number, h: number, text: string, onClick: () => void, o: ButtonOpts = {}) {
  return new Button(scene, x, y, w, h, text, onClick, o);
}

export function iconButton(scene: Phaser.Scene, x: number, y: number, icon: string, onClick: () => void, style: 'red' | 'wood' = 'wood') {
  return new Button(scene, x, y, 20, 20, '', onClick, { icon, style });
}

/** Fade the camera out, then start another scene. */
export function goto(scene: Phaser.Scene, key: string, data?: object, ms = 260) {
  if ((scene as any).__leaving) return;
  (scene as any).__leaving = true;
  scene.input.enabled = false;
  scene.cameras.main.fadeOut(ms, 24, 20, 37);
  scene.cameras.main.once('camerafadeoutcomplete', () => scene.scene.start(key, data));
}

export function fadeIn(scene: Phaser.Scene, ms = 260) {
  (scene as any).__leaving = false;
  scene.cameras.main.fadeIn(ms, 24, 20, 37);
}

export function toast(scene: Phaser.Scene, text: string, color = C.yellow, y?: number) {
  const W = scene.scale.width;
  const t = txt(scene, W / 2, y ?? scene.scale.height / 2, text, { size: 'm', color, origin: [0.5, 0.5], shadow: true, align: 'center', wrap: W - 20 });
  t.setDepth(1000);
  scene.tweens.add({ targets: t, y: t.y - 16, alpha: { from: 1, to: 0 }, delay: 700, duration: 600, onComplete: () => t.destroy() });
  return t;
}

/** Floating "+12" style number. */
export function floatText(scene: Phaser.Scene, x: number, y: number, text: string, color = C.yellow) {
  const t = txt(scene, x, y, text, { size: 's', color, origin: [0.5, 0.5], shadow: true }).setDepth(900);
  scene.tweens.add({ targets: t, y: y - 18, alpha: { from: 1, to: 0 }, duration: 900, ease: 'Cubic.easeOut', onComplete: () => t.destroy() });
}

/** Draw a row of small stars (filled / empty) – returns the container. */
export function starRow(scene: Phaser.Scene, x: number, y: number, n: number, of = 3, scale = 1) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  const step = 15 * scale + 1;
  for (let i = 0; i < of; i++) {
    const s = scene.add.image(Math.round((i - (of - 1) / 2) * step), 0, 'star', i < n ? 0 : 1).setScale(scale);
    c.add(s);
  }
  return c;
}

export function smallStars(scene: Phaser.Scene, x: number, y: number, n: number, of = 3) {
  const c = scene.add.container(Math.round(x), Math.round(y));
  for (let i = 0; i < of; i++) c.add(scene.add.image(Math.round((i - (of - 1) / 2) * 8), 0, 'star_s', i < n ? 0 : 1));
  return c;
}
