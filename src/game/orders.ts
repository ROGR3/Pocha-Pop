// Building orders (single words or critic sentences) and their bubble text.
import { hintLevel } from '../logic/srs';
import { pickWord } from '../logic/srs';
import { matchedJamo, toJamo } from '../logic/hangul';
import { G, word } from './state';

export type Kind = 'generic' | 'kim' | 'haeun' | 'nabi' | 'critic';

export interface Token { id: string; ko: string }

export interface Order {
  tokens: Token[];
  /** Korean the player must type. */
  target: string;
  cs: string;
  icons: string[];
  hinted: boolean;
  /** Per-token mistake flags. */
  mistakes: boolean[];
  kind: Kind;
}

const CAT_FOOD = ['uyu', 'mul', 'gogi', 'chikin', 'dubu', 'mandu', 'gimbap'];
const SWEET = ['gwaja', 'satang', 'ppang', 'tteokbokki', 'gimbap', 'gansik', 'juseu', 'beobeulti', 'aiseukeurim', 'bingsu', 'keikeu', 'chokollit', 'popkon', 'ttalgi', 'cha', 'uyu', 'dijeoteu', 'banana'];

export function makeOrder(kind: Kind, pool: string[], newTonight: Set<string>, exclude: Set<string>, rand: () => number): Order {
  const stats = G.data.words;
  if (kind === 'critic') return makeSentence(pool, exclude, rand);
  let p = pool;
  if (kind === 'nabi') {
    const seen = pool.filter((id) => (stats[id]?.seen ?? 0) > 0);
    const cat = seen.filter((id) => CAT_FOOD.includes(id));
    p = cat.length ? cat : seen.length ? seen : pool;
  } else if (kind === 'haeun') {
    const s = pool.filter((id) => SWEET.includes(id));
    if (s.length >= 2) p = s;
  }
  const id = pickWord({ pool: p, stats, newTonight, exclude, rand });
  const w = word(id);
  return { tokens: [{ id, ko: w.ko }], target: w.ko, cs: w.cs, icons: [w.icon], hinted: false, mistakes: [false], kind };
}

function makeSentence(pool: string[], exclude: Set<string>, rand: () => number): Order {
  const foods = pool.filter((id) => word(id).category === 'food');
  const pick = () => pickWord({ pool: foods, stats: G.data.words, newTonight: new Set(), exclude, rand });
  const a = pick();
  const wa = word(a);
  const r = rand();
  const juseyo = { id: 'juseyo', ko: '주세요' };
  if (r < 0.35) {
    return sentence([{ id: a, ko: wa.ko }, { id: 'hana', ko: '하나' }, juseyo], `${cap(wa.cs)} – 1×, prosím.`, [wa.icon]);
  }
  if (r < 0.6) {
    return sentence([{ id: a, ko: wa.ko }, { id: 'dul', ko: '둘' }, juseyo], `${cap(wa.cs)} – 2×, prosím.`, [wa.icon, wa.icon]);
  }
  exclude.add(a);
  const b = pick();
  const wb = word(b);
  return sentence([{ id: a, ko: wa.ko }, { id: 'hago', ko: '하고' }, { id: b, ko: wb.ko }, juseyo], `${cap(wa.cs)} a ${wb.cs}, prosím.`, [wa.icon, wb.icon]);
}

function sentence(tokens: Token[], cs: string, icons: string[]): Order {
  return { tokens, target: tokens.map((t) => t.ko).join(' '), cs, icons, hinted: false, mistakes: tokens.map(() => false), kind: 'critic' };
}

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Korean shown in the bubble, according to mastery (or fully when hinted). */
export function koreanHint(o: Order): { text: string; alpha: number } {
  if (o.hinted) return { text: o.target, alpha: 1 };
  if (o.kind === 'nabi') return { text: '', alpha: 0 };
  const parts = o.tokens.map((t) => {
    const lvl = hintLevel(G.stat(t.id).mastery);
    if (lvl === 'full') return t.ko;
    if (lvl === 'partial') return [...t.ko][0] + '…';
    return '·'.repeat(Math.min(3, [...t.ko].length));
  });
  const all = o.tokens.map((t) => hintLevel(G.stat(t.id).mastery));
  const text = parts.join(' ');
  if (all.every((l) => l === 'none')) return { text: '', alpha: 0 };
  return { text, alpha: all.every((l) => l === 'full') ? 1 : 0.6 };
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
