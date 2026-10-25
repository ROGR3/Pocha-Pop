// Daily challenge: one night a day with a fixed seed (same words for everyone
// on that date), mixing words the player already knows.
import { rng } from './srs';

/** Stable 32-bit seed from a "YYYY-MM-DD" key (FNV-1a). */
export function daySeed(day: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < day.length; i++) {
    h ^= day.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h >>> 0;
}

/** Deterministic pick of `size` words from the known ones (sorted first, so order of the save doesn't matter). */
export function dailyPool(known: string[], day: string, size = 16): string[] {
  const ids = [...new Set(known)].sort();
  const rand = rng(daySeed(day));
  for (let i = ids.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [ids[i], ids[j]] = [ids[j], ids[i]];
  }
  return ids.slice(0, size);
}

export interface DailyRecord { stars: number; coins: number; served: number; total: number }

/** One attempt per day: only the first result of the day is kept. */
export function recordDaily(daily: Record<string, DailyRecord>, day: string, r: DailyRecord): boolean {
  if (daily[day]) return false;
  daily[day] = r;
  return true;
}

/** Best daily score so far (coins). */
export function dailyBest(daily: Record<string, DailyRecord>): number {
  return Object.values(daily).reduce((a, r) => Math.max(a, r.coins), 0);
}
