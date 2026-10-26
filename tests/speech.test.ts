import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { GAP_MS, MockTts, Speech, pickBackend } from '../src/game/speech';

describe('speech queue', () => {
  beforeEach(() => { vi.useFakeTimers(); });
  afterEach(() => { vi.useRealTimers(); });

  it('customers speak one after another with a 250 ms gap, ducking meanwhile', async () => {
    const mock = new MockTts();
    const s = new Speech();
    const duck: boolean[] = [];
    s.onDuck = (on) => duck.push(on);
    await s.init(mock);
    expect(s.ok).toBe(true);
    const done: string[] = [];
    const a = s.speak('김치', { tag: 'A' }).then(() => done.push('A'));
    const b = s.speak('물 주세요', { tag: 'B', rate: 0.75 }).then(() => done.push('B'));
    await vi.advanceTimersByTimeAsync(10);
    expect(mock.spoken.map((x) => x.text)).toEqual(['김치']);
    expect(s.speaking('A')).toBe(true);
    expect(s.speaking('B')).toBe(false);
    expect(s.pending('B')).toBe(true);
    await vi.advanceTimersByTimeAsync(240); // 2 syllables × 120 ms
    expect(done).toEqual(['A']);
    expect(mock.spoken.length).toBe(1); // still the gap
    await vi.advanceTimersByTimeAsync(GAP_MS);
    expect(mock.spoken.map((x) => x.text)).toEqual(['김치', '물 주세요']);
    expect(mock.spoken[1].rate).toBe(0.75);
    await vi.advanceTimersByTimeAsync(480); // 4 syllables
    await Promise.all([a, b]);
    expect(done).toEqual(['A', 'B']);
    expect(duck[0]).toBe(true);
    expect(duck[duck.length - 1]).toBe(false);
    expect(s.speaking()).toBe(false);
  });

  it('cancel drops a customer still waiting in the queue, stop ends everything', async () => {
    const mock = new MockTts();
    const s = new Speech();
    await s.init(mock);
    const p1 = s.speak('우유', { tag: 1 });
    const p2 = s.speak('두부', { tag: 2 });
    s.cancel(2);
    await p2; // resolved at once
    await vi.advanceTimersByTimeAsync(1000);
    await p1;
    expect(mock.spoken.map((x) => x.text)).toEqual(['우유']);
    const p3 = s.speak('라면', { tag: 3 });
    s.speak('만두', { tag: 4 });
    s.stop();
    await p3;
    await vi.advanceTimersByTimeAsync(1000);
    expect(mock.spoken.map((x) => x.text)).toEqual(['우유', '라면']);
  });

  it('without a voice the queue still paces itself (nothing is said)', async () => {
    const s = new Speech();
    await s.init(null);
    expect(s.ok).toBe(false);
    let done = false;
    s.speak('김치').then(() => { done = true; });
    await vi.advanceTimersByTimeAsync(239);
    expect(done).toBe(false);
    await vi.advanceTimersByTimeAsync(2);
    expect(done).toBe(true);
  });

  it('?tts=mock picks the mock outside Tauri', () => {
    expect(pickBackend('?tts=mock')?.name).toBe('mock');
  });
});
