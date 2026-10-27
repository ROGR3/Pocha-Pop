# AGENTS.md – Pocha Pop 포차팝

Zadání: `DESIGN.md` (etapa 1), `DESIGN-2.md` (etapa 2), `DESIGN-3.md` (etapa 3, multiplayer) a `DESIGN-4.md` (etapa 4, Poslech). Uživatelské info: `README.md`.

## Stack
Tauri 2 (Rust shell, plugin-store, plugin-barcode-scanner jen mobil, co-op relay tokio-tungstenite, TTS plugin v app modulu) + Vite 7 + TypeScript 5.9 + **Phaser 3.90.0** (pinned).
Testy vitest 3. Playwright jen pro screenshoty (`scripts/screenshots.mjs`).

## Struktura
```
src/
  main.ts              boot: fonty, save, integer scaling, resize/visualViewport, window.__pocha (debug)
  logic/               čistá logika, bez Phaseru – VŠE testované
    hangul.ts          rozklad na jamo (keystroke-level), prefix matching, matchAgainst
    difficulty.ts      skóre obtížnosti slova
    srs.ts             mastery 0..5, váhy výběru slov, rng
    rules.ts           mince, kombo, hvězdy, trpělivost, místa u pultu (seatMultiplier, spawnInterval)
    save.ts            SaveData + migrace (v2: refund stool4, v4: tracks), backendy (Tauri store / localStorage / memory), streak, storySeen
    track.ts           stopy Čtení/Poslech (TrackData, accessory), pravidla přehrání, nápověda v Poslechu
    helper.ts          pomocník 김 대리 (kdy zasáhne)
    polite.ts          pozdravy/poděkování jako dočasné cíle (matchPolite), reakce, smlouvání (konstanty)
    cosmetics.ts       Barvírna: stav/koupě barev a čepiček
    czech.ts           shoda barvy s rodem („červená čepice“, akuzativ)
    achievements.ts    27 odznáčků (evaluate; postup se počítá v obou stopách)
    daily.ts           denní výzva (seed z data, jeden zapsaný pokus)
    training.ts        trénink (výběr slov podle SRS váhy)
    coop.ts            pravidlo „doběh“: CoopReferee (první/doběh/pozdě, kombo, týmové hvězdy), škálování
    netproto.ts        co-op protokol: typy zpráv, encode/decode (validace), QR/krátký kód, řazení IP
  data/
    words.json         GENEROVÁNO `npm run words` ze scripts/build-words.ts
    levels.ts          NIGHTS (1–31, bossové 11/116/121/126/131, 약국 201–204, svátky 301–303, denní 900),
                       DISTRICTS (mechanika, backdrop, generici), prevNight/jamoKnown/nightPool, UPGRADES
    story.ts           všechny texty příběhu (česky): štamgasti, bossové, pohlednice, finále
    colors.ts clothes.ts travel.ts pharmacy.ts family.ts reactions.ts   tabulky pro mechaniky čtvrtí
  game/                runtime helpery nad Phaserem
    state.ts           singleton G (save, audio, speech, ime, layout, net), G.track()/G.stat() dle stopy, WORDS, iconTex()
    speech.ts          Poslech: fronta řeči, ducking, TauriTts / WebSpeechTts / MockTts (?tts=mock → __pocha.spoken)
    net.ts             Transport (TauriTransport = Rust, WsTransport = scripts/mp-relay.mjs) + NetSession (lobby, routing)
    coopHost.ts        CoopDirector: hostitelův rozvrh zákazníků, trpělivost, rozhodčí → zprávy všem
    coopui.ts          barvy hráčů, PlayerTag, výběr nocí pro co-op
    orders.ts          stavba objednávek podle mechaniky + věty bossů, alternativní odpovědi (alts)
    hats.ts            čepička sleduje sprite kočky (kotvy hlavy z nabi_head.json)
    achievements.ts    vyhodnocení + toast odznáčků
    ime.ts             skrytý <input>, composition eventy, clear() (blur→value=''→focus + stale guard)
    layout.ts          logická šířka 216–320 px, celočíselné měřítko
    street.ts          scéna ulice: pozadí, stánek, upgrady, déšť/světlušky; DEPTH konstanty
    bubble.ts orders.ts typebox.ts dialogue.ts ui.ts audio.ts debug.ts
  scenes/              Boot Title Setup Story Map Night Result Shop Recipes Settings Paint(Barvírna) Training Badges
                       Coop (menu + čekárna, QR) CoopJoin CoopResult
art/
  lib.lua              kreslicí knihovna (paleta Endesga 32 jako písmena, L.RAMPS pro palette swap)
  chargen.lua          generátor postav (characters.lua, characters2.lua, characters3.lua)
  icons/*.lua          části sheetu ikon (+ clothes.lua = přebarvitelné oblečení); _harness.lua = náhled
  src/*.lua            jeden skript = jeden/několik spritů → public/assets
public/assets/         exportované PNG/JSON (commitované), public/sfx/*.wav, public/fonts/
tests/                 vitest
src-tauri/             Rust + gen/android (commitované; AndroidManifest má adjustResize + portrait, síťová oprávnění)
  src/tts.rs           TTS příkazy tts_status/speak/stop/install_data, event tts://done (Android: TtsPlugin.kt v gen/android/app)
  src/net.rs           co-op relay (host/klient WebSocket, tauri příkazy net_*, eventy net://*) + cargo testy
  capabilities/mobile.json   barcode-scanner jen pro android/iOS
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
| `npm run screenshots` | Playwright screenshoty do `screenshots/` (`ONLY=23,24` = jen některé) |
| `npm run autoplay` | bot dohraje vybrané noci přes UI (`node scripts/autoplay.mjs 12 116`) |
| `npm run autoplay:listen` | totéž v Poslechu s MockTts (`LISTEN=1`): bot píše jen z `__pocha.spoken` |
| `bash scripts/preview-icons.sh <část>` | izolovaný náhled části ikon (nesahá na public/assets) |
| `npx vite-node scripts/economy.ts` | simulace ekonomiky (výsledky v README) |
| `npm run mp-e2e` | co-op E2E: relay + 3 Playwright stránky (`--shots` uloží screenshoty, `NO_BUILD=1`) |
| `npm run mp-relay` | dev relay pro co-op v prohlížeči (port 47200, stránka `?relay=ws://…:47200`) |
| `node scripts/mp-bot.mjs [ip:port]` | bot jako host přes skutečný protokol (Tauri pod Xvfb, telefon přes `adb forward`) |
| `node scripts/tts-phone.mjs` | Poslech na telefonu přes adb: tts_status, fronta, tts://done, ducking – **potichu** (hlasitost 0, bez dotyků; `LOUD=1` nahlas) |
| `cd src-tauri && CARGO_BUILD_JOBS=4 cargo test --lib` | testy Rust relay |
| `node scripts/mp-phone.mjs host\|guest` | co-op na telefonu přes adb (debug APK `cz.rogr.pochapop.debug`, CDP v `scripts/adb-cdp.mjs`) |
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
- Debug v prohlížeči: `__pocha.G` (stav), `__pocha.typeKorean('김치')` emuluje IME vč. mezistavů, `__pocha.levels`.
- Nová čtvrť = řádky v `NIGHTS` + `DISTRICTS`, backdrop `bg_<prefix>_far/_mid/_near/_sky` (+ `BG_PREFIX` ve street.ts,
  `NEW_BG` v Boot.ts), `stall_back_<prefix>`, generici `char_cust_*`, texty ve story.ts, sekce v Map.ts `sections()`.
