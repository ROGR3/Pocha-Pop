// Playwright screenshots of every screen (mobile 412×915 @2.625, desktop 450×800 @1).
// Usage: npm run screenshots   (builds, then serves dist/ with vite preview on :4173)
import { chromium } from 'playwright';
import { build, preview } from 'vite';
import fs from 'node:fs';
import path from 'node:path';

const OUT = path.resolve('screenshots');
fs.mkdirSync(OUT, { recursive: true });
if (!process.env.NO_BUILD) await build({ logLevel: 'error' });
const server = await preview({ preview: { port: 4173, strictPort: false }, logLevel: 'error' });
const url = server.resolvedUrls.local[0];

function chromiumPath() {
  if (process.env.PW_CHROMIUM) return process.env.PW_CHROMIUM;
  const base = path.join(process.env.HOME, '.cache/ms-playwright');
  if (!fs.existsSync(base)) return undefined;
  const d = fs.readdirSync(base).filter((x) => x.startsWith('chromium_headless_shell')).sort().pop();
  return d ? path.join(base, d, 'chrome-headless-shell-linux64/chrome-headless-shell') : undefined;
}
const browser = await chromium.launch({ executablePath: chromiumPath() });

const VIEWPORTS = [
  { name: 'mobile', width: 412, height: 915, dpr: 2.625 },
  { name: 'desktop', width: 450, height: 800, dpr: 1 },
];

// runs in the page
const helpers = () => {
  const P = window.__pocha;
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  P.start = (key, data) => { const s = P.game.scene.getScenes(true)[0]; s.scene.start(key, data); };
  P.seed = (upTo) => {
    const d = P.G.data;
    d.settings.firstRunDone = true;
    d.coins = 240;
    d.upgrades = upTo >= 6 ? ['lanterns', 'radio', 'awning'] : [];
    for (let n = 1; n <= upTo; n++) d.nights[n] = { stars: n % 3 === 0 ? 2 : 3, bestCoins: 60 + n * 7, plays: 1 };
    const ids = ['cha', 'uyu', 'dubu', 'mul', 'mandu', 'bap', 'gogi', 'ramyeon', 'kimchi', 'gimbap', 'ppang', 'tteok', 'danmuji', 'jjigae', 'japchae', 'galbi', 'gansik', 'eumsik', 'gwaja', 'tteokbokki', 'podo', 'juseu', 'keopi'];
    ids.slice(0, upTo * 4).forEach((id, i) => { d.words[id] = { mastery: i % 6, seen: 3 + i, correct: 2 + i, errors: i % 3, lapses: 0, lastNight: 1 }; });
    d.friends = { kim: { clean: 3, chapter: 1 }, haeun: { clean: 2, chapter: 1 }, nabi: { clean: 7, chapter: upTo >= 9 ? 3 : 1 } };
    d.streak = { count: 3, lastDay: new Date().toISOString().slice(0, 10).split('-').join('-') };
  };
  P.sleep = sleep;
  P.night = () => P.game.scene.getScene('Night');
  P.typeFirst = async (partial) => {
    const n = P.night();
    const c = n.customers.find((x) => x.order && x.state === 'wait');
    if (!c) return null;
    const st = P.imeStates(c.order.target);
    const el = P.G.ime.el;
    const target = c.order.target;
    const upto = partial ? Math.max(1, st.length - 2) : st.length;
    for (const s of st.slice(0, upto)) { el.value = s; el.dispatchEvent(new InputEvent('input')); await sleep(50); }
    return target;
  };
};

