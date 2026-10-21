// 할머니's recipe book: every word with icon, Korean, Czech and mastery.
import Phaser from 'phaser';
import { JAMO_TIPS } from '../data/story';
import { hasRawJamo, toJamo } from '../logic/hangul';
import { MAX_MASTERY } from '../logic/srs';
import { G, WORDS, iconIdx, type Word } from '../game/state';
import { C, button, fadeIn, goto, iconButton, panel, txt } from '../game/ui';

export class RecipesScene extends Phaser.Scene {
  private list!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;
  private popup?: Phaser.GameObjects.Container;
  constructor() { super('Recipes'); }

  create() {
    fadeIn(this);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x5a3a2a).setOrigin(0, 0);
    // book page
    panel(this, 2, 26, W - 4, H - 60, 'paper');
    const known = WORDS.filter((w) => (G.data.words[w.id]?.seen ?? 0) > 0).length;
    this.add.rectangle(0, 0, W, 26, 0x3e2731).setOrigin(0, 0).setDepth(10);
    txt(this, 8, 13, 'Babiččin receptář', { size: 'l', color: C.cream, origin: [0, 0.5] }).setDepth(10);
    txt(this, W - 8, 13, `${known}/${WORDS.length}`, { size: 's', color: C.yellow, origin: [1, 0.5] }).setDepth(10);

    const cols = Math.max(3, Math.floor((W - 12) / 50));
    const cw = Math.floor((W - 12) / cols);
    const ch = 60;
    const top = 30, viewH = H - 30 - 38;
    this.list = this.add.container(6, top);
    const sorted = [...WORDS].sort((a, b) => (a.category === b.category ? a.difficulty - b.difficulty : a.category === 'food' ? -1 : 1));
    sorted.forEach((w, i) => this.card(w, (i % cols) * cw, Math.floor(i / cols) * ch, cw - 2, ch - 2));
    const rows = Math.ceil(sorted.length / cols);
    this.maxScroll = Math.max(0, rows * ch - viewH + 6);
    const maskG = this.make.graphics({}, false).fillRect(0, top, W, viewH);
    this.list.setMask(maskG.createGeometryMask());

