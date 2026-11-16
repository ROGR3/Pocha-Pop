import { describe, expect, it } from 'vitest';
import { COOP_SEATS, COOP_SEAT_MUL, CoopReferee, RUNOFF_MS, coopCustomers, coopSeats, coopSpawn, crowned, firstCoins, patienceFrac, COOP_WALK_MS, runoffCoins } from '../src/logic/coop';
import { serveCoins, spawnInterval } from '../src/logic/rules';
import type { PlayerInfo } from '../src/logic/netproto';

const P: PlayerInfo[] = [
  { pid: 0, name: '민지', color: 'orange' },
  { pid: 1, name: 'Tom', color: 'blue' },
  { pid: 2, name: 'Eva', color: 'green' },
];
const ok = (now: number, o: Partial<{ patience: number; clean: boolean; hinted: boolean }> = {}) => ({ now, patience: 1, clean: true, hinted: false, ...o });

describe('co-op scaling', () => {
  it('4 seats, more customers, 4-seat pace', () => {
    expect(coopSeats(2)).toBe(4);
    expect(coopSeats(3)).toBe(COOP_SEATS);
    expect(coopCustomers(10, 1)).toBe(10);
    expect(coopCustomers(10, 2)).toBe(14);
    expect(coopCustomers(10, 3)).toBe(17);
    expect(coopCustomers(12, 3)).toBe(20);
    expect(coopSpawn([3, 5])).toEqual(spawnInterval([3, 5], 4));
  });
  it('coins: COOP_SEAT_MUL for everyone, runoff = half without tip, rounded up', () => {
    expect(COOP_SEAT_MUL).toBe(1.15);
    expect(firstCoins(4, 1, 0, false)).toBe(Math.round(serveCoins(4, 1, 0, false).total * COOP_SEAT_MUL));
    expect(runoffCoins(4, 0)).toBe(Math.ceil((2 + 2) * COOP_SEAT_MUL / 2));
    expect(runoffCoins(3, 0)).toBe(Math.ceil(serveCoins(3, 0, 0, true).total * COOP_SEAT_MUL / 2));
    expect(runoffCoins(4, 6)).toBe(Math.ceil(4 * 1.5 * COOP_SEAT_MUL / 2));
  });
});

