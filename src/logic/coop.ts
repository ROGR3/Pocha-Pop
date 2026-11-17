// Co-op night rules ("doběh"): the host is the referee. The first player to
// finish an order gets full coins; the others then have RUNOFF_MS to finish it
// too for half the coins (no tip), and nothing – but no penalty – after that.
import { serveCoins, spawnInterval } from './rules';
import { penaltyPoints, starsFromPoints } from './stars';
import type { CoopSummary, PlayerInfo } from './netproto';

export const RUNOFF_MS = 3000;
export const MAX_PLAYERS = 3;
/** Seats at the counter in co-op (2 or 3 players). */
export const COOP_SEATS = 4;
/** Everybody gets the 3-seat coin multiplier, whatever the seat count. */
export const COOP_SEAT_MUL = 1.15;
/** Customers walk to their stool in a fixed time, so all phones agree on when the order opens. */
export const COOP_WALK_MS = 1600;
/** Host broadcasts its clock this often. */
export const TICK_MS = 2000;

export function coopSeats(_players: number): number {
  return COOP_SEATS;
}

export function coopCustomers(base: number, players: number): number {
  return Math.round(base * (1 + 0.35 * (Math.max(1, players) - 1)));
}

export function coopSpawn(base: [number, number]): [number, number] {
  return spawnInterval(base, COOP_SEATS);
}

/** Coins for the first serve: the single-player price with the co-op multiplier. */
export function firstCoins(difficulty: number, patienceLeft: number, combo: number, hinted: boolean): number {
  return Math.round(serveCoins(difficulty, patienceLeft, combo, hinted).total * COOP_SEAT_MUL);
}

/** Runoff: half of the price without the tip, rounded up. */
export function runoffCoins(difficulty: number, combo: number): number {
  return Math.ceil(serveCoins(difficulty, 0, combo, true).total * COOP_SEAT_MUL / 2);
}

export interface CoopPlayer extends PlayerInfo {
  coins: number;
  first: number;
  runoff: number;
  combo: number;
  bestCombo: number;
  mistakes: number;
  connected: boolean;
}

interface OpenOrder {
  difficulty: number;
  /** Who served it first (undefined = still open). */
  firstPid?: number;
  /** Host clock (ms) when the runoff ends. */
  closesAt?: number;
  done: Set<number>;
  closed: boolean;
}

export type DoneResult =
  | { kind: 'first'; coins: number }
  | { kind: 'runoff'; coins: number }
  | null;

export interface DoneInfo {
  now: number;
  /** Patience left 0..1 (tip), measured by the host. */
  patience: number;
  clean: boolean;
  hinted: boolean;
}

export class CoopReferee {
  players: CoopPlayer[];
  private orders = new Map<number, OpenOrder>();
  served = 0;
  angry = 0;
  readonly startedWith: number;

  constructor(players: PlayerInfo[]) {
    this.players = players.map((p) => ({ ...p, coins: 0, first: 0, runoff: 0, combo: 0, bestCombo: 0, mistakes: 0, connected: true }));
    this.startedWith = Math.max(1, players.length);
  }

  player(pid: number): CoopPlayer | undefined {
    return this.players.find((p) => p.pid === pid);
  }

  /** A customer sat down with an order. */
  open(cid: number, difficulty: number) {
    this.orders.set(cid, { difficulty, done: new Set(), closed: false });
  }

  isOpen(cid: number): boolean {
    const o = this.orders.get(cid);
    return !!o && !o.closed && o.firstPid === undefined;
  }

  inRunoff(cid: number): boolean {
    const o = this.orders.get(cid);
    return !!o && !o.closed && o.firstPid !== undefined;
  }