    // scrolling: drag + wheel
    let dragStart = 0, startScroll = 0, dragging = false, moved = 0;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.popup) return; dragging = true; moved = 0; dragStart = p.y; startScroll = this.scrollY; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (!dragging || !p.isDown) return; moved = Math.abs(p.y - dragStart); this.setScroll(startScroll - (p.y - dragStart)); });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.setScroll(this.scrollY + dy * 0.5));
    (this as any)._moved = () => moved;

    // footer
    this.add.rectangle(0, H - 36, W, 36, 0x3e2731).setOrigin(0, 0).setDepth(10);
    iconButton(this, 16, H - 18, 'back', () => goto(this, 'Map')).setDepth(11);
    txt(this, 32, H - 18, 'Klepni na slovo pro detail. Siluety = ještě neznáš.', { size: 'xs', color: C.cream, origin: [0, 0.5], wrap: W - 40 }).setDepth(11);
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart(); }

  onBack() {
    if (this.popup) { this.popup.destroy(); this.popup = undefined; return; }
    goto(this, 'Map');
  }

  private setScroll(v: number) {
    this.scrollY = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.list.y = 30 - Math.round(this.scrollY);
  }

  private card(w: Word, x: number, y: number, cw: number, ch: number) {
    const st = G.data.words[w.id];
    const known = (st?.seen ?? 0) > 0;
    const c = this.add.container(x, y);
    const bg = this.add.rectangle(0, 0, cw, ch, known ? 0xead4aa : 0xc28569, 1).setOrigin(0, 0).setStrokeStyle(1, 0xb86f50);
    c.add(bg);
    const icon = this.add.image(Math.round(cw / 2), 15, 'icons', iconIdx(w.icon));
    if (!known) icon.setTintFill(0x3e2731).setAlpha(0.8);
    c.add(icon);
    c.add(txt(this, cw / 2, 29, known ? w.ko : '???', { size: 'm', color: known ? C.ink : C.brown, origin: [0.5, 0] }));
    if (known) {
      c.add(txt(this, cw / 2, 42, w.cs, { size: 'xs', color: C.brown, origin: [0.5, 0], wrap: cw - 2, align: 'center' }).setCrop(0, 0, cw, 9));
      const m = st!.mastery;
      for (let i = 0; i < MAX_MASTERY; i++) c.add(this.add.rectangle(Math.round(cw / 2 - 12 + i * 5), ch - 4, 3, 3, i < m ? 0xf77622 : 0xb86f50).setOrigin(0, 0));
    }
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerup', () => { if (((this as any)._moved?.() ?? 0) < 6 && !this.popup) this.detail(w, known); });
    this.list.add(c);
  }

  private detail(w: Word, known: boolean) {
    G.audio.play('paper');
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(100);
    const shade = this.add.rectangle(0, 0, W, H, 0x181425, 0.6).setOrigin(0, 0).setInteractive();
    c.add(shade);
    const pw = Math.min(W - 20, 230), ph = 176;
    const px = Math.round((W - pw) / 2), py = Math.round((H - ph) / 2);
    c.add(panel(this, px, py, pw, ph, 'paper'));
    const icon = this.add.image(px + 30, py + 30, 'icons', iconIdx(w.icon)).setScale(2);
    if (!known) icon.setTintFill(0x3e2731);
    c.add(icon);
    if (known) {
      c.add(txt(this, px + 60, py + 10, w.ko, { size: 'xl', color: C.ink }));
      c.add(txt(this, px + 60, py + 38, w.cs, { size: 's', color: C.brown, wrap: pw - 70 }));
      const st = G.stat(w.id);
      let y = py + 64;
      c.add(txt(this, px + 10, y, 'Klávesy (두벌식):', { size: 's', color: C.brown }));
      y += 13;
      c.add(txt(this, px + 10, y, toJamo(w.ko).join(' '), { size: 'm', color: C.ink, wrap: pw - 20 }));
      y += 18;
      const tips = Object.entries(JAMO_TIPS).filter(([k]) => [...w.ko].some((ch) => hasRawJamo(ch, k))).map(([, v]) => v);
      if (tips.length) { c.add(txt(this, px + 10, y, tips.join(' · '), { size: 's', color: C.blue, wrap: pw - 20 })); y += 14; }
      c.add(txt(this, px + 10, y + 2, `Správně: ${st.correct}   Chyby: ${st.errors}   Viděno: ${st.seen}×`, { size: 'xs', color: C.brown }));
      c.add(txt(this, px + 10, y + 16, 'Mistrovství:', { size: 'xs', color: C.brown }));
      for (let i = 0; i < MAX_MASTERY; i++) c.add(this.add.image(px + 70 + i * 10, y + 20, 'star_s', i < st.mastery ? 0 : 1));
      c.add(txt(this, px + 10, y + 30, st.mastery >= 2 ? 'Bublina už korejštinu neukazuje – vybavuješ si.' : st.mastery === 1 ? 'Bublina ukazuje jen první slabiku.' : 'Bublina ukazuje celé slovo – opisuješ.', { size: 'xs', color: C.grey, wrap: pw - 20 }));
    } else {
      c.add(txt(this, px + 60, py + 18, 'Tohle jídlo ještě neznáš.', { size: 's', color: C.brown, wrap: pw - 70 }));
      c.add(txt(this, px + 60, py + 36, 'Objeví se v dalších nocích nebo v menu z obchodu.', { size: 'xs', color: C.grey, wrap: pw - 70 }));
    }
    const close = () => { c.destroy(); this.popup = undefined; };
    c.add(button(this, px + pw / 2, py + ph - 14, 80, 18, 'Zavřít', close, { size: 's', style: 'wood' }));
    shade.on('pointerup', close);
    this.popup = c;
  }
}
