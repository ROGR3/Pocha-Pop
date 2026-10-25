// Night definitions. Main line: 을지로 (1–5), 한강 (6–10), 미식가 (11),
// 동대문 (12–16 + boss 116), … Side lines (약국 201–204) and holiday nights
// (301–303) branch off. Boss nights have ids 100 + the night before them.

export type District = 'euljiro' | 'hangang' | 'dongdaemun' | 'hongdae' | 'yongsan' | 'busan' | 'pharmacy' | 'holiday' | 'boss';
export type BossId = 'critic' | 'blogger' | 'manager' | 'trader' | 'captain';
/** The district's extra game element (how orders are built). */
export type Mechanic = 'food' | 'colorItem' | 'loanword' | 'haggle' | 'symptom' | 'destination' | 'family' | 'xmas' | 'birthday';
export type RegularId = 'kim' | 'haeun' | 'nabi' | 'imo' | 'minsu' | 'park' | 'kang' | 'halmeoni';

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
  /** Seconds between arrivals (min, max) with 3 seats. */
  spawn: [number, number];
  /** Regulars that can show up tonight. */
  regulars: RegularId[];
  /** Boss night (sentences, fixed 3 seats, 1–5 stars). */
  boss?: BossId;
  /** Night that must be cleared first (default: the previous main night). */
  prev?: number;
  /** Second half of a district (e.g. 기차 표 in 부산, symptoms in 약국). */
  late?: boolean;
  /** Holiday nights: own mechanic / backdrop / weather / extra words. */
  mechanic?: Mechanic;
  backdrop?: Backdrop;
  weather?: 'rain' | 'dry' | 'snow';
  review?: string[];
}

export interface DistrictDef {
  id: District;
  ko: string;
  cs: string;
  mechanic: Mechanic;
  /** Backdrop + stall variant used by the street scene. */
  backdrop: Backdrop;
  /** Words of earlier districts that keep coming back here. */
  review?: string[];
  generics: string[];
}

export type Backdrop = 'euljiro' | 'hangang' | 'dongdaemun' | 'hongdae' | 'yongsan' | 'busan' | 'pharmacy';

const GEN1 = ['char_cust_a', 'char_cust_b', 'char_cust_c', 'char_cust_d'];

export const DISTRICTS: Record<Exclude<District, 'boss'>, DistrictDef> = {
  euljiro: { id: 'euljiro', ko: '을지로', cs: 'ulička', mechanic: 'food', backdrop: 'euljiro', generics: GEN1 },
  hangang: { id: 'hangang', ko: '한강', cs: 'u řeky', mechanic: 'food', backdrop: 'hangang', generics: GEN1, review: ['ramyeon', 'gimbap', 'maekju', 'mandu', 'mul', 'uyu', 'cha'] },
  dongdaemun: { id: 'dongdaemun', ko: '동대문', cs: 'trh s oblečením', mechanic: 'colorItem', backdrop: 'dongdaemun', generics: [...GEN1, 'char_cust_e', 'char_cust_f'] },
  hongdae: { id: 'hongdae', ko: '홍대', cs: 'před klubem', mechanic: 'loanword', backdrop: 'hongdae', generics: [...GEN1, 'char_cust_g', 'char_cust_h'],
    review: ['keopi', 'juseu', 'kolla', 'chikin', 'popkon', 'tteokbokki', 'keikeu', 'aiseukeurim', 'ramyeon', 'maekju'] },
  yongsan: { id: 'yongsan', ko: '용산', cs: 'elektro bazar', mechanic: 'haggle', backdrop: 'yongsan', generics: [...GEN1, 'char_cust_i', 'char_cust_j'] },
  busan: { id: 'busan', ko: '부산', cs: 'přístav', mechanic: 'destination', backdrop: 'busan', generics: [...GEN1, 'char_cust_k', 'char_cust_l'] },
  pharmacy: { id: 'pharmacy', ko: '약국', cs: 'lékárna', mechanic: 'symptom', backdrop: 'pharmacy', generics: GEN1 },
  holiday: { id: 'holiday', ko: '명절', cs: 'svátky', mechanic: 'family', backdrop: 'euljiro', generics: GEN1 },
};

