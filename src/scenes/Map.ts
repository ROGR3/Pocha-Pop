// Night selection: lanterns on a wire across 을지로 and over the 한강.
import Phaser from 'phaser';
import { BOSS_NIGHT, NIGHTS, nightDef } from '../data/levels';
import { G, iconIdx, word } from '../game/state';
import { DEPTH } from '../game/street';
import { C, button, fadeIn, goto, iconButton, panel, smallStars, txt } from '../game/ui';

export class MapScene extends Phaser.Scene {
  private popup?: Phaser.GameObjects.Container;
  constructor() { super('Map'); }

  create() {
    fadeIn(this);
    G.ime.deactivate();
    G.audio.setAmbient('rain');
    G.audio.setLofi(G.hasUpgrade('radio'));
    const W = this.scale.width, H = this.scale.height;
    const top = 26, bottom = 40;
    const sh = Math.floor((H - top - bottom) / 2);

    this.section(0, top, W, sh, 'eul', '을지로', 'noci 1–5', NIGHTS.filter((n) => n.district === 'euljiro').map((n) => n.n));
    this.section(1, top + sh, W, H - top - bottom - sh, 'han', '한강', 'noci 6–10 + kritik', [...NIGHTS.filter((n) => n.district === 'hangang').map((n) => n.n), BOSS_NIGHT]);

    // HUD
    this.add.rectangle(0, 0, W, top, 0x181425).setOrigin(0, 0).setDepth(DEPTH.hud);
    this.add.rectangle(0, top - 1, W, 1, 0x3a4466).setOrigin(0, 0).setDepth(DEPTH.hud);
    this.add.sprite(10, 13, 'coin').play('coin:spin').setDepth(DEPTH.hud);
    txt(this, 18, 13, String(G.data.coins), { size: 'm', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    const streak = G.streak();
    this.add.image(Math.round(W / 2) - 14, 13, 'uiicons', 8).setDepth(DEPTH.hud).setAlpha(streak > 0 ? 1 : 0.4);
    txt(this, Math.round(W / 2) - 5, 13, `${streak} ${streak === 1 ? 'den' : streak >= 2 && streak <= 4 ? 'dny' : 'dní'}`, { size: 's', color: streak > 0 ? C.orange : C.grey, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    const stars = Object.entries(G.data.nights).reduce((a, [k, r]) => a + (Number(k) === BOSS_NIGHT ? 0 : r.stars), 0);
    this.add.image(W - 40, 13, 'star_s', 0).setDepth(DEPTH.hud);
    txt(this, W - 33, 13, `${stars}/30`, { size: 's', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);

    // bottom bar
    this.add.rectangle(0, H - bottom, W, bottom, 0x181425).setOrigin(0, 0).setDepth(DEPTH.hud);
    this.add.rectangle(0, H - bottom, W, 1, 0x3a4466).setOrigin(0, 0).setDepth(DEPTH.hud);
    const by = H - bottom / 2;
    const bw = Math.floor((W - 40) / 3);
    iconButton(this, 14, by, 'back', () => goto(this, 'Title')).setDepth(DEPTH.hud);
    button(this, 30 + bw / 2, by, bw - 4, 22, 'Obchod', () => goto(this, 'Shop'), { icon: 'bag', style: 'wood', size: 's' }).setDepth(DEPTH.hud);
    button(this, 30 + bw * 1.5, by, bw - 4, 22, 'Receptář', () => goto(this, 'Recipes'), { icon: 'book', style: 'wood', size: 's' }).setDepth(DEPTH.hud);
    button(this, 30 + bw * 2.5, by, bw - 4, 22, 'Nastavení', () => goto(this, 'Settings', { from: 'Map' }), { icon: 'gear', style: 'wood', size: 's' }).setDepth(DEPTH.hud);

    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart(); }

  onBack() {
    if (this.popup) { this.popup.destroy(); this.popup = undefined; return; }
    goto(this, 'Title');
  }

  private section(idx: number, y: number, W: number, h: number, pre: 'eul' | 'han', title: string, sub: string, nights: number[]) {
    // backdrop crop
    const far = this.add.image(Math.round(W / 2), y + h, `bg_${pre}_far`).setOrigin(0.5, 1);
    const mid = this.add.sprite(Math.round(W / 2), y + h + (pre === 'eul' ? 70 : 60), `bg_${pre}_mid`).setOrigin(0.5, 1).play(`bg_${pre}_mid:${pre === 'eul' ? 'neon' : 'lights'}`);
    const mask = this.make.graphics({}, false).fillRect(0, y, W, h).createGeometryMask();
    far.setMask(mask);
    mid.setMask(mask);
    this.add.rectangle(0, y, W, h, 0x181425, 0.35).setOrigin(0, 0);
    txt(this, 8, y + 6, title, { size: 'l', color: pre === 'eul' ? C.pink : C.cyan, shadow: true });
    txt(this, 8, y + 24, sub, { size: 'xs', color: C.light, shadow: true });

    // wire with lanterns
    const n = nights.length;
    const x0 = 22, x1 = W - 22;
    const wireY = y + Math.max(44, Math.round(h * 0.36));
    const sag = Math.min(26, h * 0.18);
    const pt = (t: number) => ({ x: x0 + (x1 - x0) * t, y: wireY + sag * 4 * t * (1 - t) });
    const g = this.add.graphics();
    g.lineStyle(1, 0x181425, 1);
    g.beginPath();
    for (let i = 0; i <= 40; i++) { const p = pt(i / 40); if (i === 0) g.moveTo(p.x, p.y); else g.lineTo(p.x, p.y); }
    g.strokePath();
    nights.forEach((night, i) => {
      const t = (i + 0.5) / n;
      const p = pt(t);
      this.node(Math.round(p.x), Math.round(p.y), night);
    });
    void idx;
  }

  private node(x: number, y: number, n: number) {
    const unlocked = G.isUnlocked(n);
    const rec = G.data.nights[n];
    const boss = n === BOSS_NIGHT;
    const key = boss ? 'node_boss' : 'node';
    const s = this.add.sprite(x, y, key, boss ? (unlocked ? 1 : 0) : unlocked ? 0 : 3).setOrigin(0.5, 0);
    if (unlocked) s.play({ key: `${key}:lit`, startFrame: n % 2 });
    this.tweens.add({ targets: s, angle: { from: -3, to: 3 }, yoyo: true, repeat: -1, duration: 1500 + n * 97, ease: 'Sine.easeInOut' });
    const h = boss ? 34 : 22;
    const label = txt(this, x, y + h + 2, boss ? '미식가' : String(n), { size: boss ? 's' : 'm', color: unlocked ? C.white : C.grey, origin: [0.5, 0], shadow: true });
    if (rec && !boss) smallStars(this, x, y + h + 21, rec.stars);
    if (rec && boss) txt(this, x, y + h + 15, '★'.repeat(rec.stars), { size: 's', color: C.yellow, origin: [0.5, 0] });
    if (unlocked && !rec) {
      // current frontier: bouncing marker
      const m = txt(this, x, y - 10, '▼', { size: 's', color: C.yellow, origin: [0.5, 1], shadow: true });
      this.tweens.add({ targets: m, y: y - 6, yoyo: true, repeat: -1, duration: 420, ease: 'Sine.easeInOut' });
    }
    s.setInteractive({ useHandCursor: true });
    label.setInteractive({ useHandCursor: true });
    const open = () => {
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
    const pw = W - 30, ph = 150;
    const c = this.add.container(15, Math.round(H / 2 - ph / 2)).setDepth(DEPTH.overlay);
    const shade = this.add.rectangle(-15, -c.y, W, H, 0x181425, 0.6).setOrigin(0, 0).setInteractive();
    shade.on('pointerup', () => { c.destroy(); this.popup = undefined; });
    c.add(shade);
    c.add(panel(this, 0, 0, pw, ph));
    const boss = n === BOSS_NIGHT;
    const district = def.district === 'euljiro' ? '을지로' : def.district === 'hangang' ? '한강' : '한강 · 미식가';
    c.add(txt(this, pw / 2, 10, boss ? 'Finále: kritik 미식가' : `Noc ${n} · ${district}`, { size: 'l', color: C.yellow, origin: [0.5, 0] }));
    let y = 32;
    if (def.newJamo.length) {
      c.add(txt(this, 12, y, 'Nová písmena:', { size: 's', color: C.light }));
      c.add(txt(this, 84, y - 2, def.newJamo.join(' '), { size: 'm', color: C.white, wrap: pw - 96 }));
      y += def.newJamo.length > 7 ? 28 : 16;
    }
    if (def.newWords.length) {
      c.add(txt(this, 12, y, 'Nová slova:', { size: 's', color: C.light }));
      const ws = def.newWords.slice(0, 7);
      ws.forEach((id, i) => {
        const w = word(id);
        const ix = 18 + (i % 7) * Math.floor((pw - 24) / 7);
        c.add(this.add.image(ix + 6, y + 24, 'icons', iconIdx(w.icon)).setOrigin(0.5));
      });
      y += 40;
    } else if (!boss) {
      c.add(txt(this, 12, y, 'Opakování všeho, co už umíš – rychleji!', { size: 's', color: C.light, wrap: pw - 24 }));
      y += 26;
    } else {
      c.add(txt(this, 12, y, 'Objednává celými větami. Každá chyba = −1 hvězda v recenzi.', { size: 's', color: C.light, wrap: pw - 24 }));
      y += 26;
    }
    c.add(txt(this, 12, y, `Zákazníků: ${def.customers}   Trpělivost: ${def.patience} s`, { size: 'xs', color: C.grey }));
    const rec = G.data.nights[n];
    if (rec) c.add(txt(this, pw - 12, y, `nejlépe: ${rec.stars}★  ${rec.bestCoins}`, { size: 'xs', color: C.yellow, origin: [1, 0] }));
    c.add(button(this, pw / 2, ph - 18, 120, 22, 'Otevřít stánek', () => {
      G.night = n;
      goto(this, 'Night', { night: n });
    }));
    c.add(button(this, pw - 16, 14, 18, 18, '', () => { c.destroy(); this.popup = undefined; }, { icon: 'close', style: 'wood' }));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 160 });
    this.popup = c;
  }

}
