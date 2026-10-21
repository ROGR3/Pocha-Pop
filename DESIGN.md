# Pocha Pop 포차팝

Pixel-art hra na učení psaní korejsky (두벌식) na **systémové** korejské klávesnici.
Inspirace: Hangul Pop (slova po levelech + význam + odemykání). Cíl: hra, u které člověk vydrží.
Platformy: **Linux desktop + Android** (iOS ne).

Tento dokument je zadání pro agenta, který vertical slice postaví v jednom zátahu.

---

## 1. Příběh

Babička 할머니 odchází na odpočinek na Jeju a předává ti svůj noční pouliční stánek 포장마차
v uličce 을지로 v Soulu. Ulička má jít k zemi kvůli přestavbě (재개발). Šanci máš jedinou:
stánek se musí proslavit. Ulice se rozhodne podle recenze slavného kritika 미식가 (gurmán).

- Každá **noc** = jeden level. Zákazníci si objednávají v bublinách, ty objednávku **napíšeš**, a tím je obsloužíš.
- Na konci noci přijde **pohlednice od babičky** (česky, krátce, vřele). Je to tutorial hlas: představí nové jamo,
  připomene chyby a hodí tip k vaření.
- **Štamgasti** mají malé příběhy, které se odvíjejí podle přátelství (počet obsloužení bez chyby).

### Štamgasti (vertical slice)
| Postava | Kdo | Mechanika | Mini-příběh (3 kapitoly) |
|---|---|---|---|
| 김 대리 | unavený kancelářák | normální objednávky, chodí pozdě v noci | nesnáší práci → přizná, že chce vařit → na konci slice dá výpověď a ptá se, jestli může pomáhat |
| 하은 | studentka před 수능 | objednává sladkosti/snacky, spěchá (kratší trpělivost) | stres z přijímaček → učí se u stánku → přinese výsledky |
| 나비 | toulavá kočka | **objednávka jen obrázkem**, bez češtiny i korejštiny (čisté vybavení) | přichází hubená → přibírá → přivede koťata (kosmetika u stánku) |

Boss: **미식가** – objednává **celými větami** (`김치찌개 하나 주세요`), trpělivost delší, ale chyba = mínus hvězda.
Jeho noc je finále slice: výsledek recenze (1–5 hvězd) + cliffhanger („ulička zatím zůstává… ale developer se nevzdává“).

## 2. Struktura vertical slice

- **Čtvrť 1 – 을지로 (noci 1–5):** neon, déšť, úzká ulička. Jídlo: 만두, 라면, 김밥, 떡볶이, 우유, 차, 물…
- **Čtvrť 2 – 한강 (noci 6–10):** piknik u řeky, mosty se světly. Ovoce, pití, 치킨, 라면, 빙수, 버블티…
- **Noc 11 – 미식가 (boss).**
- Každá noc ~90–120 s, max 3 místa u pultu (4. stolička jako upgrade).

## 3. Herní smyčka noci

1. Zákazník přijde (animace chůze), sedne, nad ním bublina: **obrázek jídla + český význam** + (podle mastery) korejština.
2. Pod ním **trpělivost** (ubývající bar, tvář se mění 😊→😐→😠).
3. Hráč píše. Text se **průběžně porovnává se všemi čekajícími objednávkami** (prefix po rozložení na jamo).
   Odpovídající bubliny se zvýrazní, ostatní ztmavnou. Při neshodě: zatřesení, červený záblesk, chyba se započítá.
4. Shoda celého slova → kuchař (hráč) uvaří (krátká animace, pára), jídlo sjede po pultu, **bublina praskne**
   (pop + částice), mince vyletí, zákazník jí a odejde spokojený.
5. Rychlost → spropitné. Série bez chyby → **kombo** (×2, ×3…, efekt na lampionech).
6. Trpělivost vyprší → zákazník odejde naštvaný, ztráta reputace.
7. Konec noci: hvězdy (1–3), mince, nová slova do receptáře, pohlednice od babičky.

### Nápověda podle mastery slova (učení jako Hangul Pop)
- **Mastery 0 (nové):** korejština v bublině vidět celá (opisuješ).
- **Mastery 1:** korejština poloprůhledná / zobrazí se jen první slabika.
- **Mastery 2+:** jen obrázek + čeština (vybavuješ si).
- Správně bez chyby → mastery +1, chyba → −1. Slova s chybami se v dalších nocích objevují častěji (jednoduché SRS).
- Klávesa **Tab / tlačítko „?“** = ukáže korejštinu (stojí spropitné, mastery se nezvyšuje).

