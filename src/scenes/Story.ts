// Cut-scenes: prologue with 할머니 and the ending cliffhanger.
import Phaser from 'phaser';
import { CLIFFHANGER, FINALE, PROLOGUE, type Line } from '../data/story';
import { playDialogue } from '../game/dialogue';
import { G } from '../game/state';
import { attachHat } from '../game/hats';
import { DEPTH, Street } from '../game/street';
import { fadeIn, goto, txt, C } from '../game/ui';

export class StoryScene extends Phaser.Scene {
  private street!: Street;
  private kind: 'prologue' | 'ending' | 'finale' = 'prologue';
  constructor() { super('Story'); }

  init(d: { kind?: 'prologue' | 'ending' | 'finale' }) { this.kind = d?.kind ?? 'prologue'; }

  create() {
    fadeIn(this, 600);
    const H = this.scale.height;
    const finale = this.kind === 'finale';
    const ending = this.kind === 'ending' || finale;
    this.street = new Street(this, { backdrop: finale ? 'euljiro' : ending ? 'hangang' : 'euljiro', rain: !finale, festive: finale });
    const gy = Math.max(230, H - 100);
    this.street.layout(gy);
    G.audio.setAmbient(ending && !finale ? 'river' : 'rain');
    if (!ending) {
      // grandma stands behind the counter, the chef (you) walks in
      this.street.chef.setVisible(false);
      const h = this.add.sprite(this.street.wx(-84), this.street.wy(-40), 'char_halmeoni').setOrigin(0.5, 1).setDepth(DEPTH.chef).play('char_halmeoni:idle');
      const you = this.add.sprite(this.street.wx(140), this.street.wy(-28), 'chef').setOrigin(0.5, 1).setDepth(DEPTH.customer).play('chef:idle');
      this.tweens.add({ targets: you, x: this.street.wx(20), duration: 1800, ease: 'Sine.easeOut' });
      void h;
    } else {
      if (finale) {
        // grandma back behind the counter next to you, the whole cast in front
        this.add.sprite(this.street.wx(-108), this.street.wy(-40), 'char_halmeoni').setOrigin(0.5, 1).setDepth(DEPTH.chef - 1).play('char_halmeoni:happy');
        ['char_imo', 'char_minsu', 'char_park', 'char_kang'].forEach((k, i) => this.add.sprite(this.street.wx(-30 + i * 34), this.street.wy(2), k).setOrigin(0.5, 1).setDepth(DEPTH.stool + 2).play(`${k}:happy`));
      }
      ['char_kim', 'char_haeun'].forEach((k, i) => this.add.sprite(this.street.wx(this.street.seatX[i]), this.street.wy(-40), k).setOrigin(0.5, 1).setDepth(DEPTH.customer).play(`${k}:happy`));
      const cat = G.track().friends.nabi?.chapter >= 2 ? 'nabi_fat' : 'nabi';
      attachHat(this, this.add.sprite(this.street.wx(this.street.seatX[2]), this.street.wy(-41), cat).setOrigin(0.5, 1).setDepth(DEPTH.customer).play(`${cat}:sit`));
    }
    const W = this.scale.width;
    txt(this, W / 2, 14, finale ? 'Finále' : ending ? 'Epilog' : 'Prolog', { size: 'l', color: C.yellow, origin: [0.5, 0], shadow: true }).setDepth(DEPTH.hud);
    const lines: Line[] = finale ? FINALE : ending ? CLIFFHANGER : PROLOGUE;
    this.time.delayedCall(ending ? 600 : 1900, async () => {
      await playDialogue(this, lines);
      if (ending) {
        txt(this, W / 2, 60, finale ? 'Ulička zachráněna!\nDíky za hraní ♥' : 'Pokračování: trh 동대문 →', { size: 'm', color: C.cream, origin: [0.5, 0], align: 'center', shadow: true }).setDepth(DEPTH.hud);
        this.time.delayedCall(2200, () => goto(this, 'Map', {}, 600));
      } else {
        G.night = 1;
        goto(this, 'Night', { night: 1 }, 500);
      }
    });
  }

  onBack() {
    if (this.kind !== 'prologue') goto(this, 'Map');
    else { G.night = 1; goto(this, 'Night', { night: 1 }); }
  }

  update(_t: number, dt: number) { this.street.update(dt); }
}