- Jamo pro noc = keystroke jamo (`jamoSet`) **i** složené / Shift samohlásky (`Night.ready()`): slovo s ㅝ se
  nabídne až po nocí, která ㅝ představila.
- Přebarvitelné věci kreslit rampou `{hi, main, shade, dark}` z `L.RAMPS`, nikdy runtime tint.
- Scény s klávesnicí (Night, Training, Paint, Setup, Coop při psaní jména, CoopJoin) se při změně výšky **nerestartují**, jen přepočítají rozložení.
- Poslech: progres čti/zapisuj jen přes `G.track()` / `G.stat()` / `G.setStat()` (nikdy `G.data.tracks.*` ve scénách);
  sdílené odemykání přes `G.chapter()` / `playedAnywhere()`. Každá Poslech větev v Night je za `if (this.listen)` /
  `bubble.listen`, Čtení se nesmí změnit. Bublina v Poslechu nesmí ukázat slovo (hlídá `autoplay:listen`).
  Příběhové dialogy přes `playStory(scene, key, lines)` (storySeen + Přeskočit). V prohlížeči `?tts=mock`.
- Co-op: Night má režim `coop` (data zprávy `start`); vše o zákaznících jde přes zprávy (`onCoopMsg`), i u hostitele
  (`NetSession.broadcast` doručí i jemu, `toHost` od hostitele nejde po síti). Single player se nesmí změnit –
  každá co-op větev je za `if (this.coop)`, regresi hlídá `npm run autoplay`. Nová zpráva = typ + `CHECK` v netproto.ts + test.

## Testování desktopového okna
**Nikdy neotevírej Tauri okno na uživatelově ploše.** Použij `scripts/xvfb-tauri.sh start` (virtuální
X display :99, `GDK_BACKEND=x11`, scratch `XDG_DATA_HOME`), `shot <png>`, `focus`, `key <keysym>`
(keydown/keyup), `stop`. fcitx5 přes `GTK_IM_MODULE=fcitx` se pod Xvfb chová jinak než nativní Wayland –
po testu vždy `fcitx5-remote -s keyboard-us` (uživatelův výchozí stav). Prohlížečové testy: `npm run screenshots`.
Co-op na desktopu: seed save do `/tmp/pocha-xvfb/xdg/cz.rogr.pochapop/pocha-pop.json` (`{"save": "<json>"}` s `coopName`),
`start`, klik Spolu (32,722) → Založit (225,336), `node scripts/mp-bot.mjs` a klik Otevřít stánek (225,510) při 450×800.
**Během běhu `tauri dev` needituj `src/`** – Vite reloadne stránku a noc spadne.
Telefon (Pixel 8a): instalovat jen se souhlasem uživatele. Ovládání přes adb jde jen u debug buildu
(release WebView nemá DevTools); `adb input tap` počítej z herních objektů (`page.tap('Popisek')` v adb-cdp.mjs),
odhad ze screenshotu minul. První injektovaný dotyk po startu aplikace WebView podrží – nejdřív tapni do prázdného rohu.
USB kabel občas vypadne (adb forward/reverse pak zmizí). Systémové věci (blokace fotoaparátu atd.) neměnit.
`pkill -f` používej jen s ukotveným vzorem (`'^target/debug/...'`), jinak zabije i vlastní shell.

## Zdroje počítače
Na tomhle stroji už jednou spadlo jádro při souběhu `cargo build` (16 vláken) + headless Chromium +
Vite + Aseprite. Těžké úlohy pouštěj **po jedné**, cargo s `CARGO_BUILD_JOBS=4`, po sobě zavírej dev servery.
Po každém Android buildu ukonči Gradle/Kotlin démony (`bash scripts/stop-daemons.sh`; `sign-apk.sh` to dělá sám) –
drží v paměti několik GB a jádro dvakrát spadlo (oops v `kswapd0`) chvíli po buildu APK.
