import Phaser from 'phaser';
import { G, WORDS } from './game/state';
import * as levels from './data/levels';
import { Ime } from './game/ime';
import { imeStates, typeKorean } from './game/debug';
import { setupBack } from './game/back';
import { computeLayout, viewportSize } from './game/layout';
import { BootScene } from './scenes/Boot';
import { TitleScene } from './scenes/Title';
import { SetupScene } from './scenes/Setup';
import { StoryScene } from './scenes/Story';
import { MapScene } from './scenes/Map';
import { NightScene } from './scenes/Night';
import { ResultScene } from './scenes/Result';
import { ShopScene } from './scenes/Shop';
import { RecipesScene } from './scenes/Recipes';
import { SettingsScene } from './scenes/Settings';
import { PaintScene } from './scenes/Paint';

async function start() {
  const fonts = ['Galmuri11', 'Galmuri9', 'Galmuri7', 'Galmuri14'];
  await Promise.all(fonts.map((f) => document.fonts.load(`12px ${f}`, '가나ěščřžýáíéůú').catch(() => null)));
  await G.save.load();
  G.applyVolumes();
  G.ime = new Ime(document.getElementById('ime') as HTMLInputElement);

  const dpr = window.devicePixelRatio || 1;
  const vp = viewportSize();
  G.layout = computeLayout(vp.w, vp.h, dpr);

  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    width: G.layout.width,
    height: G.layout.height,
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    backgroundColor: '#181425',
    scale: { mode: Phaser.Scale.NONE, zoom: G.layout.scale / dpr },
    input: { activePointers: 2 },
    disableContextMenu: true,
    scene: [BootScene, TitleScene, SetupScene, StoryScene, MapScene, NightScene, ResultScene, ShopScene, RecipesScene, SettingsScene, PaintScene],
  });
  G.audio.attach(game);
  setupBack(game);

  let pending = 0;
  const relayout = () => {
    cancelAnimationFrame(pending);
    pending = requestAnimationFrame(() => {
      const d = window.devicePixelRatio || 1;
      const v = viewportSize();
      const L = computeLayout(v.w, v.h, d);
      const old = G.layout;
      G.layout = L;
      if (old && old.width === L.width && old.height === L.height && old.scale === L.scale) return;
      game.scale.resize(L.width, L.height);
      game.scale.setZoom(L.scale / d);
      game.events.emit('layout', L);
    });
  };
  window.addEventListener('resize', relayout);
  window.visualViewport?.addEventListener('resize', relayout);
  window.visualViewport?.addEventListener('scroll', () => window.scrollTo(0, 0));

  // Resume WebAudio on first gesture (autoplay policies)
  const unlock = () => { (game.sound as any).context?.resume?.(); };
  document.addEventListener('pointerdown', unlock);
  document.addEventListener('keydown', unlock);

  (window as any).__pocha = { G, game, typeKorean, imeStates, WORDS, levels };
}

start();
