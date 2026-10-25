// Tiny bit of Czech grammar for generated bubble texts: colour adjectives
// agree with the gender / number of the thing ("červená čepice", "červený
// deštník", "červené kalhoty"), accusative for "Dejte mi červenou sukni".

export type Gender = 'm' | 'f' | 'n' | 'pl';

/** colourFem = feminine nominative, e.g. "červená". All colours are hard adjectives. */
export function colorAdj(colourFem: string, g: Gender, accusative = false): string {
  const stem = colourFem.slice(0, -1);
  if (g === 'f') return stem + (accusative ? 'ou' : 'á');
  if (g === 'm') return stem + 'ý';
  return stem + 'é';
}

export function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
