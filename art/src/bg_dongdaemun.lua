-- 동대문 night wholesale clothing market, 3 parallax layers + sky, 320 wide.
--  bg_ddm_sky  320x200  extra sky above far (1f)
--  bg_ddm_far  320x240  warm haze, towers, the silver curve of DDP (1f)
--  bg_ddm_mid  320x240  market buildings, signs, hanging clothes, fabric banners (4f, tag loop)
--  bg_ddm_near 320x40   market pavement, dropped price tag + hanger (4f, tag loop)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320

-- tiny garments, X = main colour, Y = shade
local SHIRT = { "..w..", ".XwX.", "XXXXX", "XXXXX", ".XXX.", ".XXX.", ".YYY." }
local DRESS = { "..w..", ".XXX.", ".XYX.", ".XXX.", "XXXXX", "XXXXX", "YYYYY" }
local PANTS = { "..w..", "XXXXX", "XXXXX", "XX.XX", "XX.XX", "XX.XX", "YY.YY" }
local GARMENTS = { SHIRT, DRESS, PANTS, SHIRT }
local SIGNSHIRT = { "..XX.XX..", ".XXXXXXX.", "XXXXXXXXX", "XX.XXX.XX", "...XXX...", "...XXX...", "...XXX..." }
local SIGNDRESS = { "...X.X...", "...XXX...", "...XXX...", "..XXXXX..", ".XXXXXXX.", "XXXXXXXXX", "........." }
local CLOTH = { "red", "blue", "yellow", "pink", "green", "purple", "white", "orange" }

local function garment(img, x, y, kind, colour)
  local r = L.RAMPS[colour]
  L.map(img, x, y, kind, { sub = { X = r[2], Y = r[3] } })
end

