# Pocha Pop 포차팝

Pixel-art hra na učení psaní korejsky (두벌식) na **systémové** korejské klávesnici.
Babička 할머니 ti předala noční stánek 포장마차 v Soulu – zákazníci objednávají v bublinách,
ty objednávku napíšeš korejsky a tím je obsloužíš. Linux desktop + Android.

Obsah (etapa 1 + 2, zadání `DESIGN.md` a `DESIGN-2.md`):

| Čtvrť | Noci | Herní prvek | Štamgast · boss |
|---|---|---|---|
| 을지로 | 1–5 | jídlo | 김 대리, 하은, kočka 나비 |
| 한강 | 6–10 + 11 | jídlo, pozdravy | kritik 미식가 (věty) |
| 동대문 trh | 12–16 + 116 | barva + věc („빨간색 모자“), reakce přídavnými jmény | 이모 · módní blogerka |
| 홍대 | 17–21 + 121 | přejatá slova (bublina ukáže originál) | 민수 · manažer K-popové skupiny |
| 용산 | 22–26 + 126 | smlouvání 할인 / 싸다, dlouhá slova | 박 사장 · obchodník |
| 부산 přístav | 27–31 + 131 | cíl → doprava (+ 표) | 강 이사 · kapitán (finále) |
| 약국 (vedlejší) | L1–L4 | část těla na obrázku, příznak → lék | lékárnice 약사 |
| svátky | 추석, 크리스마스, 생일 | „pro koho“, sníh, koťata | babička na návštěvě |

198 slov (Recallo balíček + 12 ručně doplněných: 11 barev a 얘기 kvůli ㅒ), všechna jamo včetně ㅆ ㅑ ㅒ ㅖ ㅚ ㅝ ㅢ ㅙ ㅞ.
Navíc: volba počtu míst před nocí (2 · 3 · 4), pomocník 김 대리, pozdravy a poděkování, Barvírna (barvy stánku
a čepičky pro 나비), trénink, denní výzva a 24 odznáčků.

## Spuštění

```bash
npm install            # projektový .npmrc míří na registry.npmjs.org
npm run dev            # jen prohlížeč: http://localhost:1420
npm run tauri dev      # Linux desktop okno (Tauri 2, WebKitGTK)
npm test               # vitest – logika (jamo, matching, obtížnost, SRS, ukládání)
```

### Build

```bash
npm run tauri build                      # Linux: .deb + AppImage v src-tauri/target/release/bundle/
export ANDROID_HOME=/opt/android-sdk NDK_HOME=/opt/android-sdk/ndk/27.0.12077973
npm run tauri android build -- --apk     # APK v src-tauri/gen/android/app/build/outputs/apk/
npm run tauri android build -- --apk --debug   # debug-podepsané APK, dá se rovnou nainstalovat
```

Release APK z `tauri android build` je **nepodepsané**. Instalovatelné APK:

```bash
bash scripts/sign-apk.sh        # build arm64 + podpis lokálním klíčem → release/pocha-pop-0.2.0-arm64.apk (~13 MB)
```

Klíč (`signing/`, heslo v `signing/key.properties`) se vytvoří při prvním běhu a je v `.gitignore`.
Debug APK (`--debug`) je podepsané automaticky, ale má ~130 MB kvůli ladicím symbolům.

## Nastavení korejské klávesnice

Hra nemá vlastní klávesnici – čte skrytý `<input>` a IME kompozici (`compositionupdate`), takže rozepsanou
slabiku vidíš živě (ㅎ → 하 → 한). První spuštění má návod a testovací pole „napiš 안녕“
(znovu: Nastavení → Návod: korejská klávesnice).

**Linux (fcitx5):**
1. `fcitx5`, `fcitx5-hangul`, `fcitx5-gtk` (na Omarchy už je).
2. `fcitx5-configtool` → přidat vstupní metodu **Hangul**.
3. Přepínání Ctrl+Mezerník (nebo klávesa 한/영).
4. Na Waylandu (Hyprland/Omarchy) to funguje **bez dalšího nastavení** – ověřeno s fcitx5-hangul
   v okně Tauri: živá kompozice (안 → 안녀 → 안녕) i dokončení slova.
