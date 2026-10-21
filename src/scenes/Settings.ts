// Settings: volumes, relaxed patience, keyboard guide, progress reset.
import Phaser from 'phaser';
import { G } from '../game/state';
import { C, button, fadeIn, goto, iconButton, panel, snapText, toast, txt } from '../game/ui';

export class SettingsScene extends Phaser.Scene {
  private from = 'Map';
  constructor() { super('Settings'); }

  init(d: { from?: string }) { this.from = d?.from ?? 'Map'; }

  create() {
    fadeIn(this);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x262b44).setOrigin(0, 0);
    txt(this, W / 2, 10, 'Nastavení', { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true });
    const s = G.data.settings;
    let y = 38;
    const slider = (label: string, get: () => number, set: (v: number) => void) => {
      panel(this, 8, y, W - 16, 34);
      txt(this, 16, y + 6, label, { size: 's', color: C.white });
      const bx = 16, bw = W - 92, by = y + 21;
      this.add.rectangle(bx, by, bw, 6, 0x181425).setOrigin(0, 0.5);
      const fill = this.add.rectangle(bx + 1, by, (bw - 2) * get(), 4, 0xf77622).setOrigin(0, 0.5);
      const val = txt(this, W - 70, y + 6, `${Math.round(get() * 100)} %`, { size: 's', color: C.yellow, origin: [1, 0] });
      const upd = (v: number) => {
        v = Math.round(Phaser.Math.Clamp(v, 0, 1) * 10) / 10;
        set(v);
        fill.width = (bw - 2) * v;
        val.setText(`${Math.round(v * 100)} %`); snapText(val);
        G.applyVolumes();
        G.save.save();
      };
      button(this, W - 50, y + 17, 18, 18, '−', () => { upd(get() - 0.1); G.audio.play('type'); }, { style: 'wood', size: 'm' });
      button(this, W - 26, y + 17, 18, 18, '+', () => { upd(get() + 0.1); G.audio.play('coin'); }, { style: 'wood', size: 'm' });
      const hit = this.add.rectangle(bx, by, bw, 14, 0, 0).setOrigin(0, 0.5).setInteractive();
      hit.on('pointerdown', (p: Phaser.Input.Pointer) => upd((p.x - bx) / bw));
      y += 38;
    };
    slider('Zvuky', () => s.sfx, (v) => { s.sfx = v; });
    slider('Déšť / řeka / rádio', () => s.ambient, (v) => { s.ambient = v; });

    panel(this, 8, y, W - 16, 34);
    txt(this, 16, y + 5, 'Klidné tempo', { size: 's', color: C.white });
    txt(this, 16, y + 18, 'Zákazníci čekají o 50 % déle.', { size: 'xs', color: C.light });
    const tog = button(this, W - 38, y + 17, 50, 18, s.relaxed ? 'zap.' : 'vyp.', () => {
      s.relaxed = !s.relaxed;
      tog.setText(s.relaxed ? 'zap.' : 'vyp.');
      tog.bg.setTexture(s.relaxed ? 'btn' : 'btn_wood');
      G.save.save();
    }, { size: 's', style: s.relaxed ? 'red' : 'wood' });
    y += 40;

    button(this, W / 2, y + 10, W - 40, 22, 'Návod: korejská klávesnice', () => goto(this, 'Setup', { next: 'Settings' }), { icon: 'keyboard', style: 'wood', size: 's' });
    y += 30;
    let armed = false;
    const reset = button(this, W / 2, y + 10, W - 40, 22, 'Smazat postup', () => {
      if (!armed) {
        armed = true;
        reset.setText('Opravdu? Klepni znovu');
        this.time.delayedCall(3000, () => { armed = false; reset.setText('Smazat postup'); });
        return;
      }
      G.save.reset().then(() => { toast(this, 'Postup smazán', C.pink); this.time.delayedCall(700, () => goto(this, 'Title')); });
    }, { size: 's' });
    y += 34;
    const st = G.data.stats;
    txt(this, W / 2, y, `Odehráno nocí: ${st.nightsPlayed} · Obslouženo: ${st.served} · Překlepy: ${st.mistakes}`, { size: 'xs', color: C.grey, origin: [0.5, 0], wrap: W - 20, align: 'center' });
    txt(this, W / 2, H - 30, 'Pixel art: Aseprite · Písmo: Galmuri (OFL)\nSlova: Recallo deck · Hudba: procedurální', { size: 'xs', color: C.grey, origin: [0.5, 1], align: 'center' });
    iconButton(this, 16, H - 16, 'back', () => goto(this, this.from));
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart({ from: this.from }); }

  onBack() { goto(this, this.from); }
}
