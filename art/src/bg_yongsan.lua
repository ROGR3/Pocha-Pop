-- 용산 electronics bazaar at night, 320 wide, bottom = street level.
--  bg_ysn_sky  320x200  extra sky above the far layer (1f)
--  bg_ysn_far  320x240  sky, Namsan with N Seoul Tower, skyline (1f)
--  bg_ysn_mid  320x240  shop fronts, TV wall, LED screen, cables (4f, tag loop)
--  bg_ysn_near 320x40   tiled pavement with cables and cardboard (4f, tag loop)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320

-- sagging cable between two points
local function cable(img, x1, y1, x2, y2, sag, code)
  local n = math.max(math.abs(x2 - x1), 1)
  local px, py
  for i = 0, n do
    local t = i / n
    local x = math.floor(x1 + (x2 - x1) * t + 0.5)
    local y = math.floor(y1 + (y2 - y1) * t + sag * 4 * t * (1 - t) + 0.5)
    if px then L.line(img, px, py, x, y, code) end
    px, py = x, y
  end
end

-- cardboard box
local function box(img, x, y, w, h, tape)
  L.rect(img, x, y, w, h, "f")
  L.rect(img, x + 1, y + 1, w - 2, h - 2, "d")
  L.hline(img, x + 1, x + w - 2, y + 1, "E")
  L.rect(img, x + w - 3, y + 2, 2, h - 3, "e")
  L.hline(img, x + 1, x + w - 2, y + h - 2, "e")
  if tape ~= false then L.vline(img, x + math.floor(w / 2), y + 1, y + 3, "c") end
  if w > 10 and h > 8 then L.rect(img, x + 3, y + 5, 4, 3, "c"); L.hline(img, x + 3, x + 6, y + 6, "w") end
end

-- ---------------------------------------------------------------- sky
do
  local H = 200
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(61)
  L.rect(img, 0, 0, W, H, "z")
  for _ = 1, 90 do
    local x, y = R(0, W - 1), R(0, H - 8)
    local r = R(0, 9)
    L.set(img, x, y, r == 0 and "t" or (r < 3 and "v" or "w"))
  end
  -- thin haze streaks
  for k = 1, 6 do
    local cx, cy = R(10, W - 10), R(30, 170)
    local len = R(30, 70)
    for x = cx - len, cx + len do
      if (x + k) % 3 ~= 0 then L.set(img, x, cy + math.floor(math.sin(x / 11) * 1.2), "y") end
      if x % 2 == 0 and math.abs(x - cx) < len * 0.6 then L.set(img, x, cy + 1 + math.floor(math.sin(x / 11) * 1.2), "y") end
    end
  end
  L.save(spr, "bg_ysn_sky")
end

