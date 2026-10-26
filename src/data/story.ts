// All story text (Czech). Korean words appear only where the player already knows them.
import type { BossId, RegularId } from './levels';

export type Who = 'halmeoni' | 'kim' | 'haeun' | 'nabi' | 'imo' | 'minsu' | 'park' | 'kang' | 'yaksa' | BossId | 'chef' | 'narrator';

export interface Line {
  who: Who;
  text: string;
}

export const NAMES: Record<Who, string> = {
  halmeoni: '할머니',
  kim: '김 대리',
  haeun: '하은',
  nabi: '나비',
  imo: '이모',
  minsu: '민수',
  park: '박 사장',
  kang: '강 이사',
  yaksa: '약사',
  critic: '미식가',
  blogger: '블로거',
  manager: '매니저',
  trader: '상인',
  captain: '선장',
  chef: 'Šéfkuchař',
  narrator: '',
};

export const PROLOGUE: Line[] = [
  { who: 'narrator', text: 'Soul, ulička 을지로. Půlnoc, prší a pod oranžovou plachtou voní vývar.' },
  { who: 'halmeoni', text: 'Tak jsi přijel/a! Čtyřicet let jsem tu vařila. Teď jdu odpočívat k moři na Jeju.' },
  { who: 'halmeoni', text: 'Jenže ulička má jít k zemi – přestavba, 재개발. Zachránit ji může jen slavný stánek.' },
  { who: 'halmeoni', text: 'Prý sem jednou zavítá kritik 미식가. Když napíše dobrou recenzi, ulička zůstane.' },
  { who: 'halmeoni', text: 'Zákazníci ti řeknou, co chtějí. Ty to napíšeš korejsky – a já ti budu psát pohledy.' },
  { who: 'halmeoni', text: 'Nejdřív lehká jídla. 우유, 차, 물… Hlavně nespěchej. Hodně štěstí, zlatíčko!' },
];

export interface Postcard {
  title: string;
  text: string;
  tip: string;
}

