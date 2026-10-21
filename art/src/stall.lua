-- 포장마차 stall pieces. Layered in game: stall_back → customers → counter → pot.
-- Upgrades are separate sprites: lantern, awning, radio, stool.
local L = dofile(app.params.root .. "/art/lib.lua")
local R = L.rng(11)

-- ------------------------------------------------------------ stall_back 208x120
do
  local W, H = 208, 120
  local spr = L.new(W, H, 4) -- frames: lights flicker very slightly
  for f = 1, 4 do
    local img = L.img(spr, f)
    -- interior back wall: warm lamp-lit tarp
    L.vgradient(img, 10, 24, 188, 72, { { 24, "j" }, { 40, "b" }, { 70, "e" }, { 95, "f" } })
    -- tarp folds on the back wall
    for x = 22, 196, 18 do
      for y = 26, 95 do L.set(img, x, y, L.dither(x, y, 0.5, "e", "f")) end
    end
    -- side tarp walls
    for _, x0 in ipairs({ 0, 194 }) do
      for x = x0, x0 + 13 do
        for y = 22, 100 do
          local c = ((x - x0) % 5 == 0) and "b" or "j"
          if y > 92 then c = "b" end
          L.set(img, x, y, c)
        end
      end
      L.vline(img, x0 + (x0 == 0 and 13 or 0), 22, 100, "a")
    end
    -- shelf with soju bottles and glasses
    L.rect(img, 122, 50, 70, 3, "f"); L.hline(img, 122, 191, 50, "e")
    for i = 0, 6 do
      local x = 126 + i * 9
      if i % 3 == 2 then
        L.map(img, x, 43, { "uuu", "u.u", "uuu", "vuv" }) -- glass
      else
        L.map(img, x, 36, { ".o.", ".n.", ".n.", "nmn", "nmn", "ntn", "ntn", "nmn", "non", "ooo" }) -- soju bottle
      end
    end
    L.rect(img, 122, 72, 70, 3, "f"); L.hline(img, 122, 191, 72, "e")
    L.map(img, 128, 63, { ".cc.", "cttc", "cttc", "ctdc", ".dd." })   -- 장 jar
    L.map(img, 140, 64, { "ffff", "fbbf", "fbbf", "ffff" })            -- box
    L.map(img, 160, 60, { "..h..", ".hih.", "hiiih", "hiDih", "hiiih", ".hhh." }) -- gochujang tub
    L.map(img, 176, 62, { "kk", "kk", "jj", "kk", "kk" })              -- ramyeon packs
    L.map(img, 180, 62, { "ii", "ii", "hh", "ii", "ii" })
    -- menu board (메뉴) hanging on the back wall
    L.line(img, 58, 24, 52, 30, "z"); L.line(img, 92, 24, 98, 30, "z")
    L.rect(img, 44, 30, 62, 30, "e"); L.rect(img, 46, 32, 58, 26, "c")
    L.hline(img, 44, 105, 59, "f")
    L.text(img, 67, 33, "메뉴", "i", { step = 9 })
    for row = 0, 3 do
      local y = 43 + row * 4
      local len = 18 + R(0, 12)
      for x = 49, 49 + len do if (x + row) % 3 ~= 0 then L.set(img, x, y, "g") end end
      L.hline(img, 92, 100, y, "h")
    end
    -- roof
    for y = 0, 21 do
      local inset = math.floor((21 - y) * 0.9)
      for x = inset, W - 1 - inset do
        local c = "j"
        if (x % 16 == 0) then c = "b" end
        if y < 3 then c = "k" end
        if y == 21 then c = "a" end
        L.set(img, x, y, c)
      end
    end
    -- valance with scalloped edge
    for x = 0, W - 1 do
      local depth = 26 + ((x % 13 < 7) and 1 or 0) + ((x % 13 == 6) and 1 or 0)
      for y = 18, depth do
        local c = (y == 18) and "k" or "i"
        if y >= depth - 1 then c = "h" end
        L.set(img, x, y, c)
      end
    end
    -- sign plate 포차
    L.rect(img, 86, 14, 36, 13, "c"); L.rect(img, 86, 14, 36, 1, "t"); L.rect(img, 86, 26, 36, 1, "d")
    L.text(img, 95, 17, "포차", "h", { step = 10 })
    -- poles
    L.rect(img, 2, 20, 3, 100, "w"); L.vline(img, 2, 20, 119, "u")
    L.rect(img, 203, 20, 3, 100, "w"); L.vline(img, 203, 20, 119, "u")
    -- hanging bulb (light flicker per frame)
    L.vline(img, 104, 27, 31, "z")
    local bulb = (f == 3) and "k" or "l"
    L.map(img, 102, 32, { ".ww.", "wllw", "llll", ".ll." }, { sub = { l = bulb } })
    L.set(img, 103, 34, "t")
  end
  L.durations(spr, 200)
  spr.frames[3].duration = 0.08
  L.tag(spr, "glow", 1, 4)
  L.save(spr, "stall_back")
