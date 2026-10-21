# Pocha Pop 포차팝

Pixel-art hra na učení psaní korejsky (두벌식) na **systémové** korejské klávesnici.
Babička 할머니 ti předala noční stánek 포장마차 v Soulu – zákazníci objednávají v bublinách,
ty objednávku napíšeš korejsky a tím je obsloužíš. Linux desktop + Android.

Vertical slice: 2 čtvrti (을지로 noci 1–5, 한강 noci 6–10) + finále s kritikem 미식가 (noc 11),
54 slov (50 jídel z Recallo balíčku + 4 slova pro věty kritika), štamgasti 김 대리, 하은 a kočka 나비.

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
bash scripts/sign-apk.sh        # build arm64 + podpis lokálním klíčem → release/pocha-pop-0.1.0-arm64.apk (~13 MB)
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
- Kombo za sérii bez chyby, spropitné za rychlost, 1–3 hvězdy za noc (kritik 1–5).
- Mince → obchod: lampiony, plachta, rádio (procedurální lo-fi), 4. stolička, menu balíčky slov.
- Receptář (všechna slova, siluety neznámých, rozklad na klávesy), denní série 🔥, pohledy od babičky.

## Přidání slov

1. Uprav `scripts/build-words.ts` (mapa `FOOD` = ko → [česky, ikona, id]; `PHRASE` pro věty kritika).
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
  automatický obrys, dither, malé hangul glyfy pro neony.
- Aseprite cesta se bere z `ASEPRITE_PATH` nebo `tools/aseprite-mcp/.env`.
- MCP server `aseprite` (`.mcp.json`, `tools/aseprite-mcp`) jde použít pro interaktivní kreslení a `export_frame`.

## Zvuk

`npm run sfx` vygeneruje SFX (`scripts/gen-sfx.mjs`, sfxr-style syntéza) do `public/sfx/*.wav`.
Déšť / řeka a lo-fi smyčka rádia jsou procedurální WebAudio (`src/game/audio.ts`).

## Screenshoty

`npm run screenshots` – build + `vite preview` + Playwright, všechny obrazovky v rozlišení
mobil 412×915 (@2.625) a desktop 450×800 do `screenshots/`.

## Licence a zdroje

Písmo [Galmuri](https://github.com/quiple/galmuri) (SIL OFL, `public/fonts/OFL-Galmuri.md`).
Slova z vlastního Anki balíčku (Recallo), přeložená do češtiny.
