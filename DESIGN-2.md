# Pocha Pop 포차팝: Design 2 (rozšíření po vertical slice)

Navazuje na `DESIGN.md` (slice je hotový, viz `README.md` a `AGENTS.md`). Tento dokument je **závazné zadání**
pro druhou etapu. Platí všechno z první etapy: systémová klávesnice (IME), Android + Linux, čeština v UI,
pixel art kreslený v Aseprite přes `art/src/*.lua`, paleta Endesga 32, kvalita a „feel“ jsou priorita.

Zdroj slov: soukromý Anki export `anki_korean.txt` (Recallo), cesta přes `WORDS_TSV` (639 slov z Duolinga; hra jich zatím používá 54).
Všechna korejská slova níže **v balíčku jsou**, kromě výslovně označených `[+]` (doplnit ručně,
`scripts/build-words.ts` → sekce `EXTRA`, s komentářem proč).

---

## 0. Pořadí prací (milníky, po každém commit + testy)

| # | Milník | Kap. |
|---|---|---|
| M1 | Volba počtu míst místo 4. stoličky + pomocník 김 대리 | §1 |
| M2 | Pozdravy a poděkování, reakce zákazníků | §2 |
| M3 | Barvy: slova, Barvírna (kosmetika stánku), čepičky pro 나비 | §3 |
| M4 | Čtvrť 동대문 (noci 12–16 + boss) | §4.1 |
| M5 | Čtvrť 홍대 (17–21 + boss) | §4.2 |
| M6 | Čtvrť 용산 (22–26 + boss) | §4.3 |
| M7 | Vedlejší linka 약국 (L1–L4) | §4.4 |
| M8 | Čtvrť 부산 přístav (27–31 + finální boss) | §4.5 |
| M9 | Sváteční noci 추석, 크리스마스, 생일 | §4.6 |
| M10 | Trénink, denní výzva, úspěchy (odznáčky) | §5 |
| M11 | Mapa pro 6 čtvrtí, vyvážení, finální screenshoty, APK, README/AGENTS | §6, §7 |

Milníky dělej v tomto pořadí. Každý musí být hratelný sám o sobě (žádné rozbité mezistavy v `master`).

---

## 1. Místa u pultu a pomocník

### 1.1 Volba počtu míst (nahrazuje upgrade „4. stolička“)
Víc míst = víc souběžných objednávek = těžší. Proto to není upgrade, ale **volba před každou nocí**
(v popupu noci na mapě, segmentové tlačítko `2 · 3 · 4`):

| Míst | Násobič mincí | Popis v UI |
|---|---|---|
| 2 | ×1,0 | „Klidná noc“ |
| 3 | ×1,3 | „Běžná noc“ (výchozí) |
| 4 | ×1,7 | „Nával“ (odemkne se po první noci se 3★) |

- Počet zákazníků za noc se nemění, mění se jen souběžnost (a tím tempo příchodů: `spawn × 3/míst`).
- Hvězdy se počítají jako dosud (poměr obsloužených). Do záznamu noci se ukládá i nejvyšší zvolený počet míst
  (zobrazit na mapě malou ikonkou stoličky u lampionu).
- Bossové noci mají počet míst pevný (3).
- Logika (`src/logic/rules.ts`): `seatMultiplier(seats)`, `spawnInterval(base, seats)` + testy.
- **Migrace save:** kdo má koupený `stool4`, dostane 150 mincí zpět a upgrade se odstraní (`migrate()` + test).

### 1.2 Pomocník 김 대리 (nový upgrade v obchodě)
- Odemkne se po 3. kapitole příběhu 김 대리 (dal výpověď, ptá se, jestli může pomáhat). Cena 200.
- Ve scéně stojí vedle šéfkuchaře (nový sprite `char_kim_helper`: 김 v zástěře, idle 2f, „vaří“ 4f, mávnutí 2f).
- **Jednou za noc** (se 4 místy dvakrát) sám obslouží zákazníka, kterému klesla trpělivost pod 20 %.
  Hráč za takovou objednávku nedostane spropitné a slovo se nepočítá do mastery. Krátká hláška v bublině
  („제가 할게요!“ s českým podtitulem „To vezmu já!“).
- Logika rozhodování v `src/logic/` + test (kdy zasáhne, kolikrát).

---

## 2. Zdvořilost a reakce (Expression + přídavná jména)