  /** A player finished typing order `cid`. */
  done(pid: number, cid: number, info: DoneInfo): DoneResult {
    const p = this.player(pid);
    const o = this.orders.get(cid);
    if (!p || !p.connected || !o || o.closed || o.done.has(pid)) return null;
    if (o.firstPid === undefined) {
      o.firstPid = pid;
      o.closesAt = info.now + RUNOFF_MS;
      o.done.add(pid);
      p.combo = info.clean ? p.combo + 1 : 0;
      p.bestCombo = Math.max(p.bestCombo, p.combo);
      const coins = firstCoins(o.difficulty, info.patience, p.combo, info.hinted);
      p.coins += coins;
      p.first++;
      this.served++;
      return { kind: 'first', coins };
    }
    if (info.now > (o.closesAt ?? 0)) return null;
    o.done.add(pid);
    // the runoff neither breaks nor raises the combo
    const coins = runoffCoins(o.difficulty, p.combo);
    p.coins += coins;
    p.runoff++;
    return { kind: 'runoff', coins };
  }

  /**
   * A typo. On an open order it counts for the team; during the runoff (or
   * on a closed order) it only breaks the player's own combo. `free` = a typo
   * the player's night did not count (greeting, reaction): combo only.
   */
  miss(pid: number, cid: number, free = false) {
    const p = this.player(pid);
    if (!p || !p.connected) return;
    p.combo = 0;
    if (free) return;
    const o = this.orders.get(cid);
    if (o && (o.closed || o.firstPid !== undefined)) return;
    p.mistakes++;
  }

  /** The customer ran out of patience before anyone served them. */
  walkOut(cid: number) {
    const o = this.orders.get(cid);
    if (!o || o.closed || o.firstPid !== undefined) return false;
    o.closed = true;
    this.angry++;
    for (const p of this.players) if (p.connected) p.combo = 0;
    return true;
  }

  /** Orders whose runoff is over (or that everyone still here has finished). */
  expired(now: number): number[] {
    const out: number[] = [];
    const here = this.players.filter((p) => p.connected).map((p) => p.pid);
    for (const [cid, o] of this.orders) {
      if (o.closed || o.firstPid === undefined) continue;
      if (now >= (o.closesAt ?? 0) || here.every((pid) => o.done.has(pid))) {
        o.closed = true;
        out.push(cid);
      }
    }
    return out;
  }

  /** A guest left in the middle of the night: the others carry on. */
  drop(pid: number) {
    const p = this.player(pid);
    if (p) p.connected = false;
  }

  /** Team typos: the players' sum split over everyone who started. */
  typos(): number {
    return teamTypos(this.players.reduce((a, p) => a + p.mistakes, 0), this.startedWith);
  }

  stars(total: number): number {
    return starsFromPoints(penaltyPoints(this.typos(), this.angry), total);
  }

  summary(night: number, total: number): CoopSummary {
    return {
      night, stars: this.stars(total), total, served: this.served, angry: this.angry,
      mistakes: this.players.reduce((a, p) => a + p.mistakes, 0), typos: this.typos(),
      players: this.players.map((p) => ({ pid: p.pid, name: p.name, color: p.color, first: p.first, runoff: p.runoff, coins: p.coins, bestCombo: p.bestCombo, mistakes: p.mistakes, left: p.connected ? undefined : true })),
    };
  }
}

/** Team typos for the stars: sum of everyone's typos ÷ players who started, rounded. */
export function teamTypos(sum: number, startedWith: number): number {
  return Math.round(sum / Math.max(1, startedWith));
}

/** Player(s) with the most first serves (the crown). Nobody when nobody served. */
export function crowned(players: { pid: number; first: number }[]): number[] {
  const best = Math.max(0, ...players.map((p) => p.first));
  return best > 0 ? players.filter((p) => p.first === best).map((p) => p.pid) : [];
}

/** Local estimate of the host clock from the last tick. */
export function hostNow(lastTickMs: number, localAtTick: number, localNow: number): number {
  return lastTickMs + Math.max(0, localNow - localAtTick);
}

/** Patience fraction 0..1 of a co-op order from the shared host clock. */
export function patienceFrac(spawnAt: number, patienceMs: number, now: number): number {
  const opens = spawnAt + COOP_WALK_MS;
  return Math.max(0, Math.min(1, 1 - (now - opens) / patienceMs));
}

