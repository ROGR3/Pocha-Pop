// End-to-end smoke test: a bot plays nights through the real UI code (IME
// emulation on the hidden input) until the Result scene. Usage:
//   node scripts/autoplay.mjs 1 11      (nights to play)
//   LISTEN=1 node scripts/autoplay.mjs 1 2 11 12   (Poslech with MockTts: the bot types what
//   it heard – window.__pocha.spoken – never the bubble, and checks the bubble hides the order)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const LISTEN = !!process.env.LISTEN;
const nights = process.argv.slice(2).map(Number).filter(Boolean);
if (!nights.length) nights.push(1);
await build({ logLevel: 'error' });
const server = await preview({ preview: { port: 4174, strictPort: false }, logLevel: 'error' });
const url = server.resolvedUrls.local[0];
const base = path.join(process.env.HOME, '.cache/ms-playwright');
const d = fs.existsSync(base) ? fs.readdirSync(base).filter((x) => x.startsWith('chromium_headless_shell')).sort().pop() : null;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? (d ? path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell') : undefined) });
const page = await browser.newPage({ viewport: { width: 450, height: 800 } });
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
await page.goto(url + (LISTEN ? '?tts=mock' : ''));
await page.waitForTimeout(1500);
let failed = false;
for (const [idx, n] of nights.entries()) {
  const seats = [2, 3, 4][idx % 3];
  const res = await page.evaluate(async ([n, seats, listen]) => {
    const P = window.__pocha;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    P.G.data.settings.firstRunDone = true;
    P.G.data.settings.track = listen ? 'listen' : 'read';
    if (listen) await P.G.speech.ready;
    P.G.speed = 3;
    // unlock everything on the way to n (and words those nights introduce)
    const chain = []; let cur = P.levels.prevNight(n);
    while (cur) { chain.push(cur); cur = P.levels.prevNight(cur); }
    for (const k of chain) P.G.track().nights[k] = P.G.track().nights[k] ?? { stars: 2, bestCoins: 50, plays: 1 };
    if (!P.G.data.upgrades.includes('helper')) P.G.data.upgrades.push('helper');
    P.game.scene.getScenes(true)[0].scene.start('Night', { night: n, seats });
    await sleep(800);
    const el = P.G.ime.el;
    const t0 = Date.now();
    let typed = 0, mistakesMade = 0;
    // Poslech: what the bot has heard and not typed yet; bubble checks
    let cursor = P.spoken.length, heardTotal = 0, leaks = 0, replayed = 0;
    const pending = [];
    const type = async (s, d = 40) => { for (const st of P.imeStates(s)) { el.value = st; el.dispatchEvent(new InputEvent('input')); await sleep(d); } };
    while (Date.now() - t0 < 150000) {
      const active = P.game.scene.getScenes(true).map((s) => s.scene.key);
      if (active.includes('Result')) break;
      const night = P.game.scene.getScene('Night');
      // dismiss dialogues (critic intro)
      const dlg = night?.children?.list.find((o) => o.type === 'Container' && o.depth === 2000);
      if (dlg) { dlg.list[0].emit('pointerup'); await sleep(150); continue; }
      const gr = night?.activeGreetings?.() ?? [];
      if (gr.length && !night.ended) {
        for (const st of P.imeStates(gr[0].ko)) { el.value = st; el.dispatchEvent(new InputEvent('input')); await sleep(30); }
        await sleep(200);
        continue;
      }
      if (listen && night && !night.ended) {
        for (const x of P.spoken.slice(cursor)) { heardTotal++; if (x.text !== '야옹') pending.push(x.text); }
        cursor = P.spoken.length;
        const ws = night.customers.filter((x) => x.state === 'wait' && x.order && x.bubble);
        // the bubble must never show the order (unless the hint was used)
        for (const x of ws) if (x.bubble.listen && !x.order.hinted && x.bubble.ko.text.includes(x.order.target)) leaks++;
        if (typed === 1 && !replayed && ws.length) { replayed++; night.earReplay(); await sleep(300); }
        if (typed === 2 && mistakesMade === 0 && ws.length) { el.value = 'ㅋ'; el.dispatchEvent(new InputEvent('input')); await sleep(100); P.G.ime.clear(); mistakesMade++; await sleep(200); continue; }
        const t = pending.shift();
        if (t !== undefined) {
          if (t.endsWith('?')) { if (gr.length) { await type(t.slice(0, -1), 30); await sleep(200); } continue; }
          // someone still waiting for what was said? (else: served by 김 대리 / walked out)
          if (!ws.some((x) => !x.bubble.listen ? false : [x.order.target, ...(x.order.alts ?? []).map((a) => a.map((k, i) => (i && !k.glue ? ' ' : '') + k.ko).join(''))].includes(t))) continue;
          await type(t);
          typed++;
          await sleep(ws.some((x) => x.order && x.order.target !== t && x.order.target.startsWith(t)) ? 900 : 300);
          continue;
        }
        // the cat only meows and shows a picture: read the picture
        const cat = ws.find((x) => !x.bubble.listen);
        if (cat) { const w = P.WORDS.find((w) => w.icon === cat.order.icons[0]); if (w) { await type(w.ko); typed++; await sleep(300); continue; } }
        await sleep(120);
        continue;
      }
      const c = night?.customers?.find((x) => x.state === 'wait' && x.order && x.bubble);
      if (c) {
        // one deliberate typo per night to exercise the error path
        if (typed === 2 && mistakesMade === 0) { el.value = 'ㅋ'; el.dispatchEvent(new InputEvent('input')); await sleep(100); P.G.ime.clear(); mistakesMade++; await sleep(200); }
        const tgt = c.order.target;
        for (const st of P.imeStates(tgt)) { el.value = st; el.dispatchEvent(new InputEvent('input')); await sleep(40); }
        typed++;
        // 약 vs 약사: the game waits a moment before serving a prefix of another order
        await sleep(night.customers.some((x) => x !== c && x.order && x.order.target.startsWith(tgt)) ? 900 : 300);
      } else await sleep(150);
    }
    await sleep(1500);
    const r = P.game.scene.getScene('Result');
    return { night: n, typed, heard: heardTotal, leaks, track: P.G.trackId, scenes: P.game.scene.getScenes(true).map((s) => s.scene.key), summary: r?.s, saved: P.G.track().nights[n], coins: P.G.data.coins, words: Object.keys(P.G.track().words).length };
  }, [n, seats, LISTEN]);
  const ok = res.scenes.includes('Result') && res.summary && res.saved?.plays >= 1 && (n < 6 || n === 900 || res.summary.greetings > 0)
    && (!LISTEN || (res.summary.listen && res.heard > 0 && res.leaks === 0 && res.track === 'listen'));
  if (!ok) failed = true;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify({ night: res.night, seats: res.summary?.seats, typed: res.typed, stars: res.summary?.stars, served: res.summary?.served, total: res.summary?.total, mistakes: res.summary?.mistakes, greetings: res.summary?.greetings, haggles: res.summary?.haggles, reactions: res.summary?.reactions, critic: res.summary?.critic, ...(LISTEN ? { listen: res.summary?.listen, heard: res.heard, replays: res.summary?.replays, leaks: res.leaks } : {}), coins: res.coins, words: res.words, scenes: res.scenes }));
  await page.screenshot({ path: `/tmp/pocha-autoplay-${n}.png` });
}
const stored = await page.evaluate(() => localStorage.getItem('pocha-pop-save')?.length ?? 0);
console.log('localStorage save bytes:', stored);
if (errors.length) { console.log('page errors:', errors); failed = true; }
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exitCode = failed ? 1 : 0;