### 2.1 Pozdravy a poděkování
Dobrovolné, ale odměňované. Slova z kategorie Expression: `안녕하세요`, `환영해요`, `감사합니다`, `또 오세요`, `또 봐요`,
`잘 가요`.
- Když si zákazník sedne, nad ním na 4 s problikne malá ikonka ruky 👋 (sprite, ne emoji). Napíše-li hráč v tu dobu
  `안녕하세요` nebo `환영해요`, zákazník se usměje: +15 % trpělivosti a +1 mince.
- Když zákazník dojí a zvedá se, na 4 s ikonka dveří: `감사합니다` / `또 오세요` / `또 봐요` / `잘 가요` = +2 mince.
- Pozdravy jsou **další cíle v `matchAgainst`**, jen dočasné. Nesmí kolidovat s objednávkami: pokud by se prefix
  shodoval s obojím, má přednost objednávka. Když je v okně víc zákazníků, pozdrav platí pro všechny čekající.
- 미식가 a další bossové pozdrav **vyžadují**: chybějící pozdrav = −1 hvězda (zmínit v jejich úvodu).
- Slova se objeví v receptáři (kategorie „Fráze“, ikona bubliny) a mají mastery jako ostatní.

### 2.2 Reakce zákazníků (od čtvrti 동대문)
Po jídle občas (30 %) zákazník zareaguje bublinou s **českým** pocitem a ikonkou: „Pálivé!“, „Horké!“,
„Sladké!“, „Výborné!“, „Drahé…“, „Levné!“, „Hezké!“, „Velké!“, „Malé!“. Hráč má 5 s napsat korejské přídavné jméno
v základním tvaru: `맵다`, `뜨겁다`, `달다`, `맛있다`, `비싸다`, `싸다`, `예쁘다`, `크다`, `작다`, `좋다`.
Správně = +2 mince a mastery. Reakce se vybírá podle jídla nebo zboží (tabulka v datech, například 떡볶이 → 맵다,
빙수 → 달다, 라면 → 뜨겁다).

---

## 3. Barvy

### 3.1 Slova `[+]`
Balíček má jen `색` (barva). Přidat ručně (kategorie `color`, ikona = barevný vzorek 24×24):
`빨간색` červená, `파란색` modrá, `노란색` žlutá, `초록색` zelená, `하얀색` bílá, `검은색` černá,
`분홍색` růžová, `보라색` fialová, `주황색` oranžová, `갈색` hnědá, `회색` šedá.
Plus `색` z balíčku.

### 3.2 Barvírna (nová obrazovka z mapy / obchodu)
- Kosmetika stánku: **plachta**, **cedule**, **stoličky**, **lampiony**, každá v 11 barvách.
- Barvu si hráč „objedná“ tak, že napíše její korejský název (IME aktivní, stejný TypeBox). Cena 40–80 mincí.
  Nová barva je dostupná, jakmile ji hráč potkal ve hře (v 동대문) nebo v tréninku. Do té doby je zamčená s českým názvem.
- Volba se ukládá (`save.cosmetics`), projeví se ve všech scénách (`Street`).
- Pixel art: barevné varianty dělat **v Aseprite** palette swapem (`art/src/stall.lua`, generovat varianty spritesheetů
  nebo tint-mapy). Žádný runtime tint celé plachty, který by rozbil stínování.

### 3.3 Čepičky pro 나비
5 čepiček (kšiltovka, mašle, korunka, čepička s bambulí, slaměný klobouk), 30–60 mincí, překryvný sprite se
správným offsetem pro všechny snímky kočky (`nabi`, `nabi_fat`). Volba v Barvírně.

---

## 4. Nové čtvrti

Společné pro všechny čtvrti:
- **5 nocí + boss**, jedno nové pozadí (3 parallax vrstvy jako 을지로/한강, animace), vlastní varianta stánku,
  1 nový štamgast se 3 kapitolami příběhu, 2 generičtí zákazníci navíc, pohlednice od babičky po každé noci.
- Každá čtvrť přidá **jeden herní prvek** (níže) a pokračuje v **představování zbývajících jamo**
  (ㅆ ㅑ ㅒ ㅖ ㅚ ㅝ ㅢ ㅙ ㅞ), nejvýše 4 nová na noc, test v `levels.test.ts` hlídá jako dosud.
- Každé slovo v objednávkách má **vlastní ikonu 24×24**.
- Bossové: objednávají větami, vyžadují pozdrav, chyba = −1 hvězda (stejný systém jako 미식가).
- Babiččiny pohlednice dál představují nová jamo a připomínají chyby.

