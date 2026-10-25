-- 약국 – a small neighbourhood pharmacy at night (interior), 320 wide, bottom = floor level.
--  bg_phm_sky  320x200  ceiling with fluorescent tubes (1f), joins the far top
--  bg_phm_far  320x240  ceiling edge, back wall, big window onto the rainy street (1f)
--  bg_phm_mid  320x240  shelves with medicine, green cross sign, clock, posters (4f, tag loop)
--  bg_phm_near 320x40   linoleum checker floor with a soft shine (4f, tag loop)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320
local CEIL = 12          -- far-layer row where the ceiling meets the wall
local WX0, WX1, WY0, WY1 = 86, 234, 34, 112   -- window (far + mid)

-- Ceiling tiles; Y = absolute row (sky rows are -200..-1, far rows 0..).
local function ceiling(img, y0, y1, yoff)
  for y = y0, y1 do
    local Y = y + yoff
    local t = math.max(0, math.min(1, (Y + 200) / 200))
    for x = 0, W - 1 do
      local c = L.dither(x, Y + 400, t, "z", "y")
      if (Y + 400) % 12 == 0 or x % 24 == 0 then c = (t > 0.55) and "x" or "y" end
      if c == "z" and ((x * 13 + Y * 7) % 37 == 0) then c = "y" end
      L.set(img, x, y, c)
    end
  end
end

-- fluorescent fixture: housing + tube, light spill on the ceiling around it
local function tube(img, x, y, w)
  for yy = y - 5, y + 7 do
    for xx = x - 8, x + w + 7 do
      local dx = math.max(0, x - xx, xx - (x + w - 1)) / 8
      local dy = math.abs(yy - (y + 1)) / 6
      local t = 1 - math.sqrt(dx * dx + dy * dy)
      if t > 0 and L.dither(xx, yy, t * 0.8, 0, 1) == 1 then L.set(img, xx, yy, "w") end
    end
  end
  L.rect(img, x - 2, y - 1, w + 4, 4, "v"); L.hline(img, x - 2, x + w + 1, y - 1, "w")
  L.hline(img, x, x + w - 1, y + 3, "t"); L.hline(img, x, x + w - 1, y + 2, "u")
  L.set(img, x - 1, y + 3, "v"); L.set(img, x + w, y + 3, "v")
end

-- ---------------------------------------------------------------- sky (ceiling)
do
  local H = 200
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  ceiling(img, 0, H - 1, -200)
  tube(img, 30, 146, 60); tube(img, 230, 146, 60)
  tube(img, 130, 168, 60)
  -- the far layer's tubes, so their glow continues across the seam
  tube(img, 40, H + 4, 56); tube(img, 224, H + 4, 56); tube(img, 132, H + 2, 56)
  tube(img, 60, 96, 52); tube(img, 210, 104, 52)
  -- air vent
  L.rect(img, 140, 118, 40, 12, "x"); L.rect(img, 141, 119, 38, 10, "y")
  for y = 120, 127, 2 do L.hline(img, 142, 177, y, "z") end
  -- smoke detector
  L.ebox(img, 154, 60, 163, 64, "w"); L.set(img, 158, 62, "A")
  L.save(spr, "bg_phm_sky")
end

