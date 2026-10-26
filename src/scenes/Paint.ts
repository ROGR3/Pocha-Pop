// Barvírna: stall colours (roof, sign, stools, lanterns) and hats for 나비.
// A colour is "ordered" by typing its Korean name with the IME. Colours stay
// locked (Czech name only) until the player met the word in a night / training.
import Phaser from 'phaser';
import { COLORS, HATS, PARTS } from '../data/colors';
import { buyAndEquip, itemState, unequip, type ShopState, type Slot } from '../logic/cosmetics';
import { matchKind } from '../logic/hangul';
import { hintLevel, recordMistake, recordServe } from '../logic/srs';
import { attachHat } from '../game/hats';
import { checkAchievements } from '../game/achievements';
import { G, iconTex, word } from '../game/state';
import { seenAnywhere } from '../logic/track';
import { DEPTH, Street } from '../game/street';
import { TypeBox } from '../game/typebox';
import { Button, C, button, cssRect, fadeIn, floatText, goto, iconButton, iconFrame, panel, segmented, snapText, toast, txt } from '../game/ui';

const TABS: { slot: Slot; name: string }[] = [
  { slot: 'roof', name: 'Plachta' }, { slot: 'sign', name: 'Cedule' }, { slot: 'stools', name: 'Stoličky' },
  { slot: 'lanterns', name: 'Lampiony' }, { slot: 'hat', name: 'Čepice' },
];

interface Cell { id: string | null; name: string; price: number; state: ShopState }

export class PaintScene extends Phaser.Scene {
  private tab: Slot = 'roof';
  private selected: Cell | null = null;
  private street!: Street;
  private cat!: Phaser.GameObjects.Sprite;
  private ui!: Phaser.GameObjects.Container;
  private box!: TypeBox;
  private info!: Phaser.GameObjects.Text;
  private buyBtn?: Button;
  private coinText!: Phaser.GameObjects.Text;
  private unsub?: () => void;
  private builtW = 0;
  private boxRect: [number, number, number, number] = [0, 0, 0, 0];
  private typingDirty = false;
  private flash = '';
  private from = 'Shop';

  constructor() { super('Paint'); }

  init(d: { tab?: Slot; flash?: string; from?: string }) {
    this.tab = d?.tab ?? 'roof';
    this.flash = d?.flash ?? '';
    this.from = d?.from ?? this.from;
    this.selected = null;
  }

  create() {
    fadeIn(this, this.flash ? 120 : 260);
    G.ime.deactivate();
    G.audio.setAmbient('rain');
    this.builtW = this.scale.width;
    this.street = new Street(this, { backdrop: 'euljiro', weather: false });
    const cat = G.track().friends.nabi?.chapter >= 2 ? 'nabi_fat' : 'nabi';
    this.cat = this.add.sprite(0, 0, cat).setOrigin(0.5, 1).setDepth(DEPTH.customer).play(`${cat}:sit`);
    attachHat(this, this.cat);
    this.box = new TypeBox(this, 0, 0, 100, 34, 'Klepni sem a piš');
    this.box.root.setDepth(DEPTH.input);
    this.box.bg.setInteractive().on('pointerdown', () => G.ime.reopen());
    this.unsub = G.ime.subscribe((s) => this.onIme(s.text, s.composing));
    this.events.once('shutdown', () => { this.unsub?.(); G.ime.deactivate(); this.game.events.off('layout', this.relayout, this); });
    this.game.events.on('layout', this.relayout, this);
    this.build();
    if (this.flash) {
      this.street.flash(3);
      toast(this, this.flash, C.green, 70);
      G.audio.play('buy');
      this.time.delayedCall(900, () => checkAchievements(this));
    }
  }

  onBack() {
    if (this.selected) { this.select(null); return; }
    goto(this, this.from);
  }

  /** Height-only changes (soft keyboard) rebuild the UI in place; the IME stays open. */
  private relayout() {
    if (this.scale.width !== this.builtW) { this.scene.restart({ tab: this.tab, from: this.from }); return; }
    this.build();
  }

