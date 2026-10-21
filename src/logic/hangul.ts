// Hangul → keystroke-level jamo decomposition (두벌식) and prefix matching.
//
// Everything is normalised to Hangul Compatibility Jamo (U+3131..U+318E),
// i.e. the characters an IME shows while a syllable is still being composed.
// Compound vowels and final clusters are split into the keys that produce
// them (ㅘ → ㅗㅏ, ㄳ → ㄱㅅ), so the half-typed `한` (ㅎㅏㄴ) is a valid
// prefix of `하나` (ㅎㅏㄴㅏ).

const S_BASE = 0xac00;
const S_END = 0xd7a3;

const INITIALS = 'ㄱㄲㄴㄷㄸㄹㅁㅂㅃㅅㅆㅇㅈㅉㅊㅋㅌㅍㅎ';
const MEDIALS = 'ㅏㅐㅑㅒㅓㅔㅕㅖㅗㅘㅙㅚㅛㅜㅝㅞㅟㅠㅡㅢㅣ';
// index 0 = no final
const FINALS = ['', 'ㄱ', 'ㄲ', 'ㄳ', 'ㄴ', 'ㄵ', 'ㄶ', 'ㄷ', 'ㄹ', 'ㄺ', 'ㄻ', 'ㄼ', 'ㄽ', 'ㄾ', 'ㄿ', 'ㅀ', 'ㅁ', 'ㅂ', 'ㅄ', 'ㅅ', 'ㅆ', 'ㅇ', 'ㅈ', 'ㅊ', 'ㅋ', 'ㅌ', 'ㅍ', 'ㅎ'];

/** Compound compatibility jamo → the keys that type them. */
const SPLIT: Record<string, string> = {
  ㅘ: 'ㅗㅏ', ㅙ: 'ㅗㅐ', ㅚ: 'ㅗㅣ', ㅝ: 'ㅜㅓ', ㅞ: 'ㅜㅔ', ㅟ: 'ㅜㅣ', ㅢ: 'ㅡㅣ',
  ㄳ: 'ㄱㅅ', ㄵ: 'ㄴㅈ', ㄶ: 'ㄴㅎ', ㄺ: 'ㄹㄱ', ㄻ: 'ㄹㅁ', ㄼ: 'ㄹㅂ', ㄽ: 'ㄹㅅ',
  ㄾ: 'ㄹㅌ', ㄿ: 'ㄹㅍ', ㅀ: 'ㄹㅎ', ㅄ: 'ㅂㅅ',
};

/** Conjoining jamo (U+1100 block, used by some IMEs while composing) → compat. */
const CONJOINING_INITIAL_BASE = 0x1100; // ᄀ..ᄒ (19)
const CONJOINING_MEDIAL_BASE = 0x1161; // ᅡ..ᅵ (21)
const CONJOINING_FINAL_BASE = 0x11a8; // ᆨ..ᇂ (27)

export const DOUBLE_CONSONANTS = new Set(['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ']);
/** Vowels typed with Shift on 두벌식. */
export const SHIFT_VOWELS = new Set(['ㅒ', 'ㅖ']);
export const COMPOUND_VOWELS = new Set(['ㅘ', 'ㅙ', 'ㅚ', 'ㅝ', 'ㅞ', 'ㅟ', 'ㅢ']);

export function isSyllable(ch: string): boolean {
  const c = ch.codePointAt(0)!;
  return c >= S_BASE && c <= S_END;
}

export interface Syllable {
  initial: string;
  medial: string;
  final: string; // '' when none
}

export function splitSyllable(ch: string): Syllable | null {
  if (!isSyllable(ch)) return null;
  const idx = ch.codePointAt(0)! - S_BASE;
  return {
    initial: INITIALS[Math.floor(idx / 588)],
    medial: MEDIALS[Math.floor((idx % 588) / 28)],
    final: FINALS[idx % 28],
  };
}

export function composeSyllable(initial: string, medial: string, final = ''): string {
  const i = INITIALS.indexOf(initial);
  const m = MEDIALS.indexOf(medial);
  const f = FINALS.indexOf(final);
  if (i < 0 || m < 0 || f < 0) throw new Error(`cannot compose ${initial}${medial}${final}`);
  return String.fromCodePoint(S_BASE + i * 588 + m * 28 + f);
}

