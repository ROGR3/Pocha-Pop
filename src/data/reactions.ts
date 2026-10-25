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
};
