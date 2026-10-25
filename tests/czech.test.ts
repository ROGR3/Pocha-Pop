import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import { CLOTHES } from '../src/data/clothes';
import { colorAdj } from '../src/logic/czech';

describe('czech colour agreement', () => {
  it('nominative by gender', () => {
    expect(colorAdj('červená', 'm')).toBe('červený');
    expect(colorAdj('červená', 'f')).toBe('červená');
    expect(colorAdj('modrá', 'n')).toBe('modré');
    expect(colorAdj('šedá', 'pl')).toBe('šedé');
  });
  it('accusative', () => {
    expect(colorAdj('růžová', 'f', true)).toBe('růžovou');
    expect(colorAdj('hnědá', 'm', true)).toBe('hnědý');
  });
  it('every clothes word has a gender', () => {
    for (const w of words.filter((x) => x.category === 'clothes')) expect(CLOTHES[w.id], w.id).toBeTruthy();
  });
});
