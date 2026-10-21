#!/usr/bin/env bash
# App icons (desktop + Android adaptive) from the 64x64 Aseprite icon.
set -euo pipefail
cd "$(dirname "$0")/.."
python3 -c "
from PIL import Image
im = Image.open('public/assets/appicon.png').convert('RGBA')
im.resize((1024, 1024), Image.NEAREST).save('art/appicon-1024.png')
"
npx tauri icon art/appicon-1024.png
