-- 홍대 club / indie street at night, 3 parallax layers + sky, 320 wide.
--  bg_hgd_sky  320x200  extra sky above far (1f)
--  bg_hgd_far  320x240  purple-pink haze, skyline (1f)
--  bg_hgd_mid  320x240  graffiti walls, club, 홍대 neon, spotlights, busker gear (4f, tag loop)
--  bg_hgd_near 320x40   asphalt with paint marks, flyers, neon reflections (4f, tag loop)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320

-- hand-drawn 2x syllables where the scaled 7x7 glyph turns into a blob
local BIG = {
  ["홍"] = { ".....###.....", "..#########..", ".............", "....#####....", "...##...##...", "....#####....",
             "......#......", "#############", ".............", "....#####....", "...##...##...", "...##...##...", "....#####...." },
}
local function bigtext(img, x, y, str, code, step)
  local i = 0
  for _, cp in utf8.codes(str) do
    local ch = utf8.char(cp)
    if BIG[ch] then
      L.map(img, x + i * step, y, BIG[ch], { sub = { ["#"] = code } })
    else
      L.text(img, x + i * step, y, ch, code, { scale = 2 })
    end
    i = i + 1
  end
end

-- ---------------------------------------------------------------- sky
do
  local spr = L.new(W, 200, 1)
  local img = L.img(spr, 1)
  local R = L.rng(61)
  L.rect(img, 0, 0, W, 200, "z")
  for _ = 1, 50 do
    local r = R(0, 9)
    L.set(img, R(0, W - 1), R(0, 190), r == 0 and "u" or (r < 3 and "v" or "w"))
  end
  -- thin purple cloud wisps
  for k = 1, 6 do
    local cx, cy = R(0, W), R(40, 180)
    local len = R(30, 70)
    for x = cx - len, cx + len do
      local y = cy + math.floor(math.sin(x / 11 + k) * 1.5)
      if (x + k) % 3 ~= 0 then L.set(img, x, y, k % 2 == 0 and "B" or "y") end
      if math.abs(x - cx) < len * 0.5 and x % 2 == 0 then L.set(img, x, y + 1, "y") end
    end
  end
  L.save(spr, "bg_hgd_sky")
end

-- ---------------------------------------------------------------- far
do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(63)
  L.vgradient(img, 0, 0, W, H, { { 0, "z" }, { 60, "y" }, { 130, "B" }, { 195, "C" }, { 239, "D" } })
  for _ = 1, 25 do L.set(img, R(0, W - 1), R(0, 60), R(0, 3) == 0 and "u" or "w") end
  -- back row of towers (lighter, hazy) then front row (dark)
  for row = 1, 2 do
    local x = R(-10, 0)
    while x < W do
      local w = R(12, 28)
      local top = row == 1 and R(50, 100) or R(90, 140)
      local body, edge = row == 1 and "B" or "y", row == 1 and "C" or "B"
      if row == 1 then body, edge = "x", "B" end
      for yy = top, H - 1 do
        for xx = x, math.min(W - 1, x + w - 1) do L.set(img, xx, yy, xx == x and edge or body) end
      end
      for wy = top + 4, H - 6, 5 do
        for wx = x + 2, x + w - 3, 4 do
          local r = R(0, 16)
          if r < 3 then L.rect(img, wx, wy, 2, 2, ({ "D", "s", "l" })[r + 1]) end
        end
      end
      -- LED billboard on some front towers
      if row == 2 and w > 18 and R(0, 1) == 0 then
        L.rect(img, x + 2, top + 6, w - 4, 10, "z")
        for k = 0, w - 7 do L.vline(img, x + 3 + k, top + 7 + (k % 3), top + 14, ({ "C", "D", "s" })[k % 3 + 1]) end
      end
      if R(0, 2) == 0 then L.vline(img, x + math.floor(w / 2), top - 6, top - 1, edge); L.set(img, x + math.floor(w / 2), top - 7, "A") end
      x = x + w + R(1, 8)
    end
  end
  -- pink haze over the base
  for yy = 180, H - 1 do for xx = 0, W - 1 do
    if L.dither(xx, yy, (yy - 180) / 120, 0, 1) == 1 then L.set(img, xx, yy, "C") end
  end end
  L.save(spr, "bg_hgd_far")
