// 김 대리 the helper: once per night (twice with 4 seats) he serves a
// customer whose patience dropped below 20 %. No tip, no mastery.

export const HELPER_THRESHOLD = 0.2;

export function helperCharges(seats: number): number {
  return seats >= 4 ? 2 : 1;
}

export interface HelperCandidate {
  /** Patience left 0..1. */
  frac: number;
  /** Bosses and tutorial orders are never taken over. */
  eligible: boolean;
}

/**
 * Index of the customer the helper takes over right now, or -1.
 * Picks the least patient eligible customer under the threshold.
 */
export function helperPick(cs: HelperCandidate[], used: number, seats: number, hired: boolean): number {
  if (!hired || used >= helperCharges(seats)) return -1;
  let best = -1;
  for (let i = 0; i < cs.length; i++) {
    const c = cs[i];
    if (!c.eligible || c.frac >= HELPER_THRESHOLD || c.frac <= 0) continue;
    if (best < 0 || c.frac < cs[best].frac) best = i;
  }
  return best;
}
