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
  { id: 'roof', name: 'Plachta', price: 80 },
  { id: 'sign', name: 'Cedule', price: 60 },
  { id: 'stools', name: 'Stoličky', price: 50 },
  { id: 'lanterns', name: 'Lampiony', price: 70 },
];

export const HATS: { id: string; name: string; price: number }[] = [
  { id: 'cap', name: 'Kšiltovka', price: 30 },
  { id: 'bow', name: 'Mašle', price: 35 },
  { id: 'crown', name: 'Korunka', price: 60 },
  { id: 'beanie', name: 'Kulich', price: 45 },
  { id: 'straw', name: 'Slamák', price: 50 },
];
