// Persistent game state. Backend: @tauri-apps/plugin-store inside Tauri,
// localStorage in a plain browser (Vite dev / Playwright), memory in tests.
import type { WordStat } from './srs';
import { defaultCosmetics, mergeCosmetics, type Cosmetics } from './cosmetics';
import type { DailyRecord } from './daily';

export const SAVE_VERSION = 2;
/** Coins refunded for the removed "4th stool" upgrade (stage 1 → 2). */
export const STOOL4_REFUND = 150;

export interface Settings {
  sfx: number; // 0..1
  ambient: number; // 0..1
  relaxed: boolean; // longer patience
  firstRunDone: boolean;
  /** Last seat count picked on the map (2..4). */
  seats: number;
  /** Radio station (2 = night jazz, unlocked by 박 사장). */
  station: number;
}

export interface NightRecord {
  stars: number; // 0..3 (boss: 1..5)
  bestCoins: number;
  plays: number;
  /** Most seats this night was played with (map shows a stool badge). */
  seats?: number;
}

export interface FriendState {
  /** Clean serves (no mistake, no hint) of this regular. */
  clean: number;
  /** Story chapters already shown (0..3). */
  chapter: number;
}

export interface SaveData {
  version: number;
  settings: Settings;
  coins: number;
  upgrades: string[];
  nights: Record<number, NightRecord>;
  words: Record<string, WordStat>;
  friends: Record<string, FriendState>;
  streak: { count: number; lastDay: string };
  stats: Stats;
  cosmetics: Cosmetics;
  /** Unlocked achievement ids. */
  achievements: string[];
  /** Daily challenge results by day key. */
  daily: Record<string, DailyRecord>;
  training: { sessions: number; best: number };
}

export interface Stats {
  served: number;
  mistakes: number;
  nightsPlayed: number;
  /** Orders served without a mistake (all time). */
  cleanServed?: number;
  bestCombo?: number;
  greetings?: number;
  /** Clean serves of words containing each Shift jamo. */
  shiftClean?: Record<string, number>;
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    settings: { sfx: 0.8, ambient: 0.5, relaxed: false, firstRunDone: false, seats: 3, station: 1 },
    coins: 0,
    upgrades: [],
    nights: {},
    words: {},
    friends: {},
    streak: { count: 0, lastDay: '' },
    stats: { served: 0, mistakes: 0, nightsPlayed: 0 },
    cosmetics: defaultCosmetics(),
    achievements: [],
    daily: {},
    training: { sessions: 0, best: 0 },
  };
}

/** Merge unknown / older data onto defaults so new fields always exist. */
export function migrate(raw: unknown): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<SaveData>;
  const out: SaveData = {
    ...d,
    ...r,
    version: SAVE_VERSION,
    settings: { ...d.settings, ...(r.settings ?? {}) },
    upgrades: Array.isArray(r.upgrades) ? [...r.upgrades] : [],
    nights: { ...(r.nights ?? {}) },
    words: { ...(r.words ?? {}) },
    friends: { ...(r.friends ?? {}) },
    streak: { ...d.streak, ...(r.streak ?? {}) },
    stats: { ...d.stats, ...(r.stats ?? {}) },
    coins: typeof r.coins === 'number' && isFinite(r.coins) ? r.coins : 0,
    cosmetics: mergeCosmetics(r.cosmetics),
    achievements: Array.isArray(r.achievements) ? [...r.achievements] : [],
    daily: { ...(r.daily ?? {}) },
    training: { ...d.training, ...(r.training ?? {}) },
  };
  // v1 → v2: the 4th stool is no longer an upgrade but a choice before each night
  if (out.upgrades.includes('stool4')) {
    out.upgrades = out.upgrades.filter((u) => u !== 'stool4');
    out.coins += STOOL4_REFUND;
  }
  return out;
}

export function serialize(s: SaveData): string {
  return JSON.stringify(s);
}

export function deserialize(text: string | null | undefined): SaveData {
  if (!text) return defaultSave();
  try {
    return migrate(JSON.parse(text));
  } catch {
    return defaultSave();
  }
}

// ------------------------------------------------------------------ streak

export function dayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Daily streak 🔥: consecutive calendar days with at least one night played. */
export function bumpStreak(streak: { count: number; lastDay: string }, now: Date): { count: number; lastDay: string } {
  const today = dayKey(now);
  if (streak.lastDay === today) return { ...streak };
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  if (streak.lastDay === dayKey(y)) return { count: streak.count + 1, lastDay: today };
  return { count: 1, lastDay: today };
}

/** Streak as shown on the map: broken if the last play was before yesterday. */
export function currentStreak(streak: { count: number; lastDay: string }, now: Date): number {
  const today = dayKey(now);
  const y = new Date(now);
  y.setDate(y.getDate() - 1);
  return streak.lastDay === today || streak.lastDay === dayKey(y) ? streak.count : 0;
}

// ------------------------------------------------------------------ storage

export interface StorageBackend {
  load(): Promise<string | null>;
  save(text: string): Promise<void>;
}

export class MemoryBackend implements StorageBackend {
  constructor(public text: string | null = null) {}
  async load() { return this.text; }
  async save(t: string) { this.text = t; }
}

const LS_KEY = 'pocha-pop-save';

export class LocalStorageBackend implements StorageBackend {
  async load() {
    try { return localStorage.getItem(LS_KEY); } catch { return null; }
  }
  async save(t: string) {
    try { localStorage.setItem(LS_KEY, t); } catch { /* private mode */ }
  }
}

export class TauriStoreBackend implements StorageBackend {
  private store: Promise<{ get<T>(k: string): Promise<T | undefined>; set(k: string, v: unknown): Promise<void>; save(): Promise<void> }>;
  constructor() {
    this.store = import('@tauri-apps/plugin-store').then((m) => m.load('pocha-pop.json', { autoSave: false, defaults: {} }));
  }
  async load() {
    const s = await this.store;
    return (await s.get<string>('save')) ?? null;
  }
  async save(t: string) {
    const s = await this.store;
    await s.set('save', t);
    await s.save();
  }
}

export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

export class SaveManager {
  data: SaveData = defaultSave();
  private pending: Promise<void> = Promise.resolve();
  constructor(private backend: StorageBackend) {}

  async load(): Promise<SaveData> {
    let text: string | null = null;
    try { text = await this.backend.load(); } catch { text = null; }
    this.data = deserialize(text);
    return this.data;
  }

  /** Serialised writes; never throws. */
  save(): Promise<void> {
    const text = serialize(this.data);
    this.pending = this.pending.then(() => this.backend.save(text)).catch((e) => console.warn('save failed', e));
    return this.pending;
  }

  async reset(): Promise<void> {
    const keep = { ...this.data.settings };
    this.data = defaultSave();
    this.data.settings = { ...keep, firstRunDone: true };
    await this.save();
  }
}

export function createBackend(): StorageBackend {
  if (isTauri()) {
    // Fall back to localStorage if the plugin is unavailable for any reason.
    const t = new TauriStoreBackend();
    const ls = new LocalStorageBackend();
    return {
      async load() { try { return (await t.load()) ?? (await ls.load()); } catch { return ls.load(); } },
      async save(text) { await ls.save(text); try { await t.save(text); } catch (e) { console.warn(e); } },
    };
  }
  return new LocalStorageBackend();
}
