// Builds src/data/words.json from the Recallo Anki export + Czech translations.
// Run: npm run words   (vite-node, so it can import the TS logic)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { difficulty } from '../src/logic/difficulty';

// The deck is a private Anki export (Recallo), so words.json is committed and the path comes from WORDS_TSV.
const SRC = process.env.WORDS_TSV;

/** ko → [czech, icon, romanised id]. Every food word has its own icon. */
const FOOD: Record<string, [string, string, string]> = {
  우유: ['mléko', 'uyu', 'uyu'],
  차: ['čaj', 'cha', 'cha'],
  물: ['voda', 'mul', 'mul'],
  두부: ['tofu', 'dubu', 'dubu'],
  만두: ['knedlíčky', 'mandu', 'mandu'],
  김밥: ['rýžové rolky', 'gimbap', 'gimbap'],
  떡볶이: ['pálivé rýžové válečky', 'tteokbokki', 'tteokbokki'],
  라면: ['instantní nudle', 'ramyeon', 'ramyeon'],
  짜장면: ['nudle v černé omáčce', 'jjajangmyeon', 'jjajangmyeon'],
  김치찌개: ['kimči polévka', 'kimchijjigae', 'kimchijjigae'],
  비빔밥: ['rýže se zeleninou', 'bibimbap', 'bibimbap'],
  단무지: ['nakládaná ředkev', 'danmuji', 'danmuji'],
  떡: ['rýžový koláček', 'tteok', 'tteok'],
  냉면: ['studené nudle', 'naengmyeon', 'naengmyeon'],
  갈비: ['grilovaná žebírka', 'galbi', 'galbi'],
  된장찌개: ['sójová polévka', 'doenjangjjigae', 'doenjangjjigae'],
  갈비탕: ['polévka z žeber', 'galbitang', 'galbitang'],
  김치: ['kimči', 'kimchi', 'kimchi'],
  잡채: ['skleněné nudle', 'japchae', 'japchae'],
  밥: ['rýže', 'bap', 'bap'],
  찌개: ['hustá polévka', 'jjigae', 'jjigae'],
  고기: ['maso', 'gogi', 'gogi'],
  빵: ['chléb', 'ppang', 'ppang'],
  과자: ['křupky', 'gwaja', 'gwaja'],
  사탕: ['bonbon', 'satang', 'satang'],
  디저트: ['dezert', 'dijeoteu', 'dijeoteu'],
  간식: ['svačina', 'gansik', 'gansik'],
  음식: ['jídlo', 'eumsik', 'eumsik'],
  과일: ['ovoce', 'gwail', 'gwail'],
  포도: ['hrozny', 'podo', 'podo'],
  바나나: ['banán', 'banana', 'banana'],
  사과: ['jablko', 'sagwa', 'sagwa'],
  딸기: ['jahoda', 'ttalgi', 'ttalgi'],
  귤: ['mandarinka', 'gyul', 'gyul'],
  멜론: ['meloun', 'mellon', 'mellon'],
  초콜릿: ['čokoláda', 'chokollit', 'chokollit'],
  아이스크림: ['zmrzlina', 'aiseukeurim', 'aiseukeurim'],
  케이크: ['dort', 'keikeu', 'keikeu'],
  샌드위치: ['sendvič', 'saendeuwichi', 'saendeuwichi'],
  빙수: ['ledová tříšť', 'bingsu', 'bingsu'],
  팝콘: ['popcorn', 'popkon', 'popkon'],
  치킨: ['smažené kuře', 'chikin', 'chikin'],
  파스타: ['těstoviny', 'paseuta', 'paseuta'],
  맥주: ['pivo', 'maekju', 'maekju'],
  음료수: ['nápoj', 'eumnyosu', 'eumnyosu'],
  콜라: ['kola', 'kolla', 'kolla'],
  주스: ['džus', 'juseu', 'juseu'],
  버블티: ['bublinkový čaj', 'beobeulti', 'beobeulti'],
  커피: ['káva', 'keopi', 'keopi'],
  삼계탕: ['kuřecí polévka s ženšenem', 'samgyetang', 'samgyetang'],
};

/** Words for the critic's sentences (주세요/둘 are in the deck, 하나/하고 added). */
const PHRASE: Record<string, [string, string]> = {
  하나: ['jeden', 'hana'],
  둘: ['dva', 'dul'],
  하고: ['a (spojka)', 'hago'],
  주세요: ['prosím, dejte mi', 'juseyo'],
};

