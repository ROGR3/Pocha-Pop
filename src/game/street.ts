// The street scene shared by Title / Night / Shop: parallax background,
// the stall with its upgrades, chef, pot, rain or fireflies.
import Phaser from 'phaser';
import { G } from './state';

export type Backdrop = 'euljiro' | 'hangang';

export const DEPTH = { far: 0, mid: 1, rainBack: 2, near: 3, stall: 10, lantern: 11, customer: 20, chef: 21, counter: 30, pot: 31, stool: 32, dish: 33, awning: 35, bubble: 40, rain: 45, fx: 50, hud: 100, input: 110, overlay: 1000 };

/** Stool x offsets (from the stall centre) for 2–4 seats. */
const SEAT_X: Record<number, number[]> = { 2: [10, 62], 3: [-12, 32, 76], 4: [-22, 14, 50, 86] };

interface Placed { obj: Phaser.GameObjects.Components.Transform; dx: number; dy: number }

export interface StreetOpts {
  backdrop: Backdrop;
  upgrades?: string[];
  seats?: number;
  /** Show the chef & pot (title shows them too). */
  chef?: boolean;
  weather?: boolean;
}

export class Street {
  scene: Phaser.Scene;
  backdrop: Backdrop;
  cx = 0;
  gy = 0;
  private placed: Placed[] = [];
  far!: Phaser.GameObjects.Image;
  sky!: Phaser.GameObjects.Image;
  mid!: Phaser.GameObjects.Sprite;
  near!: Phaser.GameObjects.Sprite;
  stall!: Phaser.GameObjects.Sprite;
  counter!: Phaser.GameObjects.Image;
  pot!: Phaser.GameObjects.Sprite;
  chef!: Phaser.GameObjects.Sprite;
  /** 김 대리 in an apron (helper upgrade). */
  helper?: Phaser.GameObjects.Sprite;
  lanterns: Phaser.GameObjects.Sprite[] = [];
  radio?: Phaser.GameObjects.Sprite;
  awning?: Phaser.GameObjects.Image;
  stools: Phaser.GameObjects.Image[] = [];
  kittens: Phaser.GameObjects.Sprite[] = [];
  rain?: Phaser.GameObjects.Particles.ParticleEmitter;
  splash?: Phaser.GameObjects.Particles.ParticleEmitter;
  flies?: Phaser.GameObjects.Particles.ParticleEmitter;
  steam?: Phaser.GameObjects.Particles.ParticleEmitter;
  notes?: Phaser.GameObjects.Particles.ParticleEmitter;
  seatX: number[] = [];
  raining: boolean;
  private t = 0;

