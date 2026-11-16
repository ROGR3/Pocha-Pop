import { describe, expect, it } from 'vitest';
import { hintLevel, newStat, pickWord, recordMissed, recordMistake, recordServe, rng, weight } from '../src/logic/srs';

describe('mastery', () => {
  it('maps mastery to hint level', () => {
    expect(hintLevel(0)).toBe('full');
    expect(hintLevel(1)).toBe('partial');
    expect(hintLevel(2)).toBe('none');
    expect(hintLevel(5)).toBe('none');
    // colour+item pairs keep hints one level longer
    expect(hintLevel(1, 1)).toBe('full');
    expect(hintLevel(2, 1)).toBe('partial');
    expect(hintLevel(3, 1)).toBe('none');
  });
  it('clean serve raises mastery, mistakes lower it', () => {
    let s = newStat();
    s = recordServe(s, { clean: true, hinted: false, night: 1 });
    expect(s.mastery).toBe(1);
    s = recordServe(s, { clean: true, hinted: false, night: 1 });
    expect(s.mastery).toBe(2);
    s = recordMistake(s);
    s = recordServe(s, { clean: false, hinted: false, night: 1 });
    expect(s.mastery).toBe(1);
    expect(s.errors).toBe(1);
    expect(s.lapses).toBe(1);
  });
  it('hint prevents mastery gain', () => {
    const s = recordServe(newStat(), { clean: true, hinted: true, night: 1 });
    expect(s.mastery).toBe(0);
    expect(s.correct).toBe(1);
  });
  it('mastery is clamped', () => {
    let s = newStat();
    for (let i = 0; i < 10; i++) s = recordServe(s, { clean: true, hinted: false, night: 1 });
    expect(s.mastery).toBe(5);
    s = recordMissed(newStat(), 2);
    expect(s.mastery).toBe(0);
  });
  it('missed orders count as lapses', () => {
    expect(recordMissed(newStat(), 3).lapses).toBe(1);
  });
});

describe('word picking', () => {
  it('weights troubled and new words higher', () => {
    const good = { ...newStat(), mastery: 4, seen: 8 };
    const bad = { ...newStat(), mastery: 1, seen: 8, lapses: 3 };
    expect(weight(bad, false)).toBeGreaterThan(weight(good, false));
    expect(weight(good, true)).toBeGreaterThan(weight(good, false));
  });
  it('words with mistakes come up more often', () => {
    const stats = { a: { ...newStat(), mastery: 3, seen: 5 }, b: { ...newStat(), mastery: 0, seen: 5, lapses: 4 } };
    const r = rng(42);
    let b = 0;
    for (let i = 0; i < 1000; i++) if (pickWord({ pool: ['a', 'b'], stats, newTonight: new Set(), exclude: new Set(), rand: r }) === 'b') b++;
    expect(b).toBeGreaterThan(750);
  });
  it('respects exclusions unless nothing else is left', () => {
    const r = rng(1);
    for (let i = 0; i < 50; i++) expect(pickWord({ pool: ['a', 'b'], stats: {}, newTonight: new Set(), exclude: new Set(['a']), rand: r })).toBe('b');
    expect(pickWord({ pool: ['a'], stats: {}, newTonight: new Set(), exclude: new Set(['a']), rand: r })).toBe('a');
  });
  it('rng is deterministic', () => {
    const a = rng(7), b = rng(7);
    expect([a(), a(), a()]).toEqual([b(), b(), b()]);
  });
});
