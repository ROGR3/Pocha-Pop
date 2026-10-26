import Phaser from 'phaser';
import { SFX_KEYS } from '../game/audio';

const SHEETS: [string, number, number][] = [
  ['icons', 24, 24], ['badges', 24, 24], ['badges_s', 10, 10], ['clothes', 24, 24], ['uiicons', 14, 14], ['particles', 8, 8],
  ['char_kim', 32, 40], ['char_haeun', 32, 40], ['char_critic', 32, 40], ['char_halmeoni', 32, 40],
  ['char_cust_a', 32, 40], ['char_cust_b', 32, 40], ['char_cust_c', 32, 40], ['char_cust_d', 32, 40],
  ['chef', 32, 40], ['char_kim_helper', 32, 40], ['nabi', 24, 16], ['nabi_fat', 24, 16], ['kitten_a', 12, 10], ['kitten_b', 12, 10], ['kitten_c', 12, 10],
  ['stall_back', 208, 120], ['stall_roof', 208, 29], ['stall_sign', 36, 13], ['stools', 16, 14], ['lanterns', 12, 18], ['awnings', 216, 12], ['hats', 14, 10], ['pot', 28, 36], ['lantern', 12, 18], ['radio', 18, 14], ['mug', 12, 14],
  ['speaker', 18, 14], ['track_s', 8, 8], ['track_m', 12, 12],
  ['coin', 10, 10], ['pdot', 7, 7], ['ui_runoff', 12, 6], ['star', 15, 14], ['star_s', 9, 9], ['faces', 11, 11], ['node', 16, 22], ['node_boss', 26, 34], ['logo', 128, 44],
  ['bg_eul_mid', 320, 240], ['bg_eul_near', 320, 40], ['bg_han_mid', 320, 240], ['bg_han_near', 320, 40],
];
/** Stage-2 backdrops (bg_<p>_far/_sky images, _mid/_near sheets with a 'loop' tag) and stall variants. */
export const NEW_BG = ['ddm', 'hgd', 'ysn', 'bsn', 'phm'];
for (const p of NEW_BG) SHEETS.push([`bg_${p}_mid`, 320, 240], [`bg_${p}_near`, 320, 40], [`stall_back_${p}`, 208, 120]);
const NEW_CHARS = ['imo', 'minsu', 'park', 'kang', 'yaksa', 'blogger', 'manager', 'trader', 'captain', 'cust_e', 'cust_f', 'cust_g', 'cust_h', 'cust_i', 'cust_j', 'cust_k', 'cust_l'].map((c) => `char_${c}`);
for (const c of NEW_CHARS) SHEETS.push([c, 32, 40]);

const IMAGES = ['counter', 'awning', 'stool', 'bubble', 'bubble_hi', 'bubble_tail', 'panel', 'paper', 'btn', 'btn_down', 'btn_wood', 'btn_wood_down', 'btn_off',
  'postcard_jeju', 'note', 'stamp', 'crown', 'qr_frame', 'bubble_p_orange', 'bubble_p_blue', 'bubble_p_green', 'ptag_orange', 'ptag_blue', 'ptag_green', 'bg_eul_far', 'bg_han_far', 'bg_eul_sky', 'bg_han_sky', 'appicon',
  ...NEW_BG.flatMap((p) => [`bg_${p}_far`, `bg_${p}_sky`])];

export const CHARS = ['char_kim', 'char_haeun', 'char_critic', 'char_halmeoni', 'char_cust_a', 'char_cust_b', 'char_cust_c', 'char_cust_d', ...NEW_CHARS];

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
    a('char_kim_helper', 'idle', 0, 1, 1.6); a('char_kim_helper', 'cook', 2, 5, 10); a('char_kim_helper', 'wave', 6, 7, 6);
    a('chef', 'idle', 0, 3, 4); a('chef', 'cook', 4, 9, 14, 0); a('chef', 'serve', 10, 13, 12, 0); a('chef', 'happy', 14, 17, 8, 1);
    for (const n of ['nabi', 'nabi_fat']) { a(n, 'walk', 0, 3, 8); a(n, 'sit', 4, 7, 3); a(n, 'eat', 8, 9, 5); }
    for (const k of ['kitten_a', 'kitten_b', 'kitten_c']) { a(k, 'idle', 0, 1, 2); a(k, 'hop', 2, 3, 6, 0); }
    for (let c = 0; c < 12; c++) a('lanterns', `blink:${c}`, c * 4, c * 4 + 3, 4);
    a('stall_back', 'glow', 0, 3, 4); a('pot', 'boil', 0, 5, 9); a('lantern', 'blink', 0, 3, 4); a('radio', 'play', 0, 1, 3); a('mug', 'steam', 0, 2, 4);
    a('speaker', 'talk', 1, 3, 7);
    a('coin', 'spin', 0, 5, 14); a('star', 'ding', 2, 5, 14, 0); a('node', 'lit', 0, 1, 3); a('node_boss', 'lit', 1, 2, 3);
    this.anims.create({ key: 'logo:shine', frames: [0, 1, 2, 3].map((f) => ({ key: 'logo', frame: f, duration: f === 3 ? 1800 : 110 })), repeat: -1 });
    for (const p of NEW_BG) { a(`bg_${p}_mid`, 'loop', 0, 3, 3); a(`bg_${p}_near`, 'loop', 0, 3, 4); a(`stall_back_${p}`, 'glow', 0, 3, 4); }
    a('bg_eul_mid', 'neon', 0, 3, 3); a('bg_eul_near', 'shimmer', 0, 3, 5); a('bg_han_mid', 'lights', 0, 3, 3); a('bg_han_near', 'twinkle', 0, 3, 4);
    this.scene.start('Title');
  }
}
