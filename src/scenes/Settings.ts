// Settings: volumes, relaxed patience, keyboard guide, progress reset.
import Phaser from 'phaser';
import { G } from '../game/state';
import { C, button, fadeIn, goto, iconButton, panel, segmented, snapText, toast, txt } from '../game/ui';
import { playDialogue } from '../game/dialogue';
import { LISTEN_INTRO } from '../data/story';
import { RATE_NORMAL, RATE_SLOW, type Track } from '../logic/track';

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
    let y = 34;
    y = this.trackRows(y);
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
    slider('Hlasitost hlasu', () => s.voice, (v) => { s.voice = v; this.sample(); });
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
    if (y + 30 < H - 54) txt(this, W / 2, H - 30, 'Pixel art: Aseprite · Písmo: Galmuri (OFL)\nSlova: Recallo deck · Hudba: procedurální', { size: 'xs', color: C.grey, origin: [0.5, 1], align: 'center' });
    iconButton(this, 16, H - 16, 'back', () => goto(this, this.from));
    this.game.events.on('layout', this.relayout, this);
    // back from the system voice installer: ask the TTS again
    const vis = () => { if (document.visibilityState === 'visible') void G.speech.refresh().then(() => this.sys.isActive() && this.scene.restart({ from: this.from })); };
    document.addEventListener('visibilitychange', vis);
    this.events.once('shutdown', () => { this.game.events.off('layout', this.relayout, this); document.removeEventListener('visibilitychange', vis); });
    // Android TTS may still be starting: redraw once it has answered
    const ok0 = G.speech.ok;
    void G.speech.ready.then(() => { if (G.speech.ok !== ok0 && this.sys.isActive()) this.scene.restart({ from: this.from }); });
  }

  /** Campaign switch Čtení · Poslech + voice speed. Returns the next y. */
  private trackRows(y: number): number {
    const W = this.scale.width;
    const s = G.data.settings;
    const ok = G.speech.ok;
    const ph = ok ? 40 : 54;
    panel(this, 8, y, W - 16, ph);
    txt(this, 16, y + 5, 'Režim kampaně', { size: 's', color: C.white });
    const tracks: Track[] = ['read', 'listen'];
    const btns = segmented(this, 14, y + 26, W - 28, 20, ['Čtení', 'Poslech'], tracks.indexOf(s.track), (i) => this.setTrack(tracks[i]), {
      locked: [false, !ok],
      onLocked: () => toast(this, 'Chybí korejský hlas', C.orange),
    });
    // eye / ear in front of the labels
    btns.forEach((b, i) => {
      b.label.x += 7;
      snapText(b.label);
      b.add(this.add.image(Math.round(b.label.x - b.label.width / 2 - 9), -1, 'track_m', i).setAlpha(i === 1 && !ok ? 0.5 : 1));
    });
    if (!ok) {
      txt(this, 16, y + 38, 'Chybí korejský hlas', { size: 'xs', color: C.orange });
      if (G.speech.backend?.installData) button(this, W - 52, y + 42, 76, 14, 'Stáhnout hlas', () => { void G.speech.backend?.installData?.(); }, { size: 'xs', style: 'wood' });
    }
    y += ph + 4;
    panel(this, 8, y, W - 16, 30);
    txt(this, 16, y + 10, 'Rychlost hlasu', { size: 's', color: C.white });
    const rates = [RATE_NORMAL, RATE_SLOW];
    segmented(this, W - 116, y + 15, 104, 18, ['Normální', 'Pomalá'], rates.indexOf(s.voiceRate) < 0 ? 0 : rates.indexOf(s.voiceRate), (i) => {
      s.voiceRate = rates[i];
      G.save.save();
      this.sample();
    }, { size: 'xs' });
    return y + 34;
  }

  /** A short sample of the voice (speed / volume). */
  private sample() {
    if (!G.speech.ok) return;
    G.applyVolumes();
    G.speech.stop();
    void G.speech.speak('안녕하세요', { rate: G.voiceRate() });
  }

  private setTrack(t: Track) {
    const s = G.data.settings;
    if (s.track === t) return;
    s.track = t;
    G.save.save();
    G.audio.play(t === 'listen' ? 'replay' : 'paper');
    toast(this, t === 'listen' ? 'Poslech: postup od první noci' : 'Čtení: tvůj původní postup', C.yellow);
    if (t === 'listen' && !s.listenIntro) {
      s.listenIntro = true;
      G.save.save();
      void playDialogue(this, LISTEN_INTRO);
    }
  }

  private relayout() { this.scene.restart({ from: this.from }); }

  onBack() { goto(this, this.from); }
}
