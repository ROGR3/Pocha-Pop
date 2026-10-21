// One night = one level. Customers order in bubbles, the player types the
// Korean with the system IME, matching orders are served.
import Phaser from 'phaser';
import { BOSS_NIGHT, CRITIC_ORDERS, CRITIC_PATIENCE, nightDef, nightPool, type NightDef, type RegularId } from '../data/levels';
import { CRITIC_INTRO } from '../data/story';
import { matchAgainst } from '../logic/hangul';
import { comboMultiplier, criticStars, nightStars, patienceMultiplier, serveCoins } from '../logic/rules';
import { recordMissed, recordMistake, recordServe, rng } from '../logic/srs';
import { Bubble } from '../game/bubble';
import { playDialogue } from '../game/dialogue';
import { makeOrder, tokenAt, type Kind, type Order } from '../game/orders';
import { G, iconIdx, word } from '../game/state';
import { DEPTH, Street, particleFrame } from '../game/street';
import { TypeBox } from '../game/typebox';
import { C, HEX, button, fadeIn, floatText, goto, iconButton, panel, snapText, toast, txt } from '../game/ui';

type CState = 'walk' | 'wait' | 'eat' | 'leave';

interface Customer {
  kind: Kind;
  key: string;
  sprite: Phaser.GameObjects.Sprite;
  seat: number;
  state: CState;
  patience: number;
  max: number;
  order: Order | null;
  bubble: Bubble | null;
  ordersLeft: number;
  /** First order of the whole game: patience paused until typed. */
  tutorial?: boolean;
}

export interface NightSummary {
  night: number;
  stars: number;
  total: number;
  served: number;
  angry: number;
  mistakes: number;
  coins: number;
  tips: number;
  bestCombo: number;
  newWords: string[];
  trouble: string[];
  critic?: { stars: number; mistakes: number; walkouts: number };
  regularsSeen: RegularId[];
  clean: Partial<Record<RegularId, number>>;
}

const GENERIC = ['char_cust_a', 'char_cust_b', 'char_cust_c', 'char_cust_d'];
const INPUT_H = 46;

export class NightScene extends Phaser.Scene {
  private n = 1;
  private def!: NightDef;
  private street!: Street;
  private box!: TypeBox;
  private customers: Customer[] = [];
  private seatsTaken: (Customer | null)[] = [];
  private queue: Kind[] = [];
  private nextArrival = 0;
  private clock = 0;
  private rand = Math.random;
  private pool: string[] = [];
  private newTonight = new Set<string>();
  private recent: string[] = [];
  private combo = 0;
  private bestCombo = 0;
  private coins = 0;
  private tips = 0;
  private served = 0;
  private angry = 0;
  private mistakes = 0;
  private arrived = 0;
  private paused = false;
  private ended = false;
  private intro = false;
  private inError = false;
  private errorTimer?: Phaser.Time.TimerEvent;
  private pendingServe?: Phaser.Time.TimerEvent;
  private seenBefore = new Set<string>();
  private trouble = new Map<string, number>();
  private regularsSeen: RegularId[] = [];
  private cleanServes: Partial<Record<RegularId, number>> = {};
  private critic = { mistakes: 0, walkouts: 0, done: false };
  private patMul = 1;
  private unsub?: () => void;
  // HUD
  private coinText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Sprite;
  private progress!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Container;
  private hintBtn!: Phaser.GameObjects.Container;
  private pauseLayer?: Phaser.GameObjects.Container;
  private tutorialText?: Phaser.GameObjects.Text;

  constructor() { super('Night'); }

  init(d: { night?: number }) {
    this.n = d?.night ?? G.night;
    G.night = this.n;
    this.def = nightDef(this.n);
    this.customers = [];
    this.queue = [];
    this.clock = 0;
    this.combo = this.bestCombo = this.coins = this.tips = this.served = this.angry = this.mistakes = this.arrived = 0;
    this.paused = this.ended = this.inError = false;
    this.recent = [];
    this.trouble = new Map();
    this.regularsSeen = [];
    this.cleanServes = {};
    this.critic = { mistakes: 0, walkouts: 0, done: false };
    this.rand = rng(Date.now() & 0xffffffff);
  }

