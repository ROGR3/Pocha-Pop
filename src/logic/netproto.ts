// Co-op wire protocol: JSON messages { t: <type>, ... }. The relay (Rust or
// scripts/mp-relay.mjs) only carries them as opaque strings; everything is
// validated here, so a broken / foreign message is simply dropped (null).

/** 2: `start` carries the track (Čtení / Poslech). */
export const PROTO = 2;

export type PlayerColor = 'orange' | 'blue' | 'green';
export const PLAYER_COLORS: PlayerColor[] = ['orange', 'blue', 'green'];

export interface PlayerInfo {
  pid: number;
  name: string;
  color: PlayerColor;
}

/** Serializable part of an Order (hint state and mistakes stay with each player). */
export interface OrderData {
  tokens: { id: string; ko: string; glue?: boolean }[];
  target: string;
  alts?: { id: string; ko: string; glue?: boolean }[][];
  cs: string;
  icons: string[];
  extra?: string;
  kind: string;
}

export interface CoopPlayerResult extends PlayerInfo {
  first: number;
  runoff: number;
  coins: number;
  bestCombo: number;
  mistakes: number;
  left?: boolean;
}

export interface CoopSummary {
  night: number;
  stars: number;
  total: number;
  served: number;
  angry: number;
  /** Team mistakes (sum over players). */
  mistakes: number;
  players: CoopPlayerResult[];
}

export type RejectReason = 'full' | 'proto' | 'started';

export type Msg =
  // client → host
  | { t: 'hello'; proto: number; name: string; color: PlayerColor }
  | { t: 'ready' }
  | { t: 'done'; cid: number; words: string[]; ms: number; clean?: boolean; hinted?: boolean }
  | { t: 'miss'; cid: number }
  | { t: 'bye' }
  // host → clients
  | { t: 'welcome'; pid: number; players: PlayerInfo[] }
  | { t: 'reject'; reason: RejectReason }
  | { t: 'lobby'; players: PlayerInfo[]; night: number }
  | { t: 'start'; night: number; seed: number; district: string; seats: number; total: number; track?: 'read' | 'listen' }
  | { t: 'spawn'; cid: number; seat: number; look: string; order: OrderData; patienceMs: number; at: number }
  | { t: 'served'; cid: number; pid: number; coins: number }
  | { t: 'runoff'; cid: number; pid: number; coins: number }
  | { t: 'close'; cid: number }
  | { t: 'leave'; cid: number; happy: boolean }
  | { t: 'tick'; ms: number }
  | { t: 'end'; summary: CoopSummary }
  | { t: 'kick' }
  | { t: 'hostLeft' };

export type MsgType = Msg['t'];

export function encode(m: Msg): string {
  return JSON.stringify(m);
}

// ------------------------------------------------------------------ validation
const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);
const isNum = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v);
const isStr = (v: unknown, max = 200): v is string => typeof v === 'string' && v.length <= max;
const isBool = (v: unknown): v is boolean => typeof v === 'boolean';
const optBool = (v: unknown) => v === undefined || isBool(v);
const isColor = (v: unknown): v is PlayerColor => PLAYER_COLORS.includes(v as PlayerColor);
const strArr = (v: unknown, max = 40): v is string[] => Array.isArray(v) && v.length <= max && v.every((x) => isStr(x));

function isPlayer(v: unknown): v is PlayerInfo {
  return isObj(v) && isInt(v.pid) && v.pid >= 0 && isStr(v.name, 16) && isColor(v.color);
}
const players = (v: unknown): v is PlayerInfo[] => Array.isArray(v) && v.length <= 3 && v.every(isPlayer);

function isToken(v: unknown): boolean {
  return isObj(v) && isStr(v.id, 40) && isStr(v.ko, 40) && optBool(v.glue);
}
const tokens = (v: unknown) => Array.isArray(v) && v.length > 0 && v.length <= 8 && v.every(isToken);

function isOrder(v: unknown): v is OrderData {
  return isObj(v) && tokens(v.tokens) && isStr(v.target) && isStr(v.cs) && strArr(v.icons, 8) && isStr(v.kind, 20)
    && (v.extra === undefined || isStr(v.extra))
    && (v.alts === undefined || (Array.isArray(v.alts) && v.alts.length <= 6 && v.alts.every(tokens)));
}

function isResult(v: unknown): boolean {
  return isPlayer(v) && isObj(v) && isInt(v.first) && isInt(v.runoff) && isInt(v.coins) && isInt(v.bestCombo) && isInt(v.mistakes) && optBool(v.left);
}

function isSummary(v: unknown): v is CoopSummary {
  return isObj(v) && isInt(v.night) && isInt(v.stars) && isInt(v.total) && isInt(v.served) && isInt(v.angry) && isInt(v.mistakes)
    && Array.isArray(v.players) && v.players.length <= 3 && v.players.every(isResult);
}

