-- 한강 riverside park at night, 320 wide, bottom = ground level.
--  bg_han_far  320x240  sky, moon, skyline with N Seoul Tower (1f)
--  bg_han_mid  320x240  bridge with colour-cycling lights + river (4f)
--  bg_han_near 320x40   grass and path (4f, fireflies twinkle)
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 320

do
  local H = 240
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(8)
  L.vgradient(img, 0, 0, W, H, { { 0, "z" }, { 40, "y" }, { 80, "q" }, { 110, "B" } })
  for _ = 1, 70 do
    local x, y = R(0, W - 1), R(0, 70)
    L.set(img, x, y, R(0, 4) == 0 and "t" or "v")
  end
  -- moon
  L.ebox(img, 238, 12, 255, 29, function(nx, ny) if nx + ny > 0.9 then return "u" end return "c" end)
  L.set(img, 243, 18, "u"); L.set(img, 247, 23, "u"); L.set(img, 249, 16, "u")
  -- skyline across the river
  local x = 0
  while x < W do
    local w = R(10, 24)
    local top = R(54, 96)
    for yy = top, 120 do for xx = x, math.min(W - 1, x + w - 1) do L.set(img, xx, yy, "x") end end
    for wy = top + 3, 116, 4 do
      for wx = x + 2, x + w - 3, 3 do if R(0, 5) == 0 then L.set(img, wx, wy, R(0, 2) == 0 and "l" or "c") end end
    end
    x = x + w + R(0, 2)
  end
  -- N Seoul Tower on a hill
  L.ebox(img, 40, 80, 130, 150, "y", { y1 = 120 })
  L.rect(img, 83, 34, 3, 48, "w"); L.vline(img, 83, 34, 81, "v")
  L.rect(img, 79, 42, 11, 6, "w"); L.hline(img, 79, 89, 42, "u"); L.hline(img, 80, 88, 45, "l")
  L.vline(img, 84, 22, 33, "v"); L.set(img, 84, 21, "A")
  L.rect(img, 0, 120, W, 120, "y")
  L.save(spr, "bg_han_far")
end

do
  local H = 240
  local spr = L.new(W, H, 4)
  local lights = { "A", "k", "m", "s", "C" }
  for f = 1, 4 do
    local img = L.img(spr, f)
    -- river
    for y = 110, H - 1 do
      for x = 0, W - 1 do
        local c = L.dither(x, y, (y - 110) / 120, "q", "y")
        if ((x + f * 3) % 23 == 0 or (x * 3 + y + f * 5) % 41 == 0) and y % 3 == 0 then c = "r" end
        L.set(img, x, y, c)
      end
    end
    -- bridge deck
    L.rect(img, 0, 88, W, 6, "w"); L.hline(img, 0, W - 1, 88, "v"); L.rect(img, 0, 94, W, 2, "x")
    -- arches & piers
    for px = 10, W, 60 do
      L.rect(img, px, 96, 6, 16, "x"); L.vline(img, px, 96, 111, "w")
      for x = px - 30, px + 30 do
        local t = (x - px) / 30
        local y = 96 + math.floor(10 * t * t)
        if y < 106 then L.set(img, x, y, "w") end
      end
    end
    -- lights along the deck, cycling
    for x = 2, W - 1, 6 do
      local c = lights[((math.floor(x / 6) + f) % #lights) + 1]
      L.set(img, x, 87, c); L.set(img, x, 91, "l")
      -- reflection in water
      local ry = 116 + (x * 7 + f * 3) % 60
      if (x / 6) % 2 == 0 then L.set(img, x, ry, c); L.set(img, x + 1, ry, c) end
    end
    -- rainbow fountain jets from the deck (Banpo bridge)
    for x = 20, W - 20, 12 do
      local c = lights[((math.floor(x / 12) + f) % #lights) + 1]
      for k = 0, 6 do
        local yy = 96 + k * 2 + ((f + k) % 2)
        L.set(img, x + math.floor(k / 2), yy, k < 3 and "s" or c)
      end
    end
    -- far bank glow line
    L.hline(img, 0, W - 1, 110, "C")
  end
  L.durations(spr, 300)
  L.tag(spr, "lights", 1, 4)
  L.save(spr, "bg_han_mid")
end

do
  local H = 40
  local spr = L.new(W, H, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local R = L.rng(9)
    for y = 0, H - 1 do for x = 0, W - 1 do L.set(img, x, y, L.dither(x, y, y / 50, "o", "p")) end end
    -- grass tufts along the top edge
    for x = 0, W - 1, 3 do
      local h = R(1, 3)
      for k = 0, h do L.set(img, x + (k % 2), -k + 1, k == h and "m" or "n") end
    end
    -- footpath
    L.rect(img, 0, 22, W, 9, "d"); L.hline(img, 0, W - 1, 22, "c"); L.hline(img, 0, W - 1, 30, "e")
    for x = 0, W - 1, 16 do L.vline(img, x, 23, 29, "e") end
    -- picnic mat
    L.rect(img, 250, 8, 40, 10, "r")
    for x = 250, 289 do for y = 8, 17 do if (math.floor(x / 4) + math.floor(y / 3)) % 2 == 0 then L.set(img, x, y, "t") end end end
    -- fireflies
    for k = 1, 8 do
      local x, y = R(0, W - 1), R(2, 20)
      if (k + f) % 3 ~= 0 then L.set(img, x, y, "l"); L.set(img, x + 1, y, "k") end
    end
  end
  L.durations(spr, 260)
  L.tag(spr, "twinkle", 1, 4)
  L.save(spr, "bg_han_near")
end