5. Na X11 by šlo zkusit `GTK_IM_MODULE=fcitx npm run tauri dev`. Pozor: v testu pod Xvfb se syntetickými
   klávesami (xdotool) se rozepsaná slabika (preedit) do WebKitu nedostala – na skutečném X11 neověřeno.

Testy desktopového okna bez otevírání okna na reálné ploše: `scripts/xvfb-tauri.sh start|shot|focus|key|type|stop`
(izolovaný virtuální X display, vlastní `XDG_DATA_HOME`, takže nesahá na skutečný save).

**Android:**
- Gboard: Nastavení → Jazyky → Přidat klávesnici → Korejština → „2 sady“ (두벌식).
- Samsung klávesnice: Jazyky a typy → 한국어 → Standard.
- Přepínání klávesou se zeměkoulí / tažením mezerníku.
- Aktivita má `adjustResize` a hra se vykresluje do `visualViewport`, takže stánek s bublinami zůstává nad klávesnicí.

## Jak hra funguje

- Text se po rozkladu na jamo průběžně porovnává se všemi čekajícími objednávkami (`src/logic/hangul.ts`).
  Složené samohlásky (ㅘ → ㅗㅏ) a koncové shluky (ㄳ → ㄱㅅ) se rozkládají na klávesy, proto je `한`
  platný mezistav slova `하나`. Mezery se ignorují.
- Mastery slova: 0 = korejština celá v bublině, 1 = jen první slabika, 2+ = jen obrázek + čeština.
  Správně bez chyby +1, chyba −1, slova s chybami chodí častěji (`src/logic/srs.ts`).
- Tab / tlačítko „?“ ukáže korejštinu (bez spropitného, mastery neroste).
- Kombo za sérii bez chyby, spropitné za rychlost, 1–3 hvězdy za noc (bossové 1–5: každá chyba i chybějící
  pozdrav −1 hvězda).
- **Místa u pultu** se volí v popupu noci: 2 (klidná, mince ×1,0), 3 (×1,3), 4 (nával ×1,7, po první noci se 3★).
  Víc míst = víc souběžných objednávek a rychlejší příchody (`spawn × 3/míst`). Bossové mají vždy 3.
- **Pozdravy:** když si host sedne, ukáže se ruka (napiš 안녕하세요 / 환영해요 / 반가워요 → +15 % trpělivosti, +1 mince),
  když odchází, dveře (감사합니다 / 또 오세요 / 또 봐요 / 잘 가요 → +2). Pozdravy jsou dočasné cíle v matchingu;
  když prefix sedí na objednávku i pozdrav, vyhrává objednávka.
- **Reakce** (od 동대문): po jídle host řekne česky „Pálivé!“ → napiš 맵다 (5 s, +2 mince).
- Mince → obchod: lampiony, plachta, rádio (2. stanice po opravě u 박 사장), pomocník 김 대리, menu balíčky;
  **Barvírna** (z obchodu): plachta, cedule, stoličky a lampiony v 11 barvách (barvu „objednáš“ napsáním jejího
  korejského názvu), čepičky pro 나비.
- **Trénink** (mapa): 60 s bublin se slovy s nejvyšší SRS vahou, bez mincí. Tady se dají potkat i barvy.
- **Denní výzva** (nahoře na mapě): stejná noc pro celý den (seed z data), zapisuje se první pokus.
- **Odznáčky** (mapa → Odznaky): 24 úspěchů, získané jsou připnuté na plachtě stánku.
- Receptář po kategoriích (siluety neznámých, rozklad na klávesy), denní série 🔥, pohledy od babičky.

## Přidání slov