const SHOTS = [
  ['01-title', async (p) => { await p.waitForTimeout(1800); }],
  ['02-setup', async (p) => { await ev(p, "P.start('Setup',{next:'Story'})"); await p.waitForTimeout(700);
    await ev(p, "(async()=>{const el=P.G.ime.el; for(const s of P.imeStates('안녕')){el.value=s;el.dispatchEvent(new InputEvent('input'));await P.sleep(60);}})()"); await p.waitForTimeout(600); }],
  ['03-story', async (p) => { await ev(p, "P.start('Story',{kind:'prologue'})"); await p.waitForTimeout(3600); }],
  ['04-map-new', async (p) => { await ev(p, "P.G.data.settings.firstRunDone=true; P.start('Map')"); await p.waitForTimeout(900); }],
  ['05-map-progress', async (p) => { await ev(p, "P.seed(7); P.start('Map')"); await p.waitForTimeout(900); }],
  ['06-map-popup', async (p) => { await ev(p, "P.game.scene.getScene('Map').showPopup(8)"); await p.waitForTimeout(500); }],
  ['07-night-euljiro', async (p) => { await ev(p, "P.seed(3); P.start('Night',{night:4})"); await p.waitForTimeout(13000); await ev(p, 'P.typeFirst(true)'); await p.waitForTimeout(250); }],
  ['08-night-serve', async (p) => { await ev(p, 'P.typeFirst(false)'); await p.waitForTimeout(900); }],
  ['09-night-error', async (p) => { await ev(p, "(()=>{const el=P.G.ime.el; el.value='ㅋㅋ'; el.dispatchEvent(new InputEvent('input'));})()"); await p.waitForTimeout(120); }],
  ['10-pause', async (p) => { await ev(p, 'P.night().togglePause()'); await p.waitForTimeout(400); }],
  ['11-night-hangang', async (p) => { await ev(p, "P.seed(7); P.start('Night',{night:8})"); await p.waitForTimeout(14000); }],
  ['12-night-boss', async (p) => { await ev(p, "P.seed(10); P.start('Night',{night:11})"); await p.waitForTimeout(1500); await p.mouse.click(200, 400); await p.waitForTimeout(300); await p.mouse.click(200, 400); await p.waitForTimeout(300); await p.mouse.click(200, 400); await p.waitForTimeout(300); await p.mouse.click(200, 400); await p.waitForTimeout(6000); }],
  ['13-result', async (p) => { await ev(p, "P.start('Result',{night:4,stars:3,total:11,served:11,angry:0,mistakes:2,coins:132,tips:30,bestCombo:7,newWords:['jjigae','japchae','galbi','gansik','eumsik'],trouble:['jjigae','gwaja'],regularsSeen:[],clean:{}})"); await p.waitForTimeout(3200); }],
  ['14-postcard', async (p) => { await ev(p, "P.game.scene.getScene('Result').postcard()"); await p.waitForTimeout(1300); }],
  ['15-result-boss', async (p) => { await ev(p, "P.start('Result',{night:11,stars:4,total:11,served:10,angry:1,mistakes:1,coins:210,tips:40,bestCombo:5,newWords:['hana','juseyo'],trouble:[],regularsSeen:[],clean:{},critic:{stars:4,mistakes:1,walkouts:0}})"); await p.waitForTimeout(3200); }],
  ['16-shop', async (p) => { await ev(p, "P.seed(4); P.G.data.coins=170; P.start('Shop')"); await p.waitForTimeout(900); }],
  ['17-shop-upgraded', async (p) => { await ev(p, "P.seed(9); P.G.data.upgrades=['lanterns','radio','awning','stool4']; P.start('Shop')"); await p.waitForTimeout(900); }],
  ['18-recipes', async (p) => { await ev(p, "P.seed(6); P.start('Recipes')"); await p.waitForTimeout(900); }],
  ['19-recipe-detail', async (p) => { await ev(p, "P.game.scene.getScene('Recipes').detail(P.WORDS.find(w=>w.id==='tteokbokki'), true)"); await p.waitForTimeout(400); }],
  ['20-settings', async (p) => { await ev(p, "P.start('Settings',{from:'Map'})"); await p.waitForTimeout(700); }],
  ['21-epilogue', async (p) => { await ev(p, "P.seed(10); P.G.data.friends.nabi.chapter=3; P.start('Story',{kind:'ending'})"); await p.waitForTimeout(2600); }],
];

async function ev(p, js) { return p.evaluate(`(async()=>{const P=window.__pocha; ${js.includes(";") ? js : "return await (" + js + ")"} })()`); }

const errors = [];
for (const vp of VIEWPORTS) {
  const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.dpr, hasTouch: vp.name === 'mobile' });
  const page = await ctx.newPage();
  page.on('pageerror', (e) => errors.push(`${vp.name}: ${e.message}`));
  await page.goto(url);
  await page.waitForTimeout(1200);
  await page.evaluate(helpers);
  for (const [name, fn] of SHOTS) {
    try { await fn(page); } catch (e) { errors.push(`${vp.name}/${name}: ${e.message}`); }
    await page.screenshot({ path: path.join(OUT, `${vp.name}-${name}.png`) });
    console.log('✓', vp.name, name);
  }
  await ctx.close();
}
await browser.close();
await new Promise((r) => server.httpServer.close(r));
if (errors.length) { console.log('\nErrors:\n' + errors.join('\n')); process.exitCode = 1; }
