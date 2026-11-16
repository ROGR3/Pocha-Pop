// Building orders (single words or critic sentences) and their bubble text.
import { hintLevel } from '../logic/srs';
import { pickWord } from '../logic/srs';
import { matchedJamo, splitSyllable, toJamo } from '../logic/hangul';
import { listenHint } from '../logic/track';
import { G, word } from './state';
import { COLORS } from '../data/colors';
import { CLOTHES } from '../data/clothes';
import { DESTINATIONS, TICKETED } from '../data/travel';
import { BODY_PARTS, SYMPTOMS } from '../data/pharmacy';
import { FAMILY_FOR } from '../data/family';
import { cap, colorAdj } from '../logic/czech';
import { colorOrderShape } from '../logic/rules';
import type { BossId, Mechanic, RegularId } from '../data/levels';
import type { ReactionId } from '../logic/polite';

export type Kind = 'generic' | 'boss' | RegularId;

export interface Token {
  id: string;
  ko: string;
  /** Written without a space after the previous token (모자하고). */
  glue?: boolean;
}

export interface Order {
  tokens: Token[];
  /** Korean the player must type. */
  target: string;
  /** Other accepted answers (e.g. 버스 or 지하철 to the airport). */
  alts?: Token[][];
  cs: string;
  icons: string[];
  /** Small extra line (loanword original). */
  extra?: string;
  hinted: boolean;
  /** Per-token mistake flags. */
  mistakes: boolean[];
  kind: Kind;
  /** Post-meal reaction (adjective) instead of a real order. */
  reaction?: ReactionId;
  /** Poslech: asked to hear it too often – no tip (mastery still counts). */
  noTip?: boolean;
}

export interface OrderCtx {
  pool: string[];
  newTonight: Set<string>;
  exclude: Set<string>;
  rand: () => number;
  mechanic: Mechanic;
  boss?: BossId;
  late?: boolean;
  /** colorItem: chance of a colour+item pair. */
  combo?: number;
}

const CAT_FOOD = ['uyu', 'mul', 'gogi', 'chikin', 'dubu', 'mandu', 'gimbap'];
const SWEET = ['gwaja', 'satang', 'ppang', 'tteokbokki', 'gimbap', 'gansik', 'juseu', 'beobeulti', 'aiseukeurim', 'bingsu', 'keikeu', 'chokollit', 'popkon', 'ttalgi', 'cha', 'uyu', 'dijeoteu', 'banana'];

const pick = (ctx: OrderCtx, pool: string[], newTonight = ctx.newTonight) => pickWord({ pool, stats: G.track().words, newTonight, exclude: ctx.exclude, rand: ctx.rand });
const ofCat = (pool: string[], ...cats: string[]) => pool.filter((id) => cats.includes(word(id).category));

export function makeOrder(kind: Kind, ctx: OrderCtx): Order {
  if (kind === 'boss') return bossSentence(ctx);
  if (kind === 'nabi') {
    // the cat only ever wants (known) cat food – shown as a picture
    const stats = G.track().words;
    const seen = CAT_FOOD.filter((id) => (stats[id]?.seen ?? 0) > 0);
    return single(pick(ctx, seen.length ? seen : CAT_FOOD.slice(0, 3), new Set()), kind);
  }
  if (ctx.mechanic === 'colorItem') return colorItem(ctx, kind);
  if (ctx.mechanic === 'destination' && ctx.rand() < 0.65) { const o = destinationOrder(ctx, kind); if (o) return o; }
  if (ctx.mechanic === 'symptom') return pharmacyOrder(ctx, kind);
  if (ctx.mechanic === 'family') {
    const fam = ofCat(ctx.pool, 'family');
    if (fam.length) { const id = pick(ctx, fam); return { ...single(id, kind), cs: FAMILY_FOR[id] ?? word(id).cs }; }
  }
  let p = ctx.pool;
  if (kind === 'haeun') {
    const s = p.filter((id) => SWEET.includes(id));
    if (s.length >= 2) p = s;
  }
  return single(pick(ctx, p), kind, ctx.mechanic === 'loanword');
}

function single(id: string, kind: Kind, loan = false): Order {
  const w = word(id);
  return { tokens: [{ id, ko: w.ko }], target: w.ko, cs: w.cs, icons: [w.icon], extra: loan ? w.loan : undefined, hinted: false, mistakes: [false], kind };
}

