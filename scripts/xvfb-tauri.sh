#!/usr/bin/env bash
# Run the Tauri desktop app in an isolated Xvfb display (no window on the real desktop).
# Usage: scripts/xvfb-tauri.sh start|stop|shot <file.png>|type <xdotool type args>|key <keysym>
# Data (tauri store) goes to a scratch XDG_DATA_HOME, never the real save.
set -euo pipefail
D=:99
RUN="${XVFB_RUN_DIR:-/tmp/pocha-xvfb}"
mkdir -p "$RUN/xdg"
case "${1:-}" in
  start)
    pgrep -f "Xvfb $D" >/dev/null || (Xvfb $D -screen 0 900x900x24 >/dev/null 2>&1 & sleep 1)
    cd "$(dirname "$0")/.."
    DISPLAY=$D GDK_BACKEND=x11 WAYLAND_DISPLAY= WEBKIT_DISABLE_COMPOSITING_MODE=1 WEBKIT_DISABLE_DMABUF_RENDERER=1 \
      GTK_IM_MODULE=fcitx XDG_DATA_HOME="$RUN/xdg" CARGO_BUILD_JOBS=4 \
      nohup npm run tauri dev > "$RUN/tauri.log" 2>&1 &
    for _ in $(seq 1 90); do DISPLAY=$D xdotool search --name "Pocha Pop" >/dev/null 2>&1 && break; sleep 1; done
    sleep 4; echo "window: $(DISPLAY=$D xdotool search --name 'Pocha Pop' | head -1)";;
  stop)
    # anchored patterns: never match an unrelated shell whose command line merely mentions these
    pkill -f '^target/debug/pocha-pop' || true
    pkill -f '^node [^ ]*node_modules/\.bin/(tauri|vite)' || true
    pkill -x Xvfb || true;;
  shot) DISPLAY=$D import -window root "$2";;
  focus) W=$(DISPLAY=$D xdotool search --name 'Pocha Pop' | head -1); DISPLAY=$D xdotool windowfocus "$W"; DISPLAY=$D xdotool mousemove 200 300 click 1;;
  type) shift; DISPLAY=$D xdotool type --delay 180 "$@";;
  key) DISPLAY=$D xdotool keydown "$2"; sleep 0.05; DISPLAY=$D xdotool keyup "$2";;
  *) echo "usage: $0 start|stop|shot f|focus|type s|key k"; exit 1;;
esac
