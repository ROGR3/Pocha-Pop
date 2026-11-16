// Economy simulation (§6): a "normal" player (2–3★, some mistakes, average
// speed) plays every night once in unlock order. Prints cumulative coins vs.
// the cost of everything there is to buy.  Run: npx vite-node scripts/economy.ts
import words from '../src/data/words.json';
import { NIGHTS, UPGRADES, nightPool, DISTRICTS, homeDistrict } from '../src/data/levels';
import { COLORS, HATS, PARTS } from '../src/data/colors';
import { serveCoins, seatMultiplier, comboMultiplier, criticStars, nightStars } from '../src/logic/rules';
import { BYE_COINS, HELLO_COINS, REACTION_CHANCE, REACTION_COINS, REACTIONS_FROM } from '../src/logic/polite';
import { rng } from '../src/logic/srs';

const diff = new Map(words.map((w) => [w.id, w.difficulty]));
const rand = rng(42);

interface Profile { name: string; served: number; mistakeRate: number; patienceLeft: number; hintRate: number; politeRate: number; seats: number }
const PROFILES: Profile[] = [
  { name: 'pomalejší (2★)', served: 0.82, mistakeRate: 0.18, patienceLeft: 0.3, hintRate: 0.15, politeRate: 0.35, seats: 2 },
  { name: 'normální (2–3★)', served: 0.88, mistakeRate: 0.12, patienceLeft: 0.35, hintRate: 0.1, politeRate: 0.5, seats: 3 },
  { name: 'zkušený (3★)', served: 0.97, mistakeRate: 0.04, patienceLeft: 0.6, hintRate: 0.02, politeRate: 0.85, seats: 4 },
];

function night(n: number, p: Profile): { coins: number; stars: number } {
  const def = NIGHTS.find((d) => d.n === n)!;
  const pool = nightPool(n, []).filter((id) => diff.has(id));
  const seats = def.boss ? 3 : p.seats;
  const customers = def.boss ? 10 : def.customers;
  let coins = 0, combo = 0, served = 0, mistakes = 0;
  const words = def.boss ? 3.5 : DISTRICTS[homeDistrict(def)].mechanic === 'colorItem' ? 1 + (def.combo ?? 0.85) : 1;
  for (let i = 0; i < customers; i++) {
    if (rand() > p.served) { combo = 0; continue; }
    served++;
    const mistake = rand() < p.mistakeRate * words;
    if (mistake) { mistakes++; combo = 0; } else combo++;
    const d = pool.length ? diff.get(pool[Math.floor(rand() * pool.length)])! * words : 5;
    const pay = serveCoins(d, p.patienceLeft * (0.6 + rand() * 0.8), combo, rand() < p.hintRate);
    coins += Math.round(pay.total * seatMultiplier(seats));
    if (rand() < p.politeRate) coins += HELLO_COINS;
    if (rand() < p.politeRate * 0.7) coins += BYE_COINS;
    if (n >= REACTIONS_FROM && rand() < REACTION_CHANCE * p.politeRate) coins += REACTION_COINS;
  }
  void comboMultiplier;
  const stars = def.boss ? criticStars(Math.round(mistakes / 2), 0) : nightStars({ total: customers, served, angry: customers - served, mistakes });
  return { coins, stars };
}

const upgrades = UPGRADES.reduce((a, u) => a + u.price, 0);
const everyColour = PARTS.reduce((a, p) => a + p.price, 0) * COLORS.length;
const hats = HATS.reduce((a, h) => a + h.price, 0);
const oneEach = PARTS.reduce((a, p) => a + p.price, 0) * 2; // a couple of favourite colours
console.log(`Ceny: upgrady ${upgrades}, čepičky ${hats}, každá barva na všem ${everyColour}, „pár oblíbených barev“ ${oneEach}`);
const order = NIGHTS.map((d) => d.n);
for (const p of PROFILES) {
  let total = 0, hit = 0;
  const marks: string[] = [];
  for (const n of order) {
    total += night(n, p).coins;
    if ([11, 116, 121, 126, 131, 204, 303].includes(n)) marks.push(`${n}: ${total}`);
    if (!hit && total >= upgrades + hats + everyColour) { hit = n; }
  }
  console.log(`${p.name.padEnd(18)} ${marks.join(' · ')}  → na všechno (${upgrades + hats + everyColour}) po noci ${hit || '–'}`);
}