/** Postcard after night n (index = night). It introduces the jamo of night n+1. */
export const POSTCARDS: Record<number, Postcard> = {
  1: {
    title: 'Pozdrav z Jeju',
    text: 'První noc za tebou! Moře je tu modré a mandarinky sladké. Zítra přidám ㄱ, ㅗ, ㅣ a ㅕ – s nimi napíšeš 밥, 고기, 라면 i 김치.',
    tip: 'Tip k vaření: rýži 밥 vždycky propláchni třikrát.',
  },
  2: {
    title: 'Vítr od moře',
    text: 'Slyšela jsem, že k tobě chodí unavený pán v kravatě. Buď na něj hodný/á. Další noc: ㅈ, ㅓ a dvě „Shift“ souhlásky ㄸ a ㅃ (Shift + ㄷ / ㅂ).',
    tip: 'Tip: 떡 a 빵 – když zapomeneš Shift, vyjde ti 덕 nebo 방!',
  },
  3: {
    title: 'Babiččin deštník',
    text: 'Ty už opravdu vaříš! Zítra: ㅅ, ㅡ, ㅉ (Shift + ㅈ) a ㅐ. Pozor, ㅐ a ㅔ vypadají skoro stejně.',
    tip: 'Tip: do 찌개 dávej kimči, které už pořádně zkyslo.',
  },
  4: {
    title: 'Hallasan v mlze',
    text: 'Poslední noc v 을지로! Přijdou těžká jídla: 떡볶이, 짜장면, 김치찌개. Novinky: ㄲ (Shift + ㄱ) a složená samohláska ㅘ = ㅗ + ㅏ.',
    tip: 'Tip: dlouhá slova piš po slabikách. Nikam neutečou.',
  },
  5: {
    title: 'Stěhujeme se k řece',
    text: 'Stánek se přesouvá k 한강 – v létě tam jsou pikniky. Zákazníci chtějí ovoce a pití. Nové jamo: ㅍ, ㅋ a ㅎ.',
    tip: 'Zdvořilost: když host odchází (ikonka dveří), napiš 감사합니다 = děkuji. Dostaneš mince navíc!',
  },
  6: {
    title: 'Ryby na trhu',
    text: 'Dnes jsem na trhu smlouvala o mandarinky jako za mlada. U tebe přibude ㅌ a ㅛ – třeba v 음료수 a 파스타. A s ㅛ i pozdravy: když si host sedne (ikonka ruky), napiš 환영해요 = vítejte. Při odchodu 또 봐요 nebo 잘 가요.',
    tip: 'Tip: 버블티 – perly vař, dokud nejsou průsvitné.',
  },
  7: {
    title: 'Mosty v noci',
    text: 'Jsou ty mosty pořád tak barevné? Nové samohlásky: ㅔ (멜론) a ㅟ = ㅜ + ㅣ (샌드위치). S ㅔ umíš i 안녕하세요 a 또 오세요 (přijďte zas).',
    tip: 'Tip: 치킨 a pivo 맥주 – „치맥“ je u řeky povinnost.',
  },
  8: {
    title: 'Babička se učí plavat',
    text: 'Nových písmen už moc není – teď jde o rychlost. Čekají tě 빙수, 과일 a dlouhá 아이스크림.',
    tip: 'Tip: na 빙수 dej hodně sladkých fazolí.',
  },
  9: {
    title: 'Skoro hotovo',
    text: 'Zítra přijde dav – poslední noc před velkou návštěvou. Opakuj, co tě zlobilo.',
    tip: 'Tip: kdo se nehoní, tomu jídlo nepřeteče.',
  },
  10: {
    title: 'Přijede 미식가!',
    text: 'Kritik je tu. Objednává celými větami: „김치찌개 하나 주세요“ = kimči polévka, jednou, prosím. Mezery psát nemusíš. Každá chyba ho mrzí – piš pečlivě.',
    tip: 'Nová slova: 하나 (jeden), 둘 (dva), 하고 (a), 주세요 (dejte mi, prosím).',
  },
  11: {
    title: 'Jsem na tebe pyšná',
    text: 'Ať napsal cokoli, uličku jsi oživil/a. Developer se ale nevzdává – potřebuješ víc slávy. Zkus trh 동대문: moje kamarádka 이모 tam šije. Lidi tam chtějí věci v barvách: „빨간색 모자“ = červená čepice. Nové písmeno: ㅆ (Shift + ㅅ).',
    tip: 'Novinka: po jídle zákazník řekne, jak mu bylo. „Levné!“ → napiš 싸다, „Výborné!“ → 맛있다. Základní tvar končí na -다.',
  },
  12: {
    title: 'Hedvábí a knoflíky',
    text: 'Barvy jsou snadné: skoro všechny končí na 색 (barva). Zítra přidám ㅑ – s ní napíšeš 하얀색 (bílá). ㅑ je jako ㅏ, jen s dvěma čárkami.',
    tip: 'Tip: mezeru mezi barvou a věcí psát nemusíš. 빨간색모자 platí taky.',
  },
  13: {
    title: 'Mandarinky v košíku',
    text: 'Další novinka: ㅖ = Shift + ㅔ. Najdeš ji v 시계 (hodinky) a v 예쁘다 (hezký). Zákazníci na trhu to slovo rádi slyší!',
    tip: 'Tip: když zákazník řekne „Hezké!“, napiš 예쁘다.',
  },
  14: {
    title: 'Šedé ráno na Jeju',
    text: 'Dnes je tu mlha, všechno je 회색 – šedé. To je nová samohláska ㅚ = ㅗ + ㅣ. A 색 samotné znamená „barva“.',
    tip: 'Tip: 이모 má ráda 보라색. Ale psst!',
  },
  15: {
    title: 'Poslední den trhu',
    text: 'Zítra přijde dav – všechny barvy, všechny věci. Pak se na tebe chce podívat slavná módní blogerka. Pozdrav ji hezky!',
    tip: 'Tip: dívej se nejdřív na barvu, pak na věc. Barva se píše první.',
  },
  16: {
    title: 'Blogerka přichází',
    text: 'Objednává celými větami: „파란색 모자하고 가방 주세요“ = modrou čepici a tašku, prosím. 하고 je „a“, 하나/둘 je kolik. Nezapomeň na 안녕하세요!',
    tip: 'Tip: věta je jen několik slov za sebou. Piš je jedno po druhém.',
  },
  116: {
    title: 'Video koluje po Soulu',
    text: 'Vnoučata mi ukazovala video z tvého stánku! Mladí teď chtějí do 홍대 – hudba, kluby a slova z angličtiny. Já si zatím zkouším 한복 od 이모.',
    tip: 'P.S. Fialová mi sluší, co myslíš?',
  },
};