-- ---------------------------------------------------------------- far
do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(43)
  L.vgradient(img, 0, 0, W, H, { { 0, "z" }, { 60, "y" }, { 120, "x" }, { 180, "B" }, { 239, "C" } })
  for _ = 1, 45 do L.set(img, R(0, W - 1), R(0, 70), R(0, 3) == 0 and "u" or "w") end
  -- Namsan
  local TX = 160
  for x = 0, W - 1 do
    local d = (x - TX) / 130
    local top = math.floor(80 + 70 * d * d + math.sin(x / 6) * 1.3 + math.sin(x / 17) * 2)
    for y = top, H - 1 do
      local c = L.dither(x, y, (y - top) / 50, "p", "y")
      if y == top then c = "o" end
      L.set(img, x, y, c)
    end
    -- tree tufts
    if x % 5 == 0 then L.set(img, x, top + 2 + (x % 3), "o") end
  end
  -- park lamps along the mountain road
  for x = 40, 290, 13 do
    local d = (x - TX) / 130
    local y = math.floor(80 + 70 * d * d) + 9 + (x % 4)
    if math.abs(x - TX) > 10 then L.set(img, x, y, "k") end
  end
  -- N Seoul Tower
  L.rect(img, TX - 7, 74, 15, 9, "x"); L.hline(img, TX - 7, TX + 7, 74, "w")
  for wx = TX - 5, TX + 5, 3 do L.set(img, wx, 77, "l"); L.set(img, wx, 80, "k") end
  L.rect(img, TX - 2, 54, 5, 20, "w"); L.vline(img, TX - 2, 54, 73, "u"); L.vline(img, TX + 2, 54, 73, "x")
  L.rect(img, TX - 1, 34, 3, 20, "w"); L.vline(img, TX - 1, 34, 53, "u")
  -- observation pod
  L.hline(img, TX - 4, TX + 4, 24, "v")
  L.rect(img, TX - 6, 25, 13, 5, "w")
  L.hline(img, TX - 6, TX + 6, 25, "u")
  for wx = TX - 5, TX + 5 do L.set(img, wx, 27, (wx % 2 == 0) and "l" or "k") end
  L.hline(img, TX - 5, TX + 5, 29, "C")
  L.hline(img, TX - 4, TX + 4, 30, "B"); L.hline(img, TX - 3, TX + 3, 31, "x")
  L.rect(img, TX - 3, 32, 7, 2, "w")
  -- antenna
  L.rect(img, TX - 1, 16, 3, 8, "v"); L.vline(img, TX - 1, 16, 23, "u")
  L.hline(img, TX - 2, TX + 2, 19, "w")
  L.vline(img, TX, 3, 15, "v")
  L.set(img, TX, 2, "A"); L.set(img, TX - 1, 2, "h"); L.set(img, TX + 1, 2, "h"); L.set(img, TX, 1, "h")
  L.set(img, TX, 10, "A")
  -- skyline in front of the mountain
  local x = -4
  while x < W do
    local w = R(12, 26)
    local top = R(112, 170)
    if (x > 190 and x < 260) or x < 40 then top = R(70, 110) end
    for yy = top, H - 1 do
      for xx = x, math.min(W - 1, x + w - 1) do L.set(img, xx, yy, (xx == x) and "x" or "y") end
    end
    for wy = top + 3, H - 6, 4 do
      for wx = x + 2, x + w - 3, 3 do
        local r = R(0, 11)
        if r < 3 then L.set(img, wx, wy, r == 0 and "l" or (r == 1 and "k" or "s")) end
      end
    end
    if R(0, 2) == 0 then L.vline(img, x + math.floor(w / 2), top - 6, top - 1, "w"); L.set(img, x + math.floor(w / 2), top - 7, "A") end
    x = x + w + R(0, 4)
  end
  L.save(spr, "bg_ysn_far")
end

