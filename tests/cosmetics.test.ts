import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import icons from '../public/assets/icons.json';
import { COLORS, HATS, HAT_METRICS, PARTS, colorFrame } from '../src/data/colors';
import { HAT_STACK_MAX, buyAndEquip, clearHats, defaultCosmetics, hatStackLayout, hatState, hatSway, itemState, popHat, pushHat, unequip } from '../src/logic/cosmetics';
import { migrate } from '../src/logic/save';

const byId = new Map(words.map((w) => [w.id, w]));

describe('colour data', () => {
  it('11 colours, each a colour word with an icon', () => {
    expect(COLORS.length).toBe(11);
    for (const c of COLORS) {
      const w = byId.get(c.word)!;
      expect(w.category).toBe('color');
      expect(w.ko.endsWith('색')).toBe(true);
      expect(icons.names).toContain(w.icon);
    }
    expect(byId.get('saek')?.ko).toBe('색');
  });
  it('frames: 0 = original, then colour order', () => {
    expect(colorFrame(null)).toBe(0);
    expect(colorFrame('red')).toBe(1);
    expect(colorFrame('brown')).toBe(11);
  });
  it('prices in the designed ranges', () => {
    for (const p of PARTS) { expect(p.price).toBeGreaterThanOrEqual(100); expect(p.price).toBeLessThanOrEqual(150); }
    expect(HATS.length).toBe(5);
    for (const h of HATS) { expect(h.price).toBeGreaterThanOrEqual(20); expect(h.price).toBeLessThanOrEqual(40); }
  });
});

describe('buying cosmetics', () => {
  it('locked until the word is known, then costs coins once', () => {
    const c = defaultCosmetics();
    expect(itemState(c, 'roof', 'red', 80, 500, false)).toBe('locked');
    expect(buyAndEquip(c, 'roof', 'red', 80, 500, false)).toBeNull();
    expect(itemState(c, 'roof', 'red', 80, 50, true)).toBe('poor');
    expect(buyAndEquip(c, 'roof', 'red', 80, 100, true)).toBe(20);
    expect(c.roof).toBe('red');
    expect(itemState(c, 'roof', 'red', 80, 0, true)).toBe('equipped');
    unequip(c, 'roof');
    expect(itemState(c, 'roof', 'red', 80, 0, true)).toBe('owned');
    expect(buyAndEquip(c, 'roof', 'red', 80, 0, true)).toBe(0); // free re-equip
    // owning a colour for one part does not own it for another
    expect(itemState(c, 'sign', 'red', 50, 0, true)).toBe('poor');
  });
  it('save migration keeps / defaults cosmetics', () => {
    expect(migrate({}).cosmetics).toEqual(defaultCosmetics());
    const m = migrate({ cosmetics: { roof: 'blue', owned: ['roof:blue'] } });
    expect(m.cosmetics.roof).toBe('blue');
    expect(m.cosmetics.hats).toEqual([]);
  });
  it('save migration turns the single hat into a 1-hat tower', () => {
    const m = migrate({ cosmetics: { hat: 'crown', owned: ['hat:crown', 'hat:cap'] } });
    expect(m.cosmetics.hats).toEqual(['crown']);
    expect('hat' in m.cosmetics).toBe(false);
    expect(m.cosmetics.owned).toEqual(['hat:crown', 'hat:cap']);
    expect(migrate({ cosmetics: { hat: null } }).cosmetics.hats).toEqual([]);
    expect(migrate({ cosmetics: { hat: 'crown', hats: ['cap', 'bow'] } }).cosmetics.hats).toEqual(['cap', 'bow']);
    expect(migrate({ cosmetics: { hats: ['cap', 3, null, 'bow'] } }).cosmetics.hats).toEqual(['cap', 'bow']);
    expect(migrate({ cosmetics: { hats: Array(1200).fill('cap') } }).cosmetics.hats.length).toBe(HAT_STACK_MAX);
  });
  it('hats bought before the tower go back on once for free', () => {
    const c = migrate({ cosmetics: { hat: 'crown', owned: ['hat:crown', 'hat:cap', 'roof:red'] } }).cosmetics;
    expect(c.freeHats).toEqual(['cap']);
    expect(hatState(c, 20, 0, 'cap')).toBe('free');
    expect(pushHat(c, 'cap', 20, 0)).toBe(0);
    expect(c.hats).toEqual(['crown', 'cap']);
    expect(c.freeHats).toEqual([]);
    expect(hatState(c, 20, 0, 'cap')).toBe('poor');
    expect(pushHat(c, 'crown', 40, 100)).toBe(60); // the worn one stays worn, a second costs coins
    // already-v5 saves keep their credits and get no new ones
    expect(migrate({ cosmetics: { hats: [], owned: ['hat:bow'], freeHats: ['straw', 1] } }).cosmetics.freeHats).toEqual(['straw']);
    expect(migrate({ cosmetics: { hats: [], owned: ['hat:bow'] } }).cosmetics.freeHats).toEqual([]);
  });
});