export interface Chapter {
  /** Clean serves needed. */
  need: number;
  /** Earliest night (after which it can be told). */
  minNight: number;
  lines: Line[];
}

export const REGULARS: Partial<Record<RegularId, { name: string; who: Line['who']; chapters: Chapter[] }>> = {
  kim: {
    name: '김 대리',
    who: 'kim',
    chapters: [
      { need: 1, minNight: 2, lines: [
        { who: 'kim', text: 'Zase jsem v kanceláři do jedenácti. Šéf křičel kvůli tabulkám…' },
        { who: 'kim', text: 'Tady je to jediné místo, kde si můžu oddechnout. Díky za jídlo.' },
      ] },
      { need: 4, minNight: 6, lines: [
        { who: 'kim', text: 'Víš, co jsem chtěl dělat jako kluk? Vařit. Máma říkala, že to není práce pro chlapa.' },
        { who: 'kim', text: 'Doma si teď zkouším tvůj 라면. Pořád to není ono.' },
      ] },
      { need: 7, minNight: 10, lines: [
        { who: 'kim', text: 'Tak… dal jsem výpověď. Ruce se mi ještě klepou.' },
        { who: 'kim', text: 'Nepotřebuješ náhodou pomocníka? Umím krájet cibuli a nebrečet. Skoro.' },
      ] },
    ],
  },
  haeun: {
    name: '하은',
    who: 'haeun',
    chapters: [
      { need: 1, minNight: 3, lines: [
        { who: 'haeun', text: 'Za dva měsíce mám 수능. Když to zkazím, celý život je v háji…' },
        { who: 'haeun', text: 'Promiň, musím běžet na doučování. Ale ta svačina byla dobrá!' },
      ] },
      { need: 4, minNight: 7, lines: [
        { who: 'haeun', text: 'Můžu se tu chvilku učit? Doma je moc ticho a v knihovně moc lidí.' },
        { who: 'haeun', text: 'Když slyším bublat tvůj hrnec, nějak se mi líp pamatují vzorce.' },
      ] },
      { need: 7, minNight: 10, lines: [
        { who: 'haeun', text: 'Výsledky! Mám to! Vzali mě na univerzitu!' },
        { who: 'haeun', text: 'Přinesla jsem ti dopis od mámy – děkuje, že jsi mě krmil/a.' },
      ] },
    ],
  },
  nabi: {
    name: '나비',
    who: 'nabi',
    chapters: [
      { need: 1, minNight: 1, lines: [
        { who: 'narrator', text: 'Pod pultem sedí hubená zrzavá kočka. Babička jí prý říkala 나비.' },
        { who: 'nabi', text: '…mňau?' },
      ] },
      { need: 3, minNight: 5, lines: [
        { who: 'narrator', text: '나비 se zakulatila. Spí na stoličce a přede, když bublá vývar.' },
      ] },
      { need: 6, minNight: 9, lines: [
        { who: 'narrator', text: '나비 dnes nepřišla sama. Za ní se batolí tři koťata!' },
        { who: 'nabi', text: 'Mňau. (Asi to znamená „díky“.)' },
      ] },
    ],
  },
  imo: {
    name: '이모',
    who: 'imo',
    chapters: [
      { need: 1, minNight: 12, lines: [
        { who: 'imo', text: 'Ty jsi to vnouče od 할머니? Šiju tady vedle už dvacet let. Tvoje babička mi pořád dluží 떡볶이!' },
        { who: 'imo', text: 'Na trhu ti budou chtít barvy. Neboj, s 빨간색 a 파란색 se tu dá přežít.' },
      ] },
      { need: 4, minNight: 14, lines: [
        { who: 'imo', text: 'Tajemství: šiju 할머니 한복 k 추석. Celý rok jsem šetřila na hedvábí.' },
        { who: 'imo', text: 'Jakou barvu má ráda? 분홍색? Ne, říkala, že prý už je na růžovou stará. Hm… tak 보라색!' },
      ] },
      { need: 7, minNight: 16, lines: [
        { who: 'imo', text: 'Hotovo! Fialový 한복 se zlatou mašlí. Pošli ho babičce na Jeju, ať na 추석 září.' },
        { who: 'imo', text: 'A tady máš něco pro sebe: zástěru s tvým jménem. Na 추석 přijdu i s rodinou, uvaříš nám?' },
      ] },
    ],
  },
};

