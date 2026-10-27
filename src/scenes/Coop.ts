// "Spolu": name + colour, host a stall (QR, short code, players, night picker)
// or wait in someone else's stall until the host opens it.
import Phaser from 'phaser';
import qrcode from 'qrcode-generator';
import { DISTRICTS, nightDef } from '../data/levels';
import { MAX_PLAYERS, coopCustomers, coopSeats } from '../logic/coop';
import { PLAYER_COLORS, cleanName, qrPayload, shortCode, type Msg, type PlayerColor } from '../logic/netproto';
import { PCOL, PCS, PFRAME, coopNights } from '../game/coopui';
import { hostSession, type NetSession } from '../game/net';
import { G } from '../game/state';
import { TypeBox } from '../game/typebox';
import { Button, C, button, cssRect, fadeIn, goto, iconButton, panel, segmented, snapText, toast, txt } from '../game/ui';

type View = 'menu' | 'lobby';

export class CoopScene extends Phaser.Scene {
  private view: View = 'menu';
  private error = '';
  private box?: TypeBox;
  private editing = false;
  private unsubIme?: () => void;
  private offs: (() => void)[] = [];
  private list?: Phaser.GameObjects.Container;
  private openBtn?: Button;
  private nightText?: Phaser.GameObjects.Text;
  private districtText?: Phaser.GameObjects.Text;
  private trackText?: Phaser.GameObjects.Text;
  private confirm?: Phaser.GameObjects.Container;
  private builtW = 0;

  constructor() { super('Coop'); }

  init(d: { error?: string; view?: View }) {
    this.error = d?.error ?? '';
    this.editing = false;
    this.confirm = undefined;
    this.offs = [];
  }

