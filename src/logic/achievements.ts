// Achievements (odznáčky): pure evaluation over the save + game data.
import type { SaveData } from './save';
import { TRACKS } from './track';

export interface AchievementDef {
  id: string;
  name: string;
  desc: string;
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first_night', name: 'Otevřeno!', desc: 'Dohraj první noc.' },
  { id: 'combo10', name: 'Kombo ×10', desc: '10 objednávek v řadě bez chyby.' },
  { id: 'clean100', name: 'Čisté ruce', desc: '100 objednávek bez jediné chyby.' },
  { id: 'shift', name: 'Pán Shiftu', desc: 'Každé Shift písmeno (ㄲㄸㅃㅆㅉㅒㅖ) 3× bez chyby.' },
  { id: 'all_jamo', name: 'Celá abeceda', desc: 'Poznej všechna jamo.' },
  { id: 'polite', name: 'Zdvořilost', desc: '50 pozdravů a poděkování.' },
  { id: 'book_food', name: 'Kuchařka', desc: 'Všechna jídla v receptáři.' },
  { id: 'book_ddm', name: 'Módní katalog', desc: 'Celý receptář 동대문 (oblečení a barvy).' },
  { id: 'book_hgd', name: 'Playlist', desc: 'Celý receptář 홍대.' },
  { id: 'book_ysn', name: 'Technik', desc: 'Celý receptář 용산.' },
  { id: 'book_phm', name: 'Lékárník', desc: 'Celý receptář 약국.' },
  { id: 'book_bsn', name: 'Cestovatel', desc: 'Celý receptář 부산.' },
  { id: 'boss_critic', name: '미식가 ★★★★★', desc: 'Kritik dá 5 hvězd.' },
  { id: 'boss_blogger', name: 'Virál', desc: 'Blogerka dá 5 hvězd.' },
  { id: 'boss_manager', name: 'Na turné', desc: 'Manažer dá 5 hvězd.' },
  { id: 'boss_trader', name: 'Obchodník', desc: 'Obchodník dá 5 hvězd.' },
  { id: 'boss_captain', name: 'Kapitán', desc: 'Kapitán dá 5 hvězd.' },
  { id: 'streak7', name: 'Týden v kuse', desc: 'Denní série 7 dní.' },
  { id: 'colors', name: 'Duha', desc: 'Kup v Barvírně každou z 11 barev.' },
  { id: 'hats', name: 'Šatník pro 나비', desc: 'Všech 5 čepiček.' },
  { id: 'helper', name: 'Tým', desc: 'Najmi pomocníka 김 대리.' },
  { id: 'stories', name: 'Štamgasti', desc: 'Všechny kapitoly všech štamgastů.' },
  { id: 'daily', name: 'Denní výzva', desc: 'Dohraj denní výzvu.' },
  { id: 'pharmacy', name: 'Zástup', desc: 'Dokonči vedlejší linku 약국.' },
  { id: 'listen_first', name: 'Dobré ucho', desc: 'Dohraj první noc v Poslechu.' },
  { id: 'listen_noreplay', name: 'Bez opakování', desc: 'Noc v Poslechu bez jediného přehrání navíc.' },
  { id: 'listen_boss', name: 'Slyším Soul', desc: 'Poraz kritika 미식가 v Poslechu.' },
];

export interface AchievementInput {
  save: SaveData;
  /** Word ids per recipe-book group (food, ddm, hgd, …). */
  groups: Record<string, string[]>;
  /** Boss id → night id. */
  bossNights: Record<string, number>;
  /** All jamo the game uses and those the player has met. */
  allJamo: string[];
  metJamo: Set<string>;
  regulars: string[];
  colors: string[];
  hats: string[];
  streak: number;
}

export const SHIFT_JAMO = ['ㄲ', 'ㄸ', 'ㅃ', 'ㅆ', 'ㅉ', 'ㅒ', 'ㅖ'];

export function evaluate(a: AchievementInput): string[] {
  const s = a.save;
  // progress badges count in either track (Čtení / Poslech)
  const ts = TRACKS.map((t) => s.tracks[t]);
  const seen = (id: string) => ts.some((t) => (t.words[id]?.seen ?? 0) > 0);
  const stars = (n: number) => Math.max(...ts.map((t) => t.nights[n]?.stars ?? 0));
  const listen = s.tracks.listen;
  const got: string[] = [];
  const add = (id: string, ok: boolean) => { if (ok) got.push(id); };
  add('first_night', ts.some((t) => Object.values(t.nights).some((r) => r.stars > 0)));
  add('combo10', (s.stats.bestCombo ?? 0) >= 10);
  add('clean100', (s.stats.cleanServed ?? 0) >= 100);
  add('shift', SHIFT_JAMO.every((j) => (s.stats.shiftClean?.[j] ?? 0) >= 3));
  add('all_jamo', a.allJamo.every((j) => a.metJamo.has(j)));
  add('polite', (s.stats.greetings ?? 0) >= 50);
  for (const g of ['food', 'ddm', 'hgd', 'ysn', 'phm', 'bsn']) add(`book_${g}`, (a.groups[g]?.length ?? 0) > 0 && a.groups[g].every(seen));
  for (const [boss, n] of Object.entries(a.bossNights)) add(`boss_${boss}`, stars(n) >= 5);
  add('streak7', a.streak >= 7);
  add('colors', a.colors.every((c) => s.cosmetics.owned.some((k) => k.endsWith(':' + c) && !k.startsWith('hat:'))));
  add('hats', a.hats.every((h) => s.cosmetics.owned.includes('hat:' + h)));
  add('helper', s.upgrades.includes('helper'));
  add('stories', a.regulars.every((r) => ts.some((t) => (t.friends[r]?.chapter ?? 0) >= 3)));
  add('daily', ts.some((t) => Object.keys(t.daily).length > 0));
  add('pharmacy', stars(204) > 0);
  add('listen_first', Object.values(listen.nights).some((r) => r.stars > 0));
  add('listen_noreplay', (s.stats.listenNoReplay ?? 0) > 0);
  add('listen_boss', (listen.nights[a.bossNights.critic]?.stars ?? 0) > 0);
  return got;
}

/** Newly unlocked since last check (ids not yet in save.achievements). */
export function newlyUnlocked(save: SaveData, now: string[]): string[] {
  return now.filter((id) => !save.achievements.includes(id));
}
