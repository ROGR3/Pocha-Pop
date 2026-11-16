// Grandma's postcard helpers: the "Pozor na" line and the district recap.
import { hasRawJamo } from './hangul';
import { MAX_MASTERY, type WordStat } from './srs';

/** "떡볶이 (tteokbokki) – ㄲ = Shift + ㄱ, …" for the words the player struggled with. */
export function troubleLine(items: { ko: string; cs: string }[], tips: Record<string, string>): string {
  return items.map((w) => {
    const t = Object.keys(tips).filter((k) => [...w.ko].some((ch) => hasRawJamo(ch, k))).map((k) => tips[k]);
    return `${w.ko} (${w.cs})${t.length ? ' – ' + t[0] : ''}`;
  }).join(', ');
}

export interface DistrictRecap {
  /** Words written without hints (mastery >= 2). */
  known: number;
  total: number;
  /** Seen, not yet mastered words to practise: lowest mastery first, then most errors. */
  weakest: string[];
}

export function districtRecap(ids: string[], stats: Record<string, WordStat>, n = 3): DistrictRecap {
  const seen = ids.filter((id) => (stats[id]?.seen ?? 0) > 0);
  const known = seen.filter((id) => stats[id].mastery >= 2).length;
  const weakest = seen.filter((id) => stats[id].mastery < MAX_MASTERY)
    .sort((a, b) => stats[a].mastery - stats[b].mastery || stats[b].errors - stats[a].errors)
    .slice(0, n);
  return { known, total: ids.length, weakest };
}
