-- 을지로 alley at night, 3 parallax layers, 320 wide, bottom = street level.
--  bg_eul_far  320x240  sky + distant towers (1f)
--  bg_eul_mid  320x240  old alley buildings, neon signs (4f blink)
--  bg_eul_near 320x40   wet street with puddle reflections (4f)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320

-- ---------------------------------------------------------------- far
do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(3)
  L.vgradient(img, 0, 0, W, H, { { 0, "z" }, { 70, "y" }, { 150, "x" }, { 200, "B" }, { 239, "C" } })
  -- stars / haze dots
  for _ = 1, 40 do L.set(img, R(0, W - 1), R(0, 90), R(0, 3) == 0 and "u" or "w") end
  -- distant towers
  local x = 0
  while x < W do
    local w = R(14, 30)
    local top = R(60, 150)
    for yy = top, H - 1 do
      for xx = x, math.min(W - 1, x + w - 1) do
        L.set(img, xx, yy, (xx == x) and "x" or "y")
      end
    end
    -- windows
    for wy = top + 4, H - 6, 5 do
      for wx = x + 2, x + w - 3, 4 do
        local r = R(0, 9)
        if r < 3 then L.rect(img, wx, wy, 2, 2, r == 0 and "l" or (r == 1 and "k" or "w")) end
      end
    end
    if R(0, 2) == 0 then L.vline(img, x + math.floor(w / 2), top - 8, top - 1, "w"); L.set(img, x + math.floor(w / 2), top - 9, "A") end
    x = x + w + R(0, 3)
  end
  L.save(spr, "bg_eul_far")
end