-- ---------------------------------------------------------------- mid
do
  local H = 240
  local spr = L.new(W, H, 4)
  local SPEC = { "t", "l", "s", "m", "C", "i", "q" }
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(77)          -- layout (same every frame)
    local N = L.rng(100 + f * 13) -- noise (changes per frame)

    -- a building block with floor lines and windows
    local function building(x0, x1, top, wall, edge, trim, winRows)
      for y = top, H - 1 do
        for x = x0, x1 do
          local c = wall
          if (y - top) % 24 == 0 then c = trim end
          if x == x0 or x == x1 then c = edge end
          L.set(img, x, y, c)
        end
      end
      L.hline(img, x0, x1, top, trim)
    end
    local function window(x, y, w, h, lit)
      L.rect(img, x, y, w, h, "z")
      if lit then
        L.rect(img, x + 1, y + 1, w - 2, h - 2, lit)
        L.vline(img, x + math.floor(w / 2), y + 1, y + h - 2, "z")
        if lit == "k" then L.rect(img, x + 1, y + 1, 2, 2, "l") end
      end
      L.hline(img, x - 1, x + w, y + h, "w")
    end

    -- ======== left: big electronics building with LED screen
    building(-2, 94, 16, "x", "y", "w")
    L.rect(img, -2, 12, 97, 4, "y"); L.hline(img, -2, 94, 12, "w")
    for wy = 22, 96, 24 do window(4, wy, 10, 12, ({ "k", "b", nil, "s" })[(wy // 24) % 4 + 1]) end
    for wx = 24, 84, 14 do window(wx, 74, 10, 12, (wx // 14) % 3 == 0 and "k" or ((wx // 14) % 3 == 1 and "y" or "b")) end
    -- LED screen
    local SX, SY, SW, SH = 20, 24, 72, 42
    L.rect(img, SX - 2, SY - 2, SW + 4, SH + 4, "z")
    L.rect(img, SX - 1, SY - 1, SW + 2, SH + 2, "w"); L.hline(img, SX - 1, SX + SW, SY - 1, "v")
    L.vline(img, SX + 10, SY + SH + 2, SY + SH + 5, "y"); L.vline(img, SX + SW - 11, SY + SH + 2, SY + SH + 5, "y")
    local scr = Image(SW, SH, ColorMode.RGB)
    if f == 1 or f == 2 then
      L.vgradient(scr, 0, 0, SW, SH, { { 0, "q" }, { SH - 1, "B" } })
      for _ = 1, 14 do L.set(scr, N(0, SW - 1), N(0, SH - 1), N(0, 1) == 0 and "s" or "C") end
      local ox = f == 1 and 14 or 12
      L.text(scr, ox + 1, 7, "전자", "z", { scale = 3, step = 24 })
      L.text(scr, ox, 6, "전자", f == 1 and "l" or "t", { scale = 3, step = 24 })
      for x = 0, SW - 1, 2 do L.set(scr, x, SH - 6, f == 1 and "k" or "l") end
      L.hline(scr, 4, SW - 5, SH - 4, "s")
    elseif f == 3 then
      L.vgradient(scr, 0, 0, SW, SH, { { 0, "C" }, { SH - 1, "h" } })
      -- big phone
      L.rect(scr, 28, 4, 16, 34, "z"); L.rect(scr, 30, 7, 12, 26, "s")
      L.vgradient(scr, 30, 7, 12, 26, { { 7, "s" }, { 32, "q" } })
      L.hline(scr, 33, 38, 5, "w"); L.set(scr, 35, 35, "w"); L.set(scr, 36, 35, "w")
      L.line(scr, 31, 14, 37, 8, "t")
      -- sparkles
      for _, p in ipairs({ { 12, 10 }, { 58, 14 }, { 16, 30 }, { 54, 32 } }) do
        L.set(scr, p[1], p[2], "t"); L.set(scr, p[1] - 1, p[2], "l"); L.set(scr, p[1] + 1, p[2], "l")
        L.set(scr, p[1], p[2] - 1, "l"); L.set(scr, p[1], p[2] + 1, "l")
      end
      L.rect(scr, 6, 18, 14, 7, "l"); L.rect(scr, 52, 18, 14, 7, "l")
      L.hline(scr, 8, 17, 21, "i"); L.hline(scr, 54, 63, 21, "i")
    else
      -- transition: colour bars + glitch
      for x = 0, SW - 1 do
        local c = SPEC[math.floor(x * 7 / SW) + 1]
        for y = 0, SH - 1 do
          if y > SH - 10 then c = ({ "q", "z", "t", "z" })[(x // 18) + 1] or "z" end
          L.set(scr, x, y, c)
        end
      end
      for _ = 1, 5 do
        local gy, gx = N(0, SH - 3), N(-10, 10)
        local strip = Image(SW, 2, ColorMode.RGB)
        strip:drawImage(scr, Point(gx, -gy))
        scr:drawImage(strip, Point(0, gy))
      end
    end
    -- LED pixel grid
    for y = 0, SH - 1, 3 do for x = 0, SW - 1, 3 do
      local p = scr:getPixel(x, y)
      if app.pixelColor.rgbaA(p) > 0 then
        scr:drawPixel(x, y, app.pixelColor.rgba(
          math.floor(app.pixelColor.rgbaR(p) * 0.7), math.floor(app.pixelColor.rgbaG(p) * 0.7), math.floor(app.pixelColor.rgbaB(p) * 0.7), 255))
      end
    end end
    img:drawImage(scr, Point(SX, SY))
    -- glow spill under the screen
    for x = SX, SX + SW - 1 do if (x + f) % 2 == 0 then L.set(img, x, SY + SH + 2, f == 3 and "C" or "q") end end
    -- awning + shop at street level
    for x = -2, 94 do
      for y = 104, 111 do L.set(img, x, y, ((x // 6) % 2 == 0) and "i" or "t") end
      if x % 6 < 3 then L.set(img, x, 112, (x // 6) % 2 == 0 and "i" or "t") end
    end
    L.hline(img, -2, 94, 103, "h")
    L.rect(img, 2, 116, 52, 84, "z")
    L.vgradient(img, 3, 117, 50, 82, { { 117, "l" }, { 160, "k" }, { 199, "b" } })
    -- products in the window: stacked TVs, boxes, a fan
    for k = 0, 2 do
      L.rect(img, 6, 120 + k * 14, 20, 12, "y"); L.rect(img, 7, 121 + k * 14, 18, 9, (k + f) % 3 == 0 and "s" or ((k + f) % 3 == 1 and "r" or "q"))
      L.set(img, 8, 122 + k * 14, "t")
    end
    L.rect(img, 30, 124, 8, 30, "u"); L.vline(img, 37, 124, 153, "v"); L.hline(img, 31, 36, 130, "v"); L.hline(img, 31, 36, 140, "v")
    L.ebox(img, 40, 120, 50, 130, "w"); L.ebox(img, 42, 122, 48, 128, "u"); L.set(img, 45, 125, "w")
    L.vline(img, 45, 131, 150, "w"); L.hline(img, 42, 48, 151, "w")
    L.line(img, 4, 196, 20, 118, "c")
    L.vline(img, 28, 116, 199, "y")
    for x = 3, 52, 1 do if x % 2 == 0 then L.set(img, x, 170, "f") end end
    L.rect(img, 58, 116, 30, 124, "y"); L.rect(img, 60, 118, 26, 122, "w")
    for y = 118, 239, 3 do L.hline(img, 60, 85, y, "x") end

    -- ======== centre: low two-storey shops
    building(95, 160, 98, "f", "g", "e")
    building(161, 228, 102, "w", "x", "v")
    for wx = 102, 150, 16 do window(wx, 104, 10, 9, (wx // 16) % 2 == 0 and "k" or "b") end
    for wx = 168, 220, 16 do window(wx, 108, 10, 8, (wx // 16) % 2 == 1 and "s" or nil) end
    -- rooftop sign 전자
    L.vline(img, 108, 94, 98, "y"); L.vline(img, 146, 94, 98, "y")
    L.rect(img, 100, 80, 54, 15, "z"); L.rect(img, 101, 81, 52, 13, "y")
    local sc = (f == 3) and "k" or "l"
    L.text(img, 114, 85, "전자", "g", { step = 10 }); L.text(img, 113, 84, "전자", sc, { step = 10 })
    -- tiny TV pictograms on the sign
    for _, tx in ipairs({ 104, 140 }) do
      L.rect(img, tx, 84, 9, 7, "u"); L.rect(img, tx + 1, 85, 7, 5, (f % 2 == 0) and "s" or "r")
      L.set(img, tx + 3, 83, "u"); L.set(img, tx + 5, 82, "u"); L.set(img, tx + 1, 82, "u")
    end
    -- satellite dishes + antenna on roofs
    local function dish(x, y, flip)
      L.ebox(img, x, y, x + 9, y + 9, function(nx, ny) if nx + ny * (flip and -1 or 1) > 0.5 then return "w" end return "u" end)
      L.ebox(img, x + 2, y + 2, x + 7, y + 7, "v")
      L.line(img, x + 4, y + 4, x + (flip and -2 or 11), y - 2, "v"); L.set(img, x + (flip and -2 or 11), y - 2, "u")
      L.vline(img, x + 5, y + 9, y + 13, "x")
    end
    dish(166, 88, false); dish(190, 86, true)
    L.vline(img, 182, 74, 101, "w"); for k = 0, 3 do L.hline(img, 178 + k, 186 - k, 76 + k * 5, "v") end
    -- LED ticker on the right shop
    L.rect(img, 166, 114, 58, 7, "z")
    for x = 167, 222 do
      if ((x + f * 3) % 9) < 5 and x % 2 == 1 then L.set(img, x, 116, "A"); L.set(img, x, 118, "A") end
      if ((x + f * 3) % 9) == 2 and x % 2 == 1 then L.set(img, x, 117, "A") end
    end
    -- shop fronts behind the stall (barely seen, but filled)
    L.rect(img, 98, 122, 60, 118, "z"); L.vgradient(img, 99, 123, 58, 117, { { 123, "k" }, { 239, "b" } })
    L.rect(img, 164, 122, 62, 118, "z"); L.vgradient(img, 165, 123, 60, 117, { { 123, "u" }, { 239, "w" } })

    -- ======== right: TV wall building
    building(229, 322, 24, "y", "z", "x")
    L.rect(img, 229, 20, 94, 4, "x"); L.hline(img, 229, 322, 20, "w")
    L.rect(img, 232, 30, 70, 72, "z")
    L.rect(img, 233, 31, 68, 70, "x")
    for r = 0, 4 do
      for c = 0, 3 do
        local tx, ty = 235 + c * 16, 33 + r * 13 + 1
        L.rect(img, tx, ty, 15, 12, "z")
        L.rect(img, tx + 1, ty + 1, 13, 10, (r + c) % 2 == 0 and "y" or "w")
        local sx, sy, sw, sh = tx + 2, ty + 2, 11, 8
        local mode = ((r * 7 + c * 3) % 5) + 1
        if (r + c * 2 + f) % 5 == 0 then mode = 2 end
        if mode == 1 then
          for x = 0, sw - 1 do
            local col = SPEC[math.floor(x * 7 / sw) + 1]
            for y = 0, sh - 1 do L.set(img, sx + x, sy + y, y >= sh - 2 and ((x // 3) % 2 == 0 and "z" or "t") or col) end
          end
        elseif mode == 2 then
          for y = 0, sh - 1 do for x = 0, sw - 1 do
            local n = N(0, 5)
            L.set(img, sx + x, sy + y, ({ "t", "u", "v", "w", "x", "u" })[n + 1])
          end end
        elseif mode == 3 then
          local cc = ({ { "r", "q" }, { "D", "C" }, { "m", "n" }, { "k", "j" } })[((r + c + f) % 4) + 1]
          L.vgradient(img, sx, sy, sw, sh, { { sy, cc[1] }, { sy + sh - 1, cc[2] } })
          L.ebox(img, sx + 3, sy + 2, sx + 7, sy + 6, "c"); L.set(img, sx + 4, sy + 4, "z"); L.set(img, sx + 6, sy + 4, "z")
        elseif mode == 4 then
          L.rect(img, sx, sy, sw, sh, "q")
          L.rect(img, sx, sy + sh - 3, sw, 2, "t"); L.hline(img, sx, sx + 2, sy + sh - 3, "i")
          L.ebox(img, sx + 4, sy, sx + 7, sy + 3, "E"); L.rect(img, sx + 3, sy + 4, 6, 1, "x")
        else
          L.rect(img, sx, sy, sw, sh, "z")
          L.line(img, sx + 1, sy + sh - 2, sx + 5, sy + 1, "y")
          if f % 2 == 0 then L.set(img, sx + sw - 2, sy + sh - 2, "m") end
        end
      end
    end
    -- glow from the TV wall on the facade
    for x = 231, 303 do if (x + f) % 3 == 0 then L.set(img, x, 103, ({ "s", "C", "l", "r" })[f]) end end
    L.hline(img, 231, 303, 102, "w")
    -- vertical neon 전자 hanging from the right building
    L.rect(img, 204, 40, 14, 34, "z"); L.rect(img, 205, 41, 12, 32, "y")
    L.hline(img, 206, 228, 39, "w"); L.hline(img, 206, 216, 74, "w")
    if f ~= 2 then
      L.neon(img, 208, 45, "전자", "s", "q", { vertical = true, step = 13 })
    else
      L.text(img, 208, 45, "전자", "x", { vertical = true, step = 13 })
    end
    -- awning + shop front
    for x = 229, 322 do
      for y = 106, 113 do L.set(img, x, y, ((x // 6) % 2 == 0) and "q" or "u") end
      if x % 6 < 3 then L.set(img, x, 114, (x // 6) % 2 == 0 and "q" or "u") end
    end
    L.hline(img, 229, 322, 105, "x")
    L.rect(img, 236, 118, 82, 82, "z")
    L.vgradient(img, 237, 119, 80, 80, { { 119, "v" }, { 150, "w" }, { 198, "x" } })
    for sy = 130, 190, 20 do
      L.hline(img, 237, 316, sy, "w")
      for px = 240, 312, 7 do
        local k = (px + sy) % 4
        if k == 0 then L.rect(img, px, sy - 8, 5, 8, "x"); L.rect(img, px + 1, sy - 7, 3, 4, (f % 2 == 0) and "s" or "r")
        elseif k == 1 then L.rect(img, px, sy - 6, 6, 6, "d"); L.hline(img, px, px + 5, sy - 6, "E")
        elseif k == 2 then L.rect(img, px + 1, sy - 9, 4, 9, "y"); L.set(img, px + 2, sy - 7, "m")
        else L.ebox(img, px, sy - 7, px + 5, sy - 1, "w"); L.ebox(img, px + 1, sy - 6, px + 4, sy - 2, "x") end
      end
    end
    L.line(img, 300, 120, 316, 136, "v"); L.line(img, 296, 120, 316, 140, "v")
    L.vline(img, 276, 118, 199, "x")
    for x = 237, 316, 2 do L.set(img, x, 199, "w") end

    -- ======== utility poles + tangled cables
    for _, px in ipairs({ 96, 228 }) do
      L.rect(img, px - 1, 22, 3, H - 22, "y"); L.vline(img, px - 1, 22, H - 1, "x")
      L.hline(img, px - 7, px + 7, 30, "y"); L.hline(img, px - 5, px + 5, 40, "y")
      for _, ix in ipairs({ px - 6, px - 2, px + 2, px + 6 }) do L.set(img, ix, 29, "u") end
      L.rect(img, px - 4, 46, 8, 10, "w"); L.hline(img, px - 4, px + 3, 46, "v"); L.rect(img, px - 3, 48, 6, 6, "x")
      -- coils
      L.ebox(img, px + 2, 56, px + 9, 63, "z"); L.ebox(img, px + 4, 58, px + 7, 61, nil)
      L.ebox(img, px - 9, 60, px - 3, 66, "z")
      L.ebox(img, px - 7, 62, px - 5, 64, function() return "y" end)
    end
    local CR = L.rng(9)
    for k = 1, 6 do
      local y1, y2 = 28 + CR(0, 14), 28 + CR(0, 14)
      cable(img, 97, y1, 227, y2, CR(14, 34), k % 3 == 0 and "y" or "z")
    end
    for k = 1, 5 do cable(img, 60 + k * 6, 16, 96, 28 + k * 3, CR(4, 12), "z") end
    for k = 1, 5 do cable(img, 228, 30 + k * 2, 236 + k * 13, 20, CR(3, 10), "z") end
    -- loose cables dangling down the poles
    for k = 0, 2 do cable(img, 96 + k, 56, 92 - k * 2, 104, 6 + k * 3, "z") end
    for k = 0, 2 do cable(img, 228 - k, 56, 233 + k * 2, 104, -5 - k * 2, "z") end
    -- string lights between buildings
    for x = 94, 229, 5 do
      local t = (x - 94) / 135
      local y = 58 + math.floor(16 * 4 * t * (1 - t))
      L.set(img, x, y, ((x // 5 + f) % 3 == 0) and "s" or "C")
    end

    -- ======== boxes at the sides (street level)
    box(img, 26, 210, 18, 14); box(img, 30, 196, 14, 14); box(img, 28, 224, 24, 16); box(img, 44, 214, 12, 10, false)
    box(img, 264, 214, 20, 14); box(img, 270, 200, 14, 14); box(img, 262, 226, 28, 14); box(img, 284, 222, 12, 18, false)
    L.rect(img, 6, 206, 16, 34, "u"); L.rect(img, 7, 207, 14, 32, "v"); L.rect(img, 8, 208, 12, 10, "q")
    L.set(img, 9, 209, "s"); L.hline(img, 8, 19, 222, "w")
    L.rect(img, 298, 204, 18, 36, "w"); L.rect(img, 299, 205, 16, 34, "x"); L.rect(img, 301, 208, 12, 9, (f % 2 == 1) and "m" or "n")
  end
  L.durations(spr, 300)
  spr.frames[4].duration = 0.12
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_ysn_mid")
end

-- ---------------------------------------------------------------- near (pavement)
do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(15)
    L.hline(img, 0, W - 1, 0, "u")
    L.rect(img, 0, 1, W, 2, "v"); L.hline(img, 0, W - 1, 3, "x")
    -- tiles (running bond)
    for y = 4, H - 1 do
      local row = (y - 4) // 6
      for x = 0, W - 1 do
        local xo = (x + (row % 2) * 7) % 14
        local c = L.dither(x, y, (y - 4) / 50, "w", "x")
        if (y - 4) % 6 == 5 or xo == 13 then c = "y" end
        if (y - 4) % 6 == 0 and xo < 12 and c ~= "y" and (row + (x + (row % 2) * 7) // 14) % 3 == 0 then c = "v" end
        L.set(img, x, y, c)
      end
    end
    for _ = 1, 40 do L.set(img, R(0, W - 1), R(5, H - 1), "y") end
    -- flattened cardboard
    local function card(x, y, w, h)
      L.rect(img, x, y, w, h, "e"); L.rect(img, x + 1, y, w - 2, h - 1, "d")
      L.hline(img, x + 1, x + w - 2, y, "E"); L.vline(img, x + math.floor(w / 3), y, y + h - 1, "F")
      L.hline(img, x + 3, x + 8, y + 2, "c")
    end
    card(14, 22, 30, 10); card(36, 28, 22, 9); card(262, 20, 34, 11)
    -- cables snaking across
    local function snake(x0, x1, y0, amp, per, code, hi)
      for x = x0, x1 do
        local y = y0 + math.floor(math.sin(x / per) * amp + 0.5)
        L.set(img, x, y, code); L.set(img, x, y + 1, code)
        L.set(img, x, y, hi)
      end
    end
    snake(0, 140, 10, 2, 9, "z", "x")
    snake(180, 319, 14, 3, 13, "z", "y")
    snake(60, 230, 33, 2, 7, "z", "x")
    L.rect(img, 120, 10, 4, 4, "j"); L.rect(img, 230, 13, 4, 4, "j")
    -- plug
    L.rect(img, 140, 9, 5, 4, "u"); L.hline(img, 145, 146, 10, "v"); L.hline(img, 145, 146, 12, "v")
    -- flickering screen light reflected on the curb
    local cols = { { "s", "r" }, { "C", "B" }, { "l", "k" }, { "u", "v" } }
    for x = 0, W - 1 do
      if (x < 70 or x > 240) and (x * 7 + f * 5) % 11 < 2 then L.set(img, x, 1, cols[f][1]) end
      if (x < 70 or x > 240) and (x * 3 + f * 7) % 13 == 0 then L.set(img, x, 5, cols[f][2]) end
    end
  end
  L.durations(spr, 260)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_ysn_near")
end
