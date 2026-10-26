import { describe, expect, it } from 'vitest';
import { ACHIEVEMENTS, evaluate, newlyUnlocked, SHIFT_JAMO, type AchievementInput } from '../src/logic/achievements';
import { dailyBest, dailyPool, daySeed, recordDaily } from '../src/logic/daily';
import { trainingPick, trainingPool } from '../src/logic/training';
import { defaultSave, migrate } from '../src/logic/save';
import { newStat, rng } from '../src/logic/srs';

const input = (over: Partial<AchievementInput> = {}): AchievementInput => ({
  save: defaultSave(), groups: { food: ['a', 'b'], ddm: ['c'] }, bossNights: { critic: 11, captain: 131 },
  allJamo: ['ㄱ', 'ㄴ'], metJamo: new Set(['ㄱ']), regulars: ['kim'], colors: ['red', 'blue'], hats: ['cap'], streak: 0, ...over,
});

describe('achievements', () => {
  it('about twenty, unique ids', () => {
    expect(ACHIEVEMENTS.length).toBeGreaterThanOrEqual(20);
    expect(new Set(ACHIEVEMENTS.map((a) => a.id)).size).toBe(ACHIEVEMENTS.length);
  });
  it('nothing for a fresh save', () => {
    expect(evaluate(input())).toEqual([]);
  });
  it('unlocks from progress', () => {
    const s = defaultSave();
    const r = s.tracks.read;
    r.nights[1] = { stars: 1, bestCoins: 1, plays: 1 };
    r.nights[11] = { stars: 5, bestCoins: 1, plays: 1 };
    s.stats.bestCombo = 12;
    s.stats.cleanServed = 100;
    s.stats.greetings = 50;
    s.stats.shiftClean = Object.fromEntries(SHIFT_JAMO.map((j) => [j, 3]));
    r.words.a = { ...newStat(), seen: 1 };
    r.words.b = { ...newStat(), seen: 2 };
    s.upgrades.push('helper');
    r.friends.kim = { clean: 9, chapter: 3 };
    s.cosmetics.owned = ['roof:red', 'stools:blue', 'hat:cap'];
    r.daily['2026-10-25'] = { stars: 3, coins: 50, served: 8, total: 8 };
    const got = evaluate(input({ save: s, metJamo: new Set(['ㄱ', 'ㄴ']), streak: 7 }));
    for (const id of ['first_night', 'combo10', 'clean100', 'shift', 'all_jamo', 'polite', 'book_food', 'boss_critic', 'streak7', 'colors', 'hats', 'helper', 'stories', 'daily']) expect(got, id).toContain(id);
    expect(got).not.toContain('book_ddm');
    expect(got).not.toContain('boss_captain');
    expect(got).not.toContain('listen_first');
  });
  it('Poslech badges: first night, no replay, the critic', () => {
    const s = defaultSave();
    s.tracks.listen.nights[1] = { stars: 2, bestCoins: 1, plays: 1 };
    let got = evaluate(input({ save: s }));
    expect(got).toContain('listen_first');
    expect(got).toContain('first_night');
    expect(got).not.toContain('listen_noreplay');
    expect(got).not.toContain('listen_boss');
    s.stats.listenNoReplay = 1;
    s.tracks.listen.nights[11] = { stars: 1, bestCoins: 1, plays: 1 };
    got = evaluate(input({ save: s }));
    expect(got).toContain('listen_noreplay');
    expect(got).toContain('listen_boss');
    // the critic in Čtení does not count for Poslech
    const t = defaultSave();
    t.tracks.read.nights[11] = { stars: 5, bestCoins: 1, plays: 1 };
    expect(evaluate(input({ save: t }))).not.toContain('listen_boss');
  });
  it('progress badges count in either track', () => {
    const s = defaultSave();
    s.tracks.listen.words.a = { ...newStat(), seen: 1 };
    s.tracks.read.words.b = { ...newStat(), seen: 1 };
    s.tracks.listen.friends.kim = { clean: 9, chapter: 3 };
    const got = evaluate(input({ save: s }));
    expect(got).toContain('book_food');
    expect(got).toContain('stories');
  });
  it('hat purchases do not count as colours', () => {
    const s = defaultSave();
    s.cosmetics.owned = ['hat:red', 'roof:blue'];
    expect(evaluate(input({ save: s }))).not.toContain('colors');
  });
  it('reports only new ones', () => {
    const s = defaultSave();
    s.achievements = ['first_night'];
    expect(newlyUnlocked(s, ['first_night', 'combo10'])).toEqual(['combo10']);
  });
  it('save keeps achievements / daily / training', () => {
    const m = migrate({ achievements: ['x'], daily: { d: { stars: 1, coins: 2, served: 1, total: 1 } }, training: { sessions: 3 } });
    expect(m.achievements).toEqual(['x']);
    expect(m.tracks.read.daily.d.coins).toBe(2);
    expect(m.tracks.read.training).toEqual({ sessions: 3, best: 0 });
  });
});

describe('daily challenge', () => {
  it('seed is stable per day and differs between days', () => {
    expect(daySeed('2026-10-25')).toBe(daySeed('2026-10-25'));
    expect(daySeed('2026-10-25')).not.toBe(daySeed('2026-10-26'));
  });
  it('pool is deterministic regardless of input order', () => {
    const k = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const p1 = dailyPool(k, '2026-10-25', 5);
    expect(dailyPool([...k].reverse(), '2026-10-25', 5)).toEqual(p1);
    expect(p1.length).toBe(5);
    expect(new Set(p1).size).toBe(5);
  });
  it('one attempt per day', () => {
    const d: Record<string, { stars: number; coins: number; served: number; total: number }> = {};
    expect(recordDaily(d, 'x', { stars: 2, coins: 40, served: 5, total: 6 })).toBe(true);
    expect(recordDaily(d, 'x', { stars: 3, coins: 90, served: 6, total: 6 })).toBe(false);
    expect(d.x.coins).toBe(40);
    recordDaily(d, 'y', { stars: 3, coins: 70, served: 6, total: 6 });
    expect(dailyBest(d)).toBe(70);
  });
});

describe('training', () => {
  it('prefers words with trouble', () => {
    const stats = { easy: { ...newStat(), seen: 10, mastery: 5 }, hard: { ...newStat(), seen: 10, lapses: 4 } };
    const rand = rng(1);
    let hard = 0;
    for (let i = 0; i < 200; i++) if (trainingPick(['easy', 'hard'], stats, new Set(), rand) === 'hard') hard++;
    expect(hard).toBeGreaterThan(170);
    expect(trainingPick(['easy'], stats, new Set(['easy']), rand)).toBeNull();
  });
  it('pool: seen words + typeable extras (colours)', () => {
    const all = [{ id: 'a', jamo: ['ㄱ'] }, { id: 'red', jamo: ['ㄱ'] }, { id: 'white', jamo: ['ㅑ'] }];
    const pool = trainingPool(all, { a: { ...newStat(), seen: 1 } }, new Set(['ㄱ']), ['red', 'white']);
    expect(pool.sort()).toEqual(['a', 'red']);
  });
});