/**
 * Stage 2 words: ko → [czech, icon, id, category]. Categories group the
 * recipe book: expr (greetings), adj (reactions), color, clothes, music,
 * tech, body, travel, family, holiday.
 */
const MORE: Record<string, [string, string, string, string]> = {
  // §2.1 greetings & farewells
  안녕하세요: ['dobrý den', 'annyeonghaseyo', 'annyeonghaseyo', 'expr'],
  환영해요: ['vítejte', 'hwanyeonghaeyo', 'hwanyeonghaeyo', 'expr'],
  감사합니다: ['děkuji', 'gamsahamnida', 'gamsahamnida', 'expr'],
  '또 오세요': ['přijďte zas', 'tto_oseyo', 'tto_oseyo', 'expr'],
  '또 봐요': ['zase někdy', 'tto_bwayo', 'tto_bwayo', 'expr'],
  '잘 가요': ['mějte se', 'jal_gayo', 'jal_gayo', 'expr'],
  // §2.2 reactions (adjectives, dictionary form)
  맵다: ['pálivý', 'maepda', 'maepda', 'adj'],
  뜨겁다: ['horký', 'tteugeopda', 'tteugeopda', 'adj'],
  달다: ['sladký', 'dalda', 'dalda', 'adj'],
  맛있다: ['chutný', 'masitda', 'masitda', 'adj'],
  비싸다: ['drahý', 'bissada', 'bissada', 'adj'],
  싸다: ['levný', 'ssada', 'ssada', 'adj'],
  예쁘다: ['hezký', 'yeppeuda', 'yeppeuda', 'adj'],
  크다: ['velký', 'keuda', 'keuda', 'adj'],
  작다: ['malý', 'jakda', 'jakda', 'adj'],
  좋다: ['dobrý', 'jota', 'jota', 'adj'],
  괜찮다: ['v pořádku', 'gwaenchanta', 'gwaenchanta', 'adj'], // ㅙ, reaction from 용산
  반가워요: ['těší mě', 'bangawoyo', 'bangawoyo', 'expr'], // ㅝ, greeting from 용산
  // §3.1
  색: ['barva', 'saek', 'saek', 'color'],
};

/**
 * Words whose Korean is the same as another entry (homonyms) or that need a
 * different id: id → [ko, czech, icon, category, english]. ko must be in the deck.
 */
