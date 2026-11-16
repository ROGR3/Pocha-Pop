// Cosmetic colours (Barvírna). Order = frame index in every colour sheet
// (art/lib.lua L.COLORS); frame 0 is the original look.
export interface ColorDef { id: string; word: string; cs: string; hex: number }

export const COLORS: ColorDef[] = [
  { id: 'red', word: 'ppalgansaek', cs: 'červená', hex: 0xe43b44 },
  { id: 'orange', word: 'juhwangsaek', cs: 'oranžová', hex: 0xf77622 },
  { id: 'yellow', word: 'noransaek', cs: 'žlutá', hex: 0xfee761 },
  { id: 'green', word: 'choroksaek', cs: 'zelená', hex: 0x3e8948 },
  { id: 'blue', word: 'paransaek', cs: 'modrá', hex: 0x0099db },
  { id: 'purple', word: 'borasaek', cs: 'fialová', hex: 0x68386c },
  { id: 'pink', word: 'bunhongsaek', cs: 'růžová', hex: 0xf6757a },
  { id: 'white', word: 'hayansaek', cs: 'bílá', hex: 0xffffff },
  { id: 'grey', word: 'hoesaek', cs: 'šedá', hex: 0x8b9bb4 },
  { id: 'black', word: 'geomeunsaek', cs: 'černá', hex: 0x3a4466 },
  { id: 'brown', word: 'galsaek', cs: 'hnědá', hex: 0xb86f50 },
];

/** Sheet frame for a colour id (0 = original). */
export function colorFrame(id: string | null | undefined): number {
  if (!id) return 0;
  return COLORS.findIndex((c) => c.id === id) + 1;
}

export type PartId = 'roof' | 'sign' | 'stools' | 'lanterns';

export const PARTS: { id: PartId; name: string; price: number }[] = [
  { id: 'roof', name: 'Plachta', price: 150 },
  { id: 'sign', name: 'Cedule', price: 120 },
  { id: 'stools', name: 'Stoličky', price: 100 },
  { id: 'lanterns', name: 'Lampiony', price: 130 },
];

/** top/bottom/cx = visible pixel bounds of the 14×10 frame in hats.png (for stacking). */
export const HATS: { id: string; name: string; price: number; top: number; bottom: number; cx: number }[] = [
  { id: 'cap', name: 'Kšiltovka', price: 20, top: 3, bottom: 9, cx: 5.5 },
  { id: 'bow', name: 'Mašle', price: 20, top: 4, bottom: 9, cx: 10 },
  { id: 'crown', name: 'Korunka', price: 40, top: 2, bottom: 8, cx: 7 },
  { id: 'beanie', name: 'Kulich', price: 25, top: 0, bottom: 9, cx: 7 },
  { id: 'straw', name: 'Slamák', price: 30, top: 2, bottom: 9, cx: 6.5 },
];

export const HAT_METRICS: Record<string, { top: number; bottom: number; cx: number }> = Object.fromEntries(HATS.map((h) => [h.id, h]));