/** Boss intros (bosses always want a greeting). */
export const BOSS_INTRO: Record<BossId, Line[]> = {} as Record<BossId, Line[]>;
export const BOSS_REVIEW: Record<BossId, Record<number, string>> = {} as Record<BossId, Record<number, string>>;

export const CRITIC_INTRO: Line[] = [
  { who: 'critic', text: 'Dobrý večer. Jsem 미식가. Neusmívám se a nepiju sladké.' },
  { who: 'critic', text: 'Objednám si pětkrát. Každá chyba se objeví v mé recenzi.' },
  { who: 'critic', text: 'A slušný kuchař hosta nejdřív pozdraví: 안녕하세요. Bez pozdravu hvězda dolů.' },
];

export const CRITIC_REVIEW: Record<number, string> = {
  1: '★☆☆☆☆ „Snaha byla. Chuť ne.“ Ulička visí na vlásku.',
  2: '★★☆☆☆ „Upřímné, ale nejisté. Vrátím se, až kuchař dozraje.“',
  3: '★★★☆☆ „Solidní stánek se srdcem. Vývar by unesl i víc odvahy.“',
  4: '★★★★☆ „Teplo, rychlost a poctivé 맛. Tohle Soul potřebuje.“',
  5: '★★★★★ „Nejlepší 포장마차 ve městě. Ulička musí zůstat!“',
};

export const CLIFFHANGER: Line[] = [
  { who: 'narrator', text: 'Recenze vyšla ráno. Lidé ji sdílejí a ulička zatím zůstává…' },
  { who: 'narrator', text: '…ale developer se nevzdává. Na rohu se objevil nový plakát: „Brzy: 부산 přístav“.' },
  { who: 'halmeoni', text: 'Potřebuješ ještě víc slávy, zlatíčko. Vezmi stánek na trh 동대문 – 이모 tě tam čeká.' },
];

/** Hints for typical trouble jamo, used on postcards. */
export const JAMO_TIPS: Record<string, string> = {
  ㄲ: 'ㄲ = Shift + ㄱ', ㄸ: 'ㄸ = Shift + ㄷ', ㅃ: 'ㅃ = Shift + ㅂ', ㅆ: 'ㅆ = Shift + ㅅ', ㅉ: 'ㅉ = Shift + ㅈ',
  ㅘ: 'ㅘ = ㅗ + ㅏ', ㅝ: 'ㅝ = ㅜ + ㅓ', ㅟ: 'ㅟ = ㅜ + ㅣ', ㅢ: 'ㅢ = ㅡ + ㅣ', ㅚ: 'ㅚ = ㅗ + ㅣ', ㅙ: 'ㅙ = ㅗ + ㅐ', ㅞ: 'ㅞ = ㅜ + ㅔ',
  ㅒ: 'ㅒ = Shift + ㅐ', ㅖ: 'ㅖ = Shift + ㅔ',
};

BOSS_INTRO.critic = CRITIC_INTRO;
BOSS_REVIEW.critic = CRITIC_REVIEW;

// ------------------------------------------------------------------ 동대문
BOSS_INTRO.blogger = [
  { who: 'blogger', text: 'Ahojky! Jsem módní 블로거, dvě stě tisíc sledujících. Natáčím to živě!' },
  { who: 'blogger', text: 'Objednávám celými větami: barva, věc a kolik. Třeba „빨간색 치마 하나 주세요“.' },
  { who: 'blogger', text: 'A pozdrav do kamery! Bez 안녕하세요 to moji fanoušci nesnesou. Každá chyba = −1 hvězda.' },
];
BOSS_REVIEW.blogger = {
  1: '★☆☆☆☆ „Barvy? Spíš bazar.“ Video má tři lajky.',
  2: '★★☆☆☆ „Snaha tu je, styl ještě ne.“',
  3: '★★★☆☆ „Roztomilý stánek, příště víc odvahy v barvách!“',
  4: '★★★★☆ „Rychlé, barevné, s úsměvem. Doporučuju!“',
  5: '★★★★★ „Nejstylovější 포장마차 v Soulu! Fronta až k bráně 동대문.“',
};

