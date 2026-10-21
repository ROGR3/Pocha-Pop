import { chromium } from 'playwright';
const [,, out='/tmp/s.png', w='412', h='915', dpr='2.625', js=''] = process.argv;
const exe = process.env.PW_CHROMIUM ?? (await import('node:fs')).readdirSync(process.env.HOME + '/.cache/ms-playwright').filter(d => d.startsWith('chromium_headless_shell')).sort().map(d => process.env.HOME + '/.cache/ms-playwright/' + d + '/chrome-headless-shell-linux64/chrome-headless-shell').pop();
const b = await chromium.launch({ executablePath: exe });
const p = await b.newPage({ viewport: { width: +w, height: +h }, deviceScaleFactor: +dpr });
const logs=[]; p.on('console', m => logs.push(m.type()+': '+m.text())); p.on('pageerror', e => logs.push('ERR '+e.message));
await p.goto('http://localhost:1420/');
await p.waitForTimeout(1500);
if (js) { await p.evaluate(js); await p.waitForTimeout(1500); }
await p.screenshot({ path: out });
console.log(logs.filter(l=>!l.includes('Phaser v')).join('\n'));
await b.close();
