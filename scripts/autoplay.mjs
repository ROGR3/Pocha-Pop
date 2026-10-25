// End-to-end smoke test: a bot plays nights through the real UI code (IME
// emulation on the hidden input) until the Result scene. Usage:
//   node scripts/autoplay.mjs 1 11      (nights to play)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

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
await page.goto(url);
await page.waitForTimeout(1500);
let failed = false;
for (const [idx, n] of nights.entries()) {
  const seats = [2, 3, 4][idx % 3];
  const res = await page.evaluate(async ([n, seats]) => {
    const P = window.__pocha;
    const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    P.G.data.settings.firstRunDone = true;
    P.G.speed = 3;
    if (n === 11) for (let k = 1; k <= 10; k++) P.G.data.nights[k] = P.G.data.nights[k] ?? { stars: 2, bestCoins: 50, plays: 1 };
    if (!P.G.data.upgrades.includes('helper')) P.G.data.upgrades.push('helper');
    P.game.scene.getScenes(true)[0].scene.start('Night', { night: n, seats });
    await sleep(800);
    const el = P.G.ime.el;
    const t0 = Date.now();
    let typed = 0, mistakesMade = 0;
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
      const c = night?.customers?.find((x) => x.state === 'wait' && x.order && x.bubble);
      if (c) {
        // one deliberate typo per night to exercise the error path
        if (typed === 2 && mistakesMade === 0) { el.value = 'ㅋ'; el.dispatchEvent(new InputEvent('input')); await sleep(100); P.G.ime.clear(); mistakesMade++; await sleep(200); }
        for (const st of P.imeStates(c.order.target)) { el.value = st; el.dispatchEvent(new InputEvent('input')); await sleep(40); }
        typed++;
        await sleep(300);
      } else await sleep(150);
    }
    await sleep(1500);
    const r = P.game.scene.getScene('Result');
    return { night: n, typed, scenes: P.game.scene.getScenes(true).map((s) => s.scene.key), summary: r?.s, saved: P.G.data.nights[n], coins: P.G.data.coins, words: Object.keys(P.G.data.words).length };
  }, [n, seats]);
  const ok = res.scenes.includes('Result') && res.summary && res.saved?.plays >= 1 && (n < 6 || res.summary.greetings > 0);
  if (!ok) failed = true;
  console.log(ok ? 'PASS' : 'FAIL', JSON.stringify({ night: res.night, seats: res.summary?.seats, typed: res.typed, stars: res.summary?.stars, served: res.summary?.served, total: res.summary?.total, mistakes: res.summary?.mistakes, greetings: res.summary?.greetings, critic: res.summary?.critic, coins: res.coins, words: res.words, scenes: res.scenes }));
  await page.screenshot({ path: `/tmp/pocha-autoplay-${n}.png` });
}
const stored = await page.evaluate(() => localStorage.getItem('pocha-pop-save')?.length ?? 0);
console.log('localStorage save bytes:', stored);
if (errors.length) { console.log('page errors:', errors); failed = true; }
await browser.close();
await new Promise((r) => server.httpServer.close(r));
process.exitCode = failed ? 1 : 0;
