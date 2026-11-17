import { describe, expect, it } from 'vitest';
import { joinTokens, tokenAt, typoToken, type Order } from '../src/game/orders';

const tok = (id: string, ko: string) => ({ id, ko });

function order(answers: { id: string; ko: string }[][]): Order {
  const [first, ...rest] = answers;
  return { tokens: first, target: joinTokens(first), alts: rest.length ? rest : undefined, cs: '', icons: [], hinted: false, mistakes: first.map(() => false), kind: 'generic' };
}

describe('typoToken', () => {
  it('blames the hint answer token', () => {
    const o = order([[tok('a', '빨간'), tok('b', '모자')]]);
    expect(typoToken(o, '빨간 모ㅋ')).toEqual({ i: 1, id: 'b' });
    expect(tokenAt(o, '빨ㅋ')).toBe(0);
  });

  it('blames the alternative answer the player was typing', () => {
    const o = order([[tok('bus', '버스')], [tok('train', '기차')]]);
    expect(typoToken(o, '기ㅋ')).toEqual({ i: 0, id: 'train' });
    const o2 = order([[tok('x', '머리')], [tok('y', '배'), tok('z', '아파요')]]);
    expect(typoToken(o2, '배 아ㅋ')).toEqual({ i: 1, id: 'z' });
  });
});
