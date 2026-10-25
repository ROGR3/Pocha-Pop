// Barvírna: stall colours (roof, sign, stools, lanterns) and hats for 나비.
// A colour can be bought once the player met its Korean word (in a night or
// in training); buying = typing the colour's name. Owned items switch for free.

export interface Cosmetics {
  roof: string | null;
  sign: string | null;
  stools: string | null;
  lanterns: string | null;
  hat: string | null;
  /** "part:id" keys, e.g. "roof:red", "hat:crown". */
  owned: string[];
}

export type Slot = 'roof' | 'sign' | 'stools' | 'lanterns' | 'hat';

export function defaultCosmetics(): Cosmetics {
  return { roof: null, sign: null, stools: null, lanterns: null, hat: null, owned: [] };
}

export const ownKey = (slot: Slot, id: string) => `${slot}:${id}`;

export type ShopState = 'equipped' | 'owned' | 'locked' | 'poor' | 'buy';

export function itemState(c: Cosmetics, slot: Slot, id: string, price: number, coins: number, unlocked: boolean): ShopState {
  if (c[slot] === id) return 'equipped';
  if (c.owned.includes(ownKey(slot, id))) return 'owned';
  if (!unlocked) return 'locked';
  return coins >= price ? 'buy' : 'poor';
}

/** Buy (if needed) and equip. Returns the coins left, or null if not possible. */
export function buyAndEquip(c: Cosmetics, slot: Slot, id: string, price: number, coins: number, unlocked: boolean): number | null {
  const st = itemState(c, slot, id, price, coins, unlocked);
  if (st === 'locked' || st === 'poor') return null;
  if (st === 'buy') { c.owned.push(ownKey(slot, id)); coins -= price; }
  c[slot] = id;
  return coins;
}

/** Back to the original look (always free). */
export function unequip(c: Cosmetics, slot: Slot) {
  c[slot] = null;
}

export function mergeCosmetics(raw: Partial<Cosmetics> | undefined): Cosmetics {
  const d = defaultCosmetics();
  if (!raw || typeof raw !== 'object') return d;
  return { ...d, ...raw, owned: Array.isArray(raw.owned) ? raw.owned.filter((x) => typeof x === 'string') : [] };
}