-- ---------------------------------------------------------------- mid
do
  local H = 240
  local spr = L.new(W, H, 4)
  local R0 = 21
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(R0)
    -- left block (old print-shop buildings)
    local function building(x0, x1, top, wall, wall2, trim)
      for y = top, H - 1 do
        for x = x0, x1 do
          local c = wall
          if (y - top) % 26 == 0 then c = trim end
          if x == x0 or x == x1 then c = wall2 end
          L.set(img, x, y, c)
        end
      end
      -- windows per floor
      for fy = top + 6, H - 30, 26 do
        for wx = x0 + 5, x1 - 12, 16 do
          local lit = R(0, 3)
          L.rect(img, wx, fy, 10, 12, "y")
          if lit > 0 then
            local c = lit == 1 and "k" or (lit == 2 and "b" or "w")
            L.rect(img, wx + 1, fy + 1, 8, 10, c)
            L.vline(img, wx + 5, fy + 1, fy + 10, "y"); L.hline(img, wx + 1, wx + 8, fy + 6, "y")
            if lit == 1 then L.rect(img, wx + 1, fy + 1, 4, 2, "l") end
          end
          L.hline(img, wx - 1, wx + 10, fy + 12, "w")
        end
      end
      -- shutters at street level
      for sx = x0 + 3, x1 - 20, 22 do
        L.rect(img, sx, H - 24, 18, 24, "w")
        for sy = H - 24, H - 1, 2 do L.hline(img, sx, sx + 17, sy, "x") end
      end
    end
    building(-2, 66, 30, "f", "g", "e")
    building(68, 96, 70, "w", "x", "v")
    building(226, 256, 64, "x", "y", "w")
    building(258, 322, 20, "e", "f", "b")
    -- AC units + pipes
    for _, p in ipairs({ { 6, 96 }, { 40, 150 }, { 272, 120 }, { 300, 70 }, { 236, 160 } }) do
      L.rect(img, p[1], p[2], 14, 9, "u"); L.rect(img, p[1], p[2] + 8, 14, 1, "v")
      for k = 0, 2 do L.hline(img, p[1] + 2, p[1] + 7, p[2] + 2 + k * 2, "v") end
      L.ebox(img, p[1] + 8, p[2] + 2, p[1] + 12, p[2] + 6, "w")
    end
    L.vline(img, 64, 30, H - 1, "u"); L.vline(img, 65, 30, H - 1, "v")
    L.vline(img, 259, 20, H - 1, "v")
    -- electric wires across the alley
    for k = 0, 3 do
      local y0 = 26 + k * 9
      for x = 60, 262 do
        local t = (x - 60) / 202
        local sag = math.floor(14 * 4 * t * (1 - t))
        L.set(img, x, y0 + sag, k % 2 == 0 and "z" or "y")
      end
    end
    -- neon: vertical 호프 sign (left), blinks off in frame 3
    local on1 = f ~= 3
    L.rect(img, 70, 76, 14, 34, "z"); L.rect(img, 71, 77, 12, 32, "y")
    if on1 then
      L.neon(img, 74, 80, "호프", "D", "C", { vertical = true, step = 12 })
    else
      L.text(img, 74, 80, "호프", "B", { vertical = true, step = 12 })
    end
    -- neon: 노래방 horizontal on right building, colour cycles
    local nc = ({ "s", "s", "r", "s" })[f]
    L.rect(img, 228, 50, 30, 12, "z")
    L.neon(img, 230, 52, "노래방", nc, f ~= 4 and "q" or nil, { step = 9 })
    -- neon: 치킨 sign on the far-right building
    local kc = (f % 2 == 1) and "l" or "k"
    L.rect(img, 268, 92, 30, 13, "z")
    L.neon(img, 273, 95, "치킨", kc, "j", { step = 11 })
    -- neon: 을지로 street sign high on the left
    L.rect(img, 6, 44, 30, 12, "q"); L.rect(img, 7, 45, 28, 10, "r")
    L.text(img, 8, 47, "을지로", "t", { step = 9 })
    -- neon: 맥주 small (blinks)
    if f == 1 or f == 2 then
      L.neon(img, 14, 120, "맥주", "l", "k", { step = 9 })
    else
      L.text(img, 14, 120, "맥주", "f", { step = 9 })
    end
    -- string of tiny bulbs between buildings
    for x = 66, 256, 6 do
      local t = (x - 66) / 190
      local y = 66 + math.floor(10 * 4 * t * (1 - t))
      L.set(img, x, y, ((x / 6 + f) % 3 < 1) and "l" or "k")
    end
  end
  L.durations(spr, 400)
  spr.frames[3].duration = 0.15
  L.tag(spr, "neon", 1, 4)
  L.save(spr, "bg_eul_mid")
end

-- ---------------------------------------------------------------- near (street)
do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(5)
    for y = 0, H - 1 do for x = 0, W - 1 do L.set(img, x, y, L.dither(x, y, y / 60, "x", "y")) end end
    L.hline(img, 0, W - 1, 0, "w")
    -- curb
    L.rect(img, 0, 1, W, 2, "v"); L.hline(img, 0, W - 1, 3, "w")
    -- puddles with neon reflections
    local puddles = { { 20, 12, 40 }, { 120, 22, 54 }, { 230, 14, 46 }, { 290, 28, 30 } }
    for i, p in ipairs(puddles) do
      L.ebox(img, p[1], p[2], p[1] + p[3], p[2] + 5, function(nx, ny, x, y)
        local wave = ((x + f * 2 + y) % 7 == 0)
        if wave then return "u" end
        local cols = { "C", "s", "l", "D" }
        if math.abs(nx) < 0.3 then return cols[(i + f) % 4 + 1] end
        return "q"
      end)
    end
    -- manhole + crack details
    L.ebox(img, 180, 30, 196, 35, "w"); L.ebox(img, 182, 31, 194, 34, "x")
    for _ = 1, 30 do L.set(img, R(0, W - 1), R(6, H - 1), "w") end
  end
  L.durations(spr, 220)
  L.tag(spr, "shimmer", 1, 4)
  L.save(spr, "bg_eul_near")
end