### Obtížnost slov
Seřadit podle: počet slabik, batchim (koncová souhláska), zdvojené souhlásky (ㄲㄸㅃㅆㅉ = Shift),
složené samohlásky (ㅘㅝㅢ…). Noc 1 = jen nejjednodušší (우유, 차, 물, 두부, 만두…). Každá noc
představí 2–4 nová jamo a přednostně dává slova s nimi (babička je představí na pohlednici).

## 4. Meta-progrese
- **Mince → upgrady stánku** (vidět ve scéně): lampiony (+trpělivost), plachta proti dešti, 4. stolička,
  rádio (zapne hudbu/ambient), nové položky na menu = nové balíčky slov.
- **Babiččin receptář:** sbírka všech slov – obrázek, korejsky, česky, hvězdy mastery. Neodemčená = siluety.
- **Denní série 🔥** (počítá noci odehrané v různých dnech).
- Mapa uličky / čtvrtí jako výběr nocí (zamčené noci, hvězdy u každé).

## 5. Obrazovky
1. **Titul** – animovaný stánek v dešti, lampiony blikají, název `Pocha Pop 포차팝`, „Otevřít stánek“.
2. **Mapa** – noci jako lampiony na šňůře přes uličku/řeku, hvězdy, zámky, boss.
3. **Noc** (hra).
4. **Výsledek noci** + pohlednice od babičky.
5. **Obchod** (upgrady).
6. **Receptář.**
7. **Nastavení** – hlasitost, rychlost (lehčí trpělivost), reset postupu, návod k nastavení korejské klávesnice.
8. **První spuštění** – krátký návod: Android = přidat korejštinu do Gboard / Samsung klávesnice (두벌식 / Standard);
   Linux = fcitx5-hangul (u uživatele už nainstalováno). Testovací pole „napiš 안녕“.

Celé UI **česky**.

## 6. Technologie

- **Tauri 2 + Vite + TypeScript + Phaser 3** (pinnout přesnou verzi). Android target přes `tauri android`.
- Perzistence: `@tauri-apps/plugin-store` (fallback localStorage v prohlížeči kvůli dev/Playwright).
- Testy: **vitest** pro logiku (jamo rozklad, matching, obtížnost, SRS, ukládání).
- Phaser: `pixelArt: true`, `roundPixels`, celočíselné škálování. Logická šířka ~270 px, výška se přizpůsobí viewportu.
- Na výšku (portrait). Desktop okno ~450×800, resizable.

### Vstup – systémová klávesnice (KRITICKÉ)
- **Žádná vlastní klávesnice.** Skrytý (ale fokusovatelný, ne `display:none`) `<input>` nad canvasem,
  trvale fokusovaný (refocus při tapu/kliknutí kamkoliv). Atributy: `lang="ko"`, `autocomplete="off"`,
  `autocorrect="off"`, `autocapitalize="off"`, `spellcheck="false"`, `inputmode="text"`.
- Číst `input.value` při každém `input` / `compositionupdate` / `compositionend` – value obsahuje i rozepsanou slabiku.
  Tu zobrazovat živě (animace skládání: ㅎ → 하 → 한, nová slabika „cvakne“).
- Porovnávat po rozkladu na jamo (unicode aritmetika 0xAC00, rozložit i složené ㅘ→ㅗㅏ, ㄳ→ㄱㅅ).
  Pozor: `한` při psaní `하나` je dočasně validní prefix (ㅎㅏㄴ je prefix ㅎㅏㄴㅏ) → rozklad to řeší.
- Po dokončení slova vyčistit input **včetně ukončení IME kompozice** (na Androidu typicky blur → value='' → focus,
  jinak IME vloží zbytek slabiky zpět). Ověřit.
- Android: klávesnice zabírá spodek obrazovky → poslouchat `visualViewport` resize a scénu (stánek + bubliny)
  vykreslovat do viditelné části nad klávesnicí; HUD nahoře. V `AndroidManifest` `adjustResize`.
- Linux: vyžaduje běžící fcitx5 s hangul (uživatel má). Pokud WebKitGTK nedostává composition eventy,
  zdokumentovat a vyřešit (env `GTK_IM_MODULE=fcitx`).

### Data slov
- Zdroj: `/home/rogr/Projects/Recallo/anki_korean.txt` (TSV: ko, en, kategorie; 50× Food, 281× Noun…).
- Vytvořit `src/data/words.json`: `{ id, ko, cs, category, icon, difficulty }` – **přeložit do češtiny**
  (bez zbytečných synonym), `difficulty` spočítat skriptem.
