// Offline SFX generator: a compact sfxr-style synth (square/saw/sine/noise,
// ADSR-ish envelope with punch, frequency slide, vibrato, arpeggio, low/high
// pass filters). Writes 16-bit mono WAVs into public/sfx/.  Run: npm run sfx
import { mkdirSync, writeFileSync } from 'node:fs';

const RATE = 22050;

function synth(p) {
  const P = {
    wave: 'square', freq: 440, slide: 0, dslide: 0, attack: 0, sustain: 0.1, decay: 0.1, punch: 0,
    vib: 0, vibSpeed: 0, arp: 1, arpTime: 0, duty: 0.5, dutySweep: 0, lpf: 1, hpf: 0, volume: 0.5,
    repeat: 0, ...p,
  };
  const total = Math.floor((P.attack + P.sustain + P.decay) * RATE);
  const out = new Float32Array(total);
  let phase = 0, freq = P.freq, slide = P.slide, duty = P.duty;
  let lp = 0, lpPrev = 0, hp = 0;
  let noiseVal = Math.random() * 2 - 1;
  let arpDone = false;
  let seed = 12345;
  const rnd = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff * 2 - 1; };
  for (let i = 0; i < total; i++) {
    const t = i / RATE;
    if (P.repeat > 0 && i > 0 && i % Math.floor(P.repeat * RATE) === 0) { freq = P.freq; slide = P.slide; arpDone = false; }
    if (!arpDone && P.arpTime > 0 && t >= P.arpTime) { freq *= P.arp; arpDone = true; }
    slide += P.dslide / RATE;
    freq *= Math.pow(2, slide / RATE);
    freq = Math.max(20, Math.min(8000, freq));
    duty = Math.max(0.05, Math.min(0.95, duty + P.dutySweep / RATE));
    const f = freq * (1 + Math.sin(2 * Math.PI * P.vibSpeed * t) * P.vib);
    const prev = phase;
    phase = (phase + f / RATE) % 1;
    let s;
    switch (P.wave) {
      case 'square': s = phase < duty ? 1 : -1; break;
      case 'saw': s = 1 - 2 * phase; break;
      case 'sine': s = Math.sin(2 * Math.PI * phase); break;
      case 'triangle': s = phase < 0.5 ? 4 * phase - 1 : 3 - 4 * phase; break;
      case 'noise': if (phase < prev) noiseVal = rnd(); s = noiseVal; break;
      default: s = 0;
    }
    // envelope
    let env;
    if (t < P.attack) env = t / P.attack;
    else if (t < P.attack + P.sustain) env = 1 + P.punch * (1 - (t - P.attack) / P.sustain);
    else env = Math.max(0, 1 - (t - P.attack - P.sustain) / P.decay);
    // filters
    lp = lp + P.lpf * (s - lp);
    const hpOut = lp - lpPrev + (1 - P.hpf) * hp;
    lpPrev = lp; hp = hpOut;
    out[i] = (P.hpf > 0 ? hpOut : lp) * env * P.volume;
  }
  return out;
}

function concat(...parts) {
  const n = parts.reduce((a, b) => a + b.length, 0);
  const o = new Float32Array(n);
  let k = 0;
  for (const p of parts) { o.set(p, k); k += p.length; }
  return o;
}
function mix(a, b, offsetSec = 0) {
  const off = Math.floor(offsetSec * RATE);
  const o = new Float32Array(Math.max(a.length, b.length + off));
  o.set(a);
  for (let i = 0; i < b.length; i++) o[i + off] += b[i];
  return o;
}

function wav(samples) {
  const buf = Buffer.alloc(44 + samples.length * 2);
  buf.write('RIFF', 0); buf.writeUInt32LE(36 + samples.length * 2, 4); buf.write('WAVE', 8);
  buf.write('fmt ', 12); buf.writeUInt32LE(16, 16); buf.writeUInt16LE(1, 20); buf.writeUInt16LE(1, 22);
  buf.writeUInt32LE(RATE, 24); buf.writeUInt32LE(RATE * 2, 28); buf.writeUInt16LE(2, 32); buf.writeUInt16LE(16, 34);
  buf.write('data', 36); buf.writeUInt32LE(samples.length * 2, 40);
  for (let i = 0; i < samples.length; i++) buf.writeInt16LE(Math.round(Math.max(-1, Math.min(1, samples[i])) * 32000), 44 + i * 2);
  return buf;
}

const note = (n) => 440 * Math.pow(2, (n - 69) / 12);

