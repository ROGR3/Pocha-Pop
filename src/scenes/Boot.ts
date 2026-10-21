import Phaser from 'phaser';
import { SFX_KEYS } from '../game/audio';

const SHEETS: [string, number, number][] = [
  ['icons', 24, 24], ['uiicons', 14, 14], ['particles', 8, 8],
  ['char_kim', 32, 40], ['char_haeun', 32, 40], ['char_critic', 32, 40], ['char_halmeoni', 32, 40],
  ['char_cust_a', 32, 40], ['char_cust_b', 32, 40], ['char_cust_c', 32, 40], ['char_cust_d', 32, 40],
  ['chef', 32, 40], ['nabi', 24, 16], ['nabi_fat', 24, 16], ['kitten_a', 12, 10], ['kitten_b', 12, 10], ['kitten_c', 12, 10],
  ['stall_back', 208, 120], ['pot', 28, 36], ['lantern', 12, 18], ['radio', 18, 14],
  ['coin', 10, 10], ['star', 15, 14], ['star_s', 9, 9], ['faces', 11, 11], ['node', 16, 22], ['node_boss', 26, 34], ['logo', 128, 44],
  ['bg_eul_mid', 320, 240], ['bg_eul_near', 320, 40], ['bg_han_mid', 320, 240], ['bg_han_near', 320, 40],
];
const IMAGES = ['counter', 'awning', 'stool', 'bubble', 'bubble_hi', 'bubble_tail', 'panel', 'paper', 'btn', 'btn_down', 'btn_wood', 'btn_wood_down', 'btn_off',
  'postcard_jeju', 'stamp', 'bg_eul_far', 'bg_han_far', 'bg_eul_sky', 'bg_han_sky', 'appicon'];

export const CHARS = ['char_kim', 'char_haeun', 'char_critic', 'char_halmeoni', 'char_cust_a', 'char_cust_b', 'char_cust_c', 'char_cust_d'];

export class BootScene extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const W = this.scale.width, H = this.scale.height;
    const bar = this.add.rectangle(W / 2 - 50, H / 2, 0, 4, 0xf77622).setOrigin(0, 0.5);
    this.add.rectangle(W / 2, H / 2, 102, 6).setStrokeStyle(1, 0x5a6988);
    this.load.on('progress', (p: number) => { bar.width = 100 * p; });
    for (const [k, w, h] of SHEETS) this.load.spritesheet(k, `assets/${k}.png`, { frameWidth: w, frameHeight: h });
    for (const k of IMAGES) this.load.image(k, `assets/${k}.png`);
    for (const k of SFX_KEYS) this.load.audio(k, `sfx/${k}.wav`);
  }

  create() {
    const a = (key: string, name: string, from: number, to: number, fps: number, repeat = -1) => {
      this.anims.create({ key: `${key}:${name}`, frames: this.anims.generateFrameNumbers(key, { start: from, end: to }), frameRate: fps, repeat });
    };
    for (const c of CHARS) {
      a(c, 'idle', 0, 1, 1.6); a(c, 'neutral', 2, 2, 1); a(c, 'angry', 3, 4, 6);
      a(c, 'happy', 5, 6, 5); a(c, 'eat', 7, 8, 5); a(c, 'walk', 9, 12, 8);
    }
    a('chef', 'idle', 0, 3, 4); a('chef', 'cook', 4, 9, 14, 0); a('chef', 'serve', 10, 13, 12, 0); a('chef', 'happy', 14, 17, 8, 1);
    for (const n of ['nabi', 'nabi_fat']) { a(n, 'walk', 0, 3, 8); a(n, 'sit', 4, 7, 3); a(n, 'eat', 8, 9, 5); }
    for (const k of ['kitten_a', 'kitten_b', 'kitten_c']) { a(k, 'idle', 0, 1, 2); a(k, 'hop', 2, 3, 6, 0); }
    a('stall_back', 'glow', 0, 3, 4); a('pot', 'boil', 0, 5, 9); a('lantern', 'blink', 0, 3, 4); a('radio', 'play', 0, 1, 3);
    a('coin', 'spin', 0, 5, 14); a('star', 'ding', 2, 5, 14, 0); a('node', 'lit', 0, 1, 3); a('node_boss', 'lit', 1, 2, 3);
    this.anims.create({ key: 'logo:shine', frames: [0, 1, 2, 3].map((f) => ({ key: 'logo', frame: f, duration: f === 3 ? 1800 : 110 })), repeat: -1 });
    a('bg_eul_mid', 'neon', 0, 3, 3); a('bg_eul_near', 'shimmer', 0, 3, 5); a('bg_han_mid', 'lights', 0, 3, 3); a('bg_han_near', 'twinkle', 0, 3, 4);
    this.scene.start('Title');
  }
}