const CHECK: Record<MsgType, (m: Record<string, unknown>) => boolean> = {
  hello: (m) => isInt(m.proto) && isStr(m.name, 16) && isColor(m.color),
  ready: () => true,
  done: (m) => isInt(m.cid) && strArr(m.words, 8) && (m.words as string[]).length > 0 && isNum(m.ms) && optBool(m.clean) && optBool(m.hinted),
  miss: (m) => isInt(m.cid),
  bye: () => true,
  welcome: (m) => isInt(m.pid) && players(m.players),
  reject: (m) => m.reason === 'full' || m.reason === 'proto' || m.reason === 'started',
  lobby: (m) => players(m.players) && isInt(m.night),
  start: (m) => isInt(m.night) && isInt(m.seed) && isStr(m.district, 20) && isInt(m.seats) && m.seats >= 2 && m.seats <= 4 && isInt(m.total) && m.total > 0 && (m.track === undefined || m.track === 'read' || m.track === 'listen'),
  spawn: (m) => isInt(m.cid) && isInt(m.seat) && m.seat >= 0 && m.seat < 4 && isStr(m.look, 40) && isOrder(m.order) && isNum(m.patienceMs) && m.patienceMs > 0 && isNum(m.at),
  served: (m) => isInt(m.cid) && isInt(m.pid) && isInt(m.coins),
  runoff: (m) => isInt(m.cid) && isInt(m.pid) && isInt(m.coins),
  close: (m) => isInt(m.cid),
  leave: (m) => isInt(m.cid) && isBool(m.happy),
  tick: (m) => isNum(m.ms),
  end: (m) => isSummary(m.summary),
  kick: () => true,
  hostLeft: () => true,
};

/** Parse + validate one message; null for anything malformed or unknown. */
export function decode(raw: unknown): Msg | null {
  if (typeof raw !== 'string' || raw.length > 16000) return null;
  let v: unknown;
  try { v = JSON.parse(raw); } catch { return null; }
  if (!isObj(v) || typeof v.t !== 'string' || !Object.hasOwn(CHECK, v.t)) return null;
  return CHECK[v.t as MsgType](v) ? (v as Msg) : null;
}

/** Did the player type one of the order's accepted answers? (token ids, anti-desync) */
export function answerMatches(order: OrderData, words: string[]): boolean {
  const answers = [order.tokens, ...(order.alts ?? [])];
  return answers.some((a) => a.length === words.length && a.every((t, i) => t.id === words[i]));
}

/** Player name as typed: trimmed, max 8 characters (Hangul or Latin). */
export function cleanName(s: string): string {
  return [...s.replace(/\s+/g, ' ').trim()].slice(0, 8).join('');
}

// ------------------------------------------------------------------ addresses
export const DEFAULT_PORT = 47123;

/** QR payload: pochapop:1:<ip>:<port>. */
export function qrPayload(ip: string, port: number): string {
  return `pochapop:${PROTO}:${ip}:${port}`;
}

export function parseQr(s: string): { ip: string; port: number; proto: number } | null {
  const m = /^pochapop:(\d+):(\d{1,3}(?:\.\d{1,3}){3}):(\d{1,5})$/.exec(s.trim());
  if (!m) return null;
  return { proto: Number(m[1]), ip: m[2], port: Number(m[3]) };
}

/** Short code: the last two octets ("43.1"), plus ":port" when not the default. */
export function shortCode(ip: string, port: number): string {
  const o = ip.split('.');
  return `${o[2]}.${o[3]}${port === DEFAULT_PORT ? '' : `:${port}`}`;
}

const octet = (s: string) => /^\d{1,3}$/.test(s) && Number(s) <= 255;

/**
 * Turn what the player typed into ip:port. Accepts a short code ("43.1",
 * "43.1:5000", completed with the first two octets of `ownIp`) or a full
 * address ("192.168.43.1[:port]"). null = not understood / no own IP.
 */
export function resolveCode(code: string, ownIp: string | null): { ip: string; port: number } | null {
  const s = code.trim().replace(/,/g, '.');
  const [addr, portS] = s.split(':');
  const port = portS === undefined ? DEFAULT_PORT : Number(portS);
  if (!Number.isInteger(port) || port <= 0 || port > 65535) return null;
  const parts = addr.split('.');
  if (!parts.every(octet)) return null;
  if (parts.length === 4) return { ip: parts.join('.'), port };
  if (parts.length !== 2 || !ownIp) return null;
  const own = ownIp.split('.');
  if (own.length !== 4) return null;
  return { ip: `${own[0]}.${own[1]}.${parts[0]}.${parts[1]}`, port };
}

/** Sort local IPv4s: hotspot interfaces (ap*, swlan*) and private LAN ranges first. */
export function rankIps(ifs: { name: string; ip: string }[]): string[] {
  const score = (x: { name: string; ip: string }) => {
    if (x.ip.startsWith('127.')) return 9;
    let s = 5;
    if (/^(ap|swlan|softap)/i.test(x.name)) s = 0;
    else if (x.ip.startsWith('192.168.')) s = 1;
    else if (x.ip.startsWith('10.')) s = 2;
    else if (/^172\.(1[6-9]|2\d|3[01])\./.test(x.ip)) s = 3;
    return s;
  };
  return [...ifs].sort((a, b) => score(a) - score(b)).map((x) => x.ip).filter((ip, i, a) => a.indexOf(ip) === i);
}
