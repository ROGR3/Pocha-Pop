// Barvírna: stall colours (roof, sign, stools, lanterns) and hats for 나비.
// A colour can be bought once the player met its Korean word (in a night or
// in training); buying = typing the colour's name. Owned items switch for free.
// Hats stack: every purchase puts one more hat on top of 나비's tower.

export interface Cosmetics {
  roof: string | null;
  sign: string | null;
  stools: string | null;
  lanterns: string | null;
  /** 나비's hat tower, index 0 sits on the head, the last one is on top. */
  hats: string[];
  /** "part:id" keys, e.g. "roof:red", "hat:crown" (a hat type ever bought). */
  owned: string[];
}

export type ColorSlot = 'roof' | 'sign' | 'stools' | 'lanterns';
export type Slot = ColorSlot | 'hat';

export const HAT_STACK_MAX = 1000;

export function defaultCosmetics(): Cosmetics {
  return { roof: null, sign: null, stools: null, lanterns: null, hats: [], owned: [] };
}

export const ownKey = (slot: Slot, id: string) => `${slot}:${id}`;

export type ShopState = 'equipped' | 'owned' | 'locked' | 'poor' | 'buy';

export function itemState(c: Cosmetics, slot: ColorSlot, id: string, price: number, coins: number, unlocked: boolean): ShopState {
  if (c[slot] === id) return 'equipped';
  if (c.owned.includes(ownKey(slot, id))) return 'owned';
  if (!unlocked) return 'locked';
  return coins >= price ? 'buy' : 'poor';
}

/** Buy (if needed) and equip. Returns the coins left, or null if not possible. */
export function buyAndEquip(c: Cosmetics, slot: ColorSlot, id: string, price: number, coins: number, unlocked: boolean): number | null {
  const st = itemState(c, slot, id, price, coins, unlocked);
  if (st === 'locked' || st === 'poor') return null;
  if (st === 'buy') { c.owned.push(ownKey(slot, id)); coins -= price; }
  c[slot] = id;
  return coins;
}

/** Back to the original look (always free). */
export function unequip(c: Cosmetics, slot: ColorSlot) {
  c[slot] = null;
}

// ------------------------------------------------------------------ hat tower
export type HatState = 'buy' | 'poor' | 'full';

/** Every hat costs its flat price, however tall the tower already is. */
export function hatState(c: Cosmetics, price: number, coins: number): HatState {
  if (c.hats.length >= HAT_STACK_MAX) return 'full';
  return coins >= price ? 'buy' : 'poor';
}

/** Put one hat on top. Returns the coins left, or null if not possible. */
export function pushHat(c: Cosmetics, id: string, price: number, coins: number): number | null {
  if (hatState(c, price, coins) !== 'buy') return null;
  c.hats.push(id);
  const k = ownKey('hat', id);
  if (!c.owned.includes(k)) c.owned.push(k);
  return coins - price;
}

/** Take the top hat off (free, no refund). */
export function popHat(c: Cosmetics) {
  c.hats.pop();
}

/** Take the whole tower off (free, no refund). */
export function clearHats(c: Cosmetics) {
  c.hats = [];
}

export interface HatMetrics {
  /** First and last visible row (incl. outline) of the 14×10 frame. */
  top: number;
  bottom: number;
  /** Horizontal centre of the visible pixels. */
  cx: number;
}

/**
 * Offsets of every hat relative to where hat 0 sits on the head (dy up is
 * negative). Each hat's bottom outline overlaps the top outline of the hat
 * below by 1 px; upper hats are centred on the base hat.
 */
export function hatStackLayout(ids: string[], metrics: Record<string, HatMetrics>): { dx: number; dy: number }[] {
  const out: { dx: number; dy: number }[] = [];
  if (!ids.length) return out;
  const base = metrics[ids[0]];
  out.push({ dx: 0, dy: 0 });
  for (let i = 1; i < ids.length; i++) {
    const prev = metrics[ids[i - 1]], m = metrics[ids[i]];
    out.push({ dx: Math.round(base.cx - m.cx), dy: out[i - 1].dy + prev.top + 1 - m.bottom });
  }
  return out;
}

/** Gentle sideways sway that grows with the height in the tower (0 at the head). */
export function hatSway(i: number, t: number): number {
  return Math.round(Math.sin(t / 700 + i * 0.35) * Math.min(6, i * 0.08)) || 0;
}

export function mergeCosmetics(raw: (Partial<Cosmetics> & { hat?: unknown }) | undefined): Cosmetics {
  const d = defaultCosmetics();
  if (!raw || typeof raw !== 'object') return d;
  const isStr = (x: unknown): x is string => typeof x === 'string';
  const hats = Array.isArray(raw.hats) ? raw.hats.filter(isStr).slice(0, HAT_STACK_MAX)
    : isStr(raw.hat) ? [raw.hat] : [];
  const out = { ...d, ...raw, hats, owned: Array.isArray(raw.owned) ? raw.owned.filter(isStr) : [] };
  delete (out as { hat?: unknown }).hat;
  return out;
}
