// Builds src/data/words.json from the Recallo Anki export + Czech translations.
// Run: npm run words   (vite-node, so it can import the TS logic)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { difficulty } from '../src/logic/difficulty';

const SRC = process.env.WORDS_TSV ?? '/home/rogr/Projects/Recallo/anki_korean.txt';

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

const rows = existsSync(SRC)
  ? readFileSync(SRC, 'utf8').split('\n').filter(Boolean).map((l) => l.split('\t'))
  : [];
const inDeck = new Map(rows.map((r) => [r[0].trim(), r]));

interface Word { id: string; ko: string; cs: string; en: string; category: string; icon: string; difficulty: number }
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
if (rows.length) {
  const missing = rows.filter((r) => r[2]?.trim() === 'Food' && !FOOD[r[0].trim()]);
  if (missing.length) throw new Error('untranslated food: ' + missing.map((m) => m[0]).join(', '));
}
out.sort((a, b) => a.difficulty - b.difficulty);
writeFileSync(new URL('../src/data/words.json', import.meta.url), JSON.stringify(out, null, 1) + '\n');
console.log(`words.json: ${out.length} words`);
for (const w of out) console.log(w.difficulty.toFixed(1).padStart(5), w.ko, '—', w.cs);
