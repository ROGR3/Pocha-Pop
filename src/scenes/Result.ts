// End of night: stars, coins, new words → grandma's postcard → regulars' stories.
import Phaser from 'phaser';
import { BOSS_NIGHT } from '../data/levels';
import { CRITIC_REVIEW, JAMO_TIPS, POSTCARDS, REGULARS } from '../data/story';
import { hasRawJamo } from '../logic/hangul';
import { playDialogue } from '../game/dialogue';
import { G, iconIdx, word } from '../game/state';
import { C, button, fadeIn, goto, panel, snapText, txt } from '../game/ui';
import type { NightSummary } from './Night';
import type { RegularId } from '../data/levels';

export class ResultScene extends Phaser.Scene {
  private s!: NightSummary;
  private layer!: Phaser.GameObjects.Container;
  constructor() { super('Result'); }

  init(s: NightSummary) { this.s = s; }

  create() {
    fadeIn(this, 400);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    const far = this.add.image(Math.round(W / 2), H, this.s.night >= 6 ? 'bg_han_far' : 'bg_eul_far').setOrigin(0.5, 1);
    far.setAlpha(0.5);
    this.add.rectangle(0, 0, W, H, 0x181425, 0.5).setOrigin(0, 0);
    this.layer = this.add.container(0, 0);
    this.stats();
  }

  // ------------------------------------------------------------ phase 1
  private stats() {
    const s = this.s;
    const W = this.scale.width, H = this.scale.height;
    const boss = s.night === BOSS_NIGHT;
    const L = this.layer;
    const failed = !boss && s.stars === 0;
    L.add(txt(this, W / 2, 14, boss ? 'Recenze kritika 미식가' : failed ? 'Stánek zavírá…' : `Noc ${s.night} – hotovo!`, { size: 'l', color: failed ? C.pink : C.yellow, origin: [0.5, 0], shadow: true }));
    // stars
    const of = boss ? 5 : 3;
    const big = !boss && W >= 220;
    const sy = 52;
    const step = big ? 34 : 18;
    for (let i = 0; i < of; i++) {
      const x = Math.round(W / 2 + (i - (of - 1) / 2) * step);
      const empty = this.add.image(x, sy, 'star', 1).setScale(big ? 2 : 1);
      L.add(empty);
      if (i < s.stars) {
        const st = this.add.sprite(x, sy, 'star', 0).setScale(0).setAlpha(0);
        L.add(st);
        this.time.delayedCall(500 + i * 380, () => {
          G.audio.play('star', { detune: i * 200 });
          this.tweens.add({ targets: st, scale: big ? 2 : 1, alpha: 1, duration: 300, ease: 'Back.easeOut', onComplete: () => st.play('star:ding') });
          this.cameras.main.shake(80, 0.003);
        });
      }
    }
    if (failed) this.time.delayedCall(400, () => G.audio.play('fail'));
    else this.time.delayedCall(500 + s.stars * 380, () => G.audio.play('fanfare'));
    let y = sy + (big ? 30 : 20);
    if (boss) {
      const review = txt(this, W / 2, y, CRITIC_REVIEW[s.stars], { size: 's', color: C.cream, origin: [0.5, 0], align: 'center', wrap: W - 24 });
      L.add(review);
      y += review.height + 8;
    } else if (failed) {
      L.add(txt(this, W / 2, y, 'Málo spokojených zákazníků. Zkus to znovu – příště to vyjde!', { size: 's', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 24 }));
      y += 26;
    }
    const pw = W - 24;
    L.add(panel(this, 12, y, pw, 84));
    const rows: [string, string, string][] = [
      ['Obslouženo', `${s.served} / ${s.total}`, C.white],
      ['Odešli naštvaní', String(s.angry), s.angry ? C.pink : C.white],
      ['Překlepy', String(s.mistakes), s.mistakes ? C.pink : C.white],
      ['Nejlepší kombo', `${s.bestCombo}×`, C.orange],
    ];
    rows.forEach(([a, b, col], i) => {
      L.add(txt(this, 22, y + 8 + i * 13, a, { size: 's', color: C.light }));
      L.add(txt(this, 12 + pw - 10, y + 8 + i * 13, b, { size: 's', color: col, origin: [1, 0] }));
    });
    const coinY = y + 8 + 4 * 13 + 4;
    L.add(this.add.sprite(26, coinY + 5, 'coin').play('coin:spin'));
    L.add(txt(this, 34, coinY, 'Mince', { size: 's', color: C.yellow }));
    const ct = txt(this, 12 + pw - 10, coinY, '+0', { size: 'm', color: C.yellow, origin: [1, 0] });
    L.add(ct);
    const counter = { v: 0 };
    this.tweens.add({ targets: counter, v: s.coins, duration: 900, delay: 600, onUpdate: () => { ct.setText(`+${Math.round(counter.v)}`); snapText(ct); }, onComplete: () => G.audio.play('coin') });
    y += 92;
    if (s.newWords.length) {
      L.add(txt(this, W / 2, y, 'Nová slova v receptáři', { size: 's', color: C.cream, origin: [0.5, 0] }));
      y += 14;
      const n = Math.min(s.newWords.length, Math.floor((W - 20) / 30));
      s.newWords.slice(0, n).forEach((id, i) => {
        const w = word(id);
        const x = Math.round(W / 2 + (i - (n - 1) / 2) * 30);
        const ic = this.add.image(x, y + 12, 'icons', iconIdx(w.icon)).setScale(0);
        L.add(ic);
        L.add(txt(this, x, y + 26, w.ko, { size: 'xs', color: C.white, origin: [0.5, 0] }));
        this.time.delayedCall(1200 + i * 120, () => { this.tweens.add({ targets: ic, scale: 1, duration: 260, ease: 'Back.easeOut' }); G.audio.play('pop', { volume: 0.4, detune: i * 100 }); });
      });
      y += 40;
    }
    const by = Math.min(H - 18, y + 20);
    L.add(button(this, W / 2, by, 140, 22, 'Pohled od babičky', () => this.postcard()));
  }

