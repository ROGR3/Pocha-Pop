// Persistent game state. Backend: @tauri-apps/plugin-store inside Tauri,
// localStorage in a plain browser (Vite dev / Playwright), memory in tests.
import { defaultCosmetics, mergeCosmetics, type Cosmetics } from './cosmetics';
import { PLAYER_COLORS, cleanName, type PlayerColor } from './netproto';
import { RATE_NORMAL, RATE_SLOW, emptyTrack, isTrack, migrateTrack, type Track, type TrackData } from './track';

export type { FriendState, NightRecord, TrackData, Track } from './track';

export const SAVE_VERSION = 4;
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
  /** Co-op: name shown to the other players ('' = not chosen yet). */
  coopName: string;
  coopColor: PlayerColor;
  /** Campaign: Čtení / Poslech (v4). */
  track: Track;
  /** Voice speed (1 / 0.75) and volume (0..1) in Poslech. */
  voiceRate: number;
  voice: number;
  /** The chef's Poslech intro was shown. */
  listenIntro: boolean;
}

export interface SaveData {
  version: number;
  settings: Settings;
  coins: number;
  upgrades: string[];
  /** Per-track progress (nights, mastery, regulars, daily, training). */
  tracks: Record<Track, TrackData>;
  /** Story scenes already seen in any track (Poslech offers "Přeskočit"). */
  storySeen: string[];
  streak: { count: number; lastDay: string };
  stats: Stats;
  cosmetics: Cosmetics;
  /** Unlocked achievement ids. */
  achievements: string[];
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
  /** Co-op nights played / orders served first in co-op. */
  coopNights: number;
  coopFirst: number;
  /** Poslech nights finished without asking for a single replay. */
  listenNoReplay?: number;
}

export function defaultSave(): SaveData {
  return {
    version: SAVE_VERSION,
    settings: { sfx: 0.8, ambient: 0.5, relaxed: false, firstRunDone: false, seats: 3, station: 1, coopName: '', coopColor: 'orange', track: 'read', voiceRate: RATE_NORMAL, voice: 1, listenIntro: false },
    coins: 0,
    upgrades: [],
    tracks: { read: emptyTrack(), listen: emptyTrack() },
    storySeen: [],
    streak: { count: 0, lastDay: '' },
    stats: { served: 0, mistakes: 0, nightsPlayed: 0, coopNights: 0, coopFirst: 0 },
    cosmetics: defaultCosmetics(),
    achievements: [],
  };
}

/** Merge unknown / older data onto defaults so new fields always exist. */
export function migrate(raw: unknown): SaveData {
  const d = defaultSave();
  if (!raw || typeof raw !== 'object') return d;
  const r = raw as Partial<SaveData> & Record<string, unknown>;
  // v3 → v4: the single progress becomes the Čtení track, Poslech starts empty
  const rt = (r.tracks && typeof r.tracks === 'object' ? r.tracks : null) as Partial<Record<Track, unknown>> | null;
  const tracks = rt
    ? { read: migrateTrack(rt.read), listen: migrateTrack(rt.listen) }
    : { read: migrateTrack({ nights: r.nights, words: r.words, friends: r.friends, daily: r.daily, training: r.training }), listen: emptyTrack() };
  const { nights: _n, words: _w, friends: _f, daily: _d, training: _t, ...rest } = r;
  void _n; void _w; void _f; void _d; void _t;
  const out: SaveData = {
    ...d,
    ...rest,
    version: SAVE_VERSION,
    settings: { ...d.settings, ...(r.settings ?? {}) },
    upgrades: Array.isArray(r.upgrades) ? [...r.upgrades] : [],
    tracks,
    storySeen: Array.isArray(r.storySeen) ? r.storySeen.filter((x): x is string => typeof x === 'string') : seenFromProgress(tracks.read, r.settings?.firstRunDone === true),
    streak: { ...d.streak, ...(r.streak ?? {}) },
    stats: { ...d.stats, ...(r.stats ?? {}) },
    coins: typeof r.coins === 'number' && isFinite(r.coins) ? r.coins : 0,
    cosmetics: mergeCosmetics(r.cosmetics),
    achievements: Array.isArray(r.achievements) ? [...r.achievements] : [],
  };
  // v1 → v2: the 4th stool is no longer an upgrade but a choice before each night
  if (out.upgrades.includes('stool4')) {
    out.upgrades = out.upgrades.filter((u) => u !== 'stool4');
    out.coins += STOOL4_REFUND;
  }
  // v3: co-op name / colour / stats
  out.settings.coopName = typeof out.settings.coopName === 'string' ? cleanName(out.settings.coopName) : '';
  if (!PLAYER_COLORS.includes(out.settings.coopColor)) out.settings.coopColor = 'orange';
  for (const k of ['coopNights', 'coopFirst'] as const) if (typeof out.stats[k] !== 'number' || !isFinite(out.stats[k])) out.stats[k] = 0;
  // v4: track + voice
  const st = out.settings;
  if (!isTrack(st.track)) st.track = 'read';
  st.voiceRate = st.voiceRate === RATE_SLOW ? RATE_SLOW : RATE_NORMAL;
  st.voice = typeof st.voice === 'number' && isFinite(st.voice) ? Math.max(0, Math.min(1, st.voice)) : 1;
  st.listenIntro = st.listenIntro === true;
  return out;
}

/** Story scenes a pre-v4 player has already seen, judged by their Čtení progress. */
export function seenFromProgress(t: TrackData, firstRun: boolean): string[] {
  const out: string[] = [];
  if (firstRun || Object.keys(t.nights).length) out.push('prologue');
  for (const n of Object.keys(t.nights)) out.push(`night:${n}`);
  // after the 한강 critic / the 부산 captain / the last 약국 night
  if (t.nights[11]) out.push('ending');
  if (t.nights[131]) out.push('finale');
  if (t.nights[204]) out.push('pharmacy_outro');
  for (const [r, f] of Object.entries(t.friends)) for (let k = 0; k < (f?.chapter ?? 0); k++) out.push(`chapter:${r}:${k}`);
  return out;
}

/** Remember a story scene; true when it had been seen before. */
export function markSeen(s: SaveData, key: string): boolean {
  if (s.storySeen.includes(key)) return true;
  s.storySeen.push(key);
  return false;
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