  // ---------------------------------------------------------------- layout
  private build() {
    const W = this.scale.width, H = this.scale.height;
    this.ui?.destroy();
    this.ui = this.add.container(0, 0).setDepth(DEPTH.hud);
    const hat = this.tab === 'hat';
    const cells = this.cells();
    const cols = hat ? 3 : 4;
    const cellH = 42;
    const rows = Math.ceil(cells.length / cols);
    const footer = 26;
    const boxH = 34;
    const typing = !!this.selected;
    const bottomH = typing ? boxH + 16 : 22;
    const gridH = rows * cellH;
    const gridTop = Math.max(70, H - footer - bottomH - gridH - 6);
    const tabsY = gridTop - 14;
    const gy = Math.max(64, tabsY - 16);
    this.street.layout(gy);
    this.cat.setPosition(this.street.wx(this.street.seatX[1]), this.street.wy(-41));
    // HUD
    this.ui.add(this.add.rectangle(0, 0, W, 24, 0x181425, 0.92).setOrigin(0, 0));
    this.ui.add(txt(this, 8, 12, 'Barvírna', { size: 'l', color: C.yellow, origin: [0, 0.5] }));
    this.ui.add(this.add.sprite(W - 50, 12, 'coin').play('coin:spin'));
    this.coinText = txt(this, W - 42, 12, String(G.data.coins), { size: 'm', color: C.yellow, origin: [0, 0.5] });
    this.ui.add(this.coinText);
    // dark area below the street
    this.ui.add(this.add.rectangle(0, tabsY - 12, W, H - tabsY + 12, 0x181425).setOrigin(0, 0));
    segmented(this, 4, tabsY, W - 8, 18, TABS.map((t) => t.name), TABS.findIndex((t) => t.slot === this.tab), (i) => {
      this.tab = TABS[i].slot;
      this.selected = null;
      G.ime.deactivate();
      this.build();
    }, { size: 'xs' }).forEach((b) => this.ui.add(b));
    // grid
    const cw = Math.floor((W - 8) / cols);
    cells.forEach((cell, i) => this.cell(cell, 4 + (i % cols) * cw, gridTop + Math.floor(i / cols) * cellH, cw - 2, cellH - 2));
    // bottom: info / typing
    const by = gridTop + gridH + 4;
    this.info = txt(this, W / 2, by + 2, '', { size: 's', color: C.light, origin: [0.5, 0], align: 'center', wrap: W - 16 });
    this.ui.add(this.info);
    this.buyBtn = undefined;
    if (typing) {
      this.boxRect = [6, by + 14, W - 12, boxH];
      this.box.setPosition(6, by + 14, W - 12);
      this.box.root.setVisible(true);
      if (this.selected!.state === 'buy' && this.tab !== 'hat') G.ime.setTapArea(cssRect(this, ...this.boxRect));
    } else {
      this.box.root.setVisible(false);
      G.ime.setTapArea(null);
    }
    this.updateInfo();
    // footer
    this.ui.add(this.add.rectangle(0, H - footer, W, footer, 0x262b44).setOrigin(0, 0));
    this.ui.add(iconButton(this, 16, H - footer / 2, 'back', () => this.onBack()));
    this.ui.add(txt(this, 32, H - footer / 2, hat ? 'Čepičky pro 나비.' : 'Barvu objednáš korejsky.', { size: 'xs', color: C.grey, origin: [0, 0.5] }));
  }

  private cells(): Cell[] {
    const c = G.data.cosmetics;
    const coins = G.data.coins;
    if (this.tab === 'hat') {
      return [
        { id: null, name: 'Bez čepice', price: 0, state: c.hat ? 'owned' : 'equipped' },
        ...HATS.map((h) => ({ id: h.id, name: h.name, price: h.price, state: itemState(c, 'hat', h.id, h.price, coins, true) })),
      ];
    }
    const part = PARTS.find((p) => p.id === this.tab)!;
    return [
      { id: null, name: 'Původní', price: 0, state: c[this.tab] ? 'owned' : 'equipped' },
      ...COLORS.map((col) => ({
        id: col.id, name: col.cs, price: part.price,
        state: itemState(c, this.tab, col.id, part.price, coins, seenAnywhere(G.data, col.word)),
      })),
    ];
  }

  private cell(cell: Cell, x: number, y: number, w: number, h: number) {
    const sel = this.selected?.id === cell.id && !!this.selected;
    const locked = cell.state === 'locked';
    const bg = this.add.rectangle(x, y, w, h, sel ? 0x3a4466 : 0x262b44).setOrigin(0, 0).setStrokeStyle(1, cell.state === 'equipped' ? 0xfee761 : sel ? 0xf77622 : 0x3a4466);
    this.ui.add(bg);
    const cx = x + Math.round(w / 2);
    let icon: Phaser.GameObjects.Image;
    if (this.tab === 'hat') {
      const idx = HATS.findIndex((hh) => hh.id === cell.id);
      icon = idx >= 0 ? this.add.image(cx, y + 13, 'hats', idx).setScale(2) : this.add.image(cx, y + 13, 'uiicons', iconFrame('close')).setAlpha(0.6);
    } else if (cell.id) {
      icon = this.add.image(cx, y + 14, ...iconTex(word(COLORS.find((c) => c.id === cell.id)!.word).icon));
    } else {
      icon = this.add.image(cx, y + 14, ...iconTex('saek'));
    }
    if (locked) icon.setTintFill(0x3a4466);
    this.ui.add(icon);
    this.ui.add(txt(this, cx, y + h - 11, locked ? cell.name : cell.name, { size: 'xs', color: locked ? C.grey : C.cream, origin: [0.5, 0] }).setCrop(0, 0, w, 10));
    // badge
    let badge: Phaser.GameObjects.GameObject | null = null;
    if (cell.state === 'equipped') badge = this.add.image(x + w - 7, y + 7, 'uiicons', iconFrame('check'));
    else if (locked) badge = this.add.image(x + w - 7, y + 7, 'uiicons', iconFrame('lock'));
    else if (cell.state === 'buy' || cell.state === 'poor') {
      badge = txt(this, x + w - 2, y + 2, String(cell.price), { size: 'xs', color: cell.state === 'buy' ? C.yellow : C.pink, origin: [1, 0], shadow: true });
    }
    if (badge) this.ui.add(badge);
    bg.setInteractive({ useHandCursor: true });
    bg.on('pointerup', () => this.tapCell(cell));
  }

