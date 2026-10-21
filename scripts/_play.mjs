import { chromium } from 'playwright';
import fs from 'node:fs';
const exe = fs.readdirSync(process.env.HOME + '/.cache/ms-playwright').filter(d => d.startsWith('chromium_headless_shell')).sort().map(d => process.env.HOME + '/.cache/ms-playwright/' + d + '/chrome-headless-shell-linux64/chrome-headless-shell').pop();
const out = process.argv[2];
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 2.625 });
p.on('pageerror', e => console.log('ERR', e.message));
p.on('console', m => { if (m.type() === 'error') console.log('CONSOLE', m.text()); });
await p.goto('http://localhost:1420/'); await p.waitForTimeout(1200);
await p.evaluate(() => { const P = window.__pocha; P.game.scene.getScenes(true)[0].scene.start('Night', { night: 2 }); });
await p.waitForTimeout(6500);
const target = await p.evaluate(() => window.__pocha.game.scene.getScene('Night').customers.find(c => c.order)?.order.target);
console.log('target', target);
// type partially
await p.evaluate(async (t) => { const P = window.__pocha; const st = P.imeStates(t); const el = P.G.ime.el; for (const s of st.slice(0, -1)) { el.value = s; el.dispatchEvent(new InputEvent('input')); await new Promise(r => setTimeout(r, 60)); } }, target);
await p.screenshot({ path: out + '_a.png', clip: { x: 0, y: 500, width: 412, height: 415 } });
await p.evaluate(async (t) => { const el = window.__pocha.G.ime.el; el.value = t; el.dispatchEvent(new InputEvent('input')); }, target);
await p.waitForTimeout(900);
await p.screenshot({ path: out + '_b.png', clip: { x: 0, y: 500, width: 412, height: 415 } });
// wrong input
await p.evaluate(async () => { const el = window.__pocha.G.ime.el; el.value = 'ㅋ'; el.dispatchEvent(new InputEvent('input')); });
await p.waitForTimeout(150);
await p.screenshot({ path: out + '_c.png', clip: { x: 0, y: 500, width: 412, height: 415 } });
const st = await p.evaluate(() => { const n = window.__pocha.game.scene.getScene('Night'); return { served: n.served, coins: n.coins, mistakes: n.mistakes }; });
console.log(JSON.stringify(st));
await b.close();
