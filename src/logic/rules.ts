// Scoring rules shared by the night scene and tests.

export function comboMultiplier(combo: number): number {
  return Math.min(5, 1 + Math.floor(combo / 3));
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