  constructor(scene: Phaser.Scene, o: StreetOpts) {
    this.scene = scene;
    this.backdrop = o.backdrop;
    this.raining = o.backdrop === 'euljiro' && o.weather !== false;
    const up = o.upgrades ?? G.data.upgrades;
    const s = scene;
    const pre = o.backdrop === 'euljiro' ? 'eul' : 'han';
    this.sky = s.add.image(0, 0, `bg_${pre}_sky`).setOrigin(0.5, 1).setDepth(DEPTH.far);
    this.far = s.add.image(0, 0, `bg_${pre}_far`).setOrigin(0.5, 1).setDepth(DEPTH.far);
    this.mid = s.add.sprite(0, 0, `bg_${pre}_mid`).setOrigin(0.5, 1).setDepth(DEPTH.mid).play(`bg_${pre}_mid:${pre === 'eul' ? 'neon' : 'lights'}`);
    this.near = s.add.sprite(0, 0, `bg_${pre}_near`).setOrigin(0.5, 0).setDepth(DEPTH.near).play(`bg_${pre}_near:${pre === 'eul' ? 'shimmer' : 'twinkle'}`);
    this.stall = s.add.sprite(0, 0, 'stall_back').setOrigin(0.5, 1).setDepth(DEPTH.stall).play('stall_back:glow');
    this.place(this.stall, 0, -6);
    this.counter = s.add.image(0, 0, 'counter').setOrigin(0.5, 0).setDepth(DEPTH.counter);
    this.place(this.counter, 0, -42);

    if (o.chef !== false) {
      this.chef = s.add.sprite(0, 0, 'chef').setOrigin(0.5, 1).setDepth(DEPTH.chef).play('chef:idle');
      this.place(this.chef, -84, -28);
      this.pot = s.add.sprite(0, 0, 'pot').setOrigin(0.5, 1).setDepth(DEPTH.pot).play('pot:boil');
      this.place(this.pot, -56, -39);
      if (up.includes('helper')) {
        this.helper = s.add.sprite(0, 0, 'char_kim_helper').setOrigin(0.5, 1).setDepth(DEPTH.chef - 0.5).play('char_kim_helper:idle');
        this.place(this.helper, -60, -47);
      }
    }
    if (up.includes('lanterns')) {
      [-78, -39, 0, 39, 78].forEach((x, i) => {
        const l = s.add.sprite(0, 0, 'lantern').setOrigin(0.5, 0).setDepth(DEPTH.lantern);
        l.play({ key: 'lantern:blink', startFrame: i % 4 });
        this.place(l, x, -100);
        this.lanterns.push(l);
        s.tweens.add({ targets: l, angle: { from: -4, to: 4 }, yoyo: true, repeat: -1, duration: 1400 + i * 170, ease: 'Sine.easeInOut' });
      });
    }
    if (up.includes('radio')) {
      this.radio = s.add.sprite(0, 0, 'radio').setOrigin(0.5, 1).setDepth(DEPTH.stall + 1).play('radio:play');
      this.place(this.radio, 66, -76);
    }
    if (up.includes('awning')) {
      this.awning = s.add.image(0, 0, 'awning').setOrigin(0.5, 0).setDepth(DEPTH.awning);
      this.place(this.awning, 0, -104);
    }
    const seats = o.seats ?? 3;
    this.seatX = SEAT_X[seats] ?? SEAT_X[3];
    this.seatX.forEach((x) => {
      const st = s.add.image(0, 0, 'stool').setOrigin(0.5, 1).setDepth(DEPTH.stool);
      this.place(st, x, 2);
      this.stools.push(st);
    });
    const nabi = G.data.friends.nabi;
    if (nabi && nabi.chapter >= 3) {
      ['kitten_a', 'kitten_b', 'kitten_c'].forEach((k, i) => {
        const kt = s.add.sprite(0, 0, k).setOrigin(0.5, 1).setDepth(DEPTH.stool + 1).play({ key: `${k}:idle`, startFrame: i % 2 });
        this.place(kt, 100 + i * 9 - (seats === 4 ? 0 : 0), 1 + (i % 2));
        this.kittens.push(kt);
        kt.setFlipX(i === 1);
      });
      s.time.addEvent({ delay: 2300, loop: true, callback: () => {
        const kt = Phaser.Utils.Array.GetRandom(this.kittens);
        kt.play(`${kt.texture.key}:hop`).once('animationcomplete', () => kt.play(`${kt.texture.key}:idle`));
      } });
    }
    // particles
    const P = (name: string) => particleFrame(name);
    if (o.chef !== false) {
      this.steam = s.add.particles(0, 0, 'particles', {
        frame: [P('puff'), P('puff2')], lifespan: 1400, speedY: { min: -16, max: -10 }, speedX: { min: -3, max: 3 },
        alpha: { start: 0.55, end: 0 }, scale: { start: 0.6, end: 1.2 }, frequency: 380, quantity: 1,
      }).setDepth(DEPTH.pot + 1);
    }
    if (this.radio) {
      this.notes = s.add.particles(0, 0, 'particles', {
        frame: P('note'), lifespan: 1800, speedY: { min: -12, max: -8 }, speedX: { min: -6, max: 6 }, alpha: { start: 1, end: 0 }, frequency: 900,
      }).setDepth(DEPTH.stall + 2);
    }
    if (this.raining && o.weather !== false) {
      const W = s.scale.width;
      this.rain = s.add.particles(0, 0, 'particles', {
        frame: P('drop'), x: { min: -40, max: W + 40 }, y: -10, lifespan: 1600, speedY: { min: 230, max: 280 }, speedX: -30,
        quantity: 2, frequency: 30, alpha: { start: 0.75, end: 0.5 },
      }).setDepth(this.awning ? DEPTH.rainBack : DEPTH.rain);
      this.splash = s.add.particles(0, 0, 'particles', {
        frame: P('splash'), lifespan: 220, quantity: 1, frequency: 90, alpha: { start: 0.8, end: 0 }, x: { min: 0, max: W }, y: 0,
      }).setDepth(DEPTH.near + 1);
    }
    if (o.backdrop === 'hangang' && o.weather !== false) {
      this.flies = s.add.particles(0, 0, 'particles', {
        frame: P('dot'), lifespan: 4000, speedX: { min: -5, max: 5 }, speedY: { min: -6, max: 2 }, tint: [0xfee761, 0xfeae34, 0x63c74d],
        x: { min: 0, max: s.scale.width }, y: { min: -150, max: -30 }, alpha: { start: 1, end: 0 }, frequency: 500, scale: 0.5,
      }).setDepth(DEPTH.rain);
    }
    this.layout();
  }

