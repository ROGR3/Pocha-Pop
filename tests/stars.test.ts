import { describe, expect, it } from 'vitest';
import { verdict, countsAsTypo, isPerfect, isPerfectBoss, isPerfectCoop, nextStar, penaltyPoints, starLimits, starsFromPoints } from '../src/logic/stars';
import { criticStars, nightStars } from '../src/logic/rules';
import { plural } from '../src/logic/czech';

/** The old float formula, kept here to prove the balance did not change. */
function oldStars(total: number, served: number, mistakes: number): number {
  if (total <= 0) return 0;
  const score = (served - 0.25 * mistakes) / total;
  if (score >= 0.9) return 3;
  if (score >= 0.7) return 2;
  if (score >= 0.45) return 1;
  return 0;
}

describe('penalty points', () => {
  it('limits', () => {
    expect(starLimits(8)).toEqual({ three: 3, two: 9, one: 17 });
    expect(starLimits(10)).toEqual({ three: 4, two: 12, one: 22 });
    expect(starLimits(12)).toEqual({ three: 4, two: 14, one: 26 });
  });
  it('points: typo 1, walk-out 4', () => {
    expect(penaltyPoints(3, 2)).toBe(11);
    expect(starsFromPoints(0, 0)).toBe(0);
  });
  it('same stars as the old formula for every counted typo', () => {
    let diff = 0;
    for (let n = 1; n <= 60; n++)
      for (let a = 0; a <= n; a++)
        for (let m = 0; m <= 300; m++)
          if (starsFromPoints(penaltyPoints(m, a), n) !== oldStars(n, n - a, m)) diff++;
    expect(diff).toBe(0);
  });
  it('nightStars wrapper', () => {
    expect(nightStars({ total: 8, served: 7, angry: 1, mistakes: 0 })).toBe(2);
    expect(nightStars({ total: 8, served: 8, angry: 0, mistakes: 3 })).toBe(3);
  });
  it('next star', () => {
    expect(nextStar(7, 10)).toEqual({ stars: 3, limit: 4, over: 3 });
    expect(nextStar(2, 10)).toBeNull();
    expect(nextStar(25, 10)).toEqual({ stars: 1, limit: 22, over: 3 });
  });
  it('which typos count', () => {
    const base = { blamedOrder: false, prevEmpty: false, orderWaiting: true, politeActive: false };
    expect(countsAsTypo({ ...base, blamedOrder: true })).toBe(true);
    // blamed only on a reaction bubble (no order blamed, text already typed)
    expect(countsAsTypo({ ...base })).toBe(false);
    expect(countsAsTypo({ ...base, prevEmpty: true, politeActive: true })).toBe(false);
    expect(countsAsTypo({ ...base, prevEmpty: true })).toBe(true);
    // orphan: text left over from an order that is gone
    expect(countsAsTypo({ blamedOrder: false, prevEmpty: false, orderWaiting: false, politeActive: false })).toBe(false);
  });
  it('czech plural', () => {
    expect(plural(1, 'bod', 'body', 'bodů')).toBe('bod');
    expect(plural(3, 'bod', 'body', 'bodů')).toBe('body');
    expect(plural(5, 'bod', 'body', 'bodů')).toBe('bodů');
    expect(plural(0, 'bod', 'body', 'bodů')).toBe('bodů');
  });
  it('critic stars (typos + missing greeting, walk-outs)', () => {
    expect(criticStars(1 + 1, 0)).toBe(3);
    expect(criticStars(0, 1)).toBe(3);
    expect(criticStars(9, 9)).toBe(1);
  });
});

describe('perfect nights (golden stars)', () => {
  it('regular: 3★ and no points', () => {
    expect(isPerfect(3, 0)).toBe(true);
    expect(isPerfect(3, 1)).toBe(false);
    expect(isPerfect(2, 0)).toBe(false);
  });
  it('boss: 5★, no critic typo, no walk-out, greeted', () => {
    expect(isPerfectBoss(5, { mistakes: 0, walkouts: 0, noGreet: 0 })).toBe(true);
    expect(isPerfectBoss(4, { mistakes: 1, walkouts: 0, noGreet: 0 })).toBe(false);
    expect(isPerfectBoss(5, { mistakes: 0, walkouts: 0, noGreet: 1 })).toBe(false);
    expect(isPerfectBoss(5, { mistakes: 0, walkouts: 1, noGreet: 0 })).toBe(false);
  });
  it('co-op: team points 0', () => {
    expect(isPerfectCoop({ angry: 0, typos: 0 })).toBe(true);
    expect(isPerfectCoop({ angry: 0, typos: 1 })).toBe(false);
    expect(isPerfectCoop({ angry: 1, typos: 0 })).toBe(false);
  });
});

describe('verdict', () => {
  it('perfect / full / near / fail', () => {
    expect(verdict(3, 0, 10)).toEqual({ text: 'Bez jediného trestného bodu!', tone: 'perfect' });
    expect(verdict(3, 3, 10)).toEqual({ text: 'Trestné body 3 z 4 – plný počet!', tone: 'full' });
    expect(verdict(2, 5, 10).text).toBe('Na ★★★ chyběl 1 bod.');
    expect(verdict(2, 7, 10).text).toBe('Na ★★★ chyběly 3 body.');
    expect(verdict(1, 20, 12).text).toBe('Na ★★ chybělo 6 bodů.');
    expect(verdict(0, 30, 10)).toEqual({ text: 'Trestných bodů 30, na ★ smíš mít nejvýš 22. Zkus to znovu!', tone: 'fail' });
  });
});