describe('runoff rule', () => {
  it('first gets full coins, second in the runoff half, third after the runoff nothing', () => {
    const r = new CoopReferee(P);
    r.open(1, 4);
    expect(r.isOpen(1)).toBe(true);
    const a = r.done(0, 1, ok(1000));
    expect(a).toEqual({ kind: 'first', coins: firstCoins(4, 1, 1, false) });
    expect(r.inRunoff(1)).toBe(true);
    const b = r.done(1, 1, ok(1000 + RUNOFF_MS - 1));
    expect(b).toEqual({ kind: 'runoff', coins: runoffCoins(4, 0) });
    expect(r.done(2, 1, ok(1000 + RUNOFF_MS + 1))).toBeNull();
    expect(r.player(0)!.first).toBe(1);
    expect(r.player(1)!.runoff).toBe(1);
    expect(r.player(2)!.coins).toBe(0);
    expect(r.player(2)!.mistakes).toBe(0);
    expect(r.served).toBe(1);
  });
  it('a player cannot score the same order twice; unknown orders are ignored', () => {
    const r = new CoopReferee(P);
    r.open(1, 2);
    expect(r.done(0, 1, ok(0))?.kind).toBe('first');
    expect(r.done(0, 1, ok(10))).toBeNull();
    expect(r.done(1, 99, ok(10))).toBeNull();
    expect(r.done(7, 1, ok(10))).toBeNull();
  });
  it('runoff closes after RUNOFF_MS, or early when everyone finished', () => {
    const r = new CoopReferee(P.slice(0, 2));
    r.open(1, 2); r.open(2, 2);
    r.done(0, 1, ok(0));
    r.done(0, 2, ok(0));
    expect(r.expired(100)).toEqual([]);
    r.done(1, 2, ok(200));
    expect(r.expired(300)).toEqual([2]);
    expect(r.expired(RUNOFF_MS)).toEqual([1]);
    expect(r.done(1, 1, ok(RUNOFF_MS - 1))).toBeNull();
  });
  it('combo is personal; runoff neither breaks nor raises it', () => {
    const r = new CoopReferee(P.slice(0, 2));
    for (let i = 1; i <= 3; i++) { r.open(i, 2); r.done(0, i, ok(i * 10)); }
    expect(r.player(0)!.combo).toBe(3);
    r.open(4, 2);
    r.done(1, 4, ok(100));
    expect(r.done(0, 4, ok(200))?.kind).toBe('runoff');
    expect(r.player(0)!.combo).toBe(3);
    expect(r.player(1)!.combo).toBe(1);
    // an unclean first serve resets it
    r.open(5, 2);
    r.done(0, 5, ok(300, { clean: false }));
    expect(r.player(0)!.combo).toBe(0);
    expect(r.player(0)!.bestCombo).toBe(3);
  });
  it('typo in the runoff only breaks the combo; on an open order it counts for the team', () => {
    const r = new CoopReferee(P.slice(0, 2));
    r.open(1, 2); r.open(2, 2);
    r.done(0, 1, ok(0));
    r.done(1, 2, ok(0));
    r.miss(1, 1);
    expect(r.player(1)!.combo).toBe(0);
    expect(r.player(1)!.mistakes).toBe(0);
    r.open(3, 2);
    r.miss(1, 3);
    r.miss(0, -1);
    expect(r.player(1)!.mistakes).toBe(1);
    expect(r.player(0)!.mistakes).toBe(1);
  });
  it('hinted first serve: no tip', () => {
    const r = new CoopReferee(P.slice(0, 2));
    r.open(1, 4);
    expect(r.done(0, 1, ok(0, { hinted: true, patience: 1 }))).toEqual({ kind: 'first', coins: firstCoins(4, 1, 1, true) });
    expect(firstCoins(4, 1, 1, true)).toBeLessThan(firstCoins(4, 1, 1, false));
  });
  it('team stars use the average mistakes', () => {
    const r = new CoopReferee(P);
    for (let i = 1; i <= 10; i++) { r.open(i, 2); r.done(i % 3, i, ok(i)); }
    for (let k = 0; k < 6; k++) r.miss(k % 3, -1);
    // 10 served of 10, 6 mistakes / 3 players = 2 → (10 − 0.5) / 10 = 0.95 → 3★
    expect(r.stars(10)).toBe(3);
    for (let k = 0; k < 12; k++) r.miss(0, -1);
    // 18 / 3 = 6 → (10 − 1.5) / 10 = 0.85 → 2★
    expect(r.stars(10)).toBe(2);
    const s = r.summary(4, 10);
    expect(s.mistakes).toBe(18);
    expect(s.players.map((p) => p.first)).toEqual([3, 4, 3]);
    expect(crowned(s.players)).toEqual([1]);
  });
  it('walk-out: the customer leaves for everyone, combos reset', () => {
    const r = new CoopReferee(P.slice(0, 2));
    r.open(1, 2); r.open(2, 2);
    r.done(0, 1, ok(0));
    expect(r.walkOut(1)).toBe(false);
    expect(r.walkOut(2)).toBe(true);
    expect(r.walkOut(2)).toBe(false);
    expect(r.angry).toBe(1);
    expect(r.player(0)!.combo).toBe(0);
    expect(r.done(1, 2, ok(10))).toBeNull();
    expect(r.stars(2)).toBe(1);
  });
  it('a guest who leaves is ignored, the others carry on', () => {
    const r = new CoopReferee(P);
    r.open(1, 2);
    r.drop(2);
    r.done(0, 1, ok(0));
    expect(r.done(2, 1, ok(10))).toBeNull();
    r.done(1, 1, ok(20));
    // everyone still here finished → closes early
    expect(r.expired(30)).toEqual([1]);
    expect(r.summary(1, 1).players.find((p) => p.pid === 2)!.left).toBe(true);
  });
  it('crown: nobody when nobody served first, ties share it', () => {
    expect(crowned([{ pid: 0, first: 0 }, { pid: 1, first: 0 }])).toEqual([]);
    expect(crowned([{ pid: 0, first: 2 }, { pid: 1, first: 2 }])).toEqual([0, 1]);
  });
  it('patience from the shared host clock', () => {
    expect(patienceFrac(0, 10000, 0)).toBe(1);
    expect(patienceFrac(0, 10000, COOP_WALK_MS + 5000)).toBeCloseTo(0.5);
    expect(patienceFrac(0, 10000, COOP_WALK_MS + 20000)).toBe(0);
  });
});
