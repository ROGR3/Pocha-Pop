import { describe, expect, it } from 'vitest';
import { composeSyllable, jamoSet, matchAgainst, matchKind, matchedJamo, splitComposing, splitSyllable, syllableCount, toJamo } from '../src/logic/hangul';

describe('jamo decomposition', () => {
  it('splits syllables into initial/medial/final', () => {
    expect(splitSyllable('한')).toEqual({ initial: 'ㅎ', medial: 'ㅏ', final: 'ㄴ' });
    expect(splitSyllable('가')).toEqual({ initial: 'ㄱ', medial: 'ㅏ', final: '' });
    expect(splitSyllable('a')).toBeNull();
  });
  it('composes back', () => {
    expect(composeSyllable('ㅎ', 'ㅏ', 'ㄴ')).toBe('한');
    expect(composeSyllable('ㄲ', 'ㅘ')).toBe('꽈');
  });
  it('decomposes words to keystrokes', () => {
    expect(toJamo('우유')).toEqual(['ㅇ', 'ㅜ', 'ㅇ', 'ㅠ']);
    expect(toJamo('하나')).toEqual(['ㅎ', 'ㅏ', 'ㄴ', 'ㅏ']);
  });
  it('splits compound vowels', () => {
    expect(toJamo('과')).toEqual(['ㄱ', 'ㅗ', 'ㅏ']);
    expect(toJamo('워')).toEqual(['ㅇ', 'ㅜ', 'ㅓ']);
    expect(toJamo('의')).toEqual(['ㅇ', 'ㅡ', 'ㅣ']);
    expect(toJamo('위')).toEqual(['ㅇ', 'ㅜ', 'ㅣ']);
    expect(toJamo('ㅘ')).toEqual(['ㅗ', 'ㅏ']);
  });
  it('splits final consonant clusters', () => {
    expect(toJamo('닭')).toEqual(['ㄷ', 'ㅏ', 'ㄹ', 'ㄱ']);
    expect(toJamo('값')).toEqual(['ㄱ', 'ㅏ', 'ㅂ', 'ㅅ']);
    expect(toJamo('앉')).toEqual(['ㅇ', 'ㅏ', 'ㄴ', 'ㅈ']);
  });
  it('keeps Shift (double) consonants as single keys', () => {
    expect(toJamo('떡')).toEqual(['ㄸ', 'ㅓ', 'ㄱ']);
    expect(toJamo('빵')).toEqual(['ㅃ', 'ㅏ', 'ㅇ']);
    expect(toJamo('짜')).toEqual(['ㅉ', 'ㅏ']);
    expect(toJamo('있')).toEqual(['ㅇ', 'ㅣ', 'ㅆ']);
  });
  it('handles lone compatibility jamo and conjoining jamo from IMEs', () => {
    expect(toJamo('ㅎ')).toEqual(['ㅎ']);
    expect(toJamo('하')).toEqual(['ㅎ', 'ㅏ']); // NFC composes to 하
    expect(toJamo('ᄒ')).toEqual(['ㅎ']);
  });
  it('ignores whitespace', () => {
    expect(toJamo('김치 하나')).toEqual(toJamo('김치하나'));
  });
  it('counts syllables and distinct jamo', () => {
    expect(syllableCount('떡볶이')).toBe(3);
    expect(jamoSet('우유')).toEqual(['ㅇ', 'ㅜ', 'ㅠ']);
  });
});

describe('prefix matching', () => {
  it('accepts the 하나 / 한 intermediate state', () => {
    expect(matchKind('ㅎ', '하나')).toBe('prefix');
    expect(matchKind('하', '하나')).toBe('prefix');
    expect(matchKind('한', '하나')).toBe('prefix');
    expect(matchKind('하나', '하나')).toBe('full');
    expect(matchKind('한', '한강')).toBe('prefix');
  });
  it('accepts IME states of compound vowels', () => {
    expect(matchKind('고', '과자')).toBe('prefix');
    expect(matchKind('과', '과자')).toBe('prefix');
    expect(matchKind('곶', '과자')).toBe('none');
    expect(matchKind('과자', '과자')).toBe('full');
    expect(matchKind('새', '샌드위치')).toBe('prefix');
    expect(matchKind('샌드우', '샌드위치')).toBe('prefix');
    expect(matchKind('샌드윛', '샌드위치')).toBe('prefix');
  });
  it('accepts final consonant that later moves to the next syllable', () => {
    expect(matchKind('웅', '우유')).toBe('prefix');
    expect(matchKind('갋', '갈비')).toBe('prefix');
    expect(matchKind('김ㅊ', '김치')).toBe('prefix');
  });
  it('requires Shift consonants', () => {
    expect(matchKind('ㄸ', '떡')).toBe('prefix');
    expect(matchKind('ㄷ', '떡')).toBe('none');
    expect(matchKind('덕', '떡')).toBe('none');
    expect(matchKind('빠', '빵')).toBe('prefix');
    expect(matchKind('바', '빵')).toBe('none');
    expect(matchKind('ㅉ', '찌개')).toBe('prefix');
  });
  it('rejects wrong and too-long input', () => {
    expect(matchKind('무', '우유')).toBe('none');
    expect(matchKind('우유우', '우유')).toBe('none');
  });
  it('empty input is a prefix of everything', () => {
    expect(matchKind('', '우유')).toBe('prefix');
  });
  it('matches sentences with or without spaces', () => {
    expect(matchKind('김치찌개 하', '김치찌개 하나 주세요')).toBe('prefix');
    expect(matchKind('김치찌개하나주세요', '김치찌개 하나 주세요')).toBe('full');
    expect(matchKind('김치찌개 한', '김치찌개 하나 주세요')).toBe('prefix');
  });
  it('counts matched jamo', () => {
    expect(matchedJamo('한', '하나')).toBe(3);
    expect(matchedJamo('하므', '하나')).toBe(2);
  });
  it('matches against all waiting orders', () => {
    const orders = [{ ko: '라면' }, { ko: '라떼' }, { ko: '우유' }];
    const r = matchAgainst('라', orders, (o) => o.ko);
    expect(r.prefix.map((o) => o.ko)).toEqual(['라면', '라떼']);
    expect(r.full).toBeNull();
    expect(r.error).toBe(false);
    const f = matchAgainst('우유', orders, (o) => o.ko);
    expect(f.full?.ko).toBe('우유');
    const e = matchAgainst('ㅋ', orders, (o) => o.ko);
    expect(e.error).toBe(true);
    expect(matchAgainst('', orders, (o) => o.ko).error).toBe(false);
  });
});

describe('composition split', () => {
  it('separates the syllable being composed', () => {
    expect(splitComposing('김치', true)).toEqual({ done: '김', current: '치' });
    expect(splitComposing('김치', false)).toEqual({ done: '김치', current: '' });
  });
});

import { imeStates } from '../src/game/debug';
describe('IME emulation used by screenshots', () => {
  it('produces 하나 states like a real 두벌식 IME', () => {
    expect(imeStates('하나')).toEqual(['ㅎ', '하', '한', '하나']);
    expect(imeStates('라면')).toEqual(['ㄹ', '라', '람', '라며', '라면']);
  });
  it('every intermediate state is a valid prefix', () => {
    for (const w of ['떡볶이', '샌드위치', '과자', '김치찌개 하나 주세요']) {
      for (const st of imeStates(w)) expect(matchKind(st, w)).not.toBe('none');
    }
  });
});
