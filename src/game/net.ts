// Co-op networking: a Transport moves opaque strings (Rust relay inside Tauri,
// scripts/mp-relay.mjs in a plain browser), the NetSession on top of it speaks
// netproto, keeps the lobby (role, pid, players) and routes messages to scenes.
// The host plays through the same path: its own messages are dispatched
// locally as if they came over the network (pid 0, latency ~0).
import Phaser from 'phaser';
import { MAX_PLAYERS } from '../logic/coop';
import { PLAYER_COLORS, PROTO, cleanName, decode, encode, rankIps, type Msg, type PlayerColor, type PlayerInfo, type RejectReason } from '../logic/netproto';
import { isTauri } from '../logic/save';
import { G } from './state';

export type NetEvent =
  | { type: 'open'; pid: number }
  | { type: 'msg'; pid: number; msg: string }
  | { type: 'close'; pid: number }
  | { type: 'error'; msg: string };

export interface HostInfo { port: number; ips: string[] }

export interface Transport {
  host(): Promise<HostInfo>;
  /** Resolves once connected to ip:port; rejects when nobody answers. */
  join(addr: string): Promise<void>;
  /** Host: null = everyone. Guest: always to the host. */
  send(to: number | null, msg: string): void;
  kick(pid: number): void;
  leave(): Promise<void>;
  localIps(): Promise<string[]>;
  on(fn: (e: NetEvent) => void): () => void;
}

class Emitter {
  private fns = new Set<(e: NetEvent) => void>();
  on(fn: (e: NetEvent) => void) { this.fns.add(fn); return () => { this.fns.delete(fn); }; }
  emit(e: NetEvent) { this.fns.forEach((f) => f(e)); }
}

// ------------------------------------------------------------------ Tauri (Rust relay)
class TauriTransport extends Emitter implements Transport {
  private ready: Promise<void>;
  private core = import('@tauri-apps/api/core');

  constructor() {
    super();
    this.ready = import('@tauri-apps/api/event').then(async ({ listen }) => {
      await listen<{ pid: number }>('net://open', (e) => this.emit({ type: 'open', pid: e.payload.pid }));
      await listen<{ pid: number; msg: string }>('net://msg', (e) => this.emit({ type: 'msg', pid: e.payload.pid, msg: e.payload.msg }));
      await listen<{ pid: number }>('net://close', (e) => this.emit({ type: 'close', pid: e.payload.pid }));
      await listen<{ msg: string }>('net://error', (e) => this.emit({ type: 'error', msg: e.payload.msg }));
    });
  }

  private async call<T>(cmd: string, args?: Record<string, unknown>): Promise<T> {
    await this.ready;
    return (await this.core).invoke<T>(cmd, args);
  }

  host() { return this.call<HostInfo>('net_host_start'); }
  join(addr: string) { return this.call<void>('net_join', { addr }); }
  send(to: number | null, msg: string) { void this.call('net_send', { to, msg }).catch((e) => console.warn('net_send', e)); }
  kick(pid: number) { void this.call('net_kick', { pid }).catch(() => {}); }
  async leave() { await this.call('net_leave').catch(() => {}); }
  localIps() { return this.call<string[]>('net_local_ips').catch(() => []); }
}

// ------------------------------------------------------------------ browser (scripts/mp-relay.mjs)
/** Relay address: ?relay=ws://host:port, default ws://<page host>:47200. */
export function relayUrl(): string {
  const q = new URLSearchParams(location.search).get('relay');
  return q ?? `ws://${location.hostname || 'localhost'}:47200`;
}

class WsTransport extends Emitter implements Transport {
  private ws: WebSocket | null = null;

  private open(query: string): Promise<WebSocket> {
    this.ws?.close();
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(`${relayUrl()}/?${query}`);
      this.ws = ws;
      let settled = false;
      ws.onmessage = (ev) => {
        let f: { ev: string; pid?: number; msg?: string; port?: number; ips?: string[] };
        try { f = JSON.parse(String(ev.data)); } catch { return; }
        if (f.ev === 'hosted' || (f.ev === 'open' && f.pid === 0 && !settled)) { settled = true; resolve(ws); }
        if (f.ev === 'hosted') { (ws as any).info = { port: f.port, ips: f.ips }; return; }
        if (f.ev === 'error' && !settled) { settled = true; reject(new Error(f.msg)); return; }
        if (f.ev === 'open' || f.ev === 'close') this.emit({ type: f.ev, pid: f.pid ?? 0 });
        else if (f.ev === 'msg') this.emit({ type: 'msg', pid: f.pid ?? 0, msg: f.msg ?? '' });
        else if (f.ev === 'error') this.emit({ type: 'error', msg: f.msg ?? '' });
      };
      ws.onerror = () => { if (!settled) { settled = true; reject(new Error('relay')); } };
      ws.onclose = () => {
        if (!settled) { settled = true; reject(new Error('relay')); return; }
        if (this.ws === ws && query.startsWith('role=client')) this.emit({ type: 'close', pid: 0 });
        if (this.ws === ws) this.ws = null;
      };
    });
  }

  async host(): Promise<HostInfo> {
    const ws = await this.open('role=host');
    return (ws as any).info;
  }
  async join(addr: string) { await this.open(`role=client&addr=${encodeURIComponent(addr)}`); }
  send(to: number | null, msg: string) { this.ws?.send(JSON.stringify({ to, msg })); }
  kick(pid: number) { this.ws?.send(JSON.stringify({ kick: pid })); }
  async leave() { const ws = this.ws; this.ws = null; ws?.close(); }
  async localIps() { return rankIps([{ name: 'lo', ip: '127.0.0.1' }]); }
}

