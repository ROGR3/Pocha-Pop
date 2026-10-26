// Poslech: customers speak their orders. One queue for the whole game –
// customers talk one after another, never over each other (250 ms apart) –
// and the ambience / radio duck to 40 % while somebody speaks.
// Backends: TauriTts (Android TextToSpeech via src-tauri/src/tts.rs),
// WebSpeechTts (browser with a Korean voice), MockTts (?tts=mock, tests:
// "speaks" 120 ms per syllable and records into __pocha.spoken).
import { isTauri } from '../logic/save';
import { speechMs } from '../logic/track';

export interface TtsStatus { available: boolean; korean: boolean }

export interface TtsBackend {
  readonly name: string;
  status(): Promise<TtsStatus>;
  /** Resolves when the utterance has finished (or failed). */
  speak(text: string, rate: number, volume: number, id: string): Promise<void>;
  stop(): void;
  installData?(): Promise<boolean>;
}

/** Never wait for a lost "done" longer than this beyond the expected time. */
const DONE_GRACE_MS = 4000;
export const GAP_MS = 250;

class TauriTts implements TtsBackend {
  readonly name = 'tauri';
  private waiters = new Map<string, () => void>();
  private hooked: Promise<void> | null = null;

  private hook() {
    this.hooked ??= import('@tauri-apps/api/event').then((ev) => ev.listen<{ id: string }>('tts://done', (e) => {
      const w = this.waiters.get(e.payload.id);
      if (w) { this.waiters.delete(e.payload.id); w(); }
    })).then(() => undefined, (e) => console.warn('tts listen', e));
    return this.hooked;
  }

  private async invoke<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    const { invoke } = await import('@tauri-apps/api/core');
    return invoke<T>(cmd, args);
  }

  async status(): Promise<TtsStatus> {
    await this.hook();
    try { return await this.invoke<TtsStatus>('tts_status'); } catch { return { available: false, korean: false }; }
  }

  async speak(text: string, rate: number, volume: number, id: string) {
    await this.hook();
    const done = new Promise<void>((resolve) => {
      this.waiters.set(id, resolve);
      setTimeout(() => { if (this.waiters.delete(id)) resolve(); }, speechMs(text) / rate + DONE_GRACE_MS);
    });
    try { await this.invoke('tts_speak', { text, rate, volume, id }); } catch (e) { console.warn('tts_speak', e); this.waiters.delete(id); return; }
    await done;
  }

  stop() {
    for (const w of this.waiters.values()) w();
    this.waiters.clear();
    this.invoke('tts_stop').catch(() => {});
  }

  async installData() {
    try { await this.invoke('tts_install_data'); return true; } catch { return false; }
  }
}

class WebSpeechTts implements TtsBackend {
  readonly name = 'webspeech';
  private voice(): SpeechSynthesisVoice | null {
    return speechSynthesis.getVoices().find((v) => v.lang.toLowerCase().startsWith('ko')) ?? null;
  }
  async status(): Promise<TtsStatus> {
    if (!('speechSynthesis' in window)) return { available: false, korean: false };
    // voices load asynchronously in Chrome
    if (!speechSynthesis.getVoices().length) await new Promise((r) => { speechSynthesis.onvoiceschanged = r; setTimeout(r, 1500); });
    return { available: true, korean: !!this.voice() };
  }
  speak(text: string, rate: number, volume: number) {
    return new Promise<void>((resolve) => {
      const u = new SpeechSynthesisUtterance(text);
      u.lang = 'ko-KR';
      u.voice = this.voice();
      u.rate = rate;
      u.volume = volume;
      u.onend = u.onerror = () => resolve();
      setTimeout(resolve, speechMs(text) / rate + DONE_GRACE_MS);
      speechSynthesis.speak(u);
    });
  }
  stop() { speechSynthesis.cancel(); }
}

export interface Spoken { text: string; rate: number; at: number }

