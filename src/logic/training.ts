// Training: 60 s of bubbles only, picked by SRS weight (the words that need it
// most). No coins, mastery counts. New colour words can be met here too.
import { weight, type WordStat } from './srs';

export const TRAINING_SECONDS = 60;
export const TRAINING_BUBBLES = 3;

/**
 * Weighted pick of one word from `pool` (not in `exclude`), favouring high SRS
 * weight; the top of the list is boosted so the "hardest" words come often.
 */
export function trainingPick(pool: string[], stats: Record<string, WordStat>, exclude: Set<string>, rand: () => number): string | null {
  const cand = pool.filter((id) => !exclude.has(id));
  if (!cand.length) return null;
  const ws = cand.map((id) => {
    const w = weight(stats[id], false);
    return w * w; // sharpen: difficult words much more likely
  });
  const total = ws.reduce((a, b) => a + b, 0);
  let r = rand() * total;
  for (let i = 0; i < cand.length; i++) { r -= ws[i]; if (r <= 0) return cand[i]; }
  return cand[cand.length - 1];
}

/** Words to train: everything seen + extra words (e.g. colours) the player can already type. */
export function trainingPool(all: { id: string; jamo: string[] }[], stats: Record<string, WordStat>, known: Set<string>, extra: string[]): string[] {
  const seen = all.filter((w) => (stats[w.id]?.seen ?? 0) > 0).map((w) => w.id);
  const ex = all.filter((w) => extra.includes(w.id) && w.jamo.every((j) => known.has(j))).map((w) => w.id);
  return [...new Set([...seen, ...ex])];
}