// ------------------------------------------------------------------ 홍대
BOSS_INTRO.manager = [
  { who: 'manager', text: 'Rychle, rychle! Jsem 매니저 dívčí skupiny. Za hodinu máme koncert a holky mají hlad.' },
  { who: 'manager', text: 'Objednávám pro celý tým: „떡볶이 둘하고 콜라 주세요“ – dvakrát tteokbokki a kolu.' },
  { who: 'manager', text: 'A pozdrav! Slušnost je v K-popu základ. Každá chyba = −1 hvězda.' },
];
BOSS_REVIEW.manager = {
  1: '★☆☆☆☆ „Holky šly na koncert hladové.“',
  2: '★★☆☆☆ „Pomalé. Příště si objednám rozvoz.“',
  3: '★★★☆☆ „Dobré, holky byly spokojené.“',
  4: '★★★★☆ „Rychlé a chutné. Vrátíme se po turné!“',
  5: '★★★★★ „Holky o tobě zpívaly na pódiu! 최고!“',
};

// ------------------------------------------------------------------ 용산
BOSS_INTRO.trader = [
  { who: 'trader', text: 'Hm. Já jsem 상인. Na 용산 prodávám třicet let a nikdo mě neošulil.' },
  { who: 'trader', text: 'Mluvím jen o cenách: „카메라 너무 비싸다“ – ten foťák je moc drahý. Napiš, co říkám.' },
  { who: 'trader', text: 'A pozdrav, jsme slušní obchodníci. Každá chyba = −1 hvězda.' },
];
BOSS_REVIEW.trader = {
  1: '★☆☆☆☆ „Za tohle bych nedal ani 할인.“',
  2: '★★☆☆☆ „Ušlo by to. Ale jen se slevou.“',
  3: '★★★☆☆ „Poctivé zboží, poctivý stánek.“',
  4: '★★★★☆ „Jsi tvrdý/á vyjednavač/ka. Respekt.“',
  5: '★★★★★ „Nejlepší obchod na celém 용산. A to říkám já!“',
};

// ------------------------------------------------------------------ 부산
BOSS_INTRO.captain = [
  { who: 'captain', text: 'Ahoj, kuchaři. Jsem 선장 trajektu na Jeju. Tvoje babička se mnou jezdí každý týden.' },
  { who: 'captain', text: 'Dnes chci všechno, co ses naučil/a: jídlo, barvy, lístky… Dlouhé věty, žádné zkratky.' },
  { who: 'captain', text: 'Na lodi se zdraví. 안녕하세요, prosím. Každá chyba = −1 hvězda.' },
];
BOSS_REVIEW.captain = {
  1: '★☆☆☆☆ „Moře je dnes rozbouřené… i tvoje psaní.“',
  2: '★★☆☆☆ „Kotva drží, ale plachty jsou zplihlé.“',
  3: '★★★☆☆ „Dobrá plavba. Babička by byla ráda.“',
  4: '★★★★☆ „Pevná ruka u kormidla. Vezmu tě na Jeju!“',
  5: '★★★★★ „Nejlepší kuchař/ka od Soulu po Jeju. Babička pláče štěstím!“',
};