  create() {
    fadeIn(this, 400);
    const boss = this.n === BOSS_NIGHT;
    const backdrop = this.def.district === 'euljiro' ? 'euljiro' : 'hangang';
    this.street = new Street(this, { backdrop, seats: boss ? 3 : undefined });
    this.seatsTaken = this.street.seatX.map(() => null);
    this.patMul = patienceMultiplier(G.data.upgrades, G.data.settings.relaxed, this.street.raining);
    this.pool = nightPool(this.n, G.data.upgrades);
    this.newTonight = new Set(this.def.newWords);
    for (const [id, s] of Object.entries(G.data.words)) if (s.seen > 0) this.seenBefore.add(id);
    G.audio.setAmbient(backdrop === 'euljiro' ? 'rain' : 'river');
    G.audio.setLofi(G.hasUpgrade('radio'));

    this.buildQueue();
    this.buildHud();
    this.box = new TypeBox(this, 4, 0, 10, INPUT_H - 6, 'Napiš objednávku…');
    this.box.root.setDepth(DEPTH.input);
    this.hintBtn = iconButton(this, 0, 0, 'help', () => this.hint(), 'wood').setDepth(DEPTH.input + 1);
    this.layout();

    G.ime.activate();
    this.unsub = G.ime.subscribe((s) => this.onInput(s.text, s.composing));
    G.ime.onKey = (e) => {
      if (e.key === 'Tab') this.hint();
      if (e.key === 'Escape') this.togglePause();
    };
    this.input.keyboard?.on('keydown-ESC', () => this.togglePause());
    this.game.events.on('layout', this.layout, this);
    this.events.once('shutdown', () => {
      this.unsub?.();
      G.ime.onKey = null;
      G.ime.deactivate();
      this.game.events.off('layout', this.layout, this);
    });
    const focusHint = this.time.addEvent({ delay: 400, loop: true, callback: () => {
      if (this.ended) return;
      if (!G.ime.hasFocus()) this.box.setHint('Klepni sem a piš', C.orange); else this.box.setHint('Napiš objednávku…');
    } });
    void focusHint;
    // the input panel is a big tap target that refocuses the IME (Android)
    this.box.bg.setInteractive().on('pointerdown', () => G.ime.focus());

    this.nextArrival = 1.4;
    const title = boss ? 'Finále · 미식가' : `Noc ${this.n}`;
    const banner = txt(this, this.scale.width / 2, this.scale.height / 2 - 60, title, { size: 'l', color: C.yellow, origin: [0.5, 0.5], shadow: true }).setDepth(DEPTH.overlay);
    banner.setScale(2).setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut', hold: 900, yoyo: true, onComplete: () => banner.destroy() });
    if (boss) {
      this.intro = true;
      this.time.delayedCall(900, async () => {
        await playDialogue(this, CRITIC_INTRO, { bottom: this.scale.height - INPUT_H - 4 });
        this.intro = false;
      });
    }
  }

  // ------------------------------------------------------------- schedule
  private buildQueue() {
    const d = this.def;
    const total = this.n === BOSS_NIGHT ? 6 : d.customers;
    const q: Kind[] = Array.from({ length: total }, () => 'generic' as Kind);
    const slot = (from: number, to: number) => {
      for (let tries = 0; tries < 20; tries++) {
        const i = Math.floor(from + this.rand() * Math.max(1, to - from));
        if (q[i] === 'generic') return i;
      }
      return -1;
    };
    for (const r of d.regulars) {
      let i = -1;
      if (r === 'nabi') i = slot(Math.min(3, total - 1), total - 1);
      if (r === 'haeun') i = slot(1, Math.ceil(total * 0.7));
      if (r === 'kim') i = slot(Math.floor(total * 0.6), total);
      if (i >= 0) q[i] = r;
    }
    if (this.n === BOSS_NIGHT) q.splice(1, 0, 'critic');
    this.queue = q;
  }

  private totalCustomers() { return this.queue.length + this.arrived; }

  // ------------------------------------------------------------- layout
  private layout() {
    const W = this.scale.width, H = this.scale.height;
    const gy = H - INPUT_H;
    this.street.layout(gy);
    this.box.setPosition(28, gy + 3, W - 32);
    this.hintBtn.setPosition(15, gy + 3 + (INPUT_H - 6) / 2);
    this.hud.setPosition(0, 0);
    this.layoutHud();
    for (const c of this.customers) this.placeCustomer(c, true);
  }

