# Pocha Pop 포차팝: Design 4 (Poslech: druhá kampaň „po sluchu“)

Navazuje na `DESIGN.md`, `DESIGN-2.md`, `DESIGN-3.md` (hotové). Tento dokument je **závazné zadání** čtvrté etapy.
Platí vše z předchozích etap (IME, čeština v UI, pixel art v Aseprite, Endesga 32, logika v `src/logic/` + testy,
scény jen prezentace, „feel“ je priorita). **Cíl platformy: Android.** Rozsah = MVP podle tohoto dokumentu.

## 0. Myšlenka

Dnes hráč vidí obrázek + češtinu a píše korejsky (vybavování + pravopis). V režimu **Poslech** zákazník objednávku
**vysloví korejsky** (systémový hlas Androidu) a hráč píše, co slyšel. Bublina ukazuje jen ikonu reproduktoru.

Poslech je **zrcadlo celé kampaně**: přepínačem se přepne celý postup nocí. Ve Poslechu se začíná od noci 1
a všechno se musí projít znovu (hvězdy, odemykání čtvrtí, bossové, 약국, svátky). Přepnutím zpět je hráč tam,
kde byl ve Čtení.

| # | Milník | Kap. |
|---|---|---|
| L1 | Save v4: stopy `read`/`listen`, migrace, logika (`src/logic/track.ts`) + testy | §2 |
| L2 | TTS: vlastní Tauri plugin (Android Kotlin `TextToSpeech`), TS `speech.ts`, mock pro prohlížeč | §3 |
| L3 | Přepínač (Nastavení + mapa), noc v Poslechu (bubliny, přehrání, odhalení po obsloužení) | §1, §4 |
| L4 | Ostatní režimy (trénink, denní výzva, co-op, receptář), art, zvuky, úvodní dialog | §5 |
| L5 | Testy (autoplay v Poslechu, screenshoty, telefon se souhlasem), APK 0.4.0, README/AGENTS | §6 |

Po každém milníku commit na `master`, testy zelené, `master` hratelný. Single player Čtení se nesmí změnit
(regresi hlídá `npm run autoplay`).

---

## 1. Přepínač

- **Nastavení**: řádek „Režim kampaně: Čtení · Poslech“ (segmentové tlačítko, ikony oko / ucho). Pod ním
  „Rychlost hlasu: Normální · Pomalá“ (rate 1,0 / 0,75) a „Hlasitost hlasu“ (posuvník jako SFX).
- **Mapa**: v hlavičce malý štítek s ikonou aktuální stopy (oko/ucho) – kliknutím se otevře Nastavení. Mapa ve
  Poslechu má jemně jiný nádech (např. modřejší obloha nebo noty místo lampionu u nedohraných nocí – rozhodni podle
  toho, co v pixel artu vypadá dobře), aby bylo na první pohled jasné, která stopa běží.
- Přepínač je dostupný od začátku. Pokud zařízení nemá korejský hlas, Poslech je zašedlý s textem
  „Chybí korejský hlas“ a tlačítkem „Stáhnout hlas“ (otevře systémovou instalaci TTS dat).
- Při prvním přepnutí do Poslechu krátký dialog (šéfkuchař): „Dneska se objednává jen nahlas. Poslouchej!“
  + vysvětlení přehrání a nápovědy.

## 2. Postup a save (`src/logic/track.ts`, `save.ts` v4)

- `settings.track: 'read' | 'listen'` (výchozí `read`).
- **Oddělené podle stopy**: záznamy nocí (`nights`), mastery slov (`words`), stav příběhových kapitol štamgastů
  (`friends`), denní výzva (`daily`), trénink (`training`). Ukládat jako `tracks: { read: TrackData, listen: TrackData }`;
  scény dál pracují přes accessor (`G.track()` / `trackData(save)`), aby se kód nocí měnil co nejméně.
- **Společné**: mince, upgrady, Barvírna (kosmetika), odznáčky, statistiky, nastavení, co-op jméno/barva, série dní 🔥.
- Migrace v3 → v4: dosavadní `nights/words/friends/daily/training` → `tracks.read`, `tracks.listen` prázdné. Test.
- Příběhové scény (úvod, pohlednice, finále) se v Poslechu přehrají znovu, ale mají tlačítko „Přeskočit“ pokud
  už byly viděny ve Čtení (`storySeen` společné).
- Nové odznáčky (3): „Dobré ucho“ (první noc v Poslechu), „Bez opakování“ (noc v Poslechu bez jediného přehrání
  navíc), „Slyším Soul“ (boss 11 v Poslechu). Do `achievements.ts` + test.

## 3. Hlas (TTS)

### 3.1 Android plugin (`src-tauri/plugins/tts` nebo `src-tauri/gen/android` + Tauri mobile plugin API)
- Kotlin `TextToSpeech` s `Locale.KOREAN`. Příkazy: `tts_status() -> {available, korean}`,
  `tts_speak(text, rate, volume, id)`, `tts_stop()`, `tts_install_data()` (intent `ACTION_INSTALL_TTS_DATA`).
  Event `tts://done {id}` (UtteranceProgressListener) – hra podle něj ví, kdy hlas dozněl.