end

-- ---------------------------------------------------------------- mid
do
  local H = 240
  local spr = L.new(W, H, 4)

  -- graffiti piece: 2x hangul letters, two-tone fill, shine, double outline, drips
  local function graffiti(img, x, y, str, top, bot, out2, step)
    local tmp = Image(W, H, ColorMode.RGB)
    bigtext(tmp, x, y, str, "t", step or 16)
    for yy = y, y + 14 do for xx = x, x + 60 do
      if L.isOpaque(tmp, xx, yy) then
        local c = (yy - y < 6) and top or ((yy - y < 8) and L.dither(xx, yy, 0.5, top, bot) or bot)
        if not L.isOpaque(tmp, xx, yy - 1) and (xx % 3 ~= 0) then c = "t" end
        L.set(tmp, xx, yy, c)
      end
    end end
    L.outline(tmp, "z", true)
    L.outline(tmp, out2)
    -- drips under the piece
    local R = L.rng(#str + x)
    for k = 1, 5 do
      local dx = x + R(2, (step or 16) * 2)
      for yy = y + 13, y + 18 do
        if not L.isOpaque(tmp, dx, yy) then
          if L.isOpaque(tmp, dx, yy - 1) then L.vline(tmp, dx, yy, yy + R(1, 5), out2) end
          break
        end
      end
    end
    -- sparkle
    L.map(tmp, x - 3, y - 4, { ".t.", "ttt", ".t." })
    img:drawImage(tmp, Point(0, 0))
  end

  -- scribbled tag (random walk)
  local function tag(img, x, y, w, col, seed)
    local R = L.rng(seed)
    local cx, cy = x, y
    for _ = 1, w * 2 do
      L.set(img, cx, cy, col)
      cx = cx + R(0, 1); cy = math.max(y - 4, math.min(y + 3, cy + R(-1, 1)))
      if cx > x + w then break end
    end
    L.hline(img, x, x + w, y + 5, col)
  end

  local function poster(img, x, y, c1, c2, R)
    L.rect(img, x, y, 8, 11, c1)
    L.rect(img, x + 1, y + 1, 6, 5, c2)
    L.hline(img, x + 1, x + 6, y + 7, "z"); L.hline(img, x + 1, x + 4, y + 9, "z")
    L.set(img, x + R(1, 6), y + R(1, 5), "t")
  end

  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(67)

    -- spotlights from the club roof sweeping the sky (drawn first, behind buildings)
    local angles = { { -0.55, -0.25, 0.05, 0.25 }, { 0.5, 0.25, -0.05, -0.3 } }
    local beamCols = { "C", "s" }
    for b = 1, 2 do
      local bx, by = b == 1 and 112 or 214, 100
      local a = angles[b][f]
      for y = by - 1, 4, -1 do
        local d = by - y
        local cx = bx + math.floor(a * d + 0.5)
        local half = math.floor(1 + d * 0.07)
        local fade = 1 - d / 100
        for x = cx - half, cx + half do
          local core = math.abs(x - cx) <= math.max(0, half - 3)
          local dens = (core and 0.7 or 0.35) * fade
          if dens > 0 and L.dither(x, y, dens, 0, 1) == 1 then L.set(img, x, y, beamCols[b]) end
        end
      end
    end

    local function building(x0, x1, top, wall, edge, trim, floor, winCols)
      for y = top, H - 1 do
        for x = x0, x1 do
          local c = wall
          if (y - top) % floor == 0 then c = trim end
          if x == x0 or x == x1 then c = edge end
          L.set(img, x, y, c)
        end
      end
      L.hline(img, x0, x1, top, trim)
      for fy = top + 6, H - 60, floor do
        for wx = x0 + 5, x1 - 12, 14 do
          L.rect(img, wx, fy, 9, 11, "z")
          local lit = R(0, 4)
          if lit > 0 then
            L.rect(img, wx + 1, fy + 1, 7, 9, winCols[lit])
            L.vline(img, wx + 4, fy + 1, fy + 9, "z")
            if lit == 1 then L.rect(img, wx + 1, fy + 1, 3, 2, "t") end
          end
        end
      end
    end

    -- left brick block (graffiti), right club building, low centre row
    building(-2, 74, 34, "f", "g", "e", 24, { "k", "D", "C", "w" })
    -- brick texture on left block
    for y = 36, H - 1, 3 do for x = 0, 73 do
      if (x + (y // 3 % 2) * 3) % 6 == 0 and img:getPixel(x, y) == L.c("f") then L.set(img, x, y, "g") end
    end end
    building(76, 246, 104, "y", "z", "x", 30, { "D", "C", "s", "w" })
    building(248, 322, 22, "x", "y", "B", 24, { "C", "s", "D", "w" })

    -- roof railing of centre row
    for x = 78, 244, 4 do L.vline(img, x, 98, 103, "x") end
    L.hline(img, 76, 246, 98, "x")
    -- searchlight housings
    for _, sx in ipairs({ 112, 214 }) do
      L.rect(img, sx - 3, 99, 7, 5, "w"); L.rect(img, sx - 2, 98, 5, 2, "u"); L.set(img, sx, 98, "t")
    end
    -- big rooftop 홍대 neon, pulsing
    local pulse = ({ "D", "C", "D", "t" })[f]
    local halo = ({ "C", "B", "C", "D" })[f]
    L.vline(img, 146, 92, 98, "w"); L.vline(img, 176, 92, 98, "w")
    L.rect(img, 140, 72, 42, 21, "z"); L.rect(img, 141, 73, 40, 19, "y")
    bigtext(img, 145, 77, "홍대", halo, 17)
    bigtext(img, 144, 76, "홍대", pulse, 17)
    L.hline(img, 140, 181, 71, halo); L.hline(img, 140, 181, 93, halo)

    -- graffiti on the left block, high up (visible above the stall)
    graffiti(img, 32, 44, "홍대", "l", "j", "C", 17)
    graffiti(img, 27, 76, "라이브", "s", "r", "B", 16)
    tag(img, 30, 104, 22, "m", 3)
    tag(img, 6, 110, 16, "t", 4)
    -- poster wall
    local pc = { { "l", "i" }, { "t", "q" }, { "D", "B" }, { "s", "z" }, { "k", "h" }, { "m", "o" } }
    for i = 0, 5 do poster(img, 6 + i * 10, 124 + (i % 2) * 3, pc[i + 1][1], pc[i + 1][2], R) end
    for i = 0, 3 do poster(img, 28 + i * 10, 140 + (i % 2) * 2, pc[(i + 2) % 6 + 1][1], pc[(i + 2) % 6 + 1][2], R) end

    -- busker corner (left, street level): 라이브 sign, speakers, mic stand
    L.rect(img, 26, 172, 30, 12, "z")
    L.neon(img, 29, 174, "라이브", f % 2 == 1 and "l" or "k", "j", { step = 8 })
    local function speaker(x, y, w, h)
      L.rect(img, x, y, w, h, "z"); L.rect(img, x + 1, y + 1, w - 2, h - 2, "y")
      local bump = (f % 2 == 0) and 1 or 0
      L.ebox(img, x + 2, y + 2, x + w - 3, y + w - 3, function(nx, ny) return (nx * nx + ny * ny < 0.25 + bump * 0.1) and "x" or "w" end)
      L.ebox(img, x + 3, y + w, x + w - 4, y + h - 3, "w")
    end
    speaker(26, 206, 12, 22); speaker(26, 228, 12, 12); speaker(40, 214, 10, 18)
    L.vline(img, 56, 200, 239, "v"); L.line(img, 56, 239, 52, 239, "v"); L.line(img, 56, 239, 60, 239, "v")
    L.line(img, 56, 200, 60, 196, "v"); L.rect(img, 60, 194, 2, 3, "w")
    -- music notes from the speakers
    local ny = 198 - f * 3
    L.map(img, 42, ny, { "..zz", "..z.", "zzz.", "zz.." }, { sub = { z = "s" } })

    -- right club: equalizer LED sign + entrance
    L.rect(img, 258, 30, 28, 40, "z")
    for k = 0, 5 do
      local hgt = ({ 6, 14, 22, 30, 18, 10 })[((k + f * 2) % 6) + 1]
      for j = 0, hgt - 1, 2 do
        local c = j > 22 and "A" or (j > 14 and "l" or "m")
        L.hline(img, 261 + k * 4, 263 + k * 4, 67 - j, c)
      end
    end
    -- door with pulsing neon frame
    local fc = ({ "C", "D", "A", "D" })[f]
    L.rect(img, 266, 196, 34, 44, fc); L.rect(img, 268, 198, 30, 42, "z")
    L.rect(img, 270, 200, 26, 40, "B"); L.rect(img, 272, 202, 22, 38, "y")
    L.vline(img, 283, 202, 239, "z"); L.rect(img, 280, 220, 2, 3, "u"); L.rect(img, 285, 220, 2, 3, "u")
    -- small sign above the door
    L.rect(img, 264, 184, 38, 10, "z")
    for k = 0, 2 do
      L.map(img, 272 + k * 9, 186, { "..XX", "..X.", "XXX.", "XX.." }, { sub = { X = ((k + f) % 2 == 0) and fc or "w" } })
    end
    -- rope stanchions
    for _, sx in ipairs({ 254, 312 }) do L.vline(img, sx, 226, 239, "k"); L.set(img, sx, 225, "l") end
    for x = 255, 265 do L.set(img, x, 228 + math.floor(math.sin((x - 255) / 10 * math.pi) * 3), "h") end
    -- posters next to the door
    for i = 0, 2 do poster(img, 302 + (i % 2) * 9, 150 + i * 14, pc[i + 3][1], pc[i + 3][2], R) end
    graffiti(img, 256, 112, "홍대", "D", "C", "m", 17)
    tag(img, 258, 140, 24, "l", 7)

    -- wires across the street with little pennants
    for k = 0, 1 do
      local y0 = 40 + k * 12
      for x = 74, 248 do
        local t = (x - 74) / 174
        local y = y0 + math.floor(12 * 4 * t * (1 - t))
        L.set(img, x, y, "z")
        if k == 0 and (x - 74) % 8 == 2 then
          local c = ({ "A", "l", "s", "m", "C" })[((x - 74) // 8) % 5 + 1]
          local sway = ((x // 8 + f) % 2)
          L.set(img, x, y + 1, c); L.set(img, x + 1, y + 1, c); L.set(img, x + sway, y + 2, c)
        end
      end
    end
  end
  L.durations(spr, 260)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_hgd_mid")
end

-- ---------------------------------------------------------------- near (asphalt)
do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(69)
    for y = 0, H - 1 do for x = 0, W - 1 do L.set(img, x, y, L.dither(x, y, 0.25 + y / 80, "y", "z")) end end
    L.hline(img, 0, W - 1, 0, "x")
    L.rect(img, 0, 1, W, 2, "w"); L.hline(img, 0, W - 1, 3, "x")
    -- painted marks: dashed line, a yellow arrow, worn zebra
    for x = 0, W - 1, 16 do L.hline(img, x, x + 8, 30, "v") end
    L.map(img, 150, 20, { "..l...", ".lll..", "lllll.", "..l...", "..l...", "..l..." })
    for x = 4, 60, 8 do L.rect(img, x, 8, 4, 14, "w") end
    for x = 260, 316, 8 do L.rect(img, x, 8, 4, 14, "w") end
    -- neon reflections (cycle colours)
    local refl = { { 30, "l" }, { 120, "C" }, { 214, "s" }, { 282, "D" } }
    for i, p in ipairs(refl) do
      for y = 6, 20 do
        local w = 3 + ((y + f + i) % 3)
        for x = p[1] - w, p[1] + w do
          if (x + y + f) % 3 == 0 then L.set(img, x, y, p[2]) end
        end
      end
    end
    -- scattered flyers
    for _, p in ipairs({ { 80, 24, "t", "C" }, { 98, 33, "l", "z" }, { 196, 27, "D", "t" }, { 236, 34, "s", "z" }, { 300, 25, "t", "q" } }) do
      L.map(img, p[1], p[2], { "XXXX.", "XYYXX", ".XXXX" }, { sub = { X = p[3], Y = p[4] } })
    end
    for _ = 1, 25 do L.set(img, R(0, W - 1), R(5, H - 1), "x") end
  end
  L.durations(spr, 260)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_hgd_near")
end
