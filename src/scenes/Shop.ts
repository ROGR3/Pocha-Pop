// Upgrades shop with a live preview of the stall.
import Phaser from 'phaser';
import { UPGRADES } from '../data/levels';
import { checkAchievements } from '../game/achievements';
import { G, iconTex, word } from '../game/state';
import { playedAnywhere } from '../logic/track';
import { DEPTH, Street } from '../game/street';
import { C, button, iconFrame, fadeIn, goto, iconButton, panel, toast, txt } from '../game/ui';

export class ShopScene extends Phaser.Scene {
  private street!: Street;
  private bought = '';
  constructor() { super('Shop'); }

  init(d: { bought?: string }) { this.bought = d?.bought ?? ''; }

  create() {
    fadeIn(this, this.bought ? 120 : 260);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    const rowH = 36;
    const listH = UPGRADES.length * rowH + 6;
    const footer = 34;
    const gy = Math.max(Math.min(150, H - footer - 3 * rowH - 4), H - footer - listH - 2);
    this.street = new Street(this, { backdrop: 'euljiro', weather: false });
    this.street.layout(gy);
    G.audio.setAmbient('rain');
    G.audio.setLofi(G.hasUpgrade('radio'), G.station());
    // HUD
    this.add.rectangle(0, 0, W, 24, 0x181425, 0.9).setOrigin(0, 0).setDepth(DEPTH.hud);
    txt(this, 8, 12, 'Obchod', { size: 'l', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    this.add.sprite(W - 50, 12, 'coin').play('coin:spin').setDepth(DEPTH.hud);
    txt(this, W - 42, 12, String(G.data.coins), { size: 'm', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);

    const ly = gy + 2;
    this.add.rectangle(0, ly - 2, W, H - ly + 2, 0x181425).setOrigin(0, 0).setDepth(DEPTH.hud - 2);
    const before = this.children.list.length;
    UPGRADES.forEach((u, i) => {
      const y = i * rowH;
      const owned = G.hasUpgrade(u.id);
      const locked = (!!u.story && G.chapter(u.story) < 3) || (!!u.after && !playedAnywhere(G.data, u.after));
      panel(this, 4, y, W - 8, rowH - 2).setDepth(DEPTH.hud - 1);
      // icon
      const ix = 20, iy = y + rowH / 2 - 1;
      let icon: Phaser.GameObjects.GameObject;
      if (u.id === 'lanterns') icon = this.add.sprite(ix, iy, 'lantern').play('lantern:blink');
      else if (u.id === 'awning') icon = this.add.image(ix, iy, 'awning').setCrop(0, 0, 22, 12).setOrigin(0.05, 0.5);
      else if (u.id === 'radio') icon = this.add.sprite(ix, iy, 'radio').play('radio:play');
      else if (u.id === 'helper') icon = this.add.image(ix, iy + 3, 'char_kim_helper', 6).setCrop(4, 2, 24, 22);
      else icon = this.add.image(ix, iy, ...iconTex(word(u.words![0]).icon));
      (icon as any).setDepth(DEPTH.hud);
      txt(this, 36, y + 3, u.name, { size: 's', color: owned ? C.green : C.white }).setDepth(DEPTH.hud);
      txt(this, 36, y + 14, locked ? (u.story ? 'Odemkne se v příběhu 김 대리.' : 'Odemkne se v další čtvrti.') : u.desc, { size: 'xs', color: C.light, wrap: W - 100, lineSpacing: 0 }).setCrop(0, 0, W, 21).setDepth(DEPTH.hud);
      if (owned) {
        this.add.image(W - 46, iy, 'uiicons', iconFrame('check')).setDepth(DEPTH.hud);
        txt(this, W - 38, iy, 'máš', { size: 's', color: C.green, origin: [0, 0.5] }).setDepth(DEPTH.hud);
      }
      else if (locked) {
        this.add.image(W - 34, iy, 'uiicons', iconFrame('lock')).setDepth(DEPTH.hud);
      }
      else {
        const can = G.data.coins >= u.price;
        button(this, W - 34, iy, 52, 18, `${u.price}`, () => this.buy(u.id), { size: 's', style: can ? 'red' : 'off', icon: undefined }).setDepth(DEPTH.hud).setEnabled(can);
      }
      if (u.id === this.bought) {
        const fl = this.add.rectangle(4, y, W - 8, rowH - 2, 0xfee761, 0.6).setOrigin(0, 0).setDepth(DEPTH.hud + 1);
        this.tweens.add({ targets: fl, alpha: 0, duration: 700, onComplete: () => fl.destroy() });
      }
    });
    // the rows scroll when they don't fit (drag / wheel)
    const rows = this.children.list.slice(before);
    const list = this.add.container(0, ly, rows).setDepth(DEPTH.hud - 1);
    const viewH = H - footer - ly;
    const maxScroll = Math.max(0, listH - viewH);
    list.setMask(this.make.graphics({}, false).fillRect(0, ly, W, viewH).createGeometryMask());
    let start = 0, startScroll = 0, scroll = 0, dragging = false;
    const more = txt(this, W - 12, H - footer - 4, '▼', { size: 's', color: C.yellow, origin: [0.5, 1], shadow: true }).setDepth(DEPTH.hud + 2).setVisible(maxScroll > 0);
    this.tweens.add({ targets: more, y: more.y + 2, yoyo: true, repeat: -1, duration: 400 });
    const setScroll = (v: number) => { scroll = Phaser.Math.Clamp(v, 0, maxScroll); list.y = ly - Math.round(scroll); more.setVisible(scroll < maxScroll - 2); };
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { dragging = true; this.moved = 0; start = p.y; startScroll = scroll; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (!dragging || !p.isDown || !maxScroll) return; this.moved = Math.max(this.moved, Math.abs(p.y - start)); setScroll(startScroll - (p.y - start)); });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => setScroll(scroll + dy * 0.5));
    iconButton(this, 16, H - footer / 2, 'back', () => goto(this, 'Map')).setDepth(DEPTH.hud);
    txt(this, 32, H - footer / 2, 'Upgrady jsou vidět u stánku.', { size: 'xs', color: C.grey, origin: [0, 0.5], wrap: W - 130 }).setDepth(DEPTH.hud);
    button(this, W - 50, H - footer / 2, 88, 20, 'Barvírna', () => goto(this, 'Paint', { from: 'Shop' }), { icon: 'paint', style: 'wood', size: 's' }).setDepth(DEPTH.hud);
    if (this.bought) {
      toast(this, 'Koupeno!', C.green, gy - 90);
      this.street.flash(3);
      this.time.delayedCall(900, () => checkAchievements(this));
    }
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart(); }

  onBack() { goto(this, 'Map'); }

  private moved = 0;

  private buy(id: string) {
    if (this.moved > 6) return;
    const u = UPGRADES.find((x) => x.id === id)!;
    if (G.data.coins < u.price || G.hasUpgrade(id)) return;
    if (u.story && G.chapter(u.story) < 3) return;
    if (u.after && !playedAnywhere(G.data, u.after)) return;
    G.data.coins -= u.price;
    G.data.upgrades.push(id);
    G.save.save();
    G.audio.play('buy');
    this.scene.restart({ bought: id });
  }

  update(_t: number, dt: number) { this.street.update(dt); }
}