  private buildHud() {
    const s = this;
    this.hud = this.add.container(0, 0).setDepth(DEPTH.hud);
    const bg = this.add.rectangle(0, 0, 10, 22, 0x181425, 0.85).setOrigin(0, 0).setName('bg');
    const line = this.add.rectangle(0, 22, 10, 1, 0x3a4466).setOrigin(0, 0).setName('line');
    const night = txt(s, 6, 11, this.n === BOSS_NIGHT ? '미식가' : `Noc ${this.n}`, { size: 's', color: C.cream, origin: [0, 0.5] });
    this.progressBg = this.add.rectangle(0, 9, 10, 5, 0x3a4466).setOrigin(0, 0);
    this.progress = this.add.rectangle(0, 10, 0, 3, 0xf77622).setOrigin(0, 0);
    this.coinIcon = this.add.sprite(0, 11, 'coin').play('coin:spin');
    this.coinText = txt(s, 0, 11, '0', { size: 'm', color: C.yellow, origin: [0, 0.5] });
    const pause = iconButton(s, 0, 11, 'pause', () => this.togglePause()).setName('pause');
    this.comboText = txt(s, 0, 32, '', { size: 'm', color: C.orange, origin: [0.5, 0.5], shadow: true });
    this.hud.add([bg, line, night, this.progressBg, this.progress, this.coinIcon, this.coinText, pause, this.comboText]);
  }

  private layoutHud() {
    const W = this.scale.width;
    (this.hud.getByName('bg') as Phaser.GameObjects.Rectangle).width = W;
    (this.hud.getByName('line') as Phaser.GameObjects.Rectangle).width = W;
    const pause = this.hud.getByName('pause') as Phaser.GameObjects.Container;
    pause.setPosition(W - 13, 11);
    this.coinIcon.setPosition(W - 64, 11);
    this.coinText.setPosition(W - 56, 11);
    this.progressBg.setPosition(48, 9).width = W - 124;
    this.progress.setPosition(49, 10);
    this.comboText.setPosition(Math.round(W / 2), 34);
    this.updateProgress();
  }

  private updateProgress() {
    const done = this.served + this.angry;
    const total = Math.max(1, this.totalCustomers());
    this.progress.width = Math.round((this.progressBg.width - 2) * (done / total));
  }

  // ------------------------------------------------------------- customers
  private spawn(kind: Kind) {
    const seat = kind === 'critic' ? 1 : this.freeSeat();
    if (seat < 0) return false;
    const key = kind === 'generic' ? GENERIC[Math.floor(this.rand() * GENERIC.length)]
      : kind === 'nabi' ? (G.data.friends.nabi?.chapter >= 2 ? 'nabi_fat' : 'nabi') : `char_${kind === 'critic' ? 'critic' : kind}`;
    const sp = this.add.sprite(this.street.wx(140), 0, key).setOrigin(0.5, 1).setDepth(DEPTH.customer);
    if (kind === 'nabi') sp.setFlipX(false);
    const c: Customer = { kind, key, sprite: sp, seat, state: 'walk', patience: 1, max: 1, order: null, bubble: null, ordersLeft: kind === 'critic' ? CRITIC_ORDERS : 1 };
    this.seatsTaken[seat] = c;
    this.customers.push(c);
    this.arrived++;
    if (kind !== 'generic' && kind !== 'critic' && !this.regularsSeen.includes(kind)) this.regularsSeen.push(kind);
    this.placeCustomer(c);
    const tx = this.street.wx(this.street.seatX[seat]);
    sp.play(`${key}:walk`);
    const dist = Math.abs(sp.x - tx);
    this.tweens.add({
      targets: sp, x: tx, duration: (dist / (kind === 'nabi' ? 70 : 55)) * 1000, ease: 'Linear',
      onComplete: () => this.sitDown(c),
    });
    return true;
  }

