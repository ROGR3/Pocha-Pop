# AGENTS.md – Pocha Pop 포차팝

Zadání: `DESIGN.md` (závazné). Uživatelské info: `README.md`.

## Stack
Tauri 2 (Rust shell, plugin-store) + Vite 7 + TypeScript 5.9 + **Phaser 3.90.0** (pinned).
Testy vitest 3. Playwright jen pro screenshoty (`scripts/screenshots.mjs`).

## Struktura
```
src/
  main.ts              boot: fonty, save, integer scaling, resize/visualViewport, window.__pocha (debug)
  logic/               čistá logika, bez Phaseru – VŠE testované
    hangul.ts          rozklad na jamo (keystroke-level), prefix matching, matchAgainst
    difficulty.ts      skóre obtížnosti slova
    srs.ts             mastery 0..5, váhy výběru slov, rng
    rules.ts           mince, kombo, hvězdy, trpělivost
    save.ts            SaveData + migrace, backendy (Tauri store / localStorage / memory), streak
  data/
    words.json         GENEROVÁNO `npm run words` ze scripts/build-words.ts
    levels.ts          noci 1–11, upgrady, nightPool()
    story.ts           všechny texty příběhu (česky)
  game/                runtime helpery nad Phaserem
    state.ts           singleton G (save, audio, ime, layout), WORDS, iconIdx()
    ime.ts             skrytý <input>, composition eventy, clear() (blur→value=''→focus + stale guard)
    layout.ts          logická šířka 216–320 px, celočíselné měřítko
    street.ts          scéna ulice: pozadí, stánek, upgrady, déšť/světlušky; DEPTH konstanty
    bubble.ts orders.ts typebox.ts dialogue.ts ui.ts audio.ts debug.ts
  scenes/              Boot Title Setup Story Map Night Result Shop Recipes Settings
art/
  lib.lua              kreslicí knihovna (paleta Endesga 32 jako písmena)
  src/*.lua            jeden skript = jeden/několik spritů → public/assets
public/assets/         exportované PNG/JSON (commitované), public/sfx/*.wav, public/fonts/
tests/                 vitest
src-tauri/             Rust + gen/android (commitované; AndroidManifest má adjustResize + portrait)
```

## Příkazy
| | |
|---|---|
| `npm run dev` | Vite na :1420 |
| `npm run tauri dev` | desktop okno |
| `npm test` | vitest |
| `npm run build` | tsc + vite build |
| `npm run art` / `bash scripts/build-art.sh <name>` | Aseprite batch |
| `npm run words` | regenerace slov |
| `npm run sfx` | regenerace zvuků |
| `npm run screenshots` | Playwright screenshoty do `screenshots/` |
| `ANDROID_HOME=/opt/android-sdk NDK_HOME=/opt/android-sdk/ndk/27.0.12077973 npm run tauri android build -- --apk` | APK |

## Konvence
- UI je **česky**, korejština jen tam, kde ji hráč má psát/číst.
- Pixel art: logické pixely, `pixelArt: true`, `roundPixels`. Text vždy přes `txt()` z `game/ui.ts`
  (Galmuri 7/9/11/14 v nativních velikostech 8/10/12/15 px, `xl` = 24 px).
- **Nikdy nevytvářej Phaser Text s prázdným stringem** – v WebGL se pak občas nevykreslí; `ui.ts` to
  řeší patchem `setText` (prázdný → mezera) a `textW()` vrací 0 pro „prázdný“ text. Po `setText`
  u vycentrovaného textu volej `snapText()`.
- Glyfy chybějící v Galmuri: `✓ ⌨` a emoji – nepoužívat (ikony jsou v `uiicons`).
- Barvy jen z Endesga 32 (`C`/`HEX` v `ui.ts`, písmena v `art/lib.lua`).
- Nová logika patří do `src/logic/` + test. Scény drží jen prezentaci.
- Scény reagují na `game.events 'layout'` (resize, Android klávesnice): Night přepočítá rozložení,
  ostatní scény se restartují.
- Debug v prohlížeči: `__pocha.G` (stav), `__pocha.typeKorean('김치')` emuluje IME vč. mezistavů.

## Testování desktopového okna
**Nikdy neotevírej Tauri okno na uživatelově ploše.** Použij `scripts/xvfb-tauri.sh start` (virtuální
X display :99, `GDK_BACKEND=x11`, scratch `XDG_DATA_HOME`), `shot <png>`, `focus`, `key <keysym>`
(keydown/keyup), `stop`. fcitx5 přes `GTK_IM_MODULE=fcitx` se pod Xvfb chová jinak než nativní Wayland –
po testu vždy `fcitx5-remote -s keyboard-us` (uživatelův výchozí stav). Prohlížečové testy: `npm run screenshots`.
`pkill -f` používej jen s ukotveným vzorem (`'^target/debug/...'`), jinak zabije i vlastní shell.

## Zdroje počítače
Na tomhle stroji už jednou spadlo jádro při souběhu `cargo build` (16 vláken) + headless Chromium +
Vite + Aseprite. Těžké úlohy pouštěj **po jedné**, cargo s `CARGO_BUILD_JOBS=4`, po sobě zavírej dev servery.