-- ---------------------------------------------------------------- far
do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(71)
  ceiling(img, 0, CEIL - 1, 0)
  tube(img, 40, 4, 56); tube(img, 224, 4, 56); tube(img, 132, 2, 56)
  -- cornice
  L.hline(img, 0, W - 1, CEIL, "u"); L.hline(img, 0, W - 1, CEIL + 1, "v"); L.hline(img, 0, W - 1, CEIL + 2, "w")
  -- wall: pale, lit from above
  L.vgradient(img, 0, CEIL + 3, W, H - CEIL - 3, { { CEIL + 3, "u" }, { 60, "v" }, { 170, "w" } })
  -- wainscot tiles
  L.rect(img, 0, 150, W, 90, "n")
  for y = 150, H - 1 do for x = 0, W - 1 do
    if (y - 150) % 8 == 7 or x % 8 == 7 then L.set(img, x, y, "o") end
    if (y - 150) % 8 == 0 and x % 8 < 3 then L.set(img, x, y, "m") end
  end end
  L.hline(img, 0, W - 1, 149, "t"); L.hline(img, 0, W - 1, 148, "u")
  -- window: night street in the rain, seen through wet glass
  L.rect(img, WX0 - 4, WY0 - 4, WX1 - WX0 + 9, WY1 - WY0 + 9, "w")
  L.rect(img, WX0 - 3, WY0 - 3, WX1 - WX0 + 7, WY1 - WY0 + 7, "t")
  L.rect(img, WX0 - 2, WY0 - 2, WX1 - WX0 + 5, WY1 - WY0 + 5, "u")
  local gw = Image(WX1 - WX0 + 1, WY1 - WY0 + 1, ColorMode.RGB)
  local GW, GH = gw.width, gw.height
  L.vgradient(gw, 0, 0, GW, GH, { { 0, "z" }, { 40, "y" }, { GH - 1, "x" } })
  -- blurry buildings across the street
  local bx = -4
  while bx < GW do
    local w = R(16, 30)
    local top = R(4, 24)
    for y = top, GH - 1 do for x = bx, bx + w - 1 do L.set(gw, x, y, L.dither(x, y, 0.4, "z", "y")) end end
    for wy = top + 4, GH - 30, 7 do
      for wx = bx + 3, bx + w - 5, 6 do
        local r = R(0, 5)
        if r < 2 then
          local c = r == 0 and "k" or "b"
          L.rect(gw, wx, wy, 3, 3, c)
          for _, p in ipairs({ { -1, 1 }, { 3, 1 }, { 1, -1 }, { 1, 3 } }) do L.set(gw, wx + p[1], wy + p[2], c == "k" and "b" or "f") end
        end
      end
    end
    bx = bx + w + R(1, 4)
  end
  -- neon blobs (out of focus)
  local function blob(cx, cy, rx, ry, c1, c2)
    L.ebox(gw, cx - rx - 2, cy - ry - 2, cx + rx + 2, cy + ry + 2, function(nx, ny, x, y)
      if L.dither(x, y, 0.5, 0, 1) == 1 then return c2 end
    end)
    L.ebox(gw, cx - rx, cy - ry, cx + rx, cy + ry, function(nx, ny, x, y)
      if nx * nx + ny * ny < 0.35 then return c1 end
      return L.dither(x, y, 0.6, c2, c1)
    end)
  end
  blob(18, 30, 6, 12, "D", "C"); blob(52, 22, 10, 4, "s", "r"); blob(100, 36, 4, 12, "k", "b")
  blob(128, 18, 8, 4, "m", "n"); blob(76, 50, 6, 3, "i", "h"); blob(140, 46, 4, 9, "C", "B")
  -- street + car lights at the bottom
  L.rect(gw, 0, GH - 14, GW, 14, "y")
  for x = 0, GW - 1 do if (x // 4) % 2 == 0 then L.set(gw, x, GH - 10, "w") end end
  for y = GH - 13, GH - 1 do for x = 0, GW - 1 do
    local refl = ({ 18, 52, 100, 128 })[(x // 37) % 4 + 1]
    if math.abs(x - refl) < 3 and (y + x) % 2 == 0 then L.set(gw, x, y, ({ "D", "s", "l", "m" })[(x // 37) % 4 + 1]) end
  end end
  L.ebox(gw, 40, GH - 9, 46, GH - 5, "l"); L.ebox(gw, 54, GH - 9, 60, GH - 5, "l")
  L.hline(gw, 47, 53, GH - 7, "y")
  L.ebox(gw, 112, GH - 8, 116, GH - 5, "A"); L.ebox(gw, 124, GH - 8, 128, GH - 5, "A")
  -- rain streaks and drops on the glass
  for _ = 1, 140 do
    local x, y = R(0, GW - 1), R(0, GH - 1)
    local len = R(2, 6)
    for k = 0, len do L.set(gw, x, y + k, (k == len) and "u" or "x") end
  end
  for _ = 1, 40 do local x, y = R(0, GW - 1), R(0, GH - 1); L.set(gw, x, y, "v"); L.set(gw, x, y + 1, "u") end
  -- reflection of the room on the glass
  for i = 0, GH - 1 do
    local x = 20 + i
    if x < GW then L.set(gw, x, GH - 1 - i, "w") end
    if x + 3 < GW and i % 2 == 0 then L.set(gw, x + 3, GH - 1 - i, "w") end
  end
  img:drawImage(gw, Point(WX0, WY0))
  -- mullions + transom
  local MX = math.floor((WX0 + WX1) / 2)
  L.rect(img, MX - 1, WY0, 3, WY1 - WY0 + 1, "u"); L.vline(img, MX + 1, WY0, WY1, "v")
  L.rect(img, WX0, WY0 + 16, WX1 - WX0 + 1, 2, "u"); L.hline(img, WX0, WX1, WY0 + 18, "v")
  -- window sill
  L.rect(img, WX0 - 6, WY1 + 3, WX1 - WX0 + 13, 3, "t"); L.hline(img, WX0 - 6, WX1 + 6, WY1 + 6, "v")
  -- painted lettering on the glass (mirrored = seen from inside: just the cross)
  L.save(spr, "bg_phm_far")
end

-- ---------------------------------------------------------------- mid
do
  local H = 240
  local spr = L.new(W, H, 4)
  -- medicine colours: { box, shade, stripe }
  local BOX = {
    { "t", "u", "i" }, { "t", "u", "q" }, { "t", "u", "n" }, { "l", "k", "a" }, { "s", "r", "q" },
    { "D", "C", "t" }, { "m", "n", "t" }, { "k", "j", "t" }, { "t", "u", "C" }, { "c", "d", "h" },
  }
  for f = 1, 4 do
    local img = L.img(spr, f)

    local function shelf(x0, x1)
      local R = L.rng(x0 + 500)
      L.rect(img, x0, 16, x1 - x0 + 1, H - 16, "x")          -- back
      for y = 16, H - 1 do if y % 3 == 0 then L.hline(img, x0 + 2, x1 - 2, y, "w") end end
      L.rect(img, x0, 14, x1 - x0 + 1, 4, "t"); L.hline(img, x0, x1, 17, "u")   -- top cap
      L.rect(img, x0, 14, 3, H - 14, "u"); L.vline(img, x0 + 2, 14, H - 1, "v")
      L.rect(img, x1 - 2, 14, 3, H - 14, "u"); L.vline(img, x1 - 2, 14, H - 1, "v")
      for by = 42, 210, 24 do
        -- items on the shelf below the board at `by`
        local x = x0 + 4
        while x < x1 - 7 do
          local kind = R(0, 9)
          if kind < 6 then
            local w, h = R(5, 10), R(9, 16)
            if x + w > x1 - 3 then break end
            local c = BOX[R(1, #BOX)]
            L.rect(img, x, by - h, w, h, c[1]); L.vline(img, x + w - 1, by - h, by - 1, c[2])
            L.hline(img, x, x + w - 1, by - h, "t")
            L.rect(img, x, by - h + 3, w - 1, 2, c[3])
            if h > 12 then L.hline(img, x + 1, x + w - 3, by - 4, c[2]) end
            x = x + w + R(0, 1)
          elseif kind < 9 then
            -- bottles
            local c = ({ { "b", "a" }, { "q", "x" }, { "t", "u" }, { "m", "n" }, { "f", "g" } })[R(1, 5)]
            for _ = 1, R(2, 3) do
              if x + 4 > x1 - 3 then break end
              L.rect(img, x, by - 8, 4, 8, c[1]); L.vline(img, x + 3, by - 8, by - 1, c[2])
              L.set(img, x, by - 8, "_"); L.set(img, x + 3, by - 8, "_")
              L.rect(img, x + 1, by - 11, 2, 3, "u"); L.hline(img, x + 1, x + 2, by - 11, (c[1] == "t") and "i" or "t")
              L.hline(img, x, x + 2, by - 5, "t")
              L.set(img, x, by - 7, "t")
              x = x + 5
            end
          else
            -- price tag hanging
            L.rect(img, x, by + 2, 6, 4, "l"); L.set(img, x + 1, by + 3, "a"); L.set(img, x + 3, by + 3, "a")
            x = x + 3
          end
        end
        -- board
        L.rect(img, x0 + 3, by, x1 - x0 - 5, 3, "u"); L.hline(img, x0 + 3, x1 - 3, by, "t"); L.hline(img, x0 + 3, x1 - 3, by + 2, "v")
      end
      -- shine from the strip light under the top cap
      for x = x0 + 3, x1 - 3 do if x % 2 == 0 then L.set(img, x, 18, "c") end end
    end
    shelf(-2, 64)
    shelf(256, 322)

    -- ======== sign: + 약국 + (pulsing green crosses)
    L.rect(img, 98, 8, 124, 22, "z"); L.rect(img, 99, 9, 122, 20, "y")
    L.hline(img, 99, 220, 9, "x")
    L.vline(img, 104, 3, 7, "v"); L.vline(img, 216, 3, 7, "v")
    local glowR = ({ 0, 1, 2, 1 })[f]
    local function cross(cx, cy)
      local tmp = Image(W, H, ColorMode.RGB)
      local function shape(img2, c, grow)
        L.rect(img2, cx - 2 - grow, cy - 7 - grow, 5 + grow * 2, 15 + grow * 2, c)
        L.rect(img2, cx - 7 - grow, cy - 2 - grow, 15 + grow * 2, 5 + grow * 2, c)
      end
      if glowR >= 2 then
        shape(tmp, "o", 2)
        for y = cy - 10, cy + 10 do for x = cx - 10, cx + 10 do
          if L.dither(x, y, 0.5, 0, 1) == 0 and tmp:getPixel(x, y) == L.c("o") then L.erase(tmp, x, y) end
        end end
      end
      if glowR >= 1 then shape(tmp, "n", 1) end
      shape(tmp, glowR >= 2 and "m" or (glowR == 1 and "m" or "n"), 0)
      -- inner highlight
      local hi = glowR >= 2 and "t" or (glowR == 1 and "l" or "m")
      L.vline(tmp, cx, cy - 5, cy + 5, hi); L.hline(tmp, cx - 5, cx + 5, cy, hi)
      img:drawImage(tmp, Point(0, 0))
    end
    cross(114, 19); cross(206, 19)
    L.text(img, 134, 13, "약국", "x", { scale = 2, step = 20 })
    L.text(img, 133, 12, "약국", "t", { scale = 2, step = 20 })

    -- ======== poster left: capsule
    L.rect(img, 67, 38, 17, 30, "t"); L.rect(img, 68, 39, 15, 28, "c")
    L.rect(img, 68, 39, 15, 6, "q"); L.hline(img, 70, 80, 41, "t"); L.hline(img, 70, 76, 43, "s")
    L.ebox(img, 70, 48, 80, 54, function(nx) if nx < 0 then return "i" end return "t" end)
    L.hline(img, 72, 75, 49, "D"); L.vline(img, 75, 48, 54, "u")
    for y = 58, 64, 2 do L.hline(img, 70, 70 + ((y * 3) % 7) + 4, y, "w") end
    L.set(img, 75, 37, "w")
    -- poster left lower: smiling tooth / health check
    L.rect(img, 67, 74, 17, 22, "t"); L.rect(img, 68, 75, 15, 20, "m")
    L.ebox(img, 70, 77, 80, 87, "t"); L.set(img, 73, 81, "z"); L.set(img, 77, 81, "z"); L.hline(img, 74, 76, 84, "D")
    L.hline(img, 70, 80, 90, "o"); L.hline(img, 70, 77, 92, "o")

    -- ======== wall clock with pendulum (right of the window)
    local CX, CY = 245, 46
    L.rect(img, CX - 6, CY + 6, 13, 26, "f"); L.rect(img, CX - 5, CY + 7, 11, 24, "e")
    L.rect(img, CX - 4, CY + 8, 9, 22, "g")
    local sw = ({ -2, 0, 2, 0 })[f]
    L.line(img, CX, CY + 8, CX + sw, CY + 24, "k")
    L.ebox(img, CX + sw - 2, CY + 23, CX + sw + 2, CY + 27, "k"); L.set(img, CX + sw - 1, CY + 24, "l")
    L.ebox(img, CX - 8, CY - 8, CX + 8, CY + 8, "f")
    L.ebox(img, CX - 7, CY - 7, CX + 7, CY + 7, "e")
    L.ebox(img, CX - 6, CY - 6, CX + 6, CY + 6, "c")
    for _, p in ipairs({ { 0, -5 }, { 5, 0 }, { 0, 5 }, { -5, 0 } }) do L.set(img, CX + p[1], CY + p[2], "f") end
    L.line(img, CX, CY, CX + 3, CY - 2, "z")   -- hour (~10 to 10)
    L.line(img, CX, CY, CX - 1, CY - 5, "z")   -- minute
    local sec = ({ { 4, 2 }, { 2, 4 }, { -1, 4 }, { -3, 3 } })[f]
    L.line(img, CX, CY, CX + sec[1], CY + sec[2], "i")
    L.set(img, CX, CY, "g")

    -- poster right: vitamins
    L.rect(img, 237, 82, 17, 24, "t"); L.rect(img, 238, 83, 15, 22, "k")
    L.ebox(img, 241, 86, 249, 94, "j"); L.ebox(img, 243, 88, 247, 92, "l")
    L.hline(img, 240, 251, 98, "a"); L.hline(img, 240, 248, 100, "a")

    -- ======== raindrops sliding down the window glass
    local DR = L.rng(91)
    for k = 1, 9 do
      local x = DR(WX0 + 2, WX1 - 2)
      if math.abs(x - (WX0 + WX1) // 2) > 2 then
        local y0 = DR(WY0 + 20, WY1 - 30)
        local y = y0 + ((f + k) % 4) * DR(3, 6)
        for t = y0, y - 1 do if (t + k) % 2 == 0 then L.set(img, x, t, "w") end end
        L.set(img, x, y, "u"); L.set(img, x, y + 1, "t"); L.set(img, x + 1, y + 1, "v")
      end
    end

    -- ======== hanging paper sign on the glass + potted plant on the sill
    L.vline(img, 102, WY0 - 2, WY0 + 3, "v"); L.vline(img, 118, WY0 - 2, WY0 + 3, "v")
    L.rect(img, 98, WY0 + 4, 25, 11, "t"); L.rect(img, 99, WY0 + 5, 23, 9, "c")
    L.text(img, 99, WY0 + 6, "약", "n"); L.rect(img, 109, WY0 + 8, 11, 2, "w"); L.rect(img, 109, WY0 + 11, 8, 1, "w")
    local PX = 222
    L.rect(img, PX - 4, WY1 - 6, 9, 8, "a"); L.hline(img, PX - 5, PX + 5, WY1 - 6, "b"); L.vline(img, PX + 4, WY1 - 5, WY1 + 1, "h")
    for _, lf in ipairs({ { -4, -12 }, { 3, -14 }, { 0, -18 }, { -6, -8 }, { 6, -9 } }) do
      L.line(img, PX, WY1 - 7, PX + lf[1], WY1 - 7 + lf[2], "n")
      L.set(img, PX + lf[1], WY1 - 7 + lf[2], "m")
    end
    -- green glow of the crosses on the wall below the sign (pulse)
    if glowR >= 1 then
      for x = 100, 220 do
        if (x + f) % (glowR == 2 and 2 or 4) == 0 then L.set(img, x, 31, "m") end
      end
    end
  end
  L.durations(spr, 280)
  spr.frames[3].duration = 0.36
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_phm_mid")
end

-- ---------------------------------------------------------------- near (floor)
do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    -- skirting
    L.hline(img, 0, W - 1, 0, "o"); L.hline(img, 0, W - 1, 1, "p"); L.hline(img, 0, W - 1, 2, "z")
    -- checker linoleum in soft perspective
    local rowH = { 3, 4, 4, 5, 6, 7, 8 }
    local y, row = 3, 0
    while y < H do
      local h = rowH[math.min(row + 1, #rowH)]
      for yy = y, math.min(H - 1, y + h - 1) do
        local cw = 14 + yy * 0.35
        for x = 0, W - 1 do
          local u = math.floor((x - 160) / cw + 100)
          local light = (u + row) % 2 == 0
          local c = light and "u" or "w"
          if yy == y then c = light and "t" or "v" end
          if L.dither(x, yy, yy / 80, 0, 1) == 1 then c = light and "v" or "x" end
          L.set(img, x, yy, c)
        end
      end
      y = y + h; row = row + 1
    end
    -- reflection of the window (soft vertical shine under it) + tube lights
    for yy = 3, H - 1 do
      for x = 96, 224 do
        if (x * 3 + yy * 5 + f) % 9 == 0 and L.dither(x, yy, yy / 40, 1, 0) == 1 then L.set(img, x, yy, "t") end
      end
    end
    -- green pulse from the cross sign
    local gr = ({ 0, 1, 2, 1 })[f]
    for x = 104, 216, 2 do
      if gr >= 1 and (x // 2 + f) % (3 - gr) == 0 then L.set(img, x, 4, "m") end
      if gr == 2 and x % 4 == 0 then L.set(img, x + 1, 6, "m") end
    end
    -- sliding glint
    local gx = 20 + f * 70
    for k = 0, 6 do L.set(img, gx + k * 2, 8 + k, "t"); L.set(img, gx + k * 2 + 1, 8 + k, "t") end
  end
  L.durations(spr, 280)
  spr.frames[3].duration = 0.36
  L.tag(spr, "loop", 1, 4)
  L.save(spr, "bg_phm_near")
end
