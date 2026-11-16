import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import icons from '../public/assets/icons.json';
import clothes from '../public/assets/clothes.json';
import { NIGHTS, UPGRADES, nightPool } from '../src/data/levels';
import { jamoSet } from '../src/logic/hangul';
import { colorOrderShape, comboMultiplier, criticStars, nightStars, pairPatience, serveCoins } from '../src/logic/rules';

const byId = new Map(words.map((w) => [w.id, w]));

describe('word data', () => {
  it('every word has Czech text, unique id and an icon', () => {
    const ids = new Set<string>();
    for (const w of words) {
      expect(w.cs.length).toBeGreaterThan(0);
      expect(ids.has(w.id)).toBe(false);
      ids.add(w.id);
      expect([...icons.names, ...clothes.names], w.id).toContain(w.icon);
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
    expect(comboMultiplier(4)).toBe(1);
    expect(comboMultiplier(5)).toBe(1.5);
    expect(comboMultiplier(10)).toBe(2);
    expect(comboMultiplier(99)).toBe(2);
    expect(comboMultiplier(1000)).toBeLessThanOrEqual(2);
  });
  it('upgrade prices: total in the designed range, none cheap', () => {
    const sum = UPGRADES.reduce((a, u) => a + u.price, 0);
    expect(sum).toBeGreaterThanOrEqual(2000);
    expect(sum).toBeLessThanOrEqual(3000);
    for (const u of UPGRADES) expect(u.price, u.id).toBeGreaterThanOrEqual(100);
  });
  it('coins: tips for speed, none when hinted', () => {
    expect(serveCoins(4, 1, 0, false).tip).toBe(4);
    expect(serveCoins(4, 1, 0, true).tip).toBe(0);
    expect(serveCoins(4, 0.5, 5, false).total).toBe((4 + 2) * 1.5);
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

describe('동대문 ramp', () => {
  const ddm = NIGHTS.filter((n) => n.district === 'dongdaemun');
  it('spreads the 26 words over nights 12-16, at most 7 a night', () => {
    const all = ['ot', 'chima', 'baji', 'moja', 'gabang', 'ppalgansaek', 'paransaek', 'noransaek', 'geomeunsaek',
      'gudu', 'undonghwa', 'jigap', 'usan', 'choroksaek', 'bunhongsaek', 'borasaek', 'hayansaek',
      'angyeong', 'hanbok', 'mokgeori', 'tisyeocheu', 'sigye', 'juhwangsaek', 'galsaek', 'hoesaek', 'saek'];
    for (const n of ddm) expect(n.newWords.length).toBeLessThanOrEqual(7);
    expect(ddm.flatMap((n) => n.newWords).sort()).toEqual([...all].sort());
    expect(ddm.find((n) => n.n === 12)!.newWords).toContain('ppalgansaek'); // postcard example 빨간색 모자
  });
  it('pairs get more common night by night', () => {
    const c = ddm.map((n) => n.combo ?? 0.85);
    for (let i = 1; i < c.length; i++) expect(c[i]).toBeGreaterThanOrEqual(c[i - 1]);
  });
  it('order shape and pair patience', () => {
    expect(colorOrderShape(0.1, 0.3)).toBe('combo');
    expect(colorOrderShape(0.5, 0.3)).toBe('color');
    expect(colorOrderShape(0.9, 0.3)).toBe('item');
    expect(colorOrderShape(0.5)).toBe('combo');
    expect(colorOrderShape(0.9)).toBe('color');
    expect(colorOrderShape(0.95)).toBe('item');
    expect(pairPatience(2, true)).toBe(1.3);
    expect(pairPatience(1, true)).toBe(1);
    expect(pairPatience(2, false)).toBe(1);
  });
});