const SFX = {
  // soft key tick for every jamo
  type: synth({ wave: 'square', freq: 1200, slide: -2000, sustain: 0.012, decay: 0.03, duty: 0.3, lpf: 0.35, volume: 0.25 }),
  // syllable "clicks" into place
  syllable: mix(
    synth({ wave: 'triangle', freq: 880, slide: 600, sustain: 0.02, decay: 0.06, punch: 0.6, volume: 0.45 }),
    synth({ wave: 'noise', freq: 4000, sustain: 0.005, decay: 0.02, lpf: 0.6, volume: 0.25 })),
  // wrong key
  error: synth({ wave: 'saw', freq: 180, slide: -300, sustain: 0.08, decay: 0.14, vib: 0.08, vibSpeed: 30, lpf: 0.25, volume: 0.45 }),
  // bubble pop
  pop: mix(
    synth({ wave: 'sine', freq: 300, slide: 9000, sustain: 0.03, decay: 0.07, punch: 0.4, volume: 0.6 }),
    synth({ wave: 'noise', freq: 6000, sustain: 0.01, decay: 0.04, lpf: 0.5, hpf: 0.2, volume: 0.25 })),
  // coin pickup
  coin: synth({ wave: 'square', freq: note(83), arp: 1.5, arpTime: 0.06, sustain: 0.06, decay: 0.22, punch: 0.5, duty: 0.4, volume: 0.3 }),
  // combo rising arpeggio
  combo: concat(...[72, 76, 79, 84].map((n) => synth({ wave: 'square', freq: note(n), sustain: 0.035, decay: 0.03, duty: 0.25, volume: 0.28 }))),
  // customer leaves angry
  angry: concat(
    synth({ wave: 'square', freq: note(55), slide: -50, sustain: 0.12, decay: 0.05, duty: 0.4, lpf: 0.3, volume: 0.35 }),
    synth({ wave: 'square', freq: note(50), slide: -200, sustain: 0.2, decay: 0.25, duty: 0.4, lpf: 0.3, vib: 0.03, vibSpeed: 8, volume: 0.35 })),
  // end-of-night star
  star: mix(
    synth({ wave: 'sine', freq: note(88), sustain: 0.05, decay: 0.6, punch: 0.6, volume: 0.4 }),
    synth({ wave: 'triangle', freq: note(95), sustain: 0.02, decay: 0.4, volume: 0.2 }), 0.03),
  // dish slides along the counter
  serve: synth({ wave: 'noise', freq: 900, slide: 1500, attack: 0.03, sustain: 0.1, decay: 0.12, lpf: 0.12, volume: 0.35 }),
  // sizzle while cooking
  sizzle: synth({ wave: 'noise', freq: 5000, attack: 0.02, sustain: 0.25, decay: 0.2, lpf: 0.5, hpf: 0.3, vib: 0.3, vibSpeed: 22, volume: 0.22 }),
  // UI click
  click: synth({ wave: 'square', freq: 660, slide: -800, sustain: 0.01, decay: 0.04, duty: 0.5, lpf: 0.5, volume: 0.25 }),
  // purchase / unlock
  buy: concat(...[67, 71, 74, 79, 83].map((n, i) => synth({ wave: 'square', freq: note(n), sustain: 0.04, decay: i === 4 ? 0.3 : 0.02, duty: 0.3, volume: 0.28 }))),
  // customer arrives: little bell
  bell: mix(
    synth({ wave: 'sine', freq: note(91), sustain: 0.02, decay: 0.35, volume: 0.3 }),
    synth({ wave: 'sine', freq: note(86), sustain: 0.02, decay: 0.45, volume: 0.3 }), 0.09),
  // hint shimmer
  hint: synth({ wave: 'sine', freq: note(84), sustain: 0.25, decay: 0.2, vib: 0.05, vibSpeed: 14, arp: 1.335, arpTime: 0.12, volume: 0.3 }),
  // night complete fanfare
  fanfare: concat(
    ...[[72, 0.09], [76, 0.09], [79, 0.09], [84, 0.25], [79, 0.09], [84, 0.45]].map(([n, d]) =>
      mix(synth({ wave: 'square', freq: note(n), sustain: d, decay: 0.05, duty: 0.3, volume: 0.22 }),
        synth({ wave: 'triangle', freq: note(n - 12), sustain: d, decay: 0.05, volume: 0.25 })))),
  // night failed
  fail: concat(...[[67, 0.15], [63, 0.15], [60, 0.4]].map(([n, d]) => synth({ wave: 'triangle', freq: note(n), sustain: d, decay: 0.1, volume: 0.4 }))),
  // cat meow
  meow: synth({ wave: 'saw', freq: 700, slide: 900, dslide: -9000, attack: 0.03, sustain: 0.18, decay: 0.12, lpf: 0.18, vib: 0.02, vibSpeed: 10, volume: 0.45 }),
  // page turn / postcard
  paper: synth({ wave: 'noise', freq: 2500, slide: -1500, attack: 0.04, sustain: 0.06, decay: 0.15, lpf: 0.3, hpf: 0.1, volume: 0.3 }),
  // co-op: finished an order in the runoff (shorter, quieter pop)
  runoff_ok: mix(
    synth({ wave: 'sine', freq: 420, slide: 7000, sustain: 0.02, decay: 0.05, punch: 0.3, volume: 0.35 }),
    synth({ wave: 'triangle', freq: note(84), sustain: 0.02, decay: 0.08, volume: 0.15 }), 0.02),
  // co-op: someone else was faster (soft "pfff")
  // Poslech: a short wooden "ťuk" before the order is said again
  replay: synth({ wave: 'triangle', freq: note(76), slide: -900, sustain: 0.02, decay: 0.07, punch: 0.4, lpf: 0.5, volume: 0.4 }),
  beaten: synth({ wave: 'noise', freq: 1800, slide: -2500, attack: 0.02, sustain: 0.08, decay: 0.2, lpf: 0.12, volume: 0.28 }),
};

mkdirSync(new URL('../public/sfx/', import.meta.url), { recursive: true });
// npm run sfx -- runoff_ok beaten   regenerates only those (noise is not seeded)
const only = process.argv.slice(2);
for (const [name, s] of Object.entries(SFX)) {
  if (only.length && !only.includes(name)) continue;
  writeFileSync(new URL(`../public/sfx/${name}.wav`, import.meta.url), wav(s));
  console.log(name.padEnd(10), (s.length / RATE).toFixed(2) + 's');
}