  place(obj: Phaser.GameObjects.Components.Transform, dx: number, dy: number) {
    this.placed.push({ obj, dx, dy });
  }

  /** World x/y of a point relative to the stall origin (centre, ground). */
  wx(dx: number) { return Math.round(this.cx + dx); }
  wy(dy: number) { return Math.round(this.gy + dy); }

  layout(groundY?: number) {
    const W = this.scene.scale.width;
    const H = this.scene.scale.height;
    this.cx = Math.round(W / 2);
    this.gy = Math.round(groundY ?? H - 46);
    this.near.setPosition(this.cx, this.gy - 16);
    this.mid.setPosition(this.cx, this.gy - 14);
    this.far.setPosition(this.cx, this.gy - 14);
    this.sky.setPosition(this.cx, this.gy - 14 - 240);
    for (const p of this.placed) { p.obj.x = this.cx + p.dx; p.obj.y = this.gy + p.dy; }
    if (this.steam) this.steam.setPosition(this.wx(-56), this.wy(-70));
    if (this.notes) this.notes.setPosition(this.wx(66), this.wy(-90));
    if (this.rain) {
      this.rain.setPosition(0, 0);
      this.rain.setParticleLifespan(Math.max(300, ((this.gy - 8) / 255) * 1000));
    }
    if (this.splash) this.splash.setPosition(0, this.gy - 12);
    if (this.flies) {
      this.flies.setPosition(0, this.gy);
    }
  }

  update(dt: number) {
    this.t += dt;
    // gentle parallax drift
    this.far.x = this.cx + Math.round(Math.sin(this.t / 5200) * 4);
    this.sky.x = this.cx + Math.round(Math.sin(this.t / 5200) * 6);
    this.mid.x = this.cx + Math.round(Math.sin(this.t / 5200) * 1.5);
  }

  /** Flash the lanterns / bulb for combos. */
  flash(power: number) {
    const s = this.scene;
    const targets = this.lanterns.length ? this.lanterns : [this.stall];
    for (const l of targets) {
      l.setTint(0xfee761);
      s.time.delayedCall(120 + power * 30, () => l.clearTint());
      if (l !== this.stall) s.tweens.add({ targets: l, scale: { from: 1.25, to: 1 }, duration: 260, ease: 'Back.easeOut' });
    }
    const sparks = s.add.particles(0, 0, 'particles', {
      frame: [particleFrame('spark'), particleFrame('pop2')], lifespan: 600, speed: { min: 30, max: 70 + power * 10 }, gravityY: 80,
      quantity: 4 + power * 2, emitting: false, alpha: { start: 1, end: 0 },
    }).setDepth(DEPTH.fx);
    for (const l of this.lanterns.length ? this.lanterns : []) sparks.explode(3 + power, l.x, l.y + 10);
    if (!this.lanterns.length) sparks.explode(6 + power * 2, this.wx(0), this.wy(-92));
    s.time.delayedCall(800, () => sparks.destroy());
  }
}

import particlesJson from '../../public/assets/particles.json';
export function particleFrame(name: string): number {
  return Math.max(0, particlesJson.names.indexOf(name));
}