const MORE_BY_ID: Record<string, [string, string, string, string, string?]> = {
  // §4.1 동대문 – clothes (icons: neutral grey, recoloured per colour)
  ot: ['옷', 'oblečení', 'ot', 'clothes'],
  chima: ['치마', 'sukně', 'chima', 'clothes'],
  baji: ['바지', 'kalhoty', 'baji', 'clothes'],
  moja: ['모자', 'čepice', 'moja', 'clothes'],
  gudu: ['구두', 'boty', 'gudu', 'clothes'],
  undonghwa: ['운동화', 'tenisky', 'undonghwa', 'clothes'],
  tisyeocheu: ['티셔츠', 'tričko', 'tisyeocheu', 'clothes'],
  hanbok: ['한복', 'hanbok', 'hanbok', 'clothes'],
  gabang: ['가방', 'taška', 'gabang', 'clothes'],
  jigap: ['지갑', 'peněženka', 'jigap', 'clothes'],
  angyeong: ['안경', 'brýle', 'angyeong', 'clothes'],
  sigye: ['시계', 'hodinky', 'sigye', 'clothes'],
  mokgeori: ['목걸이', 'náhrdelník', 'mokgeori', 'clothes'],
  usan: ['우산', 'deštník', 'usan', 'clothes'],
  // §4.2 홍대 – music & fun (loanwords show their original)
  norae: ['노래', 'píseň', 'norae', 'music'],
  gasu: ['가수', 'zpěvák', 'gasu', 'music'],
  geolgeurup: ['걸그룹', 'dívčí skupina', 'geolgeurup', 'music'],
  konseoteu: ['콘서트', 'koncert', 'konseoteu', 'music'],
  keipap: ['케이팝', 'K-pop', 'keipap', 'music'],
  raep: ['랩', 'rap', 'raep', 'music'],
  jaejeu: ['재즈', 'jazz', 'jaejeu', 'music'],
  piano: ['피아노', 'klavír', 'piano', 'music'],
  deureom: ['드럼', 'bicí', 'deureom', 'music'],
  yeonghwa: ['영화', 'film', 'yeonghwa', 'music'],
  deurama: ['드라마', 'seriál', 'deurama', 'music'],
  geim: ['게임', 'hra', 'geim', 'music'],
  noraebang: ['노래방', 'karaoke', 'noraebang', 'music'],
  pissibang: ['피씨방', 'herna (PC bang)', 'pissibang', 'music'],
  kaerikteo: ['캐릭터', 'postavička', 'kaerikteo', 'music'],
  pati: ['파티', 'večírek', 'pati', 'music'],
  tenteu: ['텐트', 'stan', 'tenteu', 'music'],
  kaemping: ['캠핑', 'kempování', 'kaemping', 'music'],
  weiteo: ['웨이터', 'číšník', 'weiteo', 'music'], // ㅞ
  // §4.3 용산 – electronics
  haendeupon: ['핸드폰', 'mobil', 'haendeupon', 'tech'],
  noteubuk: ['노트북', 'notebook', 'noteubuk', 'tech'],
  kamera: ['카메라', 'foťák', 'kamera', 'tech'],
  keompyuteo: ['컴퓨터', 'počítač', 'keompyuteo', 'tech'],
  tellebijeon: ['텔레비전', 'televize', 'tellebijeon', 'tech'],
  naengjanggo: ['냉장고', 'lednice', 'naengjanggo', 'tech'],
  setakgi: ['세탁기', 'pračka', 'setakgi', 'tech'],
  eeokeon: ['에어컨', 'klimatizace', 'eeokeon', 'tech'],
  seonpunggi: ['선풍기', 'větrák', 'seonpunggi', 'tech'],
  boksagi: ['복사기', 'kopírka', 'boksagi', 'tech'],
  inteonet: ['인터넷', 'internet', 'inteonet', 'tech'],
  kadeu: ['카드', 'karta', 'kadeu', 'tech'],
  bolpen: ['볼펜', 'propiska', 'bolpen', 'tech'],
  harin: ['할인', 'sleva', 'harin', 'tech'],
  gojangnasseoyo: ['고장났어요', 'je to rozbité', 'gojangnasseoyo', 'tech'],
  gochida: ['고치다', 'opravit', 'gochida', 'tech'],
  neomu: ['너무', 'moc, příliš', 'phrase', 'phrase'],
  jeongmal: ['정말', 'opravdu', 'phrase', 'phrase'],
  // §4.4 약국 – body & pharmacy
  gamgi: ['감기', 'nachlazení', 'gamgi', 'body'],
  meori: ['머리', 'hlava', 'meori', 'body'],
  bae_belly: ['배', 'břicho', 'bae_belly', 'body', 'stomach'],
  dari: ['다리', 'noha', 'dari', 'body'],
  son: ['손', 'ruka', 'son', 'body'],
  bal: ['발', 'chodidlo', 'bal', 'body'],
  gwi: ['귀', 'ucho', 'gwi', 'body'],
  nun_eye: ['눈', 'oko', 'nun_eye', 'body', 'eye'],
  mom: ['몸', 'tělo', 'mom', 'body'],
  sangcheo: ['상처', 'rána', 'sangcheo', 'body'],
  yak: ['약', 'lék', 'yak', 'body'],
  banchanggo: ['반창고', 'náplast', 'banchanggo', 'body'],
  byeongwon: ['병원', 'nemocnice', 'byeongwon', 'body'],
  ganhosa: ['간호사', 'zdravotní sestra', 'ganhosa', 'body'],
  uisa: ['의사', 'lékař', 'uisa', 'body'],
  yaksa: ['약사', 'lékárník', 'yaksa', 'body'],
  apeuda: ['아프다', 'bolet', 'apeuda', 'body'],
  josimhada: ['조심하다', 'dávat pozor', 'josimhada', 'body'],
  // §4.5 부산 – travel
  gicha: ['기차', 'vlak', 'gicha', 'travel'],
  beoseu: ['버스', 'autobus', 'beoseu', 'travel'],
  jihacheol: ['지하철', 'metro', 'jihacheol', 'travel'],
  taeksi: ['택시', 'taxi', 'taeksi', 'travel'],
  pyo: ['표', 'lístek', 'pyo', 'travel'],
  yeogwon: ['여권', 'pas', 'yeogwon', 'travel'],
  gonghang: ['공항', 'letiště', 'gonghang', 'travel'],
  geiteu: ['게이트', 'brána', 'geiteu', 'travel'],
  chulgu: ['출구', 'východ', 'chulgu', 'travel'],
  yeok: ['역', 'nádraží', 'yeok', 'travel'],
  jeongnyujang: ['정류장', 'zastávka', 'jeongnyujang', 'travel'],
  teomineol: ['터미널', 'terminál', 'teomineol', 'travel'],
  bae_boat: ['배', 'loď', 'bae_boat', 'travel', 'boat (homonym: stomach)'],
  bada: ['바다', 'moře', 'bada', 'travel'],
  seoul: ['서울', 'Soul', 'seoul', 'travel'],
  busan: ['부산', 'Pusan', 'busan', 'travel'],
  incheon: ['인천', 'Inčchon', 'incheon', 'travel'],
  jejudo: ['제주도', 'ostrov Čedžu', 'jejudo', 'travel'],
  gangnam: ['강남', 'Kangnam', 'gangnam', 'travel'],
  yeohaeng: ['여행', 'výlet', 'yeohaeng', 'travel'],
  chulbal: ['출발', 'odjezd', 'chulbal', 'travel'],
  // §4.6 holidays
  halmeoni: ['할머니', 'babička', 'halmeoni', 'family'],
  harabeoji: ['할아버지', 'dědeček', 'harabeoji', 'family'],
  eomma: ['엄마', 'máma', 'eomma', 'family'],
  appa: ['아빠', 'táta', 'appa', 'family'],
  imo: ['이모', 'teta', 'imo', 'family'],
  sachon: ['사촌', 'bratranec', 'sachon', 'family'],
  eonni: ['언니', 'starší sestra (pro ni)', 'eonni', 'family'],
  oppa: ['오빠', 'starší bratr (pro ni)', 'oppa', 'family'],
  nuna: ['누나', 'starší sestra (pro něj)', 'nuna', 'family'],
  hyeong: ['형', 'starší bratr (pro něj)', 'hyeong', 'family'],
  namdongsaeng: ['남동생', 'mladší bratr', 'namdongsaeng', 'family'],
  yeodongsaeng: ['여동생', 'mladší sestra', 'yeodongsaeng', 'family'],
  adeul: ['아들', 'syn', 'adeul', 'family'],
  ttal: ['딸', 'dcera', 'ttal', 'family'],
  seonmul: ['선물', 'dárek', 'seonmul', 'holiday'],
  keuriseumaseu: ['크리스마스', 'Vánoce', 'keuriseumaseu', 'holiday'],
  meri_keuriseumaseu: ['메리 크리스마스', 'veselé Vánoce', 'meri_keuriseumaseu', 'holiday'],
  nun_snow: ['눈', 'sníh', 'nun_snow', 'holiday', 'snow'],
  gyeoul: ['겨울', 'zima', 'gyeoul', 'holiday'],
  jangnangam: ['장난감', 'hračka', 'jangnangam', 'holiday'],
  saengil: ['생일', 'narozeniny', 'saengil', 'holiday'],
  saengil_chukahaeyo: ['생일 축하해요', 'všechno nejlepší', 'saengil_chukahaeyo', 'holiday'],
  kkot: ['꽃', 'květina', 'kkot', 'holiday'],
};

