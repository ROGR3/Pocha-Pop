import { describe, expect, it } from 'vitest';
import { difficulty, difficultyBreakdown, sortByDifficulty } from '../src/logic/difficulty';

describe('difficulty', () => {
  it('counts features', () => {
    const d = difficultyBreakdown('떡볶이');
    expect(d.syllables).toBe(3);
    expect(d.batchim).toBe(2);
    expect(d.doubles).toBe(2);
    expect(difficultyBreakdown('과자').compoundVowels).toBe(1);
    expect(difficultyBreakdown('계').shiftVowels).toBe(1);
  });
  it('orders words sensibly', () => {
    expect(difficulty('차')).toBeLessThan(difficulty('우유'));
    expect(difficulty('우유')).toBeLessThan(difficulty('라면'));
    expect(difficulty('라면')).toBeLessThan(difficulty('떡볶이'));
    expect(difficulty('바다')).toBeLessThan(difficulty('빠다'));
    expect(difficulty('고자')).toBeLessThan(difficulty('과자'));
    expect(difficulty('김치찌개')).toBeGreaterThan(difficulty('김치'));
  });
  it('sorts', () => {
    expect(sortByDifficulty([{ ko: '떡볶이' }, { ko: '차' }, { ko: '라면' }]).map((w) => w.ko)).toEqual(['차', '라면', '떡볶이']);
  });
});

import { computeLayout } from '../src/game/layout';
describe('layout', () => {
  it('uses integer scales around 270 logical px', () => {
    expect(computeLayout(412, 915, 2.625)).toMatchObject({ scale: 4, width: 270 });
    expect(computeLayout(450, 800, 1)).toMatchObject({ scale: 2, width: 225, height: 400 });
  });
  it('steps down for short windows and the Android keyboard keeps the scale', () => {
    expect(computeLayout(950, 1042, 1).scale).toBe(3);
    expect(computeLayout(412, 500, 2.625).scale).toBe(4);
  });
});
