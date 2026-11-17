import { describe, expect, it } from 'vitest';
import { MemoryBackend, SAVE_VERSION, SaveManager, bumpStreak, currentStreak, defaultSave, deserialize, migrate, serialize } from '../src/logic/save';
import { recordServe, newStat } from '../src/logic/srs';
import { mergeNightRecord } from '../src/logic/track';

describe('save data', () => {
  it('round-trips', () => {
    const s = defaultSave();
    s.coins = 123;
    s.upgrades.push('lanterns');
    s.tracks.read.nights[1] = { stars: 3, bestCoins: 80, plays: 1 };
    s.tracks.listen.words.uyu = recordServe(newStat(), { clean: true, hinted: false, night: 1 });
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
    a.data.tracks.listen.friends.kim = { clean: 3, chapter: 1 };
    await a.save();
    const b = new SaveManager(be);
    await b.load();
    expect(b.data.coins).toBe(42);
    expect(b.data.tracks.listen.friends.kim.chapter).toBe(1);
    expect(b.data.tracks.read.friends.kim).toBeUndefined();
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
    expect(m.tracks.read.nights[1].stars).toBe(3);
    expect(m.tracks.listen.nights).toEqual({});
    // migrating again does not pay twice
    expect(migrate(JSON.parse(serialize(m))).coins).toBe(170);
  });
  it('leaves saves without the stool alone', () => {
    expect(migrate({ coins: 5, upgrades: ['radio'] }).coins).toBe(5);
  });
  it('v3: co-op name, colour and stats get defaults; junk is cleaned', () => {
    const m = migrate({ version: 2, settings: { sfx: 0.3 }, stats: { served: 9, mistakes: 1, nightsPlayed: 2 } });
    expect(m.version).toBe(SAVE_VERSION);
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

describe('migration v3 → v4 (tracks)', () => {
  const v3 = {
    version: 3, coins: 77, upgrades: ['radio'],
    settings: { sfx: 0.4, firstRunDone: true, coopName: 'Jana' },
    nights: { 1: { stars: 3, bestCoins: 40, plays: 2 }, 11: { stars: 4, bestCoins: 90, plays: 1 } },
    words: { uyu: { mastery: 3, seen: 5, correct: 4, errors: 1, lapses: 0, lastNight: 2 } },
    friends: { kim: { clean: 6, chapter: 2 } },
    daily: { '2026-10-20': { stars: 2, coins: 30, served: 7, total: 8 } },
    training: { sessions: 4, best: 17 },
    achievements: ['first_night'],
    stats: { served: 40, mistakes: 3, nightsPlayed: 5, coopNights: 1, coopFirst: 2 },
  };
  it('moves progress into Čtení, Poslech starts empty, shared stays shared', () => {
    const m = migrate(v3);
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.tracks.read.nights[1].stars).toBe(3);
    expect(m.tracks.read.words.uyu.mastery).toBe(3);
    expect(m.tracks.read.friends.kim.chapter).toBe(2);
    expect(m.tracks.read.daily['2026-10-20'].coins).toBe(30);
    expect(m.tracks.read.training).toEqual({ sessions: 4, best: 17 });
    expect(m.tracks.listen).toEqual({ nights: {}, words: {}, friends: {}, daily: {}, training: { sessions: 0, best: 0 } });
    expect(m.coins).toBe(77);
    expect(m.upgrades).toEqual(['radio']);
    expect(m.achievements).toEqual(['first_night']);
    expect(m.stats.served).toBe(40);
    expect(m.settings.track).toBe('read');
    expect(m.settings.voiceRate).toBe(1);
    expect(m.settings.voice).toBe(1);
    expect(m.settings.coopName).toBe('Jana');
    // no stale top-level copies
    for (const k of ['nights', 'words', 'friends', 'daily', 'training']) expect(Object.hasOwn(m, k), k).toBe(false);
  });
  it('marks the stories a v3 player has seen', () => {
    const m = migrate(v3);
    for (const k of ['prologue', 'night:1', 'night:11', 'ending', 'chapter:kim:0', 'chapter:kim:1']) expect(m.storySeen, k).toContain(k);
    expect(m.storySeen).not.toContain('chapter:kim:2');
    expect(m.storySeen).not.toContain('finale');
  });
  it('is stable: v4 → v4 changes nothing', () => {
    const m = migrate(v3);
    m.tracks.listen.nights[1] = { stars: 1, bestCoins: 5, plays: 1 };
    m.settings.track = 'listen';
    expect(migrate(JSON.parse(serialize(m)))).toEqual(m);
  });
  it('v1 → v4 in one go', () => {
    const m = migrate({ version: 1, coins: 10, upgrades: ['stool4'], nights: { 2: { stars: 2, bestCoins: 9, plays: 1 } }, words: { mul: { mastery: 1, seen: 1, correct: 1, errors: 0, lapses: 0, lastNight: 1 } } });
    expect(m.coins).toBe(160);
    expect(m.tracks.read.nights[2].stars).toBe(2);
    expect(m.tracks.read.words.mul.seen).toBe(1);
    expect(m.tracks.listen.nights).toEqual({});
    expect(m.storySeen).toContain('night:2');
  });
  it('cleans junk track / voice settings', () => {
    const m = migrate({ settings: { track: 'sing', voiceRate: 3, voice: 'loud' }, tracks: { read: 5, listen: { nights: [], training: { best: 3 } } } });
    expect(m.settings.track).toBe('read');
    expect(m.settings.voiceRate).toBe(1);
    expect(m.settings.voice).toBe(1);
    expect(m.tracks.read).toEqual({ nights: {}, words: {}, friends: {}, daily: {}, training: { sessions: 0, best: 0 } });
    expect(m.tracks.listen.training).toEqual({ sessions: 0, best: 3 });
    expect(migrate({ settings: { voiceRate: 0.75, voice: 0.3 } }).settings).toMatchObject({ voiceRate: 0.75, voice: 0.3 });
  });
});

describe('perfect nights (golden stars)', () => {
  it('migrate keeps the optional perfect flag per night and track', () => {
    const s = defaultSave();
    s.tracks.read.nights[3] = { stars: 3, bestCoins: 40, plays: 2, perfect: true };
    s.tracks.listen.nights[11] = { stars: 5, bestCoins: 90, plays: 1, perfect: true };
    s.tracks.read.nights[4] = { stars: 2, bestCoins: 20, plays: 1 };
    const m = deserialize(serialize(s));
    expect(m.version).toBe(SAVE_VERSION);
    expect(m.tracks.read.nights[3].perfect).toBe(true);
    expect(m.tracks.listen.nights[11].perfect).toBe(true);
    expect(m.tracks.read.nights[4].perfect).toBeUndefined();
    expect(m.tracks.listen.nights[3]).toBeUndefined();
  });
  it('merge: stars max, perfect once earned stays', () => {
    let r = mergeNightRecord(undefined, { stars: 2, coins: 30, seats: 3, perfect: false });
    expect(r).toEqual({ stars: 2, bestCoins: 30, plays: 1, seats: 3 });
    r = mergeNightRecord(r, { stars: 3, coins: 20, seats: 2, perfect: true });
    expect(r).toEqual({ stars: 3, bestCoins: 30, plays: 2, seats: 3, perfect: true });
    r = mergeNightRecord(r, { stars: 1, coins: 50, seats: 4, perfect: false });
    expect(r).toEqual({ stars: 3, bestCoins: 50, plays: 3, seats: 4, perfect: true });
  });
});
