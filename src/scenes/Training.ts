// Training: 60 s, no customers – only bubbles with the words that need it
// most (SRS weight). No coins, mastery counts. Colour words the player can
// already type show up here too (that's how they unlock in the Barvírna).
import Phaser from 'phaser';
import { COLORS } from '../data/colors';
import { DISTRICTS, NIGHTS, homeDistrict, jamoKnown, nightDef } from '../data/levels';
import { jamoSet, matchAgainst } from '../logic/hangul';
import { recordMistake, recordServe, rng } from '../logic/srs';
import { ERROR_CLEAR_MS } from '../logic/rules';
import { TRAINING_BUBBLES, TRAINING_SECONDS, trainingPick, trainingPool } from '../logic/training';
import { Bubble } from '../game/bubble';
import { tokenAt, type Order } from '../game/orders';
import { G, WORDS, word } from '../game/state';
import { DEPTH, Street, particleFrame } from '../game/street';
import { TypeBox } from '../game/typebox';
import { checkAchievements } from '../game/achievements';
import { C, button, cssRect, fadeIn, floatText, goto, iconButton, panel, snapText, txt } from '../game/ui';

const INPUT_H = 46;
const SLOTS = [-12, 32, 76];

interface Slot { order: Order | null; bubble: Bubble | null; dirty: boolean }

export class TrainingScene extends Phaser.Scene {
  private street!: Street;
  private box!: TypeBox;
  private slots: Slot[] = [];
  private pool: string[] = [];
  private rand = Math.random;
  private left = TRAINING_SECONDS;
  private done = 0;
  private mistakes = 0;
  private ended = false;
  private inError = false;
  private started = false;
  private timerBar!: Phaser.GameObjects.Rectangle;
  private timerBg!: Phaser.GameObjects.Rectangle;
  private countText!: Phaser.GameObjects.Text;
  private hud!: Phaser.GameObjects.Container;
  private hintBtn!: Phaser.GameObjects.Container;
  private unsub?: () => void;
  /** Poslech: the words are said, the bubble shows a speaker (tap = again, free here). */
  private listen = false;
  private onImeTap = (e: PointerEvent) => this.tapAt(e.clientX, e.clientY);

  constructor() { super('Training'); }

  init() {
    this.slots = SLOTS.map(() => ({ order: null, bubble: null, dirty: false }));
    this.left = TRAINING_SECONDS;
    this.done = this.mistakes = 0;
    this.ended = this.inError = this.started = false;
    this.rand = rng(Date.now() & 0xffffffff);
    this.listen = G.listening && G.speech.ok;
  }