const ALL_OLD: RegularId[] = ['nabi', 'kim', 'haeun'];

export const NIGHTS: NightDef[] = [
  { n: 1, district: 'euljiro', newWords: ['cha', 'uyu', 'dubu', 'mul', 'mandu'], newJamo: ['ㅇ', 'ㅜ', 'ㅠ', 'ㅊ', 'ㅏ', 'ㄷ', 'ㅂ', 'ㅁ', 'ㄹ', 'ㄴ'], customers: 8, patience: 30, spawn: [6, 9], regulars: ['nabi'] },
  { n: 2, district: 'euljiro', newWords: ['bap', 'gogi', 'ramyeon', 'kimchi'], newJamo: ['ㄱ', 'ㅗ', 'ㅣ', 'ㅕ'], customers: 9, patience: 28, spawn: [6, 8.5], regulars: ['nabi', 'kim'] },
  { n: 3, district: 'euljiro', newWords: ['gimbap', 'ppang', 'tteok', 'danmuji'], newJamo: ['ㅈ', 'ㅓ', 'ㄸ', 'ㅃ'], customers: 10, patience: 26, spawn: [5.5, 8], regulars: ALL_OLD },
  { n: 4, district: 'euljiro', newWords: ['jjigae', 'japchae', 'galbi', 'gansik', 'eumsik'], newJamo: ['ㅅ', 'ㅡ', 'ㅉ', 'ㅐ'], customers: 11, patience: 25, spawn: [5, 7.5], regulars: ALL_OLD },
  { n: 5, district: 'euljiro', newWords: ['gwaja', 'naengmyeon', 'bibimbap', 'kimchijjigae', 'jjajangmyeon', 'tteokbokki', 'maekju'], newJamo: ['ㅘ', 'ㄲ'], customers: 12, patience: 25, spawn: [5, 7], regulars: ALL_OLD },
  { n: 6, district: 'hangang', newWords: ['podo', 'juseu', 'keopi', 'gyul', 'banana'], newJamo: ['ㅍ', 'ㅋ', 'ㅎ'], customers: 10, patience: 25, spawn: [5, 7.5], regulars: ALL_OLD },
  { n: 7, district: 'hangang', newWords: ['sagwa', 'kolla', 'paseuta', 'eumnyosu', 'beobeulti'], newJamo: ['ㅌ', 'ㅛ'], customers: 11, patience: 24, spawn: [5, 7], regulars: ALL_OLD },
  { n: 8, district: 'hangang', newWords: ['chikin', 'popkon', 'ttalgi', 'mellon', 'saendeuwichi'], newJamo: ['ㅔ', 'ㅟ'], customers: 12, patience: 23, spawn: [4.5, 7], regulars: ALL_OLD },
  { n: 9, district: 'hangang', newWords: ['bingsu', 'gwail', 'aiseukeurim'], newJamo: [], customers: 13, patience: 22, spawn: [4.5, 6.5], regulars: ALL_OLD },
  { n: 10, district: 'hangang', newWords: [], newJamo: [], customers: 14, patience: 21, spawn: [4, 6], regulars: ALL_OLD },
  { n: 11, district: 'boss', boss: 'critic', newWords: ['hana', 'dul', 'hago', 'juseyo'], newJamo: [], customers: 8, patience: 24, spawn: [5, 7], regulars: ['kim', 'haeun', 'nabi'] },
  // 동대문: colour + thing
  { n: 12, district: 'dongdaemun', prev: 11, newWords: ['ot', 'chima', 'baji', 'moja', 'gabang', 'ppalgansaek', 'paransaek', 'noransaek', 'geomeunsaek'], newJamo: ['ㅆ'], customers: 10, patience: 28, spawn: [5.5, 8], regulars: ['nabi', 'imo'] },
  { n: 13, district: 'dongdaemun', newWords: ['gudu', 'undonghwa', 'jigap', 'usan', 'choroksaek', 'bunhongsaek', 'borasaek', 'hayansaek'], newJamo: ['ㅑ'], customers: 11, patience: 27, spawn: [5.5, 7.5], regulars: ['nabi', 'imo', 'kim'] },
  { n: 14, district: 'dongdaemun', newWords: ['angyeong', 'hanbok', 'mokgeori', 'tisyeocheu', 'sigye', 'juhwangsaek', 'galsaek'], newJamo: ['ㅖ'], customers: 12, patience: 26, spawn: [5, 7.5], regulars: ['nabi', 'imo', 'haeun'] },
  { n: 15, district: 'dongdaemun', newWords: ['hoesaek', 'saek'], newJamo: ['ㅚ'], customers: 12, patience: 25, spawn: [5, 7], regulars: ['nabi', 'imo', 'kim', 'haeun'] },
  { n: 16, district: 'dongdaemun', newWords: [], newJamo: [], customers: 13, patience: 24, spawn: [4.5, 6.5], regulars: ['nabi', 'imo', 'kim', 'haeun'] },
  { n: 116, district: 'boss', boss: 'blogger', newWords: [], newJamo: [], customers: 8, patience: 26, spawn: [5, 7], regulars: ['imo', 'nabi'] },
  // 홍대: loanwords (bubbles show the original)
  { n: 17, district: 'hongdae', newWords: ['norae', 'gasu', 'yeonghwa', 'deurama', 'geim', 'pati'], newJamo: [], customers: 11, patience: 26, spawn: [5.5, 7.5], regulars: ['nabi', 'minsu'] },
  { n: 18, district: 'hongdae', newWords: ['konseoteu', 'keipap', 'raep', 'jaejeu', 'weiteo'], newJamo: ['ㅞ'], customers: 12, patience: 25, spawn: [5, 7.5], regulars: ['nabi', 'minsu', 'haeun'] },
  { n: 19, district: 'hongdae', newWords: ['piano', 'deureom', 'geolgeurup', 'noraebang', 'yaegi'], newJamo: ['ㅒ'], customers: 12, patience: 24, spawn: [5, 7], regulars: ['nabi', 'minsu', 'kim'] },
  { n: 20, district: 'hongdae', newWords: ['pissibang', 'kaerikteo', 'tenteu', 'kaemping'], newJamo: [], customers: 13, patience: 23, spawn: [4.5, 7], regulars: ['nabi', 'minsu', 'haeun', 'imo'] },
  { n: 21, district: 'hongdae', newWords: [], newJamo: [], customers: 14, patience: 22, spawn: [4.5, 6.5], regulars: ['nabi', 'minsu', 'kim', 'haeun'] },
  { n: 121, district: 'boss', boss: 'manager', newWords: [], newJamo: [], customers: 8, patience: 26, spawn: [5, 7], regulars: ['minsu', 'nabi'] },
  // 용산: haggling, long words
  { n: 22, district: 'yongsan', newWords: ['haendeupon', 'kamera', 'kadeu', 'bolpen', 'harin'], newJamo: ['ㅝ'], customers: 11, patience: 27, spawn: [5.5, 8], regulars: ['nabi', 'park'] },
  { n: 23, district: 'yongsan', newWords: ['noteubuk', 'keompyuteo', 'inteonet', 'gojangnasseoyo'], newJamo: ['ㅙ'], customers: 12, patience: 27, spawn: [5.5, 7.5], regulars: ['nabi', 'park', 'kim'] },
  { n: 24, district: 'yongsan', newWords: ['tellebijeon', 'naengjanggo', 'setakgi', 'gochida'], newJamo: [], customers: 12, patience: 27, spawn: [5, 7.5], regulars: ['nabi', 'park', 'minsu'] },
  { n: 25, district: 'yongsan', newWords: ['eeokeon', 'seonpunggi', 'boksagi'], newJamo: [], customers: 13, patience: 26, spawn: [5, 7], regulars: ['nabi', 'park', 'haeun', 'imo'] },
  { n: 26, district: 'yongsan', newWords: [], newJamo: [], customers: 14, patience: 25, spawn: [4.5, 7], regulars: ['nabi', 'park', 'kim', 'minsu'] },
  { n: 126, district: 'boss', boss: 'trader', newWords: ['neomu', 'jeongmal'], newJamo: [], customers: 8, patience: 28, spawn: [5, 7], regulars: ['park', 'nabi'] },
  // 부산: destination → transport (+ 표 in the second half)
  { n: 27, district: 'busan', prev: 126, newWords: ['gicha', 'beoseu', 'jihacheol', 'seoul', 'gonghang', 'gangnam'], newJamo: [], customers: 11, patience: 27, spawn: [5.5, 8], regulars: ['nabi', 'kang'] },
  { n: 28, district: 'busan', newWords: ['taeksi', 'bae_boat', 'jejudo', 'incheon', 'bada', 'yeok'], newJamo: [], customers: 12, patience: 26, spawn: [5, 7.5], regulars: ['nabi', 'kang', 'park'] },
  { n: 29, district: 'busan', late: true, newWords: ['pyo', 'yeogwon', 'geiteu', 'chulgu', 'jeongnyujang'], newJamo: [], customers: 12, patience: 27, spawn: [5, 7.5], regulars: ['nabi', 'kang', 'minsu'] },
  { n: 30, district: 'busan', late: true, newWords: ['teomineol', 'busan', 'yeohaeng', 'chulbal'], newJamo: [], customers: 13, patience: 26, spawn: [5, 7], regulars: ['nabi', 'kang', 'imo', 'haeun'] },
  { n: 31, district: 'busan', late: true, newWords: [], newJamo: [], customers: 14, patience: 25, spawn: [4.5, 7], regulars: ['nabi', 'kang', 'kim', 'park'] },
  { n: 131, district: 'boss', boss: 'captain', late: true, newWords: [], newJamo: [], customers: 8, patience: 32, spawn: [5, 7], regulars: ['kang', 'nabi', 'kim'] },
  // 약국 side line (after 한강): body parts, then symptom → remedy
  { n: 201, district: 'pharmacy', prev: 11, newWords: ['meori', 'bae_belly', 'son', 'bal', 'nun_eye'], newJamo: [], customers: 8, patience: 30, spawn: [5.5, 8], regulars: [] },
  { n: 202, district: 'pharmacy', newWords: ['dari', 'gwi', 'mom', 'uisa', 'ganhosa', 'yaksa'], newJamo: ['ㅢ'], customers: 8, patience: 29, spawn: [5.5, 8], regulars: [] },
  { n: 203, district: 'pharmacy', late: true, newWords: ['yak', 'banchanggo', 'byeongwon', 'gamgi', 'sangcheo'], newJamo: ['ㅝ'], customers: 8, patience: 28, spawn: [5, 7.5], regulars: [] },
  { n: 204, district: 'pharmacy', late: true, newWords: ['apeuda', 'josimhada'], newJamo: [], customers: 8, patience: 27, spawn: [5, 7], regulars: [] },
  // holiday nights (each unlocks after a district's boss)
  { n: 301, district: 'holiday', prev: 116, mechanic: 'family', backdrop: 'euljiro', weather: 'dry', newWords: ['halmeoni', 'harabeoji', 'eomma', 'appa', 'imo', 'sachon', 'eonni', 'oppa', 'nuna', 'hyeong', 'namdongsaeng', 'yeodongsaeng', 'adeul', 'ttal'], newJamo: [], customers: 12, patience: 28, spawn: [5, 7.5], regulars: ['halmeoni', 'imo', 'kim', 'nabi'] },
  { n: 302, district: 'holiday', prev: 121, mechanic: 'xmas', backdrop: 'hongdae', weather: 'snow', newWords: ['seonmul', 'keuriseumaseu', 'meri_keuriseumaseu', 'nun_snow', 'gyeoul', 'jangnangam'], review: ['pati', 'keikeu', 'chokollit', 'keopi'], newJamo: [], customers: 12, patience: 27, spawn: [5, 7.5], regulars: ['minsu', 'haeun', 'nabi'] },
  { n: 303, district: 'holiday', prev: 126, mechanic: 'birthday', backdrop: 'euljiro', weather: 'dry', newWords: ['saengil', 'saengil_chukahaeyo', 'kkot'], review: ['seonmul', 'keikeu', 'pati', 'uyu', 'gogi'], newJamo: [], customers: 11, patience: 28, spawn: [5, 7.5], regulars: ['nabi', 'kim', 'haeun', 'park'] },
];

