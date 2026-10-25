// Achievements screen: every badge, locked ones as dark silhouettes. Tap for
// the description. Unlocked badges are also pinned on the stall's tarp.
import Phaser from 'phaser';
import { ACHIEVEMENTS } from '../logic/achievements';
import { badgeFrame, checkAchievements } from '../game/achievements';
import { G } from '../game/state';
import { C, fadeIn, goto, iconButton, panel, snapText, txt } from '../game/ui';

export class BadgesScene extends Phaser.Scene {
  private list!: Phaser.GameObjects.Container;
  private scrollY = 0;
  private maxScroll = 0;
  private info!: Phaser.GameObjects.Text;
  private moved = 0;
  constructor() { super('Badges'); }

  create() {
    fadeIn(this);
    G.ime.deactivate();
    checkAchievements(this);
    const W = this.scale.width, H = this.scale.height;
    this.add.rectangle(0, 0, W, H, 0x262b44).setOrigin(0, 0);
    const got = new Set(G.data.achievements);
    this.add.rectangle(0, 0, W, 26, 0x181425).setOrigin(0, 0).setDepth(10);
    txt(this, 8, 13, 'Odznáčky', { size: 'l', color: C.yellow, origin: [0, 0.5] }).setDepth(10);
    txt(this, W - 8, 13, `${ACHIEVEMENTS.filter((a) => got.has(a.id)).length}/${ACHIEVEMENTS.length}`, { size: 's', color: C.cream, origin: [1, 0.5] }).setDepth(10);

    const top = 30, footer = 52;
    const viewH = H - top - footer;
    const cols = W >= 260 ? 4 : 3;
    const cw = Math.floor((W - 8) / cols), ch = 52;
    this.list = this.add.container(4, top);
    ACHIEVEMENTS.forEach((a, i) => {
      const x = (i % cols) * cw, y = Math.floor(i / cols) * ch;
      const have = got.has(a.id);
      const bg = this.add.rectangle(x, y, cw - 3, ch - 3, have ? 0x3a4466 : 0x181425).setOrigin(0, 0).setStrokeStyle(1, have ? 0xfeae34 : 0x3a4466);
      const img = this.add.image(x + cw / 2 - 1, y + 17, 'badges', badgeFrame(a.id));
      if (!have) img.setTintFill(0x3a4466);
      const name = txt(this, x + cw / 2 - 1, y + 32, have ? a.name : '???', { size: 'xs', color: have ? C.cream : C.grey, origin: [0.5, 0], align: 'center', wrap: cw - 6 });
      name.setCrop(0, 0, cw, 18);
      this.list.add([bg, img, name]);
      bg.setInteractive({ useHandCursor: true }).on('pointerup', () => {
        if (this.moved > 6) return;
        G.audio.play('click');
        this.info.setText(`${have ? a.name : 'Zamčeno'}: ${a.desc}`).setColor(have ? C.cream : C.light);
        snapText(this.info);
        this.tweens.add({ targets: img, scale: { from: 1.5, to: 1 }, duration: 250, ease: 'Back.easeOut' });
      });
    });
    this.maxScroll = Math.max(0, Math.ceil(ACHIEVEMENTS.length / cols) * ch - viewH + 4);
    this.list.setMask(this.make.graphics({}, false).fillRect(0, top, W, viewH).createGeometryMask());

    let start = 0, startScroll = 0, dragging = false;
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => { dragging = true; this.moved = 0; start = p.y; startScroll = this.scrollY; });
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => { if (!dragging || !p.isDown) return; this.moved = Math.max(this.moved, Math.abs(p.y - start)); this.setScroll(startScroll - (p.y - start)); });
    this.input.on('pointerup', () => { dragging = false; });
    this.input.on('wheel', (_p: unknown, _o: unknown, _dx: number, dy: number) => this.setScroll(this.scrollY + dy * 0.5));

    panel(this, 2, H - footer, W - 4, footer - 2).setDepth(10);
    this.info = txt(this, 34, H - footer + 8, 'Klepni na odznáček. Získané máš připnuté na plachtě stánku.', { size: 'xs', color: C.light, wrap: W - 44 }).setDepth(11);
    iconButton(this, 16, H - footer / 2, 'back', () => goto(this, 'Map')).setDepth(11);
    this.game.events.on('layout', this.relayout, this);
    this.events.once('shutdown', () => this.game.events.off('layout', this.relayout, this));
  }

  private relayout() { this.scene.restart(); }

  onBack() { goto(this, 'Map'); }

  private setScroll(v: number) {
    this.scrollY = Phaser.Math.Clamp(v, 0, this.maxScroll);
    this.list.y = 30 - Math.round(this.scrollY);
  }
}