function conjoiningToCompat(ch: string): string {
  const c = ch.codePointAt(0)!;
  if (c >= CONJOINING_INITIAL_BASE && c < CONJOINING_INITIAL_BASE + 19) return INITIALS[c - CONJOINING_INITIAL_BASE];
  if (c >= CONJOINING_MEDIAL_BASE && c < CONJOINING_MEDIAL_BASE + 21) return MEDIALS[c - CONJOINING_MEDIAL_BASE];
  if (c >= CONJOINING_FINAL_BASE && c < CONJOINING_FINAL_BASE + 27) return FINALS[c - CONJOINING_FINAL_BASE + 1];
  return ch;
}

function pushSplit(out: string[], jamo: string) {
  if (!jamo) return;
  const s = SPLIT[jamo];
  if (s) for (const k of s) out.push(k);
  else out.push(jamo);
}

/**
 * Decompose text into keystroke jamo. Whitespace is dropped (matching is
 * forgiving about spaces), other characters are kept as-is.
 */
export function toJamo(text: string): string[] {
  const out: string[] = [];
  for (const raw of text.normalize('NFC')) {
    if (/\s/.test(raw)) continue;
    const syl = splitSyllable(raw);
    if (syl) {
      pushSplit(out, syl.initial);
      pushSplit(out, syl.medial);
      pushSplit(out, syl.final);
      continue;
    }
    pushSplit(out, conjoiningToCompat(raw));
  }
  return out;
}

export type MatchKind = 'none' | 'prefix' | 'full';

/** Is `typed` a (jamo-level) prefix of / equal to `target`? */
export function matchKind(typed: string, target: string): MatchKind {
  const a = toJamo(typed);
  const b = toJamo(target);
  if (a.length === 0) return 'prefix';
  if (a.length > b.length) return 'none';
  for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return 'none';
  return a.length === b.length ? 'full' : 'prefix';
}

/** Number of leading jamo of `typed` that match `target`. */
export function matchedJamo(typed: string, target: string): number {
  const a = toJamo(typed);
  const b = toJamo(target);
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  return i;
}

export interface MatchResult<T> {
  /** Orders whose target still starts with what was typed. */
  prefix: T[];
  /** First order whose target was typed completely. */
  full: T | null;
  /** Something was typed and it does not fit any order. */
  error: boolean;
}

export function matchAgainst<T>(typed: string, items: T[], getTarget: (t: T) => string): MatchResult<T> {
  const res: MatchResult<T> = { prefix: [], full: null, error: false };
  if (toJamo(typed).length === 0) return res;
  for (const it of items) {
    const k = matchKind(typed, getTarget(it));
    if (k === 'full' && !res.full) res.full = it;
    if (k !== 'none') res.prefix.push(it);
  }
  res.error = res.prefix.length === 0;
  return res;
}

/** Distinct jamo (keystroke-level) used by a word, in order of first use. */
export function jamoSet(text: string): string[] {
  return [...new Set(toJamo(text))];
}

export function syllableCount(text: string): number {
  let n = 0;
  for (const ch of text) if (isSyllable(ch)) n++;
  return n;
}

/** Original (unsplit) jamo of every syllable, useful for difficulty stats. */
export function rawJamo(text: string): Syllable[] {
  const out: Syllable[] = [];
  for (const ch of text) {
    const s = splitSyllable(ch);
    if (s) out.push(s);
  }
  return out;
}

/**
 * Split typed text into finished syllables and the one currently being
 * composed (the last character while the IME composition is active).
 */
export function splitComposing(text: string, composing: boolean): { done: string; current: string } {
  const chars = [...text];
  if (!composing || chars.length === 0) return { done: text, current: '' };
  return { done: chars.slice(0, -1).join(''), current: chars[chars.length - 1] };
}

/** Does a syllable use this (unsplit) jamo as initial, medial or final? */
export function hasRawJamo(ch: string, jamo: string): boolean {
  const s = splitSyllable(ch);
  if (!s) return false;
  return s.initial === jamo || s.medial === jamo || s.final === jamo;
}