/** Loanwords that show their original in 홍대 bubbles (deck category Loanword + these). */
const LOAN_ORIGINAL: Record<string, string> = {
  geolgeurup: 'girl group', keipap: 'K-pop', konseoteu: 'concert', raep: 'rap', jaejeu: 'jazz', piano: 'piano', deureom: 'drum',
  deurama: 'drama', geim: 'game', pissibang: 'PC bang', kaerikteo: 'character', pati: 'party', tenteu: 'tent', kaemping: 'camping',
  weiteo: 'waiter', keopi: 'coffee', juseu: 'juice', kolla: 'cola', chikin: 'chicken', popkon: 'popcorn', keikeu: 'cake', banana: 'banana',
  mellon: 'melon', paseuta: 'pasta', saendeuwichi: 'sandwich', aiseukeurim: 'ice cream', chokollit: 'chocolate', dijeoteu: 'dessert', beobeulti: 'bubble tea',
  haendeupon: 'hand phone', noteubuk: 'notebook', kamera: 'camera', keompyuteo: 'computer', tellebijeon: 'television', eeokeon: 'air con',
  inteonet: 'internet', kadeu: 'card', bolpen: 'ball pen', taeksi: 'taxi', teomineol: 'terminal', geiteu: 'gate', tisyeocheu: 'T-shirt',
};

