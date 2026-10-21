#!/usr/bin/env python3
"""Subset Galmuri fonts to WOFF (zlib) for the game.

WebKitGTK on Arch is built without libwoff2, so woff2 web fonts silently fall
back to a system font in the Tauri window. WOFF v1 works everywhere.
Keeps Latin (+Czech), punctuation/symbols, Hangul compatibility jamo and all
11 172 Hangul syllables (the player may type any syllable).
Run: python3 scripts/build-fonts.py   (needs fontTools)
"""
import os
from fontTools import subset

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RANGES = [(0x20, 0x7E), (0xA0, 0x17F), (0x2010, 0x2027), (0x2030, 0x203A), (0x2190, 0x2193), (0x2212, 0x2212),
          (0x2605, 0x2606), (0x2665, 0x2665), (0x25B2, 0x25BC), (0x3000, 0x303F), (0x3130, 0x318F),
          (0xAC00, 0xD7A3), (0xFF01, 0xFF5E), (0xB7, 0xB7), (0x2022, 0x2022)]
cps = [c for a, b in RANGES for c in range(a, b + 1)]
for name in ['Galmuri11', 'Galmuri9', 'Galmuri7', 'Galmuri14']:
    opts = subset.Options()
    opts.flavor = 'woff'
    opts.layout_features = ['*']
    font = subset.load_font(os.path.join(ROOT, 'node_modules/galmuri/dist', name + '.ttf'), opts)
    s = subset.Subsetter(opts)
    s.populate(unicodes=cps)
    s.subset(font)
    out = os.path.join(ROOT, 'public/fonts', name + '.woff')
    subset.save_font(font, out, opts)
    print(name, os.path.getsize(out))
