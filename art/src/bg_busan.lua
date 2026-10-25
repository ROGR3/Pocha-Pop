-- 부산 harbour at night, 320 wide, bottom = pier level.
--  bg_bsn_sky  320x200  extra sky above the far layer (1f)
--  bg_bsn_far  320x240  sky, hills, Marine City towers, lit Gwangan bridge (1f)
--  bg_bsn_mid  320x240  sea, crane, lighthouse, ferry, gulls (4f, tag loop)
--  bg_bsn_near 320x40   wooden pier with bollards and rope (4f, tag loop)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320

-- Gwangan bridge geometry (shared: the sea reflects its lights)
local DECK = 98
local T1, T2, TT = 126, 216, 56     -- tower x, tower top y
local BRIDGE_COLS = { "s", "s", "r", "C", "D", "C", "B", "C", "l", "k" }
local function cableY(x)
  if x >= T1 and x <= T2 then
    local t = (x - T1) / (T2 - T1)
    return math.floor(TT + (DECK - 3 - TT) * 4 * t * (1 - t) * 1.0 + 0.5)
  elseif x < T1 then
    local t = (T1 - x) / (T1 - 4)
    return math.floor(TT + (DECK - 2 - TT) * math.min(1, t ^ 0.8) + 0.5)
  else
    local t = (x - T2) / (316 - T2)
    return math.floor(TT + (DECK - 2 - TT) * math.min(1, t ^ 0.8) + 0.5)
  end
