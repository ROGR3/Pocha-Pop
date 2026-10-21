import Phaser from 'phaser';
import { G } from '../game/state';
import { Street, DEPTH } from '../game/street';
import { button, fadeIn, goto, txt, C } from '../game/ui';

export class TitleScene extends Phaser.Scene {
  private street!: Street;
  constructor() { super('Title'); }

  create() {
    fadeIn(this, 500);
    G.ime.deactivate();
    const W = this.scale.width, H = this.scale.height;
    this.street = new Street(this, { backdrop: 'euljiro' });
    const groundY = Math.max(260, H - Math.max(70, Math.round(H * 0.16)));
    this.street.layout(groundY);
    G.audio.setAmbient('rain');
    G.audio.setLofi(G.hasUpgrade('radio'));
    // a sleepy regular and the cat keep the stall company
    const kim = this.add.sprite(this.street.wx(this.street.seatX[1]), this.street.wy(-28), 'char_kim').setOrigin(0.5, 1).setDepth(DEPTH.customer).play('char_kim:idle');
    const cat = this.add.sprite(this.street.wx(this.street.seatX[2]), this.street.wy(-41), G.data.friends.nabi?.chapter >= 2 ? 'nabi_fat' : 'nabi').setOrigin(0.5, 1).setDepth(DEPTH.customer + 1);
    cat.play(`${cat.texture.key}:sit`);
    void kim;
    // logo
    const big = W >= 262 && groundY > 300;
    const logoY = Math.max(big ? 52 : 34, Math.round((groundY - 170) / 2) + 10);
    const logo = this.add.sprite(Math.round(W / 2), logoY, 'logo').setDepth(DEPTH.hud).play('logo:shine');
    if (big) logo.setScale(2);
    this.tweens.add({ targets: logo, y: logoY + 3, yoyo: true, repeat: -1, duration: 1600, ease: 'Sine.easeInOut' });
    const sub = txt(this, W / 2, logoY + (big ? 52 : 28), 'noční stánek · korejské psaní', { size: 's', color: C.cream, origin: [0.5, 0.5], shadow: true }).setDepth(DEPTH.hud);
    void sub;
    // bottom area
    const by = Math.round(groundY + (H - groundY) / 2) - 4;
    this.add.rectangle(0, groundY + 10, W, H - groundY, 0x181425, 0.7).setOrigin(0, 0).setDepth(DEPTH.hud - 1);
    const start = button(this, W / 2, by, 140, 24, 'Otevřít stánek', () => this.open()).setDepth(DEPTH.hud);
    this.tweens.add({ targets: start, scale: { from: 1, to: 1.05 }, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
    button(this, W - 16, by, 20, 20, '', () => goto(this, 'Settings', { from: 'Title' }), { icon: 'gear', style: 'wood' }).setDepth(DEPTH.hud);
    txt(this, 4, H - 3, 'v0.1 · vertical slice', { size: 'xs', color: C.grey, origin: [0, 1] }).setDepth(DEPTH.hud);
    this.input.keyboard?.on('keydown-ENTER', () => this.open());
    this.game.events.on('layout', this.onLayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.onLayout, this));
  }

  private onLayout() { this.scene.restart(); }

  private open() {
    G.audio.play('bell');
    if (!G.data.settings.firstRunDone) goto(this, 'Setup', { next: 'Story' });
    else goto(this, 'Map');
  }

  update(_t: number, dt: number) { this.street.update(dt); }
}