Object.assign(POSTCARDS, {
  17: {
    title: 'Hudba z rádia',
    text: 'V 홍대 mluví mladí napůl anglicky. Přejatá slova se píšou podle zvuku: party → 파티, game → 게임. Zítra přibude ㅞ = ㅜ + ㅔ, třeba ve slově 웨이터 (waiter).',
    tip: 'Pravidlo: f se píše ㅍ (coffee → 커피), v se píše ㅂ.',
  },
  18: {
    title: 'Koncert na Jeju',
    text: 'Dnes hrála na pláži kapela! Další písmeno: ㅒ = Shift + ㅐ. Je jen v pár slovech, třeba 얘기 – povídání.',
    tip: 'Pravidlo: koncovka -ing se píše -잉 (camping → 캠핑).',
  },
  19: {
    title: 'Tichá noc u moře',
    text: 'Všechna písmena hlavní linky už skoro znáš! Zbytek je o rychlosti a přejatých slovech.',
    tip: 'Pravidlo: anglické souhlásky na konci dostanou ㅡ: test → 테스트, drum → 드럼, concert → 콘서트.',
  },
  20: {
    title: 'Babička tančí',
    text: 'Zítra poslední noc v 홍대. Pak tě navštíví manažer slavné skupiny – objednává pro celý tým.',
    tip: 'Tip: „둘하고“ = dvakrát a… Pozor, kde končí jedno jídlo a začíná další.',
  },
  21: {
    title: 'Manažer přichází',
    text: 'Manažer chce věty jako „떡볶이 둘하고 콜라 주세요“. Piš je klidně bez mezer. A pozdrav!',
    tip: 'Tip: kdo pozdraví, tomu se odpouští.',
  },
  121: {
    title: 'Píseň o stánku',
    text: '민수 prý nahrál píseň o tvém stánku a hraje ji rádio! Další zastávka: 용산, trh s elektronikou. Tam se smlouvá: na „To je drahé!“ odpověz 할인 (sleva), nebo trvej na ceně slovem 싸다.',
    tip: 'Nové písmeno: ㅝ = ㅜ + ㅓ, třeba v pozdravu 반가워요 (těší mě).',
  },
  22: {
    title: 'Staré rádio',
    text: 'Mé staré rádio u stánku už dlouho nechytá. Možná ho někdo na 용산 opraví? Zítra přibude ㅙ = ㅗ + ㅐ ve slově 괜찮다 (v pořádku).',
    tip: 'Tip: sleva (할인) zákazníka udrží, 싸다 přinese víc mincí – ale může odejít.',
  },
  23: {
    title: 'Mořské řasy',
    text: 'Dlouhá slova se píšou po slabikách: 텔레비전 = 텔·레·비·전. Nikam nespěchej.',
    tip: 'Tip: 냉장고 a 세탁기 mají každá slabika jasný tvar. Představ si je jako stavebnici.',
  },
  24: {
    title: 'Ventilátor v létě',
    text: 'Na Jeju je horko a já mám jen 선풍기. Zítra se ti hodí slova 너무 (moc) a 정말 (opravdu) – obchodníci je milují.',
    tip: 'Tip: 비싸다 = drahý, 싸다 = levný. Liší se jen 비.',
  },
  25: {
    title: 'Obchodník čeká',
    text: 'Po poslední noci přijde obchodník, který prý nikdy neprohrál. Mluví o cenách: „카메라 너무 비싸다“.',
    tip: 'Tip: jeho věty piš přesně, slovo po slově.',
  },
  26: {
    title: 'Obchodník čeká',
    text: 'Zítra přijde 상인. Nezapomeň ho pozdravit – i drsní obchodníci mají rádi slušnost.',
    tip: 'Tip: 정말 = opravdu, 너무 = moc.',
  },
  126: {
    title: 'Jedu za tebou!',
    text: 'Za týden přijedu trajektem do 부산 – tam tě čeká poslední štace: výdejna lístků v přístavu. Lidé ti řeknou, kam jedou, a ty napíšeš čím: na Jeju 배, do Soulu 기차.',
    tip: 'Tip: na letiště jezdí 버스 i 지하철 – obojí platí.',
  },
  27: {
    title: 'Racci nad přístavem',
    text: 'V 부산 je cítit moře. Zákazníci řeknou cíl a ty napíšeš dopravu. Do 강남 jezdí 지하철, do 인천 기차.',
    tip: 'Tip: dívej se na ikonu cíle – mapa ti napoví.',
  },
  28: {
    title: 'Lístky, prosím',
    text: 'Od zítřka chtějí lidé i lístek: 표. Napiš dopravu a 표 – třeba „기차 표“ (lístek na vlak). Mezera je nepovinná.',
    tip: 'Tip: taxi lístek nepotřebuje. Taxík zaplatíš na místě.',
  },
  29: {
    title: 'Pas a brána',
    text: 'Na letišti potřebuješ 여권 (pas) a 게이트 (bránu). Na nádraží 출구 (východ). Všechno to tu uslyšíš.',
    tip: 'Tip: 여권 má ㅝ – vzpomínáš na 반가워요?',
  },
  30: {
    title: 'Zítra kapitán',
    text: 'Poslední noc v přístavu! Pak tě čeká 선장 – kapitán mého trajektu. Chce dlouhé věty ze všeho, co umíš.',
    tip: 'Tip: dýchej. Celá hra byla příprava na tuhle noc.',
  },
  31: {
    title: 'Vidíme se na lodi',
    text: 'Kapitán je přísný, ale spravedlivý. Pozdrav ho a piš celé věty. Já budu na palubě.',
    tip: 'P.S. Vezu ti mandarinky.',
  },
  131: {
    title: 'Doma',
    text: 'Ulička v 을지로 zůstane. Stánek je tvůj, zlatíčko – a já ti budu dál psát pohledy. Teď tě čekají svátky, lékárna a denní výzvy.',
    tip: 'P.S. Hrnec. Žádný saponát. Nikdy.',
  },
  // 약국 side line
  201: {
    title: 'Díky za zástup!',
    text: 'Moje kamarádka 약사 je nadšená. Zítra přijdou i lidé, kteří hledají lékaře: 의사 má ㅢ = ㅡ + ㅣ.',
    tip: 'Tip: 눈 je oko – ale v zimě taky sníh!',
  },
  202: {
    title: 'Bolí tě něco?',
    text: 'Od další směny lidé řeknou, co je trápí, a ty podáš správnou věc: 약 (lék), 반창고 (náplast), nebo pošleš do 병원 (nemocnice). ㅝ = ㅜ + ㅓ.',
    tip: 'Tip: zlomená noha → 병원, říznutí → 반창고, rýma → 약.',
  },
  203: {
    title: 'Babiččin čaj',
    text: 'Ještě jedna směna a 약사 se vrací. Říkala, že ti za odměnu dá recept na můj zázvorový čaj!',
    tip: 'Tip: 아프다 = bolet, 조심하다 = dávat pozor.',
  },
  204: {
    title: 'Recept na čaj',
    text: 'Zázvor, med, plátek citronu a trpělivost. Hrnek najdeš na pultu – hezky ho opatruj.',
    tip: 'P.S. 조심하세요! Dávej na sebe pozor.',
  },
  // holidays
  301: {
    title: '추석 doma',
    text: 'Byla to nejkrásnější 추석 za léta. 한복 od 이모 mi padne jako ulitý a celá rodina chválila tvoje jídlo.',
    tip: 'Tip: 언니/누나 i 오빠/형 záleží na tom, kdo mluví – holka, nebo kluk.',
  },
  302: {
    title: 'Bílé Vánoce',
    text: 'V Soulu sněží! 눈 = sníh (a taky oko). 메리 크리스마스, zlatíčko.',
    tip: 'Tip: 선물 = dárek. Nejlepší dárek je čas.',
  },
  303: {
    title: 'Všechno nejlepší, 나비!',
    text: 'Kočka má narozeniny? To jsem netušila! Pozdravuj koťata.',
    tip: 'Tip: 생일 축하해요 = všechno nejlepší k narozeninám.',
  },
} as Record<number, Postcard>);

