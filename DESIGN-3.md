# Pocha Pop 포차팝: Design 3 (společný stánek: lokální multiplayer)

Navazuje na `DESIGN.md` a `DESIGN-2.md` (hotové). Tento dokument je **závazné zadání** třetí etapy.
Platí vše z předchozích etap: systémová klávesnice (IME), čeština v UI, pixel art v Aseprite (`art/src/*.lua`,
Endesga 32), nová logika v `src/logic/` + testy, scény jen prezentace, „feel“ je priorita.

**Cíl platformy: Android** (99 % hraní). Desktop musí jít přeložit a fungovat jako hostitel i host pro testy,
ale neladí se na něj (UFW apod. jen zmínka v README).

Rozsah = MVP: kooperativní noc pro 2–3 hráče přes lokální síť / hotspot s pravidlem **„doběh“**.
Žádný internetový server, žádné účty, žádný režim „souboj“ ani „kuchař/číšník“.

---

## 0. Milníky (po každém commit + testy, `master` vždy hratelný)

| # | Milník | Kap. |
|---|---|---|
| MP1 | Čistá logika kooperace + protokol (`src/logic/coop.ts`, `src/logic/netproto.ts`) + testy | §2, §3 |
| MP2 | Síťová vrstva: Rust relay (Tauri příkazy/eventy) + TS `Transport` + dev relay pro prohlížeč | §4 |
| MP3 | Lobby: Založit stánek / Připojit se (QR, krátký kód, IP), čekárna, volba noci | §5 |
| MP4 | Kooperativní noc ve scéně Night (hostitel = rozhodčí), doběh, výsledková tabulka | §2, §6 |
| MP5 | E2E testy (3 prohlížeče), Tauri desktop pod Xvfb + bot, telefon přes `adb forward/reverse`, APK, README/AGENTS | §7 |

---

## 1. Jak se to hraje

- Jeden hráč zvolí **„Spolu“ → „Založit stánek“** (na titulní obrazovce nové tlačítko). Jeho telefon je hostitel
  (typicky zároveň zapne hotspot, ostatní se k němu připojí; nebo jsou všichni na stejné Wi-Fi).
- Ostatní zvolí **„Spolu“ → „Připojit se“** a naskenují QR kód z hostitelova displeje (nebo napíšou krátký kód).
- V čekárně každý vidí jména a barvy hráčů (max. 3 včetně hostitele). Hostitel vybere noc a dá „Otevřít stánek“.
- Všichni vidí stejnou ulici, stejné zákazníky a stejné objednávky. **Odbavují všichni**, každý píše na svém telefonu.

---

## 2. Pravidlo „doběh“ (kdo dřív, ten víc)

1. Kdo dopíše objednávku **první**, dostane plné mince (`serveCoins` jako v single playeru, s vlastním komboem).
   Zákazník je obsloužen, jídlo se začne vařit (animace jako dnes).
2. Bublina u ostatních **nezmizí**: obarví se barvou prvního hráče (rámeček + jeho iniciála) a pod ní běží
   **pruh doběhu 3 s** (`RUNOFF_MS = 3000`).
3. Kdo objednávku dopíše během doběhu, dostane **polovinu** mincí (zaokrouhleno nahoru, bez spropitného) a slovo se mu
   počítá do mastery normálně. Kdo nestihne, nedostane nic, **ale ani chybu**.
4. Po doběhu bublina zmizí všem, zákazník jí a odchází spokojený (jídlo se vydává jednou, ne za každého hráče).
5. Překlep v doběhu nestojí nic do týmového skóre, jen přeruší osobní kombo. Překlep na otevřené objednávce se počítá
   jako dnes (osobní kombo, mastery, a do týmové statistiky chyb).
6. Kombo je osobní. Doběhové obsloužení kombo **neruší, ale ani nezvyšuje**.
7. Hvězdy jsou **společné**: `nightStars` s `mistakes = round(součet chyb / počet hráčů)`.
8. Zákazník, kterému dojde trpělivost, odejde všem (rozhoduje hostitel).

Rozhodčí je hostitel: pořadí „kdo první“ určuje pořadí, v jakém zprávy dorazí k hostiteli (na LAN jednotky ms).
Hostitel sám hraje stejnou cestou (lokální „zpráva“ bez sítě), nemá žádnou výhodu kromě latence ~0.

### 2.1 Škálování podle počtu hráčů
- Míst u pultu: 2 hráči → 4, 3 hráči → 4 (volba 2/3/4 se v MP nezobrazuje).
- Zákazníků za noc: `round(def.customers × (1 + 0,35 × (hráčů − 1)))`.
- Tempo příchodů: `spawnInterval(def.spawn, 4)`. Trpělivost jako v single playeru (bez `relaxed` – to je osobní
  nastavení, v MP platí hostitelovo).
- Násobič mincí za místa se v MP neuplatňuje (×1,3 pro všechny, ať je to férové).
- Všechno v `src/logic/coop.ts` jako čisté funkce + test.

