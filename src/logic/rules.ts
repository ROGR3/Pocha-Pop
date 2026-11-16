// Scoring rules shared by the night scene and tests.

/** ×1 for combo 0–4, ×1.5 for 5–9, ×2 from 10. Totals stay unrounded; callers round. */
export function comboMultiplier(combo: number): number {
  return Math.min(2, 1 + 0.5 * Math.floor(combo / 5));
}

/** Coins for one serve. patienceLeft 0..1. Hinted orders get no tip. */
export function serveCoins(difficulty: number, patienceLeft: number, combo: number, hinted: boolean): { base: number; tip: number; total: number } {
  const base = 2 + Math.round(difficulty / 2);
  const tip = hinted ? 0 : Math.round(4 * Math.max(0, Math.min(1, patienceLeft)));
  return { base, tip, total: (base + tip) * comboMultiplier(combo) };
}

export interface NightTally {
  total: number;
  served: number;
  angry: number;
  mistakes: number;
}

/** 0..3 stars. 0 = night failed (next night stays locked). */
export function nightStars(t: NightTally): number {
  if (t.total <= 0) return 0;
  const score = (t.served - 0.25 * t.mistakes) / t.total;
  if (score >= 0.9) return 3;
  if (score >= 0.7) return 2;
  if (score >= 0.45) return 1;
  return 0;
}

/** Critic review 1..5: every mistake −1 star, every walk-out −2. */
export function criticStars(mistakes: number, walkouts: number): number {
  return Math.max(1, Math.min(5, 5 - mistakes - walkouts * 2));
}

export function patienceMultiplier(upgrades: string[], relaxed: boolean, raining: boolean): number {
  let m = 1;
  if (upgrades.includes('lanterns')) m += 0.2;
  if (raining && upgrades.includes('awning')) m += 0.1;
  if (relaxed) m += 0.5;
  return m;
}

/** Current patience mood: 2 = happy, 1 = neutral, 0 = angry. */
export function mood(fraction: number): 0 | 1 | 2 {
  if (fraction > 0.6) return 2;
  if (fraction > 0.28) return 1;
  return 0;
}

// ------------------------------------------------------------------ seats
/** Seats at the counter the player can pick before a night. */
export const SEAT_OPTIONS = [2, 3, 4] as const;
export const DEFAULT_SEATS = 3;
/** Bosses always get this many seats. */
export const BOSS_SEATS = 3;

/** More seats = more parallel orders = harder, so it pays more. */
export function seatMultiplier(seats: number): number {
  if (seats <= 2) return 1;
  if (seats === 3) return 1.15;
  return 1.3;
}

/** Arrival gap scales with the seat count (3 seats = the night's base pace). */
export function spawnInterval(base: [number, number], seats: number): [number, number] {
  const k = 3 / Math.max(1, seats);
  return [base[0] * k, base[1] * k];
}

/**
 * Depth of an order bubble inside the bubble band: less patience left = drawn higher,
 * so a nearly angry customer is never covered by a newer one. Quantised to 20 steps so
 * the depth (and Phaser's display-list sort) changes rarely. Range base+0.1 .. base+0.5.
 */
export function bubbleDepth(base: number, frac: number): number {
  const f = Number.isFinite(frac) ? Math.max(0, Math.min(1, frac)) : 1;
  return base + 0.1 + Math.round((1 - f) * 20) / 50;
}

/** 4 seats ("Nával") unlock after the first 3★ night. */
export function seatsAvailable(nights: Record<number, { stars: number }>, bossNights: number[] = []): number[] {
  const three = Object.entries(nights).some(([n, r]) => !bossNights.includes(Number(n)) && r.stars >= 3);
  return three ? [2, 3, 4] : [2, 3];
}