- Manifest: `<queries><intent><action android:name="android.intent.action.TTS_SERVICE"/></intent></queries>`
  (bez toho Android 11+ engine nenajde).
- Inicializace při startu aplikace (asynchronní, ~0,5 s), aby první objednávka nečekala.
- Desktop (Rust): `tts_status` vrací `available: false` (Poslech na desktopu zašedlý). Nic dalšího.

### 3.2 TS (`src/game/speech.ts`)
- `speak(text, opts) → Promise<void>` s **frontou**: zákazníci mluví jeden po druhém, nikdy přes sebe; mezi
  promluvami 250 ms. Ambient/hudba se během řeči ztiší (ducking na 40 %).
- Backendy: `TauriTts`, `WebSpeechTts` (prohlížeč, pokud má korejský hlas) a `MockTts` (testy/Playwright: okamžitě
  „dozní“ po `120 ms × počet slabik`, zapisuje do `__pocha.spoken[]`). Volba: Tauri → plugin, jinak `?tts=mock`
  nebo WebSpeech.

## 4. Noc v Poslechu

- Zákazník si sedne → řekne objednávku (u kombinovaných objednávek celou frázi, u bossů celou větu). Bublina
  ukazuje ikonu reproduktoru (animace „vlnky“, dokud mluví) a pruh trpělivosti; **žádná ikona jídla ani čeština**.
- **Trpělivost** začíná ubývat až po doznění první promluvy.
- **Přehrát znovu**: ťuknutím na bublinu (nebo na ikonu ucha u typeboxu, když je jen jedna čekající). První
  opakování zdarma, každé další = objednávka přijde o spropitné (stejně jako nápověda). Rychlost opakování:
  2. a další opakování automaticky pomalu (0,75).
- **Nápověda** (stávající) funguje stejně: odhalí jamo, objednávka bez spropitného.
- **Po obsloužení** se v bublině na 1,5 s ukáže ikona + korejština + čeština (zpětná vazba k učení), pak praskne.
- Chyba při psaní jako dnes. Po chybě se objednávka sama jednou zopakuje (pomalu).
- Kočka 나비 v Poslechu nemluví: řekne „야옹“ a ukáže obrázek jako dnes (výjimka, zůstává čtecí).
- Pozdravy (ruka/dveře) beze změny. Reakce po jídle: zákazník řekne přídavné jméno korejsky (místo české bubliny),
  hráč ho opíše – i tohle je poslech. Smlouvání v 용산: obchodník cenu/„할인?“ vysloví.
- Hint level (`hintLevel`) podle mastery **ze stopy Poslech**, takže začátečník v Poslechu dostane u nových slov
  víc pomoci, i když je ve Čtení umí.

## 5. Ostatní režimy

- **Trénink** a **denní výzva**: podle aktuální stopy (bubliny po sluchu, mastery z dané stopy).
- **Co-op**: hostitel volí stopu v čekárně (výchozí jeho aktuální), posílá se ve zprávě `start` (`track`).
  Každý telefon mluví lokálně. Host bez korejského hlasu → v čekárně varování a hra pro něj běží ve Čtení
  (bubliny s obrázky), aby nebyl vyřazený. Rozšířit `netproto.ts` (+ test) – kompatibilně (`PROTO` zvýšit na 2).
- **Receptář**: u slova dvě hvězdičkové řady (oko / ucho) a tlačítko „Přehrát“.
- **Art** (`art/src/listen.lua`): ikona reproduktoru s 3 fázemi vlnek, ikony oko/ucho 8×8 a 12×12, štítek
  stopy na mapu, případně varianta lampionu/noty. Zvuk `sfx/replay.wav` (krátké „ťuk“ před opakováním).

## 6. Testování (povinné)

1. **vitest**: migrace v4 (vč. v1→v4), `track.ts` (oddělení stop, společné mince/upgrady), pravidla přehrání
   (zdarma / bez spropitného), nové odznáčky, netproto v2.
2. **Autoplay**: `npm run autoplay` (Čtení) beze změny + nový `LISTEN=1` běh s `MockTts`: bot čte text
   z `__pocha.spoken` (ne z bubliny) a dohraje noc 1, 2, 11 a jednu z 동대문. Ověřit, že bublina v Poslechu
   neobsahuje text objednávky.
3. **Screenshoty**: Nastavení s přepínačem, mapa v Poslechu, bublina s reproduktorem, odhalení po obsloužení,
   receptář s oběma řadami.
4. **Telefon (Pixel 8a)**: instalovat **jen se souhlasem uživatele** (debug build + `scripts/adb-cdp.mjs` jako
   v co-opu): ověřit `tts_status` (korejský hlas), že se opravdu mluví (logcat / `tts://done`), frontu a ducking.
5. Co-op e2e (`npm run mp-e2e`) musí dál projít; přidat variantu se stopou Poslech (mock TTS).

Těžké úlohy po jedné. Na konci podepsané APK 0.4.0 přes `scripts/sign-apk.sh`, README (sekce „Poslech“) a AGENTS.
