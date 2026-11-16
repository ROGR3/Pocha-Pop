// Simple spaced-repetition / mastery model (Hangul Pop style).
//  mastery 0 → full Korean in the bubble, 1 → first syllable only, 2+ → none.
//  clean serve → +1, mistake → −1. Words with mistakes come back more often.

export interface WordStat {
  mastery: number; // 0..MAX_MASTERY
  seen: number;
  correct: number;
  errors: number;
  /** Recent trouble; grows with mistakes, decays with clean serves. */
  lapses: number;
  lastNight: number;
}

export const MAX_MASTERY = 5;

export function newStat(): WordStat {
  return { mastery: 0, seen: 0, correct: 0, errors: 0, lapses: 0, lastNight: 0 };
}

export type HintLevel = 'full' | 'partial' | 'none';

/** `bonus` keeps hints longer (colour+item pairs). */
export function hintLevel(mastery: number, bonus = 0): HintLevel {
  const m = mastery - bonus;
  if (m <= 0) return 'full';
  if (m === 1) return 'partial';
  return 'none';
}

export interface ServeOutcome {
  /** Served without any mistake on this order. */
  clean: boolean;
  /** Player revealed the Korean with Tab / "?". */
  hinted: boolean;
  night: number;
}

export function recordServe(s: WordStat, o: ServeOutcome): WordStat {
  const n = { ...s, seen: s.seen + 1, lastNight: o.night };
  if (o.clean) {
    n.correct++;
    if (!o.hinted) n.mastery = Math.min(MAX_MASTERY, n.mastery + 1);
    n.lapses = Math.max(0, n.lapses - 0.5);
  } else {
    n.mastery = Math.max(0, n.mastery - 1);
  }
  return n;
}

export function recordMistake(s: WordStat): WordStat {
  return { ...s, errors: s.errors + 1, lapses: s.lapses + 1 };
}

/** Customer left before the order was typed: counts as a lapse too. */
export function recordMissed(s: WordStat, night: number): WordStat {
  return { ...s, seen: s.seen + 1, lapses: s.lapses + 1, mastery: Math.max(0, s.mastery - 1), lastNight: night };
}

export function weight(s: WordStat | undefined, isNewTonight: boolean): number {
  const st = s ?? newStat();
  let w = (1 + st.lapses * 1.2) / (1 + st.mastery * 0.35);
  if (isNewTonight) w *= 2.5;
  if (st.seen === 0) w *= 1.5;
  return w;
}

export interface PickOptions {
  pool: string[];
  stats: Record<string, WordStat>;
  newTonight: Set<string>;
  /** Ids that must not be picked (on screen right now / just served). */
  exclude: Set<string>;
  rand: () => number;
}

export function pickWord(o: PickOptions): string {
  let candidates = o.pool.filter((id) => !o.exclude.has(id));
  if (candidates.length === 0) candidates = o.pool;
  const ws = candidates.map((id) => weight(o.stats[id], o.newTonight.has(id)));
  const total = ws.reduce((a, b) => a + b, 0);
  let r = o.rand() * total;
  for (let i = 0; i < candidates.length; i++) {
    r -= ws[i];
    if (r <= 0) return candidates[i];
  }
  return candidates[candidates.length - 1];
}

/** Mulberry32 – small deterministic RNG. */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
