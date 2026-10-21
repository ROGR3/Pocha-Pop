// Sound: pre-generated sfxr WAVs (public/sfx) through Phaser's WebAudio,
// plus procedural ambience (rain / river noise + filter) and an optional
// lo-fi loop for the radio upgrade.
import Phaser from 'phaser';

export const SFX_KEYS = ['type', 'syllable', 'error', 'pop', 'coin', 'combo', 'angry', 'star', 'serve', 'sizzle', 'click', 'buy', 'bell', 'hint', 'fanfare', 'fail', 'meow', 'paper'] as const;
export type SfxKey = (typeof SFX_KEYS)[number];

export class Audio {
  sfxVolume = 0.8;
  ambientVolume = 0.5;
  private game: Phaser.Game | null = null;
  private ctx: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private ambientNodes: AudioNode[] = [];
  private ambientKind: 'rain' | 'river' | null = null;
  private lofi: { stop: () => void } | null = null;
  private lastPlay: Record<string, number> = {};

  attach(game: Phaser.Game) {
    this.game = game;
    const sm = game.sound as Phaser.Sound.WebAudioSoundManager;
    this.ctx = (sm as any).context ?? null;
  }

  play(key: SfxKey, opts: { detune?: number; rate?: number; volume?: number } = {}) {
    if (!this.game || this.sfxVolume <= 0) return;
    const now = performance.now();
    if (key === 'type' && now - (this.lastPlay[key] ?? 0) < 25) return;
    this.lastPlay[key] = now;
    try {
      this.game.sound.play(key, { volume: this.sfxVolume * (opts.volume ?? 1), detune: opts.detune ?? 0, rate: opts.rate ?? 1 });
    } catch { /* audio locked */ }
  }

  private ensureCtx(): AudioContext | null {
    if (!this.ctx) return null;
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
    return this.ctx;
  }

  setAmbient(kind: 'rain' | 'river' | null) {
    if (kind === this.ambientKind) { this.updateAmbientGain(); return; }
    this.stopAmbient();
    this.ambientKind = kind;
    const ctx = this.ensureCtx();
    if (!ctx || !kind) return;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const w = Math.random() * 2 - 1;
      last = kind === 'river' ? last * 0.97 + w * 0.03 : w; // brown-ish for water
      d[i] = kind === 'river' ? last * 8 : w;
    }
    const src = ctx.createBufferSource();
    src.buffer = buf;
    src.loop = true;
    const filter = ctx.createBiquadFilter();
    filter.type = kind === 'rain' ? 'bandpass' : 'lowpass';
    filter.frequency.value = kind === 'rain' ? 2400 : 500;
    filter.Q.value = kind === 'rain' ? 0.4 : 0.7;
    // slow swell
    const lfo = ctx.createOscillator();
    const lfoGain = ctx.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = kind === 'rain' ? 500 : 150;
    lfo.connect(lfoGain).connect(filter.frequency);
    const gain = ctx.createGain();
    gain.gain.value = 0;
    src.connect(filter).connect(gain).connect(ctx.destination);
    src.start();
    lfo.start();
    this.ambientGain = gain;
    this.ambientNodes = [src, lfo];
    this.updateAmbientGain();
  }

  updateAmbientGain() {
    if (this.ambientGain && this.ctx) {
      const base = this.ambientKind === 'rain' ? 0.09 : 0.12;
      this.ambientGain.gain.setTargetAtTime(base * this.ambientVolume, this.ctx.currentTime, 0.5);
    }
  }

  stopAmbient() {
    for (const n of this.ambientNodes) { try { (n as AudioScheduledSourceNode).stop(); } catch { /* */ } n.disconnect(); }
    this.ambientNodes = [];
    this.ambientGain?.disconnect();
    this.ambientGain = null;
    this.ambientKind = null;
  }

  /** Procedural lo-fi loop: soft chords + vinyl crackle + lazy beat (radio upgrade). */
  setLofi(on: boolean) {
    if (!on) { this.lofi?.stop(); this.lofi = null; return; }
    if (this.lofi) return;
    const ctx = this.ensureCtx();
    if (!ctx) return;
    const out = ctx.createGain();
    out.gain.value = 0.05 * Math.max(0.2, this.ambientVolume) * 2;
    const lp = ctx.createBiquadFilter();
    lp.type = 'lowpass';
    lp.frequency.value = 1400;
    out.connect(lp).connect(ctx.destination);
    // Fmaj7 – Em7 – Dm7 – Cmaj7
    const chords = [[53, 57, 60, 64], [52, 55, 59, 62], [50, 53, 57, 60], [48, 52, 55, 59]];
    const bpm = 72, beat = 60 / bpm;
    let next = ctx.currentTime + 0.1;
    let bar = 0;
    const freq = (n: number) => 440 * Math.pow(2, (n - 69) / 12);
    const tone = (n: number, t: number, dur: number, vol: number, type: OscillatorType = 'triangle') => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = type;
      o.frequency.value = freq(n);
      o.detune.value = (Math.random() - 0.5) * 12;
      g.gain.setValueAtTime(0, t);
      g.gain.linearRampToValueAtTime(vol, t + 0.04);
      g.gain.exponentialRampToValueAtTime(0.001, t + dur);
      o.connect(g).connect(out);
      o.start(t);
      o.stop(t + dur + 0.05);
    };
    const noiseHit = (t: number, vol: number, f: number) => {
      const b = ctx.createBuffer(1, ctx.sampleRate * 0.1, ctx.sampleRate);
      const d = b.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / (d.length * 0.15));
      const s = ctx.createBufferSource();
      s.buffer = b;
      const fl = ctx.createBiquadFilter();
      fl.type = 'bandpass';
      fl.frequency.value = f;
      const g = ctx.createGain();
      g.gain.value = vol;
      s.connect(fl).connect(g).connect(out);
      s.start(t);
    };
    const schedule = () => {
      while (next < ctx.currentTime + 1.5) {
        const ch = chords[bar % 4];
        ch.forEach((n, i) => tone(n, next + i * 0.03, beat * 3.8, 0.25));
        tone(ch[0] - 12, next, beat * 2, 0.4, 'sine');
        tone(ch[0] - 12, next + beat * 2.5, beat * 1.2, 0.3, 'sine');
        for (let k = 0; k < 4; k++) {
          const t = next + k * beat;
          if (k % 2 === 0) tone(36, t, 0.25, 0.6, 'sine'); // kick-ish
          else noiseHit(t, 0.6, 1800); // snare-ish
          noiseHit(t + beat / 2, 0.15, 7000); // hat
        }
        if (bar % 2 === 1) tone(ch[3] + 12, next + beat * 1.5, beat * 1.5, 0.12, 'sine');
        next += beat * 4;
        bar++;
      }
    };
    schedule();
    const id = window.setInterval(schedule, 500);
    this.lofi = { stop: () => { clearInterval(id); out.gain.setTargetAtTime(0, ctx.currentTime, 0.2); setTimeout(() => out.disconnect(), 800); } };
  }
}