end

-- ------------------------------------------------------------ counter 208x36
do
  local spr = L.new(208, 36, 1)
  local img = L.img(spr, 1)
  -- top
  L.rect(img, 0, 0, 208, 5, "d"); L.hline(img, 0, 207, 0, "c"); L.hline(img, 1, 206, 1, "c")
  L.hline(img, 0, 207, 4, "b"); L.hline(img, 0, 207, 5, "f")
  for x = 6, 200, 23 do L.set(img, x, 2, "b"); L.set(img, x + 1, 2, "b") end
  -- front planks
  for y = 6, 31 do
    for x = 4, 203 do
      local c = "e"
      if (x - 4) % 20 == 0 then c = "f" elseif (x - 4) % 20 == 1 then c = "b" end
      if y == 6 then c = "f" end
      if y >= 29 then c = "f" end
      L.set(img, x, y, c)
    end
  end
  -- knots
  for i = 0, 8 do
    local x, y = 12 + i * 21 + R(0, 4), 12 + R(0, 12)
    L.map(img, x, y, { ".f.", "fgf", ".f." })
  end
  -- orange tarp skirt with the stall's name stripe
  L.rect(img, 4, 15, 200, 6, "j"); L.hline(img, 4, 203, 15, "k"); L.hline(img, 4, 203, 20, "b")
  for x = 10, 200, 12 do L.rect(img, x, 17, 2, 2, "l") end
  -- legs
  L.rect(img, 6, 31, 4, 5, "f"); L.rect(img, 198, 31, 4, 5, "f")
  L.rect(img, 102, 31, 4, 5, "f")
  L.save(spr, "counter")
end

-- ------------------------------------------------------------ pot on burner 28x36, 6 frames steam
do
  local spr = L.new(28, 36, 6)
  for f = 1, 6 do
    local img = L.img(spr, f)
    -- burner
    L.rect(img, 3, 30, 22, 5, "x"); L.hline(img, 3, 24, 30, "w"); L.rect(img, 5, 35, 3, 1, "y"); L.rect(img, 20, 35, 3, 1, "y")
    L.set(img, 21, 32, f % 2 == 0 and "i" or "h")
    -- flame
    for x = 6, 21 do
      local hgt = ((x + f) % 3 == 0) and 2 or 1
      for y = 29 - hgt + 1, 29 do L.set(img, x, y, (y == 29) and "q" or "r") end
      if (x + f) % 4 == 0 then L.set(img, x, 27, "s") end
    end
    -- stock pot
    L.rect(img, 4, 15, 20, 13, "v"); L.rect(img, 4, 15, 4, 13, "u"); L.rect(img, 21, 15, 3, 13, "w")
    L.hline(img, 4, 23, 27, "w")
    L.set(img, 6, 17, "t"); L.set(img, 6, 18, "t")
    L.rect(img, 1, 17, 3, 2, "w"); L.rect(img, 24, 17, 3, 2, "w")
    L.ebox(img, 3, 12, 24, 17, function(nx, ny) return ny < 0 and "u" or "v" end)
    L.ebox(img, 5, 13, 22, 16, function(nx, ny) return ny < -0.2 and "a" or "j" end)
    L.set(img, 8 + f % 3, 14, "k"); L.set(img, 15 + (f * 2) % 4, 15, "l"); L.set(img, 12, 14, "m")
    -- bubbles
    if f % 2 == 0 then L.set(img, 17, 14, "k") else L.set(img, 10, 15, "k") end
    -- steam (rises & curls over 6 frames)
    for k = 0, 2 do
      local phase = (f - 1 + k * 2) % 6
      local y = 10 - phase * 2
      local x = 8 + k * 5 + ((phase % 2 == 0) and 0 or 1)
      local c = phase < 3 and "t" or (phase < 5 and "u" or "v")
      if y >= 0 then
        L.set(img, x, y, c); L.set(img, x + 1, y - 1, c)
        if phase < 4 then L.set(img, x, y + 1, c) end
      end
    end
  end
  L.durations(spr, 120)
  L.tag(spr, "boil", 1, 6)
  L.save(spr, "pot")
