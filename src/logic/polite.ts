// Politeness: optional greetings when a customer sits down / farewells when
// they leave (rewarded), and short reactions after the meal (from 동대문).
// Greetings are extra, temporary targets next to the orders; when a typed
// prefix fits both, the order wins.
import { matchAgainst, matchKind, toJamo, type MatchResult } from './hangul';

export const HELLO_WORDS = ['annyeonghaseyo', 'hwanyeonghaeyo'];
export const BYE_WORDS = ['gamsahamnida', 'tto_oseyo', 'tto_bwayo', 'jal_gayo'];
/** Seconds the hand / door icon stays up. */
export const GREET_WINDOW = 4;
/** Bosses wait a little longer for their greeting (and dock a star without it). */
export const BOSS_GREET_WINDOW = 8;
export const HELLO_PATIENCE = 0.15;
export const HELLO_COINS = 1;
export const BYE_COINS = 2;

export type GreetKind = 'hello' | 'bye';

export interface Greeting {
  id: string;
  ko: string;
  kind: GreetKind;
}

export interface PoliteMatch<T> {
  orders: MatchResult<T>;
  /** Greeting typed completely (only when no order still fits). */
  greet: Greeting | null;
  /** Some greeting still fits what was typed. */
  greetPrefix: boolean;
  error: boolean;
}

export function matchPolite<T>(typed: string, orders: T[], target: (t: T) => string, greetings: Greeting[]): PoliteMatch<T> {
  const r = matchAgainst(typed, orders, target);
  const res: PoliteMatch<T> = { orders: r, greet: null, greetPrefix: false, error: false };
  if (toJamo(typed).length === 0) return res;
  let full: Greeting | null = null;
  for (const g of greetings) {
    const k = matchKind(typed, g.ko);
    if (k !== 'none') res.greetPrefix = true;
    if (k === 'full' && !full) full = g;
  }
  // orders have priority over greetings
  if (r.prefix.length === 0) res.greet = full;
  res.error = r.prefix.length === 0 && !res.greetPrefix;
  return res;
}

// ------------------------------------------------------------------ reactions
export const REACTION_CHANCE = 0.3;
export const REACTION_TIME = 5;
export const REACTION_COINS = 2;
/** First night with reactions (동대문). */
export const REACTIONS_FROM = 12;

export type ReactionId = 'spicy' | 'hot' | 'sweet' | 'tasty' | 'good' | 'pricey' | 'cheap' | 'pretty' | 'big' | 'small';

/** Czech feeling shown in the bubble → the adjective the player types. */
export const REACTIONS: Record<ReactionId, { cs: string; word: string }> = {
  spicy: { cs: 'Pálivé!', word: 'maepda' },
  hot: { cs: 'Horké!', word: 'tteugeopda' },
  sweet: { cs: 'Sladké!', word: 'dalda' },
  tasty: { cs: 'Výborné!', word: 'masitda' },
  good: { cs: 'Dobré!', word: 'jota' },
  pricey: { cs: 'Drahé…', word: 'bissada' },
  cheap: { cs: 'Levné!', word: 'ssada' },
  pretty: { cs: 'Hezké!', word: 'yeppeuda' },
  big: { cs: 'Velké!', word: 'keuda' },
  small: { cs: 'Malé!', word: 'jakda' },
};

/**
 * Pick a reaction for a served item. `table` maps item ids to fitting
 * reactions; unknown items are simply tasty/good. `ok` filters reactions the
 * player can already type tonight.
 */
export function pickReaction(item: string, table: Record<string, ReactionId[]>, rand: () => number, ok: (r: ReactionId) => boolean = () => true): ReactionId | null {
  const fits = (table[item] ?? ['tasty', 'good']).filter(ok);
  if (!fits.length) return null;
  return fits[Math.floor(rand() * fits.length)];
}
