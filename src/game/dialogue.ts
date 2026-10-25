// Dialogue box with portrait + typewriter text. Tap / Enter / Space advances.
import Phaser from 'phaser';
import { NAMES, type Line } from '../data/story';
import { C, panel, txt } from './ui';
import { G } from './state';

const PORTRAIT: Record<string, { key: string; frame: number } | null> = {
  halmeoni: { key: 'char_halmeoni', frame: 5 },
  kim: { key: 'char_kim', frame: 0 },
  haeun: { key: 'char_haeun', frame: 5 },
  nabi: { key: 'nabi', frame: 4 },
  critic: { key: 'char_critic', frame: 0 },
  imo: { key: 'char_imo', frame: 5 },
  minsu: { key: 'char_minsu', frame: 0 },
  park: { key: 'char_park', frame: 0 },
  kang: { key: 'char_kang', frame: 2 },
  yaksa: { key: 'char_yaksa', frame: 5 },
  blogger: { key: 'char_blogger', frame: 5 },
  manager: { key: 'char_manager', frame: 2 },
  trader: { key: 'char_trader', frame: 3 },
  captain: { key: 'char_captain', frame: 0 },
  narrator: null,
};

export function playDialogue(scene: Phaser.Scene, lines: Line[], opts: { bottom?: number; depth?: number } = {}): Promise<void> {
  return new Promise((resolve) => {
    const W = scene.scale.width;
    const H = scene.scale.height;
    const bh = 74;
    const bottom = opts.bottom ?? H - 6;
    const y0 = Math.round(bottom - bh);
    const root = scene.add.container(0, 0).setDepth(opts.depth ?? 2000);
    // dim + catch taps
    const shade = scene.add.rectangle(0, 0, W, H, 0x181425, 0.55).setOrigin(0, 0).setInteractive();
    root.add(shade);
    const box = panel(scene, 6, y0, W - 12, bh);
    root.add(box);
    const portraitBg = scene.add.rectangle(12, y0 + 8, 40, 46, 0x3a4466).setOrigin(0, 0);
    root.add(portraitBg);
    const portrait = scene.add.sprite(32, y0 + 52, 'char_halmeoni', 0).setOrigin(0.5, 1);
    root.add(portrait);
    const name = txt(scene, 12, y0 + 57, '', { size: 's', color: C.yellow });
    root.add(name);
    const body = txt(scene, 58, y0 + 8, '', { size: 's', color: C.white, wrap: W - 74, lineSpacing: 2 });
    root.add(body);
    const more = txt(scene, W - 14, bottom - 10, '▼', { size: 's', color: C.orange, origin: [1, 1] });
    root.add(more);
    scene.tweens.add({ targets: more, y: more.y + 2, yoyo: true, repeat: -1, duration: 400 });
    root.setAlpha(0);
    scene.tweens.add({ targets: root, alpha: 1, duration: 160 });

    let i = -1;
    let full = '';
    let shown = 0;
    let timer: Phaser.Time.TimerEvent | null = null;
    const show = (k: number) => {
      const line = lines[k];
      const p = PORTRAIT[line.who];
      if (p) {
        portrait.setVisible(true).setTexture(p.key, p.frame);
        portraitBg.setVisible(true);
        body.setX(58).setWordWrapWidth(W - 74);
        name.setText(NAMES[line.who]);
        portrait.y = line.who === 'nabi' ? y0 + 46 : y0 + 52;
      } else {
        portrait.setVisible(false);
        portraitBg.setVisible(false);
        name.setText('');
        body.setX(14).setWordWrapWidth(W - 30);
      }
      full = line.text;
      shown = 0;
      body.setText('');
      timer?.remove();
      timer = scene.time.addEvent({
        delay: 22, loop: true, callback: () => {
          shown++;
          body.setText(full.slice(0, shown));
          if (shown % 3 === 0) G.audio.play('type', { volume: 0.5, detune: (shown % 5) * 60 });
          if (shown >= full.length) { timer?.remove(); timer = null; }
        },
      });
    };
    const advance = () => {
      if (timer) { timer.remove(); timer = null; body.setText(full); return; }
      i++;
      if (i >= lines.length) {
        cleanup();
        scene.tweens.add({ targets: root, alpha: 0, duration: 140, onComplete: () => { root.destroy(); resolve(); } });
        return;
      }
      G.audio.play('paper', { volume: 0.4 });
      show(i);
    };
    shade.on('pointerup', advance);
    const onKey = (e: KeyboardEvent) => { if (e.target === G.ime?.el) return; if (e.key === 'Enter' || e.key === ' ') advance(); };
    window.addEventListener('keydown', onKey);
    const prevImeKey = G.ime?.onKey;
    if (G.ime) G.ime.onKey = (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); advance(); G.ime.clear(); } };
    const cleanup = () => {
      window.removeEventListener('keydown', onKey);
      if (G.ime) G.ime.onKey = prevImeKey ?? null;
    };
    scene.events.once('shutdown', cleanup);
    advance();
  });
}
