// One night = one level. Customers order in bubbles, the player types the
// Korean with the system IME, matching orders are served.
import Phaser from 'phaser';
import { DAILY_NIGHT, NIGHTS, nightTitle, CRITIC_ORDERS, CRITIC_PATIENCE, DISTRICTS, homeDistrict, nightDef, nightPool, type NightDef, type RegularId } from '../data/levels';
import { BOSS_INTRO, HOLIDAY_INTRO, NAMES, PHARMACY_INTRO } from '../data/story';
import { matchAgainst } from '../logic/hangul';
import { BOSS_SEATS, DEFAULT_SEATS, comboMultiplier, criticStars, nightStars, pairPatience, patienceMultiplier, seatMultiplier, serveCoins, spawnInterval } from '../logic/rules';
import { helperPick } from '../logic/helper';
import { DISCOUNT_MUL, HAGGLE_CHANCE, HAGGLE_WINDOW, HAGGLE_WORDS, INSIST_LEAVE, INSIST_MUL, BOSS_GREET_WINDOW, BYE_COINS, BYE_WORDS, GREET_WINDOW, HELLO_COINS, HELLO_PATIENCE, HELLO_WORDS, REACTIONS, REACTIONS_FROM, REACTION_CHANCE, REACTION_COINS, REACTION_TIME, matchPolite, pickReaction, type GreetKind, type Greeting, type ReactionId } from '../logic/polite';
import { ITEM_REACTIONS } from '../data/reactions';
import { jamoKnown } from '../data/levels';
import { COMPOUND_VOWELS, SHIFT_VOWELS, jamoSet, matchKind, rawJamo } from '../logic/hangul';
import { hintLevel } from '../logic/srs';
import { recordMissed, recordMistake, recordServe, rng } from '../logic/srs';
import { Bubble } from '../game/bubble';
import { playStory } from '../game/dialogue';
import { joinTokens, makeOrder, orderTargets, tokenAt, type Kind, type Order } from '../game/orders';
import { G, WORDS, iconTex, word } from '../game/state';
import { dailyPool, daySeed, recordDaily } from '../logic/daily';
import { dayKey } from '../logic/save';
import { SHIFT_JAMO } from '../logic/achievements';
import { DEPTH, Street, particleFrame } from '../game/street';
import { TypeBox } from '../game/typebox';
import { attachHat } from '../game/hats';
import { IS_ANDROID } from '../game/ime';
import { C, HEX, button, cssRect, iconFrame, fadeIn, floatText, goto, iconButton, panel, snapText, toast, txt } from '../game/ui';
import { COOP_SEAT_MUL, COOP_WALK_MS, RUNOFF_MS, patienceFrac } from '../logic/coop';
import type { CoopSummary, Msg, OrderData, PlayerInfo } from '../logic/netproto';
import { CoopDirector } from '../game/coopHost';
import { PFRAME, PCOL, PlayerTag, initial } from '../game/coopui';
import type { NetSession } from '../game/net';
import { RATE_SLOW, listenHint, replayRule } from '../logic/track';
import { splitSyllable } from '../logic/hangul';

type StartMsg = Extract<Msg, { t: 'start' }>;

/** Co-op bookkeeping of one customer (cid from the host). */
interface CoopCust {
  cid: number;
  at: number;
  patienceMs: number;
  data: OrderData;
  /** Host clock when someone else served it (runoff running). */
  runoffAt?: number;
  /** I finished it myself (first or in the runoff). */
  mine?: boolean;
  clean?: boolean;
  cooked?: boolean;
  shownAt?: number;
}

interface CoopCtx {
  s: NetSession;
  start: StartMsg;
  me: number;
  director?: CoopDirector;
  tags: Map<number, PlayerTag>;
  coins: Map<number, number>;
  lastTick: number;
  tickAt: number;
  offs: (() => void)[];
  paid: boolean;
  /** Players at the start of the night (names stay when someone leaves). */
  roster: PlayerInfo[];
  confirm?: Phaser.GameObjects.Container;
}

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
  /** Greeting window (hand when seated, door when leaving). */
  greet?: { kind: GreetKind; until: number; tag: Phaser.GameObjects.Container };
  /** 용산: "To je drahé!" waiting for 할인 / 싸다. */
  haggle?: { until: number; tag: Phaser.GameObjects.Container };
  /** Price multiplier after haggling. */
  priceMul?: number;
  /** Got a discount: will not walk out. */
  stays?: boolean;
  /** Last item served (for the reaction). */
  lastItem?: string;
  coop?: CoopCust;
  /** Poslech: the first telling of the order has finished (patience runs from then). */
  heard?: boolean;
  /** Poslech: replays the player asked for / the automatic one after a typo. */
  replays?: number;
  autoReplayed?: boolean;
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
  seats: number;
  /** Orders 김 대리 served for the player. */
  helped: number;
  greetings: number;
  reactions: number;
  haggles: number;
  /** Daily challenge: was this today's (first, recorded) attempt? */
  dailyCounted?: boolean;
  /** Poslech night: replays the player asked for. */
  listen?: boolean;
  replays?: number;
  /** First time this night got a star in the active track (grandma's postcard shows only then). */
  firstClear?: boolean;
}