export function createTransport(): Transport {
  return isTauri() ? new TauriTransport() : new WsTransport();
}

// ------------------------------------------------------------------ session
export type Role = 'host' | 'client';
type MsgFn = (m: Msg, from: number) => void;

const REJECT_TEXT: Record<RejectReason | 'notfound' | 'timeout', string> = {
  full: 'Stánek je plný',
  proto: 'Jiná verze hry – aktualizuj',
  started: 'Stánek už má otevřeno – počkej na další noc',
  notfound: 'Stánek nenalezen – jste ve stejné Wi-Fi / hotspotu?',
  timeout: 'Stánek nenalezen – jste ve stejné Wi-Fi / hotspotu?',
};

export class NetSession {
  role: Role;
  pid = 0;
  players: PlayerInfo[] = [];
  night = 0;
  info: HostInfo | null = null;
  /** 'lobby' → 'night' → back to 'lobby' after the results. */
  phase: 'lobby' | 'night' = 'lobby';
  closed = false;
  /** Host: guests whose night scene is loaded ("ready" can arrive before the host's own scene). */
  ready = new Set<number>();
  private hostMsgs = new Set<MsgFn>();
  private guestMsgs = new Set<MsgFn>();
  private off: () => void;
  /** Called when the connection is gone (host closed the stall / we left). */
  onClosed: ((why: string) => void) | null = null;
  /** Lobby changes (players joined / left, night picked). */
  onLobby: (() => void) | null = null;

  constructor(public t: Transport, role: Role, private game: Phaser.Game) {
    this.role = role;
    this.off = t.on((e) => this.onEvent(e));
  }

  get me(): PlayerInfo | undefined { return this.players.find((p) => p.pid === this.pid); }
  get isHost() { return this.role === 'host'; }

  // ---------------------------------------------------------------- routing
  /** Messages a host receives (hello, ready, done, miss, bye) – from guests and from itself. */
  onHostMsg(fn: MsgFn) { this.hostMsgs.add(fn); return () => { this.hostMsgs.delete(fn); }; }
  /** Messages every player receives (lobby, start, spawn, served, …). */
  onMsg(fn: MsgFn) { this.guestMsgs.add(fn); return () => { this.guestMsgs.delete(fn); }; }

  /** Player → host. The host's own messages never touch the network. */
  toHost(m: Msg) {
    if (this.isHost) queueMicrotask(() => this.hostMsgs.forEach((f) => f(m, 0)));
    else this.t.send(null, encode(m));
  }

  /** Host → everyone (itself included, synchronously). */
  broadcast(m: Msg) {
    if (!this.isHost) return;
    if (m.t === 'start') this.ready.clear();
    this.t.send(null, encode(m));
    this.guestMsgs.forEach((f) => f(m, 0));
  }

  sendTo(pid: number, m: Msg) { if (this.isHost) this.t.send(pid, encode(m)); }

  private onEvent(e: NetEvent) {
    if (this.closed) return;
    if (e.type === 'msg') {
      const m = decode(e.msg);
      if (!m) return;
      if (this.isHost) { this.hostReceive(m, e.pid); return; }
      if (m.t === 'hostLeft') { this.shutdown('Hostitel zavřel stánek'); return; }
      if (m.t === 'kick') { this.shutdown('Hostitel tě odpojil'); return; }
      if (m.t === 'lobby') { this.players = m.players; this.night = m.night; }
      this.guestMsgs.forEach((f) => f(m, 0));
      if (m.t === 'lobby') this.onLobby?.();
      return;
    }
    if (e.type === 'close') {
      if (this.isHost) this.dropPlayer(e.pid);
      else this.shutdown('Hostitel zavřel stánek');
    }
  }