- Slice: všechna Food slova (~50) + slova potřebná pro dialogy štamgastů a věty kritika.
- Každé slovo v objednávkách **musí mít ikonu**.

### Zvuk
- SFX generované offline (jsfxr/sfxr parametry → `.wav`): psaní jamo, slabika cvakne, chyba, pop bubliny,
  mince, kombo, zákazník odchází naštvaný, hvězdy na konci.
- Ambient déšť / město přes WebAudio (šum + filtr). Hudba mimo scope (rádio upgrade zatím jen zapne ambient lo-fi smyčku,
  pokud ji jde jednoduše vytvořit procedurálně; jinak vynechat).

## 7. Pixel art

- Nástroj: **[diivi/aseprite-mcp](https://github.com/diivi/aseprite-mcp)** – **už nainstalováno a otestováno** v `tools/aseprite-mcp/` (116 nástrojů),
  `.env` s `ASEPRITE_PATH` hotový, registrováno v `.mcp.json` jako server `aseprite`. Smyčka: kresli → `export_frame` scale 8–10 → podívej se → iteruj.
- Agent kreslí **sám** přes MCP (žádné AI image generátory). Zdrojové `.aseprite` v `art/`, export spritesheetů + JSON do `public/assets/`.
- Jednotná paleta: **Endesga 32** (noc = fialovo-modré stíny, teplé oranžové lampiony). Obrys tmavý, ne čistá černá.
- Font: **Galmuri** (OFL, korejský pixel font) – ověřit české diakritiky (ěščřžýáíéůú); když chybí, Latin z jiného
  OFL pixel fontu.
- **Kvalita je priorita.** Po každém spritu vyexportovat PNG ve zvětšení, podívat se na něj a iterovat.
  Použít `audit_animation` / `compare_frames` z MCP.

### Seznam assetů (slice)
| Asset | Velikost | Animace |
|---|---|---|
| Stánek (pult, plachta, menu tabule) + upgrady jako vrstvy | ~200×120 | pára z hrnce 6f, lampiony blikání 4f |
| Kuchař (hráč) | 32×40 | idle 4f, vaří 6f, podává 4f, radost 4f |
| Pozadí 을지로 (2–3 parallax vrstvy) | šířka scény | neon bliká, déšť (částice), louže odlesk |
| Pozadí 한강 | šířka scény | světla mostu, voda 4f |
| 김 대리, 하은, 미식가 | 32×40 | chůze 4f, idle 2f, šťastný, naštvaný, jí |
| 나비 (kočka) + koťata | 24×16 | chůze, ocas 4f, jí |
| 3–4 generičtí zákazníci (barevné varianty) | 32×40 | jako výše |
| Ikony slov | 24×24 | – |
| UI: bublina (9-slice), trpělivost bar, mince, hvězda, lampion-node mapy, tlačítka, pohlednice | – | mince rotace 6f, hvězda „ding“ |
| Logo / app ikona (Android adaptive) | 512 / 108dp | – |
| Částice: pop bubliny, jiskry komba, pára, kapky | 4–8 px | – |

## 8. Hotovo = (akceptační kritéria)
- [ ] `npm run tauri dev` běží na Linuxu; psaní přes fcitx5-hangul funguje včetně živé kompozice.
- [ ] `npm run tauri android build` vyrobí APK (Android SDK je v `/opt/android-sdk`). **Neinstalovat na zařízení**, to udělá uživatel.
- [ ] Všechny obrazovky z §5, noci 1–11 hratelné, postup se ukládá.
- [ ] Všechny assety z §7 nakreslené a animované, žádné placeholdery.
- [ ] vitest testy pro jamo rozklad, prefix matching (vč. 하나/한 případu, složené samohlásky, Shift souhlásky),
      obtížnost, SRS, ukládání – zelené.
- [ ] Ověření vzhledu: Playwright screenshoty (Vite dev v prohlížeči, mobil 412×915 a desktop 450×800) každé obrazovky
      uložené v `screenshots/` a zkontrolované agentem.
- [ ] `README.md`: jak spustit, buildit, jak nastavit klávesnici, jak přidat slova / kreslit assety.
- [ ] `AGENTS.md` pro budoucí práci (struktura, příkazy, konvence).

## 9. Mimo scope (later)
Další čtvrti (부산 přístav, 홍대…), hudba, výslovnost (TTS), věty mimo bosse, iOS, online cokoliv.
