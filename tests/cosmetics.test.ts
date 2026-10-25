import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import icons from '../public/assets/icons.json';
import { COLORS, HATS, PARTS, colorFrame } from '../src/data/colors';
import { buyAndEquip, defaultCosmetics, itemState, unequip } from '../src/logic/cosmetics';
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
    for (const p of PARTS) { expect(p.price).toBeGreaterThanOrEqual(40); expect(p.price).toBeLessThanOrEqual(80); }
    expect(HATS.length).toBe(5);
    for (const h of HATS) { expect(h.price).toBeGreaterThanOrEqual(30); expect(h.price).toBeLessThanOrEqual(60); }
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
    expect(m.cosmetics.hat).toBeNull();
  });
});