  create() {
    fadeIn(this, 300);
    const front = G.frontier();
    const backdrop = DISTRICTS[homeDistrict(nightDef(front))].backdrop;
    this.street = new Street(this, { backdrop, seats: 3, weather: false });
    // jamo met so far (every unlocked night) decides which extra words can appear
    const met = new Set<string>();
    for (const d of NIGHTS) if (G.isUnlocked(d.n)) jamoKnown(d.n).forEach((j) => met.add(j));
    const all = WORDS.filter((w) => w.category !== 'phrase').map((w) => ({ id: w.id, jamo: jamoSet(w.ko) }));
    this.pool = trainingPool(all, G.track().words, met, COLORS.map((c) => c.word));
    if (this.pool.length < 4) this.pool = ['cha', 'uyu', 'mul', 'dubu', 'mandu'];

    this.hud = this.add.container(0, 0).setDepth(DEPTH.hud);
    const W = this.scale.width;
    this.hud.add(this.add.rectangle(0, 0, W, 22, 0x181425, 0.85).setOrigin(0, 0).setName('bg'));
    this.hud.add(txt(this, 6, 11, 'Trénink', { size: 's', color: C.cream, origin: [0, 0.5] }));
    this.timerBg = this.add.rectangle(48, 9, 10, 5, 0x3a4466).setOrigin(0, 0);
    this.timerBar = this.add.rectangle(49, 10, 10, 3, 0x63c74d).setOrigin(0, 0);
    this.countText = txt(this, W - 8, 11, '0', { size: 'm', color: C.yellow, origin: [1, 0.5] });
    this.hud.add([this.timerBg, this.timerBar, this.countText]);

    this.box = new TypeBox(this, 4, 0, 10, INPUT_H - 6, this.listen ? 'Napiš, co slyšíš…' : 'Napiš slovo z bubliny…');
    this.box.root.setDepth(DEPTH.input);
    this.hintBtn = iconButton(this, 0, 0, 'help', () => this.hint(), 'wood').setDepth(DEPTH.input + 1);
    this.box.bg.setInteractive().on('pointerdown', () => G.ime.reopen());
    this.layout();

    G.ime.activate();
    this.unsub = G.ime.subscribe((s) => this.onInput(s.text, s.composing));
    G.ime.onKey = (e) => { if (e.key === 'Tab') this.hint(); };
    this.game.events.on('layout', this.layout, this);
    if (this.listen) G.ime.el.addEventListener('pointerdown', this.onImeTap);
    this.events.once('shutdown', () => {
      G.speech.stop();
      G.ime.el.removeEventListener('pointerdown', this.onImeTap);
      this.unsub?.();
      G.ime.onKey = null;
      G.ime.deactivate();
      this.game.events.off('layout', this.layout, this);
    });
    const banner = txt(this, W / 2, this.scale.height / 2 - 60, `Trénink · ${TRAINING_SECONDS} s`, { size: 'l', color: C.yellow, origin: [0.5, 0.5], shadow: true }).setDepth(DEPTH.overlay);
    banner.setScale(2).setAlpha(0);
    this.tweens.add({ targets: banner, scale: 1, alpha: 1, duration: 400, ease: 'Back.easeOut', hold: 700, yoyo: true, onComplete: () => banner.destroy() });
    this.time.delayedCall(900, () => { this.started = true; this.slots.forEach((_, i) => this.time.delayedCall(i * 250, () => this.fill(i))); });
  }

  onBack() { if (!this.ended) this.finish(); else goto(this, 'Map'); }

  private layout() {
    const W = this.scale.width, H = this.scale.height;
    const gy = H - INPUT_H;
    this.street.layout(gy);
    this.box.setPosition(28, gy + 3, W - 32);
    this.hintBtn.setPosition(15, gy + 3 + (INPUT_H - 6) / 2);
    (this.hud.getByName('bg') as Phaser.GameObjects.Rectangle).width = W;
    this.timerBg.width = W - 96;
    this.countText.setX(W - 8);
    this.slots.forEach((_, i) => this.placeBubble(i));
    if (!this.ended) G.ime.setTapArea(cssRect(this, 30, 24, W - 30, H - 24));
  }

  private placeBubble(i: number) {
    const b = this.slots[i].bubble;
    if (!b) return;
    const W = this.scale.width;
    // three bubbles floating in the sky above the stall, staggered
    const cx = Math.round(W * (0.2 + i * 0.3));
    const anchorY = this.street.wy(-140) - (i % 2) * 50;
    const x = Math.max(2, Math.min(W - b.bw - 2, Math.round(cx - b.bw / 2)));
    b.setPosition(x, Math.max(26, anchorY - b.bh));
    b.tail.setVisible(false);
  }

  private fill(i: number) {
    if (this.ended) return;
    const exclude = new Set(this.slots.filter((s) => s.order).map((s) => s.order!.tokens[0].id));
    const id = trainingPick(this.pool, G.track().words, exclude, this.rand);
    if (!id) return;
    const w = word(id);
    const order: Order = { tokens: [{ id, ko: w.ko }], target: w.ko, cs: w.cs, icons: [w.icon], extra: w.loan, hinted: false, mistakes: [false], kind: 'generic' };
    const b = new Bubble(this, order, 66, { listen: this.listen });
    b.setPatience(1);
    // no patience in training: drop the bar row
    b.bar.setVisible(false); b.barBg.setVisible(false); b.face.setVisible(false);
    b.bh -= 10;
    b.bg.setSize(b.bw, b.bh);
    this.slots[i] = { order, bubble: b, dirty: false };
    this.placeBubble(i);
    b.setScale(0.2).setAlpha(0);
    this.tweens.add({ targets: b, scale: 1, alpha: 1, duration: 240, ease: 'Back.easeOut' });
    this.tweens.add({ targets: b, y: b.y - 2, yoyo: true, repeat: -1, duration: 900 + i * 130, ease: 'Sine.easeInOut', delay: 260 });
    if (this.listen) void G.speech.speak(order.target, { tag: order, rate: G.voiceRate() });
    this.onInput(G.ime.state.text, G.ime.state.composing, true);
  }