end
local function bridgeCol(x) return BRIDGE_COLS[(x // 9) % #BRIDGE_COLS + 1] end

-- ---------------------------------------------------------------- sky
do
  local H = 200
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(52)
  L.rect(img, 0, 0, W, H, "z")
  for _ = 1, 110 do
    local x, y = R(0, W - 1), R(0, H - 6)
    local r = R(0, 9)
    L.set(img, x, y, r == 0 and "t" or (r < 3 and "u" or (r < 6 and "v" or "w")))
  end
  -- crescent moon
  L.ebox(img, 244, 70, 259, 85, "c")
  L.ebox(img, 249, 67, 264, 82, "z")
  L.set(img, 246, 77, "E"); L.set(img, 248, 81, "E")
  -- long thin clouds
  for k = 1, 4 do
    local cx, cy = R(0, W), R(100, 175)
    for x = cx - 50, cx + 50 do
      local y = cy + math.floor(math.sin(x / 13) * 1.5)
      if (x + k) % 3 ~= 0 then L.set(img, x, y, "y") end
      if x % 2 == 0 and math.abs(x - cx) < 30 then L.set(img, x, y + 1, "y") end
    end
  end
  L.save(spr, "bg_bsn_sky")
end

-- ---------------------------------------------------------------- far
do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(53)
  L.vgradient(img, 0, 0, W, H, { { 0, "z" }, { 45, "y" }, { 95, "x" }, { 118, "B" } })
  for _ = 1, 50 do L.set(img, R(0, W - 1), R(0, 60), R(0, 3) == 0 and "u" or "w") end
  -- hills
  for x = 0, W - 1 do
    local top = math.floor(84 + math.sin(x / 23) * 6 + math.sin(x / 9 + 1) * 2)
    for y = top, H - 1 do L.set(img, x, y, L.dither(x, y, (y - top) / 14, "x", "y")) end
    if (x * 7) % 13 == 0 then L.set(img, x, top + 4 + (x % 5), "k") end
  end
  -- apartment towers (Marine City on the right, smaller blocks left)
  local function tower(x, w, top, col)
    for y = top, H - 1 do for xx = x, x + w - 1 do L.set(img, xx, y, (xx == x) and "w" or col) end end
    L.ebox(img, x, top - 3, x + w - 1, top + 3, col, { y1 = top })
    for wy = top + 3, DECK, 3 do
      for wx = x + 2, x + w - 3, 2 do
        local r = R(0, 9)
        if r < 3 then L.set(img, wx, wy, r == 0 and "l" or (r == 1 and "k" or "c")) end
      end
    end
    L.set(img, x + w // 2, top - 4, "A")
  end
  tower(232, 12, 36, "x"); tower(248, 15, 26, "y"); tower(266, 11, 44, "x"); tower(280, 14, 32, "y"); tower(298, 12, 50, "x")
  tower(8, 9, 66, "x"); tower(20, 8, 72, "y"); tower(56, 10, 70, "x")
  -- water band below the bridge (mid sea covers further down)
  L.vgradient(img, 0, DECK + 3, W, H - DECK - 3, { { DECK + 3, "x" }, { 140, "y" } })
  -- bridge deck
  L.hline(img, 0, W - 1, DECK, "v"); L.rect(img, 0, DECK + 1, W, 2, "x")
  for x = 0, W - 1, 3 do L.set(img, x, DECK - 1, "l") end
  for x = 1, W - 1, 6 do L.set(img, x, DECK + 2, "k") end
  -- piers
  for px = 20, W, 46 do L.rect(img, px, DECK + 3, 3, 12, "y"); L.vline(img, px, DECK + 3, DECK + 14, "x") end
  -- towers
  for _, tx in ipairs({ T1, T2 }) do
    L.rect(img, tx - 3, TT, 2, DECK + 14 - TT, "w"); L.rect(img, tx + 2, TT, 2, DECK + 14 - TT, "w")
    L.vline(img, tx - 3, TT, DECK + 13, "u"); L.vline(img, tx + 2, TT, DECK + 13, "u")
    for _, by in ipairs({ TT + 2, TT + 18, DECK + 3 }) do L.hline(img, tx - 1, tx + 1, by, "w") end
    L.set(img, tx - 3, TT - 1, "A"); L.set(img, tx + 3, TT - 1, "A")
    for y = TT + 4, DECK - 2, 4 do L.set(img, tx - 3, y, "s"); L.set(img, tx + 3, y, "s") end
  end
  -- hangers and main cables with LED lights
  for x = 0, W - 1 do
    local cy = cableY(x)
    if x % 4 == 0 then L.vline(img, x, cy + 1, DECK - 1, "x") end
  end
  for x = 0, W - 1 do
    local cy = cableY(x)
    L.set(img, x, cy, "w")
    if x % 2 == 0 then L.set(img, x, cy, bridgeCol(x)) end
  end
  L.save(spr, "bg_bsn_far")
end

-- ---------------------------------------------------------------- mid
do
  local H = 240
  local SEA = 112
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    -- sea with waves
    for y = SEA, H - 1 do
      local t = (y - SEA) / (H - SEA)
      local dir = ((y // 3) % 2 == 0) and 1 or -1
      for x = 0, W - 1 do
        local c = L.dither(x, y, math.min(1, t * 1.6), "x", "y")
        local ph = (x + dir * f * 2 + (y * 7) % 23) % (14 + (y % 5) * 3)
        if y % 3 == 0 and ph < 3 + math.floor(t * 3) then c = (t < 0.3) and "w" or "x" end
        if y % 3 == 0 and ph == 0 and t < 0.6 then c = "q" end
        L.set(img, x, y, c)
      end
    end
    L.hline(img, 0, W - 1, SEA, "w")
    -- reflections of the bridge lights (broken, wobbling columns)
    for x = 0, W - 1, 2 do
      for y = SEA + 1, SEA + 60 do
        local wob = math.floor(math.sin(y * 0.9 + f * 1.6 + x) * 1.5)
        local fade = (y - SEA) / 60
        if (y + f + x // 2) % 3 == 0 and L.dither(x, y, fade, 1, 0) == 1 then
          L.set(img, x + wob, y, bridgeCol(x))
        end
      end
    end

    -- ======== container crane (left of centre)
    local function truss(x0, x1, y0, y1, c1, c2)
      L.hline(img, x0, x1, y0, c1); L.hline(img, x0, x1, y1, c2)
      for x = x0, x1 - 4, 4 do L.line(img, x, y1, x + 2, y0, c2); L.line(img, x + 2, y0, x + 4, y1, c2) end
    end
    -- containers stacked on the quay (behind crane legs)
    local CC = { { "i", "h" }, { "r", "q" }, { "n", "o" }, { "j", "a" }, { "C", "B" }, { "v", "w" }, { "k", "j" } }
    local CR = L.rng(4)
    for row = 0, 3 do
      local cx = 34 + row * 3
      while cx < 140 do
        local w = CR(0, 1) == 0 and 14 or 26
        local col = CC[CR(1, #CC)]
        local cy = 196 - row * 9
        L.rect(img, cx, cy, w, 9, col[2]); L.rect(img, cx, cy, w - 1, 8, col[1])
        for k = cx + 1, cx + w - 2, 2 do L.vline(img, k, cy + 1, cy + 7, col[2]) end
        L.hline(img, cx, cx + w - 2, cy, "t")
        cx = cx + w + CR(0, 3)
      end
    end
    L.rect(img, 28, 205, 120, 35, "w"); L.hline(img, 28, 147, 205, "u"); L.rect(img, 28, 207, 120, 33, "x")
    for x = 30, 146, 8 do L.set(img, x, 206, (x // 8 + f) % 4 == 0 and "l" or "k") end
    -- legs
    for _, lx in ipairs({ 68, 108 }) do
      L.rect(img, lx, 40, 4, 166, "h"); L.vline(img, lx, 40, 205, "i")
      L.rect(img, lx - 3, 200, 10, 5, "x")
    end
    for y = 60, 120, 30 do L.line(img, 72, y, 107, y + 30, "h"); L.line(img, 107, y, 72, y + 30, "h") end
    L.rect(img, 68, 56, 44, 3, "h"); L.hline(img, 68, 111, 56, "i")
    -- boom
    truss(36, 166, 36, 42, "i", "h")
    L.rect(img, 160, 34, 7, 10, "h")
    -- A-frame + stays
    L.line(img, 76, 36, 90, 12, "h"); L.line(img, 104, 36, 90, 12, "h"); L.line(img, 77, 36, 91, 12, "i")
    L.line(img, 90, 12, 164, 34, "w"); L.line(img, 90, 12, 38, 35, "w")
    -- machine house
    L.rect(img, 80, 26, 22, 10, "u"); L.hline(img, 80, 101, 26, "t"); L.rect(img, 80, 34, 22, 2, "v")
    L.rect(img, 84, 29, 4, 3, "k"); L.rect(img, 91, 29, 4, 3, "k")
    -- trolley + spreader
    L.rect(img, 140, 43, 8, 3, "w")
    L.vline(img, 141, 46, 58, "v"); L.vline(img, 146, 46, 58, "v")
    L.rect(img, 134, 59, 20, 3, "k"); L.hline(img, 134, 153, 59, "l")
    -- container hanging from the spreader
    L.rect(img, 135, 62, 18, 8, "q"); L.rect(img, 135, 62, 17, 7, "r")
    for k = 136, 151, 2 do L.vline(img, k, 63, 68, "q") end
    -- warning lights
    local on = (f == 1 or f == 3)
    L.set(img, 90, 11, on and "A" or "h"); L.set(img, 166, 33, on and "h" or "A"); L.set(img, 37, 35, on and "A" or "h")
    -- flag on the A-frame
    L.vline(img, 90, 2, 11, "v")
    local flags = {
      { "####..", "#####.", "####.." },
      { "###...", "#####.", "#####." },
      { "####..", "######", "###..." },
      { "#####.", "#####.", "##...." },
    }
    for j, row in ipairs(flags[f]) do
      for i = 1, #row do
        if row:sub(i, i) == "#" then L.set(img, 90 + i, 2 + j, (j == 2) and "t" or "q") end
      end
    end

    -- ======== lighthouse on a breakwater (left)
    for x = -2, 70 do
      local top = 152 + math.floor(math.sin(x / 3.3) * 1.5)
      for y = top, 172 do L.set(img, x, y, (y == top) and "v" or L.dither(x, y, (y - top) / 20, "w", "x")) end
    end
    -- tetrapods
    for _, tx in ipairs({ 8, 20, 52, 62 }) do
      L.map(img, tx, 147, { "..u..", ".uvw.", "vwvwx", ".x.x." })
    end
    L.rect(img, 29, 144, 22, 8, "v"); L.hline(img, 29, 50, 144, "u")
    for y = 72, 143 do
      local half = 5 + math.floor((y - 72) / 24)
      for x = 40 - half, 40 + half do
        local band = ((y - 72) // 12) % 2 == 1
        local c = band and "t" or "i"
        if x >= 40 + half - 1 then c = band and "u" or "h" end
        if x == 40 - half then c = band and "t" or "D" end
        L.set(img, x, y, c)
      end
    end
    L.rect(img, 38, 100, 4, 6, "z"); L.rect(img, 38, 124, 4, 6, "z")
    -- gallery + lantern
    L.hline(img, 32, 48, 71, "z"); L.hline(img, 32, 48, 70, "w")
    for x = 32, 48, 2 do L.set(img, x, 69, "w") end
    L.rect(img, 35, 61, 11, 8, "z")
    local lit = (f == 1 or f == 2)
    L.rect(img, 36, 62, 9, 6, lit and "l" or "x")
    if lit then L.rect(img, 38, 63, 5, 4, "t") end
    L.vline(img, 40, 62, 67, "z")
    L.ebox(img, 34, 56, 46, 62, "h", { y1 = 60 }); L.hline(img, 35, 45, 57, "i")
    L.vline(img, 40, 52, 55, "w")
    -- beam
    if lit then
      local bimg = Image(W, H, ColorMode.RGB)
      local dirs = (f == 1) and { 1 } or { -1 }
      for _, d in ipairs(dirs) do
        local len = (d == 1) and 110 or 40
        for i = 1, len do
          local x = 40 + d * (6 + i)
          local spread = math.floor(i * 0.18)
          for dy = -spread, spread do
            local t = i / len * 0.9 + math.abs(dy) / (spread + 2) * 0.4
            if L.dither(x, 64 + dy, t, 1, 0) == 1 and (i < 16 or (x + dy) % 2 == 0) then L.set(bimg, x, 64 + dy, i < 12 and "l" or "k") end
          end
        end
      end
      img:drawImage(bimg, Point(0, 0))
    end

    -- ======== ferry at the quay (right)
    local FX = 186
    -- hull
    for x = FX, 318 do
      local bottom = 150
      local top = 126
      if x > 296 then top = 126 + math.floor((x - 296) * 0.3); bottom = 150 - math.floor((x - 296) * 1.0) end
      for y = top, bottom do
        local c = "u"
        if y == top then c = "t" elseif y >= bottom - 4 then c = "x" elseif y >= 138 and y <= 140 then c = "q" end
        if y > top and y < bottom - 4 and x == FX then c = "v" end
        L.set(img, x, y, c)
      end
    end
    for x = FX + 6, 262, 7 do L.ebox(img, x, 130, x + 2, 132, "y") end
    L.text(img, 272, 129, "부산", "q", { step = 9 })
    -- decks
    L.rect(img, 196, 112, 94, 14, "u"); L.hline(img, 196, 289, 112, "t"); L.hline(img, 196, 289, 125, "v")
    for x = 199, 286, 6 do L.rect(img, x, 116, 4, 5, ((x // 6 + f) % 7 == 0) and "l" or "k") end
    L.rect(img, 210, 100, 70, 12, "c"); L.hline(img, 210, 279, 100, "t"); L.hline(img, 210, 279, 111, "u")
    for x = 213, 276, 5 do L.rect(img, x, 103, 3, 4, "k") end
    L.rect(img, 250, 90, 32, 10, "u"); L.hline(img, 250, 281, 90, "t")
    L.rect(img, 253, 93, 26, 3, "s"); L.hline(img, 253, 278, 95, "q")
    -- railings
    for x = 196, 289, 2 do L.set(img, x, 111, "t") end
    -- funnel
    L.rect(img, 230, 82, 12, 18, "i"); L.vline(img, 241, 82, 99, "h"); L.vline(img, 230, 82, 99, "D")
    L.rect(img, 230, 88, 12, 3, "t"); L.hline(img, 230, 241, 82, "z")
    -- smoke puffs drifting
    for k = 0, 2 do
      local sx = 234 - k * 7 - f * 2
      local sy = 76 - k * 6 - (f % 2)
      L.ebox(img, sx, sy, sx + 5 + k, sy + 3, (k == 0) and "v" or "w")
    end
    -- mast + flag + lights
    L.vline(img, 274, 72, 89, "v"); L.hline(img, 271, 277, 77, "v")
    L.set(img, 274, 71, (f % 2 == 1) and "t" or "l")
    L.set(img, 271, 77, "A"); L.set(img, 277, 77, "m")
    local mflag = {
      { "#####", "####.", "###.." },
      { "####.", "#####", "####." },
      { "###..", "#####", "#####" },
      { "####.", "####.", "#####" },
    }
    for j, row in ipairs(mflag[f]) do
      for i = 1, #row do if row:sub(i, i) == "#" then L.set(img, 274 + i, 71 + j, (j == 2) and "t" or "i") end end
    end
    -- ferry reflection
    for y = 152, 190, 2 do
      local wob = math.floor(math.sin(y * 0.6 + f * 1.7) * 2)
      for x = FX + 4, 310, 6 do
        if (x // 6 + y // 2) % 3 == 0 then L.hline(img, x + wob, x + wob + 1, y, ((x // 6 + y) % 5 == 0) and "k" or "w") end
      end
    end
    -- mooring line from the ferry bow down
    L.line(img, 300, 128, 318, 200, "e")
    -- quay on the far right
    L.rect(img, 296, 196, 26, 44, "w"); L.hline(img, 296, 321, 196, "u"); L.rect(img, 296, 198, 26, 42, "x")
    L.rect(img, 304, 190, 6, 6, "y"); L.hline(img, 303, 310, 190, "w")

    -- ======== gulls
    local gulls = { { 150, 54 }, { 182, 30 }, { 46, 98 }, { 280, 60 }, { 120, 84 } }
    for i, g in ipairs(gulls) do
      local x = g[1] + ((f + i) % 4) * 2 - 3
      local y = g[2] + (((f + i) % 2 == 0) and 1 or 0)
      if (f + i) % 2 == 0 then
        L.map(img, x, y, { "t...t", ".u.u.", "..t.." })
      else
        L.map(img, x, y, { ".....", "uu.uu", "..t.." })
      end
    end
  end
  L.durations(spr, 320)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_bsn_mid")
end

-- ---------------------------------------------------------------- near (pier)
do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(17)
    -- edge beam
    L.hline(img, 0, W - 1, 0, "E"); L.rect(img, 0, 1, W, 2, "F"); L.hline(img, 0, W - 1, 3, "f")
    -- planks
    for y = 4, H - 1 do
      local row = (y - 4) // 5
      local ry = (y - 4) % 5
      local off = (row * 37) % 60
      for x = 0, W - 1 do
        local base = (row % 3 == 0) and "e" or ((row % 3 == 1) and "F" or "e")
        local c = base
        if ry == 0 then c = (base == "F") and "d" or "F" end
        if ry == 4 then c = "g" end
        if (x + off) % 60 == 0 then c = "g" end
        if ry == 2 and ((x + off) % 60 == 3 or (x + off) % 60 == 57) then c = "z" end
        if c == base and L.dither(x, y, (y - 4) / 70, 0, 1) == 1 then c = "f" end
        L.set(img, x, y, c)
      end
    end
    -- grain
    for _ = 1, 70 do local x, y = R(0, W - 6), R(5, H - 1); if (y - 4) % 5 ~= 4 then L.hline(img, x, x + R(2, 5), y, "f") end end
    -- wet shine sliding along the planks
    for k = 0, 5 do
      local sx = (k * 61 + f * 6) % W
      local sy = 6 + (k * 7) % 28
      if (sy - 4) % 5 ~= 4 then L.hline(img, sx, sx + 3, sy, "E"); L.set(img, sx + 1, sy, "c") end
    end
    -- bollards
    local function bollard(x, y)
      L.rect(img, x - 1, y + 9, 12, 3, "z")
      L.rect(img, x + 1, y + 2, 8, 9, "x"); L.vline(img, x + 2, y + 2, y + 10, "w"); L.vline(img, x + 8, y + 2, y + 10, "y")
      L.ebox(img, x - 1, y - 1, x + 10, y + 3, function(nx) if nx < -0.3 then return "v" end return "w" end)
      L.hline(img, x + 2, x + 7, y, "u")
    end
    bollard(30, 4); bollard(280, 6)
    -- rope: tied round the bollards, coiled and draped over the edge
    local function rope(points, code, hi)
      for i = 1, #points - 1 do
        local a, b = points[i], points[i + 1]
        L.line(img, a[1], a[2], b[1], b[2], code)
        L.line(img, a[1], a[2] + 1, b[1], b[2] + 1, hi)
      end
    end
    rope({ { 31, 8 }, { 40, 9 }, { 39, 11 }, { 31, 11 } }, "d", "e")
    local sway = (f % 2 == 0) and 1 or 0
    rope({ { 40, 10 }, { 48, 4 + sway }, { 60, 2 }, { 70, 0 } }, "d", "e")
    rope({ { 281, 10 }, { 290, 11 }, { 289, 13 }, { 281, 13 } }, "d", "e")
    rope({ { 279, 12 }, { 268, 6 + sway }, { 255, 1 } }, "d", "e")
    -- coil
    L.ebox(img, 296, 20, 312, 28, "e"); L.ebox(img, 298, 21, 310, 27, "d"); L.ebox(img, 301, 23, 307, 25, "f")
    L.ebox(img, 302, 23, 306, 25, "e")
    -- lamp glow on the planks
    for x = 0, W - 1 do if (x * 5 + f * 3) % 17 == 0 then L.set(img, x, 1, "c") end end
  end
  L.durations(spr, 300)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_bsn_near")
end
