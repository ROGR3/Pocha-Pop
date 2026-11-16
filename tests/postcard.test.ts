import { describe, expect, it } from 'vitest';
import { NIGHTS, prevNight } from '../src/data/levels';
import { JAMO_TIPS, POSTCARDS } from '../src/data/story';
import { districtRecap, troubleLine } from '../src/logic/postcard';
import type { WordStat } from '../src/logic/srs';

const card = (n: number) => POSTCARDS[n];

describe('postcard schedule', () => {
  it('the previous card introduces every new jamo of a night', () => {
    for (const m of NIGHTS) {
      if (!m.newJamo.length || m.n === 1) continue;
      let p = prevNight(m.n);
      while (p !== 0 && !card(p)) p = prevNight(p);
      expect(card(p), `card before night ${m.n}`).toBeDefined();
      const all = card(p).text + card(p).tip;
      for (const j of m.newJamo) expect(all, `night ${m.n} jamo ${j} on card ${p}`).toContain(j);
    }
  });

  it('every 을지로 night has a card, later districts at most 3', () => {
    for (let n = 1; n <= 5; n++) expect(card(n)).toBeDefined();
    const opener: Record<string, number> = { dongdaemun: 11, hongdae: 116, yongsan: 121, busan: 126 };
    for (const [d, boss] of Object.entries(opener)) {
      const nights = [boss, ...NIGHTS.filter((x) => x.district === d).map((x) => x.n)];
      expect(nights.filter((n) => card(n)).length, d).toBeLessThanOrEqual(3);
    }
  });

  it('cards stay short enough for a 216 px screen', () => {
    for (const [n, c] of Object.entries(POSTCARDS)) {
      expect(c.text.length, `card ${n} text`).toBeLessThanOrEqual(240);
      expect(c.tip.length, `card ${n} tip`).toBeLessThanOrEqual(120);
    }
  });

  it('recap cards sit on the last night of a district', () => {
    const recaps = Object.entries(POSTCARDS).filter(([, c]) => c.recap).map(([n]) => Number(n));
    expect(recaps.sort((a, b) => a - b)).toEqual([5, 10, 16, 21, 26, 31]);
  });
});

const st = (mastery: number, errors = 0, seen = 1): WordStat => ({ mastery, seen, correct: 0, errors, lapses: 0, lastNight: 0 });

describe('districtRecap', () => {
  it('counts known words and picks the weakest seen ones', () => {
    const r = districtRecap(['a', 'b', 'c', 'd', 'e', 'f'], {
      a: st(0, 1), b: st(2), c: st(0, 4), d: st(1), e: st(5), f: st(3, 0, 0),
    });
    expect(r.total).toBe(6);
    expect(r.known).toBe(2); // b, e (f unseen)
    expect(r.weakest).toEqual(['c', 'a', 'd']);
  });

  it('no seen words → nothing to practise', () => {
    expect(districtRecap(['a', 'b'], {})).toEqual({ known: 0, total: 2, weakest: [] });
  });

  it('mastered words are not suggested', () => {
    expect(districtRecap(['a'], { a: st(5) }).weakest).toEqual([]);
  });
});

describe('troubleLine', () => {
  it('adds the jamo tip', () => {
    expect(troubleLine([{ ko: '떡볶이', cs: 'pálivé rýžové koláčky' }], JAMO_TIPS)).toBe('떡볶이 (pálivé rýžové koláčky) – ㄲ = Shift + ㄱ');
    expect(troubleLine([{ ko: '과자', cs: 'sušenky' }, { ko: '물', cs: 'voda' }], JAMO_TIPS)).toBe('과자 (sušenky) – ㅘ = ㅗ + ㅏ, 물 (voda)');
  });
});
