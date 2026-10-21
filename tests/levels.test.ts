import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import icons from '../public/assets/icons.json';
import { NIGHTS, UPGRADES, nightPool } from '../src/data/levels';
import { jamoSet } from '../src/logic/hangul';
import { comboMultiplier, criticStars, nightStars, serveCoins } from '../src/logic/rules';

const byId = new Map(words.map((w) => [w.id, w]));

describe('word data', () => {
  it('every word has Czech text, unique id and an icon', () => {
    const ids = new Set<string>();
    for (const w of words) {
      expect(w.cs.length).toBeGreaterThan(0);
      expect(ids.has(w.id)).toBe(false);
      ids.add(w.id);
      expect(icons.names).toContain(w.icon);
    }
  });
});

describe('nights', () => {
  it('reference existing words', () => {
    for (const n of NIGHTS) for (const id of n.newWords) expect(byId.has(id), id).toBe(true);
    for (const u of UPGRADES) for (const id of u.words ?? []) expect(byId.has(id), id).toBe(true);
  });
  it('only use jamo introduced so far (base nights)', () => {
    const known = new Set<string>();
    for (const n of NIGHTS) {
      n.newJamo.forEach((j) => known.add(j));
      if (n.district === 'boss') continue;
      for (const id of nightPool(n.n, [])) {
        for (const j of jamoSet(byId.get(id)!.ko)) expect(known.has(j), `night ${n.n}: ${id} uses ${j}`).toBe(true);
      }
    }
  });
  it('introduce at most 4 new jamo after night 1', () => {
    for (const n of NIGHTS.slice(1)) expect(n.newJamo.length).toBeLessThanOrEqual(4);
  });
  it('menu packs extend pools', () => {
    expect(nightPool(3, ['menu_sweets'])).toContain('satang');
    expect(nightPool(3, [])).not.toContain('satang');
  });
});

describe('rules', () => {
  it('combo multiplier', () => {
    expect(comboMultiplier(0)).toBe(1);
    expect(comboMultiplier(3)).toBe(2);
    expect(comboMultiplier(6)).toBe(3);
    expect(comboMultiplier(99)).toBe(5);
  });
  it('coins: tips for speed, none when hinted', () => {
    expect(serveCoins(4, 1, 0, false).tip).toBe(4);
    expect(serveCoins(4, 1, 0, true).tip).toBe(0);
    expect(serveCoins(4, 0.5, 3, false).total).toBe((4 + 2) * 2);
  });
  it('stars', () => {
    expect(nightStars({ total: 10, served: 10, angry: 0, mistakes: 0 })).toBe(3);
    expect(nightStars({ total: 10, served: 8, angry: 2, mistakes: 2 })).toBe(2);
    expect(nightStars({ total: 10, served: 2, angry: 8, mistakes: 0 })).toBe(0);
    expect(criticStars(0, 0)).toBe(5);
    expect(criticStars(2, 1)).toBe(1);
    expect(criticStars(9, 9)).toBe(1);
  });
});