/** All accepted answers of an order. */
export function orderTargets(o: Order): string[] {
  return [o.target, ...(o.alts ?? []).map(joinTokens)];
}

/** Order with alternative answers: the first is shown as the hint. */
function withAlts(answers: Token[][], cs: string, icons: string[], kind: Kind, extra?: string): Order {
  const [first, ...rest] = answers;
  return { tokens: first, target: joinTokens(first), alts: rest.length ? rest : undefined, cs, icons, extra, hinted: false, mistakes: first.map(() => false), kind };
}

// ------------------------------------------------------------------ 부산
function destinationOrder(ctx: OrderCtx, kind: Kind): Order | null {
  const inPool = new Set(ctx.pool);
  const ok = DESTINATIONS.filter((d) => inPool.has(d.id) && d.answers.some((a) => inPool.has(a) && (!ctx.late || TICKETED.includes(a))));
  if (!ok.length) return null;
  const d = ok[Math.floor(ctx.rand() * ok.length)];
  // the SRS decides which transport word gets practised first
  const answers = d.answers.filter((a) => inPool.has(a) && (!ctx.late || TICKETED.includes(a)));
  const first = pick(ctx, answers, new Set());
  const ordered = [first, ...answers.filter((a) => a !== first)];
  const toks = ordered.map((a) => (ctx.late ? [T(a), T('pyo')] : [T(a)]));
  return withAlts(toks, `Jedu ${d.cs}.${ctx.late ? ' Lístek, prosím.' : ''}`, [d.icon], kind, word(d.id).ko);
}

// ------------------------------------------------------------------ 약국
function pharmacyOrder(ctx: OrderCtx, kind: Kind): Order {
  const inPool = new Set(ctx.pool);
  if (ctx.late && ctx.rand() < 0.55) {
    const ok = SYMPTOMS.filter((s) => s.answers.some((a) => inPool.has(a)));
    if (ok.length) {
      const s = ok[Math.floor(ctx.rand() * ok.length)];
      const answers = s.answers.filter((a) => inPool.has(a));
      return withAlts(answers.map((a) => [T(a)]), s.cs, [s.icon], kind);
    }
  }
  const id = pick(ctx, ctx.pool);
  const o = single(id, kind);
  if (BODY_PARTS.includes(id)) o.cs = 'Bolí mě tady!';
  return o;
}

// ------------------------------------------------------------------ 동대문
function colorItem(ctx: OrderCtx, kind: Kind): Order {
  const items = ofCat(ctx.pool, 'clothes');
  const colors = ofCat(ctx.pool, 'color').filter((id) => id !== 'saek');
  const itemOnly = (id: string): Order => ({ ...single(id, kind), icons: [`cl:${id}:`] });
  const colorOnly = (id: string): Order => ({ ...single(id, kind), cs: cap(word(id).cs) });
  if (!colors.length) return itemOnly(pick(ctx, items));
  const shape = colorOrderShape(ctx.rand(), ctx.combo);
  if (shape === 'item') return itemOnly(pick(ctx, items));
  if (shape === 'color') return colorOnly(pick(ctx, colors));
  const it = pick(ctx, items), co = pick(ctx, colors);
  // first meet: a word is typed alone once before it appears in a pair
  if (G.stat(co).seen === 0) return colorOnly(co);
  if (G.stat(it).seen === 0) return itemOnly(it);
  const wi = word(it), wc = word(co);
  const colour = COLORS.find((c) => c.word === co)!;
  return {
    tokens: [{ id: co, ko: wc.ko }, { id: it, ko: wi.ko }],
    target: `${wc.ko} ${wi.ko}`,
    cs: `${colorAdj(colour.cs, CLOTHES[it].g)} ${wi.cs}`,
    icons: [`cl:${it}:${colour.id}`],
    hinted: false, mistakes: [false, false], kind,
  };
}

// ------------------------------------------------------------------ bosses
const T = (id: string, glue = false): Token => ({ id, ko: word(id).ko, glue });

function bossSentence(ctx: OrderCtx): Order {
  if (ctx.boss === 'blogger') return bloggerSentence(ctx);
  if (ctx.boss === 'manager') return managerSentence(ctx);
  if (ctx.boss === 'trader') return traderSentence(ctx);
  if (ctx.boss === 'captain') return captainSentence(ctx);
  return criticSentence(ctx);
}