REGULARS.minsu = {
  name: '민수', who: 'minsu',
  chapters: [
    { need: 1, minNight: 17, lines: [
      { who: 'minsu', text: 'Yo! Jsem 민수. Rapuju o jídle. „떡볶이 맵다, ale srdce 달다“ – dobrý, ne?' },
      { who: 'minsu', text: 'Moje máma chce, ať jdu na úřad. Já chci 콘서트. Velkou.' },
    ] },
    { need: 4, minNight: 19, lines: [
      { who: 'minsu', text: 'Napsal jsem song o tvém stánku: „포장마차 노래“. Refrén je jen „맛있다! 맛있다!“' },
      { who: 'minsu', text: 'Zítra mám první vystoupení v klubu. Ruce se mi potí jak 빙수.' },
    ] },
    { need: 7, minNight: 21, lines: [
      { who: 'minsu', text: 'Koncert! Lidi zpívali refrén se mnou. Celý klub křičel 맛있다!' },
      { who: 'minsu', text: 'Máma tam byla. Brečela. Tady máš lístek na můj další 콘서트 – první řada.' },
    ] },
  ],
};

REGULARS.park = {
  name: '박 사장', who: 'park',
  chapters: [
    { need: 1, minNight: 22, lines: [
      { who: 'park', text: 'Jsem 박 사장, opravuju všechno, co má šňůru. To rádio u tebe… 고장났어요, co?' },
      { who: 'park', text: 'Takové už se nedělají. Ukaž mi ho někdy.' },
    ] },
    { need: 4, minNight: 24, lines: [
      { who: 'park', text: 'Rozebral jsem ho. Elektronka je pryč. Ale na trhu jedna být musí – 고치다 je moje řemeslo!' },
      { who: 'park', text: 'Moje žena říká, že víc mluvím s rádii než s ní. Má pravdu.' },
    ] },
    { need: 7, minNight: 26, lines: [
      { who: 'park', text: 'Hotovo! Rádio hraje a chytí i novou stanici – noční jazz.' },
      { who: 'park', text: 'Zadarmo. Tvoje babička mi kdysi dala 라면, když jsem neměl ani na nájem.' },
    ] },
  ],
};

