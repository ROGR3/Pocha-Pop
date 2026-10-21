#!/usr/bin/env bash
# Preview an exported PNG (sheet) scaled up for inspection: scripts/preview.sh name [scale]
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
S="${2:-8}"
OUT="${PREVIEW_DIR:-/tmp}/prev_$1.png"
python3 - "$ROOT/public/assets/$1.png" "$OUT" "$S" <<'PY'
import sys
from PIL import Image
im = Image.open(sys.argv[1]).convert('RGBA'); s = int(sys.argv[3])
bg = Image.new('RGBA', im.size, (90, 105, 136, 255)); bg.alpha_composite(im)
bg.resize((im.width*s, im.height*s), Image.NEAREST).save(sys.argv[2])
print(sys.argv[2])
PY