/** 홍대 manager orders food & drinks for the whole team: "떡볶이 둘하고 콜라 주세요". */
function managerSentence(ctx: OrderCtx): Order {
  const foods = ofCat(ctx.pool, 'food');
  const a = pick(ctx, foods, new Set());
  ctx.exclude.add(a);
  const b = pick(ctx, foods, new Set());
  const wa = word(a), wb = word(b);
  const r = ctx.rand();
  if (r < 0.3) return sentence([T(a), T('dul'), T('juseyo')], `${cap(wa.cs)} – 2×, prosím.`, [wa.icon, wa.icon]);
  if (r < 0.65) return sentence([T(a), T('dul', false), T('hago', true), T(b), T('juseyo')], `${cap(wa.cs)} 2× a ${wb.cs}, prosím.`, [wa.icon, wa.icon, wb.icon]);
  return sentence([T(a), T('hana', false), T('hago', true), T(b), T('dul'), T('juseyo')], `${cap(wa.cs)} 1× a ${wb.cs} 2×, prosím.`, [wa.icon, wb.icon, wb.icon]);
}

/** 용산 trader talks prices: "카메라 너무 비싸다", "노트북 정말 싸다". */
function traderSentence(ctx: OrderCtx): Order {
  const items = ofCat(ctx.pool, 'tech').filter((id) => !['harin', 'gojangnasseoyo', 'gochida'].includes(id));
  const a = pick(ctx, items, new Set());
  const wa = word(a);
  const r = ctx.rand();
  if (r < 0.3) return sentence([T(a), T('neomu'), T('bissada')], `${cap(wa.cs)} – moc drahé!`, [wa.icon, 'bissada']);
  if (r < 0.55) return sentence([T(a), T('jeongmal'), T('ssada')], `${cap(wa.cs)} – opravdu levné!`, [wa.icon, 'ssada']);
  if (r < 0.75) return sentence([T(a), T('hana'), T('juseyo')], `${cap(wa.cs)} – 1×, prosím.`, [wa.icon]);
  ctx.exclude.add(a);
  const b = pick(ctx, items, new Set());
  return sentence([T(a), T('hago', true), T(b), T('juseyo')], `${cap(wa.cs)} a ${word(b).cs}, prosím.`, [wa.icon, word(b).icon]);
}

/** 부산 captain: long sentences from the whole game. */
function captainSentence(ctx: OrderCtx): Order {
  const r = ctx.rand();
  const all = Object.keys(G.track().words).filter((id) => (G.track().words[id]?.seen ?? 0) > 0);
  const known = (cat: string) => ofCat(all, cat);
  if (r < 0.3) {
    const dests = DESTINATIONS.filter((d) => d.answers.some((a) => a !== 'taeksi'));
    const d = dests[Math.floor(ctx.rand() * dests.length)];
    const tr = d.answers.find((a) => a !== 'taeksi')!;
    const n = ctx.rand() < 0.5 ? 'hana' : 'dul';
    return sentence([T(d.id), T(tr), T('pyo'), T(n), T('juseyo')], `${cap(d.cs)}: lístek (${word(tr).cs}) – ${n === 'hana' ? 1 : 2}×, prosím.`, [d.icon, word(tr).icon, 'pyo']);
  }
  if (r < 0.55 && known('clothes').length && known('color').length) {
    const colors = known('color').filter((id) => id !== 'saek');
    const ctx2 = { ...ctx, pool: [...known('clothes'), ...colors] };
    return bloggerSentence(ctx2);
  }
  if (r < 0.8) return managerSentence({ ...ctx, pool: ofCat(ctx.pool, 'food').length ? ctx.pool : [...known('food')] });
  const tech = known('tech');
  if (tech.length >= 2) return traderSentence({ ...ctx, pool: tech });
  return criticSentence({ ...ctx, pool: known('food') });
}