### 4.1 동대문 trh: stánek s oblečením (noci 12–16, boss: módní blogerka)
Slova: `옷 치마 바지 모자 구두 운동화 티셔츠 한복 가방 지갑 안경 시계 목걸이 우산` + barvy (§3.1).
**Prvek:** dvouslovné objednávky `barva + věc` („빨간색 모자“, mezera nepovinná, matching už to umí).
Bublina ukáže věc v dané barvě: ikony oblečení kreslit v neutrální šedé a barvit palette swapem v Lua, ne runtime tintem.
Štamgast: **이모**, švadlena z vedlejšího stánku (příběh: šije babičce 한복 k 추석).
Boss: módní blogerka (věty `빨간색 치마 하나 주세요`, `파란색 모자하고 가방 주세요`).

### 4.2 홍대: stánek před klubem (17–21, boss: manažer K-popové skupiny)
Slova: `노래 가수 걸그룹 콘서트 케이팝 랩 재즈 피아노 드럼 영화 드라마 게임 노래방 피씨방 캐릭터 파티 텐트 캠핑`
(+ jídla z menu stánku jako dosud).
**Prvek: přejatá slova.** U loanwordů ukáže bublina navíc anglický originál malým písmem („concert“),
babiččina pohlednice vysvětlí pravidla přepisu (f → ㅍ, v → ㅂ, -ing → -잉, závěrečné souhlásky + ㅡ).
Štamgast: **민수**, začínající rapper (zkouší rýmy u pultu → první koncert).
Boss: manažer skupiny objednává pro celý tým (`떡볶이 둘하고 콜라 주세요`).

### 4.3 용산: elektro bazar (22–26, boss: tvrdý obchodník)
Slova: `핸드폰 노트북 카메라 컴퓨터 텔레비전 냉장고 세탁기 에어컨 선풍기 복사기 인터넷 게임 카드 볼펜`.
**Prvek: smlouvání.** Občas zákazník po objednávce řekne česky „To je drahé!“ a hráč odpoví `할인` (sleva):
zákazník zaplatí o něco méně, ale určitě zůstane. Nebo trvá na ceně slovem `싸다` (je to levné): vyšší cena,
ale 50% šance, že zákazník odejde. Jen slova z balíčku.
Délka slov roste: tady se trénují dlouhá slova (텔레비전, 에어컨).
Štamgast: **박 사장**, majitel opravny (`고장났어요`, `고치다`; příběh o starém rádiu, které hráči nakonec opraví:
rádio dostane novou stanici, druhou lo-fi smyčku).
Boss: obchodník (věty se `싸다/비싸다`).

### 4.4 약국: vedlejší linka (L1–L4, odemkne se po 한강)
Babiččina kamarádka **약사** (lékárnice) potřebuje zástup. Kratší noci (8 zákazníků), bez bosse.
Slova: `감기 머리 배 다리 손 발 귀 눈 몸 상처 약 반창고 병원 간호사 의사 약사 아프다 조심하다`.
**Prvek: příznak → věc.** Zákazník ukazuje bolavou část těla (bublina = obrázek postavičky se zvýrazněnou částí),
hráč píše **část těla**; ve druhé polovině linky zákazník řekne příznak česky a hráč píše lék (`약`, `반창고`).
Odměna linky: odznáček + recept na babiččin čaj (kosmetika: hrnek na pultu).

### 4.5 부산 přístav: výdejna lístků (27–31 + finální boss: kapitán)
Slova: `기차 버스 지하철 택시 표 여권 공항 게이트 출구 역 정류장 터미널 배 바다 서울 부산 인천 제주도 강남 여행 출발`.
**Prvek: cíl → doprava.** Zákazník řekne, kam jede (mapa s ikonou cíle + česky), hráč napíše dopravu.
Jen slova z balíčku: na Jeju `배`, do Soulu `기차`, na letiště `버스` nebo `지하철`, do 강남 `지하철`, do 인천 `기차`.
Ve druhé polovině čtvrti se k dopravě přidá `표` (lístek): `기차 표`. Tabulka cíl → povolené odpovědi v datech
a test, že každý cíl má aspoň jednu platnou odpověď.
Příběh: tady se uzavírá linka developera z 1. etapy (ulička zachráněna, babička se vrací na návštěvu).
Finální boss: **kapitán** lodi na Jeju, dlouhé věty z celé hry.

