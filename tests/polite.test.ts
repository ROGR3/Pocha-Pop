import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import icons from '../public/assets/icons.json';
import { ITEM_REACTIONS } from '../src/data/reactions';
import { BYE_WORDS, HELLO_WORDS, REACTIONS, matchPolite, pickReaction, type Greeting } from '../src/logic/polite';
import { rng } from '../src/logic/srs';

const byId = new Map(words.map((w) => [w.id, w]));
const g = (id: string, kind: 'hello' | 'bye'): Greeting => ({ id, ko: byId.get(id)!.ko, kind });
const orders = [{ t: '안경' }, { t: '감자' }];
const T = (o: { t: string }) => o.t;

describe('greetings in matching', () => {
  const greets = [g('annyeonghaseyo', 'hello'), g('gamsahamnida', 'bye')];
  it('greeting words exist with icons', () => {
    for (const id of [...HELLO_WORDS, ...BYE_WORDS]) {
      expect(byId.get(id)?.category).toBe('expr');
      expect(icons.names).toContain(byId.get(id)!.icon);
    }
  });
  it('a greeting prefix is not a mistake', () => {
    const m = matchPolite('안녀', orders, T, greets);
    expect(m.error).toBe(false);
    expect(m.greetPrefix).toBe(true);
    expect(m.greet).toBeNull();
  });
  it('completes a greeting', () => {
    expect(matchPolite('안녕하세요', orders, T, greets).greet?.id).toBe('annyeonghaseyo');
    expect(matchPolite('감사합니다', orders, T, greets).greet?.kind).toBe('bye');
    expect(matchPolite('안녕 하세요', orders, T, greets).greet?.id).toBe('annyeonghaseyo');
  });
  it('orders win on a shared prefix', () => {
    // 안 fits both 안경 (order) and 안녕하세요 (greeting)
    const m = matchPolite('안', orders, T, greets);
    expect(m.orders.prefix.length).toBe(1);
    expect(m.error).toBe(false);
    // a greeting that is also the start of an order waits for the order
    const m2 = matchPolite('감사', [{ t: '감사합니다요' }], T, [g('gamsahamnida', 'bye')]);
    expect(m2.greet).toBeNull();
    const m3 = matchPolite('감사합니다', [{ t: '감사합니다요' }], T, [g('gamsahamnida', 'bye')]);
    expect(m3.greet).toBeNull();
    expect(m3.orders.prefix.length).toBe(1);
  });
  it('without active greetings it behaves like plain matching', () => {
    expect(matchPolite('안녕', orders, T, []).error).toBe(true);
    expect(matchPolite('', orders, T, greets).error).toBe(false);
  });
});

describe('reactions', () => {
  it('every reaction types an existing adjective', () => {
    for (const r of Object.values(REACTIONS)) {
      expect(byId.get(r.word)?.category).toBe('adj');
      expect(icons.names).toContain(byId.get(r.word)!.icon);
    }
  });
  it('item table references real items and reactions', () => {
    for (const [item, rs] of Object.entries(ITEM_REACTIONS)) {
      expect(byId.has(item), item).toBe(true);
      for (const r of rs) expect(REACTIONS[r], r).toBeTruthy();
    }
  });
  it('picks from the item table, default tasty/good, respects filter', () => {
    const rand = rng(3);
    for (let i = 0; i < 20; i++) expect(['spicy', 'tasty']).toContain(pickReaction('tteokbokki', ITEM_REACTIONS, rand));
    for (let i = 0; i < 20; i++) expect(['tasty', 'good', 'okay']).toContain(pickReaction('unknown', ITEM_REACTIONS, rand));
    expect(pickReaction('kimchi', ITEM_REACTIONS, rand, (r) => r !== 'spicy')).toBeNull();
  });
});