  // ---------------------------------------------------------------- host side
  private hostReceive(m: Msg, pid: number) {
    if (m.t === 'hello') {
      if (m.proto !== PROTO) { this.reject(pid, 'proto'); return; }
      if (this.phase === 'night') { this.reject(pid, 'started'); return; }
      if (this.players.length >= MAX_PLAYERS) { this.reject(pid, 'full'); return; }
      const taken = new Set(this.players.map((p) => p.color));
      const color = taken.has(m.color) ? PLAYER_COLORS.find((c) => !taken.has(c))! : m.color;
      this.players.push({ pid, name: cleanName(m.name) || `Hráč ${pid + 1}`, color });
      this.sendTo(pid, { t: 'welcome', pid, players: this.players });
      this.broadcast({ t: 'lobby', players: this.players, night: this.night });
      this.onLobby?.();
      return;
    }
    if (!this.players.some((p) => p.pid === pid)) return;
    if (m.t === 'bye') { this.t.kick(pid); this.dropPlayer(pid); return; }
    if (m.t === 'ready') this.ready.add(pid);
    this.hostMsgs.forEach((f) => f(m, pid));
  }

  private reject(pid: number, reason: RejectReason) {
    this.sendTo(pid, { t: 'reject', reason });
    setTimeout(() => this.t.kick(pid), 300);
  }

  private dropPlayer(pid: number) {
    if (!this.players.some((p) => p.pid === pid)) return;
    this.players = this.players.filter((p) => p.pid !== pid);
    this.hostMsgs.forEach((f) => f({ t: 'bye' }, pid));
    this.broadcast({ t: 'lobby', players: this.players, night: this.night });
    this.onLobby?.();
  }

  setNight(n: number) {
    this.night = n;
    this.broadcast({ t: 'lobby', players: this.players, night: n });
  }

  // ---------------------------------------------------------------- lifecycle
  /** Close the stall (host) / leave it (guest). */
  async close(why = '') {
    if (this.closed) return;
    if (this.isHost) this.t.send(null, encode({ t: 'hostLeft' }));
    else this.t.send(null, encode({ t: 'bye' }));
    this.shutdown(why, true);
  }

  private shutdown(why: string, self = false) {
    if (this.closed) return;
    this.closed = true;
    this.off();
    setTimeout(() => void this.t.leave(), self ? 150 : 0);
    if (G.net === this) G.net = null;
    if (!self) {
      const sc = this.game.scene.getScenes(true)[0] as Phaser.Scene & { onNetClosed?: (why: string) => void };
      if (this.onClosed) this.onClosed(why);
      else if (sc?.onNetClosed) sc.onNetClosed(why);
      else if (sc) sc.scene.start('Coop', { error: why });
    }
  }
}

/** Start hosting: listen and become player 0. */
export async function hostSession(game: Phaser.Game): Promise<NetSession> {
  const t = createTransport();
  const s = new NetSession(t, 'host', game);
  s.info = await t.host();
  s.players = [{ pid: 0, name: G.data.settings.coopName || 'Hostitel', color: G.data.settings.coopColor }];
  G.net = s;
  return s;
}

/** Join ip:port and say hello; resolves after "welcome", throws a Czech error text. */
export async function joinSession(game: Phaser.Game, addr: string): Promise<NetSession> {
  const t = createTransport();
  let fail: ((why: string) => void) | null = null;
  const unsub = t.on((e) => { if (e.type === 'error' && e.msg === 'full') fail?.(REJECT_TEXT.full); });
  try {
    await t.join(addr);
  } catch {
    unsub();
    throw new Error(REJECT_TEXT.notfound);
  }
  const s = new NetSession(t, 'client', game);
  try {
    await new Promise<void>((resolve, reject) => {
      fail = (why) => reject(new Error(why));
      const timer = setTimeout(() => reject(new Error(REJECT_TEXT.timeout)), 5000);
      const off = s.onMsg((m) => {
        if (m.t === 'welcome') { clearTimeout(timer); off(); s.pid = m.pid; s.players = m.players; resolve(); }
        if (m.t === 'reject') { clearTimeout(timer); off(); reject(new Error(REJECT_TEXT[m.reason])); }
      });
      s.onClosed = (why) => reject(new Error(why === 'Hostitel zavřel stánek' ? REJECT_TEXT.notfound : why));
      s.toHost({ t: 'hello', proto: PROTO, name: G.data.settings.coopName || 'Host', color: G.data.settings.coopColor as PlayerColor });
    });
  } catch (e) {
    unsub();
    s.onClosed = () => {};
    await s.close();
    throw e;
  }
  unsub();
  s.onClosed = null;
  G.net = s;
  return s;
}