const HOLIDAY_NAMES: Record<number, string> = { 301: '추석', 302: '크리스마스', 303: '생일 나비' };

/** Short title of a night for HUD / banners. */
export function nightTitle(n: number, bossName?: string): string {
  const d = nightDef(n);
  if (d.boss) return bossName ?? 'Boss';
  if (d.district === 'pharmacy') return `약국 L${n - 200}`;
  if (d.district === 'holiday') return HOLIDAY_NAMES[n] ?? '명절';
  if (n === DAILY_NIGHT) return 'Denní výzva';
  return `Noc ${n}`;
}

/** Districts a boss night belongs to (for backdrop, pool and map). */
export const BOSS_DISTRICT: Record<BossId, Exclude<District, 'boss'>> = {
  critic: 'hangang', blogger: 'dongdaemun', manager: 'hongdae', trader: 'yongsan', captain: 'busan',
};

/** Effective district (bosses → the district they close). */
export function homeDistrict(d: NightDef): Exclude<District, 'boss'> {
  return d.boss ? BOSS_DISTRICT[d.boss] : (d.district as Exclude<District, 'boss'>);
}

/** Night that has to be cleared before n can be played (0 = none). */
export function prevNight(n: number): number {
  const d = nightDef(n);
  if (d.prev !== undefined) return d.prev;
  const i = NIGHTS.findIndex((x) => x.n === n);
  return i > 0 ? NIGHTS[i - 1].n : 0;
}