  // ------------------------------------------------------------ phase 2
  private postcard() {
    const s = this.s;
    const W = this.scale.width, H = this.scale.height;
    G.audio.play('paper');
    this.tweens.add({ targets: this.layer, alpha: 0, duration: 200, onComplete: () => this.layer.removeAll(true).setAlpha(1) });
    const pc = POSTCARDS[s.night];
    const c = this.add.container(0, H);
    const cw = Math.min(W - 12, 240);
    const cx = Math.round((W - cw) / 2);
    const pic = this.add.image(Math.round(W / 2), 10, 'postcard_jeju').setOrigin(0.5, 0);
    pic.setCrop(Math.max(0, (200 - cw + 8) / 2), 0, Math.min(200, cw - 8), 60);
    let y = 74;
    const parts: Phaser.GameObjects.GameObject[] = [];
    const title = txt(this, cx + 8, y, pc.title, { size: 'm', color: C.red });
    parts.push(title);
    y += 16;
    const body = txt(this, cx + 8, y, pc.text, { size: 's', color: C.ink, wrap: cw - 16, lineSpacing: 2 });
    parts.push(body);
    y += body.height + 6;
    if (s.trouble.length) {
      const tips = s.trouble.map((id) => {
        const w = word(id);
        const t = Object.keys(JAMO_TIPS).filter((k) => [...w.ko].some((ch) => hasRawJamo(ch, k))).map((k) => JAMO_TIPS[k]);
        return `${w.ko} (${w.cs})${t.length ? ' – ' + t[0] : ''}`;
      });
      const tr = txt(this, cx + 8, y, 'Pozor na: ' + tips.join(', '), { size: 's', color: C.brown, wrap: cw - 16, lineSpacing: 2 });
      parts.push(tr);
      y += tr.height + 6;
    }
    const tip = txt(this, cx + 8, y, pc.tip, { size: 's', color: C.blue, wrap: cw - 16, lineSpacing: 2 });
    parts.push(tip);
    y += tip.height + 6;
    const sign = txt(this, cx + cw - 10, y, '— tvoje 할머니', { size: 'm', color: C.red, origin: [1, 0] });
    parts.push(sign);
    y += 20;
    const ph = y + 4;
    const bg = panel(this, cx, 4, cw, ph - 4, 'paper');
    const stamp = this.add.image(cx + cw - 16, 80, 'stamp').setAngle(6);
    const grandma = this.add.sprite(cx + cw - 46, y - 2, 'char_halmeoni', 5).setOrigin(0.5, 1).setScale(1);
    grandma.setVisible(ph < H - 60 && W > 230);
    c.add([bg, pic, ...parts, stamp]);
    if (grandma.visible) { c.add(grandma); sign.x = grandma.x - 20; snapText(sign); }
    const top = Math.max(6, Math.round((H - ph - 34) / 2));
    this.tweens.add({ targets: c, y: top, duration: 500, ease: 'Back.easeOut', onComplete: () => this.stories(top + ph + 6) });
    this.layer.add(c);
  }

  // ------------------------------------------------------------ phase 3
  private async stories(btnY: number) {
    const s = this.s;
    const unlocked: RegularId[] = [];
    for (const r of ['kim', 'haeun', 'nabi'] as RegularId[]) {
      const f = G.data.friends[r] ?? { clean: 0, chapter: 0 };
      const ch = REGULARS[r].chapters[f.chapter];
      if (ch && f.clean >= ch.need && s.night >= ch.minNight && s.regularsSeen.includes(r)) unlocked.push(r);
    }
    const W = this.scale.width, H = this.scale.height;
    const by = Math.min(H - 16, btnY + 12);
    const buttons = () => {
      const boss = s.night === BOSS_NIGHT;
      const failed = !boss && s.stars === 0;
      this.layer.add(button(this, W / 2 - 52, by, 96, 22, failed ? 'Zkusit znovu' : 'Znovu', () => goto(this, 'Night', { night: s.night }), { style: failed ? 'red' : 'wood', size: 's' }));
      if (boss) this.layer.add(button(this, W / 2 + 52, by, 96, 22, 'Epilog', () => goto(this, 'Story', { kind: 'ending' }), { size: 's' }));
      else this.layer.add(button(this, W / 2 + 52, by, 96, 22, 'Na mapu', () => goto(this, 'Map'), { style: failed ? 'wood' : 'red', size: 's' }));
    };
    if (!unlocked.length) { buttons(); return; }
    await new Promise((r) => this.time.delayedCall(700, r));
    for (const r of unlocked) {
      const f = G.data.friends[r] ?? { clean: 0, chapter: 0 };
      const ch = REGULARS[r].chapters[f.chapter];
      const banner = txt(this, W / 2, 10, `${REGULARS[r].name} – kapitola ${f.chapter + 1}/3`, { size: 'm', color: C.yellow, origin: [0.5, 0], shadow: true }).setDepth(2001);
      await playDialogue(this, ch.lines);
      banner.destroy();
      G.data.friends[r] = { ...f, chapter: f.chapter + 1 };
    }
    G.save.save();
    buttons();
  }
}
