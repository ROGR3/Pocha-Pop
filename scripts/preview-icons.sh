#!/usr/bin/env bash
# Preview one icon part (art/icons/<part>.lua) in isolation, scaled up, with a
# label strip. Does not touch public/assets.
#   bash scripts/preview-icons.sh <part> [outdir] [scale]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PART="$1"; OUT="${2:-/tmp/icon-preview}"; S="${3:-6}"
mkdir -p "$OUT"
ASEPRITE="${ASEPRITE_PATH:-}"
if [[ -z "$ASEPRITE" && -f "$ROOT/tools/aseprite-mcp/.env" ]]; then ASEPRITE="$(grep -E '^ASEPRITE_PATH=' "$ROOT/tools/aseprite-mcp/.env" | cut -d= -f2-)"; fi
"${ASEPRITE:-aseprite}" -b --script-param root="$ROOT" --script-param part="$PART" --script-param out="$OUT" --script "$ROOT/art/icons/_harness.lua" 2>&1 | grep -v '^$' || true
python3 - "$OUT/$PART.png" "$OUT/$PART.names" "$OUT/${PART}_x$S.png" "$S" <<'PY'
import sys
from PIL import Image, ImageDraw
im = Image.open(sys.argv[1]).convert('RGBA'); names = open(sys.argv[2]).read().split('\n'); s = int(sys.argv[4])
cols = im.width // 24; rows = (len(names) + cols - 1) // cols
cell = 24 * s + 8; lab = 14
out = Image.new('RGBA', (cols * cell, rows * (cell + lab)), (90, 105, 136, 255))
d = ImageDraw.Draw(out)
for i, n in enumerate(names):
    x, y = (i % cols) * 24, (i // cols) * 24
    t = im.crop((x, y, x + 24, y + 24)).resize((24 * s, 24 * s), Image.NEAREST)
    ox, oy = (i % cols) * cell + 4, (i // cols) * (cell + lab) + 4
    out.alpha_composite(t, (ox, oy))
    d.text((ox, oy + 24 * s + 1), n, fill=(255, 255, 255, 255))
out.save(sys.argv[3]); print(sys.argv[3])
PY
