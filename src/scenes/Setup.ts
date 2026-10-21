// First run / settings: how to enable the system Korean keyboard + a test field.
import Phaser from 'phaser';
import { matchKind, toJamo } from '../logic/hangul';
import { G } from '../game/state';
import { TypeBox } from '../game/typebox';
import { Button, C, button, cssRect, fadeIn, goto, panel, txt } from '../game/ui';

const ANDROID = [
  'Gboard: Nastavení → Jazyky → Přidat klávesnici → Korejština → „2 sady“ (두벌식).',
  'Samsung: Nastavení klávesnice → Jazyky a typy → 한국어 → Standard.',
  'Přepínání: klávesa se zeměkoulí nebo potáhni mezerník.',
];
const LINUX = [
  'Potřebuješ fcitx5 + fcitx5-hangul (máš).',
  'fcitx5-configtool → přidej „Hangul“.',
  'Přepínání: Ctrl+Mezerník nebo klávesa 한/영.',
  'Když hra nepíše: spusť ji s GTK_IM_MODULE=fcitx.',
];

export class SetupScene extends Phaser.Scene {
  private box!: TypeBox;
  private next = 'Map';
  private passed = false;
  private go!: Button;
  private status!: Phaser.GameObjects.Text;
  private tab: 'android' | 'linux' = /android/i.test(navigator.userAgent) ? 'android' : 'linux';
  private body!: Phaser.GameObjects.Container;
  private unsub?: () => void;

  constructor() { super('Setup'); }

  init(data: { next?: string }) {
    this.next = data?.next ?? 'Map';
    this.passed = false;
  }

  create() {
    fadeIn(this);
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x262b44).setOrigin(0, 0);
    txt(this, W / 2, 8, 'Korejská klávesnice', { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true });
    txt(this, W / 2, 28, 'Hra používá systémovou klávesnici.', { size: 's', color: C.light, origin: [0.5, 0], wrap: W - 20, align: 'center' });

    const tabY = 56;
    const tw = Math.round((W - 24) / 2);
    const tA = button(this, 12 + tw / 2, tabY, tw - 2, 18, 'Android', () => this.setTab('android'), { size: 's', style: this.tab === 'android' ? 'red' : 'wood' });
    const tL = button(this, 12 + tw * 1.5, tabY, tw - 2, 18, 'Linux', () => this.setTab('linux'), { size: 's', style: this.tab === 'linux' ? 'red' : 'wood' });
    (this as any)._tabs = [tA, tL];

    const bodyH = Math.min(150, Math.max(96, H - 250));
    panel(this, 8, 68, W - 16, bodyH, 'paper');
    this.body = this.add.container(0, 0);
    this.renderBody(bodyH);

    const ty = 68 + bodyH + 10;
    txt(this, W / 2, ty, 'Vyzkoušej: napiš  안녕  (ahoj)', { size: 'm', color: C.white, origin: [0.5, 0] });
    this.box = new TypeBox(this, 10, ty + 18, W - 20, 40, 'Klepni sem a piš');
    this.box.bg.setInteractive().on('pointerdown', () => G.ime.reopen());
    this.status = txt(this, W / 2, ty + 64, '', { size: 's', color: C.grey, origin: [0.5, 0], wrap: W - 20, align: 'center' });

    const by = Math.min(H - 18, ty + 100);
    this.go = button(this, W / 2 + 34, by, 110, 22, 'Pokračovat', () => this.finish(), { style: 'wood' });
    button(this, 46, by, 70, 22, this.next === 'Settings' ? 'Zpět' : 'Přeskočit', () => this.finish(), { style: 'wood', size: 's' });

    G.ime.activate();
    this.tap = [10, ty + 18, W - 20, 40];
    this.builtW = W;
    G.ime.setTapArea(cssRect(this, ...this.tap));
    this.unsub = G.ime.subscribe((s) => this.onIme(s.text, s.composing));
    G.ime.onKey = (e) => { if (e.key === 'Enter' && this.passed) this.finish(); };
    this.events.once('shutdown', () => { this.unsub?.(); G.ime.onKey = null; G.ime.deactivate(); this.game.events.off('layout', this.relayout, this); });
    this.game.events.on('layout', this.relayout, this);
    this.time.addEvent({ delay: 500, loop: true, callback: () => {
      if (!G.ime.hasFocus() && !this.passed) this.box.setHint('Klepni sem a piš', C.orange); else if (!this.passed) this.box.setHint('Piš korejsky…');
    } });
  }

  private tap: [number, number, number, number] = [0, 0, 0, 0];
  private builtW = 0;

  /** Height-only changes (soft keyboard) must not restart the scene – that would close the keyboard. */
  private relayout() {
    if (this.scale.width !== this.builtW) { this.scene.restart({ next: this.next }); return; }
    G.ime.setTapArea(cssRect(this, ...this.tap));
  }

  onBack() { this.finish(); }

  private setTab(t: 'android' | 'linux') {
    this.tab = t;
    const [a, l] = (this as any)._tabs as Button[];
    a.bg.setTexture(t === 'android' ? 'btn' : 'btn_wood');
    l.bg.setTexture(t === 'linux' ? 'btn' : 'btn_wood');
    this.renderBody();
  }

  private renderBody(h?: number) {
    const W = this.scale.width;
    this.body.removeAll(true);
    const lines = this.tab === 'android' ? ANDROID : LINUX;
    let y = 74;
    lines.forEach((l, i) => {
      const n = txt(this, 16, y, `${i + 1}.`, { size: 's', color: C.red });
      const t = txt(this, 28, y, l, { size: 's', color: C.ink, wrap: W - 46 });
      this.body.add([n, t]);
      y += t.height + 4;
    });
    void h;
  }

  private onIme(text: string, composing: boolean) {
    this.box.set(text, composing);
    if (/[a-zA-Z]/.test(text)) {
      this.status.setText('To je latinka – přepni klávesnici na korejštinu (한/영).').setColor(C.orange);
      return;
    }
    const k = matchKind(text, '안녕');
    if (k === 'full' && !this.passed) {
      this.passed = true;
      this.box.success();
      G.audio.play('buy');
      this.status.setText('Výborně! Klávesnice funguje. 안녕 = ahoj!').setColor(C.green);
      this.go.bg.setTexture('btn');
      this.tweens.add({ targets: this.go, scale: { from: 1.15, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    } else if (!this.passed) {
      if (text && k === 'none') { this.status.setText(`Hmm, „${text}“ (${toJamo(text).join(' ')}) – zkus ㅇ ㅏ ㄴ ㄴ ㅕ ㅇ`).setColor(C.pink); }
      else this.status.setText(text ? toJamo(text).join(' ') : 'Jamo se ti tu ukážou při psaní.').setColor(C.grey);
    }
  }

  private finish() {
    G.data.settings.firstRunDone = true;
    G.save.save();
    goto(this, this.next);
  }
}
