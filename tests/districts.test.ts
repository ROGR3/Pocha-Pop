import { describe, expect, it } from 'vitest';
import words from '../src/data/words.json';
import icons from '../public/assets/icons.json';
import clothes from '../public/assets/clothes.json';
import { DESTINATIONS, TICKETED } from '../src/data/travel';
import { BODY_PARTS, SYMPTOMS } from '../src/data/pharmacy';
import { FAMILY_FOR } from '../src/data/family';

const byId = new Map(words.map((w) => [w.id, w]));
const ICONS = new Set([...icons.names, ...clothes.names]);

describe('부산 destinations', () => {
  it('every destination has at least one valid transport answer', () => {
    for (const d of DESTINATIONS) {
      expect(byId.get(d.id)?.category, d.id).toBe('travel');
      expect(d.answers.length, d.id).toBeGreaterThan(0);
      for (const a of d.answers) expect(byId.get(a)?.category, a).toBe('travel');
      expect(ICONS.has(d.icon)).toBe(true);
    }
  });
  it('the spec routes hold', () => {
    const r = Object.fromEntries(DESTINATIONS.map((d) => [d.id, d.answers]));
    expect(r.jejudo).toContain('bae_boat');
    expect(r.seoul).toContain('gicha');
    expect(r.gonghang).toEqual(expect.arrayContaining(['beoseu', 'jihacheol']));
    expect(r.gangnam).toContain('jihacheol');
    expect(r.incheon).toContain('gicha');
  });
  it('ticketed transports exist; every destination has a ticketed answer or only taxi', () => {
    for (const t of TICKETED) expect(byId.has(t)).toBe(true);
  });
});

describe('약국', () => {
  it('body parts and remedies are pharmacy words with icons', () => {
    for (const id of BODY_PARTS) expect(byId.get(id)?.category, id).toBe('body');
    for (const s of SYMPTOMS) {
      expect(ICONS.has(s.icon), s.icon).toBe(true);
      for (const a of s.answers) expect(['yak', 'banchanggo', 'byeongwon']).toContain(a);
    }
  });
});

describe('추석', () => {
  it('every family word has a "for whom" text', () => {
    for (const w of words.filter((x) => x.category === 'family')) expect(FAMILY_FOR[w.id], w.id).toBeTruthy();
  });
});
