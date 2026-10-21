import { COMPOUND_VOWELS, DOUBLE_CONSONANTS, SHIFT_VOWELS, rawJamo, syllableCount, toJamo } from './hangul';

export interface DifficultyBreakdown {
  syllables: number;
  batchim: number;
  doubles: number;
  compoundVowels: number;
  shiftVowels: number;
  keystrokes: number;
  score: number;
}

/**
 * Word difficulty: syllables, final consonants (받침), Shift consonants
 * (ㄲㄸㅃㅆㅉ), compound vowels (ㅘㅝㅢ…) and Shift vowels (ㅒㅖ).
 * Higher = harder. Rounded to one decimal place.
 */
export function difficultyBreakdown(word: string): DifficultyBreakdown {
  const syl = rawJamo(word);
  let batchim = 0, doubles = 0, compoundVowels = 0, shiftVowels = 0;
  for (const s of syl) {
    if (s.final) batchim++;
    if (DOUBLE_CONSONANTS.has(s.initial)) doubles++;
    if (DOUBLE_CONSONANTS.has(s.final)) doubles++;
    if (COMPOUND_VOWELS.has(s.medial)) compoundVowels++;
    if (SHIFT_VOWELS.has(s.medial)) shiftVowels++;
  }
  const syllables = syllableCount(word);
  const keystrokes = toJamo(word).length;
  const score = Math.round((syllables * 1 + batchim * 1.5 + doubles * 2 + compoundVowels * 2 + shiftVowels * 1.5 + keystrokes * 0.25) * 10) / 10;
  return { syllables, batchim, doubles, compoundVowels, shiftVowels, keystrokes, score };
}

export function difficulty(word: string): number {
  return difficultyBreakdown(word).score;
}

export function sortByDifficulty<T extends { ko: string }>(words: T[]): T[] {
  return [...words].sort((a, b) => difficulty(a.ko) - difficulty(b.ko) || a.ko.localeCompare(b.ko));
}