export function isBoss(n: number): boolean {
  return !!NIGHTS.find((x) => x.n === n)?.boss;
}

/** Last night of the main line (captain) and of the 약국 side line. */
export const FINAL_NIGHT = 131;
export const PHARMACY_LAST = 204;

/** The first boss (미식가) – the end of the vertical slice. */
export const BOSS_NIGHT = 11;
/** Number of sentences a boss orders. */
export const CRITIC_ORDERS = 5;
export const CRITIC_PATIENCE = 55;

/** Daily challenge: one synthetic night a day (seeded), unlocked after night 3. */
export const DAILY_NIGHT = 900;
const DAILY_DEF: NightDef = { n: DAILY_NIGHT, district: 'euljiro', prev: 3, mechanic: 'food', newWords: [], newJamo: [], customers: 12, patience: 25, spawn: [5, 7.5], regulars: ['nabi', 'kim', 'haeun'] };

export function nightDef(n: number): NightDef {
  if (n === DAILY_NIGHT) return DAILY_DEF;
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

/** Words a night can order: tonight's + earlier words of the same district (+ review, packs). */
export function nightPool(n: number, upgrades: string[]): string[] {
  const def = nightDef(n);
  if (def.district === 'holiday') return [...new Set([...def.newWords, ...(def.review ?? [])])];
  const home = homeDistrict(def);
  const ids = new Set<string>();
  // the critic reviews everything from 을지로 and 한강
  const districts = def.boss === 'critic' ? ['euljiro', 'hangang'] : [home];
  for (const d of NIGHTS) {
    if (d.boss || !districts.includes(d.district)) continue;
    if (!def.boss && chainIndex(d.n) > chainIndex(n)) continue;
    d.newWords.forEach((w) => ids.add(w));
  }
  DISTRICTS[home].review?.forEach((w) => ids.add(w));
  for (const u of UPGRADES) {
    if (!u.words || !upgrades.includes(u.id)) continue;
    const food = home === 'euljiro' || home === 'hangang';
    if (food && (!u.district || u.district === home || def.boss || (u.district === 'euljiro' && n >= 5))) u.words.forEach((w) => ids.add(w));
  }
  return [...ids];
}

function chainIndex(n: number): number {
  return NIGHTS.findIndex((x) => x.n === n);
}

/** Jamo the player has been introduced to by night n (following the unlock chain). */
export function jamoKnown(n: number): Set<string> {
  const known = new Set<string>();
  let cur = n;
  const guard = new Set<number>();
  while (cur && !guard.has(cur)) {
    guard.add(cur);
    nightDef(cur).newJamo.forEach((j) => known.add(j));
    cur = prevNight(cur);
  }
  return known;
}
