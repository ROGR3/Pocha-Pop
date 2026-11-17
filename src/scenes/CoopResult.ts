// End of a co-op night: shared stars and a table of players (first / runoff /
// coins / best combo) with a crown for the one who served first most often.
import Phaser from 'phaser';
import { DISTRICTS, homeDistrict, nightDef, nightTitle } from '../data/levels';
import { crowned } from '../logic/coop';
import type { CoopSummary, Msg } from '../logic/netproto';
import { PCOL, PFRAME } from '../game/coopui';
import { G } from '../game/state';
import { BG_PREFIX } from '../game/street';
import { C, STAR_GOLD, button, fadeIn, goto, panel, snapText, txt } from '../game/ui';
import { WALKOUT_POINTS, isPerfectCoop, penaltyPoints, verdict } from '../logic/stars';
import { plural } from '../logic/czech';
import { VERDICT_COLOR } from './Result';

export class CoopResultScene extends Phaser.Scene {
  private s!: CoopSummary;
  private me = 0;
  private offs: (() => void)[] = [];
  constructor() { super('CoopResult'); }

  init(d: { summary: CoopSummary; me: number }) {
    this.s = d.summary;
    this.me = d.me;
    this.offs = [];
  }

  onBack() { goto(this, 'Coop'); }

  /** The host closed the stall while we look at the results: just note it. */
  onNetClosed(why: string) {
    txt(this, this.scale.width / 2, this.scale.height - 44, why, { size: 's', color: C.pink, origin: [0.5, 0.5] });
  }

