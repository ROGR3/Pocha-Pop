-- Extra sky above the far layers for tall screens (320x200, bottom joins the far layer top).
local L = dofile(app.params.root .. "/art/lib.lua")
local W, H = 320, 200

-- 을지로: rain clouds lit from below by the city
do
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(31)
  L.rect(img, 0, 0, W, H, "z")
  -- cloud banks: overlapping ellipses, lighter towards their bottoms
  for k = 1, 26 do
    local cx, cy = R(-20, W + 20), R(20, 170)
    local rx, ry = R(18, 46), R(6, 12)
    L.ebox(img, cx - rx, cy - ry, cx + rx, cy + ry, function(nx, ny, x, y)
      if ny > 0.35 then return L.dither(x, y, 0.5, "y", "x") end
      return "y"
    end)
  end
  -- glow near the bottom (city light)
  for y = 150, H - 1 do for x = 0, W - 1 do
    local t = (y - 150) / 50
    local base = img:getPixel(x, y)
    if L.dither(x, y, t * 0.6, 0, 1) == 1 then L.set(img, x, y, "y") end
    if base == L.c("x") and L.dither(x, y, t, 0, 1) == 1 then L.set(img, x, y, "B") end
  end end
  for _ = 1, 12 do L.set(img, R(0, W - 1), R(0, 60), "w") end
  L.save(spr, "bg_eul_sky")
end

-- 한강: clear night, stars, a couple of thin clouds
do
  local spr = L.new(W, H, 1)
  local img = L.img(spr, 1)
  local R = L.rng(32)
  L.rect(img, 0, 0, W, H, "z")
  for _ = 1, 120 do
    local x, y = R(0, W - 1), R(0, H - 1)
    local r = R(0, 9)
    L.set(img, x, y, r == 0 and "t" or (r < 3 and "u" or (r < 6 and "v" or "w")))
    if r == 0 and R(0, 2) == 0 then L.set(img, x - 1, y, "w"); L.set(img, x + 1, y, "w"); L.set(img, x, y - 1, "w"); L.set(img, x, y + 1, "w") end
  end
  for k = 1, 4 do
    local cx, cy = R(0, W), R(60, 170)
    for x = cx - 40, cx + 40 do
      local y = cy + math.floor(math.sin(x / 9) * 1.5)
      if (x + k) % 3 ~= 0 then L.set(img, x, y, "y") end
      if x % 2 == 0 then L.set(img, x, y + 1, "y") end
    end
  end
  L.save(spr, "bg_han_sky")
end
