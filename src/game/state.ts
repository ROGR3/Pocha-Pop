// Global game services: save data, word table, audio, IME.
import wordsJson from '../data/words.json';
import iconsJson from '../../public/assets/icons.json';
import clothesJson from "../../public/assets/clothes.json";
import { colorFrame } from '../data/colors';
import { SaveManager, createBackend, bumpStreak, currentStreak } from '../logic/save';
import { newStat, type WordStat } from '../logic/srs';
import { Audio } from './audio';
import { Ime } from './ime';
import { Speech } from './speech';
import type { Layout } from './layout';
import type { NetSession } from './net';
import { NIGHTS, prevNight } from '../data/levels';
import { bestChapter, trackData, type Track, type TrackData } from '../logic/track';

export interface Word {
  id: string;
  ko: string;
  cs: string;
  en: string;
  category: string;
  icon: string;
  difficulty: number;
  /** Original spelling of a loanword (shown in 홍대). */
  loan?: string;
}

export const WORDS: Word[] = wordsJson as Word[];
export const WORD = new Map(WORDS.map((w) => [w.id, w]));

/** Frame index of a food icon in the icons sheet. */
export function iconIdx(name: string): number {
  return Math.max(0, iconsJson.names.indexOf(name));
}

/**
 * Texture + frame of a word icon. Clothes live in their own recoloured sheet:
 * "moja" = default colour, "cl:moja:red" = a red cap (frame 0 = neutral grey).
 */
export function iconTex(name: string): [string, number] {
  if (name.startsWith('cl:')) {
    const [, item, color] = name.split(':');
    return ['clothes', Math.max(0, (clothesJson.names as string[]).indexOf(item)) * 12 + colorFrame(color)];
  }
  const ci = (clothesJson.names as string[]).indexOf(name);
  if (ci >= 0) return ['clothes', ci * 12 + colorFrame((clothesJson.defaults as Record<string, string>)[name])];
  return ['icons', iconIdx(name)];
}

export function word(id: string): Word {
  const w = WORD.get(id);
  if (!w) throw new Error('unknown word ' + id);
  return w;
}

class GameState {
  save = new SaveManager(createBackend());
  audio = new Audio();
  /** Poslech: the customers' voice (queue + backend). */
  speech = new Speech();
  ime!: Ime;
  layout!: Layout;
  /** Debug/test only: game speed multiplier for nights (window.__pocha.G.speed). */
  speed = 1;
  /** Night the player picked on the map. */
  night = 1;
  /** Co-op session (lobby / night), null in single player. */
  net: NetSession | null = null;

  get data() { return this.save.data; }

  /** Current campaign (Čtení / Poslech). */
  get trackId(): Track { return this.data.settings.track; }
  get listening(): boolean { return this.data.settings.track === 'listen'; }

  /** Progress of the current track (nights, words, friends, daily, training). */
  track(t?: Track): TrackData { return trackData(this.data, t); }

  stat(id: string, t?: Track): WordStat {
    return this.track(t).words[id] ?? newStat();
  }

  setStat(id: string, s: WordStat) {
    this.track().words[id] = s;
  }

  /** Regular's chapter for shared unlocks (shop, radio): the better track counts. */
  chapter(regular: string): number { return bestChapter(this.data, regular); }

  isUnlocked(n: number): boolean {
    const p = prevNight(n);
    if (!p) return true;
    const prev = this.track().nights[p];
    return !!prev && prev.stars > 0;
  }

  /** The night to play next: first unlocked main-line night without a record (else the last unlocked). */
  frontier(): number {
    let last = 1;
    for (const d of NIGHTS) {
      if (d.district === 'pharmacy' || d.district === 'holiday' || !this.isUnlocked(d.n)) continue;
      if (!this.track().nights[d.n]) return d.n;
      last = d.n;
    }
    return last;
  }

  hasUpgrade(id: string) { return this.data.upgrades.includes(id); }

  /** Radio station: 1 = lo-fi, 2 = night jazz (after 박 사장 repaired the radio). */
  station(): 1 | 2 {
    return this.chapter('park') >= 3 && this.data.settings.station === 2 ? 2 : 1;
  }

  streak(): number { return currentStreak(this.data.streak, new Date()); }

  markPlayedToday() { this.data.streak = bumpStreak(this.data.streak, new Date()); }

  applyVolumes() {
    this.audio.sfxVolume = this.data.settings.sfx;
    this.audio.ambientVolume = this.data.settings.ambient;
    this.audio.updateAmbientGain();
    this.speech.volume = this.data.settings.voice;
  }

  /** Voice speed from Settings (1 / 0.75). */
  voiceRate(): number { return this.data.settings.voiceRate; }
}

export const G = new GameState();
