// All story text (Czech). Korean words appear only where the player already knows them.
import type { RegularId } from './levels';

export interface Line {
  who: 'halmeoni' | 'kim' | 'haeun' | 'nabi' | 'critic' | 'narrator';
  text: string;
}

export const NAMES: Record<Line['who'], string> = {
  halmeoni: '할머니',
  kim: '김 대리',
  haeun: '하은',
  nabi: '나비',
  critic: '미식가',
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
    text: 'Stánek se přesouvá k 한강 – v létě tam jsou pikniky. Zákazníci chtějí ovoce a pití. Nové jamo: ㅍ a ㅋ.',
    tip: 'Tip: u řeky fouká, tak drž víčka na hrncích.',
  },
  6: {
    title: 'Ryby na trhu',
    text: 'Dnes jsem na trhu smlouvala o mandarinky jako za mlada. U tebe přibude ㅌ a ㅛ – třeba v 음료수 a 파스타.',
    tip: 'Tip: 버블티 – perly vař, dokud nejsou průsvitné.',
  },
  7: {
    title: 'Mosty v noci',
    text: 'Jsou ty mosty pořád tak barevné? Nové samohlásky: ㅔ (멜론) a ㅟ = ㅜ + ㅣ (샌드위치).',
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
    text: 'Ať napsal cokoli, uličku jsi oživil/a. Ulička zatím zůstává… ale developer se nevzdává. Já se brzy vrátím na návštěvu.',
    tip: 'P.S. Hrnec nikdy nemyj saponátem!',
  },
};

export interface Chapter {
  /** Clean serves needed. */
  need: number;
  /** Earliest night (after which it can be told). */
  minNight: number;
  lines: Line[];
}

export const REGULARS: Record<RegularId, { name: string; who: Line['who']; chapters: Chapter[] }> = {
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
};

export const CRITIC_INTRO: Line[] = [
  { who: 'critic', text: 'Dobrý večer. Jsem 미식가. Neusmívám se a nepiju sladké.' },
  { who: 'critic', text: 'Objednám si pětkrát. Každá chyba se objeví v mé recenzi.' },
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
];

/** Hints for typical trouble jamo, used on postcards. */
export const JAMO_TIPS: Record<string, string> = {
  ㄲ: 'ㄲ = Shift + ㄱ', ㄸ: 'ㄸ = Shift + ㄷ', ㅃ: 'ㅃ = Shift + ㅂ', ㅆ: 'ㅆ = Shift + ㅅ', ㅉ: 'ㅉ = Shift + ㅈ',
  ㅘ: 'ㅘ = ㅗ + ㅏ', ㅝ: 'ㅝ = ㅜ + ㅓ', ㅟ: 'ㅟ = ㅜ + ㅣ', ㅢ: 'ㅢ = ㅡ + ㅣ', ㅚ: 'ㅚ = ㅗ + ㅣ', ㅙ: 'ㅙ = ㅗ + ㅐ', ㅞ: 'ㅞ = ㅜ + ㅔ',
  ㅒ: 'ㅒ = Shift + ㅐ', ㅖ: 'ㅖ = Shift + ㅔ',
};