  private active() { return this.slots.map((s, i) => ({ s, i })).filter((x) => x.s.order && x.s.bubble); }

  private onInput(text: string, composing: boolean, silent = false) {
    if (this.ended) return;
    if (!silent) this.box.set(text, composing);
    if (/[a-zA-Z]/.test(text)) { this.box.setHint('Přepni klávesnici na korejštinu (한/영)', C.orange); G.ime.clear(); return; }
    const act = this.active();
    const r = matchAgainst(text, act, (x) => x.s.order!.target);
    for (const x of act) x.s.bubble!.setMatch(text.length === 0 ? 'normal' : r.prefix.includes(x) ? 'hi' : 'dim');
    if (!text) { this.inError = false; return; }
    if (r.error) {
      if (this.inError) return;
      this.inError = true;
      this.mistakes++;
      G.audio.play('error');
      this.box.error();
      const prev = [...text].slice(0, -1).join('');
      const blamed = prev ? matchAgainst(prev, act, (x) => x.s.order!.target).prefix : [];
      for (const x of blamed) {
        const o = x.s.order!;
        o.mistakes[tokenAt(o, text)] = true;
        G.setStat(o.tokens[0].id, recordMistake(G.stat(o.tokens[0].id)));
        x.s.bubble!.shake();
      }
      this.time.delayedCall(ERROR_CLEAR_MS, () => { if (this.inError) G.ime.clear(); });
      return;
    }
    this.inError = false;
    if (r.full) this.serve(r.full.i);
  }

  private serve(i: number) {
    const s = this.slots[i];
    const o = s.order!, b = s.bubble!;
    G.ime.clear();
    this.box.success();
    const clean = !o.mistakes[0];
    G.setStat(o.tokens[0].id, recordServe(G.stat(o.tokens[0].id), { clean, hinted: o.hinted, night: 0 }));
    this.done++;
    this.countText.setText(String(this.done)); snapText(this.countText);
    this.tweens.add({ targets: this.countText, scale: { from: 1.5, to: 1 }, duration: 200 });
    G.audio.play('pop');
    const em = this.add.particles(0, 0, 'particles', {
      frame: [particleFrame('pop1'), particleFrame('pop2'), particleFrame('spark')], lifespan: 420, speed: { min: 50, max: 110 },
      alpha: { start: 1, end: 0 }, emitting: false,
    }).setDepth(DEPTH.fx);
    em.explode(12, b.x + b.bw / 2, b.y + b.bh / 2);
    this.time.delayedCall(500, () => em.destroy());
    floatText(this, b.x + b.bw / 2, b.y, clean && !o.hinted ? '+1 ★' : '+1', clean ? C.yellow : C.grey);
    this.tweens.killTweensOf(b);
    G.speech.cancel(o);
    if (this.listen) {
      // what it was: picture + Korean + Czech for a moment
      const r = new Bubble(this, { ...o, hinted: true }, 66);
      r.hidePatience();
      r.tail.setVisible(false);
      r.setPosition(Math.max(2, Math.min(this.scale.width - r.bw - 2, Math.round(b.x + b.bw / 2 - r.bw / 2))), Math.max(26, Math.round(b.y + b.bh - r.bh + 10)));
      b.destroy();
      this.time.delayedCall(1100, () => this.tweens.add({ targets: r, scale: 1.25, alpha: 0, duration: 120, onComplete: () => r.destroy() }));
    } else this.tweens.add({ targets: b, scale: 1.25, alpha: 0, duration: 120, onComplete: () => b.destroy() });
    this.street.chef.play('chef:cook');
    this.slots[i] = { order: null, bubble: null, dirty: false };
    this.time.delayedCall(this.listen ? 1300 : 350, () => this.fill(i));
    this.onInput('', false, true);
  }