1. Uprav `scripts/build-words.ts`: `FOOD` (jídla), `MORE` (ko → [česky, ikona, id, kategorie]), `MORE_BY_ID`
   (homonyma jako 배 břicho/loď), `EXTRA` (slova mimo balíček – vždy s komentářem proč), `LOAN_ORIGINAL`.
2. `npm run words` → přegeneruje `src/data/words.json` (obtížnost se počítá skriptem).
3. Nakresli ikonu (viz níže) se stejným jménem a přidej slovo do noci v `src/data/levels.ts`.
4. `npm test` – test ohlídá ikony, existenci slov i to, že noc používá jen už představená jamo.

## Kreslení assetů

Všechno je kreslené v Aseprite skripty (Lua) – žádné generátory, žádné placeholdery.

```bash
npm run art                          # přestaví všechno: art/src/*.lua → art/*.aseprite + public/assets/*.png/.json
bash scripts/build-art.sh icons      # jen jeden skript
bash scripts/preview.sh icons 8      # zvětšený náhled PNG do /tmp
bash scripts/make-icons.sh           # app ikony (desktop + Android) z public/assets/appicon.png
```

- `art/lib.lua` – paleta **Endesga 32** (písmena a–z, A–F), ASCII pixel mapy, elipsy se stínováním,
  automatický obrys, dither, malé hangul glyfy pro neony, barevné rampy `L.RAMPS` (palette swap pro Barvírnu
  a oblečení).
- `art/chargen.lua` – generátor postav 32×40 (sdílí `characters*.lua`), `art/icons/*.lua` – části sheetu ikon
  (`bash scripts/preview-icons.sh <část>` = izolovaný náhled bez zápisu do `public/assets`).
- Oblečení je ve vlastním sheetu `clothes` (12 snímků na věc: neutrální šedá + 11 barev), ikony v bublinách
  se odkazují jako `cl:<věc>:<barva>`.
- Aseprite cesta se bere z `ASEPRITE_PATH` nebo `tools/aseprite-mcp/.env`.
- MCP server `aseprite` (`.mcp.json`, `tools/aseprite-mcp`) jde použít pro interaktivní kreslení a `export_frame`.

## Ekonomika

`npx vite-node scripts/economy.ts` simuluje tři typy hráčů (všechny noci jednou, v pořadí odemykání):

| Hráč | po 미식가 (11) | po 용산 (126) | po 부산 (131) | má na všechno* |
|---|---|---|---|---|
| pomalejší (2★, 2 místa) | 832 | 2 840 | 3 370 | po vedlejší lince / opakováních |
| normální (2–3★, 3 místa) | 1 409 | 4 445 | 5 287 | po noci 126 (konec 용산) |
| zkušený (3★, 4 místa) | 3 686 | 10 842 | 13 061 | už v 동대문 |

\* všechno = upgrady a menu balíčky (1 350) + čepičky (220) + každá barva na každé části stánku (2 860) = 4 430.
Normální hráč má tedy na všechno zhruba na začátku 부산, pomalejší až s opakováním nocí.

## Zvuk

`npm run sfx` vygeneruje SFX (`scripts/gen-sfx.mjs`, sfxr-style syntéza) do `public/sfx/*.wav`.
Déšť / řeka a lo-fi smyčka rádia jsou procedurální WebAudio (`src/game/audio.ts`).

## Screenshoty

`npm run screenshots` – build + `vite preview` + Playwright, všechny obrazovky v rozlišení
mobil 412×915 (@2.625) a desktop 450×800 do `screenshots/`. Jen část: `ONLY=23,24 npm run screenshots`
(prefixy názvů). `npm run autoplay` – bot dohraje první noc a bosse každé čtvrti, 약국, svátky a denní výzvu
přes skutečné UI (emulace IME), `node scripts/autoplay.mjs 12 116` jen vybrané noci.

## Licence a zdroje

Písmo [Galmuri](https://github.com/quiple/galmuri) (SIL OFL, `public/fonts/OFL-Galmuri.md`).
Slova z vlastního Anki balíčku (Recallo), přeložená do češtiny.