### 2.2 Co v MP **není** (MVP)
Pozdravy, reakce, smlouvání, pomocník 김 대리, štamgasti s příběhem, bossové, 약국, svátky, denní výzva,
pauza. Zákazníci jsou generici dané čtvrti, objednávky podle mechaniky čtvrti (barva+oblečení, loanwordy,
destinace… fungují, protože se posílají hotová data objednávky).

### 2.3 Výběr noci a odměny
- Hostitel vybírá z **běžných nocí, které má sám odemčené** (čtvrť ← → a číslo noci). Pool slov = `nightPool()`
  hostitele. Hosté mohou dostat i slova, která ještě neznají – hint (nápověda jamo) se jim ukáže podle vlastní mastery.
- Každý hráč si do **svého** save připíše mince a mastery slov, která sám napsal. Kampaň (hvězdy nocí, odemykání)
  se **nemění**. Nová statistika `stats.coopNights`, `stats.coopFirst` (do `migrate()` + test).
- Ve výsledku: tabulka hráčů (barva, jméno, „první“, „v doběhu“, mince, nejlepší kombo), společné hvězdy,
  korunka 👑 jako sprite (ne emoji) u hráče s nejvíc „první“.

---

## 3. Protokol (`src/logic/netproto.ts`)

JSON zprávy `{ t: <typ>, ... }`, verze `PROTO = 1`. Rust je jen přenáší jako neprůhledné stringy.

Klient → hostitel: `hello {proto, name, color}`, `ready`, `done {cid, words: string[], ms}` (dopsal objednávku
zákazníka `cid`, `ms` = délka psaní pro statistiku), `miss {cid}`, `bye`.

Hostitel → klienti: `welcome {pid, players}` / `reject {reason: 'full'|'proto'|'started'}`, `lobby {players, night}`,
`start {night, seed, district, seats, total}`, `spawn {cid, seat, look, order: OrderData, patienceMs}`,
`served {cid, pid, coins}` (první), `runoff {cid, pid, coins}` (doběh někoho dalšího), `close {cid}` (konec doběhu),
`leave {cid, happy}`, `tick {ms}` (každé 2 s, synchronizace času), `end {summary}`, `kick`/`hostLeft`.

`OrderData` = serializovatelná část `Order` (`tokens, target, alts, cs, icons, extra, kind`); `hinted`
a `mistakes` si drží každý hráč lokálně. Klient porovnává psaní **lokálně** (okamžitá odezva jako dnes) a hostiteli
posílá jen `done`/`miss`.

Validace: `decode()` vrací `null` pro nevalidní zprávy (test), hostitel ignoruje `done` pro neexistující/zavřené `cid`
a ověří, že `words` odpovídá cíli nebo `alts` (anti-desync, ne anti-cheat).

---

## 4. Síťová vrstva

### 4.1 Rust (`src-tauri/src/net.rs`)
- Crates: `tokio-tungstenite` (server i klient), `if-addrs` (lokální IPv4). Tokio z Tauri runtime.
- Příkazy: `net_host_start() -> {port, ips: string[]}` (port 47123, při obsazení náhodný), `net_host_stop()`,
  `net_join(addr: string)`, `net_send(to: number | null, msg: string)` (hostitel: `null` = všem; klient: vždy hostiteli),
  `net_leave()`.
- Eventy do JS: `net://open {pid}`, `net://msg {pid, msg}`, `net://close {pid}`, `net://error {msg}`.
- Hostitel přijme max. 2 klienty (3. dostane `reject full` od JS vrstvy). Ping/pong WebSocketu po 5 s, odpojení po 10 s ticha.
- Proč v Rustu a ne `WebSocket` ve WebView: Android WebView neumí naslouchat a `ws://` z `http(s)://tauri.localhost`
  naráží na mixed-content/cleartext. Rust sockety tohle obchází.
- Capabilities: přidat povolení vlastních příkazů. Android manifest: `INTERNET` je, přidat
  `ACCESS_NETWORK_STATE`, `ACCESS_WIFI_STATE` (zjištění IP) a `CAMERA` (QR).

### 4.2 TS (`src/game/net.ts`)
- `interface Transport { host(): Promise<HostInfo>; join(addr): Promise<void>; send(to, msg); leave(); on(...) }`.
- `TauriTransport` (invoke + listen) a `WsTransport` pro prohlížeč: připojí se k `scripts/mp-relay.mjs`
  (Node, `ws`), který emuluje přesně Rust relay (role host/klient v query stringu). Díky tomu jdou E2E testy
  v Playwrightu se 3 stránkami. Volba podle `isTauri()`.
- `G.net` drží session (role, pid, hráči), scény ji jen čtou.

---

## 5. Lobby a připojení

Nové scény `Coop` (rozcestník + čekárna) a `CoopJoin`:
- **Jméno a barva**: při prvním vstupu napsat jméno (IME, max 8 znaků, korejsky i latinkou), barva ze 3 předvoleb
  (Endesga: oranžová `C.orange`, modrá, zelená – vyber kontrastní k bublinám). Uloží se do `settings.coopName/coopColor`.