  /** Poslech: tap on a bubble = hear it again (training has no tips to lose). */
  private tapAt(cx: number, cy: number) {
    if (this.ended) return;
    const r = this.game.canvas.getBoundingClientRect();
    const k = r.width / this.scale.width;
    const x = (cx - r.left) / k, y = (cy - r.top) / k;
    const hit = this.active().find(({ s: sl }) => x >= sl.bubble!.x && x <= sl.bubble!.x + sl.bubble!.bw && y >= sl.bubble!.y && y <= sl.bubble!.y + sl.bubble!.bh);
    if (!hit || G.speech.pending(hit.s.order)) return;
    G.audio.play('replay');
    void G.speech.speak(hit.s.order!.target, { tag: hit.s.order, rate: G.voiceRate() });
  }

  private hint() {
    if (this.ended) return;
    for (const x of this.active()) if (!x.s.order!.hinted) { x.s.order!.hinted = true; x.s.bubble!.refreshHint(); }
    G.audio.play('hint');
  }

  update(_t: number, dtMs: number) {
    this.street.update(dtMs);
    if (this.listen) for (const sl of this.slots) sl.bubble?.setTalking(G.speech.speaking(sl.order));
    if (!this.started || this.ended) return;
    this.left -= dtMs / 1000;
    const f = Math.max(0, this.left / TRAINING_SECONDS);
    this.timerBar.width = Math.round((this.timerBg.width - 2) * f);
    this.timerBar.fillColor = f > 0.3 ? 0x63c74d : Math.floor(this.time.now / 150) % 2 ? 0xe43b44 : 0xfeae34;
    if (this.left <= 0) this.finish();
  }

  private finish() {
    if (this.ended) return;
    this.ended = true;
    G.speech.stop();
    G.ime.deactivate();
    G.track().training.sessions++;
    const best = this.done > G.track().training.best;
    G.track().training.best = Math.max(G.track().training.best, this.done);
    G.save.save();
    G.audio.play(this.done ? 'fanfare' : 'fail');
    for (const s of this.slots) if (s.bubble) this.tweens.add({ targets: s.bubble, alpha: 0, duration: 200 });
    const W = this.scale.width, H = this.scale.height;
    const pw = Math.min(W - 24, 220), ph = 128;
    const c = this.add.container(Math.round((W - pw) / 2), Math.round(H / 2 - ph / 2 - 30)).setDepth(DEPTH.overlay);
    c.add(this.add.rectangle(-c.x, -c.y, W, H, 0x181425, 0.6).setOrigin(0, 0).setInteractive());
    c.add(panel(this, 0, 0, pw, ph));
    c.add(txt(this, pw / 2, 10, 'Trénink hotov!', { size: 'l', color: C.yellow, origin: [0.5, 0] }));
    c.add(txt(this, pw / 2, 34, `Procvičeno slov: ${this.done}`, { size: 'm', color: C.white, origin: [0.5, 0] }));
    c.add(txt(this, pw / 2, 50, `Překlepy: ${this.mistakes}   Rekord: ${G.track().training.best}${best && this.done ? ' (nový!)' : ''}`, { size: 's', color: best ? C.green : C.light, origin: [0.5, 0] }));
    c.add(txt(this, pw / 2, 64, 'Mince se tu nedávají, ale slova sílí.', { size: 'xs', color: C.grey, origin: [0.5, 0] }));
    c.add(button(this, pw / 2 - 52, ph - 22, 92, 22, 'Znovu', () => goto(this, 'Training'), { style: 'wood', size: 's' }));
    c.add(button(this, pw / 2 + 52, ph - 22, 92, 22, 'Na mapu', () => goto(this, 'Map'), { size: 's' }));
    c.setAlpha(0);
    this.tweens.add({ targets: c, alpha: 1, duration: 200 });
    this.time.delayedCall(600, () => checkAchievements(this));
  }
}