/** Words not in the deck, added by hand (with the reason). ko → [czech, icon, id, category, english]. */
const EXTRA: Record<string, [string, string, string, string, string]> = {
  // §3.1 colours: the deck only has 색 (colour); the Barvírna and the 동대문
  // orders (colour + thing) need the colour names themselves.
  빨간색: ['červená', 'ppalgansaek', 'ppalgansaek', 'color', 'red'],
  파란색: ['modrá', 'paransaek', 'paransaek', 'color', 'blue'],
  노란색: ['žlutá', 'noransaek', 'noransaek', 'color', 'yellow'],
  초록색: ['zelená', 'choroksaek', 'choroksaek', 'color', 'green'],
  하얀색: ['bílá', 'hayansaek', 'hayansaek', 'color', 'white'],
  검은색: ['černá', 'geomeunsaek', 'geomeunsaek', 'color', 'black'],
  분홍색: ['růžová', 'bunhongsaek', 'bunhongsaek', 'color', 'pink'],
  보라색: ['fialová', 'borasaek', 'borasaek', 'color', 'purple'],
  주황색: ['oranžová', 'juhwangsaek', 'juhwangsaek', 'color', 'orange'],
  갈색: ['hnědá', 'galsaek', 'galsaek', 'color', 'brown'],
  회색: ['šedá', 'hoesaek', 'hoesaek', 'color', 'grey'],
  // ㅒ (Shift + ㅐ) has no word in the deck at all; 얘기 (talk, story) is the most
  // common one and fits 민수's story in 홍대.
  얘기: ['povídání', 'yaegi', 'yaegi', 'music', 'talk, story'],
};

if (!SRC || !existsSync(SRC)) {
  console.error('src/data/words.json is committed; regenerating it needs the private Anki export:\n  WORDS_TSV=/path/to/anki_korean.txt npm run words');
  process.exit(1);
}
const rows = readFileSync(SRC, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'));
const inDeck = new Map(rows.map((r) => [r[0].trim(), r]));

interface Word { id: string; ko: string; cs: string; en: string; category: string; icon: string; difficulty: number; loan?: string }
const out: Word[] = [];
for (const [ko, [cs, icon, id]] of Object.entries(FOOD)) {
  const r = inDeck.get(ko);
  if (rows.length && !r) throw new Error(`${ko} missing from deck`);
  out.push({ id, ko, cs, en: r?.[1] ?? '', category: 'food', icon, difficulty: difficulty(ko) });
}
for (const [ko, [cs, id]] of Object.entries(PHRASE)) {
  const r = inDeck.get(ko);
  out.push({ id, ko, cs, en: r?.[1] ?? '', category: 'phrase', icon: 'phrase', difficulty: difficulty(ko) });
}
for (const [ko, [cs, icon, id, category]] of Object.entries(MORE)) {
  const r = inDeck.get(ko);
  if (rows.length && !r) throw new Error(`${ko} missing from deck (add it to EXTRA with a reason)`);
  out.push({ id, ko, cs, en: r?.[1] ?? '', category, icon, difficulty: difficulty(ko) });
}
for (const [id, [ko, cs, icon, category, en]] of Object.entries(MORE_BY_ID)) {
  const r = inDeck.get(ko);
  if (rows.length && !r) throw new Error(`${ko} missing from deck`);
  out.push({ id, ko, cs, en: en ?? r?.[1] ?? '', category, icon, difficulty: difficulty(ko) });
}
for (const [ko, [cs, icon, id, category, en]] of Object.entries(EXTRA)) {
  if (inDeck.has(ko)) throw new Error(`${ko} is in the deck, move it to MORE`);
  out.push({ id, ko, cs, en, category, icon, difficulty: difficulty(ko) });
}
for (const w of out) if (LOAN_ORIGINAL[w.id]) w.loan = LOAN_ORIGINAL[w.id];
const seen = new Set<string>();
for (const w of out) { if (seen.has(w.id)) throw new Error('duplicate id ' + w.id); seen.add(w.id); }
if (rows.length) {
  const missing = rows.filter((r) => r[2]?.trim() === 'Food' && !FOOD[r[0].trim()]);
  if (missing.length) throw new Error('untranslated food: ' + missing.map((m) => m[0]).join(', '));
}
out.sort((a, b) => a.difficulty - b.difficulty);
writeFileSync(new URL('../src/data/words.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`words.json: ${out.length} words`);
for (const w of out) console.log(w.difficulty.toFixed(1).padStart(5), w.ko, '—', w.cs);
