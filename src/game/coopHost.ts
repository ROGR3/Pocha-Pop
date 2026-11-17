// Host side of a co-op night: runs the customer schedule on the host clock,
// builds the orders, judges "done" messages with the CoopReferee and tells
// everybody (itself included) what happened. The Night scene only draws.
import { DISTRICTS, homeDistrict, type NightDef } from '../data/levels';
import { pairPatience } from '../logic/rules';
import { COOP_WALK_MS, CoopReferee, TICK_MS, coopSpawn } from '../logic/coop';
import { answerMatches, type Msg, type OrderData } from '../logic/netproto';
import { makeOrder } from './orders';
import type { NetSession } from './net';
import { word } from './state';
import { speechMs } from '../logic/track';

/** Poslech: every phone speaks locally, so patience gets the speaking time on top (shared host clock). */
const LISTEN_EXTRA_MS = 1500;

/** Customer eats this long after the dish arrives before leaving. */
const EAT_MS = 3400;
/** Walking away from the stool frees it after this long. */
const WALK_AWAY_MS = 2600;
/** Guests have this long to load the night before customers start coming. */
const READY_WAIT_MS = 5000;

interface HostCustomer {
  cid: number;
  seat: number;
  at: number;
  patienceMs: number;
  order: OrderData;
  difficulty: number;
  state: 'wait' | 'served' | 'gone';
  servedAt?: number;
  closedAt?: number;
  freeAt?: number;
}

export class CoopDirector {
  referee: CoopReferee;
  clock = 0;
  private started = false;
  private customers: HostCustomer[] = [];
  private seats: (number | null)[];
  private nextCid = 1;
  private arrived = 0;
  private nextArrival = 0;
  private nextTick = 0;
  private recent: string[] = [];
  ended = false;
  private off: () => void;

  constructor(private s: NetSession, private def: NightDef, private total: number, seats: number, private pool: string[], private rand: () => number,
    private patMul: number, private newTonight: Set<string>, private listen = false) {
    this.referee = new CoopReferee(s.players);
    this.seats = Array.from({ length: seats }, () => null);
    this.off = s.onHostMsg((m, pid) => this.onMsg(m, pid));
  }

  destroy() { this.off(); }

  private onMsg(m: Msg, pid: number) {
    if (m.t === 'bye') this.referee.drop(pid);
    if (m.t === 'miss') this.referee.miss(pid, m.cid, m.free ?? false);
    if (m.t === 'done') {
      const c = this.customers.find((x) => x.cid === m.cid);
      // anti-desync: the answer has to be the order (or one of its alternatives)
      if (!c || !answerMatches(c.order, m.words)) return;
      const r = this.referee.done(pid, m.cid, {
        now: this.clock, patience: this.patience(c), clean: m.clean ?? true, hinted: m.hinted ?? false,
      });
      if (!r) return;
      if (r.kind === 'first') {
        c.state = 'served';
        c.servedAt = this.clock;
        this.s.broadcast({ t: 'served', cid: c.cid, pid, coins: r.coins });
      } else this.s.broadcast({ t: 'runoff', cid: c.cid, pid, coins: r.coins });
    }
  }

  private patience(c: HostCustomer): number {
    return Math.max(0, Math.min(1, 1 - (this.clock - c.at - COOP_WALK_MS) / c.patienceMs));
  }

  update(dtMs: number) {
    if (this.ended) return;
    this.clock += dtMs;
    const now = this.clock;
    if (now >= this.nextTick) { this.nextTick = now + TICK_MS; this.s.broadcast({ t: 'tick', ms: Math.round(now) }); }
    if (!this.started) {
      const everyone = this.s.players.every((p) => p.pid === 0 || this.s.ready.has(p.pid));
      if (!everyone && now < READY_WAIT_MS) return;
      this.started = true;
      this.nextArrival = now + 1400;
    }
    // arrivals
    if (this.arrived < this.total && now >= this.nextArrival) {
      const free = this.seats.map((c, i) => (c === null ? i : -1)).filter((i) => i >= 0);
      if (free.length) {
        this.spawn(free[Math.floor(this.rand() * free.length)]);
        const [a, b] = coopSpawn(this.def.spawn);
        this.nextArrival = now + (a + this.rand() * (b - a)) * 1000;
      } else this.nextArrival = now + 500;
    }
    // patience
    for (const c of this.customers) {
      if (c.state === 'wait' && this.patience(c) <= 0 && this.referee.walkOut(c.cid)) {
        c.state = 'gone';
        c.freeAt = now + WALK_AWAY_MS;
        this.s.broadcast({ t: 'leave', cid: c.cid, happy: false });
      }
    }
    // runoffs that are over → bubble gone for everyone, the customer eats and leaves
    for (const cid of this.referee.expired(now)) {
      const c = this.customers.find((x) => x.cid === cid);
      if (!c) continue;
      c.closedAt = now;
      this.s.broadcast({ t: 'close', cid });
    }
    for (const c of this.customers) {
      if (c.state === 'served' && c.closedAt !== undefined && now >= Math.max(c.closedAt + 600, (c.servedAt ?? 0) + EAT_MS)) {
        c.state = 'gone';
        c.freeAt = now + WALK_AWAY_MS;
        this.s.broadcast({ t: 'leave', cid: c.cid, happy: true });
      }
      if (c.state === 'gone' && c.freeAt !== undefined && now >= c.freeAt) {
        if (this.seats[c.seat] === c.cid) this.seats[c.seat] = null;
        c.freeAt = undefined;
      }
    }
    this.customers = this.customers.filter((c) => c.state !== 'gone' || c.freeAt !== undefined);
    // end of the night
    if (this.arrived >= this.total && this.customers.length === 0) {
      this.ended = true;
      this.s.broadcast({ t: 'end', summary: this.referee.summary(this.def.n, this.total) });
    }
  }

  private spawn(seat: number) {
    const exclude = new Set<string>(this.recent.slice(-3));
    for (const c of this.customers) if (c.state === 'wait') c.order.tokens.forEach((t) => exclude.add(t.id));
    const mechanic = this.def.mechanic ?? DISTRICTS[homeDistrict(this.def)].mechanic;
    const o = makeOrder('generic', { pool: this.pool, newTonight: this.newTonight, exclude, rand: this.rand, mechanic, late: this.def.late, combo: this.def.combo });
    o.tokens.forEach((t) => this.recent.push(t.id));
    const order: OrderData = { tokens: o.tokens, target: o.target, cs: o.cs, icons: o.icons, kind: 'generic' };
    if (o.alts) order.alts = o.alts;
    if (o.extra) order.extra = o.extra;
    const generics = DISTRICTS[homeDistrict(this.def)].generics;
    const look = generics[Math.floor(this.rand() * generics.length)];
    const cid = this.nextCid++;
    const patienceMs = Math.round(this.def.patience * this.patMul * pairPatience(o.tokens.length, mechanic === 'colorItem') * 1000 + (this.listen ? speechMs(o.target) * 2 + LISTEN_EXTRA_MS : 0));
    const difficulty = o.tokens.reduce((a, t) => a + word(t.id).difficulty, 0);
    const c: HostCustomer = { cid, seat, at: this.clock, patienceMs, order, difficulty, state: 'wait' };
    this.customers.push(c);
    this.seats[seat] = cid;
    this.arrived++;
    this.referee.open(cid, difficulty);
    this.s.broadcast({ t: 'spawn', cid, seat, look, order, patienceMs, at: Math.round(this.clock) });
  }
}
