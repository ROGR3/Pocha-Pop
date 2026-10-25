// Night definitions for the vertical slice: 을지로 (1–5), 한강 (6–10), 미식가 (11).

export type District = 'euljiro' | 'hangang' | 'boss';

export interface NightDef {
  n: number;
  district: District;
  /** Words introduced tonight (ids from words.json). */
  newWords: string[];
  /** Jamo the postcard introduces before this night. */
  newJamo: string[];
  customers: number;
  /** Base patience in seconds. */
  patience: number;
  /** Seconds between arrivals (min, max). */
  spawn: [number, number];
  /** Regulars that can show up tonight. */
  regulars: RegularId[];
}

export type RegularId = 'kim' | 'haeun' | 'nabi';

export const NIGHTS: NightDef[] = [
  { n: 1, district: 'euljiro', newWords: ['cha', 'uyu', 'dubu', 'mul', 'mandu'], newJamo: ['ㅇ', 'ㅜ', 'ㅠ', 'ㅊ', 'ㅏ', 'ㄷ', 'ㅂ', 'ㅁ', 'ㄹ', 'ㄴ'], customers: 8, patience: 30, spawn: [6, 9], regulars: ['nabi'] },
  { n: 2, district: 'euljiro', newWords: ['bap', 'gogi', 'ramyeon', 'kimchi'], newJamo: ['ㄱ', 'ㅗ', 'ㅣ', 'ㅕ'], customers: 9, patience: 28, spawn: [6, 8.5], regulars: ['nabi', 'kim'] },
  { n: 3, district: 'euljiro', newWords: ['gimbap', 'ppang', 'tteok', 'danmuji'], newJamo: ['ㅈ', 'ㅓ', 'ㄸ', 'ㅃ'], customers: 10, patience: 26, spawn: [5.5, 8], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 4, district: 'euljiro', newWords: ['jjigae', 'japchae', 'galbi', 'gansik', 'eumsik'], newJamo: ['ㅅ', 'ㅡ', 'ㅉ', 'ㅐ'], customers: 11, patience: 25, spawn: [5, 7.5], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 5, district: 'euljiro', newWords: ['gwaja', 'naengmyeon', 'bibimbap', 'kimchijjigae', 'jjajangmyeon', 'tteokbokki', 'maekju'], newJamo: ['ㅘ', 'ㄲ'], customers: 12, patience: 25, spawn: [5, 7], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 6, district: 'hangang', newWords: ['podo', 'juseu', 'keopi', 'gyul', 'banana'], newJamo: ['ㅍ', 'ㅋ'], customers: 10, patience: 25, spawn: [5, 7.5], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 7, district: 'hangang', newWords: ['sagwa', 'kolla', 'paseuta', 'eumnyosu', 'beobeulti'], newJamo: ['ㅌ', 'ㅛ'], customers: 11, patience: 24, spawn: [5, 7], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 8, district: 'hangang', newWords: ['chikin', 'popkon', 'ttalgi', 'mellon', 'saendeuwichi'], newJamo: ['ㅔ', 'ㅟ'], customers: 12, patience: 23, spawn: [4.5, 7], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 9, district: 'hangang', newWords: ['bingsu', 'gwail', 'aiseukeurim'], newJamo: [], customers: 13, patience: 22, spawn: [4.5, 6.5], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 10, district: 'hangang', newWords: [], newJamo: [], customers: 14, patience: 21, spawn: [4, 6], regulars: ['nabi', 'kim', 'haeun'] },
  { n: 11, district: 'boss', newWords: ['hana', 'dul', 'hago', 'juseyo'], newJamo: [], customers: 8, patience: 24, spawn: [5, 7], regulars: ['kim', 'haeun', 'nabi'] },
];

export const BOSS_NIGHT = 11;
/** Number of sentences the critic orders. */
export const CRITIC_ORDERS = 5;
export const CRITIC_PATIENCE = 55;

export function nightDef(n: number): NightDef {
  const d = NIGHTS.find((x) => x.n === n);
  if (!d) throw new Error('no night ' + n);
  return d;
}

/** Shop items. `words` = extra menu pack added to the night pools. */
export interface UpgradeDef {
  id: string;
  name: string;
  desc: string;
  price: number;
  words?: string[];
  district?: District;
  /** Only for sale after this regular's last (3rd) story chapter. */
  story?: RegularId;
}

export const UPGRADES: UpgradeDef[] = [
  { id: 'lanterns', name: 'Lampiony', desc: 'Zákazníci čekají o 20 % déle.', price: 60 },
  { id: 'awning', name: 'Plachta proti dešti', desc: 'V dešti +10 % trpělivosti.', price: 80 },
  { id: 'radio', name: 'Rádio', desc: 'Tichá lo-fi smyčka do noci.', price: 100 },
  { id: 'helper', name: 'Pomocník 김 대리', desc: 'Jednou za noc obslouží netrpělivého zákazníka.', price: 200, story: 'kim' },
  { id: 'menu_soups', name: 'Menu: polévky', desc: 'Slova: 갈비탕, 삼계탕, 된장찌개', price: 120, words: ['galbitang', 'samgyetang', 'doenjangjjigae'], district: 'euljiro' },
  { id: 'menu_sweets', name: 'Menu: sladkosti', desc: 'Slova: 사탕, 초콜릿, 케이크, 디저트', price: 120, words: ['satang', 'chokollit', 'keikeu', 'dijeoteu'] },
];

/** Words a night can order: tonight's + earlier words of the same district (+ packs). */
export function nightPool(n: number, upgrades: string[]): string[] {
  const def = nightDef(n);
  const ids = new Set<string>();
  for (const d of NIGHTS) {
    if (d.n > n || d.district === 'boss') continue;
    if (def.district === 'boss' || d.district === def.district) d.newWords.forEach((w) => ids.add(w));
  }
  // 한강 nights also review a handful of 을지로 classics
  if (def.district === 'hangang') ['ramyeon', 'gimbap', 'maekju', 'mandu', 'mul', 'uyu', 'cha'].forEach((w) => ids.add(w));
  for (const u of UPGRADES) {
    if (!u.words || !upgrades.includes(u.id)) continue;
    if (!u.district || u.district === def.district || def.district === 'boss' || (u.district === 'euljiro' && n >= 5)) u.words.forEach((w) => ids.add(w));
  }
  return [...ids];
}
