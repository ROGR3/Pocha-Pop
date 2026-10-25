// Co-op bot: joins a stall over the real protocol (Rust relay in the Tauri app
// or on a phone via `adb forward tcp:47123 tcp:47123`) and plays the night as a
// guest – it "types" every order after a short delay and sends `done`.
// Usage: node scripts/mp-bot.mjs [ip:port] [--react 1800] [--name Bot] [--timeout 300]
// Exit code 0 when a night ended with the bot in the results.
import WebSocket from 'ws';

const args = process.argv.slice(2);
const opt = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 ? args[i + 1] : d; };
const addr = args.find((a) => !a.startsWith('--') && /:\d+$/.test(a)) ?? '127.0.0.1:47123';
const REACT = Number(opt('react', 1800));
const NAME = opt('name', 'Bot');
const TIMEOUT = Number(opt('timeout', 300)) * 1000;
const PROTO = 1;
const WALK_MS = 1600;

const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a);
let pid = -1;
let mine = { first: 0, runoff: 0, coins: 0 };
let ended = false;

function connect(tries = 30) {
  return new Promise((resolve, reject) => {
    const ws = new WebSocket(`ws://${addr}/`);
    ws.once('open', () => resolve(ws));
    ws.once('error', (e) => {
      if (tries <= 0) reject(e);
      else setTimeout(() => connect(tries - 1).then(resolve, reject), 1000);
    });
  });
}

const ws = await connect();
const send = (m) => ws.send(JSON.stringify(m));
log('connected to', addr);
send({ t: 'hello', proto: PROTO, name: NAME, color: 'green' });
const timer = setTimeout(() => { log('timeout'); process.exit(2); }, TIMEOUT);

ws.on('message', (data) => {
  let m;
  try { m = JSON.parse(String(data)); } catch { return; }
  switch (m.t) {
    case 'welcome': pid = m.pid; log('welcome, pid', pid, 'players', m.players.map((p) => p.name).join(', ')); break;
    case 'reject': log('rejected:', m.reason); process.exit(3); break;
    case 'lobby': log('lobby: night', m.night, 'players', m.players.length); break;
    case 'start': log('night', m.night, 'starts:', m.total, 'customers,', m.seats, 'seats'); send({ t: 'ready' }); break;
    case 'spawn': {
      // "type" the order (or its first alternative) once it is on the counter
      const words = m.order.tokens.map((t) => t.id);
      setTimeout(() => send({ t: 'done', cid: m.cid, words, ms: REACT, clean: true, hinted: false }), WALK_MS + REACT + Math.random() * 400);
      log('spawn', m.cid, m.order.target, `(${m.order.cs})`);
      break;
    }
    case 'served': if (m.pid === pid) { mine.first++; mine.coins += m.coins; } log('served', m.cid, 'by', m.pid, '+' + m.coins); break;
    case 'runoff': if (m.pid === pid) { mine.runoff++; mine.coins += m.coins; } log('runoff', m.cid, 'by', m.pid, '+' + m.coins); break;
    case 'leave': if (!m.happy) log('walk-out', m.cid); break;
    case 'end': {
      ended = true;
      const me = m.summary.players.find((p) => p.pid === pid);
      log('END', JSON.stringify({ stars: m.summary.stars, served: m.summary.served, total: m.summary.total, me }));
      const ok = !!me && me.coins === mine.coins && m.summary.served > 0;
      log(ok ? 'BOT OK' : 'BOT MISMATCH', JSON.stringify(mine));
      clearTimeout(timer);
      send({ t: 'bye' });
      setTimeout(() => process.exit(ok ? 0 : 1), 300);
      break;
    }
    case 'hostLeft': log('host closed the stall'); process.exit(ended ? 0 : 4); break;
    default: break;
  }
});
ws.on('close', () => { if (!ended) { log('connection closed'); process.exit(5); } });
