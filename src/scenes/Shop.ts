// Upgrades shop with a live preview of the stall.
import Phaser from 'phaser';
import { UPGRADES } from '../data/levels';
import { G, iconIdx, word } from '../game/state';
import { DEPTH, Street } from '../game/street';
import { C, button, fadeIn, goto, iconButton, panel, toast, txt } from '../game/ui';

export class ShopScene extends Phaser.Scene {
  private street!: Street;
  private bought = '';
  constructor() { super('Shop'); }

  init(d: { bought?: string }) { this.bought = d?.bought ?? ''; }

  create() {
    fadeIn(this, this.bought ? 120 : 260);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    const rowH = 30;
    const listH = UPGRADES.length * rowH + 6;
    const footer = 34;
    const gy = Math.max(150, H - footer - listH - 2);
    this.street = new Street(this, { backdrop: 'euljiro', weather: false });
    this.street.layout(gy);
    G.audio.setAmbient('rain');
    G.audio.setLofi(G.hasUpgrade('radio'));
    // HUD
    this.add.rectangle(0, 0, W, 24, 0x181425, 0.9).setOrigin(0, 0).setDepth(DEPTH.hud);
    txt(this, 8, 12, 'Obchod', { size: 'l', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    this.add.sprite(W - 50, 12, 'coin').play('coin:spin').setDepth(DEPTH.hud);
    txt(this, W - 42, 12, String(G.data.coins), { size: 'm', color: C.yellow, origin: [0, 0.5] }).setDepth(DEPTH.hud);

    const ly = gy + 2;
    this.add.rectangle(0, ly - 2, W, H - ly + 2, 0x181425).setOrigin(0, 0).setDepth(DEPTH.hud - 2);
    UPGRADES.forEach((u, i) => {
      const y = ly + i * rowH;
      const owned = G.hasUpgrade(u.id);
      panel(this, 4, y, W - 8, rowH - 2).setDepth(DEPTH.hud - 1);
      // icon
      const ix = 20, iy = y + rowH / 2 - 1;
      let icon: Phaser.GameObjects.GameObject;
      if (u.id === 'lanterns') icon = this.add.sprite(ix, iy, 'lantern').play('lantern:blink');
      else if (u.id === 'awning') icon = this.add.image(ix, iy, 'awning').setCrop(0, 0, 22, 12).setOrigin(0.05, 0.5);
      else if (u.id === 'radio') icon = this.add.sprite(ix, iy, 'radio').play('radio:play');
      else if (u.id === 'stool4') icon = this.add.image(ix, iy, 'stool');
      else icon = this.add.image(ix, iy, 'icons', iconIdx(word(u.words![0]).icon));
      (icon as any).setDepth(DEPTH.hud);
      txt(this, 36, y + 4, u.name, { size: 's', color: owned ? C.green : C.white }).setDepth(DEPTH.hud);
      txt(this, 36, y + 15, u.desc, { size: 'xs', color: C.light, wrap: W - 110 }).setDepth(DEPTH.hud);
      if (owned) {
        this.add.image(W - 46, iy, 'uiicons', 12).setDepth(DEPTH.hud);
        txt(this, W - 38, iy, 'máš', { size: 's', color: C.green, origin: [0, 0.5] }).setDepth(DEPTH.hud);
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
    iconButton(this, 16, H - footer / 2, 'back', () => goto(this, 'Map')).setDepth(DEPTH.hud);
    txt(this, 32, H - footer / 2, 'Upgrady jsou vidět u stánku.', { size: 'xs', color: C.grey, origin: [0, 0.5] }).setDepth(DEPTH.hud);
    if (this.bought) {
      toast(this, 'Koupeno!', C.green, gy - 90);
      this.street.flash(3);
    }
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart(); }

  private buy(id: string) {
    const u = UPGRADES.find((x) => x.id === id)!;
    if (G.data.coins < u.price || G.hasUpgrade(id)) return;
    G.data.coins -= u.price;
    G.data.upgrades.push(id);
    G.save.save();
    G.audio.play('buy');
    this.scene.restart({ bought: id });
  }

  update(_t: number, dt: number) { this.street.update(dt); }
}
