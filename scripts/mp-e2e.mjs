// Co-op end-to-end test in the browser: dev relay + 3 Playwright pages play
// lobby → night → results through the real UI code (IME emulation).
// Checks: first = full coins, second in the runoff = half, third after the
// runoff = nothing (and a late "done" is ignored), the 4th player is turned
// away (full), a guest leaving mid-night, the host closing the stall, and a Poslech night
// (MockTts: the host's bot types what it heard, a guest without a voice reads the bubbles).
// Usage: npm run mp-e2e        (NO_BUILD=1 skips the build, --shots saves screenshots/)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';
import { startRelay } from './mp-relay.mjs';

const SHOTS = process.argv.includes('--shots');
const OUT = path.resolve('screenshots');
const RELAY = 47210;
if (!process.env.NO_BUILD) await build({ logLevel: 'error' });
const server = await preview({ preview: { port: 4176, strictPort: false }, logLevel: 'error' });
const url = server.resolvedUrls.local[0] + `?relay=ws://localhost:${RELAY}&tts=mock`;
const relay = await startRelay(RELAY);
const base = path.join(process.env.HOME, '.cache/ms-playwright');
const d = fs.existsSync(base) ? fs.readdirSync(base).filter((x) => x.startsWith('chromium_headless_shell')).sort().pop() : null;
const browser = await chromium.launch({ executablePath: process.env.PW_CHROMIUM ?? (d ? path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell') : undefined) });

const errors = [];
let failed = false;
const check = (ok, what, extra = '') => { console.log(ok ? 'PASS' : 'FAIL', what, extra); if (!ok) failed = true; };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SPEED = 2;

async function player(name, color, big) {
  const ctx = await browser.newContext(big ? { viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 } : { viewport: { width: 400, height: 760 } });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errors.push(`${name}: ${e.message}`));
  await p.goto(url);
  await p.waitForTimeout(1200);
  await p.evaluate(([n, c, speed]) => {
    const P = window.__pocha;
    const d = P.G.data;
    d.settings.firstRunDone = true;
    d.settings.coopName = n;
    d.settings.coopColor = c;
    d.coins = 0;
    for (let i = 1; i <= 4; i++) P.G.track().nights[i] = { stars: 3, bestCoins: 1, plays: 1 };
    P.G.speed = speed;
    window.__mlog = [];
    P.sleep = (ms) => new Promise((r) => setTimeout(r, ms));
    P.scene = () => P.game.scene.getScenes(true)[0]?.scene.key;
    P.night = () => P.game.scene.getScene('Night');
    /** Type a Korean string the way the IME does (all intermediate states). */
    P.type = async (s, delay = 35) => { const el = P.G.ime.el; for (const st of P.imeStates(s)) { el.value = st; el.dispatchEvent(new InputEvent('input')); await P.sleep(delay); } };
    /** Bot: serve whatever is open (also runoffs when allowed) until the night ends. */
    P.bot = async (o) => {
      window.__botStop = false;
      while (!window.__botStop && P.scene() === 'Night' && !P.night().ended) {
        const n = P.night();
        const c = n.customers.find((x) => x.state === 'wait' && x.order && x.bubble && (o.runoff || x.coop.runoffAt === undefined));
        if (c) { await P.type(c.order.target, o.key); await P.sleep(o.think + Math.random() * 300); } else await P.sleep(80);
      }
    };
    /** Poslech bot: types only what it heard (__pocha.spoken), never reads the bubble. */
    P.botListen = async (o) => {
      window.__botStop = false;
      let cursor = P.spoken.length;
      const pending = [];
      window.__leaks = 0;
      while (!window.__botStop && P.scene() === 'Night' && !P.night().ended) {
        const n = P.night();
        for (const x of P.spoken.slice(cursor)) pending.push(x.text);
        cursor = P.spoken.length;
        const ws = n.customers.filter((x) => x.state === 'wait' && x.order && x.bubble);
        for (const x of ws) if (!x.order.hinted && x.bubble.ko.text.includes(x.order.target)) window.__leaks++;
        const t = pending.shift();
        if (t === undefined) { await P.sleep(80); continue; }
        if (!ws.some((x) => x.order.target === t)) continue; // somebody else was faster
        await P.type(t, o.key);
        await P.sleep(o.think);
      }
    };
    P.log = () => { const s = P.G.net; if (s && !s.__logged) { s.__logged = true; s.onMsg((m) => window.__mlog.push(m)); } };
  }, [name, color, SPEED]);
  return p;
}
const ev = (p, js, arg) => p.evaluate(js, arg);
const scene = (p) => ev(p, () => window.__pocha.scene());
const shot = async (p, name) => { if (SHOTS) await p.screenshot({ path: path.join(OUT, `mobile-${name}.png`) }); };
async function waitFor(p, fn, arg, ms = 15000) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { if (await p.evaluate(fn, arg)) return true; await sleep(100); }
  return false;
}
async function join(p, code) {
  await ev(p, () => window.__pocha.game.scene.getScenes(true)[0].scene.start('CoopJoin'));
  await sleep(600);
  await ev(p, (c) => { const el = window.__pocha.G.ime.el; el.value = c; el.dispatchEvent(new InputEvent('input')); }, code);
  await sleep(150);
  await ev(p, () => window.__pocha.game.scene.getScene('CoopJoin').connectCode());
  await sleep(900);
}

if (SHOTS) fs.mkdirSync(OUT, { recursive: true });
const A = await player('민지', 'orange', true);
const B = await player('Tom', 'blue', true);
const C = await player('Eva', 'blue', false);
const D = await player('Dan', 'green', false);

// ------------------------------------------------------------------ lobby
await ev(A, () => window.__pocha.game.scene.getScenes(true)[0].scene.start('Coop'));
await sleep(600);
await shot(A, '60-coop-menu');
await ev(A, () => window.__pocha.game.scene.getScene('Coop').host());
await sleep(800);
const port = await ev(A, () => window.__pocha.G.net.info.port);
await join(B, '0.1' + (port === 47123 ? '' : `:${port}`));
await join(C, `127.0.0.1:${port}`);
check(await scene(B) === 'Coop' && await scene(C) === 'Coop', 'guests joined with short code / full address');
const players = await ev(A, () => window.__pocha.G.net.players.map((p) => `${p.pid}:${p.name}:${p.color}`));
check(players.length === 3 && players[2].endsWith(':green'), 'host sees 3 players, duplicate colour reassigned', players.join(' '));
await join(D, `127.0.0.1:${port}`);
const dText = await ev(D, () => window.__pocha.game.scene.getScene('CoopJoin').status.text);
check(dText.includes('plný'), '4th player turned away', dText);
await ev(A, () => { window.__pocha.G.net.setNight(2); window.__pocha.game.scene.getScene('Coop').renderNight(); });
await sleep(400);
await shot(A, '61-coop-host-lobby');
await shot(B, '62-coop-guest-lobby');
for (const p of [A, B, C]) await ev(p, () => window.__pocha.log());

// ------------------------------------------------------------------ night 1
await ev(A, () => window.__pocha.game.scene.getScene('Coop').open(window.__pocha.G.net));
check(await waitFor(B, () => window.__pocha.scene() === 'Night') && await waitFor(C, () => window.__pocha.scene() === 'Night'), 'everyone in the night');
// the first order: A first, B in the runoff, C does nothing
const firstWait = (p) => waitFor(p, () => !!window.__pocha.night()?.customers.find((x) => x.state === 'wait' && x.bubble), null, 20000);
await Promise.all([firstWait(A), firstWait(B), firstWait(C)]);
const target = await ev(A, () => { const c = window.__pocha.night().customers.find((x) => x.state === 'wait' && x.bubble); window.__cid = c.coop.cid; return { cid: c.coop.cid, t: c.order.target }; });
await ev(A, (t) => window.__pocha.type(t), target.t);
await waitFor(B, (cid) => window.__mlog.some((m) => m.t === 'served' && m.cid === cid), target.cid, 5000);
await sleep(100);
await shot(B, '63-coop-runoff');
await ev(B, (cid) => window.__pocha.type(window.__pocha.night().customers.find((x) => x.coop?.cid === cid).coop.data.target, 25), target.cid);
await waitFor(A, (cid) => window.__mlog.some((m) => m.t === 'close' && m.cid === cid), target.cid, 6000);
const cGone = await ev(C, (cid) => { const c = window.__pocha.night().customers.find((x) => x.coop?.cid === cid); return !c || !c.bubble; }, target.cid);
check(cGone, 'bubble closed for the third player after the runoff');
// a late "done" from C is ignored by the host
await ev(C, (cid) => { const c = window.__pocha.night().customers.find((x) => x.coop?.cid === cid); window.__pocha.G.net.toHost({ t: 'done', cid, words: c ? c.coop.data.tokens.map((t) => t.id) : ['x'], ms: 1 }); }, target.cid);
await sleep(400);
const evs = await ev(A, (cid) => window.__mlog.filter((m) => (m.t === 'served' || m.t === 'runoff') && m.cid === cid), target.cid);
const first = evs.find((m) => m.t === 'served'), run = evs.filter((m) => m.t === 'runoff');
check(first?.pid === 0 && first.coins > 0, 'first player gets full coins', JSON.stringify(first));
check(run.length === 1 && run[0].pid === 1 && run[0].coins > 0 && run[0].coins <= Math.ceil(first.coins / 2), 'second gets half in the runoff', JSON.stringify(run));
check(!evs.some((m) => m.pid === 2), 'third gets nothing (late done ignored)');
const cMistakes = await ev(C, () => window.__pocha.night().mistakes);
check(cMistakes === 0, 'no penalty for missing the runoff');
// everyone plays; C leaves after a while
const bots = [ev(A, () => window.__pocha.bot({ key: 30, think: 200, runoff: true })), ev(B, () => window.__pocha.bot({ key: 45, think: 250, runoff: true }))];
const cBot = ev(C, () => window.__pocha.bot({ key: 40, think: 300, runoff: false }));
await sleep(9000);
await ev(C, () => { window.__botStop = true; });
await cBot;
await ev(C, () => { const n = window.__pocha.night(); n.askLeave(); });
await sleep(300);
await shot(C, '64-coop-leave-confirm');
await ev(C, () => { const n = window.__pocha.night(); n.coop.confirm.list.find((o) => o.label?.text === 'Ano').emit('pointerup'); });
await sleep(800);
check(await scene(C) === 'Coop', 'guest left mid-night');
const cCoins = await ev(C, () => window.__pocha.G.data.coins);
check(await waitFor(A, () => window.__pocha.scene() === 'CoopResult', null, 120000), 'host reaches the results');
check(await waitFor(B, () => window.__pocha.scene() === 'CoopResult', null, 10000), 'guest reaches the results');
await Promise.all(bots);
await sleep(2600);
await shot(A, '65-coop-result');
const sumA = await ev(A, () => window.__pocha.game.scene.getScene('CoopResult').s);
const sumB = await ev(B, () => window.__pocha.game.scene.getScene('CoopResult').s);
check(JSON.stringify(sumA) === JSON.stringify(sumB), 'same summary for everyone');
check(sumA.players.find((p) => p.pid === 2)?.left === true, 'leaver marked in the table');
check(sumA.served + sumA.angry === sumA.total, 'all customers accounted for', `${sumA.served}+${sumA.angry}/${sumA.total} ★${sumA.stars}`);
const saveA = await ev(A, () => ({ coins: window.__pocha.G.data.coins, st: window.__pocha.G.data.stats, n2: window.__pocha.G.track().nights[2] }));
const saveB = await ev(B, () => ({ coins: window.__pocha.G.data.coins, st: window.__pocha.G.data.stats }));
check(saveA.coins === sumA.players[0].coins && saveA.st.coopNights === 1 && saveA.st.coopFirst === sumA.players[0].first, 'host save: coins + co-op stats', JSON.stringify({ coins: saveA.coins, coopNights: saveA.st.coopNights, coopFirst: saveA.st.coopFirst }));
check(saveB.coins === sumA.players.find((p) => p.pid === 1).coins && saveB.st.coopNights === 1, 'guest save: coins + co-op stats', `coins ${saveB.coins}`);
check(saveA.n2.plays === 1, 'campaign record untouched');
check(cCoins >= 0 && (await ev(C, () => window.__pocha.G.data.stats.coopNights)) === 0, 'leaver keeps coins, no finished night', `coins ${cCoins}`);
console.log('summary', JSON.stringify(sumA.players.map((p) => ({ n: p.name, first: p.first, runoff: p.runoff, coins: p.coins, combo: p.bestCombo, left: p.left }))));

// ------------------------------------------------------------------ night 2: the host closes the stall
await ev(A, () => window.__pocha.game.scene.getScene('CoopResult').scene.start('Coop'));
await ev(B, () => window.__pocha.game.scene.getScene('CoopResult').scene.start('Coop'));
await sleep(700);
await ev(A, () => window.__pocha.game.scene.getScene('Coop').open(window.__pocha.G.net));
check(await waitFor(B, () => window.__pocha.scene() === 'Night'), 'second night started');
await waitFor(B, () => !!window.__pocha.night()?.customers.find((x) => x.state === 'wait' && x.bubble), null, 20000);
const bBefore = await ev(B, () => window.__pocha.G.data.coins);
await ev(B, async () => { const c = window.__pocha.night().customers.find((x) => x.state === 'wait' && x.bubble); await window.__pocha.type(c.order.target); });
await sleep(500);
await ev(A, () => { window.__pocha.G.net.close(); window.__pocha.game.scene.getScene('Night').scene.start('Coop'); });
check(await waitFor(B, () => window.__pocha.scene() === 'Coop', null, 6000), 'guest back in the menu after the host left');
const bErr = await ev(B, () => window.__pocha.game.scene.getScene('Coop').error);
const bAfter = await ev(B, () => window.__pocha.G.data.coins);
check(bErr.includes('Hostitel zavřel stánek') && bAfter > bBefore, 'guest told + coins so far kept', `${bErr} (${bBefore}→${bAfter})`);
await sleep(600);
await shot(B, '66-coop-host-left');

// ------------------------------------------------------------------ night 3: Poslech
await ev(A, () => { window.__pocha.G.net?.close(); window.__pocha.game.scene.getScenes(true)[0].scene.start('Coop'); });
await sleep(800);
await ev(A, () => window.__pocha.game.scene.getScene('Coop').host());
await sleep(800);
const port3 = await ev(A, () => window.__pocha.G.net.info.port);
// B has no Korean voice: it must still play (reading)
await ev(B, () => { window.__pocha.G.speech.status = { available: false, korean: false }; });
await join(B, `127.0.0.1:${port3}`);
await ev(A, () => { const s = window.__pocha.G.net; s.setNight(3); s.setTrack('listen'); window.__pocha.game.scene.getScene('Coop').renderNight(); });
await sleep(400);
const bTrack = await ev(B, () => ({ t: window.__pocha.G.net.track, txt: window.__pocha.game.scene.getScene('Coop').trackText?.text }));
check(bTrack.t === 'listen' && bTrack.txt.includes('hlas'), 'guest sees the Poslech choice + no-voice warning', JSON.stringify(bTrack));
await shot(A, '67-coop-listen-lobby');
await shot(B, '68-coop-listen-novoice');
const aSpoken0 = await ev(A, () => window.__pocha.spoken.length);
await ev(A, () => window.__pocha.game.scene.getScene('Coop').open(window.__pocha.G.net));
check(await waitFor(B, () => window.__pocha.scene() === 'Night'), 'Poslech night started');
const modes = { a: await ev(A, () => window.__pocha.night().listen), b: await ev(B, () => window.__pocha.night().listen) };
check(modes.a === true && modes.b === false, 'host listens, the guest without a voice reads', JSON.stringify(modes));
const bots3 = [ev(A, () => window.__pocha.botListen({ key: 30, think: 150 })), ev(B, () => window.__pocha.bot({ key: 60, think: 700, runoff: false }))];
await waitFor(A, () => window.__pocha.night()?.customers.some((x) => x.bubble?.listen && window.__pocha.G.speech.speaking(x)), null, 20000);
await shot(A, '69-coop-listen-night');
check(await waitFor(A, () => window.__pocha.scene() === 'CoopResult', null, 150000), 'Poslech co-op night finished');
await Promise.all(bots3);
const a3 = await ev(A, (n0) => ({ said: window.__pocha.spoken.length - n0, leaks: window.__leaks, listenWords: Object.keys(window.__pocha.G.track('listen').words).length, ov: window.__pocha.G.trackOverride }), aSpoken0);
const b3 = await ev(B, () => ({ said: window.__pocha.spoken.length, listenWords: Object.keys(window.__pocha.G.track('listen').words).length }));
const sum3 = await ev(A, () => window.__pocha.game.scene.getScene('CoopResult').s);
check(a3.said > 0 && a3.leaks === 0, 'orders were spoken, bubbles hid them', JSON.stringify(a3));
check(a3.listenWords > 0 && a3.ov === null, 'host mastery went to the Poslech track');
check(b3.said === 0 && b3.listenWords === 0, 'reading guest: no voice, Čtení mastery', JSON.stringify(b3));
check(sum3.players[0].first > 0 && sum3.served + sum3.angry === sum3.total, 'host served by ear', `${sum3.players[0].first} first, ${sum3.served}+${sum3.angry}/${sum3.total}`);

if (errors.length) { console.log('page errors:', errors); failed = true; }
await browser.close();
await relay.close();
await new Promise((r) => server.httpServer.close(r));
console.log(failed ? 'MP-E2E FAILED' : 'MP-E2E OK');
process.exitCode = failed ? 1 : 0;
