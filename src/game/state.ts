// Global game services: save data, word table, audio, IME.
import wordsJson from '../data/words.json';
import iconsJson from '../../public/assets/icons.json';
import { SaveManager, createBackend, bumpStreak, currentStreak } from '../logic/save';
import { newStat, type WordStat } from '../logic/srs';
import { Audio } from './audio';
import { Ime } from './ime';
import type { Layout } from './layout';
import { NIGHTS, BOSS_NIGHT } from '../data/levels';

export interface Word {
  id: string;
  ko: string;
  cs: string;
  en: string;
  category: string;
  icon: string;
  difficulty: number;
}

export const WORDS: Word[] = wordsJson as Word[];
export const WORD = new Map(WORDS.map((w) => [w.id, w]));

/** Frame index of a food icon in the icons sheet. */
export function iconIdx(name: string): number {
  return Math.max(0, iconsJson.names.indexOf(name));
}

export function word(id: string): Word {
  const w = WORD.get(id);
  if (!w) throw new Error('unknown word ' + id);
  return w;
}

class GameState {
  save = new SaveManager(createBackend());
  audio = new Audio();
  ime!: Ime;
  layout!: Layout;
  /** Debug/test only: game speed multiplier for nights (window.__pocha.G.speed). */
  speed = 1;
  /** Night the player picked on the map. */
  night = 1;

  get data() { return this.save.data; }

  stat(id: string): WordStat {
    return this.data.words[id] ?? newStat();
  }

  setStat(id: string, s: WordStat) {
    this.data.words[id] = s;
  }

  isUnlocked(n: number): boolean {
    if (n === 1) return true;
    const prev = this.data.nights[n - 1];
    return !!prev && prev.stars > 0;
  }

  /** Highest unlocked night. */
  frontier(): number {
    let n = 1;
    for (const d of NIGHTS) if (this.isUnlocked(d.n)) n = d.n;
    return Math.min(n, BOSS_NIGHT);
  }

  hasUpgrade(id: string) { return this.data.upgrades.includes(id); }

  streak(): number { return currentStreak(this.data.streak, new Date()); }

  markPlayedToday() { this.data.streak = bumpStreak(this.data.streak, new Date()); }

  applyVolumes() {
    this.audio.sfxVolume = this.data.settings.sfx;
    this.audio.ambientVolume = this.data.settings.ambient;
    this.audio.updateAmbientGain();
  }
}

export const G = new GameState();
