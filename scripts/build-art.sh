#!/usr/bin/env bash
# Rebuild all pixel art: runs every art/src/*.lua through Aseprite in batch mode.
# Usage: npm run art            (all)
#        bash scripts/build-art.sh icons chef   (only art/src/icons.lua, art/src/chef.lua)
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ASEPRITE="${ASEPRITE_PATH:-}"
if [[ -z "$ASEPRITE" && -f "$ROOT/tools/aseprite-mcp/.env" ]]; then
  ASEPRITE="$(grep -E '^ASEPRITE_PATH=' "$ROOT/tools/aseprite-mcp/.env" | cut -d= -f2-)"
fi
ASEPRITE="${ASEPRITE:-aseprite}"
mkdir -p "$ROOT/public/assets"
if [[ $# -gt 0 ]]; then files=(); for n in "$@"; do files+=("$ROOT/art/src/$n.lua"); done
else files=("$ROOT"/art/src/*.lua); fi
for f in "${files[@]}"; do
  echo "== $(basename "$f")"
  "$ASEPRITE" -b --script-param root="$ROOT" --script "$f" 2>&1 | grep -v '^$' || true
done
