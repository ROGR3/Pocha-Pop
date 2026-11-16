import { describe, expect, it } from 'vitest';
import { HELPER_THRESHOLD, helperCharges, helperPick } from '../src/logic/helper';
import { bubbleDepth, seatMultiplier, seatsAvailable, spawnInterval } from '../src/logic/rules';

describe('seats', () => {
  it('multiplier grows with seats', () => {
    expect(seatMultiplier(2)).toBe(1);
    expect(seatMultiplier(3)).toBe(1.15);
    expect(seatMultiplier(4)).toBe(1.3);
  });
  it('arrival pace scales with 3/seats', () => {
    expect(spawnInterval([6, 9], 3)).toEqual([6, 9]);
    expect(spawnInterval([6, 9], 2)).toEqual([9, 13.5]);
    expect(spawnInterval([6, 8], 4)).toEqual([4.5, 6]);
  });
  it('4 seats unlock after a 3★ night (bosses do not count)', () => {
    expect(seatsAvailable({})).toEqual([2, 3]);
    expect(seatsAvailable({ 1: { stars: 2 } })).toEqual([2, 3]);
    expect(seatsAvailable({ 11: { stars: 5 } }, [11])).toEqual([2, 3]);
    expect(seatsAvailable({ 1: { stars: 2 }, 2: { stars: 3 } })).toEqual([2, 3, 4]);
  });
});

describe('helper 김 대리', () => {
  const c = (frac: number, eligible = true) => ({ frac, eligible });
  it('once per night, twice with 4 seats', () => {
    expect(helperCharges(2)).toBe(1);
    expect(helperCharges(3)).toBe(1);
    expect(helperCharges(4)).toBe(2);
  });
  it('steps in only below the threshold', () => {
    expect(helperPick([c(0.5), c(HELPER_THRESHOLD)], 0, 3, true)).toBe(-1);
    expect(helperPick([c(0.5), c(0.19)], 0, 3, true)).toBe(1);
  });
  it('picks the least patient eligible customer', () => {
    expect(helperPick([c(0.1), c(0.05), c(0.01, false)], 0, 3, true)).toBe(1);
  });
  it('respects charges and hiring', () => {
    expect(helperPick([c(0.1)], 1, 3, true)).toBe(-1);
    expect(helperPick([c(0.1)], 1, 4, true)).toBe(0);
    expect(helperPick([c(0.1)], 2, 4, true)).toBe(-1);
    expect(helperPick([c(0.1)], 0, 3, false)).toBe(-1);
  });
});

describe('bubbleDepth', () => {
  it('full patience at the bottom, none at the top of the band', () => {
    expect(bubbleDepth(40, 1)).toBeCloseTo(40.1);
    expect(bubbleDepth(40, 0)).toBeCloseTo(40.5);
    expect(bubbleDepth(40, NaN)).toBeCloseTo(40.1);
  });
  it('clamps out-of-range input', () => {
    expect(bubbleDepth(40, -1)).toBe(bubbleDepth(40, 0));
    expect(bubbleDepth(40, 2)).toBe(bubbleDepth(40, 1));
  });
  it('less patience never draws lower and stays inside the band', () => {
    let prev = Infinity;
    for (let f = 0; f <= 1.0001; f += 0.01) {
      const d = bubbleDepth(40, f);
      expect(d).toBeLessThanOrEqual(prev);
      expect(d).toBeGreaterThan(40);
      expect(d).toBeLessThan(41);
      prev = d;
    }
  });
  it('is quantised so the depth changes rarely', () => {
    expect(bubbleDepth(40, 0.501)).toBe(bubbleDepth(40, 0.509));
  });
});
