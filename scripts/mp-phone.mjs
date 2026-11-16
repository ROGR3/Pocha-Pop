// Co-op test on a real phone over adb (debuggable build cz.rogr.pochapop.debug,
// see scripts/adb-cdp.mjs). Buttons are pressed with real `adb input tap`s,
// typing is the IME emulation (same as autoplay).
//   node scripts/mp-phone.mjs host    phone hosts; `adb forward` + scripts/mp-bot.mjs from the PC joins
//   node scripts/mp-phone.mjs guest   phone joins a host on the PC (Tauri under Xvfb: scripts/xvfb-tauri.sh
//                                     start + Založit stánek) through `adb reverse`, 127.0.0.1:47123
// Screenshots go to screenshots/phone/*.png (gitignored: raw device captures show the status bar).
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import { ADB, adb, cdp } from './adb-cdp.mjs';

const mode = process.argv[2] ?? 'host';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const page = await cdp();
let failed = false;
const check = (ok, what, extra = '') => { console.log(ok ? 'PASS' : 'FAIL', what, extra); if (!ok) failed = true; };
const shot = (name) => { fs.mkdirSync('screenshots/phone', { recursive: true }); fs.writeFileSync(`screenshots/phone/${name}.png`, execFileSync(ADB, ['exec-out', 'screencap', '-p'])); };
async function until(fn, ms, step = 250) {
  const t0 = Date.now();
  while (Date.now() - t0 < ms) { const v = await fn(); if (v) return v; await sleep(step); }
  return null;
}
const scene = () => page.scene();

// a fresh co-op player on the phone: name, a few nights, Coop menu
await page.eval(`(() => {
  const P = window.__pocha, d = P.G.data;
  d.settings.firstRunDone = true;
  d.settings.coopName = 'Pixel';
  d.settings.coopColor = 'orange';
  for (let i = 1; i <= 4; i++) P.G.track().nights[i] = P.G.track().nights[i] ?? { stars: 3, bestCoins: 1, plays: 1 };
  P.G.save.save();
  P.G.net?.close();
  P.game.scene.getScenes(true)[0].scene.start('Coop');
})()`);
await sleep(1200);
// the first injected touch after the app starts is held back by the WebView until the next one:
// spend it on an empty corner
await page.tap({ x: 2, y: 2 });
await sleep(400);
await page.tap({ x: 3, y: 2 });
await sleep(400);
// typing bot inside the page: serves open orders (and runoffs) like a quick player
const startTyper = () => page.eval(`(() => {
  const P = window.__pocha, el = P.G.ime.el, sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  window.__typer = (async () => {
    while (true) {
      const n = P.game.scene.getScene('Night');
      if (!n?.sys.isActive() || n.ended) break;
      const c = n.customers.find((x) => x.state === 'wait' && x.order && x.bubble);
      if (c) { for (const st of P.imeStates(c.order.target)) { el.value = st; el.dispatchEvent(new InputEvent('input')); await sleep(140); } await sleep(500); }
      else await sleep(120);
    }
  })();
  return true;
})()`);
const coins0 = await page.eval('window.__pocha.G.data.coins');

if (mode === 'host') {
  check(await scene() === 'Coop', 'Coop menu');
  await page.tap('Založit stánek');
  const info = await until(() => page.eval('window.__pocha.G.net?.info ?? null'), 8000);
  check(!!info, 'phone hosts a stall', JSON.stringify(info));
  await sleep(800);
  shot('coop-host-lobby');
  adb('forward', 'tcp:47123', `tcp:${info.port}`);
  const bot = spawn('node', ['scripts/mp-bot.mjs', '127.0.0.1:47123', '--react', '2600', '--name', 'PC-bot'], { stdio: ['ignore', 'pipe', 'inherit'] });
  let botLog = '';
  bot.stdout.on('data', (d) => { botLog += d; });
  const botDone = new Promise((r) => bot.on('exit', r));
  check(!!await until(() => page.eval('window.__pocha.G.net.players.length === 2'), 10000), 'bot joined the phone (adb forward)');
  await page.tap('Otevřít stánek');
  check(!!await until(async () => await scene() === 'Night', 6000), 'night opened on the phone');
  await startTyper();
  await sleep(14000);
  shot('coop-host-night');
  check(!!await until(async () => await scene() === 'CoopResult', 240000, 1000), 'phone reached the results');
  await sleep(2500);
  shot('coop-host-result');
  const code = await botDone;
  const s = await page.eval(`window.__pocha.game.scene.getScene('CoopResult').s`);
  console.log(botLog.split('\n').filter((l) => /END|BOT/.test(l)).join('\n'));
  check(code === 0, 'bot finished the night with matching coins');
  check(s.served + s.angry === s.total && s.players.length === 2, 'summary', JSON.stringify(s.players.map((p) => [p.name, p.first, p.runoff, p.coins])));
  adb('forward', '--remove', 'tcp:47123');
} else {
  adb('reverse', 'tcp:47123', 'tcp:47123');
  await page.tap('Připojit se');
  await sleep(1000);
  check(await scene() === 'CoopJoin', 'join screen');
  await page.eval(`(() => { const el = window.__pocha.G.ime.el; el.value = '127.0.0.1'; el.dispatchEvent(new InputEvent('input')); })()`);
  await sleep(300);
  await page.tap('Připojit');
  check(!!await until(async () => await scene() === 'Coop' && await page.eval('!!window.__pocha.G.net'), 8000), 'phone joined the PC host (adb reverse)');
  await sleep(800);
  shot('coop-guest-lobby');
  if (process.env.XVFB !== '0') {
    // the Tauri host under Xvfb (450×800): Otevřít stánek
    execFileSync('xdotool', ['mousemove', '225', '510', 'click', '1'], { env: { ...process.env, DISPLAY: ':99' } });
  }
  check(!!await until(async () => await scene() === 'Night', 20000), 'night started from the host');
  await startTyper();
  await sleep(14000);
  shot('coop-guest-night');
  check(!!await until(async () => await scene() === 'CoopResult', 240000, 1000), 'phone reached the results');
  await sleep(2500);
  shot('coop-guest-result');
  const s = await page.eval(`window.__pocha.game.scene.getScene('CoopResult').s`);
  check(s.served + s.angry === s.total, 'summary', JSON.stringify(s.players.map((p) => [p.name, p.first, p.runoff, p.coins])));
  adb('reverse', '--remove', 'tcp:47123');
}
const coins1 = await page.eval('window.__pocha.G.data.coins');
check(coins1 > coins0, 'coins written to the phone save', `${coins0} → ${coins1}`);
page.close();
console.log(failed ? 'MP-PHONE FAILED' : 'MP-PHONE OK');
process.exit(failed ? 1 : 0);
