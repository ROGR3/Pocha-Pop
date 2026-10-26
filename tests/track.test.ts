import { describe, expect, it } from 'vitest';
import { defaultSave, markSeen } from '../src/logic/save';
import { FREE_REPLAYS, RATE_SLOW, bestChapter, listenHint, playedAnywhere, replayRule, seenAnywhere, speechMs, trackData } from '../src/logic/track';
import { newStat, recordServe } from '../src/logic/srs';
import { splitSyllable } from '../src/logic/hangul';

describe('tracks', () => {
  it('the switch flips night progress and mastery, coins / upgrades stay', () => {
    const s = defaultSave();
    s.coins = 100;
    s.upgrades.push('radio');
    trackData(s).nights[1] = { stars: 3, bestCoins: 50, plays: 1 };
    trackData(s).words.mul = recordServe(newStat(), { clean: true, hinted: false, night: 1 });
    s.settings.track = 'listen';
    expect(trackData(s).nights[1]).toBeUndefined();
    expect(trackData(s).words.mul).toBeUndefined();
    trackData(s).nights[1] = { stars: 1, bestCoins: 20, plays: 1 };
    s.coins += 20;
    s.settings.track = 'read';
    expect(trackData(s).nights[1].stars).toBe(3);
    expect(trackData(s).words.mul.mastery).toBe(1);
    expect(s.coins).toBe(120);
    expect(s.upgrades).toEqual(['radio']);
    expect(trackData(s, 'listen').nights[1].stars).toBe(1);
  });
  it('shared unlocks look at both tracks', () => {
    const s = defaultSave();
    s.tracks.listen.friends.park = { clean: 9, chapter: 3 };
    s.tracks.read.friends.park = { clean: 2, chapter: 1 };
    expect(bestChapter(s, 'park')).toBe(3);
    expect(bestChapter(s, 'kim')).toBe(0);
    s.tracks.listen.nights[5] = { stars: 1, bestCoins: 1, plays: 1 };
    expect(playedAnywhere(s, 5)).toBe(true);
    expect(playedAnywhere(s, 6)).toBe(false);
    s.tracks.read.words.bap = { ...newStat(), seen: 1 };
    expect(seenAnywhere(s, 'bap')).toBe(true);
    expect(seenAnywhere(s, 'mul')).toBe(false);
  });
  it('story scenes are remembered once', () => {
    const s = defaultSave();
    expect(markSeen(s, 'prologue')).toBe(false);
    expect(markSeen(s, 'prologue')).toBe(true);
    expect(s.storySeen).toEqual(['prologue']);
  });
});

describe('replay rules', () => {
  it('first replay is free, every further one costs the tip and is slow', () => {
    expect(FREE_REPLAYS).toBe(1);
    expect(replayRule(1, 1)).toEqual({ costsTip: false, rate: 1 });
    expect(replayRule(2, 1)).toEqual({ costsTip: true, rate: RATE_SLOW });
    expect(replayRule(5, 1)).toEqual({ costsTip: true, rate: RATE_SLOW });
    // a slow voice setting stays slow
    expect(replayRule(1, RATE_SLOW).rate).toBe(RATE_SLOW);
  });
  it('mock speaking time: 120 ms per syllable', () => {
    expect(speechMs('김치')).toBe(240);
    expect(speechMs('김치 하나 주세요')).toBe(840);
    expect(speechMs('')).toBe(120);
  });
});

describe('listening hint', () => {
  const ini = (ch: string) => splitSyllable(ch)?.initial ?? ch;
  it('never shows the word itself', () => {
    expect(listenHint('김치', 0, ini)).toBe('ㄱ·');
    expect(listenHint('물', 0, ini)).toBe('ㅁ');
    expect(listenHint('김치', 1, ini)).toBe('··');
    expect(listenHint('김치', 2, ini)).toBe('');
    for (const w of ['물', '우유', '떡볶이']) for (let m = 0; m <= 5; m++) expect(listenHint(w, m, ini)).not.toContain(w);
  });
});
