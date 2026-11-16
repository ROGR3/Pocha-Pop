// Night selection: districts stacked vertically (scroll by drag / wheel), each
// a strip of backdrop with lanterns on a wire. Side lines (약국) and holiday
// nights are smaller strips under the district that unlocks them.
import Phaser from 'phaser';
import { DAILY_NIGHT, DISTRICTS, NIGHTS, homeDistrict, nightDef } from '../data/levels';
import { dailyBest } from '../logic/daily';
import { dayKey } from '../logic/save';
import { NAMES } from '../data/story';
import { G, iconTex, word } from '../game/state';
import { BG_PREFIX, DEPTH } from '../game/street';
import { C, button, fadeIn, goto, iconButton, iconFrame, panel, segmented, smallStars, snapText, toast, txt } from '../game/ui';
import { BOSS_SEATS, DEFAULT_SEATS, SEAT_OPTIONS, seatMultiplier, seatsAvailable } from '../logic/rules';

interface Section { pre: string; title: string; sub: string; nights: number[]; color: string; h: number }

const HOLIDAY_NAME: Record<number, string> = { 301: '추석', 302: '크리스마스', 303: '생일' };

/** Map sections top → bottom (only those whose nights exist). */
function sections(): Section[] {
  const has = (n: number) => NIGHTS.some((d) => d.n === n);
  const range = (a: number, b: number) => Array.from({ length: b - a + 1 }, (_, i) => a + i).filter(has);
  const out: Section[] = [
    { pre: 'eul', title: '을지로', sub: 'noci 1–5', nights: range(1, 5), color: C.pink, h: 150 },
    { pre: 'han', title: '한강', sub: 'noci 6–10 + kritik 미식가', nights: [...range(6, 10), 11], color: C.cyan, h: 150 },
    { pre: 'phm', title: '약국', sub: 'vedlejší linka · lékárna', nights: range(201, 204), color: C.green, h: 110 },
    { pre: 'ddm', title: '동대문', sub: 'noci 12–16 + blogerka', nights: [...range(12, 16), 116].filter(has), color: C.yellow, h: 150 },
    { pre: 'eul', title: '추석', sub: 'sváteční noc', nights: [301].filter(has), color: C.orange, h: 84 },
    { pre: 'hgd', title: '홍대', sub: 'noci 17–21 + manažer', nights: [...range(17, 21), 121].filter(has), color: C.pink, h: 150 },
    { pre: 'hgd', title: '크리스마스', sub: 'sváteční noc', nights: [302].filter(has), color: C.green, h: 84 },
    { pre: 'ysn', title: '용산', sub: 'noci 22–26 + obchodník', nights: [...range(22, 26), 126].filter(has), color: C.cyan, h: 150 },
    { pre: 'eul', title: '생일', sub: 'narozeniny 나비', nights: [303].filter(has), color: C.pink, h: 84 },
    { pre: 'bsn', title: '부산', sub: 'noci 27–31 + kapitán', nights: [...range(27, 31), 131].filter(has), color: C.blue, h: 150 },
  ];
  return out.filter((s) => s.nights.length > 0);
}

export class MapScene extends Phaser.Scene {
  private popup?: Phaser.GameObjects.Container;
  private list!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;
  private top = 26;
  private dragMoved = 0;
  constructor() { super('Map'); }

  // Phaser reuses the scene instance: a popup left open when a night started would block the map.
  init() { this.popup = undefined; this.dragMoved = 0; }

