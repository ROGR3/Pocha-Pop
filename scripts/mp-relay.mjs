// Dev relay for co-op in a plain browser: emulates the Rust relay (src-tauri/src/net.rs)
// so Vite dev / Playwright pages can host and join. Pages connect with
//   ws://localhost:47200/?role=host                  → {ev:'hosted', port, ips}
//   ws://localhost:47200/?role=client&addr=ip:port   → {ev:'open', pid:0} …
// and exchange {to, msg} / {kick} frames; the relay answers with the same events
// the Rust side emits ({ev:'open'|'msg'|'close'|'error', pid, msg}).
// Usage: node scripts/mp-relay.mjs [port]     (also importable: startRelay(port))
import { WebSocketServer } from 'ws';
import { pathToFileURL } from 'node:url';

const MAX_CLIENTS = 2;
const FIRST_PORT = 47123;

export function startRelay(port = 47200) {
  const wss = new WebSocketServer({ port });
  /** fake port → { host, clients: Map<pid, ws>, next } */
  const rooms = new Map();
  let nextPort = FIRST_PORT;
  const send = (ws, f) => { if (ws.readyState === 1) ws.send(JSON.stringify(f)); };

  wss.on('connection', (ws, req) => {
    const q = new URL(req.url ?? '/', 'http://x').searchParams;
    if (q.get('role') === 'host') {
      const p = nextPort++;
      const room = { host: ws, clients: new Map(), next: 1 };
      rooms.set(`127.0.0.1:${p}`, room);
      send(ws, { ev: 'hosted', port: p, ips: ['127.0.0.1'] });
      ws.on('message', (data) => {
        let f; try { f = JSON.parse(String(data)); } catch { return; }
        if (typeof f.kick === 'number') {
          const c = room.clients.get(f.kick);
          room.clients.delete(f.kick);
          c?.close();
          return;
        }
        for (const [pid, c] of room.clients) if (f.to == null || f.to === pid) send(c, { ev: 'msg', pid: 0, msg: f.msg });
      });
      ws.on('close', () => {
        rooms.delete(`127.0.0.1:${p}`);
        for (const c of room.clients.values()) c.close();
      });
      return;
    }
    const room = rooms.get(q.get('addr') ?? '');
    if (!room) { send(ws, { ev: 'error', msg: 'notfound' }); ws.close(); return; }
    send(ws, { ev: 'open', pid: 0 });
    if (room.clients.size >= MAX_CLIENTS) {
      send(ws, { ev: 'error', msg: 'full' });
      send(ws, { ev: 'close', pid: 0 });
      ws.close();
      return;
    }
    const pid = room.next++;
    room.clients.set(pid, ws);
    send(room.host, { ev: 'open', pid });
    ws.on('message', (data) => {
      let f; try { f = JSON.parse(String(data)); } catch { return; }
      if (typeof f.msg === 'string') send(room.host, { ev: 'msg', pid, msg: f.msg });
    });
    ws.on('close', () => {
      if (room.clients.delete(pid)) send(room.host, { ev: 'close', pid });
    });
  });
  return new Promise((resolve) => wss.on('listening', () => resolve({ port, close: () => new Promise((r) => { for (const c of wss.clients) c.terminate(); wss.close(r); }) })));
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) {
  const port = Number(process.argv[2] ?? 47200);
  await startRelay(port);
  console.log(`mp-relay on ws://localhost:${port}`);
}