export class MockTts implements TtsBackend {
  readonly name = 'mock';
  /** Everything said, in order (window.__pocha.spoken). */
  spoken: Spoken[] = [];
  private timers = new Set<() => void>();
  async status() { return { available: true, korean: true }; }
  speak(text: string, rate: number) {
    this.spoken.push({ text, rate, at: Date.now() });
    return new Promise<void>((resolve) => {
      const done = () => { this.timers.delete(done); clearTimeout(t); resolve(); };
      const t = setTimeout(done, speechMs(text));
      this.timers.add(done);
    });
  }
  stop() { [...this.timers].forEach((f) => f()); }
}

interface Item {
  text: string;
  rate: number;
  tag?: unknown;
  onStart?: () => void;
  resolve: () => void;
}

export class Speech {
  backend: TtsBackend | null = null;
  status: TtsStatus = { available: false, korean: false };
  /** Resolves once the backend answered its status (Android: TTS init ~0.5 s). */
  ready: Promise<TtsStatus> = Promise.resolve(this.status);
  volume = 1;
  /** Ducking hook (Audio). */
  onDuck: ((on: boolean) => void) | null = null;
  private queue: Item[] = [];
  private current: Item | null = null;
  private seq = 0;
  private gen = 0;

  init(backend: TtsBackend | null) {
    this.backend = backend;
    this.ready = backend
      ? backend.status().then((s) => (this.status = s), () => this.status)
      : Promise.resolve(this.status);
    return this.ready;
  }

  /** Re-ask the backend (e.g. back from the system voice installer). */
  refresh() { return this.init(this.backend); }

  /** Korean voice ready to speak. */
  get ok(): boolean { return this.status.available && this.status.korean; }

  /** Is `tag` (a customer) speaking right now? */
  speaking(tag?: unknown): boolean {
    return !!this.current && (tag === undefined || this.current.tag === tag);
  }

  /** Queued or speaking for `tag`. */
  pending(tag: unknown): boolean {
    return this.current?.tag === tag || this.queue.some((q) => q.tag === tag);
  }

  speak(text: string, opts: { rate?: number; tag?: unknown; onStart?: () => void } = {}): Promise<void> {
    return new Promise((resolve) => {
      this.queue.push({ text, rate: opts.rate ?? 1, tag: opts.tag, onStart: opts.onStart, resolve });
      if (!this.current) void this.pump();
    });
  }

  /** Drop what a customer still had to say (they left / were served). */
  cancel(tag: unknown) {
    this.queue = this.queue.filter((q) => (q.tag === tag ? (q.resolve(), false) : true));
  }

  stop() {
    this.gen++;
    const all = [...this.queue, ...(this.current ? [this.current] : [])];
    this.queue = [];
    this.current = null;
    this.backend?.stop();
    all.forEach((q) => q.resolve());
    this.onDuck?.(false);
  }

  private async pump() {
    const gen = this.gen;
    while (this.queue.length && gen === this.gen) {
      const it = this.queue.shift()!;
      this.current = it;
      this.onDuck?.(true);
      it.onStart?.();
      if (this.backend && this.ok) await this.backend.speak(it.text, it.rate, this.volume, `u${++this.seq}`);
      else await new Promise((r) => setTimeout(r, speechMs(it.text)));
      if (gen !== this.gen) return;
      this.current = null;
      it.resolve();
      if (this.queue.length) await new Promise((r) => setTimeout(r, GAP_MS));
    }
    if (gen === this.gen && !this.current) this.onDuck?.(false);
  }
}

/** Tauri → plugin, else ?tts=mock (tests), else the browser's Web Speech. */
export function pickBackend(search = typeof location !== 'undefined' ? location.search : ''): TtsBackend | null {
  if (isTauri()) return new TauriTts();
  if (/[?&]tts=mock\b/.test(search)) return new MockTts();
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) return new WebSpeechTts();
  return null;
}
