// Penalty points ("trestné body"): the star rules restated in whole numbers so
// the player can count them before, during and after a night. Same balance as
// the old (served − 0.25·typos) / total formula when every typo is counted.

import { plural } from './czech';

export const TYPO_POINTS = 1;
export const WALKOUT_POINTS = 4;

export function penaltyPoints(typos: number, angry: number): number {
  return typos * TYPO_POINTS + angry * WALKOUT_POINTS;
}

export interface StarLimits { three: number; two: number; one: number }

/** Most penalty points allowed for 3 / 2 / 1 stars with N planned customers. */
export function starLimits(n: number): StarLimits {
  return { three: Math.floor((4 * n) / 10), two: Math.floor((12 * n) / 10), one: Math.floor((22 * n) / 10) };
}

/** 0..3 stars. 0 = night failed (next night stays locked). */
export function starsFromPoints(p: number, n: number): number {
  if (n <= 0) return 0;
  const l = starLimits(n);
  if (p <= l.three) return 3;
  if (p <= l.two) return 2;
  if (p <= l.one) return 1;
  return 0;
}

/** The next better tier: its limit and how many points over it the night is. null at 3★. */
export function nextStar(p: number, n: number): { stars: number; limit: number; over: number } | null {
  const s = starsFromPoints(p, n);
  if (s >= 3) return null;
  const l = starLimits(n);
  const limit = s === 2 ? l.three : s === 1 ? l.two : l.one;
  return { stars: s + 1, limit, over: p - limit };
}

export interface TypoContext {
  /** Some blamed customer has a non-reaction order. */
  blamedOrder: boolean;
  /** The text before the bad keystroke was empty. */
  prevEmpty: boolean;
  /** Some non-reaction order is waiting. */
  orderWaiting: boolean;
  /** A greeting or haggle tag is active. */
  politeActive: boolean;
}

/** Only typos on real orders cost a point (not greetings, reactions or orphan text). */
export function countsAsTypo(c: TypoContext): boolean {
  return c.blamedOrder || (c.prevEmpty && c.orderWaiting && !c.politeActive);
}

// ------------------------------------------------------------------ perfect nights (golden stars)

/** Regular night without a single penalty point. */
export function isPerfect(stars: number, points: number): boolean {
  return stars === 3 && points === 0;
}

/** Boss night: 5★, no critic typo, no walk-out and the greeting given. */
export function isPerfectBoss(stars: number, critic: { mistakes: number; walkouts: number; noGreet: number }): boolean {
  return stars === 5 && critic.mistakes === 0 && critic.walkouts === 0 && critic.noGreet === 0;
}

/** Co-op: the team collected no penalty points. */
export function isPerfectCoop(s: { angry: number; typos: number }): boolean {
  return penaltyPoints(s.typos, s.angry) === 0;
}

// ------------------------------------------------------------------ result verdict (Czech)

export type VerdictTone = 'perfect' | 'full' | 'near' | 'fail';

/** One line under the result stars: how the penalty points turned into stars. */
export function verdict(stars: number, points: number, n: number): { text: string; tone: VerdictTone } {
  const l = starLimits(n);
  if (stars >= 3) return points === 0 ? { text: 'Bez jediného trestného bodu!', tone: 'perfect' } : { text: `Trestné body ${points} z ${l.three} – plný počet!`, tone: 'full' };
  if (stars <= 0) return { text: `Trestných bodů ${points}, na ★ smíš mít nejvýš ${l.one}. Zkus to znovu!`, tone: 'fail' };
  const over = nextStar(points, n)!.over;
  return { text: `Na ${'★'.repeat(stars + 1)} ${plural(over, 'chyběl', 'chyběly', 'chybělo')} ${over} ${plural(over, 'bod', 'body', 'bodů')}.`, tone: 'near' };
}