  create() {
    fadeIn(this);
    G.ime.deactivate();
    G.audio.setAmbient('rain');
    G.audio.setLofi(G.hasUpgrade('radio'), G.station());
    const W = this.scale.width, H = this.scale.height;
    const top = this.top, bottom = 40;
    const viewH = H - top - bottom;

    // scrolling list of district strips
    this.list = this.add.container(0, top);
    let y = 0;
    const frontier = G.frontier();
    let focusY = 0;
    const secs = sections();
    const dailyH = G.isUnlocked(DAILY_NIGHT) ? 46 : 0;
    const natural = secs.reduce((a, s) => a + s.h, 0);
    if (dailyH) { this.dailyStrip(W, dailyH); y = dailyH; }
    // few districts unlocked so far: stretch the strips to fill the screen
    const k = natural + dailyH < viewH ? (viewH - dailyH) / natural : 1;
    for (const sec of secs) {
      sec.h = Math.floor(sec.h * k);
      this.section(y, W, sec);
      if (sec.nights.includes(frontier)) focusY = y + sec.h / 2;
      y += sec.h;
    }
    this.maxScroll = Math.max(0, y - viewH);
    const maskG = this.make.graphics({}, false).fillRect(0, top, W, viewH);
    this.list.setMask(maskG.createGeometryMask());
    this.setScroll(focusY - viewH / 2);

    let dragStart = 0, startScroll = 0, dragging = false;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { if (this.popup) return; dragging = true; this.dragMoved = 0; dragStart = p.y; startScroll = this.scrollY; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (!dragging || !p.isDown || this.popup) return;
      this.dragMoved = Math.max(this.dragMoved, Math.abs(p.y - dragStart));
      if (this.dragMoved > 4) this.setScroll(startScroll - (p.y - dragStart));
    });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => { if (!this.popup) this.setScroll(this.scrollY + dy * 0.5); });

    // HUD
    this.add.rectangle(0, 0, W, top, 0x181425).setOrigin(0, 0).setDepth(DEPTH.hud);
    this.add.rectangle(0, top - 1, W, 1, 0x3a4466).setOrigin(0, 0).setDepth(DEPTH.hud);
    this.add.sprite(10, 13, 'coin').play('coin:spin').setDepth(DEPTH.hud);
    txt(this, 18, 13, String(G.data.coins), { size: 'm', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    const streak = G.streak();
    this.add.image(Math.round(W / 2) - 14, 13, 'uiicons', iconFrame('fire')).setDepth(DEPTH.hud).setAlpha(streak > 0 ? 1 : 0.4);
    txt(this, Math.round(W / 2) - 5, 13, `${streak} ${streak === 1 ? 'den' : streak >= 2 && streak <= 4 ? 'dny' : 'dní'}`, { size: 's', color: streak > 0 ? C.orange : C.grey, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    const regular = NIGHTS.filter((d) => !d.boss);
    const stars = regular.reduce((a, d) => a + (G.track().nights[d.n]?.stars ?? 0), 0);
    const st = txt(this, W - 28, 13, `${stars}/${regular.length * 3}`, { size: 's', color: C.yellow, origin: [1, 0.5] }).setDepth(DEPTH.hud);
    this.add.image(W - 34 - st.width, 13, 'star_s', 0).setDepth(DEPTH.hud);
    iconButton(this, W - 13, 13, 'gear', () => goto(this, 'Settings', { from: 'Map' })).setDepth(DEPTH.hud);
    // track tag: eye (Čtení) / ear (Poslech) – opens Settings
    const tag = button(this, Math.min(70, Math.round(W / 2) - 36), 13, 20, 20, '', () => goto(this, 'Settings', { from: 'Map' }), { style: G.listening ? 'red' : 'wood' }).setDepth(DEPTH.hud);
    tag.add(this.add.image(0, -1, 'track_m', G.listening ? 1 : 0));

    // bottom bar
    this.add.rectangle(0, H - bottom, W, bottom, 0x181425).setOrigin(0, 0).setDepth(DEPTH.hud);
    this.add.rectangle(0, H - bottom, W, 1, 0x3a4466).setOrigin(0, 0).setDepth(DEPTH.hud);
    const by = H - bottom / 2;
    const bw = Math.floor((W - 30) / 4);
    iconButton(this, 14, by, 'back', () => goto(this, 'Title')).setDepth(DEPTH.hud);
    const items: [string, string, () => void][] = [
      ['Obchod', 'bag', () => goto(this, 'Shop')],
      ['Recepty', 'book', () => goto(this, 'Recipes')],
      ['Trénink', 'target', () => goto(this, 'Training')],
      ['Odznaky', 'trophy', () => goto(this, 'Badges')],
    ];
    items.forEach(([label, icon, fn], i) => {
      const x = 28 + bw * (i + 0.5);
      button(this, x, by - 5, Math.min(bw - 4, 44), 20, '', fn, { icon, style: 'wood' }).setDepth(DEPTH.hud);
      txt(this, x, by + 13, label, { size: 'xs', color: C.cream, origin: [0.5, 0.5] }).setDepth(DEPTH.hud);
    });

    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart(); }

  onBack() {
    if (this.popup) { this.popup.destroy(); this.popup = undefined; return; }
    goto(this, 'Title');
  }

  private setScroll(v: number) {
    this.scrollY = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.list.y = this.top - Math.round(this.scrollY);
  }

  private section(y: number, W: number, sec: Section) {
    const L = this.list;
    const h = sec.h;
    const locked = !G.isUnlocked(sec.nights[0]);
    // backdrop crop: the upper part of far + mid (mid is animated)
    // far: bottom on the strip's bottom; mid: pushed down so its upper part shows
    const ch = Math.min(h, 240);
    const far = this.add.image(Math.round(W / 2), y + h - 240, `bg_${sec.pre}_far`).setOrigin(0.5, 0);
    far.setCrop(0, 240 - ch, 320, ch);
    const off = sec.pre === 'eul' ? 70 : 60;
    const mid = this.add.sprite(Math.round(W / 2), y + h + off - 240, `bg_${sec.pre}_mid`).setOrigin(0.5, 0);
    mid.play(`bg_${sec.pre}_mid:${sec.pre === 'eul' ? 'neon' : sec.pre === 'han' ? 'lights' : 'loop'}`);
    mid.setCrop(0, Math.max(0, 240 - ch - off), 320, Math.min(ch, 240 - off));
    if (h > 240) L.add(this.add.image(Math.round(W / 2), y + h - 240, `bg_${sec.pre}_sky`).setOrigin(0.5, 1).setCrop(0, 200 - (h - 240), 320, h - 240));
    L.add([far, mid]);
    L.add(this.add.rectangle(0, y, W, h, 0x181425, locked ? 0.7 : 0.35).setOrigin(0, 0));
    // Poslech: a bluer night over every strip
    if (G.listening) L.add(this.add.rectangle(0, y, W, h, 0x124e89, 0.28).setOrigin(0, 0));
    L.add(this.add.rectangle(0, y + h - 1, W, 1, 0x181425).setOrigin(0, 0));
    const measure = (t: string, size: 'l' | 'xs') => { const m = txt(this, 0, 0, t, { size }); const w = m.width; m.destroy(); return w; };
    const tw = Math.max(measure(sec.title, 'l'), measure(locked ? `${sec.sub} · zamčeno` : sec.sub, 'xs'));
    L.add(this.add.rectangle(4, y + 4, tw + 10, 30, 0x181425, 0.6).setOrigin(0, 0));
    L.add(txt(this, 8, y + 6, sec.title, { size: 'l', color: locked ? C.grey : sec.color, shadow: true }));
    L.add(txt(this, 8, y + 24, locked ? `${sec.sub} · zamčeno` : sec.sub, { size: 'xs', color: C.light, shadow: true }));
    // wire with lanterns
    const n = sec.nights.length;
    const x0 = n === 1 ? W / 2 - 40 : 22, x1 = n === 1 ? W / 2 + 40 : W - 22;
    const wireY = y + (h < 100 ? 30 : Math.max(44, Math.round(h * 0.34)));
    const sag = Math.min(26, h * 0.16);
    const pt = (t: number) => ({ x: x0 + (x1 - x0) * t, y: wireY + sag * 4 * t * (1 - t) });
    const g = this.add.graphics();
    g.lineStyle(1, 0x181425, 1);
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const p = pt(i / 40); if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); }
    g.strokePath();
    L.add(g);
    sec.nights.forEach((night, i) => {
      const p = pt((i + 0.5) / n);
      this.node(Math.round(p.x), Math.round(p.y), night);
    });
  }

  /** Top strip: today's daily challenge. */
  private dailyStrip(W: number, h: number) {
    const L = this.list;
    const today = dayKey(new Date());
    const rec = G.track().daily[today];
    L.add(this.add.rectangle(0, 0, W, h, 0x262b44).setOrigin(0, 0));
    L.add(this.add.rectangle(0, h - 1, W, 1, 0x181425).setOrigin(0, 0));
    L.add(this.add.image(16, h / 2, 'uiicons', iconFrame('calendar')));
    L.add(txt(this, 30, 8, 'Denní výzva', { size: 'm', color: C.yellow }));
    const best = dailyBest(G.track().daily);
    L.add(txt(this, 30, 25, rec ? `Dnes: ${'★'.repeat(rec.stars)} ${rec.coins} mincí` : `${today.slice(8)}. ${today.slice(5, 7)}. · nejlépe ${best}`, { size: 'xs', color: rec ? C.green : C.light }));
    const b = button(this, W - 40, h / 2, 64, 20, rec ? 'Znovu' : 'Hrát', () => {
      if (this.dragMoved > 6) return;
      goto(this, 'Night', { night: DAILY_NIGHT, seats: 3 });
    }, { size: 's', style: rec ? 'wood' : 'red' });
    L.add(b);
    if (!rec) this.tweens.add({ targets: b, scale: { from: 1, to: 1.06 }, yoyo: true, repeat: -1, duration: 600 });
  }

  private node(x: number, y: number, n: number) {
    const L = this.list;
    const def = nightDef(n);
    const unlocked = G.isUnlocked(n);
    const rec = G.track().nights[n];
    const boss = !!def.boss;
    const key = boss ? 'node_boss' : 'node';
    const s = this.add.sprite(x, y, key, boss ? (unlocked ? 1 : 0) : unlocked ? 0 : 3).setOrigin(0.5, 0);
    if (unlocked) s.play({ key: `${key}:lit`, startFrame: n % 2 });
    this.tweens.add({ targets: s, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1500 + (n % 13) * 97, ease: 'Sine.easeInOut' });
    const h = boss ? 34 : 22;
    const name = boss ? NAMES[def.boss!] : def.district === 'pharmacy' ? `L${n - 200}` : def.district === 'holiday' ? '★' : String(n);
    const label = txt(this, x, y + h + 2, name, { size: boss ? 's' : 'm', color: unlocked ? C.white : C.grey, origin: [0.5, 0], shadow: true });
    L.add([s, label]);
    if (rec && !boss) L.add(smallStars(this, x, y + h + 21, rec.stars));
    if (rec && boss) L.add(txt(this, x, y + h + 15, '★'.repeat(rec.stars), { size: 's', color: C.yellow, origin: [0.5, 0] }));
    if (rec?.seats && !boss) {
      // most seats this night was played with: tiny stool + number under the stars
      L.add(this.add.image(x - 3, y + h + 32, 'uiicons', iconFrame('stool_s')));
      L.add(txt(this, x + 1, y + h + 32, String(rec.seats), { size: 'xs', color: C.cream, origin: [0, 0.5], shadow: true }));
    }
    if (unlocked && !rec) {
      // Poslech: a music note instead of the arrow
      const m = G.listening ? this.add.image(x, y - 9, 'note').setOrigin(0.5, 1) : txt(this, x, y - 10, '▼', { size: 's', color: C.yellow, origin: [0.5, 1], shadow: true });
      L.add(m);
      this.tweens.add({ targets: m, y: y - 6, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
    }
    s.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });
    const open = () => {
      if (this.dragMoved > 6 || this.popup) return;
      if (!unlocked) { G.audio.play('error', { volume: 0.5 }); this.tweens.add({ targets: s, x: { from: x - 2, to: x }, duration: 200, ease: 'Elastic.easeOut' }); return; }
      G.audio.play('click');
      this.showPopup(n);
    };
    s.on('pointerup', open);
    label.on('pointerup', open);
  }

  private showPopup(n: number) {
    this.popup?.destroy();
    const W = this.scale.width, H = this.scale.height;
    const def = nightDef(n);
    const pw = W - 30, ph = def.newWords.length > Math.max(5, Math.floor((W - 46) / 26)) ? 222 : 200;
    const c = this.add.container(15, Math.round(H / 2 - ph / 2)).setDepth(DEPTH.overlay);
    const shade = this.add.rectangle(-15, -c.y, W, H, 0x181425, 0.6).setOrigin(0, 0).setInteractive();
    shade.on('pointerup', () => { c.destroy(); this.popup = undefined; });
    c.add(shade);
    c.add(panel(this, 0, 0, pw, ph));
    const boss = !!def.boss;
    const dist = DISTRICTS[homeDistrict(def)];
    const title = boss ? `Boss: ${NAMES[def.boss!]}` : def.district === 'holiday' ? `${HOLIDAY_NAME[n] ?? '명절'}` : `${def.district === 'pharmacy' ? `약국 ${n - 200}` : `Noc ${n}`} · ${dist.ko}`;
    c.add(txt(this, pw / 2, 10, title, { size: 'l', color: C.yellow, origin: [0.5, 0] }));
    let y = 32;
    if (def.newJamo.length) {
      c.add(txt(this, 12, y, 'Nová písmena:', { size: 's', color: C.light }));
      c.add(txt(this, 84, y - 2, def.newJamo.join(' '), { size: 'm', color: C.white, wrap: pw - 96 }));
      y += def.newJamo.length > 7 ? 28 : 16;
    }
    if (def.newWords.length) {
      c.add(txt(this, 12, y, 'Nová slova:', { size: 's', color: C.light }));
      const ws = def.newWords.slice(0, 7);
      const per = Math.max(5, Math.floor((pw - 16) / 26));
      def.newWords.slice(0, per * 2).forEach((id, i) => {
        const w = word(id);
        const ix = 10 + (i % per) * Math.floor((pw - 16) / per);
        c.add(this.add.image(ix + 12, y + 24 + Math.floor(i / per) * 25, ...iconTex(w.icon)).setOrigin(0.5));
      });
      y += def.newWords.length > per ? 64 : 40;
    } else if (!boss) {
      c.add(txt(this, 12, y, 'Opakování všeho, co už umíš – rychleji!', { size: 's', color: C.light, wrap: pw - 24 }));
      y += 26;
    } else {
      c.add(txt(this, 12, y, 'Objednává celými větami a čeká pozdrav. Každá chyba i chybějící pozdrav = −1 hvězda.', { size: 's', color: C.light, wrap: pw - 24 }));
      y += 26;
    }
    c.add(txt(this, 12, y, `Zákazníků: ${def.customers}   Trpělivost: ${def.patience} s`, { size: 'xs', color: C.grey }));
    const rec = G.track().nights[n];
    if (rec) c.add(txt(this, pw - 12, y, `nejlépe: ${rec.stars}★  ${rec.bestCoins}`, { size: 'xs', color: C.yellow, origin: [1, 0] }));
    if (!boss) {
      const SEAT_DESC: Record<number, string> = { 2: 'Klidná noc', 3: 'Běžná noc', 4: 'Nával' };
      const avail = seatsAvailable(G.track().nights, NIGHTS.filter((d) => d.boss).map((d) => d.n));
      let seats = avail.includes(G.data.settings.seats) ? G.data.settings.seats : DEFAULT_SEATS;
      const sy = ph - 74;
      c.add(txt(this, 12, sy - 4, 'Míst u pultu:', { size: 's', color: C.light }));
      const desc = txt(this, pw / 2, sy + 30, '', { size: 'xs', color: C.yellow, origin: [0.5, 0] });
      const setDesc = () => { desc.setText(`${SEAT_DESC[seats]} · mince ×${seatMultiplier(seats).toLocaleString('cs-CZ')}`); snapText(desc); };
      setDesc();
      c.add(desc);
      const opts = [...SEAT_OPTIONS];
      segmented(this, 12, sy + 18, pw - 24, 20, opts.map(String), opts.indexOf(seats as 2 | 3 | 4), (i) => {
        seats = opts[i];
        G.data.settings.seats = seats;
        G.save.save();
        G.audio.play('click');
        setDesc();
      }, {
        icon: 'stool',
        locked: opts.map((o) => !avail.includes(o)),
        onLocked: () => toast(this, 'Nával se odemkne po první noci se 3★', C.orange, H / 2 + ph / 2 - 30),
      }).forEach((b) => c.add(b));
    } else {
      c.add(txt(this, pw / 2, ph - 50, 'Boss: vždy 3 místa.', { size: 'xs', color: C.grey, origin: [0.5, 0] }));
    }
    c.add(button(this, pw / 2, ph - 18, 120, 22, 'Otevřít stánek', () => {
      G.night = n;
      goto(this, 'Night', { night: n, seats: boss ? BOSS_SEATS : G.data.settings.seats });
    }));
    c.add(button(this, pw - 16, 14, 18, 18, '', () => { c.destroy(); this.popup = undefined; }, { icon: 'close', style: 'wood' }));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
    this.popup = c;
  }

}