describe('hat tower', () => {
  it('every hat costs its flat price and goes on top', () => {
    const c = defaultCosmetics();
    expect(hatState(c, 20, 100)).toBe('buy');
    expect(pushHat(c, 'cap', 20, 100)).toBe(80);
    expect(pushHat(c, 'crown', 40, 80)).toBe(40);
    expect(pushHat(c, 'cap', 20, 40)).toBe(20); // same price again
    expect(c.hats).toEqual(['cap', 'crown', 'cap']);
    expect(c.owned).toEqual(['hat:cap', 'hat:crown']);
    expect(hatState(c, 40, 20)).toBe('poor');
    expect(pushHat(c, 'crown', 40, 20)).toBeNull();
    expect(c.hats.length).toBe(3);
  });
  it('caps at 1000 hats', () => {
    const c = defaultCosmetics();
    c.hats = Array(HAT_STACK_MAX).fill('bow');
    expect(hatState(c, 20, 1e9)).toBe('full');
    expect(pushHat(c, 'bow', 20, 1e9)).toBeNull();
    expect(c.hats.length).toBe(HAT_STACK_MAX);
  });
  it('taking hats off is free and keeps the badge progress', () => {
    const c = defaultCosmetics();
    pushHat(c, 'cap', 20, 100);
    pushHat(c, 'straw', 30, 80);
    popHat(c);
    expect(c.hats).toEqual(['cap']);
    clearHats(c);
    expect(c.hats).toEqual([]);
    popHat(c);
    expect(c.hats).toEqual([]);
    expect(c.owned).toEqual(['hat:cap', 'hat:straw']);
  });
});

describe('hat tower layout', () => {
  it('hat metrics fit the 14×10 frame', () => {
    for (const h of HATS) {
      expect(h.top).toBeGreaterThanOrEqual(0);
      expect(h.top).toBeLessThan(h.bottom);
      expect(h.bottom).toBeLessThanOrEqual(9);
      expect(h.cx).toBeGreaterThan(0);
      expect(h.cx).toBeLessThan(14);
    }
  });
  it('hat 0 sits where the single hat used to, upper hats share exactly one outline row', () => {
    expect(hatStackLayout([], HAT_METRICS)).toEqual([]);
    const l = hatStackLayout(['cap', 'beanie'], HAT_METRICS);
    expect(l[0]).toEqual({ dx: 0, dy: 0 });
    // beanie's bottom row 9 lands on cap's top row 3, its row 8 sits above cap
    expect(l[1].dy + 9).toBe(3);
    expect(l[1].dy + 8).toBeLessThan(3);
    expect(l[1].dx).toBe(Math.round(5.5 - 7));
  });
  it('a random mix always climbs 4..9 px per hat, 1000 hats included', () => {
    const ids = HATS.map((h) => h.id);
    let seed = 7;
    const mix = Array.from({ length: HAT_STACK_MAX }, () => ids[(seed = (seed * 48271) % 2147483647) % ids.length]);
    const l = hatStackLayout(mix, HAT_METRICS);
    expect(l.length).toBe(HAT_STACK_MAX);
    for (let i = 1; i < l.length; i++) {
      const step = l[i - 1].dy - l[i].dy;
      expect(step).toBeGreaterThanOrEqual(4);
      expect(step).toBeLessThanOrEqual(9);
      expect(Math.abs(l[i].dx)).toBeLessThanOrEqual(5);
    }
  });
  it('sway is 0 on the head and grows with height up to 6 px', () => {
    for (let t = 0; t < 10000; t += 137) {
      expect(hatSway(0, t)).toBe(0);
      expect(Math.abs(hatSway(5, t))).toBeLessThanOrEqual(1);
      expect(Math.abs(hatSway(999, t))).toBeLessThanOrEqual(6);
    }
    const amp = (i: number) => Math.max(...Array.from({ length: 200 }, (_, t) => Math.abs(hatSway(i, t * 50))));
    expect(amp(200)).toBeGreaterThan(amp(10));
  });
});
