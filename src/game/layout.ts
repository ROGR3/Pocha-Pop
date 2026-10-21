// Integer pixel-art scaling. The logical width stays around 270 px (216–320),
// the height follows the *visible* viewport (visualViewport → above the
// Android keyboard).

export interface Layout {
  width: number; // logical px
  height: number;
  scale: number; // device px per logical px (integer)
  cssWidth: number;
  cssHeight: number;
}

export const TARGET_W = 270;
export const MIN_W = 216;
export const MAX_W = 320;
/** Below this logical height the scale steps down (short, wide windows). */
export const MIN_H = 300;

export function viewportSize(): { w: number; h: number } {
  const vv = window.visualViewport;
  const w = vv ? vv.width : window.innerWidth;
  const h = vv ? vv.height : window.innerHeight;
  return { w: Math.max(1, w), h: Math.max(1, h) };
}

export function computeLayout(cssW: number, cssH: number, dpr: number): Layout {
  const physW = cssW * dpr;
  const physH = cssH * dpr;
  let scale = Math.max(1, Math.round(physW / TARGET_W));
  while (scale > 1 && (physW / scale < MIN_W || physH / scale < MIN_H)) scale--;
  const width = Math.min(MAX_W, Math.floor(physW / scale));
  const height = Math.max(200, Math.floor(physH / scale));
  return { width, height, scale, cssWidth: (width * scale) / dpr, cssHeight: (height * scale) / dpr };
}