- **Hostitel** ukazuje: QR kód (pixelový, generovaný v JS knihovnou `qrcode-generator` do Phaser textury, každý modul
  = celé logické pixely), pod ním **krátký kód** a celou adresu `IP:port`. Seznam připojených, výběr noci, „Otevřít
  stánek“ (aktivní od 2 hráčů).
- QR obsah: `pochapop:1:<ip>:<port>`. Při více IP (Wi-Fi + hotspot) preferovat hotspot rozhraní (`ap*`, `swlan*`,
  192.168.x / 10.x), ostatní ukázat jako „Jiná adresa“.
- **Krátký kód** = poslední dva oktety IP (`43.1`) a port jen pokud není výchozí. Klient doplní první dva oktety
  ze své vlastní IP (`net_local_ips()`); když nesedí, nabídne zadat celou adresu.
- **Klient**: „Naskenovat QR“ (`@tauri-apps/plugin-barcode-scanner`, jen mobil; na desktopu/prohlížeči skryté) nebo
  „Zadat kód“ (skrytý input s `inputmode="decimal"` přes stávající `ime.ts`).
- Chyby česky: „Stánek nenalezen – jste ve stejné Wi-Fi / hotspotu?“, „Stánek je plný“, „Jiná verze hry – aktualizuj“.
- Android Back: z čekárny = odejít (hostitel: potvrzení „Zavřít stánek pro všechny?“), během noci potvrzení odchodu.
- Odpojení hosta uprostřed noci: hostitel pokračuje bez něj (jeho zákazníci zůstávají ostatním). Odchod hostitele =
  všem „Hostitel zavřel stánek“, zápis odměn do toho okamžiku, návrat do menu.

---

## 6. Noc v kooperaci (scéna Night)

- Night dostane režim `coop: { role, pid, players }`. Hostitel spouští stávající logiku spawnu/trpělivosti/odchodů
  a výsledky posílá zprávami; klient má **pasivní** variantu (zákazníky vytváří ze `spawn`, trpělivost odpočítává
  lokálně a koriguje podle `tick`, odchod jen podle `leave`). Rozdělit kód tak, aby single player zůstal beze změny
  chování (regrese hlídá `npm run autoplay`).
- Nad stánkem malé štítky hráčů (barevná tečka + jméno + mince) místo osobního HUD kombo/mincí jen pro sebe.
- Obsloužení: první → bublina praskne u něj, u ostatních přebarvení + pruh doběhu (sprite `ui_runoff`, 3 s, barva
  prvního hráče). Doběh splněn → menší „pop“ a „+½“ mince letí k jeho štítku.
- Zvuky: nové `sfx/runoff_ok.wav` (kratší, tišší pop) a `sfx/beaten.wav` (jemné „pfff“, když tě někdo předběhne).
- Art (Aseprite, `art/src/coop.lua`): 3 barevné varianty rámečku bubliny/štítku, korunka, ikona „Spolu“ (dvě
  stoličky), QR rámeček stylu plachty stánku, ikona fotoaparátu, ikona Wi-Fi.

---

## 7. Testování (povinné)

1. **vitest**: `coop.ts` (první vs. doběh vs. pozdě, poloviční mince, překlep v doběhu, kombo, týmové hvězdy,
   škálování, odpojení hráče), `netproto.ts` (encode/decode, nevalidní vstupy, verze), migrace save.
2. **Rust**: `cargo test` pro relay (2 klienti, třetí odmítnut, broadcast, odpojení) – `CARGO_BUILD_JOBS=4`.
3. **E2E v prohlížeči** `scripts/mp-e2e.mjs` (`npm run mp-e2e`): build + preview, `mp-relay.mjs`, 3 Playwright
   stránky, lobby → noc → výsledky přes `__pocha.typeKorean`. Ověřit: první dostane plné mince, druhý v doběhu
   polovinu, třetí po doběhu nic, odchod hosta uprostřed noci, odchod hostitele. Screenshoty lobby/QR/doběhu/výsledků
   do `screenshots/` (rozšířit `npm run screenshots`).
4. **Tauri desktop** pod Xvfb (`scripts/xvfb-tauri.sh`) jako hostitel + Node bot `scripts/mp-bot.mjs`, který mluví
   protokolem přímo na Rust server a dohraje noc jako host. Nikdy neotevírat okno na reálné ploše.
5. **Telefon (Pixel 8a)**: instalovat **jen po souhlasu uživatele**. Test hostitele: `adb forward tcp:47123 tcp:47123`
   + `mp-bot.mjs` z PC. Test klienta: Xvfb Tauri hostitel (nebo relay) + `adb reverse`, připojení na `127.0.0.1`.
   Reálný test se 2 telefony přes hotspot udělá uživatel – do README přidat krátký návod.
6. Autoplay single playeru (`npm run autoplay`) musí dál projít – MP nesmí rozbít kampaň.

Těžké úlohy po jedné (cargo, gradle, Chromium, Aseprite). Na konci podepsané APK přes `scripts/sign-apk.sh`
(verze 0.3.0), README (sekce „Hrajeme spolu“) a AGENTS (struktura, příkazy, jak testovat MP).