function criticSentence(ctx: OrderCtx): Order {
  const foods = ofCat(ctx.pool, 'food');
  const a = pick(ctx, foods, new Set());
  const wa = word(a);
  const r = ctx.rand();
  if (r < 0.35) return sentence([T(a), T('hana'), T('juseyo')], `${cap(wa.cs)} – 1×, prosím.`, [wa.icon]);
  if (r < 0.6) return sentence([T(a), T('dul'), T('juseyo')], `${cap(wa.cs)} – 2×, prosím.`, [wa.icon, wa.icon]);
  ctx.exclude.add(a);
  const b = pick(ctx, foods, new Set());
  const wb = word(b);
  return sentence([T(a), T('hago'), T(b), T('juseyo')], `${cap(wa.cs)} a ${wb.cs}, prosím.`, [wa.icon, wb.icon]);
}

function bloggerSentence(ctx: OrderCtx): Order {
  const items = ofCat(ctx.pool, 'clothes');
  const colors = ofCat(ctx.pool, 'color').filter((id) => id !== 'saek');
  const it = pick(ctx, items, new Set());
  const co = pick(ctx, colors, new Set());
  const colour = COLORS.find((c) => c.word === co)!;
  const g = CLOTHES[it];
  const thing = `${colorAdj(colour.cs, g.g, true)} ${g.acc ?? word(it).cs}`;
  const icon = `cl:${it}:${colour.id}`;
  const r = ctx.rand();
  if (r < 0.35) return sentence([T(co), T(it), T('hana'), T('juseyo')], `${cap(thing)} – 1×, prosím.`, [icon]);
  if (r < 0.6) return sentence([T(co), T(it), T('dul'), T('juseyo')], `${cap(thing)} – 2×, prosím.`, [icon, icon]);
  ctx.exclude.add(it);
  const it2 = pick(ctx, items, new Set());
  const g2 = CLOTHES[it2];
  return sentence([T(co), T(it), T('hago', true), T(it2), T('juseyo')], `${cap(thing)} a ${g2.acc ?? word(it2).cs}, prosím.`, [icon, `cl:${it2}:`]);
}

export function joinTokens(tokens: Token[]): string {
  return tokens.map((t, i) => (i > 0 && !t.glue ? ' ' : '') + t.ko).join('');
}

function sentence(tokens: Token[], cs: string, icons: string[]): Order {
  return { tokens, target: joinTokens(tokens), cs, icons, hinted: false, mistakes: tokens.map(() => false), kind: 'boss' };
}

/** Korean shown in the bubble, according to mastery (or fully when hinted). */
export function koreanHint(o: Order): { text: string; alpha: number } {
  if (o.hinted) return { text: o.target, alpha: 1 };
  if (o.kind === 'nabi') return { text: '', alpha: 0 };
  // colour+item pair: hints stay one level longer
  const bonus = o.kind !== 'boss' && o.tokens.length === 2 && word(o.tokens[0].id).category === 'color' ? 1 : 0;
  const parts = o.tokens.map((t) => {
    const lvl = hintLevel(G.stat(t.id).mastery, bonus);
    if (lvl === 'full') return t.ko;
    if (lvl === 'partial') return [...t.ko][0] + '…';
    return '·'.repeat(Math.min(3, [...t.ko].length));
  });
  const all = o.tokens.map((t) => hintLevel(G.stat(t.id).mastery, bonus));
  const text = parts.map((p, i) => (i > 0 && !o.tokens[i].glue ? ' ' : '') + p).join('');
  if (all.every((l) => l === 'none')) return { text: '', alpha: 0 };
  return { text, alpha: all.every((l) => l === 'full') ? 1 : 0.6 };
}

/** Poslech bubble: never the words, only a first consonant / syllable count by listening mastery (all when hinted). */
export function listenKoreanHint(o: Order): { text: string; alpha: number } {
  if (o.hinted) return { text: o.target, alpha: 1 };
  const ini = (ch: string) => splitSyllable(ch)?.initial ?? ch;
  const text = o.tokens.map((t, i) => (i > 0 && !o.tokens[i].glue ? ' ' : '') + listenHint(t.ko, G.stat(t.id).mastery, ini)).join('');
  return text.trim() ? { text, alpha: 0.6 } : { text: '', alpha: 0 };
}

/** Which token was being typed when the jamo at `pos` (0-based) went wrong. */
export function tokenAt(o: Order, typed: string): number {
  const pos = matchedJamo(typed, o.target);
  let acc = 0;
  for (let i = 0; i < o.tokens.length; i++) {
    acc += toJamo(o.tokens[i].ko).length;
    if (pos < acc) return i;
  }
  return o.tokens.length - 1;
}