  create() {
    fadeIn(this, 400);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    const s = this.s;
    const def = nightDef(s.night);
    this.add.image(Math.round(W / 2), H, `bg_${BG_PREFIX[DISTRICTS[homeDistrict(def)].backdrop]}_far`).setOrigin(0.5, 1).setAlpha(0.5);
    this.add.rectangle(0, 0, W, H, 0x181425, 0.5).setOrigin(0, 0);
    const failed = s.stars === 0;
    txt(this, W / 2, 12, failed ? 'Stánek zavírá…' : `Spolu · ${nightTitle(s.night)}`, { size: 'l', color: failed ? C.pink : C.yellow, origin: [0.5, 0], shadow: true });
    txt(this, W / 2, 30, 'společné hvězdy', { size: 'xs', color: C.grey, origin: [0.5, 0] });
    // shared stars
    const big = W >= 220;
    const sy = 54;
    const gold = isPerfectCoop(s);
    for (let i = 0; i < 3; i++) {
      const x = Math.round(W / 2 + (i - 1) * (big ? 34 : 18));
      this.add.image(x, sy, 'star', 1).setScale(big ? 2 : 1);
      if (i < s.stars) {
        const st = this.add.sprite(x, sy, 'star', 0).setScale(0).setAlpha(0);
        this.time.delayedCall(500 + i * 380, () => {
          G.audio.play('star', { detune: i * 200 });
          this.tweens.add({ targets: st, scale: big ? 2 : 1, alpha: 1, duration: 300, ease: 'Back.easeOut', onComplete: () => {
            st.play('star:ding');
            if (gold) st.once('animationcomplete', () => st.setFrame(STAR_GOLD));
          } });
        });
      }
    }
    if (failed) this.time.delayedCall(400, () => G.audio.play('fail'));
    else this.time.delayedCall(500 + s.stars * 380, () => G.audio.play('fanfare'));
    let y = sy + (big ? 30 : 20);
    const n = Math.max(1, s.players.length);
    const pts = txt(this, W / 2, y, `Trestné body týmu ${penaltyPoints(s.typos, s.angry)}: odchody ${s.angry} × ${WALKOUT_POINTS} + překlepy ${s.mistakes} ÷ ${n} ${plural(n, 'hráč', 'hráči', 'hráčů')} = ${s.typos}`, { size: 'xs', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 20 });
    y += pts.height + 2;
    const v = verdict(s.stars, penaltyPoints(s.typos, s.angry), s.total);
    const vt = txt(this, W / 2, y, v.text, { size: 'xs', color: VERDICT_COLOR[v.tone], origin: [0.5, 0], align: 'center', wrap: W - 20 });
    y += vt.height + 6;
    // players table
    const pw = W - 16;
    const rows = s.players.length;
    panel(this, 8, y, pw, 24 + rows * 26);
    const cols = [pw * 0.46, pw * 0.6, pw * 0.72, pw * 0.84, pw - 6].map((x) => Math.round(8 + x));
    // coins: a coin icon instead of a word so five columns fit at 216 px
    const head = ['první', 'doběh', 'chyby', '', 'kombo'];
    // narrow screens: neighbouring headers are staggered so they don't touch
    const stagger = W < 240;
    head.forEach((h, i) => { if (h) txt(this, cols[i], y + (stagger ? (i % 2 ? 12 : 4) : 7), h, { size: 'xs', color: C.grey, origin: [1, 0] }); });
    this.add.image(cols[3] - 5, y + (stagger ? 16 : 11), 'coin', 0);
    const crown = crowned(s.players);
    const order = [...s.players].sort((a, b) => b.first - a.first || b.coins - a.coins);
    order.forEach((p, i) => {
      const ry = y + 22 + i * 26;
      if (p.pid === this.me) this.add.rectangle(12, ry - 3, pw - 8, 22, 0xffffff, 0.06).setOrigin(0, 0);
      this.add.image(20, ry + 8, 'pdot', PFRAME[p.color]);
      const name = txt(this, 28, ry + 1, p.name + (p.pid === this.me ? ' (ty)' : ''), { size: 's', color: PCOL[p.color] });
      if (p.left) txt(this, 28, ry + 12, 'odešel(a)', { size: 'xs', color: C.grey });
      if (crown.includes(p.pid)) {
        // no room after the name (216 px): the crown sits on the player's dot
        const after = 28 + name.width + 17 <= cols[0] - 10;
        const cr = this.add.image(after ? Math.round(28 + name.width + 9) : 20, after ? ry + 5 : ry + 1, 'crown').setScale(0);
        this.time.delayedCall(1700, () => { this.tweens.add({ targets: cr, scale: 1, duration: 300, ease: 'Back.easeOut' }); G.audio.play('coin', { detune: 600 }); });
      }
      const vals = [String(p.first), String(p.runoff), String(p.mistakes), `+${p.coins}`, `${p.bestCombo}×`];
      vals.forEach((v, k) => txt(this, cols[k], ry + 2, v, { size: 's', color: k === 3 ? C.yellow : C.white, origin: [1, 0] }));
    });
    y += 24 + rows * 26 + 10;
    const mine = s.players.find((p) => p.pid === this.me);
    if (mine) {
      const t = txt(this, W / 2, y, `Do tvé kasičky: +${mine.coins} mincí`, { size: 's', color: C.yellow, origin: [0.5, 0] });
      snapText(t);
      y += 16;
    }
    txt(this, W / 2, y, 'Kampaň se nemění – mince a slova, která jsi napsal(a), máš ve svém stánku.', { size: 'xs', color: C.grey, origin: [0.5, 0], align: 'center', wrap: W - 24 });
    const net = G.net;
    const by = Math.min(H - 18, y + 40);
    if (net && !net.closed) {
      button(this, W / 2, by, 140, 22, net.isHost ? 'Do čekárny' : 'Čekárna', () => goto(this, 'Coop'), { icon: 'together' });
      // the host may start the next night straight away
      this.offs.push(net.onMsg((m: Msg) => { if (m.t === 'start') goto(this, 'Night', { night: m.night, coop: m }, 200); }));
    } else button(this, W / 2, by, 140, 22, 'Zpět', () => goto(this, 'Coop'), { style: 'wood', icon: 'back' });
    this.events.once('shutdown', () => this.offs.forEach((f) => f()));
  }
}