end

-- ------------------------------------------------------------ paper lantern 12x18, 4 frames
do
  local spr = L.new(12, 18, 4)
  local glow = { "k", "l", "k", "j" }
  for f = 1, 4 do
    local img = L.img(spr, f)
    L.vline(img, 6, 0, 2, "z")
    L.rect(img, 4, 2, 4, 2, "g")
    L.ebox(img, 1, 3, 10, 15, function(nx, ny, x, y)
      if (y - 3) % 3 == 0 then return "h" end
      if math.abs(nx) < 0.35 and math.abs(ny) < 0.5 then return glow[f] end
      if nx < -0.55 then return "j" end
      if nx > 0.5 then return "a" end
      return "i"
    end)
    L.rect(img, 4, 15, 4, 2, "g")
    L.vline(img, 6, 17, 17, "k")
  end
  L.durations(spr, 260)
  spr.frames[4].duration = 0.1
  L.tag(spr, "blink", 1, 4)
  L.save(spr, "lantern")
end

-- ------------------------------------------------------------ awning (plachta) 216x12
do
  local spr = L.new(216, 12, 1)
  local img = L.img(spr, 1)
  for x = 0, 215 do
    local stripe = math.floor(x / 9) % 2 == 0
    local depth = 8 + ((x % 9 < 5) and 1 or 0)
    for y = 0, depth do
      local c = stripe and "q" or "t"
      if y == 0 then c = stripe and "r" or "t" end
      if y >= depth then c = stripe and "y" or "u" end
      L.set(img, x, y, c)
    end
  end
  L.hline(img, 0, 215, 0, "u")
  L.save(spr, "awning")
end

-- ------------------------------------------------------------ radio 18x12, 2 frames
do
  local spr = L.new(18, 14, 2)
  for f = 1, 2 do
    local img = L.img(spr, f)
    L.line(img, 13, 0, 16, 3, "v")
    L.rect(img, 1, 4, 16, 9, "i"); L.hline(img, 1, 16, 4, "D"); L.hline(img, 1, 16, 12, "h")
    for y = 6, 10 do for x = 3, 8 do if (x + y) % 2 == 0 then L.set(img, x, y, "f") else L.set(img, x, y, "h") end end end
    L.rect(img, 10, 6, 5, 2, "c"); L.set(img, 11 + f, 6, "i")
    L.set(img, 11, 9, "k"); L.set(img, 14, 9, "u"); L.rect(img, 2, 13, 2, 1, "g"); L.rect(img, 14, 13, 2, 1, "g")
    if f == 2 then L.set(img, 3, 5, "t") end
  end
  L.durations(spr, 300)
  L.tag(spr, "play", 1, 2)
  L.save(spr, "radio")
end

-- ------------------------------------------------------------ red plastic stool 16x14
do
  local spr = L.new(16, 14, 1)
  local img = L.img(spr, 1)
  L.ebox(img, 0, 0, 15, 4, function(nx, ny) return ny < 0 and "D" or "i" end)
  L.map(img, 1, 4, {
    "iiiiiiiiiiiiii",
    ".ih........hi.",
    ".ih..hiih..hi.",
    "..ih.h..h.hi..",
    "..ih.hiih.hi..",
    "..ih......hi..",
    "...ih....hi...",
    "...ih....hi...",
    "..hhh....hhh..",
  })
  L.outline(img, "g")
  L.save(spr, "stool")
end