-- rail with a row of garments hanging from it
local function rack(img, x0, x1, y, seed)
  local R = L.rng(seed)
  L.hline(img, x0, x1, y, "v")
  L.vline(img, x0, y, y + 1, "w"); L.vline(img, x1, y, y + 1, "w")
  local x = x0 + 1
  while x + 5 <= x1 do
    garment(img, x, y, GARMENTS[R(1, #GARMENTS)], CLOTH[R(1, #CLOTH)])
    x = x + 6
  end
end

-- ---------------------------------------------------------------- sky
do
  local spr = L.new(W, 200, 1)
  local img = L.img(spr, 1)
  local R = L.rng(41)
  L.rect(img, 0, 0, W, 200, "z")
  for _ = 1, 70 do
    local x, y = R(0, W - 1), R(0, 185)
    local r = R(0, 9)
    L.set(img, x, y, r == 0 and "u" or (r < 4 and "v" or "w"))
  end
  -- long thin haze streaks
  for k = 1, 5 do
    local cx, cy = R(0, W), R(70, 175)
    local len = R(40, 90)
    for x = cx - len, cx + len do
      local y = cy + math.floor(math.sin(x / 13 + k) * 1.5)
      if (x + k) % 3 ~= 0 then L.set(img, x, y, "y") end
      if math.abs(x - cx) < len * 0.6 and x % 2 == 0 then L.set(img, x, y + 1, "y") end
    end
  end
  L.save(spr, "bg_ddm_sky")
end

-- ---------------------------------------------------------------- far
do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(43)
  L.vgradient(img, 0, 0, W, H, { { 0, "z" }, { 80, "y" }, { 150, "g" }, { 205, "f" }, { 239, "e" } })
  for _ = 1, 30 do L.set(img, R(0, W - 1), R(0, 80), R(0, 3) == 0 and "u" or "w") end
  -- distant towers
  local x = -4
  while x < W do
    local w = R(12, 26)
    local top = R(56, 120)
    for yy = top, H - 1 do
      for xx = x, math.min(W - 1, x + w - 1) do L.set(img, xx, yy, (xx == x + w - 1) and "x" or "y") end
    end
    for wy = top + 4, H - 6, 5 do
      for wx = x + 2, x + w - 3, 4 do
        local r = R(0, 11)
        if r < 3 then L.rect(img, wx, wy, 2, 2, r == 0 and "l" or (r == 1 and "k" or "b")) end
      end
    end
    if R(0, 2) == 0 then L.vline(img, x + math.floor(w / 2), top - 7, top - 1, "x"); L.set(img, x + math.floor(w / 2), top - 8, "A") end
    x = x + w + R(1, 6)
  end
  -- DDP: long, low, flowing silver hull - high rounded head on the left,
  -- a soft dip, a second hump, then a long slope down to the plaza on the right
  local x0, x1 = 34, 300
  local tops = {}
  for xx = x0, x1 do
    local t = (xx - x0) / (x1 - x0)
    local head = math.sqrt(math.max(0, math.sin(math.min(1, t / 0.16) * math.pi / 2)))
    local body = 0.92 - 0.08 * math.exp(-((t - 0.42) / 0.12) ^ 2)
    local tail = t > 0.62 and math.cos((t - 0.62) / 0.38 * math.pi / 2) ^ 1.1 or 1
    tops[xx] = math.floor(150 - 92 * head * body * tail)
  end
  for xx = x0, x1 do
    local top = tops[xx]
    local t = (xx - x0) / (x1 - x0)
    for yy = top, H - 1 do
      local d = yy - top
      local c
      if d == 0 then c = (xx % 2 == 0) and "t" or "u"
      elseif d < 3 then c = "u"
      elseif d < 6 then c = L.dither(xx, yy, (d - 2) / 4, "u", "v")
      elseif d < 16 then c = "v"
      elseif d < 22 then c = L.dither(xx, yy, (d - 16) / 6, "v", "w")
      elseif d < 44 then c = "w"
      elseif d < 52 then c = L.dither(xx, yy, (d - 44) / 8, "w", "x")
      else c = "x" end
      -- curved panel seams parallel to the roofline
      if d >= 8 and d % 8 == 0 then c = (d < 20) and "w" or "x" end
      -- perforation dots, lit from inside
      if d > 26 and d < 50 and d % 8 == 4 and (xx + d) % 6 == 0 and t < 0.8 then c = "b" end
      L.set(img, xx, yy, c)
    end
    -- left rim light
    if t < 0.06 then for yy = top, math.min(H - 1, top + 50) do if (xx - x0) < 2 then L.set(img, xx, yy, "u") end end end
  end
  -- warm glow from the plaza below + small LED field
  for yy = 196, H - 1 do
    for xx = x0, x1 do
      if L.dither(xx, yy, (yy - 196) / 50, 0, 1) == 1 then L.set(img, xx, yy, "f") end
    end
  end
  for _ = 1, 50 do L.set(img, R(x0 + 8, x1 - 8), R(206, 236), R(0, 2) == 0 and "l" or "D") end
  L.save(spr, "bg_ddm_far")
end

-- ---------------------------------------------------------------- mid
do
  local H = 240
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(47)

    local function building(x0, x1, top, wall, edge, trim, floor)
      floor = floor or 22
      for y = top, H - 1 do
        for x = x0, x1 do
          local c = wall
          if (y - top) % floor == 0 then c = trim end
          if x == x0 or x == x1 then c = edge end
          L.set(img, x, y, c)
        end
      end
      L.hline(img, x0, x1, top, trim); L.hline(img, x0, x1, top + 1, edge)
      for fy = top + 6, H - 50, floor do
        for wx = x0 + 4, x1 - 10, 12 do
          L.rect(img, wx, fy, 8, 10, "z")
          local lit = R(0, 4)
          if lit > 0 then
            local c = ({ "k", "b", "l", "w" })[lit]
            L.rect(img, wx + 1, fy + 1, 6, 8, c)
            L.hline(img, wx + 1, wx + 6, fy + 4, "z")
            if lit ~= 4 and R(0, 1) == 0 then
              -- fabric rolls stacked in the window
              for k = 0, 2 do
                L.hline(img, wx + 1, wx + 6, fy + 6 + k, L.RAMPS[CLOTH[R(1, #CLOTH)]][2])
              end
            end
          end
        end
      end
    end

    -- left market block + right block, low market hall in the centre
    building(-2, 76, 24, "x", "y", "w")
    building(78, 242, 108, "x", "y", "w", 26)
    building(244, 322, 16, "B", "z", "C")

    -- shop fronts at street level (sides)
    local function shopfront(x0, x1, stripe1, stripe2, seed)
      L.rect(img, x0, 200, x1 - x0 + 1, 40, "k")
      L.rect(img, x0, 226, x1 - x0 + 1, 14, "b")
      for x = x0, x1 do for y = 200, 205 do L.set(img, x, y, (math.floor((x - x0) / 4) % 2 == 0) and stripe1 or stripe2) end end
      for x = x0, x1, 4 do L.set(img, x, 206, stripe1); L.set(img, x + 1, 206, stripe1) end
      rack(img, x0 + 2, x1 - 2, 209, seed)
      rack(img, x0 + 4, x1 - 4, 220, seed + 1)
    end
    shopfront(2, 72, "i", "t", 3)
    shopfront(248, 318, "r", "t", 5)
    -- centre hall shops (mostly behind the stall)
    for sx = 84, 232, 30 do
      L.rect(img, sx, 204, 26, 36, (sx / 30) % 2 == 0 and "k" or "b")
      L.rect(img, sx, 198, 26, 6, ({ "i", "r", "m", "C", "j", "q" })[(sx // 30) % 6 + 1])
    end

    -- rooftop racks on the hall
    rack(img, 86, 128, 94, 11)
    rack(img, 192, 236, 94, 13)
    L.vline(img, 86, 94, 107, "w"); L.vline(img, 128, 94, 107, "w")
    L.vline(img, 192, 94, 107, "w"); L.vline(img, 236, 94, 107, "w")

    -- big rooftop sign 동대문 on steel legs
    L.vline(img, 140, 100, 107, "x"); L.vline(img, 180, 100, 107, "x")
    L.line(img, 140, 107, 150, 100, "x"); L.line(img, 180, 107, 170, 100, "x")
    L.rect(img, 132, 78, 57, 22, "z"); L.rect(img, 133, 79, 55, 20, "g")
    local main = ({ "D", "D", "D", "t" })[f]
    L.text(img, 137, 83, "동대문", "h", { scale = 2, step = 17 })
    L.text(img, 136, 82, "동대문", main, { scale = 2, step = 17 })
    -- bulbs on the sign frame (chase)
    for x = 132, 188, 4 do
      local on = ((x // 4) + f) % 2 == 0
      L.set(img, x, 77, on and "l" or "j"); L.set(img, x, 100, on and "j" or "l")
    end

    -- left block signboards (per floor), wholesale style
    L.rect(img, 24, 30, 36, 12, "l"); L.rect(img, 25, 31, 34, 10, "k")
    L.text(img, 28, 33, "동대문", "f", { step = 9 })
    L.rect(img, 26, 52, 15, 12, "q"); L.rect(img, 27, 53, 13, 10, "r")
    L.map(img, 29, 54, SIGNSHIRT, { sub = { X = "t" } })
    -- vertical neon 세일 on the left block, blinks
    L.rect(img, 62, 84, 12, 22, "z")
    if f % 2 == 1 then L.neon(img, 64, 86, "세일", "A", "h", { vertical = true, step = 10 })
    else L.text(img, 64, 86, "세일", "h", { vertical = true, step = 10 }) end

    -- right block signboards
    L.rect(img, 250, 24, 40, 12, "t"); L.rect(img, 251, 25, 38, 10, "u")
    L.text(img, 253, 27, "동대문", "h", { step = 12 })
    L.rect(img, 296, 46, 22, 30, "z")
    local oc = ({ "s", "C", "l", "m" })[f]
    local tmp = Image(W, H, ColorMode.RGB)
    L.map(tmp, 303, 50, SIGNSHIRT, { sub = { X = oc } })
    L.map(tmp, 303, 63, SIGNDRESS, { sub = { X = ({ "C", "l", "m", "s" })[f] } })
    L.glow(tmp, oc, "q"); L.glow(tmp, ({ "C", "l", "m", "s" })[f], "B")
    img:drawImage(tmp, Point(0, 0))
    L.rect(img, 250, 92, 30, 12, "z")
    L.neon(img, 253, 94, "세일", f ~= 2 and "l" or "k", "j", { step = 12 })

    -- fabric banners hanging from the roofs, fluttering
    local function banner(x, y0, len, w, col, phase)
      local r = L.RAMPS[col]
      L.hline(img, x - 1, x + w, y0 - 1, "w")
      for y = y0, y0 + len do
        local t = (y - y0) / len
        local off = math.floor(math.sin(y / 5 + (f + phase) * 1.6) * 1.6 * t + 0.5)
        for k = 0, w - 1 do
          local c = r[2]
          if k == 0 then c = r[1] elseif k == w - 1 then c = r[3] end
          if (y + f + phase) % 9 == 0 then c = r[3] end
          L.set(img, x + k + off, y, c)
        end
      end
    end
    banner(64, 27, 40, 4, "red", 0)
    banner(70, 27, 32, 4, "yellow", 1)
    banner(46, 48, 26, 4, "purple", 2)
    banner(296, 82, 34, 4, "blue", 2)
    banner(302, 82, 26, 4, "pink", 3)
    banner(308, 82, 30, 4, "green", 1)

    -- strings of bulbs across the market street
    for s = 0, 1 do
      local ya, yb = 40 + s * 14, 34 + s * 14
      for x = 76, 244 do
        local t = (x - 76) / 168
        local y = math.floor(ya + (yb - ya) * t + 16 * 4 * t * (1 - t))
        L.set(img, x, y, "z")
        if (x - 76) % 7 == 3 then
          local on = ((x // 7) + f + s) % 3
          L.set(img, x, y + 1, on == 0 and "t" or (on == 1 and "l" or "k"))
        end
      end
    end
    -- AC units
    for _, p in ipairs({ { 8, 120 }, { 46, 160 }, { 268, 140 }, { 286, 112 } }) do
      L.rect(img, p[1], p[2], 13, 8, "u"); L.hline(img, p[1], p[1] + 12, p[2] + 7, "v")
      for k = 0, 2 do L.hline(img, p[1] + 2, p[1] + 6, p[2] + 2 + k * 2, "v") end
      L.ebox(img, p[1] + 8, p[2] + 2, p[1] + 11, p[2] + 5, "w")
    end
  end
  L.durations(spr, 350)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_ddm_mid")
end

-- ---------------------------------------------------------------- near (pavement)
do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(49)
    -- tiles (staggered rows)
    for y = 0, H - 1 do
      for x = 0, W - 1 do
        local row = math.floor((y - 4) / 6)
        local tx = (x + (row % 2) * 6) % 12
        local c = L.dither(x, y, y / 70, "w", "x")
        if (y - 4) % 6 == 0 or tx == 0 then c = "y" end
        L.set(img, x, y, c)
      end
    end
    L.hline(img, 0, W - 1, 0, "w")
    L.rect(img, 0, 1, W, 2, "v"); L.hline(img, 0, W - 1, 3, "x")
    -- warm reflections of shop light on tiles
    for _, p in ipairs({ { 6, 60 }, { 250, 60 } }) do
      for y = 5, 16 do for x = p[1], p[1] + p[2] do
        if L.dither(x, y, 0.35 - (y - 5) / 40, 0, 1) == 1 and img:getPixel(x, y) ~= L.c("y") then L.set(img, x, y, "F") end
      end end
    end
    -- dropped price tag
    L.map(img, 34, 26, { ".ttt", "tttt", "tttt", ".ttt" }); L.set(img, 36, 27, "i"); L.line(img, 33, 25, 30, 22, "A")
    -- dropped hanger
    L.map(img, 270, 24, { "....u....", "...u.....", "..vuv....", ".v...v...", "vvvvvvv.." })
    -- fabric scrap
    L.map(img, 140, 34, { ".DD.", "DCDD", "..D." })
    -- glints twinkle
    for k = 1, 14 do
      local x, y = R(0, W - 1), R(6, H - 2)
      if (k + f) % 4 == 0 then L.set(img, x, y, "l") elseif (k + f) % 4 == 1 then L.set(img, x, y, "v") end
    end
  end
  L.durations(spr, 260)
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_ddm_near")
end
