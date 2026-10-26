// Two campaigns over the same nights: Čtení (read the bubble) and Poslech
// (the customer speaks the order). Night progress, word mastery, regulars'
// chapters, the daily challenge and training are kept per track; coins,
// upgrades, cosmetics, badges and stats are shared.
import type { DailyRecord } from './daily';
import type { WordStat } from './srs';

export type Track = 'read' | 'listen';
export const TRACKS: Track[] = ['read', 'listen'];

export interface NightRecord {
  stars: number; // 0..3 (boss: 1..5)
  bestCoins: number;
  plays: number;
  /** Most seats this night was played with (map shows a stool badge). */
  seats?: number;
}

export interface FriendState {
  /** Clean serves (no mistake, no hint) of this regular. */
  clean: number;
  /** Story chapters already shown (0..3). */
  chapter: number;
}

export interface TrackData {
  nights: Record<number, NightRecord>;
  words: Record<string, WordStat>;
  friends: Record<string, FriendState>;
  /** Daily challenge results by day key. */
  daily: Record<string, DailyRecord>;
  training: { sessions: number; best: number };
}

export function emptyTrack(): TrackData {
  return { nights: {}, words: {}, friends: {}, daily: {}, training: { sessions: 0, best: 0 } };
}

const obj = <T>(v: unknown): Record<string, T> => (v && typeof v === 'object' && !Array.isArray(v) ? { ...(v as Record<string, T>) } : {});

/** Older / partial track data onto defaults. */
export function migrateTrack(raw: unknown): TrackData {
  const d = emptyTrack();
  const r = obj<unknown>(raw) as Partial<TrackData>;
  return {
    nights: obj(r.nights) as Record<number, NightRecord>,
    words: obj(r.words),
    friends: obj(r.friends),
    daily: obj(r.daily),
    training: { ...d.training, ...obj<number>(r.training) },
  };
}

export function isTrack(v: unknown): v is Track {
  return v === 'read' || v === 'listen';
}

interface HasTracks { tracks: Record<Track, TrackData>; settings: { track: Track } }

/** Data of the given (default: the current) track. */
export function trackData(s: HasTracks, t: Track = s.settings.track): TrackData {
  return s.tracks[t];
}

/** Shared unlocks (shop items, radio station) follow the best track. */
export function bestChapter(s: HasTracks, regular: string): number {
  return Math.max(...TRACKS.map((t) => s.tracks[t].friends[regular]?.chapter ?? 0));
}

export function playedAnywhere(s: HasTracks, n: number): boolean {
  return TRACKS.some((t) => !!s.tracks[t].nights[n]);
}

export function seenAnywhere(s: HasTracks, id: string): boolean {
  return TRACKS.some((t) => (s.tracks[t].words[id]?.seen ?? 0) > 0);
}

// ------------------------------------------------------------------ listening rules

/** Voice speed: normal / slow (Settings), replays from the 2nd on are always slow. */
export const RATE_NORMAL = 1;
export const RATE_SLOW = 0.75;

/** Replays the player gets for free per order; every further one costs the tip. */
export const FREE_REPLAYS = 1;

/**
 * What the `k`-th replay (1-based, asked by the player) of an order does:
 * the first is free, every further one costs the tip (like a hint) and is slow.
 */
export function replayRule(k: number, baseRate: number): { costsTip: boolean; rate: number } {
  return { costsTip: k > FREE_REPLAYS, rate: k >= 2 ? Math.min(baseRate, RATE_SLOW) : baseRate };
}

/** Rough speaking time used when a backend cannot tell (mock, co-op patience). */
export const MOCK_MS_PER_SYLLABLE = 120;
export function speechMs(text: string): number {
  return MOCK_MS_PER_SYLLABLE * Math.max(1, [...text].filter((ch) => ch >= '가' && ch <= '힣').length);
}

/**
 * Bubble hint in Poslech by the listening mastery – never the word itself
 * (that would turn listening back into reading): mastery 0 → first consonant
 * + a dot per further syllable (김치 → "ㄱ·"), 1 → only the syllable count,
 * 2+ → nothing.
 */
export function listenHint(ko: string, mastery: number, initial: (syllable: string) => string): string {
  const syl = [...ko];
  if (mastery >= 2) return '';
  if (mastery === 1) return '·'.repeat(syl.length);
  return initial(syl[0]) + '·'.repeat(syl.length - 1);
}