/** Ambient sound per backdrop. */
function ambientFor(b: string): 'rain' | 'river' | 'city' | 'sea' {
  if (b === 'euljiro') return 'rain';
  if (b === 'hangang') return 'river';
  if (b === 'busan') return 'sea';
  if (b === 'pharmacy') return 'rain';
  return 'city';
}
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
  private seats = DEFAULT_SEATS;
  private seatMul = 1;
  private helped = 0;
  private greetings = 0;
  private haggles = 0;
  /** Customers who left after 싸다 (not angry, not counted). */
  private lost = 0;
  private reactions = 0;
  /** A mistake happened while typing a greeting (no mastery for it). */
  private greetDirty = false;
  private known = new Set<string>();
  private criticGreeted = false;
  private unsub?: () => void;
  /** Co-op night (null = single player). */
  private coop: CoopCtx | null = null;
  /** Poslech: customers speak, bubbles show a speaker. */
  private listen = false;
  private replaysAsked = 0;
  private earBtn?: Phaser.GameObjects.Container;
  private lastTap = 0;
  private onImeTap = (e: PointerEvent) => this.tapAt(e.clientX, e.clientY, true);
  // HUD
  private coinText!: Phaser.GameObjects.Text;
  private coinIcon!: Phaser.GameObjects.Sprite;
  private progress!: Phaser.GameObjects.Rectangle;
  private progressBg!: Phaser.GameObjects.Rectangle;
  private comboText!: Phaser.GameObjects.Text;
  private titleText!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Container;
  private hintBtn!: Phaser.GameObjects.Container;
  private pauseLayer?: Phaser.GameObjects.Container;
  private tutorialText?: Phaser.GameObjects.Text;

  constructor() { super('Night'); }

  init(d: { night?: number; seats?: number; coop?: StartMsg }) {
    this.n = d?.night ?? G.night;
    G.night = this.n;
    this.def = nightDef(this.n);
    if (this.n === DAILY_NIGHT) {
      // today's backdrop: one of the districts the player has reached
      const reached = (['euljiro', 'hangang', 'dongdaemun', 'hongdae', 'yongsan', 'busan'] as const).filter((b) => NIGHTS.some((d) => d.district === b && G.isUnlocked(d.n)));
      this.def = { ...this.def, backdrop: reached[daySeed(dayKey(new Date())) % reached.length] };
    }
    this.seats = this.def.boss ? BOSS_SEATS : (d?.seats ?? G.data.settings.seats ?? DEFAULT_SEATS);
    this.seatMul = seatMultiplier(this.seats);
    this.helped = this.greetings = this.reactions = this.haggles = this.lost = 0;
    this.greetDirty = this.criticGreeted = false;
    this.known = jamoKnown(this.n);
    if (this.n === DAILY_NIGHT) for (const d of NIGHTS) if (G.track().nights[d.n]) jamoKnown(d.n).forEach((j) => this.known.add(j));
    this.customers = [];
    this.queue = [];
    this.clock = 0;
    this.combo = this.bestCombo = this.coins = this.tips = this.served = this.angry = this.mistakes = this.arrived = 0;
    this.paused = this.ended = this.inError = this.intro = false;
    this.pauseLayer = undefined;
    this.recent = [];
    this.trouble = new Map();
    this.regularsSeen = [];
    this.cleanServes = {};
    this.critic = { mistakes: 0, walkouts: 0, done: false };
    // the daily challenge is the same night for everyone that day
    this.rand = rng(this.n === DAILY_NIGHT ? daySeed(dayKey(new Date())) : Date.now() & 0xffffffff);
    this.coop = null;
    this.replaysAsked = 0;
    this.listen = G.listening && G.speech.ok && !d?.coop;
    if (d?.coop && G.net && !G.net.closed) {
      const s = G.net;
      this.seats = d.coop.seats;
      this.seatMul = COOP_SEAT_MUL;
      this.rand = rng(d.coop.seed);
      this.coop = { s, start: d.coop, me: s.pid, tags: new Map(), coins: new Map(), lastTick: 0, tickAt: performance.now(), offs: [], paid: false, roster: [...s.players] };
      // a player without a Korean voice plays the listening night by reading
      this.listen = d.coop.track === 'listen' && G.speech.ok;
      G.trackOverride = this.listen ? 'listen' : 'read';
    }
  }

  create() {
    fadeIn(this, 400);
    if (G.speed !== 1) { this.time.timeScale = G.speed; this.tweens.timeScale = G.speed; this.anims.globalTimeScale = G.speed; }
    const boss = !!this.def.boss;
    const backdrop = this.def.backdrop ?? DISTRICTS[homeDistrict(this.def)].backdrop;
    this.street = new Street(this, { backdrop, seats: this.seats, snow: this.def.weather === 'snow', rain: this.def.weather !== 'dry', kittens: this.n === 303, festive: this.def.district === 'holiday' });
    this.seatsTaken = this.street.seatX.map(() => null);
    this.patMul = patienceMultiplier(G.data.upgrades, G.data.settings.relaxed, this.street.raining);
    this.pool = this.n === DAILY_NIGHT
      ? dailyPool(WORDS.filter((w) => (G.track().words[w.id]?.seen ?? 0) > 0 && !['phrase', 'expr', 'adj'].includes(w.category)).map((w) => w.id), dayKey(new Date()))
      : nightPool(this.n, G.data.upgrades);
    if (this.pool.length < 3) this.pool = ['cha', 'uyu', 'mul', 'dubu', 'mandu'];
    this.newTonight = new Set(this.def.newWords);
    for (const [id, s] of Object.entries(G.track().words)) if (s.seen > 0) this.seenBefore.add(id);
    G.audio.setAmbient(this.def.weather === 'dry' || this.def.weather === 'snow' ? 'city' : ambientFor(backdrop));
    G.audio.setLofi(G.hasUpgrade('radio'), G.station());

    if (!this.coop) this.buildQueue();
    this.buildHud();
    this.box = new TypeBox(this, 4, 0, 10, INPUT_H - 6, 'Napiš objednávku…');
    this.box.root.setDepth(DEPTH.input);
    this.hintBtn = iconButton(this, 0, 0, 'help', () => this.hint(), 'wood').setDepth(DEPTH.input + 1);
    if (this.listen) {
      const ear = button(this, 0, 0, 20, 20, '', () => this.earReplay(), { style: 'wood' }).setDepth(DEPTH.input + 1);
      ear.add(this.add.image(0, -1, 'track_m', 1));
      this.earBtn = ear;
      G.ime.el.addEventListener('pointerdown', this.onImeTap);
      this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.tapAt(p.x, p.y, false));
    } else if (G.listening && !this.coop) this.time.delayedCall(1500, () => toast(this, 'Chybí korejský hlas – dnes se čte z bublin', C.orange));
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
      G.speech.stop();
      G.trackOverride = null;
      G.ime.el.removeEventListener('pointerdown', this.onImeTap);
      this.unsub?.();
      G.ime.onKey = null;
      G.ime.deactivate();
      this.game.events.off('layout', this.layout, this);
      if (this.coop) {
        this.coop.offs.forEach((f) => f());
        this.coop.director?.destroy();
        this.coop.s.onLobby = null;
      }
    });
    const focusHint = this.time.addEvent({ delay: 400, loop: true, callback: () => {
      if (this.ended) return;
      // Android: keyboard closed (WebView is padded by the IME inset, so full height = no keyboard)
      const kbClosed = IS_ANDROID && window.innerHeight > screen.height * 0.72;
      if (!G.ime.hasFocus() || kbClosed) this.box.setHint('Klepni kamkoli a piš', C.orange); else this.box.setHint('Napiš objednávku…');
    } });
    void focusHint;
    // the input panel is a big tap target that refocuses the IME (Android)
    this.box.bg.setInteractive().on('pointerdown', () => G.ime.reopen());

    this.nextArrival = 1.4;
    const title = boss ? `Boss · ${NAMES[this.def.boss!]}` : this.coop ? `Spolu · ${nightTitle(this.n)}` : nightTitle(this.n);
    const banner = txt(this, this.scale.width / 2, this.scale.height / 2 - 60, title, { size: 'l', color: C.yellow, origin: [0.5, 0.5], shadow: true }).setDepth(DEPTH.overlay);
    banner.setScale(2).setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut', hold: 900, yoyo: true, onComplete: () => banner.destroy() });
    if (this.coop) { this.coopSetup(); return; }
    const introLines = boss ? BOSS_INTRO[this.def.boss!]
      : HOLIDAY_INTRO[this.n] ?? (this.n === 201 && !G.track().nights[201] ? PHARMACY_INTRO : null);
    if (introLines) {
      this.intro = true;
      this.time.delayedCall(900, async () => {
        this.updateTapArea();
        await playStory(this, `night:${this.n}`, introLines, { bottom: this.scale.height - INPUT_H - 4 });
        this.intro = false;
        this.updateTapArea();
      });
    }
  }

  // ------------------------------------------------------------- schedule
  private buildQueue() {
    const d = this.def;
    const total = d.boss ? 6 : d.customers;
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
    if (d.boss) q.unshift('boss');
    this.queue = q;
  }

  private totalCustomers() { return this.coop ? this.coop.start.total : this.queue.length + this.arrived; }

  // ------------------------------------------------------------- layout
  private layout() {
    const W = this.scale.width, H = this.scale.height;
    const gy = H - INPUT_H;
    this.street.layout(gy);
    this.box.setPosition(28, gy + 3, W - (this.earBtn ? 56 : 32));
    this.hintBtn.setPosition(15, gy + 3 + (INPUT_H - 6) / 2);
    this.earBtn?.setPosition(W - 15, gy + 3 + (INPUT_H - 6) / 2);
    this.hud.setPosition(0, 0);
    this.layoutHud();
    this.updateTapArea();
    for (const c of this.customers) this.placeCustomer(c, true);
  }

  /** Whole scene below the HUD (except the hint button) is a tap target for the keyboard. */
  updateTapArea() {
    if (this.paused || this.intro || this.ended || this.coop?.confirm) { G.ime.setTapArea(null); return; }
    const W = this.scale.width, H = this.scale.height;
    G.ime.setTapArea(cssRect(this, 30, 24, W - 30, H - 24));
  }

  private buildHud() {
    const s = this;
    this.hud = this.add.container(0, 0).setDepth(DEPTH.hud);
    const bg = this.add.rectangle(0, 0, 10, 22, 0x181425, 0.85).setOrigin(0, 0).setName('bg');
    const line = this.add.rectangle(0, 22, 10, 1, 0x3a4466).setOrigin(0, 0).setName('line');
    const night = this.titleText = txt(s, 6, 11, nightTitle(this.n, this.def.boss ? NAMES[this.def.boss] : undefined), { size: 's', color: C.cream, origin: [0, 0.5] });
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
    const px = Math.max(48, this.titleText.width + 12);
    this.progressBg.setPosition(px, 9).width = W - 76 - px;
    this.progress.setPosition(px + 1, 10);
    this.comboText.setPosition(Math.round(W / 2), this.coop ? 48 : 34);
    if (this.coop) this.layoutTags();
    this.updateProgress();
  }

  private updateProgress() {
    const done = this.served + this.angry + this.lost;
    const total = Math.max(1, this.totalCustomers());
    this.progress.width = Math.round((this.progressBg.width - 2) * (done / total));
  }

  // ------------------------------------------------------------- customers
  private spawn(kind: Kind) {
    const seat = kind === 'boss' ? 1 : this.freeSeat();
    if (seat < 0) return false;
    const generics = DISTRICTS[homeDistrict(this.def)].generics;
    const key = kind === 'generic' ? generics[Math.floor(this.rand() * generics.length)]
      : kind === 'nabi' ? (G.track().friends.nabi?.chapter >= 2 ? 'nabi_fat' : 'nabi') : `char_${kind === 'boss' ? this.def.boss : kind}`;
    const sp = this.add.sprite(this.street.wx(140), 0, key).setOrigin(0.5, 1).setDepth(DEPTH.customer);
    if (kind === 'nabi') { sp.setFlipX(false); attachHat(this, sp); }
    const c: Customer = { kind, key, sprite: sp, seat, state: 'walk', patience: 1, max: 1, order: null, bubble: null, ordersLeft: kind === 'boss' ? CRITIC_ORDERS : 1 };
    this.seatsTaken[seat] = c;
    this.customers.push(c);
    this.arrived++;
    if (kind !== 'generic' && kind !== 'boss' && !this.regularsSeen.includes(kind)) this.regularsSeen.push(kind);
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
    const free = this.seatsTaken.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0 && !(this.def.boss && i === 1 && !this.critic.done));
    if (!free.length) return -1;
    return free[Math.floor(this.rand() * free.length)];
  }

  private placeCustomer(c: Customer, relayout = false) {
    const y = c.kind === 'nabi' ? this.street.wy(-41) : this.street.wy(-40);
    c.sprite.y = y;
    if (relayout && c.state !== 'walk' && c.state !== 'leave') c.sprite.x = this.street.wx(this.street.seatX[c.seat]);
    if (c.bubble) this.placeBubble(c);
  }

  private placeBubble(c: Customer) {
    const b = c.bubble!;
    const W = this.scale.width;
    const row = c.kind === 'boss' ? 1 : c.seat % 2;
    const mech = this.def.mechanic ?? DISTRICTS[homeDistrict(this.def)].mechanic;
    const rowGap = mech === 'colorItem' ? 76 : mech === 'symptom' || mech === 'destination' ? 74 : 56;
    const anchorY = this.street.wy(c.kind === 'nabi' ? -58 : -82) - row * rowGap;
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
    if (c.kind !== 'nabi' && !c.tutorial) this.openGreeting(c, 'hello');
    this.maybeHaggle(c);
  }

  private newOrder(c: Customer) {
    const exclude = new Set<string>([...this.recent.slice(-2)]);
    for (const o of this.customers) if (o.order) o.order.tokens.forEach((t) => exclude.add(t.id));
    const mech = this.def.mechanic ?? DISTRICTS[homeDistrict(this.def)].mechanic;
    const order = makeOrder(c.kind, { pool: this.pool, newTonight: this.newTonight, exclude, rand: this.rand, mechanic: mech, boss: this.def.boss, late: this.def.late, combo: this.def.combo });
    c.order = order;
    const base = c.kind === 'boss' ? CRITIC_PATIENCE : this.def.patience * (c.kind === 'haeun' ? 0.7 : c.kind === 'nabi' ? 1.2 : 1);
    c.max = base * this.patMul * (c.kind === 'boss' ? 1 : pairPatience(order.tokens.length, mech === 'colorItem'));
    c.patience = c.max;
    if (this.n === 1 && G.data.stats.served === 0 && this.served === 0 && !this.customers.some((o) => o.tutorial)) {
      c.tutorial = true;
      this.showTutorial(order);
    }
    const b = new Bubble(this, order, this.bubbleW(c), { listen: this.listen && c.kind !== 'nabi' });
    c.bubble = b;
    this.placeBubble(c);
    b.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.tellOrder(c);
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  private bubbleW(c: Customer) {
    return c.kind === 'boss' ? Math.min(150, this.scale.width - 8) : this.coop || this.seats === 4 ? 70 : 96;
  }

  // ------------------------------------------------------------- Poslech
  /** The customer says the order (the cat only meows and keeps its picture). */
  private tellOrder(c: Customer) {
    c.heard = !this.listen;
    c.replays = 0;
    c.autoReplayed = false;
    if (!this.listen) return;
    if (c.kind === 'nabi') { c.heard = true; void G.speech.speak('야옹', { tag: c }); return; }
    this.sayOrder(c, G.voiceRate());
  }

  private sayOrder(c: Customer, rate: number) {
    const o = c.order;
    if (!o) return;
    void G.speech.speak(o.target, { tag: c, rate }).then(() => { if (c.order === o) c.heard = true; });
  }

  /** Tap on a speaker bubble (screen or game coordinates) = hear it again. */
  private tapAt(x: number, y: number, css: boolean) {
    if (!this.listen || this.paused || this.ended || this.intro) return;
    if (css) {
      const r = this.game.canvas.getBoundingClientRect();
      const k = r.width / this.scale.width;
      x = (x - r.left) / k;
      y = (y - r.top) / k;
    }
    if (performance.now() - this.lastTap < 250) return;
    // Overlapping bubbles: replay the one drawn on top (highest depth, then display-list order).
    const c = this.waiting()
      .filter((w) => w.bubble!.listen && x >= w.bubble!.x && x <= w.bubble!.x + w.bubble!.bw && y >= w.bubble!.y && y <= w.bubble!.y + w.bubble!.bh)
      .sort((a, b) => (a.bubble!.depth - b.bubble!.depth) || (this.children.getIndex(a.bubble!) - this.children.getIndex(b.bubble!)))
      .pop();
    if (!c) return;
    this.lastTap = performance.now();
    this.replay(c);
  }

  /** Ear button: replays the only waiting order. */
  private earReplay() {
    const ws = this.waiting().filter((c) => c.bubble!.listen);
    if (ws.length === 1) this.replay(ws[0]);
    else if (ws.length > 1) toast(this, 'Ťukni na bublinu, kterou chceš slyšet', C.cream, this.scale.height - INPUT_H - 20);
    G.ime.focus();
  }

  private replay(c: Customer) {
    const o = c.order;
    if (!o || c.state !== 'wait' || G.speech.pending(c)) return;
    c.replays = (c.replays ?? 0) + 1;
    this.replaysAsked++;
    const rule = replayRule(c.replays, G.voiceRate());
    if (rule.costsTip && !o.noTip) {
      o.noTip = true;
      floatText(this, c.bubble!.x + c.bubble!.bw / 2, c.bubble!.y - 4, 'bez spropitného', C.grey);
    }
    G.audio.play('replay');
    this.tweens.add({ targets: c.bubble, scale: { from: 1.08, to: 1 }, duration: 160 });
    this.time.delayedCall(120, () => { if (c.order === o) this.sayOrder(c, rule.rate); });
  }

  /** After serving in Poslech: picture + Korean + Czech for 1.5 s, then pop. */
  private reveal(c: Customer, b: Bubble, o: Order) {
    const r = new Bubble(this, { ...o, hinted: true }, this.bubbleW(c)).toTop();
    r.hidePatience();
    r.setPosition(Phaser.Math.Clamp(Math.round(b.x + b.bw / 2 - r.bw / 2), 2, this.scale.width - r.bw - 2), Math.max(26, Math.round(b.y + b.bh - r.bh)));
    r.tail.x = Phaser.Math.Clamp(b.tail.x + b.x - r.x, 4, r.bw - 13);
    b.destroy();
    G.audio.play('pop', { volume: 0.4 });
    r.setScale(0.9);
    this.tweens.add({ targets: r, scale: 1, duration: 160, ease: 'Back.easeOut' });
    this.time.delayedCall(1500, () => this.popBubble(r));
  }

  private showTutorial(o: Order) {
    const W = this.scale.width;
    this.tutorialText?.destroy();
    const msg = this.listen ? `Poslouchej a napiš korejsky, co slyšíš (${o.cs}).\nŤukni na bublinu = ještě jednou.` : `Opiš z bubliny korejsky: ${o.target}\n(${o.cs}) – na systémové klávesnici`;
    this.tutorialText = txt(this, W / 2, this.scale.height - INPUT_H - 8, msg, {
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
    const m = matchPolite(text, ws, (c) => orderTargets(c.order!), this.activeGreetings());
    const r = m.orders;
    for (const c of ws) c.bubble!.setMatch(text.length === 0 ? 'normal' : r.prefix.includes(c) ? 'hi' : 'dim');
    if (text.length === 0) { this.setError(false); this.greetDirty = false; return; }
    if (m.error) {
      if (!this.inError) this.mistake(text);
      return;
    }
    this.setError(false);
    if (m.greet) { this.greet(m.greet); return; }
    if (r.full) {
      const target = r.full;
      // 김치 vs 김치찌개: if it's also a prefix of another order, wait a moment
      const longer = r.prefix.some((c) => c !== target && c.order!.target.length > target.order!.target.length);
      if (longer) this.pendingServe = this.time.delayedCall(650, () => this.serve(target, text));
      else this.serve(target, text);
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
      if (c.bubble!.listen && !c.autoReplayed && !G.speech.pending(c)) {
        // after a typo the order is said once more, slowly (free)
        c.autoReplayed = true;
        this.time.delayedCall(450, () => { if (c.order === o) this.sayOrder(c, RATE_SLOW); });
      }
      if (c.kind === 'boss') {
        this.critic.mistakes++;
        floatText(this, c.sprite.x, c.sprite.y - 44, '−★', C.red);
        c.sprite.play(`${c.key}:neutral`);
        this.time.delayedCall(600, () => c.state === 'wait' && c.sprite.play(`${c.key}:idle`));
      }
    }
    if (this.coop) this.coop.s.toHost({ t: 'miss', cid: blamed[0]?.coop?.cid ?? -1 });
    if (!blamed.length) {
      const g = prev ? matchPolite(prev, [], () => '', this.activeGreetings()) : null;
      if (g?.greetPrefix) {
        this.greetDirty = true;
        for (const gr of this.activeGreetings()) if (matchPolite(prev, [], () => '', [gr]).greetPrefix) G.setStat(gr.id, recordMistake(G.stat(gr.id)));
        for (const c of this.customers) if (c.greet) this.tweens.add({ targets: c.greet.tag, x: { from: c.greet.tag.x - 2, to: c.greet.tag.x }, duration: 200, ease: 'Elastic.easeOut' });
      } else this.waiting().forEach((c) => c.bubble!.shake());
    }
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
  private serve(c: Customer, typed?: string) {
    if (c.state !== 'wait' || !c.order || !c.bubble) return;
    const o = c.order;
    // answered with an alternative (버스 instead of 지하철): credit those words
    if (typed && o.alts) {
      const alt = o.alts.find((a) => matchKind(typed, joinTokens(a)) === 'full');
      if (alt && matchKind(typed, o.target) !== 'full') { o.tokens = alt; o.mistakes = alt.map((_, i) => o.mistakes[i] ?? false); }
    }
    if (this.coop) { this.coopServe(c, o); return; }
    const b = c.bubble;
    const clean = !o.mistakes.some(Boolean);
    if (o.reaction) { this.answerReaction(c, clean); return; }
    c.lastItem = o.tokens[0].id;
    G.ime.clear();
    this.box.success();
    this.tutorialText?.destroy();
    this.tutorialText = undefined;
    // learning
    o.tokens.forEach((t, i) => G.setStat(t.id, recordServe(G.stat(t.id), { clean: !o.mistakes[i], hinted: o.hinted, night: this.n })));
    o.tokens.forEach((t) => this.recent.push(t.id));
    if (clean && !o.hinted && c.kind !== 'generic' && c.kind !== 'boss') this.cleanServes[c.kind] = (this.cleanServes[c.kind] ?? 0) + 1;
    if (clean && !o.hinted) {
      // lifetime stats for the badges
      const st = G.data.stats;
      st.cleanServed = (st.cleanServed ?? 0) + 1;
      st.shiftClean = st.shiftClean ?? {};
      for (const t of o.tokens) for (const j of new Set(rawJamo(t.ko).flatMap((x) => [x.initial, x.medial, x.final]))) {
        if (SHIFT_JAMO.includes(j)) st.shiftClean[j] = (st.shiftClean[j] ?? 0) + 1;
      }
    }
    // score
    if (clean) this.combo++; else this.combo = 0;
    this.bestCombo = Math.max(this.bestCombo, this.combo);
    const diff = o.tokens.reduce((a, t) => a + word(t.id).difficulty, 0);
    const pay = serveCoins(diff, c.patience / c.max, this.combo, o.hinted || !!o.noTip);
    const total = Math.round(pay.total * this.seatMul * (c.priceMul ?? 1));
    this.coins += total;
    this.tips += Math.round(pay.tip * comboMultiplier(this.combo) * this.seatMul);
    this.updateCombo(true);
    // feedback
    c.state = 'eat';
    c.order = null;
    c.bubble = null;
    G.speech.cancel(c);
    if (b.listen) this.reveal(c, b, o); else this.popBubble(b);
    this.cookAndDeliver(c, o, total, pay.tip > 0);
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
      chef.once('animationcomplete', () => chef.play(this.combo > 0 && this.combo % 5 === 0 ? 'chef:happy' : 'chef:idle').once('animationcomplete', () => chef.play('chef:idle')));
      // dish slides along the counter
      G.audio.play('serve');
      const icons = o.icons;
      icons.forEach((ic, i) => {
        const dish = this.add.image(this.street.wx(-40), this.street.wy(-43), ...iconTex(ic)).setOrigin(0.5, 1).setDepth(DEPTH.dish);
        const tx = this.street.wx(this.street.seatX[c.seat]) + (icons.length > 1 ? (i - 0.5) * 18 : c.kind === 'nabi' ? -14 : 0);
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
    if (this.coop) {
      // co-op: coins were paid by the host's verdict, leaving comes as a message
      if (c.state === 'leave') return;
      c.sprite.play(`${c.key}:happy`);
      this.time.delayedCall(500, () => c.state !== 'leave' && c.sprite.play(`${c.key}:eat`));
      const cr = this.add.particles(c.sprite.x, c.sprite.y - 24, 'particles', {
        frame: [particleFrame('crumb'), particleFrame('heart')], lifespan: 700, speedY: { min: -30, max: -10 }, speedX: { min: -15, max: 15 }, gravityY: 40, frequency: 260, alpha: { start: 1, end: 0 },
      }).setDepth(DEPTH.fx);
      this.time.delayedCall(1700, () => cr.destroy());
      return;
    }
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
      if (c.kind === 'boss' && --c.ordersLeft > 0) {
        c.sprite.play(`${c.key}:idle`);
        this.time.delayedCall(900, () => { if (!this.ended) { c.state = 'wait'; this.newOrder(c); } });
        return;
      }
      if (c.kind === 'boss') this.critic.done = true;
      if (!this.ended && this.maybeReact(c)) return;
      this.leave(c, true);
    });
  }

  private flyCoins(x: number, y: number, amount: number) {
    const n = Math.min(8, Math.max(1, Math.ceil(amount / 4)));
    for (let i = 0; i < n; i++) {
      const coin = this.add.sprite(x, y, 'coin').play('coin:spin').setDepth(DEPTH.fx);
      const myTag = this.coop?.tags.get(this.coop.me);
      const tx = myTag ? myTag.x + 7 : this.coinIcon.x, ty = myTag ? myTag.y + 6 : this.coinIcon.y;
      const mx = x + (this.rand() - 0.5) * 50, my = y - 30 - this.rand() * 30;
      const curve = new Phaser.Curves.QuadraticBezier(new Phaser.Math.Vector2(x, y), new Phaser.Math.Vector2(mx, my), new Phaser.Math.Vector2(tx, ty));
      const t = { v: 0 };
      this.tweens.add({
        targets: t, v: 1, duration: 520 + i * 60, delay: i * 50, ease: 'Sine.easeIn',
        onUpdate: () => { const p = curve.getPoint(t.v); coin.setPosition(Math.round(p.x), Math.round(p.y)); },
        onComplete: () => {
          coin.destroy();
          G.audio.play('coin', { detune: i * 90, volume: 0.6 });
          if (myTag) { this.tweens.add({ targets: myTag.dot, scale: { from: 1.8, to: 1 }, duration: 160 }); return; }
          this.coinText.setText(String(this.coins));
          snapText(this.coinText);
          this.tweens.add({ targets: this.coinIcon, scale: { from: 1.5, to: 1 }, duration: 160 });
        },
      });
    }
  }

  private updateCombo(bump = false) {
    const m = comboMultiplier(this.combo);
    if (this.combo >= 5) {
      this.comboText.setText(`KOMBO ×${m.toLocaleString('cs-CZ')}  (${this.combo})`).setColor(m >= 2 ? C.pink : C.yellow);
      snapText(this.comboText);
      if (bump) {
        this.tweens.add({ targets: this.comboText, scale: { from: 1.5, to: 1 }, duration: 260, ease: 'Back.easeOut' });
        if (this.combo % 5 === 0) { G.audio.play('combo'); this.street.flash(Math.round(m * 2)); }
      }
    } else this.comboText.setText('');
  }

  private leave(c: Customer, happy: boolean) {
    c.state = 'leave';
    G.speech.cancel(c);
    if (c.bubble) {
      const b = c.bubble;
      c.bubble = null;
      this.tweens.add({ targets: b, alpha: 0, y: b.y - 6, duration: 200, onComplete: () => b.destroy() });
    }
    c.order = null;
    this.closeGreeting(c);
    if (happy && c.kind !== 'nabi' && !this.coop) this.openGreeting(c, 'bye');
    this.time.delayedCall(happy ? 0 : 700, () => {
      this.seatsTaken[c.seat] = null;
      c.sprite.play(`${c.key}:walk`);
      if (c.kind === 'nabi') c.sprite.setFlipX(true);
      const tx = this.street.wx(150);
      this.tweens.add({
        targets: c.sprite, x: tx, duration: (Math.abs(tx - c.sprite.x) / (happy ? 45 : 60)) * 1000, onComplete: () => {
          this.closeGreeting(c);
          c.sprite.destroy();
          this.customers = this.customers.filter((o) => o !== c);
          this.checkEnd();
        },
      });
    });
  }

  private walkOut(c: Customer) {
    const o = c.order!;
    if (o.reaction) {
      const b = c.bubble!;
      c.bubble = null;
      this.tweens.add({ targets: b, alpha: 0, y: b.y - 6, duration: 200, onComplete: () => b.destroy() });
      this.leave(c, true);
      return;
    }
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
    floatText(this, c.sprite.x, c.sprite.y - 46, c.kind === 'boss' ? '−★★' : 'hmpf!', C.red);
    if (c.kind === 'boss') {
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
    if (this.listen) for (const c of this.customers) c.bubble?.setTalking(G.speech.speaking(c));
    if (this.paused || this.ended) return;
    if (this.coop) { this.coopUpdate(dtMs); return; }
    const dt = (dtMs / 1000) * G.speed;
    if (!this.intro) {
      this.clock += dt;
      // arrivals
      if (this.queue.length && this.clock >= this.nextArrival) {
        const kind = this.queue[0];
        const bossWaiting = !!this.def.boss && kind !== 'boss' && this.arrived === 0;
        if (!bossWaiting && this.spawn(kind)) {
          this.queue.shift();
          const [a, b] = spawnInterval(this.def.spawn, this.seats);
          this.nextArrival = this.clock + a + this.rand() * (b - a);
        } else this.nextArrival = this.clock + 0.5;
      }
      // boss night: once the critic is done, nobody new comes
      if (this.def.boss && this.critic.done) this.queue = [];
      // patience
      for (const c of this.customers) {
        if (c.state !== 'wait' || !c.bubble) continue;
        if (c.tutorial && this.served === 0) { c.bubble.setPatience(1); continue; }
        if (!c.heard) { c.bubble.setPatience(1); continue; }
        if (!c.stays) c.patience -= dt;
        const f = c.patience / c.max;
        c.bubble.setPatience(f);
        if (c.order?.reaction) { if (c.patience <= 0) this.walkOut(c); continue; }
        if (f < 0.28 && c.kind !== 'nabi' && c.sprite.anims.currentAnim?.key !== `${c.key}:angry`) c.sprite.play(`${c.key}:angry`);
        else if (f >= 0.28 && f < 0.6 && c.kind !== 'nabi' && c.sprite.anims.currentAnim?.key === `${c.key}:idle`) c.sprite.play(`${c.key}:neutral`);
        if (c.patience <= 0) this.walkOut(c);
      }
      this.checkHelper();
      this.updateGreetings();
    }
  }

  // ------------------------------------------------------------- helper 김 대리
  private checkHelper() {
    const ws = this.waiting();
    if (!ws.length || !this.street.helper) return;
    const pick = helperPick(ws.map((c) => ({ frac: c.patience / c.max, eligible: c.kind !== 'boss' && !c.tutorial && !c.order!.reaction })), this.helped, this.seats, G.hasUpgrade('helper'));
    if (pick >= 0) this.helperServe(ws[pick]);
  }

  private helperServe(c: Customer) {
    const o = c.order!, b = c.bubble!;
    c.lastItem = o.tokens[0].id;
    this.helped++;
    G.speech.cancel(c);
    c.state = 'eat';
    c.order = null;
    c.bubble = null;
    // no tip, no mastery: just the base price
    const diff = o.tokens.reduce((a, t) => a + word(t.id).difficulty, 0);
    const coins = Math.round(serveCoins(diff, 0, 0, true).base * this.seatMul);
    this.coins += coins;
    this.popBubble(b);
    const h = this.street.helper!;
    this.say(h.x, h.y - 42, '제가 할게요!', 'To vezmu já!');
    h.play('char_kim_helper:wave');
    G.audio.play('bell', { volume: 0.5, detune: 300 });
    this.time.delayedCall(600, () => {
      h.play('char_kim_helper:cook');
      G.audio.play('sizzle', { volume: 0.5 });
      this.time.delayedCall(800, () => {
        h.play('char_kim_helper:idle');
        G.audio.play('serve');
        o.icons.forEach((ic, i) => {
          const dish = this.add.image(h.x + 14, this.street.wy(-43), ...iconTex(ic)).setOrigin(0.5, 1).setDepth(DEPTH.dish);
          const tx = this.street.wx(this.street.seatX[c.seat]) + (o.icons.length > 1 ? (i - 0.5) * 18 : c.kind === 'nabi' ? -14 : 0);
          this.tweens.add({
            targets: dish, x: tx, duration: 300 + Math.abs(tx - dish.x) * 1.2, ease: 'Cubic.easeOut', delay: i * 80,
            onComplete: () => {
              if (i === 0) this.startEating(c, coins, false);
              this.time.delayedCall(1300, () => this.tweens.add({ targets: dish, alpha: 0, duration: 300, onComplete: () => dish.destroy() }));
            },
          });
        });
      });
    });
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  /** Small speech bubble: Korean line + Czech subtitle. */
  private say(x: number, y: number, ko: string, cs: string, ms = 1800) {
    const W = this.scale.width;
    const k = txt(this, 0, 3, ko, { size: 'm', color: C.ink, origin: [0.5, 0] });
    const t = txt(this, 0, 17, cs, { size: 'xs', color: C.brown, origin: [0.5, 0] });
    const bw = Math.max(k.width, t.width) + 10, bh = 30;
    const bx = Phaser.Math.Clamp(Math.round(x), Math.round(bw / 2) + 2, Math.round(W - bw / 2 - 2));
    const bg = this.add.nineslice(0, 0, 'bubble', undefined, bw, bh, 5, 5, 5, 5).setOrigin(0.5, 0);
    const tail = this.add.image(Phaser.Math.Clamp(Math.round(x - bx) - 3, -bw / 2 + 4, bw / 2 - 10), bh - 2, 'bubble_tail').setOrigin(0, 0);
    const c = this.add.container(bx, Math.round(y - bh), [bg, tail, k, t]).setDepth(DEPTH.bubble + 1);
    c.setScale(0.3).setAlpha(0);
    this.tweens.add({ targets: c, scale: 1, alpha: 1, duration: 200, ease: 'Back.easeOut' });
    this.tweens.add({ targets: c, alpha: 0, y: c.y - 6, delay: ms, duration: 250, onComplete: () => c.destroy() });
    return c;
  }

  // ------------------------------------------------------------- politeness
  /** Greeting words the player can type tonight (all their jamo introduced). */
  private greetWords(kind: GreetKind): string[] {
    return (kind === 'hello' ? HELLO_WORDS : BYE_WORDS).filter((id) => this.ready(id));
  }

  /** All keys introduced – and compound / Shift vowels (ㅝ, ㅖ…) introduced as letters too. */
  private ready(id: string): boolean {
    const ko = word(id).ko;
    return jamoSet(ko).every((j) => this.known.has(j))
      && rawJamo(ko).every((s) => !(COMPOUND_VOWELS.has(s.medial) || SHIFT_VOWELS.has(s.medial)) || this.known.has(s.medial));
  }

  private activeGreetings(): Greeting[] {
    const out: Greeting[] = [];
    for (const kind of ['hello', 'bye'] as GreetKind[]) {
      if (!this.customers.some((c) => c.greet?.kind === kind)) continue;
      for (const id of this.greetWords(kind)) out.push({ id, ko: word(id).ko, kind });
    }
    if (this.customers.some((c) => c.haggle)) for (const id of HAGGLE_WORDS) out.push({ id, ko: word(id).ko, kind: 'haggle' });
    return out;
  }

  private openGreeting(c: Customer, kind: GreetKind) {
    const ids = this.greetWords(kind);
    if (!ids.length) return;
    // suggest the least practised word; hint like orders (by mastery)
    const id = [...ids].sort((a, b) => G.stat(a).mastery - G.stat(b).mastery || this.rand() - 0.5)[0];
    const w = word(id);
    const lvl = hintLevel(G.stat(id).mastery);
    const label = lvl === 'full' ? w.ko : lvl === 'partial' ? [...w.ko][0] + '…' : '';
    const tag = this.add.container(0, 0).setDepth(DEPTH.bubble + 2);
    const icon = this.add.image(0, 0, 'uiicons', iconFrame(kind === 'hello' ? 'hand' : 'door')).setOrigin(0, 0.5);
    const t = txt(this, 15, 0, label, { size: 'xs', color: C.ink, origin: [0, 0.5] });
    const bw = label ? t.width + 19 : 16;
    const bg = this.add.nineslice(-2, 0, 'bubble', undefined, bw, 14, 5, 5, 5, 5).setOrigin(0, 0.5);
    tag.add([bg, icon, t]);
    tag.setSize(bw, 14);
    const window = c.kind === 'boss' && kind === 'hello' ? BOSS_GREET_WINDOW : GREET_WINDOW;
    c.greet?.tag.destroy();
    c.greet = { kind, until: this.clock + window, tag };
    this.placeGreeting(c);
    tag.setScale(0.2);
    this.tweens.add({ targets: tag, scale: 1, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: icon, angle: { from: -12, to: 12 }, yoyo: true, repeat: -1, duration: 260, ease: 'Sine.easeInOut' });
  }

  private placeGreeting(c: Customer) {
    const g = c.greet;
    if (!g) return;
    const W = this.scale.width;
    let x: number, y: number;
    if (c.bubble) { x = c.bubble.x - 3; y = c.bubble.y - 3; }
    else { x = c.sprite.x - 8; y = c.sprite.y - 48; }
    g.tag.setPosition(Math.round(Math.max(3, Math.min(W - g.tag.width, x))), Math.round(Math.max(30, y)));
  }

  // ------------------------------------------------------------- 용산 haggling
  private maybeHaggle(c: Customer) {
    if (DISTRICTS[homeDistrict(this.def)].mechanic !== 'haggle' || c.kind === 'boss' || c.kind === 'nabi' || c.tutorial) return;
    if (!HAGGLE_WORDS.every((id) => this.ready(id)) || this.rand() >= HAGGLE_CHANCE) return;
    this.time.delayedCall(1300, () => {
      if (c.state !== 'wait' || !c.bubble || c.order?.reaction || this.ended) return;
      const tag = this.add.container(0, 0).setDepth(DEPTH.bubble + 3);
      const t1 = txt(this, 4, 3, 'To je drahé!', { size: 'xs', color: C.red });
      const hint = HAGGLE_WORDS.map((id) => {
        const w = word(id);
        if (this.listen) return listenHint(w.ko, G.stat(id).mastery, (ch) => splitSyllable(ch)?.initial ?? ch) || '?';
        const lvl = hintLevel(G.stat(id).mastery);
        return lvl === 'full' ? w.ko : lvl === 'partial' ? [...w.ko][0] + '…' : '?';
      }).join(' / ');
      const t2 = txt(this, 4, 12, hint, { size: 'xs', color: C.ink });
      const bw = Math.max(t1.width, t2.width) + 8;
      const bg = this.add.nineslice(0, 0, 'bubble', undefined, bw, 23, 5, 5, 5, 5).setOrigin(0, 0);
      tag.add([bg, t1, t2]).setSize(bw, 23);
      c.haggle = { until: this.clock + HAGGLE_WINDOW, tag };
      c.sprite.play(`${c.key}:neutral`);
      this.placeHaggle(c);
      tag.setScale(0.3);
      this.tweens.add({ targets: tag, scale: 1, duration: 220, ease: 'Back.easeOut' });
      G.audio.play('hint', { detune: -300 });
      // Poslech: the trader says it – "할인?"
      if (this.listen) void G.speech.speak(`${word('harin').ko}?`, { tag: c, rate: G.voiceRate() });
    });
  }

  private placeHaggle(c: Customer) {
    if (!c.haggle) return;
    const W = this.scale.width;
    const b = c.bubble;
    const x = b ? b.x + b.bw - c.haggle.tag.width + 6 : c.sprite.x;
    const y = b ? b.y - 18 : c.sprite.y - 60;
    c.haggle.tag.setPosition(Math.round(Math.max(2, Math.min(W - c.haggle.tag.width - 2, x))), Math.round(Math.max(26, y)));
  }

  private closeHaggle(c: Customer) {
    const h = c.haggle;
    if (!h) return;
    c.haggle = undefined;
    this.tweens.add({ targets: h.tag, alpha: 0, duration: 180, onComplete: () => h.tag.destroy() });
  }

  private haggleAnswer(g: Greeting) {
    G.setStat(g.id, recordServe(G.stat(g.id), { clean: !this.greetDirty, hinted: false, night: this.n }));
    this.greetDirty = false;
    this.haggles++;
    for (const c of this.customers.filter((x) => x.haggle)) {
      this.closeHaggle(c);
      if (g.id === 'harin') {
        c.priceMul = DISCOUNT_MUL;
        c.stays = true;
        c.patience = c.max;
        floatText(this, c.sprite.x, c.sprite.y - 46, 'sleva −25 %', C.green);
        if (c.state === 'wait') c.sprite.play(`${c.key}:happy`);
        this.time.delayedCall(700, () => { if (c.state === 'wait') c.sprite.play(`${c.key}:idle`); });
        G.audio.play('coin', { detune: -200 });
      } else if (this.rand() < INSIST_LEAVE) {
        floatText(this, c.sprite.x, c.sprite.y - 46, 'Tak nic…', C.grey);
        this.lost++;
        const b = c.bubble;
        c.bubble = null; c.order = null;
        if (b) this.tweens.add({ targets: b, alpha: 0, duration: 200, onComplete: () => b.destroy() });
        this.updateProgress();
        this.leave(c, false);
      } else {
        c.priceMul = INSIST_MUL;
        floatText(this, c.sprite.x, c.sprite.y - 46, 'cena +50 %', C.yellow);
        G.audio.play('combo', { volume: 0.5 });
      }
    }
    this.onInput('', false, true);
  }

  private closeGreeting(c: Customer, ok = false) {
    const g = c.greet;
    if (!g) return;
    c.greet = undefined;
    this.tweens.killTweensOf(g.tag);
    if (ok) this.tweens.add({ targets: g.tag, scale: 1.4, alpha: 0, duration: 200, onComplete: () => g.tag.destroy() });
    else this.tweens.add({ targets: g.tag, alpha: 0, duration: 200, onComplete: () => g.tag.destroy() });
  }

  private updateGreetings() {
    for (const c of this.customers) {
      if (c.haggle) {
        this.placeHaggle(c);
        if (c.state !== 'wait' || c.haggle.until <= this.clock) this.closeHaggle(c);
      }
      if (!c.greet) continue;
      this.placeGreeting(c);
      const left = c.greet.until - this.clock;
      if (left < 1.2) c.greet.tag.setAlpha(Math.floor(this.clock * 6) % 2 ? 0.4 : 1);
      if (left <= 0) {
        if (c.kind === 'boss' && c.greet.kind === 'hello' && !this.criticGreeted) {
          this.critic.mistakes++;
          floatText(this, c.sprite.x, c.sprite.y - 44, '−★ bez pozdravu', C.red);
          c.sprite.play(`${c.key}:neutral`);
          this.time.delayedCall(700, () => c.state === 'wait' && c.sprite.play(`${c.key}:idle`));
          G.audio.play('angry', { volume: 0.6 });
        }
        this.closeGreeting(c);
      }
    }
  }

  private greet(g: Greeting) {
    G.ime.clear();
    this.box.success();
    if (g.kind === 'haggle') { this.haggleAnswer(g); return; }
    const targets = this.customers.filter((c) => c.greet?.kind === g.kind);
    G.setStat(g.id, recordServe(G.stat(g.id), { clean: !this.greetDirty, hinted: false, night: this.n }));
    this.greetDirty = false;
    this.greetings++;
    G.audio.play(g.kind === 'hello' ? 'bell' : 'coin', { detune: 400 });
    for (const c of targets) {
      this.closeGreeting(c, true);
      const coins = g.kind === 'hello' ? HELLO_COINS : BYE_COINS;
      this.coins += coins;
      this.flyCoins(c.sprite.x, c.sprite.y - 30, coins);
      floatText(this, c.sprite.x, c.sprite.y - 46, `+${coins} ♥`, C.pink);
      if (g.kind === 'hello') {
        if (c.kind === 'boss') this.criticGreeted = true;
        c.patience = Math.min(c.max, c.patience + c.max * HELLO_PATIENCE);
        if (c.state === 'wait') {
          c.sprite.play(`${c.key}:happy`);
          this.time.delayedCall(700, () => { if (c.state === 'wait') c.sprite.play(`${c.key}:idle`); });
        }
      }
      const hearts = this.add.particles(c.sprite.x, c.sprite.y - 34, 'particles', {
        frame: particleFrame('heart'), lifespan: 700, speedY: { min: -40, max: -20 }, speedX: { min: -20, max: 20 }, alpha: { start: 1, end: 0 }, emitting: false,
      }).setDepth(DEPTH.fx);
      hearts.explode(4);
      this.time.delayedCall(800, () => hearts.destroy());
    }
    this.onInput('', false, true);
  }

  /** After the meal: maybe a reaction bubble the player answers with an adjective. */
  private maybeReact(c: Customer): boolean {
    if (this.n < REACTIONS_FROM || this.def.district === 'pharmacy' || c.kind === 'nabi' || c.kind === 'boss' || !c.lastItem) return false;
    if (this.rand() >= REACTION_CHANCE) return false;
    // things that are not food are never "tasty"
    const table = ITEM_REACTIONS[c.lastItem] ? ITEM_REACTIONS : { [c.lastItem]: (word(c.lastItem).category === 'food' ? ['tasty', 'good', 'okay'] : ['good', 'okay']) as ReactionId[] };
    const r = pickReaction(c.lastItem, table, this.rand, (x) => this.ready(REACTIONS[x].word));
    if (!r) return false;
    this.react(c, r);
    return true;
  }

  private react(c: Customer, r: ReactionId) {
    const w = word(REACTIONS[r].word);
    c.order = { tokens: [{ id: w.id, ko: w.ko }], target: w.ko, cs: REACTIONS[r].cs, icons: [w.icon], hinted: false, mistakes: [false], kind: c.kind, reaction: r };
    c.state = 'wait';
    c.max = c.patience = REACTION_TIME;
    c.sprite.play(`${c.key}:happy`);
    const b = new Bubble(this, c.order, 66, { listen: this.listen });
    c.bubble = b;
    this.placeBubble(c);
    b.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 220, ease: 'Back.easeOut' });
    G.audio.play('hint', { detune: 200 });
    // Poslech: the customer says the adjective; reactions are short, the timer runs at once
    if (this.listen) { c.heard = true; c.replays = 0; c.autoReplayed = false; this.sayOrder(c, G.voiceRate()); }
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  private answerReaction(c: Customer, clean: boolean) {
    const o = c.order!, b = c.bubble!;
    G.ime.clear();
    this.box.success();
    G.setStat(o.tokens[0].id, recordServe(G.stat(o.tokens[0].id), { clean, hinted: o.hinted, night: this.n }));
    this.reactions++;
    c.order = null;
    c.bubble = null;
    G.speech.cancel(c);
    if (b.listen) this.reveal(c, b, o); else this.popBubble(b);
    this.coins += REACTION_COINS;
    this.flyCoins(c.sprite.x, c.sprite.y - 30, REACTION_COINS);
    floatText(this, c.sprite.x, c.sprite.y - 46, `+${REACTION_COINS} 네!`, C.green);
    c.state = 'eat';
    c.sprite.play(`${c.key}:happy`);
    this.time.delayedCall(500, () => this.leave(c, true));
    this.onInput('', false, true);
  }

  private checkEnd() {
    if (this.coop) return;
    if (this.ended || this.queue.length || this.customers.length) return;
    this.ended = true;
    this.updateTapArea();
    this.time.delayedCall(700, () => this.finish());
  }

  private finish() {
    const total = this.served + this.angry;
    const boss = !!this.def.boss;
    const stars = boss ? criticStars(this.critic.mistakes, this.critic.walkouts) : nightStars({ total, served: this.served, angry: this.angry, mistakes: this.mistakes });
    const d = G.data, t = G.track();
    const rec = t.nights[this.n] ?? { stars: 0, bestCoins: 0, plays: 0 };
    t.nights[this.n] = { stars: Math.max(rec.stars, stars), bestCoins: Math.max(rec.bestCoins, this.coins), plays: rec.plays + 1, seats: Math.max(rec.seats ?? 0, this.seats) };
    d.coins += this.coins;
    d.stats.served += this.served;
    d.stats.mistakes += this.mistakes;
    d.stats.nightsPlayed++;
    d.stats.bestCombo = Math.max(d.stats.bestCombo ?? 0, this.bestCombo);
    d.stats.greetings = (d.stats.greetings ?? 0) + this.greetings;
    if (this.listen && this.replaysAsked === 0 && stars > 0) d.stats.listenNoReplay = (d.stats.listenNoReplay ?? 0) + 1;
    let dailyCounted: boolean | undefined;
    if (this.n === DAILY_NIGHT) dailyCounted = recordDaily(t.daily, dayKey(new Date()), { stars, coins: this.coins, served: this.served, total });
    for (const [k, v] of Object.entries(this.cleanServes)) {
      const f = t.friends[k] ?? { clean: 0, chapter: 0 };
      t.friends[k] = { ...f, clean: f.clean + (v ?? 0) };
    }
    G.markPlayedToday();
    const newWords = Object.entries(t.words).filter(([id, s]) => s.seen > 0 && !this.seenBefore.has(id)).map(([id]) => id);
    const trouble = [...this.trouble.entries()].sort((a, b) => b[1] - a[1]).map(([id]) => id).slice(0, 3);
    G.save.save();
    const summary: NightSummary = {
      night: this.n, stars, total, served: this.served, angry: this.angry, mistakes: this.mistakes, coins: this.coins, tips: this.tips,
      bestCombo: this.bestCombo, newWords, trouble, regularsSeen: this.regularsSeen, clean: this.cleanServes, seats: this.seats, helped: this.helped, greetings: this.greetings, reactions: this.reactions, haggles: this.haggles,
      critic: boss ? { stars, mistakes: this.critic.mistakes, walkouts: this.critic.walkouts } : undefined,
      dailyCounted, listen: this.listen, replays: this.replaysAsked, firstClear: stars > 0 && rec.stars === 0,
    };
    G.ime.deactivate();
    goto(this, 'Result', summary, 500);
  }

  // ------------------------------------------------------------- co-op
  private coopSetup() {
    const k = this.coop!;
    const s = k.s;
    if (s.isHost) {
      // the host's own settings decide patience (no personal "relaxed" in co-op)
      const patMul = patienceMultiplier(G.data.upgrades, false, this.street.raining);
      k.director = new CoopDirector(s, this.def, k.start.total, k.start.seats, this.pool, rng(k.start.seed + 1), patMul, this.newTonight, k.start.track === 'listen');
    }
    for (const p of s.players) k.coins.set(p.pid, 0);
    this.coinIcon.setVisible(false);
    this.coinText.setVisible(false);
    s.players.forEach((p) => {
      const tag = new PlayerTag(this, 0, 0, p, 60, '0').setDepth(DEPTH.hud);
      k.tags.set(p.pid, tag);
    });
    this.layoutTags();
    k.offs.push(s.onMsg((m) => this.onCoopMsg(m)));
    s.onLobby = () => this.updateTags();
    s.toHost({ t: 'ready' });
  }

  private layoutTags() {
    const k = this.coop;
    if (!k) return;
    const W = this.scale.width;
    const n = Math.max(1, k.tags.size);
    const w = Math.min(84, Math.floor((W - 8) / n) - 3);
    let i = 0;
    for (const tag of k.tags.values()) {
      tag.setPosition(Math.round(4 + i * (w + 3)), 25);
      tag.bg.width = w;
      tag.w = w;
      tag.value.x = w - 4;
      i++;
    }
  }

  private updateTags() {
    const k = this.coop;
    if (!k) return;
    for (const [pid, tag] of k.tags) {
      tag.setValue(String(k.coins.get(pid) ?? 0));
      tag.setGone(!k.s.players.some((p) => p.pid === pid));
    }
  }

  private hostNow(): number {
    const k = this.coop!;
    if (k.director) return k.director.clock;
    return k.lastTick + (performance.now() - k.tickAt) * G.speed;
  }

  private coopUpdate(dtMs: number) {
    const k = this.coop!;
    k.director?.update(dtMs * G.speed);
    const now = this.hostNow();
    for (const c of this.customers) {
      if (!c.coop || c.state !== 'wait' || !c.bubble) continue;
      if (c.coop.runoffAt !== undefined) { c.bubble.setRunoff(1 - (now - c.coop.runoffAt) / RUNOFF_MS); continue; }
      const f = patienceFrac(c.coop.at, c.coop.patienceMs, now);
      c.bubble.setPatience(f);
      if (f < 0.28 && c.sprite.anims.currentAnim?.key !== `${c.key}:angry`) c.sprite.play(`${c.key}:angry`);
      else if (f >= 0.28 && f < 0.6 && c.sprite.anims.currentAnim?.key === `${c.key}:idle`) c.sprite.play(`${c.key}:neutral`);
    }
  }

  private byCid(cid: number): Customer | undefined {
    return this.customers.find((c) => c.coop?.cid === cid);
  }

  private player(pid: number) {
    return this.coop!.roster.find((p) => p.pid === pid) ?? null;
  }

  private onCoopMsg(m: Msg) {
    const k = this.coop!;
    if (this.ended && m.t !== 'end') return;
    switch (m.t) {
      case 'tick': if (!k.director) { k.lastTick = m.ms; k.tickAt = performance.now(); } break;
      case 'spawn': this.coopSpawn(m); break;
      case 'served': this.coopServed(m.cid, m.pid, m.coins); break;
      case 'runoff': this.coopRunoff(m.cid, m.pid, m.coins); break;
      case 'close': {
        const c = this.byCid(m.cid);
        if (c && c.state === 'wait' && c.bubble) {
          this.dropTyping(c);
          G.speech.cancel(c);
          const b = c.bubble;
          c.bubble = null;
          c.order = null;
          c.state = 'eat';
          this.tweens.add({ targets: b, alpha: 0, y: b.y - 6, duration: 220, onComplete: () => b.destroy() });
          this.onInput(G.ime.state.text, G.ime.state.composing, true);
        }
        break;
      }
      case 'leave': this.coopLeave(m.cid, m.happy); break;
      case 'end': this.finishCoop(m.summary); break;
      default: break;
    }
  }

  private coopSpawn(m: Extract<Msg, { t: 'spawn' }>) {
    const sp = this.add.sprite(this.street.wx(140), 0, m.look).setOrigin(0.5, 1).setDepth(DEPTH.customer);
    const c: Customer = { kind: 'generic', key: m.look, sprite: sp, seat: m.seat, state: 'walk', patience: 1, max: 1, order: null, bubble: null, ordersLeft: 1,
      coop: { cid: m.cid, at: m.at, patienceMs: m.patienceMs, data: m.order } };
    this.seatsTaken[m.seat] = c;
    this.customers.push(c);
    this.arrived++;
    this.placeCustomer(c);
    sp.play(`${m.look}:walk`);
    // fixed walking time, so every phone opens the order at the same host time
    this.tweens.add({ targets: sp, x: this.street.wx(this.street.seatX[m.seat]), duration: COOP_WALK_MS, ease: 'Linear', onComplete: () => this.coopSit(c) });
  }

  private coopSit(c: Customer) {
    if (c.state !== 'walk' || this.ended) return;
    const d = c.coop!.data;
    c.state = 'wait';
    c.sprite.play(`${c.key}:idle`);
    G.audio.play('bell', { volume: 0.6 });
    const order: Order = {
      tokens: d.tokens.map((t) => ({ ...t })), target: d.target, alts: d.alts?.map((a) => a.map((t) => ({ ...t }))), cs: d.cs, icons: d.icons, extra: d.extra,
      hinted: false, mistakes: d.tokens.map(() => false), kind: 'generic',
    };
    c.order = order;
    const b = new Bubble(this, order, 70, { listen: this.listen });
    c.bubble = b;
    c.coop!.shownAt = performance.now();
    this.placeBubble(c);
    b.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 260, ease: 'Back.easeOut' });
    this.tellOrder(c);
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  /** A bubble disappears under the player's fingers: drop what they typed for it, no typo. */
  private dropTyping(c: Customer) {
    const text = G.ime.state.text;
    if (!text || !c.order) return;
    if (!orderTargets(c.order).some((t) => matchKind(text, t) !== 'none')) return;
    const others = this.waiting().filter((x) => x !== c && orderTargets(x.order!).some((t) => matchKind(text, t) !== 'none'));
    if (!others.length) G.ime.clear();
  }

  /** I finished typing an order (first or in the runoff): tell the host, pop it locally. */
  private coopServe(c: Customer, o: Order) {
    const k = this.coop!, cc = c.coop!;
    const b = c.bubble!;
    const clean = !o.mistakes.some(Boolean);
    G.ime.clear();
    this.box.success();
    o.tokens.forEach((t, i) => G.setStat(t.id, recordServe(G.stat(t.id), { clean: !o.mistakes[i], hinted: o.hinted, night: this.n })));
    o.tokens.forEach((t) => this.recent.push(t.id));
    cc.mine = true;
    cc.clean = clean;
    k.s.toHost({ t: 'done', cid: cc.cid, words: o.tokens.map((t) => t.id), ms: Math.round(performance.now() - (cc.shownAt ?? performance.now())), clean, hinted: o.hinted || !!o.noTip });
    c.state = 'eat';
    c.order = null;
    c.bubble = null;
    G.speech.cancel(c);
    if (b.listen) this.reveal(c, b, o);
    else if (cc.runoffAt !== undefined) this.tweens.add({ targets: b, scale: 1.12, alpha: 0, duration: 160, onComplete: () => b.destroy() });
    else this.popBubble(b);
    this.onInput('', false, true);
  }

  private coopServed(cid: number, pid: number, coins: number) {
    const k = this.coop!;
    const c = this.byCid(cid);
    k.coins.set(pid, (k.coins.get(pid) ?? 0) + coins);
    this.updateTags();
    this.served++;
    this.updateProgress();
    if (!c) return;
    const p = this.player(pid);
    if (pid === k.me) {
      this.coins += coins;
      this.combo = c.coop!.clean ? this.combo + 1 : 0;
      this.bestCombo = Math.max(this.bestCombo, this.combo);
      this.updateCombo(true);
      this.flyCoins(c.sprite.x, c.sprite.y - 30, coins);
      floatText(this, c.sprite.x, c.sprite.y - 46, `+${coins}`, C.yellow);
    } else {
      if (c.state === 'wait' && c.bubble && p) {
        c.bubble.markTaken(p.color, PFRAME[p.color], initial(p.name));
        c.coop!.runoffAt = this.hostNow();
        G.audio.play('beaten', { volume: 0.7 });
      }
      floatText(this, c.sprite.x, c.sprite.y - 46, `${p?.name ?? ''} +${coins}`, p ? PCOL[p.color] : C.yellow);
    }
    if (!c.coop!.cooked && c.state !== 'leave') {
      c.coop!.cooked = true;
      this.cookAndDeliver(c, { icons: c.coop!.data.icons } as Order, 0, false);
    }
  }

  private coopRunoff(cid: number, pid: number, coins: number) {
    const k = this.coop!;
    const c = this.byCid(cid);
    k.coins.set(pid, (k.coins.get(pid) ?? 0) + coins);
    this.updateTags();
    if (!c) return;
    if (pid === k.me) {
      this.coins += coins;
      G.audio.play('runoff_ok');
      this.flyCoins(c.sprite.x, c.sprite.y - 30, coins);
      floatText(this, c.sprite.x, c.sprite.y - 46, `+${coins} ½`, C.yellow);
    } else {
      const p = this.player(pid);
      floatText(this, c.sprite.x + 10, c.sprite.y - 40, `½ ${p?.name ?? ''}`, p ? PCOL[p.color] : C.grey);
    }
  }

  private coopLeave(cid: number, happy: boolean) {
    const c = this.byCid(cid);
    if (!c || c.state === 'leave') return;
    if (c.state === 'walk') this.tweens.killTweensOf(c.sprite);
    if (c.state === 'wait' && c.order) this.dropTyping(c);
    if (!happy) {
      // nobody served them in time
      if (c.order && c.state === 'wait') c.order.tokens.forEach((t) => {
        G.setStat(t.id, recordMissed(G.stat(t.id), this.n));
        this.trouble.set(t.id, (this.trouble.get(t.id) ?? 0) + 1);
      });
      this.angry++;
      this.combo = 0;
      this.updateCombo();
      this.updateProgress();
      G.audio.play('angry');
      c.sprite.play(`${c.key}:angry`);
      floatText(this, c.sprite.x, c.sprite.y - 46, 'hmpf!', C.red);
    }
    this.leave(c, happy);
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  /** Write my part of the night into my save (coins so far, co-op stats). */
  private payOut(summary?: CoopSummary) {
    const k = this.coop!;
    if (k.paid) return;
    k.paid = true;
    const d = G.data;
    const me = summary?.players.find((p) => p.pid === k.me);
    d.coins += me?.coins ?? this.coins;
    d.stats.bestCombo = Math.max(d.stats.bestCombo ?? 0, me?.bestCombo ?? this.bestCombo);
    if (summary) {
      d.stats.coopNights = (d.stats.coopNights ?? 0) + 1;
      d.stats.coopFirst = (d.stats.coopFirst ?? 0) + (me?.first ?? 0);
      d.stats.served += me?.first ?? 0;
      d.stats.mistakes += me?.mistakes ?? 0;
      G.markPlayedToday();
    }
    G.save.save();
  }

  private finishCoop(summary: CoopSummary) {
    if (this.ended) return;
    const k = this.coop!;
    this.ended = true;
    this.updateTapArea();
    this.payOut(summary);
    k.s.phase = 'lobby';
    G.ime.deactivate();
    this.time.delayedCall(900, () => goto(this, 'CoopResult', { summary, me: k.me }, 500));
  }

  /** The host closed the stall (or the connection died). */
  onNetClosed(why: string) {
    if (!this.coop || this.ended) return;
    this.ended = true;
    this.updateTapArea();
    this.payOut();
    G.ime.deactivate();
    toast(this, why, C.pink);
    this.time.delayedCall(1800, () => goto(this, 'Coop', { error: `${why} – mince z noci máš připsané.` }));
  }

  private askLeave() {
    const k = this.coop!;
    if (k.confirm) { k.confirm.destroy(); k.confirm = undefined; this.updateTapArea(); G.ime.focus(); return; }
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(DEPTH.overlay);
    c.add(this.add.rectangle(0, 0, W, H, 0x181425, 0.6).setOrigin(0, 0).setInteractive());
    const pw = 180, ph = 84, px = Math.round((W - pw) / 2), py = Math.round(H / 2 - ph / 2 - 30);
    c.add(panel(this, px, py, pw, ph));
    const q = k.s.isHost ? 'Zavřít stánek pro všechny?' : 'Odejít ze stánku?';
    c.add(txt(this, W / 2, py + 10, q, { size: 's', color: C.cream, origin: [0.5, 0], align: 'center', wrap: pw - 16 }));
    c.add(txt(this, W / 2, py + 26, 'Noc běží dál, mince z ní ti zůstanou.', { size: 'xs', color: C.grey, origin: [0.5, 0], align: 'center', wrap: pw - 16 }));
    c.add(button(this, W / 2 - 40, py + ph - 18, 70, 20, 'Ano', () => {
      this.ended = true;
      this.payOut();
      void k.s.close();
      goto(this, 'Coop');
    }, { size: 's' }));
    c.add(button(this, W / 2 + 40, py + ph - 18, 70, 20, 'Ne', () => this.askLeave(), { size: 's', style: 'wood' }));
    k.confirm = c;
    this.updateTapArea();
  }

  // ------------------------------------------------------------- pause
  onBack() {
    if (this.intro || this.ended) return;
    this.togglePause();
  }

  private togglePause() {
    if (this.ended) return;
    if (this.coop) { this.askLeave(); return; }
    if (this.pauseLayer) { this.pauseLayer.destroy(); this.pauseLayer = undefined; this.paused = false; this.tweens.resumeAll(); G.ime.focus(); this.updateTapArea(); return; }
    this.paused = true;
    G.speech.stop();
    this.updateTapArea();
    this.tweens.pauseAll();
    const W = this.scale.width, H = this.scale.height;
    const c = this.add.container(0, 0).setDepth(DEPTH.overlay);
    c.add(this.add.rectangle(0, 0, W, H, 0x181425, 0.7).setOrigin(0, 0).setInteractive());
    const pw = 160, ph = 120, px = Math.round(W / 2 - pw / 2), py = Math.round(H / 2 - ph / 2 - 30);
    c.add(panel(this, px, py, pw, ph));
    c.add(txt(this, W / 2, py + 10, 'Pauza', { size: 'l', color: C.yellow, origin: [0.5, 0] }));
    c.add(button(this, W / 2, py + 44, 120, 20, 'Pokračovat', () => this.togglePause(), { size: 's' }));
    c.add(button(this, W / 2, py + 70, 120, 20, 'Začít znovu', () => { this.tweens.resumeAll(); goto(this, 'Night', { night: this.n, seats: this.seats }); }, { size: 's', style: 'wood' }));
    c.add(button(this, W / 2, py + 96, 120, 20, 'Zpět na mapu', () => { this.tweens.resumeAll(); goto(this, 'Map'); }, { size: 's', style: 'wood' }));
    this.pauseLayer = c;
  }
}

void HEX;
