// End of a co-op night: shared stars and a table of players (first / runoff /
// coins / best combo) with a crown for the one who served first most often.
import Phaser from 'phaser';
import { DISTRICTS, homeDistrict, nightDef, nightTitle } from '../data/levels';
import { crowned } from '../logic/coop';
import type { CoopSummary, Msg } from '../logic/netproto';
import { PCOL, PFRAME } from '../game/coopui';
import { G } from '../game/state';
import { BG_PREFIX } from '../game/street';
import { C, button, fadeIn, goto, panel, snapText, txt } from '../game/ui';

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
    for (let i = 0; i < 3; i++) {
      const x = Math.round(W / 2 + (i - 1) * (big ? 34 : 18));
      this.add.image(x, sy, 'star', 1).setScale(big ? 2 : 1);
      if (i < s.stars) {
        const st = this.add.sprite(x, sy, 'star', 0).setScale(0).setAlpha(0);
        this.time.delayedCall(500 + i * 380, () => {
          G.audio.play('star', { detune: i * 200 });
          this.tweens.add({ targets: st, scale: big ? 2 : 1, alpha: 1, duration: 300, ease: 'Back.easeOut', onComplete: () => st.play('star:ding') });
        });
      }
    }
    if (failed) this.time.delayedCall(400, () => G.audio.play('fail'));
    else this.time.delayedCall(500 + s.stars * 380, () => G.audio.play('fanfare'));
    let y = sy + (big ? 30 : 20);
    txt(this, W / 2, y, `Obslouženo ${s.served} / ${s.total} · odešli naštvaní ${s.angry} · překlepy týmu ${s.mistakes}`, { size: 'xs', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 20 });
    y += 22;
    // players table
    const pw = W - 16;
    const rows = s.players.length;
    panel(this, 8, y, pw, 24 + rows * 26);
    const cols = [pw * 0.5, pw * 0.64, pw * 0.8, pw - 6].map((x) => Math.round(8 + x));
    const head = ['první', 'doběh', 'mince', 'kombo'];
    head.forEach((h, i) => txt(this, cols[i], y + 7, h, { size: 'xs', color: C.grey, origin: [1, 0] }));
    const crown = crowned(s.players);
    const order = [...s.players].sort((a, b) => b.first - a.first || b.coins - a.coins);
    order.forEach((p, i) => {
      const ry = y + 22 + i * 26;
      if (p.pid === this.me) this.add.rectangle(12, ry - 3, pw - 8, 22, 0xffffff, 0.06).setOrigin(0, 0);
      this.add.image(20, ry + 8, 'pdot', PFRAME[p.color]);
      const name = txt(this, 28, ry + 1, p.name + (p.pid === this.me ? ' (ty)' : ''), { size: 's', color: PCOL[p.color] });
      if (p.left) txt(this, 28, ry + 12, 'odešel(a)', { size: 'xs', color: C.grey });
      if (crown.includes(p.pid)) {
        const cr = this.add.image(Math.round(28 + name.width + 9), ry + 5, 'crown').setScale(0);
        this.time.delayedCall(1700, () => { this.tweens.add({ targets: cr, scale: 1, duration: 300, ease: 'Back.easeOut' }); G.audio.play('coin', { detune: 600 }); });
      }
      const vals = [String(p.first), String(p.runoff), `+${p.coins}`, `${p.bestCombo}×`];
      vals.forEach((v, k) => txt(this, cols[k], ry + 2, v, { size: 's', color: k === 2 ? C.yellow : C.white, origin: [1, 0] }));
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
