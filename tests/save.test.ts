import { describe, expect, it } from 'vitest';
import { MemoryBackend, SAVE_VERSION, SaveManager, bumpStreak, currentStreak, defaultSave, deserialize, migrate, serialize } from '../src/logic/save';
import { recordServe, newStat } from '../src/logic/srs';

describe('save data', () => {
  it('round-trips', () => {
    const s = defaultSave();
    s.coins = 123;
    s.upgrades.push('lanterns');
    s.nights[1] = { stars: 3, bestCoins: 80, plays: 1 };
    s.words.uyu = recordServe(newStat(), { clean: true, hinted: false, night: 1 });
    expect(deserialize(serialize(s))).toEqual(s);
  });
  it('migrates partial / broken data', () => {
    expect(deserialize(null)).toEqual(defaultSave());
    expect(deserialize('{nope')).toEqual(defaultSave());
    const m = migrate({ coins: 5, settings: { sfx: 0.1 } });
    expect(m.coins).toBe(5);
    expect(m.settings.sfx).toBe(0.1);
    expect(m.settings.ambient).toBe(0.5);
    expect(m.upgrades).toEqual([]);
    expect(migrate({ coins: 'x' }).coins).toBe(0);
  });
  it('saves and loads through a backend', async () => {
    const be = new MemoryBackend();
    const a = new SaveManager(be);
    await a.load();
    a.data.coins = 42;
    a.data.friends.kim = { clean: 3, chapter: 1 };
    await a.save();
    const b = new SaveManager(be);
    await b.load();
    expect(b.data.coins).toBe(42);
    expect(b.data.friends.kim.chapter).toBe(1);
  });
  it('reset keeps settings', async () => {
    const m = new SaveManager(new MemoryBackend());
    await m.load();
    m.data.coins = 9;
    m.data.settings.sfx = 0.2;
    await m.reset();
    expect(m.data.coins).toBe(0);
    expect(m.data.settings.sfx).toBe(0.2);
    expect(m.data.settings.firstRunDone).toBe(true);
  });
  it('survives a failing backend', async () => {
    const m = new SaveManager({ load: async () => { throw new Error('x'); }, save: async () => { throw new Error('y'); } });
    await m.load();
    await expect(m.save()).resolves.toBeUndefined();
  });
});

describe('daily streak', () => {
  const d = (s: string) => new Date(s + 'T20:00:00');
  it('counts consecutive days', () => {
    let s = { count: 0, lastDay: '' };
    s = bumpStreak(s, d('2026-10-01'));
    expect(s.count).toBe(1);
    s = bumpStreak(s, d('2026-10-01'));
    expect(s.count).toBe(1);
    s = bumpStreak(s, d('2026-10-02'));
    expect(s.count).toBe(2);
    s = bumpStreak(s, d('2026-10-05'));
    expect(s.count).toBe(1);
  });
  it('handles month boundaries', () => {
    expect(bumpStreak({ count: 4, lastDay: '2026-10-31' }, d('2026-11-01')).count).toBe(5);
  });
  it('shows a broken streak as 0', () => {
    expect(currentStreak({ count: 4, lastDay: '2026-10-01' }, d('2026-10-02'))).toBe(4);
    expect(currentStreak({ count: 4, lastDay: '2026-10-01' }, d('2026-10-04'))).toBe(0);
  });
});

describe('migration v1 → v2', () => {
  it('refunds the removed 4th stool once', () => {
    const v1 = { version: 1, coins: 20, upgrades: ['lanterns', 'stool4'], nights: { 1: { stars: 3, bestCoins: 50, plays: 2 } } };
    const m = migrate(v1);
    expect(m.upgrades).toEqual(['lanterns']);
    expect(m.coins).toBe(170);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.settings.seats).toBe(3);
    expect(m.nights[1].stars).toBe(3);
    // migrating again does not pay twice
    expect(migrate(JSON.parse(serialize(m))).coins).toBe(170);
  });
  it('leaves saves without the stool alone', () => {
    expect(migrate({ coins: 5, upgrades: ['radio'] }).coins).toBe(5);
  });
  it('v3: co-op name, colour and stats get defaults; junk is cleaned', () => {
    const m = migrate({ version: 2, settings: { sfx: 0.3 }, stats: { served: 9, mistakes: 1, nightsPlayed: 2 } });
    expect(m.version).toBe(3);
    expect(m.settings.coopName).toBe('');
    expect(m.settings.coopColor).toBe('orange');
    expect(m.stats.coopNights).toBe(0);
    expect(m.stats.coopFirst).toBe(0);
    expect(m.stats.served).toBe(9);
    const j = migrate({ settings: { coopName: '  Bartoloměj  ', coopColor: 'purple' }, stats: { coopNights: 'x', coopFirst: 4 } });
    expect(j.settings.coopName).toBe('Bartolom');
    expect(j.settings.coopColor).toBe('orange');
    expect(j.stats.coopNights).toBe(0);
    expect(j.stats.coopFirst).toBe(4);
  });
});