  create() {
    fadeIn(this);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    this.builtW = W;
    this.add.rectangle(0, 0, W, H, 0x262b44).setOrigin(0, 0);
    // decided here, not in init(): the session can die in between (scene fade)
    const net = G.net && !G.net.closed ? G.net : null;
    this.view = net ? 'lobby' : 'menu';
    if (net) this.lobby(net); else this.menu();
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => {
      this.unsubIme?.();
      this.offs.forEach((f) => f());
      if (G.net) { G.net.onLobby = null; }
      G.ime.onKey = null;
      G.ime.setInputMode('text');
      G.ime.deactivate();
      this.game.events.off('layout', this.relayout, this);
    });
  }

  /** Height-only changes (soft keyboard while typing the name) must not restart. */
  private relayout() {
    if (this.editing && this.scale.width === this.builtW) { this.placeTap(); return; }
    this.scene.restart({ error: this.error });
  }

  // ---------------------------------------------------------------- menu
  private menu() {
    const W = this.scale.width, H = this.scale.height;
    txt(this, W / 2, 8, 'Spolu · 같이', { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true });
    txt(this, W / 2, 28, 'Společný stánek pro 2–3 hráče na stejné Wi-Fi nebo hotspotu.', { size: 's', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 24 });
    txt(this, 14, 58, 'Tvoje jméno', { size: 'xs', color: C.grey });
    this.box = new TypeBox(this, 12, 68, W - 24, 36, 'Klepni a napiš jméno');
    this.box.set(G.data.settings.coopName, false);
    this.box.bg.setInteractive().on('pointerdown', () => this.startEdit());
    txt(this, 14, 112, 'Barva', { size: 'xs', color: C.grey });
    const dots: Phaser.GameObjects.Container[] = [];
    PLAYER_COLORS.forEach((col, i) => {
      const x = Math.round(W / 2 + (i - 1) * 64), y = 132;
      const ring = this.add.rectangle(0, 0, 60, 22, 0x181425).setStrokeStyle(1, 0x5a6988);
      const dot = this.add.image(-20, 0, 'pdot', PFRAME[col]).setScale(2);
      const t = txt(this, -12, -1, PCS[col], { size: 'xs', color: PCOL[col], origin: [0, 0.5] });
      const c = this.add.container(x, y, [ring, dot, t]).setSize(60, 22).setInteractive({ useHandCursor: true });
      c.on('pointerup', () => { this.stopEdit(); this.setColor(col, dots); });
      dots.push(c);
    });
    this.setColor(G.data.settings.coopColor, dots, true);
    const host = button(this, W / 2, 168, W - 48, 24, 'Založit stánek', () => this.host(), { icon: 'together' });
    const join = button(this, W / 2, 198, W - 48, 24, 'Připojit se', () => this.join(), { icon: 'wifi', style: 'wood' });
    void host; void join;
    txt(this, W / 2, 216, 'Hostitel zapne hotspot (nebo jste všichni na stejné Wi-Fi), ostatní naskenují jeho QR kód.', { size: 'xs', color: C.grey, origin: [0.5, 0], align: 'center', wrap: W - 28 });
    if (this.error) txt(this, W / 2, 248, this.error, { size: 's', color: C.pink, origin: [0.5, 0], align: 'center', wrap: W - 24 });
    iconButton(this, 16, Math.max(270, H - 16), 'back', () => this.onBack());
    G.ime.onKey = (e) => { if (e.key === 'Enter') this.stopEdit(); };
    this.input.on('pointerdown', (_p: Phaser.Input.Pointer, over: Phaser.GameObjects.GameObject[]) => {
      if (this.editing && !over.includes(this.box!.bg)) this.stopEdit();
    });
    if (!G.data.settings.coopName) this.startEdit();
  }

  private setColor(col: PlayerColor, dots: Phaser.GameObjects.Container[], silent = false) {
    G.data.settings.coopColor = col;
    PLAYER_COLORS.forEach((c, i) => {
      const ring = dots[i].list[0] as Phaser.GameObjects.Rectangle;
      ring.setStrokeStyle(c === col ? 2 : 1, c === col ? 0xfee761 : 0x5a6988);
    });
    if (!silent) { G.save.save(); G.audio.play('click'); this.tweens.add({ targets: dots[PLAYER_COLORS.indexOf(col)], scale: { from: 1.15, to: 1 }, duration: 200, ease: 'Back.easeOut' }); }
  }

  private placeTap() {
    if (!this.box) return;
    const W = this.scale.width;
    G.ime.setTapArea(cssRect(this, 12, 68, W - 24, 36));
  }

  private startEdit() {
    if (this.editing || !this.box) return;
    this.editing = true;
    G.ime.activate();
    G.ime.setInputMode('text');
    G.ime.setText(G.data.settings.coopName);
    this.placeTap();
    this.box.setHint('Piš (korejsky i latinkou)…');
    this.unsubIme = G.ime.subscribe((s) => {
      const name = [...s.text.replace(/^\s+/, '')].slice(0, 8).join('');
      if (name !== s.text && !s.composing) G.ime.setText(name);
      this.box!.set(name, s.composing);
    });
  }

  private stopEdit() {
    if (!this.editing) return;
    this.editing = false;
    this.unsubIme?.();
    this.unsubIme = undefined;
    const name = cleanName(G.ime.state.text);
    G.ime.deactivate();
    G.data.settings.coopName = name;
    G.save.save();
    this.box?.set(name, false);
    this.box?.setHint('Klepni a napiš jméno');
  }

  private needName(): boolean {
    this.stopEdit();
    if (G.data.settings.coopName) return false;
    toast(this, 'Nejdřív napiš své jméno', C.orange, 90);
    this.startEdit();
    return true;
  }

  private async host() {
    if (this.needName()) return;
    if (!coopNights().length) { toast(this, 'Nejdřív dohraj první noc', C.orange); return; }
    try {
      await hostSession(this.game);
      this.scene.restart({});
    } catch (e) {
      console.warn(e);
      this.scene.restart({ error: 'Stánek se nepodařilo otevřít (síť).' });
    }
  }

  private join() {
    if (this.needName()) return;
    goto(this, 'CoopJoin');
  }

  // ---------------------------------------------------------------- lobby
  private lobby(s: NetSession) {
    const W = this.scale.width, H = this.scale.height;
    let y = 8;
    if (s.isHost) {
      txt(this, W / 2, y, 'Tvůj stánek', { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true });
      y += 22;
      y = this.qrBlock(s, y) + 8;
    } else {
      const host = s.players.find((p) => p.pid === 0);
      txt(this, W / 2, y, `Stánek: ${host?.name ?? '?'}`, { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true });
      y += 26;
    }
    // players
    panel(this, 12, y, W - 24, 24 + MAX_PLAYERS * 15);
    txt(this, 20, y + 6, 'Hráči', { size: 's', color: C.cream });
    this.list = this.add.container(0, y + 20);
    y += 24 + MAX_PLAYERS * 15 + 8;
    // night
    if (s.isHost) {
      const groups = coopNights();
      if (!groups.some((g) => g.nights.includes(s.night))) s.setNight(groups[groups.length - 1].nights.slice(-1)[0]);
      const step = (dd: number, dn: number) => {
        const gi = groups.findIndex((g) => g.nights.includes(s.night));
        if (dd) {
          const g = groups[(gi + dd + groups.length) % groups.length];
          s.setNight(g.nights[g.nights.length - 1]);
        } else {
          const ns = groups[gi].nights;
          s.setNight(ns[(ns.indexOf(s.night) + dn + ns.length) % ns.length]);
        }
        this.renderNight();
      };
      iconButton(this, 26, y + 9, 'back', () => step(-1, 0));
      this.districtText = txt(this, W / 2, y + 9, '', { size: 'm', color: C.white, origin: [0.5, 0.5] });
      button(this, W - 26, y + 9, 20, 20, '', () => step(1, 0), { icon: 'play', style: 'wood' });
      y += 24;
      iconButton(this, 26, y + 9, 'back', () => step(0, -1));
      this.nightText = txt(this, W / 2, y + 9, '', { size: 'm', color: C.yellow, origin: [0.5, 0.5] });
      button(this, W - 26, y + 9, 20, 20, '', () => step(0, 1), { icon: 'play', style: 'wood' });
      y += 24;
      // Čtení · Poslech for everyone (each phone speaks for itself)
      const tracks = ['read', 'listen'] as const;
      segmented(this, 16, y + 9, W - 32, 18, ['Čtení', 'Poslech'], tracks.indexOf(s.track), (i) => { s.setTrack(tracks[i]); this.renderNight(); }, { size: 's' })
        .forEach((b, i) => { b.label.x += 7; snapText(b.label); b.add(this.add.image(Math.round(b.label.x - b.label.width / 2 - 9), -1, 'track_m', i)); });
      y += 20;
      this.trackText = txt(this, W / 2, y + 2, '', { size: 'xs', color: C.orange, origin: [0.5, 0], align: 'center', wrap: W - 24 });
      y += 22;
      this.openBtn = button(this, W / 2, y, W - 60, 24, 'Otevřít stánek', () => this.open(s), { icon: 'together' });
      y += 28;
      button(this, W / 2, Math.min(H - 16, y), 120, 18, 'Zavřít stánek', () => this.onBack(), { size: 's', style: 'wood' });
    } else {
      this.districtText = txt(this, W / 2, y, '', { size: 'm', color: C.white, origin: [0.5, 0] });
      this.nightText = txt(this, W / 2, y + 16, '', { size: 'm', color: C.yellow, origin: [0.5, 0] });
      this.trackText = txt(this, W / 2, y + 32, '', { size: 'xs', color: C.cream, origin: [0.5, 0], align: 'center', wrap: W - 24 });
      y += 52;
      const wait = txt(this, W / 2, y, 'Čekáme, až hostitel otevře stánek…', { size: 's', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 24 });
      this.tweens.add({ targets: wait, alpha: { from: 1, to: 0.4 }, yoyo: true, repeat: -1, duration: 700 });
      y += 30;
      button(this, W / 2, Math.min(H - 16, y), 110, 20, 'Odejít', () => this.onBack(), { size: 's', style: 'wood', icon: 'back' });
    }
    s.onLobby = () => { this.renderPlayers(s); this.renderNight(); };
    this.offs.push(s.onMsg((m: Msg) => {
      if (m.t === 'start') goto(this, 'Night', { night: m.night, coop: m }, 200);
    }));
    this.renderPlayers(s);
    this.renderNight();
  }

  private qrBlock(s: NetSession, y: number): number {
    const W = this.scale.width;
    const ip = s.info?.ips[0] ?? '127.0.0.1';
    const port = s.info?.port ?? 0;
    const qr = qrcode(0, 'M');
    qr.addData(qrPayload(ip, port));
    qr.make();
    const n = qr.getModuleCount();
    const m = (n + 2) * 2 <= 76 ? 2 : 1;
    const size = (n + 2) * m;
    if (this.textures.exists('qr')) this.textures.remove('qr');
    const tex = this.textures.createCanvas('qr', size, size)!;
    const ctx = tex.getContext();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, size, size);
    ctx.fillStyle = '#181425';
    for (let r = 0; r < n; r++) for (let c = 0; c < n; c++) if (qr.isDark(r, c)) ctx.fillRect((c + 1) * m, (r + 1) * m, m, m);
    tex.refresh();
    const fw = size + 16;
    this.add.nineslice(12, y, 'qr_frame', undefined, fw, fw, 9, 9, 9, 9).setOrigin(0, 0);
    this.add.image(20, y + 8, 'qr').setOrigin(0, 0);
    const tx = 12 + fw + 8;
    const tw = W - tx - 8;
    txt(this, tx, y + 2, 'Kód stánku', { size: 'xs', color: C.grey });
    txt(this, tx, y + 12, shortCode(ip, port), { size: 'xl', color: C.yellow, shadow: true });
    txt(this, tx, y + 40, `${ip}:${port}`, { size: 's', color: C.cream, wrap: tw });
    const other = (s.info?.ips ?? []).slice(1).filter((x) => !x.startsWith('127.'));
    if (other.length) txt(this, tx, y + 54, `Jiná adresa: ${other.slice(0, 2).join(', ')}`, { size: 'xs', color: C.grey, wrap: tw });
    return y + fw;
  }

  private renderPlayers(s: NetSession) {
    const L = this.list;
    if (!L) return;
    const W = this.scale.width;
    L.removeAll(true);
    for (let i = 0; i < MAX_PLAYERS; i++) {
      const p = s.players[i];
      const y = i * 15 + 4;
      if (p) {
        L.add(this.add.image(24, y, 'pdot', PFRAME[p.color]));
        const tag = p.pid === s.pid ? ' (ty)' : p.pid === 0 ? ' · hostitel' : '';
        L.add(txt(this, 32, y - 5, p.name + tag, { size: 's', color: PCOL[p.color] }));
      } else L.add(txt(this, 32, y - 5, 'volné místo…', { size: 's', color: C.grey }));
    }
    L.add(txt(this, W - 20, -14, `${s.players.length}/${MAX_PLAYERS}`, { size: 's', color: C.grey, origin: [1, 0] }));
    if (this.openBtn) this.openBtn.setEnabled(s.players.length >= 2);
  }

  private renderNight() {
    const s = G.net;
    if (!s || !this.nightText || !this.districtText) return;
    if (!s.night) { this.nightText.setText('Hostitel vybírá noc…'); snapText(this.nightText); return; }
    const def = nightDef(s.night);
    const d = DISTRICTS[def.district as keyof typeof DISTRICTS];
    this.districtText.setText(`${d.ko} · ${d.cs}`);
    if (this.trackText) {
      // without a Korean voice this phone reads the bubbles, nobody is left out
      const t = s.track === 'listen'
        ? (G.speech.ok ? (s.isHost ? '' : 'Poslech – objednávky se říkají nahlas') : 'Nemáš korejský hlas – budeš mít bubliny se čtením.')
        : (s.isHost ? '' : 'Čtení');
      this.trackText.setText(t).setColor(G.speech.ok || s.track === 'read' ? C.cream : C.orange);
      snapText(this.trackText);
    }
    this.nightText.setText(`Noc ${s.night} · ${coopCustomers(def.customers, Math.max(2, s.players.length))} hostů`);
    snapText(this.districtText);
    snapText(this.nightText);
  }

  private open(s: NetSession) {
    if (s.players.length < 2) return;
    const def = nightDef(s.night);
    s.phase = 'night';
    s.broadcast({ t: 'start', night: s.night, seed: (Date.now() & 0x7fffffff), district: def.district, seats: coopSeats(s.players.length), total: coopCustomers(def.customers, s.players.length), track: s.track });
  }

  // ---------------------------------------------------------------- leaving
  onBack() {
    if (this.editing) { this.stopEdit(); return; }
    if (this.view === 'menu') { goto(this, 'Title'); return; }
    const s = G.net;
    if (!s) { this.scene.restart({}); return; }
    if (!s.isHost || s.players.length < 2) { void s.close().then(() => this.scene.restart({})); return; }
    this.ask('Zavřít stánek pro všechny?', () => { void s.close().then(() => this.scene.restart({})); });
  }

  onNetClosed(why: string) {
    this.scene.restart({ error: why });
  }

  private ask(q: string, yes: () => void) {
    if (this.confirm) return;
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(1000);
    c.add(this.add.rectangle(0, 0, W, H, 0x181425, 0.75).setOrigin(0, 0).setInteractive());
    const pw = 180, ph = 80, px = Math.round((W - pw) / 2), py = Math.round(H / 2 - ph / 2);
    c.add(panel(this, px, py, pw, ph));
    c.add(txt(this, W / 2, py + 12, q, { size: 's', color: C.cream, origin: [0.5, 0], align: 'center', wrap: pw - 16 }));
    c.add(button(this, W / 2 - 40, py + ph - 20, 70, 20, 'Ano', () => { c.destroy(); this.confirm = undefined; yes(); }, { size: 's' }));
    c.add(button(this, W / 2 + 40, py + ph - 20, 70, 20, 'Ne', () => { c.destroy(); this.confirm = undefined; }, { size: 's', style: 'wood' }));
    this.confirm = c;
  }
}