REGULARS.kang = {
  name: '강 이사', who: 'kang',
  chapters: [
    { need: 1, minNight: 27, lines: [
      { who: 'kang', text: 'Jeden lístek do Soulu. Jsem 강 이사 ze stavební firmy. Ano, té, co chce zbourat 을지로.' },
      { who: 'kang', text: 'Nic osobního. Jen čísla.' },
    ] },
    { need: 4, minNight: 29, lines: [
      { who: 'kang', text: 'Víte… vyrůstal jsem v uličce jako je ta vaše. Máma tam měla prádelnu.' },
      { who: 'kang', text: 'Když ji zbořili, už nikdy nevoněla po mýdle a 라면. Asi proto jsem tak tvrdý.' },
    ] },
    { need: 7, minNight: 31, lines: [
      { who: 'kang', text: 'Zrušil jsem projekt. Představenstvo zuří. Ulička 을지로 zůstane.' },
      { who: 'kang', text: 'A vaše babička? Ta mi včera volala. Prý mám přijít na 김치찌개. Asi přijdu.' },
    ] },
  ],
};

/** 약국: the pharmacist's intro (before L1) and her thanks (after L4). */
export const PHARMACY_INTRO: Line[] = [
  { who: 'yaksa', text: 'Ty jsi vnouče od 할머니? Já jsem 약사. Potřebuju na pár nocí zástup v lékárně.' },
  { who: 'yaksa', text: 'Lidé ti ukážou, co je bolí. Ty napíšeš, kde to je: 머리, 배, 손… Pak podáš, co potřebují.' },
];
export const PHARMACY_OUTRO: Line[] = [
  { who: 'yaksa', text: 'Děkuju! Lékárna nikdy nebyla tak veselá. Tady je odznáček a recept 할머니 na čaj.' },
  { who: 'narrator', text: 'Na pultu stánku teď stojí babiččin hrnek s čajem.' },
];

/** Holiday night intros. */
export const HOLIDAY_INTRO: Record<number, Line[]> = {
  301: [
    { who: 'narrator', text: '추석. Ulička 을지로 voní 송편 a pečeným masem. Před stánkem zastavilo taxi…' },
    { who: 'halmeoni', text: 'Překvapení! Přijela jsem na svátky. A podívej – 한복 od 이모!' },
    { who: 'halmeoni', text: 'Dnes přijdou celé rodiny. Řeknou ti, pro koho jídlo je: pro 할머니, pro 아빠… Napiš to.' },
  ],
  302: [
    { who: 'narrator', text: 'Štědrý večer v 홍대. Sněží a ulice svítí.' },
    { who: 'minsu', text: '메리 크리스마스! Dneska hraju koledy v rapu. Lidi chtějí dárky a dorty!' },
  ],
  303: [
    { who: 'narrator', text: 'Dnes je to přesně rok, co 나비 poprvé přišla ke stánku.' },
    { who: 'nabi', text: 'Mňau! (Koťata už sedí u pultu a čekají na dort.)' },
  ],
};

/** After the captain: the line closes – grandma visits. */
export const FINALE: Line[] = [
  { who: 'narrator', text: 'Trajekt z Jeju zakotvil. Po lávce scházela malá paní s košíkem mandarinek.' },
  { who: 'halmeoni', text: 'Zlatíčko! Slyšela jsem všechno. 미식가, blogerka, rádio, a dokonce 강 이사 zrušil přestavbu!' },
  { who: 'halmeoni', text: 'Stánek je teď opravdu tvůj. A já? Občas přijedu uvařit 김치찌개 – pro štamgasty.' },
  { who: 'narrator', text: 'Ulička 을지로 zůstala. Každou noc se tam rozsvěcí oranžová plachta a voní vývar.' },
];

/** First switch to Poslech (Settings). */
export const LISTEN_INTRO: Line[] = [
  { who: 'chef', text: 'Dneska se objednává jen nahlas. Poslouchej!' },
  { who: 'chef', text: 'Zákazník řekne objednávku korejsky a ty napíšeš, co slyšíš. V bublině je jen reproduktor.' },
  { who: 'chef', text: 'Nezaslechl/a jsi to? Ťukni na bublinu (nebo na ucho vedle psaní). První opakování je zdarma, každé další stojí spropitné.' },
  { who: 'chef', text: 'Nápověda „?“ funguje jako vždycky. A po obsloužení ti bublina ukáže, co to bylo.' },
  { who: 'chef', text: 'Poslech má vlastní postup – začínáš od první noci. Mince, vylepšení a Barvírna ti zůstávají.' },
];