  // ---------------------------------------------------------------- actions
  private tapCell(cell: Cell) {
    G.audio.play('click');
    if (cell.state === 'locked') {
      toast(this, 'Tuhle barvu ještě neznáš. Potkáš ji v 동대문 nebo v tréninku.', C.orange, this.scale.height - 60);
      return;
    }
    if (cell.state === 'equipped') return;
    if (cell.state === 'owned') { this.equip(cell, 0); return; }
    this.select(cell);
  }

  private select(cell: Cell | null) {
    this.selected = cell;
    this.typingDirty = false;
    if (cell && cell.state === 'buy' && this.tab !== 'hat') G.ime.activate();
    else G.ime.deactivate();
    this.build();
  }

  private updateInfo() {
    const s = this.selected;
    this.buyBtn?.destroy();
    if (!s) {
      this.info.setText(this.tab === 'hat' ? 'Vyber čepičku.' : 'Vyber barvu. Zamčené potkáš ve hře.').setColor(C.grey);
      snapText(this.info);
      return;
    }
    if (s.state === 'poor') {
      this.info.setText(`${s.name}: chybí ti ${s.price - G.data.coins} mincí.`).setColor(C.pink);
      snapText(this.info);
      this.box.root.setVisible(false);
      return;
    }
    if (this.tab === 'hat') {
      this.info.setText(`${s.name} za ${s.price} mincí?`).setColor(C.cream);
      snapText(this.info);
      this.box.root.setVisible(false);
      const [x, y, w] = this.boxRect[2] ? this.boxRect : [6, this.info.y + 14, this.scale.width - 12];
      this.buyBtn = button(this, x + w / 2, y + 16, 120, 22, `Koupit · ${s.price}`, () => this.equip(s, s.price), { icon: undefined });
      this.ui.add(this.buyBtn);
      return;
    }
    const col = COLORS.find((c) => c.id === s.id)!;
    const w = word(col.word);
    const lvl = hintLevel(G.stat(w.id).mastery);
    const ko = lvl === 'full' ? ` ${w.ko}` : lvl === 'partial' ? ` ${[...w.ko][0]}…` : '';
    this.info.setText(`${s.name} (${s.price}) – napiš korejsky:${ko}`).setColor(C.cream);
    snapText(this.info);
    this.box.setHint('Klepni sem a piš');
  }

  private onIme(text: string, composing: boolean) {
    const s = this.selected;
    if (!s || s.state !== 'buy' || this.tab === 'hat') return;
    this.box.set(text, composing);
    if (!text) return;
    if (/[a-zA-Z]/.test(text)) { this.box.setHint('Přepni klávesnici na korejštinu (한/영)', C.orange); G.ime.clear(); return; }
    const col = COLORS.find((c) => c.id === s.id)!;
    const w = word(col.word);
    const k = matchKind(text, w.ko);
    if (k === 'none') {
      if (!this.typingDirty) G.setStat(w.id, recordMistake(G.stat(w.id)));
      this.typingDirty = true;
      this.box.error();
      G.audio.play('error');
      this.time.delayedCall(500, () => G.ime.clear());
      return;
    }
    if (k === 'full') {
      G.setStat(w.id, recordServe(G.stat(w.id), { clean: !this.typingDirty, hinted: false, night: 0 }));
      this.box.success();
      this.equip(s, s.price);
    }
  }

  private equip(cell: Cell, price: number) {
    const c = G.data.cosmetics;
    const slot = this.tab;
    if (cell.id === null) unequip(c, slot);
    else {
      const left = buyAndEquip(c, slot, cell.id, price, G.data.coins, true);
      if (left === null) return;
      if (left < G.data.coins) floatText(this, this.scale.width - 30, 30, `−${G.data.coins - left}`, C.pink);
      G.data.coins = left;
    }
    G.save.save();
    G.ime.deactivate();
    const flash = price > 0 ? (slot === 'hat' ? `${cell.name} pro 나비!` : `${TABS.find((t) => t.slot === slot)!.name}: ${cell.name}!`) : '';
    if (!flash) G.audio.play('paper');
    this.time.delayedCall(price > 0 ? 250 : 0, () => this.scene.restart({ tab: slot, flash, from: this.from }));
  }

  update(_t: number, dt: number) { this.street.update(dt); }
}

