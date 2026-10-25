// 동대문 clothes: Czech gender (for colour agreement) and accusative where it
// differs ("sukni"). Icons live in the recoloured 'clothes' sheet.
import type { Gender } from '../logic/czech';

export const CLOTHES: Record<string, { g: Gender; acc?: string }> = {
  ot: { g: 'n' }, chima: { g: 'f', acc: 'sukni' }, baji: { g: 'pl' }, moja: { g: 'f', acc: 'čepici' }, gudu: { g: 'pl' },
  undonghwa: { g: 'pl' }, tisyeocheu: { g: 'n' }, hanbok: { g: 'm' }, gabang: { g: 'f', acc: 'tašku' }, jigap: { g: 'f', acc: 'peněženku' },
  angyeong: { g: 'pl' }, sigye: { g: 'pl' }, mokgeori: { g: 'm' }, usan: { g: 'm' },
};
