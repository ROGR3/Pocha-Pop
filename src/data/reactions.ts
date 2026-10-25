// Which reactions fit which served item (§2.2). Unlisted items: tasty / good.
import type { ReactionId } from '../logic/polite';

export const ITEM_REACTIONS: Record<string, ReactionId[]> = {
  // spicy
  tteokbokki: ['spicy', 'tasty'], kimchi: ['spicy'], kimchijjigae: ['spicy', 'hot'], jjigae: ['hot', 'spicy'],
  ramyeon: ['hot', 'spicy'], bibimbap: ['spicy', 'tasty'],
  // hot soups
  galbitang: ['hot', 'tasty'], samgyetang: ['hot', 'good'], doenjangjjigae: ['hot'], mandu: ['hot', 'tasty'],
  cha: ['hot'], keopi: ['hot'],
  // sweets
  bingsu: ['sweet', 'big'], aiseukeurim: ['sweet'], keikeu: ['sweet', 'pretty'], chokollit: ['sweet'], satang: ['sweet', 'small'],
  dijeoteu: ['sweet', 'pretty'], beobeulti: ['sweet'], juseu: ['sweet'], ttalgi: ['sweet', 'pretty'], podo: ['sweet'],
  gwaja: ['cheap', 'tasty'], ppang: ['cheap', 'good'], tteok: ['sweet', 'small'],
  // size / price
  chikin: ['big', 'tasty'], galbi: ['pricey', 'tasty'], gimbap: ['cheap', 'good'], gyul: ['small', 'sweet'],
  mellon: ['big', 'sweet'], sagwa: ['big', 'good'], banana: ['sweet', 'cheap'], maekju: ['good'], kolla: ['cheap'],
  mul: ['cheap', 'good'], popkon: ['big', 'cheap'], saendeuwichi: ['big', 'good'], paseuta: ['tasty', 'pricey'],
  // 동대문 clothes
  ot: ['pretty', 'cheap'], chima: ['pretty', 'small'], baji: ['big', 'small'], moja: ['pretty', 'big'], gudu: ['pricey', 'pretty'],
  undonghwa: ['good', 'big'], tisyeocheu: ['cheap', 'small'], hanbok: ['pretty', 'pricey'], gabang: ['pricey', 'big'], jigap: ['small', 'pricey'],
  angyeong: ['pretty', 'small'], sigye: ['pricey', 'good'], mokgeori: ['pretty', 'pricey'], usan: ['big', 'cheap'],
  // 용산 electronics
  haendeupon: ['small', 'pricey', 'good'], kamera: ['pricey', 'good'], kadeu: ['small', 'okay'], bolpen: ['cheap', 'small'],
  noteubuk: ['pricey', 'small'], keompyuteo: ['big', 'pricey'], tellebijeon: ['big', 'pricey'], naengjanggo: ['big', 'okay'],
  setakgi: ['big', 'good'], eeokeon: ['pricey', 'good'], seonpunggi: ['cheap', 'okay'], boksagi: ['big', 'okay'],
  // 부산 tickets
  gicha: ['good', 'pricey'], beoseu: ['cheap', 'okay'], jihacheol: ['cheap', 'good'], taeksi: ['pricey', 'okay'], bae_boat: ['big', 'good'],
  pyo: ['cheap', 'pricey'], yeogwon: ['small', 'okay'],
};