### 4.6 Sváteční noci (samostatné lampiony na mapě, odemknou se po příslušné čtvrti)
- **추석** (po 동대문): rodina u stánku: `할머니 할아버지 엄마 아빠 이모 사촌 언니 오빠 누나 형 남동생 여동생 아들 딸`.
  Objednávky „pro koho“: zákazník ukáže člena rodiny, hráč píše slovo. Babička se vrátí z Jeju (příběh).
- **크리스마스** (po 홍대): `선물 파티 케이크 크리스마스 메리 크리스마스 눈 겨울 장난감`, sníh místo deště.
- **생일** (po 용산): narozeniny 나비! `생일 축하해요 생일 선물 케이크 파티 꽃`. Koťata u pultu.

---

## 5. Trénink, denní výzva, úspěchy

- **Trénink** (tlačítko na mapě): 60 s, bez zákazníků, jen bubliny se slovy s nejvyšší vahou ze SRS
  (`srs.weight`). Žádné mince, ale mastery se počítá. Je to i místo, kde se odemykají barvy pro Barvírnu.
- **Denní výzva**: 1 noc denně s pevným seedem (`rng(seed z data)`), mix známých slov, jeden pokus o rekord,
  započítá se do denní série 🔥. Výsledek se ukládá (`save.daily[datum]`).
- **Úspěchy (odznáčky)**: ~20, vidět jako odznáčky na plachtě stánku a na samostatné obrazovce.
  Například: první noc, 10× kombo, 100 obsloužených bez chyby, všechna Shift písmena bez chyby, všechna jamo,
  kompletní receptář čtvrti, každý boss 5★, 7denní série, všechny barvy, všechny čepičky, pomocník najat,
  všechny kapitoly štamgastů. Logika v `src/logic/achievements.ts` + testy.

---

## 6. Mapa a ekonomika

- Mapa se 6 čtvrtěmi se nevejde na jednu obrazovku: **svislé scrollování** (drag/kolečko jako v receptáři),
  čtvrti pod sebou, vedlejší linka 약국 a sváteční noci jako odbočky. Automaticky odskrolovat na aktuální noc.
- Mince: noví spotřebiče = Barvírna, čepičky, pomocník, menu balíčky. Vyvážit tak, aby hráč, který hraje
  normálně (2–3★), měl na všechno zhruba na konci 부산. Napiš si simulaci (`scripts/`) a výsledky shrň v README.

---

## 7. Assety (kreslit v Aseprite přes Lua, kvalita jako v 1. etapě)

| Asset | Poznámka |
|---|---|
| Pozadí ×4 (동대문, 홍대, 용산, 부산) + interiér 약국 | 3 parallax vrstvy, animace (neon/světla/voda/vlajky), sky vrstva |
| Varianty stánku ×5 | stojan s oblečením, hudební stánek s reproduktorem, regál elektroniky, lékárenský pult, budka s lístky |
| Ikony ~120 nových slov | 24×24, neutrálně šedé oblečení s palette swapem pro barvy |
| Barevné vzorky ×11, plachta/cedule/stoličky/lampiony ×11 barev | palette swap v Lua |
| Čepičky ×5 | overlay pro všechny snímky kočky |
| Postavy: 김 pomocník, 이모, 민수, 박 사장, 약사, kapitán, 3 bossové, 4 generičtí | stejný generátor `characters.lua` |
| Ikony UI: ruka (pozdrav), dveře (rozloučení), reakce ×9, odznáčky ×20, stolička-ikona | |
| Sníh (částice) pro 크리스마스 | |

---

## 8. Hotovo = (akceptační kritéria etapy 2)
- [ ] Všechny milníky M1–M11 hratelné, postup se ukládá, migrace starého save funguje (test).
- [ ] Žádný placeholder, všechny nové assety nakreslené v Aseprite a animované, kde tabulka říká.
- [ ] vitest pro všechnu novou logiku (místa/násobiče, pomocník, pozdravy v matchingu, reakce, barvy a cíle
      v datech, úspěchy, denní seed, migrace) a zelené.
- [ ] `npm run autoplay` rozšířený: projede aspoň první noc a bosse každé čtvrti, linku 약국 a jednu sváteční noc.
- [ ] `npm run screenshots` rozšířený o nové obrazovky (Barvírna, trénink, úspěchy, nové čtvrti), zkontrolované agentem.
- [ ] Desktop ověřen jen v Xvfb (`scripts/xvfb-tauri.sh`), **nikdy** okno na reálné ploše.
- [ ] Release APK podepsané přes `scripts/sign-apk.sh`. Na telefon instalovat jen, když o to uživatel požádá.
- [ ] `README.md` a `AGENTS.md` aktualizované.