  private freeSeat(): number {
    const free = this.seatsTaken.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0 && !(this.n === BOSS_NIGHT && i === 1 && !this.critic.done));
    if (!free.length) return -1;
    return free[Math.floor(this.rand() * free.length)];
  }

  private placeCustomer(c: Customer, relayout = false) {
    const y = c.kind === 'nabi' ? this.street.wy(-41) : this.street.wy(-28);
    c.sprite.y = y;
    if (relayout && c.state !== 'walk' && c.state !== 'leave') c.sprite.x = this.street.wx(this.street.seatX[c.seat]);
    if (c.bubble) this.placeBubble(c);
  }

  private placeBubble(c: Customer) {
    const b = c.bubble!;
    const W = this.scale.width;
    const row = c.kind === 'critic' ? 1 : c.seat % 2;
    const anchorY = this.street.wy(c.kind === 'nabi' ? -58 : -70) - row * 52;
    const cx = this.street.wx(this.street.seatX[c.seat]);
    let x = Math.round(cx - b.bw / 2);
    x = Math.max(2, Math.min(W - b.bw - 2, x));
    b.setPosition(x, Math.max(26, anchorY - b.bh - 6));
    b.tail.x = Math.max(4, Math.min(b.bw - 13, cx - x - 4));
  }

  private sitDown(c: Customer) {
    c.state = 'wait';
    c.sprite.play(`${c.key}:${c.kind === 'nabi' ? 'sit' : 'idle'}`);
    if (c.kind === 'nabi') G.audio.play('meow'); else G.audio.play('bell', { volume: 0.6 });
    this.newOrder(c);
  }

  private newOrder(c: Customer) {
    const exclude = new Set<string>([...this.recent.slice(-2)]);
    for (const o of this.customers) if (o.order) o.order.tokens.forEach((t) => exclude.add(t.id));
    const order = makeOrder(c.kind, this.pool, this.newTonight, exclude, this.rand);
    c.order = order;
    const base = c.kind === 'critic' ? CRITIC_PATIENCE : this.def.patience * (c.kind === 'haeun' ? 0.7 : c.kind === 'nabi' ? 1.2 : 1);
    c.max = base * this.patMul;
    c.patience = c.max;
    if (this.n === 1 && G.data.stats.served === 0 && this.served === 0 && !this.customers.some((o) => o.tutorial)) {
      c.tutorial = true;
      this.showTutorial(order);
    }
    const b = new Bubble(this, order, c.kind === 'critic' ? Math.min(140, this.scale.width - 8) : 66);
    c.bubble = b;
    this.placeBubble(c);
    b.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  private showTutorial(o: Order) {
    const W = this.scale.width;
    this.tutorialText?.destroy();
    this.tutorialText = txt(this, W / 2, this.scale.height - INPUT_H - 8, `Opiš z bubliny korejsky: ${o.target}\n(${o.cs}) – na systémové klávesnici`, {
      size: 's', color: C.yellow, origin: [0.5, 1], align: 'center', shadow: true, wrap: W - 12,
    }).setDepth(DEPTH.overlay);
    this.tweens.add({ targets: this.tutorialText, alpha: { from: 1, to: 0.6 }, yoyo: true, repeat: -1, duration: 600 });
  }

  // ------------------------------------------------------------- input
  private waiting(): Customer[] {
    return this.customers.filter((c) => c.state === 'wait' && c.order && c.bubble);
  }

  private onInput(text: string, composing: boolean, silent = false) {
    if (this.ended) return;
    if (!silent) this.box.set(text, composing);
    this.pendingServe?.remove();
    this.pendingServe = undefined;
    if (this.paused || this.intro) { if (text) G.ime.clear(); return; }
    const ws = this.waiting();
    if (/[a-zA-Z]/.test(text)) {
      this.box.setHint('Přepni klávesnici na korejštinu (한/영)', C.orange);
      toast(this, 'Přepni na korejskou klávesnici (한/영)', C.orange, this.scale.height - INPUT_H - 20);
      G.ime.clear();
      return;
    }
    const r = matchAgainst(text, ws, (c) => c.order!.target);
    for (const c of ws) c.bubble!.setMatch(text.length === 0 ? 'normal' : r.prefix.includes(c) ? 'hi' : 'dim');
    if (text.length === 0) { this.setError(false); return; }
    if (r.error) {
      if (!this.inError) this.mistake(text);
      return;
    }
    this.setError(false);
    if (r.full) {
      const target = r.full;
      // 김치 vs 김치찌개: if it's also a prefix of another order, wait a moment
      const longer = r.prefix.some((c) => c !== target && c.order!.target.length > target.order!.target.length);
      if (longer) this.pendingServe = this.time.delayedCall(650, () => this.serve(target));
      else this.serve(target);
    }
  }

  private mistake(text: string) {
    this.inError = true;
    this.mistakes++;
    this.combo = 0;
    this.updateCombo();
    G.audio.play('error');
    this.box.error();
    this.cameras.main.shake(120, 0.004);
    // blame the orders that matched what was typed just before
    const prev = [...text].slice(0, -1).join('');
    const prevMatch = prev ? matchAgainst(prev, this.waiting(), (c) => c.order!.target).prefix : [];
    const blamed = prevMatch.length ? prevMatch : [];
    for (const c of blamed) {
      const o = c.order!;
      const ti = tokenAt(o, text);
      o.mistakes[ti] = true;
      const id = o.tokens[ti].id;
      G.setStat(id, recordMistake(G.stat(id)));
      this.trouble.set(id, (this.trouble.get(id) ?? 0) + 1);
      c.bubble!.shake();
      if (c.kind === 'critic') {
        this.critic.mistakes++;
        floatText(this, c.sprite.x, c.sprite.y - 44, '−★', C.red);
        c.sprite.play(`${c.key}:neutral`);
        this.time.delayedCall(600, () => c.state === 'wait' && c.sprite.play(`${c.key}:idle`));
      }
    }
    if (!blamed.length) this.waiting().forEach((c) => c.bubble!.shake());
    this.errorTimer?.remove();
    this.errorTimer = this.time.delayedCall(900, () => { if (this.inError) G.ime.clear(); });
  }

  private setError(on: boolean) {
    if (!on && this.inError) {
      this.inError = false;
      this.errorTimer?.remove();
    }
  }

  private hint() {
    if (this.ended || this.paused) return;
    const ws = this.waiting().filter((c) => !c.order!.hinted);
    if (!ws.length) return;
    G.audio.play('hint');
    for (const c of ws) {
      c.order!.hinted = true;
      c.bubble!.refreshHint();
      this.tweens.add({ targets: c.bubble!.ko, scale: { from: 1.4, to: 1 }, duration: 300, ease: 'Back.easeOut' });
    }
    floatText(this, 15, this.scale.height - INPUT_H - 4, 'bez spropitného', C.grey);
  }

  // ------------------------------------------------------------- serving
  private serve(c: Customer) {
    if (c.state !== 'wait' || !c.order || !c.bubble) return;
    const o = c.order;
    const b = c.bubble;
    const clean = !o.mistakes.some(Boolean);
    G.ime.clear();
    this.box.success();
    this.tutorialText?.destroy();
    this.tutorialText = undefined;
    // learning
    o.tokens.forEach((t, i) => G.setStat(t.id, recordServe(G.stat(t.id), { clean: !o.mistakes[i], hinted: o.hinted, night: this.n })));
    o.tokens.forEach((t) => this.recent.push(t.id));
    if (clean && !o.hinted && c.kind !== 'generic' && c.kind !== 'critic') this.cleanServes[c.kind] = (this.cleanServes[c.kind] ?? 0) + 1;
    // score
    if (clean) this.combo++; else this.combo = 0;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const diff = o.tokens.reduce((a, t) => a + word(t.id).difficulty, 0);
    const pay = serveCoins(diff, c.patience / c.max, this.combo, o.hinted);
    this.coins += pay.total;
    this.tips += pay.tip * comboMultiplier(this.combo);
    this.updateCombo(true);
    // feedback
    c.state = 'eat';
    c.order = null;
    c.bubble = null;
    this.popBubble(b);
    this.cookAndDeliver(c, o, pay.total, pay.tip > 0);
    this.onInput('', false, true);
  }

  private popBubble(b: Bubble) {
    G.audio.play('pop');
    const cx = b.x + b.bw / 2, cy = b.y + b.bh / 2;
    const em = this.add.particles(0, 0, 'particles', {
      frame: [particleFrame('pop1'), particleFrame('pop2'), particleFrame('dot')], lifespan: 450, speed: { min: 50, max: 120 },
      scale: { start: 1, end: 0.3 }, alpha: { start: 1, end: 0 }, emitting: false, quantity: 12,
    }).setDepth(DEPTH.fx);
    em.explode(14, cx, cy);
    this.time.delayedCall(600, () => em.destroy());
    this.tweens.add({ targets: b, scale: 1.25, alpha: 0, duration: 120, onComplete: () => b.destroy() });
  }

  private cookAndDeliver(c: Customer, o: Order, coins: number, tip: boolean) {
    const chef = this.street.chef;
    chef.play('chef:cook');
    G.audio.play('sizzle', { volume: 0.7 });
    const puff = this.add.particles(this.street.wx(-56), this.street.wy(-60), 'particles', {
      frame: particleFrame('puff'), lifespan: 700, speedY: { min: -40, max: -20 }, speedX: { min: -12, max: 12 }, alpha: { start: 0.9, end: 0 }, emitting: false,
    }).setDepth(DEPTH.fx);
    puff.explode(5);
    this.time.delayedCall(900, () => puff.destroy());
    chef.once('animationcomplete', () => {
      chef.play('chef:serve');
      chef.once('animationcomplete', () => chef.play(this.combo > 0 && this.combo % 3 === 0 ? 'chef:happy' : 'chef:idle').once('animationcomplete', () => chef.play('chef:idle')));
      // dish slides along the counter
      G.audio.play('serve');
      const icons = o.icons;
      icons.forEach((ic, i) => {
        const dish = this.add.image(this.street.wx(-40), this.street.wy(-43), 'icons', iconIdx(ic)).setOrigin(0.5, 1).setDepth(DEPTH.dish);
        const tx = this.street.wx(this.street.seatX[c.seat]) + (icons.length > 1 ? (i - 0.5) * 18 : 0);
        this.tweens.add({
          targets: dish, x: tx, duration: 280 + Math.abs(tx - dish.x) * 1.2, ease: 'Cubic.easeOut', delay: i * 80,
          onComplete: () => {
            if (i === 0) this.startEating(c, coins, tip);
            this.time.delayedCall(1300, () => this.tweens.add({ targets: dish, alpha: 0, y: dish.y + 2, duration: 300, onComplete: () => dish.destroy() }));
          },
        });
      });
    });
  }

  private startEating(c: Customer, coins: number, tip: boolean) {
    c.sprite.play(`${c.key}:${c.kind === 'nabi' ? 'eat' : 'happy'}`);
    this.time.delayedCall(c.kind === 'nabi' ? 0 : 500, () => c.state === 'eat' && c.kind !== 'nabi' && c.sprite.play(`${c.key}:eat`));
    const crumbs = this.add.particles(c.sprite.x, c.sprite.y - (c.kind === 'nabi' ? 8 : 24), 'particles', {
      frame: [particleFrame('crumb'), particleFrame('heart')], lifespan: 700, speedY: { min: -30, max: -10 }, speedX: { min: -15, max: 15 }, gravityY: 40, frequency: 260, alpha: { start: 1, end: 0 },
    }).setDepth(DEPTH.fx);
    this.flyCoins(c.sprite.x, c.sprite.y - 30, coins);
    floatText(this, c.sprite.x, c.sprite.y - 46, `+${coins}${tip ? ' ♥' : ''}`, C.yellow);
    this.served++;
    this.updateProgress();
    this.time.delayedCall(1700, () => {
      crumbs.destroy();
      if (c.kind === 'critic' && --c.ordersLeft > 0) {
        c.sprite.play(`${c.key}:idle`);
        this.time.delayedCall(900, () => { if (!this.ended) { c.state = 'wait'; this.newOrder(c); } });
        return;
      }
      if (c.kind === 'critic') this.critic.done = true;
      this.leave(c, true);
    });
  }

  private flyCoins(x: number, y: number, amount: number) {
    const n = Math.min(8, Math.max(1, Math.ceil(amount / 4)));
    for (let i = 0; i < n; i++) {
      const coin = this.add.sprite(x, y, 'coin').play('coin:spin').setDepth(DEPTH.fx);
      const tx = this.coinIcon.x, ty = this.coinIcon.y;
      const mx = x + (this.rand() - 0.5) * 50, my = y - 30 - this.rand() * 30;
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x, y), new Phaser.Math.Vector2(mx, my), new Phaser.Math.Vector2(tx, ty));
      const t = { v: 0 };
      this.tweens.add({
        targets: t, v: 1, duration: 520 + i * 60, delay: i * 50, ease: 'Sine.easeIn',
        onUpdate: () => { const p = curve.getPoint(t.v); coin.setPosition(Math.round(p.x), Math.round(p.y)); },
        onComplete: () => {
          coin.destroy();
          G.audio.play('coin', { detune: i * 90, volume: 0.6 });
          this.coinText.setText(String(this.coins));
          snapText(this.coinText);
          this.tweens.add({ targets: this.coinIcon, scale: { from: 1.5, to: 1 }, duration: 160 });
        },
      });
    }
  }

  private updateCombo(bump = false) {
    const m = comboMultiplier(this.combo);
    if (this.combo >= 3) {
      this.comboText.setText(`KOMBO ×${m}  (${this.combo})`).setColor(m >= 4 ? C.pink : m >= 3 ? C.yellow : C.orange);
      snapText(this.comboText);
      if (bump) {
        this.tweens.add({ targets: this.comboText, scale: { from: 1.5, to: 1 }, duration: 260, ease: 'Back.easeOut' });
        if (this.combo % 3 === 0) { G.audio.play('combo'); this.street.flash(m); }
      }
    } else this.comboText.setText('');
  }

  private leave(c: Customer, happy: boolean) {
    c.state = 'leave';
    if (c.bubble) {
      const b = c.bubble;
      c.bubble = null;
      this.tweens.add({ targets: b, alpha: 0, y: b.y - 6, duration: 200, onComplete: () => b.destroy() });
    }
    c.order = null;
    this.time.delayedCall(happy ? 0 : 700, () => {
      this.seatsTaken[c.seat] = null;
      c.sprite.play(`${c.key}:walk`);
      if (c.kind === 'nabi') c.sprite.setFlipX(true);
      const tx = this.street.wx(150);
      this.tweens.add({
        targets: c.sprite, x: tx, duration: (Math.abs(tx - c.sprite.x) / 60) * 1000, onComplete: () => {
          c.sprite.destroy();
          this.customers = this.customers.filter((o) => o !== c);
          this.checkEnd();
        },
      });
    });
  }

  private walkOut(c: Customer) {
    const o = c.order!;
    o.tokens.forEach((t) => {
      G.setStat(t.id, recordMissed(G.stat(t.id), this.n));
      this.trouble.set(t.id, (this.trouble.get(t.id) ?? 0) + 1);
    });
    this.angry++;
    this.combo = 0;
    this.updateCombo();
    this.updateProgress();
    G.audio.play('angry');
    c.sprite.play(`${c.key}:${c.kind === 'nabi' ? 'walk' : 'angry'}`);
    floatText(this, c.sprite.x, c.sprite.y - 46, c.kind === 'critic' ? '−★★' : 'hmpf!', C.red);
    if (c.kind === 'critic') {
      this.critic.walkouts++;
      if (--c.ordersLeft > 0) {
        // the critic grumbles but orders again
        const b = c.bubble!;
        c.bubble = null; c.order = null;
        this.tweens.add({ targets: b, alpha: 0, duration: 200, onComplete: () => b.destroy() });
        c.state = 'eat';
        this.time.delayedCall(1500, () => { c.state = 'wait'; c.sprite.play(`${c.key}:idle`); this.newOrder(c); });
        return;
      }
      this.critic.done = true;
    }
    this.leave(c, false);
  }

  // ------------------------------------------------------------- loop
  update(_t: number, dtMs: number) {
    this.street.update(dtMs);
    if (this.paused || this.ended) return;
    const dt = dtMs / 1000;
    if (!this.intro) {
      this.clock += dt;
      // arrivals
      if (this.queue.length && this.clock >= this.nextArrival) {
        const kind = this.queue[0];
        const bossWaiting = this.n === BOSS_NIGHT && kind !== 'critic' && this.arrived === 0;
        if (!bossWaiting && this.spawn(kind)) {
          this.queue.shift();
          const [a, b] = this.def.spawn;
          this.nextArrival = this.clock + a + this.rand() * (b - a);
        } else this.nextArrival = this.clock + 0.5;
      }
      // boss night: once the critic is done, nobody new comes
      if (this.n === BOSS_NIGHT && this.critic.done) this.queue = [];
      // patience
      for (const c of this.customers) {
        if (c.state !== 'wait' || !c.bubble) continue;
        if (c.tutorial && this.served === 0) { c.bubble.setPatience(1); continue; }
        c.patience -= dt;
        const f = c.patience / c.max;
        c.bubble.setPatience(f);
        if (f < 0.28 && c.kind !== 'nabi' && c.sprite.anims.currentAnim?.key !== `${c.key}:angry`) c.sprite.play(`${c.key}:angry`);
        else if (f >= 0.28 && f < 0.6 && c.kind !== 'nabi' && c.sprite.anims.currentAnim?.key === `${c.key}:idle`) c.sprite.play(`${c.key}:neutral`);
        if (c.patience <= 0) this.walkOut(c);
      }
    }
  }

  private checkEnd() {
    if (this.ended || this.queue.length || this.customers.length) return;
    this.ended = true;
    this.time.delayedCall(700, () => this.finish());
  }

  private finish() {
    const total = this.served + this.angry;
    const boss = this.n === BOSS_NIGHT;
    const stars = boss ? criticStars(this.critic.mistakes, this.critic.walkouts) : nightStars({ total, served: this.served, angry: this.angry, mistakes: this.mistakes });
    const d = G.data;
    const rec = d.nights[this.n] ?? { stars: 0, bestCoins: 0, plays: 0 };
    d.nights[this.n] = { stars: Math.max(rec.stars, stars), bestCoins: Math.max(rec.bestCoins, this.coins), plays: rec.plays + 1 };
    d.coins += this.coins;
    d.stats.served += this.served;
    d.stats.mistakes += this.mistakes;
    d.stats.nightsPlayed++;
    for (const [k, v] of Object.entries(this.cleanServes)) {
      const f = d.friends[k] ?? { clean: 0, chapter: 0 };
      d.friends[k] = { ...f, clean: f.clean + (v ?? 0) };
    }
    G.markPlayedToday();
    const newWords = Object.entries(d.words).filter(([id, s]) => s.seen > 0 && !this.seenBefore.has(id)).map(([id]) => id);
    const trouble = [...this.trouble.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 3);
    G.save.save();
    const summary: NightSummary = {
      night: this.n, stars, total, served: this.served, angry: this.angry, mistakes: this.mistakes, coins: this.coins, tips: this.tips,
      bestCombo: this.bestCombo, newWords, trouble, regularsSeen: this.regularsSeen, clean: this.cleanServes,
      critic: boss ? { stars, mistakes: this.critic.mistakes, walkouts: this.critic.walkouts } : undefined,
    };
    G.ime.deactivate();
    goto(this, 'Result', summary, 500);
  }

  // ------------------------------------------------------------- pause
  private togglePause() {
    if (this.ended) return;
    if (this.pauseLayer) { this.pauseLayer.destroy(); this.pauseLayer = undefined; this.paused = false; this.tweens.resumeAll(); G.ime.focus(); return; }
    this.paused = true;
    this.tweens.pauseAll();
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(DEPTH.overlay);
    c.add(this.add.rectangle(0, 0, W, H, 0x181425, 0.7).setOrigin(0, 0).setInteractive());
    const pw = 160, ph = 120, px = Math.round(W / 2 - pw / 2), py = Math.round(H / 2 - ph / 2 - 30);
    c.add(panel(this, px, py, pw, ph));
    c.add(txt(this, W / 2, py + 10, 'Pauza', { size: 'l', color: C.yellow, origin: [0.5, 0] }));
    c.add(button(this, W / 2, py + 44, 120, 20, 'Pokračovat', () => this.togglePause(), { size: 's' }));
    c.add(button(this, W / 2, py + 70, 120, 20, 'Začít znovu', () => { this.tweens.resumeAll(); goto(this, 'Night', { night: this.n }); }, { size: 's', style: 'wood' }));
    c.add(button(this, W / 2, py + 96, 120, 20, 'Zpět na mapu', () => { this.tweens.resumeAll(); goto(this, 'Map'); }, { size: 's', style: 'wood' }));
    this.pauseLayer = c;
  }
}

void HEX;
