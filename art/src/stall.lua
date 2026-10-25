-- 포장마차 stall pieces. Layered in game: stall_back → customers → counter → pot.
-- Upgrades are separate sprites: lantern, awning, radio, stool.
local L = dofile(app.params.root .. "/art/lib.lua")
local R = L.rng(11)
local roof, sign

-- ------------------------------------------------------------ roof / valance / sign (colourable)
-- ramp = { hi, main, shade, dark } or nil for the original orange + red look.
roof = function(img, ramp)
  local W = 208
  local top, main, fold, edge = "k", "j", "b", "a"
  local vtop, vmain, vdark = "k", "i", "h"
  if ramp then top, main, fold, edge = ramp[1], ramp[2], ramp[3], ramp[4]; vtop, vmain, vdark = ramp[1], ramp[3], ramp[4] end
  for y = 0, 21 do
    local inset = math.floor((21 - y) * 0.9)
    for x = inset, W - 1 - inset do
      local c = main
      if (x % 16 == 0) then c = fold end
      if y < 3 then c = top end
      if y == 21 then c = edge end
      L.set(img, x, y, c)
    end
  end
  -- valance with scalloped edge
  for x = 0, W - 1 do
    local depth = 26 + ((x % 13 < 7) and 1 or 0) + ((x % 13 == 6) and 1 or 0)
    for y = 18, depth do
      local c = (y == 18) and vtop or vmain
      if y >= depth - 1 then c = vdark end
      L.set(img, x, y, c)
    end
  end
  L.vline(img, 104, 27, 28, "z") -- bulb wire
end

-- sign plate 포차 (36x13) at x, y
sign = function(img, ramp, x, y)
  local plate, hi, lo, ink = "c", "t", "d", "h"
  if ramp then
    plate, hi, lo = ramp[2], ramp[1], ramp[3]
    ink = L.LIGHT[ramp.name] and "g" or "t"
    if ramp.name == "white" then lo = "u" end
  end
  L.rect(img, x, y, 36, 13, plate); L.rect(img, x, y, 36, 1, hi); L.rect(img, x, y + 12, 36, 1, lo)
  L.text(img, x + 9, y + 3, "포차", ink, { step = 10 })
end

local function ramp(name)
  local r = L.RAMPS[name]
  return { r[1], r[2], r[3], r[4], name = name }
end

-- colour sheets: frame 1 = original, frames 2..12 = L.COLORS
do
  local spr = L.new(208, 29, 12)
  for f = 1, 12 do roof(L.img(spr, f), f > 1 and ramp(L.COLORS[f - 1]) or nil) end
  L.save(spr, "stall_roof", { sheet = true })
end
do
  local spr = L.new(36, 13, 12)
  for f = 1, 12 do sign(L.img(spr, f), f > 1 and ramp(L.COLORS[f - 1]) or nil, 0, 0) end
  L.save(spr, "stall_sign", { sheet = true })
end

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
    roof(img, nil)
    sign(img, nil, 86, 14)
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
-- lantern: original red. lanterns: 12 colours x 4 frames (colour c → frames c*4 .. c*4+3).
local function lanternFrame(img, f, r)
  local glow = { "k", "l", "k", "j" }
  local hi, main, shade, rib = "j", "i", "a", "h"
  if r then hi, main, shade, rib = r[1], r[2], r[3], r[4] end
  if r and r.name == "white" then rib = "v" end
  L.vline(img, 6, 0, 2, "z")
  L.rect(img, 4, 2, 4, 2, "g")
  L.ebox(img, 1, 3, 10, 15, function(nx, ny, x, y)
    if (y - 3) % 3 == 0 then return rib end
    if math.abs(nx) < 0.35 and math.abs(ny) < 0.5 then return glow[f] end
    if nx < -0.55 then return hi end
    if nx > 0.5 then return shade end
    return main
  end)
  L.rect(img, 4, 15, 4, 2, "g")
  L.vline(img, 6, 17, 17, "k")
end
do
  local spr = L.new(12, 18, 48)
  for c = 0, 11 do for f = 1, 4 do lanternFrame(L.img(spr, c * 4 + f), f, c > 0 and ramp(L.COLORS[c]) or nil) end end
  L.durations(spr, 260)
  L.save(spr, "lanterns", { sheet = true, columns = 12 })
end
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
local function awning(img, r)
  local main, hi, dark, white, wdark = "q", "r", "y", "t", "u"
  if r then main, hi, dark = r[2], r[1], r[4] end
  if r and r.name == "white" then main, hi, dark, white, wdark = "u", "t", "v", "v", "w" end
  for x = 0, 215 do
    local stripe = math.floor(x / 9) % 2 == 0
    local depth = 8 + ((x % 9 < 5) and 1 or 0)
    for y = 0, depth do
      local c = stripe and main or white
      if y == 0 then c = stripe and hi or white end
      if y >= depth then c = stripe and dark or wdark end
      L.set(img, x, y, c)
    end
  end
  L.hline(img, 0, 215, 0, "u")
end
do
  local spr = L.new(216, 12, 1)
  awning(L.img(spr, 1), nil)
  L.save(spr, "awning")
  local all = L.new(216, 12, 12)
  for c = 1, 12 do awning(L.img(all, c), c > 1 and ramp(L.COLORS[c - 1]) or nil) end
  L.save(all, "awnings", { sheet = true, columns = 1 })
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

-- ------------------------------------------------------------ red plastic stool 16x14 (+ 12 colour sheet)
local function stool(img, r)
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
  if r then
    local hi, main, shade = r[1], r[2], r[3]
    if r.name == "white" then hi, main, shade = "t", "u", "v" end
    L.swap(img, { D = hi, i = main, h = shade })
  end
  L.outline(img, "g")
end
do
  local all = L.new(16, 14, 12)
  for c = 1, 12 do stool(L.img(all, c), c > 1 and ramp(L.COLORS[c - 1]) or nil) end
  L.save(all, "stools", { sheet = true })
end
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

-- ------------------------------------------------------------ district stall_back variants 208x120
-- Same roof / valance / sign / poles / bulb / side walls as stall_back (so stall_roof and
-- stall_sign overlays still fit); only the back wall interior (x 14..193, y 24..96) differs.
-- Frames + tag + durations identical to stall_back (frame 3 = short bulb flicker).
local DARK = { c = "d", d = "e", e = "f", f = "g", g = "z", u = "v", v = "w", w = "x", x = "y", y = "z",
  r = "q", q = "x", C = "B", B = "x", s = "r", j = "b", b = "e", k = "j", t = "u", D = "C", F = "e",
  E = "F", p = "y", o = "p", z = "z" }
local function darken(img, x, y)
  local p = img:getPixel(x, y)
  for k, v in pairs(DARK) do if L.px[k] == p then L.set(img, x, y, v); return end end
end
local function shelf(img, x0, x1, y)
  L.rect(img, x0, y, x1 - x0 + 1, 3, "f"); L.hline(img, x0, x1, y, "e"); L.hline(img, x0, x1, y + 3, "g")
end
local function sideWalls(img)
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
end
local function warmWall(img)
  L.vgradient(img, 10, 24, 188, 72, { { 24, "j" }, { 40, "b" }, { 70, "e" }, { 95, "f" } })
  for x = 22, 196, 18 do
    for y = 26, 95 do L.set(img, x, y, L.dither(x, y, 0.5, "e", "f")) end
  end
end
-- like L.ebox, but fn may return nil to leave a pixel untouched
local function ering(img, x0, y0, x1, y1, fn)
  local cx, cy = (x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2
  local rx, ry = (x1 - x0 + 1) / 2, (y1 - y0 + 1) / 2
  for y = y0, y1 do for x = x0, x1 do
    local nx, ny = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
    if nx * nx + ny * ny <= 1.0 then local c = fn(nx, ny, x, y); if c then L.set(img, x, y, c) end end
  end end
end
local function districtBack(name, wall, props)
  local spr = L.new(208, 120, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    wall(img, f)
    sideWalls(img)
    props(img, f)
    roof(img, nil)
    sign(img, nil, 86, 14)
    L.rect(img, 2, 20, 3, 100, "w"); L.vline(img, 2, 20, 119, "u")
    L.rect(img, 203, 20, 3, 100, "w"); L.vline(img, 203, 20, 119, "u")
    L.vline(img, 104, 27, 31, "z")
    local bulb = (f == 3) and "k" or "l"
    L.map(img, 102, 32, { ".ww.", "wllw", "llll", ".ll." }, { sub = { l = bulb } })
    L.set(img, 103, 34, "t")
  end
  L.durations(spr, 200)
  spr.frames[3].duration = 0.08
  L.tag(spr, "glow", 1, 4)
  L.save(spr, name)
end

-- ---------------- 동대문: clothes
local CL = {
  red = { H = "D", M = "i", S = "h" }, pink = { H = "E", M = "D", S = "C" }, denim = { H = "v", M = "w", S = "x" },
  yellow = { H = "l", M = "k", S = "j" }, blue = { H = "r", M = "q", S = "x" }, green = { H = "m", M = "n", S = "o" },
  white = { H = "t", M = "u", S = "v" }, purple = { H = "C", M = "B", S = "y" },
}
local GARM = {
  tee = { "HHHH...HHHH", "HMMMHHHMMMS", "HMMMMMMMMMS", "MMMMMMMMMMS", "SSHMMMMMMSS", "..HMMMMMMS.",
    "..HMMMMMMS.", "..HMMMMMMS.", "..HMMMMMMS.", "..HMMMMMMS.", "..HMMMMMMS.", "..SSSSSSSS." },
  dress = { "...H...H...", "...H...H...", "...HMMMS...", "...HMMMS...", "...HMMMS...", "...SSSSS...",
    "..HMMMMMS..", "..HMMMMMS..", ".HMMMMMMMS.", ".HMMMMMMMS.", "HMMMMMMMMMS", "HMMMMMMMMMS", "HMMMMMMMMMS",
    "SSSSSSSSSSS" },
  jacket = { "HHHH...HHHH", "HMMHHtHHMMS", "HMSHMtMHSMS", "HMSHMtMMSMS", "HMSHMtMMSMS", "HMSHMtMMSMS",
    "HMSHMtMMSMS", "HMSHMtMMSMS", "HMSHMtMMSMS", "HMSHMtMMSMS", "SSSHMtMMSSS", "..SSSSSSS.." },
  pants = { ".SSSSSSSSS.", ".HMMMMMMMS.", ".HMMMSMMMS.", ".HMMS.HMMS.", ".HMMS.HMMS.", ".HMMS.HMMS.",
    ".HMMS.HMMS.", ".HMMS.HMMS.", ".HMMS.HMMS.", ".HMMS.HMMS.", ".HMMS.HMMS.", ".SSSS.SSSS." },
}
districtBack("stall_back_ddm", warmWall, function(img, f)
  -- clothes rail hung from the valance
  L.vline(img, 17, 27, 32, "z"); L.vline(img, 101, 27, 32, "z")
  L.hline(img, 15, 103, 32, "t"); L.hline(img, 15, 103, 33, "v")
  local rack = { { "tee", "red" }, { "dress", "pink" }, { "jacket", "denim" }, { "tee", "yellow" },
    { "pants", "blue" }, { "dress", "green" }, { "jacket", "purple" } }
  for i, g in ipairs(rack) do
    local x = 17 + (i - 1) * 12
    if i == 4 and (f == 2 or f == 4) then x = x + 1 end -- one hanger sways
    L.set(img, x + 5, 30, "u"); L.set(img, x + 6, 31, "u"); L.set(img, x + 4, 31, "u"); L.set(img, x + 5, 34, "u")
    L.map(img, x + 2, 35, { "..u.u..", "uu...uu" })
    L.map(img, x, 36, GARM[g[1]], { sub = CL[g[2]] })
    if i == 2 then -- swinging price tag
      local tx = x + 9 + ((f % 2 == 0) and 1 or 0)
      L.set(img, x + 8, 38, "g"); L.rect(img, tx, 39, 3, 4, "t"); L.set(img, tx + 1, 40, "i"); L.set(img, tx + 1, 41, "h")
    end
  end
  -- tall mirror with a moving glint
  L.rect(img, 106, 34, 13, 34, "f"); L.rect(img, 107, 35, 11, 32, "d"); L.hline(img, 107, 117, 35, "c")
  L.rect(img, 108, 37, 9, 29, "v"); L.vline(img, 108, 37, 65, "u"); L.vline(img, 116, 37, 65, "w")
  for y = 52, 65 do for x = 109, 115 do L.set(img, x, y, L.dither(x, y, (y - 52) / 14, "v", "w")) end end
  local gx = 107 + (f - 1) * 3
  for k = 0, 6 do
    local x, y = gx + k, 44 - k
    if x >= 108 and x <= 116 and y >= 37 then L.set(img, x, y, "t") end
    if x + 2 >= 108 and x + 2 <= 116 and y + 4 >= 37 then L.set(img, x + 2, y + 4, "t") end
  end
  -- string of little lights over the shelves
  for i = 0, 11 do
    local x = 123 + i * 6
    local y = 35 + ((i % 2 == 0) and 0 or 1)
    L.set(img, x, y - 1, "g"); L.set(img, x + 1, y - 1, "g"); L.set(img, x + 2, y - 1, "g")
    local on = (i + f) % 2 == 0 and f ~= 3
    L.set(img, x + 1, y, on and "l" or "b"); if on then L.set(img, x + 1, y + 1, "k") end
  end
  -- folded shirts on the top shelf
  shelf(img, 122, 172, 52)
  local stacks = { { "white", "blue", "red" }, { "green", "yellow", "denim" }, { "pink", "purple", "white" }, { "red", "denim", "yellow" } }
  for s, st in ipairs(stacks) do
    local x = 124 + (s - 1) * 12
    for k, col in ipairs(st) do
      local y = 49 - (k - 1) * 4
      local c = CL[col]
      L.rect(img, x, y, 10, 3, c.M); L.hline(img, x, x + 9, y, c.H); L.hline(img, x, x + 9, y + 2, c.S)
      L.set(img, x + 4, y + 1, c.S); L.set(img, x + 5, y + 1, c.S)
    end
  end
  -- fabric rolls end-on on the lower shelf
  shelf(img, 122, 172, 72)
  local rolls = { "i", "r", "l", "C", "m", "u", "k" }
  for k, c in ipairs(rolls) do
    local x = 123 + (k - 1) * 7
    L.ebox(img, x, 65, x + 6, 71, function(nx, ny) return (nx * nx + ny * ny > 0.55) and DARK[c] or c end)
    L.set(img, x + 3, 68, "g"); L.set(img, x + 2, 67, "t")
  end
  -- tall bolts leaning in the corner
  local bolts = { { "h", "i", "D" }, { "o", "n", "m" }, { "x", "q", "r" }, { "B", "C", "D" } }
  for k, b in ipairs(bolts) do
    local x = 176 + (k - 1) * 4
    local top = 38 + (k % 2) * 4
    L.rect(img, x, top, 4, 84 - top, b[2]); L.vline(img, x, top, 83, b[3]); L.vline(img, x + 3, top, 83, b[1])
    L.hline(img, x, x + 3, top, "c"); L.set(img, x + 1, top, "d")
  end
end)

-- ---------------- 홍대: music
districtBack("stall_back_hgd", function(img)
  L.vgradient(img, 10, 24, 188, 72, { { 24, "C" }, { 36, "B" }, { 66, "x" }, { 95, "y" } })
  for y = 24, 95 do for x = 10, 197 do
    local row = math.floor((y - 24) / 5)
    if (y - 24) % 5 == 4 or (x + (row % 2) * 6) % 12 == 0 then darken(img, x, y) end
  end end
end, function(img, f)
  -- disco ball light spots wander over the wall
  local SR = L.rng(5)
  for k = 1, 14 do
    local bx, by = SR(16, 190), SR(30, 80)
    local cc = ({ "s", "D", "l", "m" })[k % 4 + 1]
    local x, y = bx + ((f - 1) * 7 + k) % 9 - 4, by + (f % 2) * 2
    if f ~= 3 then L.set(img, x, y, cc); L.set(img, x + 1, y, cc) end
  end
  -- CD tower
  L.rect(img, 16, 30, 17, 25, "f"); L.rect(img, 17, 31, 15, 23, "g")
  local CR = L.rng(9)
  for y = 32, 52 do
    if (y - 32) % 7 == 6 then L.hline(img, 17, 31, y, "f")
    else
      local c = ({ "u", "i", "r", "k", "m", "C", "t", "v" })[CR(1, 8)]
      L.hline(img, 18, 30, y, c); L.set(img, 30, y, DARK[c] or "g")
    end
  end
  -- small disco ball
  L.vline(img, 40, 27, 31, "z")
  L.ebox(img, 36, 32, 44, 40, function(nx, ny, x, y)
    if (x + y) % 2 == 0 then return ny < 0 and "t" or "v" end
    return ny < 0 and "u" or "w"
  end)
  local sp = ({ { 38, 34 }, { 42, 35 }, { 40, 38 }, { 37, 37 } })[f]
  L.set(img, sp[1], sp[2], "t"); L.set(img, sp[1] - 1, sp[2], "s"); L.set(img, sp[1] + 1, sp[2], "s")
  L.set(img, sp[1], sp[2] - 1, "s"); L.set(img, sp[1], sp[2] + 1, "s")
  -- gig posters
  local posters = {
    { x = 50, bg = "l", ink = "g", lines = "h", icon = { "...gg..", "...g...", "...g...", "...g...", "..ggg..", ".ggggg.", ".gg.gg.", "..ggg..", ".ggggg.", ".ggggg.", "..ggg.." } },
    { x = 65, bg = "r", ink = "A", lines = "t", icon = { "...A...", "...A...", "AAAAAAA", ".AAAAA.", "..AAA..", ".AA.AA.", "A.....A" } },
    { x = 80, bg = "D", ink = "z", lines = "g", icon = { "....zz.", "...zz..", "..zz...", ".zzzzz.", "...zz..", "..zz...", ".zz....", "zz....." } },
  }
  for i, p in ipairs(posters) do
    local y = 30 + (i == 2 and 2 or 0)
    L.rect(img, p.x, y, 13, 19, p.bg); L.vline(img, p.x + 12, y, y + 18, DARK[p.bg]); L.hline(img, p.x, p.x + 12, y + 18, DARK[p.bg])
    L.map(img, p.x + 3, y + 2, p.icon)
    L.hline(img, p.x + 2, p.x + 10, y + 14, p.lines); L.hline(img, p.x + 3, p.x + 8, y + 16, p.lines)
    L.set(img, p.x, y, "c"); L.set(img, p.x + 12, y, "c")
  end
  -- vinyl record on the wall (label highlight turns)
  L.ebox(img, 95, 33, 111, 49, function(nx, ny)
    local r = nx * nx + ny * ny
    if r < 0.12 then return "i" end
    if r > 0.82 then return "g" end
    return (math.floor(r * 10) % 2 == 0) and "z" or "y"
  end)
  L.set(img, 103, 41, "c")
  local hl = ({ { 98, 37 }, { 107, 37 }, { 107, 45 }, { 98, 45 } })[f]
  L.set(img, hl[1], hl[2], "w"); L.set(img, hl[1] + (hl[1] < 103 and 1 or -1), hl[2] + (hl[2] < 41 and -1 or 1), "x")
  L.set(img, 101 + (f % 2), 40, "D")
  -- record shelves
  shelf(img, 114, 152, 52); shelf(img, 114, 152, 72)
  local RR = L.rng(4)
  local x = 116
  while x < 150 do
    local h = RR(8, 12)
    local c = ({ "q", "i", "k", "t", "m", "C", "g", "j" })[RR(1, 8)]
    L.rect(img, x, 52 - h, 2, h, c); L.vline(img, x + 1, 52 - h, 51, DARK[c] or "z")
    x = x + 2 + (RR(1, 5) == 1 and 1 or 0)
  end
  for k = 0, 2 do -- sleeves face-out on the lower shelf
    local sx = 117 + k * 12
    local c = ({ "s", "l", "D" })[k + 1]
    L.rect(img, sx, 61, 11, 11, c); L.ebox(img, sx + 2, 63, sx + 8, 69, "z"); L.set(img, sx + 5, 66, c)
    L.vline(img, sx + 10, 61, 71, DARK[c]); L.hline(img, sx, sx + 10, 61, "t")
  end
  -- mic on a stand
  L.vline(img, 152, 46, 83, "v"); L.vline(img, 153, 46, 83, "w")
  L.map(img, 150, 38, { ".uvu.", "uvuvu", "vuvuv", "uvuvw", ".www.", "..g..", "..g..", "..g.." })
  L.line(img, 151, 83, 146, 80, "z")
  -- speaker cabinet
  L.rect(img, 158, 33, 34, 51, "z"); L.rect(img, 159, 34, 32, 50, "g")
  L.hline(img, 159, 190, 34, "x"); L.vline(img, 159, 34, 83, "y")
  for _, c in ipairs({ { 159, 34 }, { 188, 34 } }) do L.rect(img, c[1], c[2], 3, 3, "v"); L.set(img, c[1], c[2], "u") end
  L.ebox(img, 170, 38, 180, 46, function(nx, ny)
    local r = nx * nx + ny * ny
    if r > 0.6 then return "x" end
    return r < 0.15 and "u" or "z"
  end)
  local pump = (f == 2 or f == 4)
  L.ebox(img, 162, 50, 188, 78, function(nx, ny)
    local r = nx * nx + ny * ny
    if r > 0.86 then return "x" end
    if r > 0.7 then return "y" end
    if r < 0.08 then return pump and "u" or "v" end
    if r < 0.14 then return "w" end
    if pump and r > 0.5 and r < 0.6 then return "x" end
    return (nx + ny < -0.6) and "y" or "z"
  end)
  L.set(img, 187, 37, (f ~= 3) and "A" or "h")
end)

-- ---------------- 용산: electronics
districtBack("stall_back_ysn", function(img)
  L.vgradient(img, 10, 24, 188, 72, { { 24, "u" }, { 40, "v" }, { 70, "w" }, { 95, "x" } })
  for y = 26, 95, 4 do for x = 12, 196, 4 do darken(img, x, y) end end
end, function(img, f)
  -- drooping cables across the top
  for x = 14, 62 do L.set(img, x, 31 + math.floor(4 * math.sin((x - 14) / 48 * math.pi)), "z") end
  for x = 120, 192 do L.set(img, x, 30 + math.floor(3 * math.sin((x - 120) / 72 * math.pi)), "g") end
  -- phones on the left shelf
  shelf(img, 14, 60, 47)
  for k = 0, 5 do
    local x = 16 + k * 7
    L.rect(img, x, 37, 5, 10, "g"); L.hline(img, x, x + 4, 37, "x")
    local scr = ({ "r", "s", "m", "C", "q", "k" })[(k + f) % 6 + 1]
    if f == 3 and k % 2 == 0 then scr = "y" end
    L.rect(img, x + 1, 38, 3, 7, scr); L.set(img, x + 1, 38, "t"); L.set(img, x + 2, 46, "w")
  end
  -- little radios on the second shelf
  shelf(img, 14, 60, 63)
  for k = 0, 2 do
    local x = 16 + k * 15
    local c = ({ "i", "n", "b" })[k + 1]
    L.rect(img, x, 55, 13, 8, c); L.hline(img, x, x + 12, 55, DARK[c] == "z" and c or ({ "D", "m", "k" })[k + 1])
    for yy = 57, 61 do for xx = x + 1, x + 5 do L.set(img, xx, yy, (xx + yy) % 2 == 0 and "g" or DARK[c]) end end
    L.rect(img, x + 7, 57, 5, 2, "c"); L.set(img, x + 8 + (f + k) % 3, 57, "i")
    L.set(img, x + 8, 60, "k"); L.set(img, x + 11, 60, "u"); L.line(img, x + 10, 54, x + 12, 51, "v")
  end
  -- wall of TVs, screens flicker
  local function tv(x, y, w, h, kind, k)
    L.rect(img, x, y, w, h, "f"); L.hline(img, x, x + w - 1, y, "e"); L.hline(img, x, x + w - 1, y + h - 1, "g")
    L.rect(img, x + w - 4, y + 2, 3, h - 4, "e"); L.set(img, x + w - 3, y + 3, "k"); L.set(img, x + w - 3, y + 6, "g")
    local sx, sy, sw, sh = x + 1, y + 1, w - 6, h - 2
    local NR = L.rng(f * 31 + k)
    for yy = sy, sy + sh - 1 do for xx = sx, sx + sw - 1 do
      local c
      if kind == "static" then c = ({ "t", "u", "v", "w" })[NR(1, 4)]
      elseif kind == "bars" then c = ({ "t", "l", "s", "m", "C", "i", "q" })[math.floor((xx - sx) * 7 / sw) + 1]
        if yy >= sy + sh - 2 then c = "y" end
      elseif kind == "blue" then c = ((yy - sy) == (f * 2) % sh) and "s" or "r"
      else c = "q"; if yy - sy == math.floor(sh / 2 + 2 * math.sin((xx - sx + f * 2) / 2)) then c = "m" end end
      if f == 3 and k % 2 == 1 then c = DARK[c] or c end
      L.set(img, xx, yy, c)
    end end
    L.set(img, sx, sy, "f"); L.set(img, sx + sw - 1, sy, "f"); L.set(img, sx, sy + sh - 1, "f"); L.set(img, sx + sw - 1, sy + sh - 1, "f")
  end
  tv(64, 33, 17, 12, "bars", 1); tv(82, 33, 17, 12, "static", 2)
  L.line(img, 88, 32, 85, 29, "v"); L.line(img, 92, 32, 95, 29, "v")
  tv(108, 33, 17, 12, "wave", 3)
  tv(70, 46, 19, 14, "blue", 4); tv(96, 46, 19, 14, "static", 5)
  L.rect(img, 62, 60, 66, 3, "g"); L.hline(img, 62, 127, 60, "x")
  -- coiled cables on hooks
  for k = 0, 1 do
    local cx = 131 + k * 9
    L.set(img, cx + 3, 33, "u")
    ering(img, cx, 34, cx + 7, 44, function(nx, ny) return (nx * nx + ny * ny > 0.62) and (k == 0 and "g" or "i") or nil end)
    L.vline(img, cx + 1 + k * 5, 44, 52 + k * 3, k == 0 and "g" or "i")
    L.rect(img, cx + k * 5, 52 + k * 3, 3, 3, k == 0 and "u" or "t")
  end
  -- repair corner: tools on the pegboard
  L.rect(img, 152, 34, 14, 7, "l"); L.rect(img, 153, 35, 12, 5, "k")
  L.map(img, 154, 35, { "gg.....gg", ".gg...gg.", "..ggggg..", ".gg...gg.", "gg.....gg" }, { sub = { g = "g" } })
  L.map(img, 168, 33, { "ii", "ii", "ih", "ih", ".u", ".u", ".u", ".u", ".u", ".v" })        -- screwdriver
  L.map(img, 172, 33, { "u.u", "u.u", "uuu", ".u.", ".u.", ".u.", ".u.", ".u.", "uuu", "u.u" }) -- wrench
  L.map(img, 177, 33, { ".v.v.", ".v.v.", "..v..", ".h.h.", ".h.h.", "h...h", "h...h" })       -- pliers
  L.map(img, 184, 33, { "uuuu", "uvvu", ".ff.", ".ff.", ".fe.", ".fe.", ".fe." })              -- hammer-ish
  -- workbench with magnifier lamp and soldering iron
  shelf(img, 146, 192, 66)
  L.line(img, 190, 65, 190, 50, "v"); L.line(img, 190, 50, 176, 47, "v")
  L.ebox(img, 168, 46, 178, 54, function(nx, ny) local r = nx * nx + ny * ny; if r > 0.6 then return "w" end; return (f == 3) and "r" or "s" end)
  L.set(img, 171, 48, "t")
  L.rect(img, 150, 59, 12, 7, "x"); L.hline(img, 150, 161, 59, "v")                    -- parts box
  for k = 0, 3 do L.set(img, 151 + k * 3, 61, ({ "i", "m", "k", "s" })[k + 1]) end
  L.line(img, 164, 64, 172, 60, "g"); L.set(img, 173, 59, (f % 2 == 1) and "j" or "i") -- iron
  local wisp = ({ { 173, 57 }, { 174, 55 }, { 173, 53 }, { 172, 56 } })[f]
  L.set(img, wisp[1], wisp[2], "u"); L.set(img, wisp[1] + 1, wisp[2] - 1, "v")
  L.map(img, 178, 60, { "xxxxxxxxxxx", "xsxmxkxixux", "xxxxxxxxxxx" })            -- circuit board
  L.map(img, 179, 63, { "w.w.w.w.w" })
  -- lower shelf: boxed stock and a boombox
  shelf(img, 62, 128, 78)
  local BX = { { 64, 9, 8, "e" }, { 74, 8, 6, "c" }, { 64, 7, 5, "d" }, { 112, 7, 9, "u" }, { 120, 7, 7, "e" } }
  for i, b in ipairs(BX) do
    local x, w, h, c = b[1], b[2], b[3], b[4]
    local y = 78 - h - ((i == 3) and 8 or 0)
    L.rect(img, x, y, w, h, c); L.hline(img, x, x + w - 1, y, "t"); L.vline(img, x + w - 1, y, y + h - 1, DARK[c])
    L.hline(img, x + 1, x + w - 3, y + 2, "q")
  end
  L.rect(img, 86, 68, 22, 10, "x"); L.hline(img, 86, 107, 68, "v"); L.line(img, 89, 67, 92, 64, "v"); L.line(img, 104, 67, 101, 64, "v"); L.hline(img, 92, 101, 64, "v")
  for _, cx in ipairs({ 87, 99 }) do
    L.ebox(img, cx, 69, cx + 7, 76, function(nx, ny) local r = nx * nx + ny * ny; if r < 0.15 then return (f % 2 == 0) and "u" or "v" end; return r > 0.6 and "y" or "z" end)
  end
  L.rect(img, 95, 70, 3, 2, (f ~= 3) and "s" or "r")
end)

-- ---------------- 약국: pharmacy
districtBack("stall_back_phm", function(img)
  L.vgradient(img, 10, 24, 188, 72, { { 24, "c" }, { 38, "u" }, { 62, "v" }, { 95, "w" } })
  for y = 24, 95 do for x = 10, 197 do
    if (y - 24) % 7 == 6 or (x - 10) % 9 == 8 then darken(img, x, y) end
  end end
end, function(img, f)
  local MR = L.rng(23)
  local function stock(x0, x1, ybase)
    local x = x0
    while x < x1 - 3 do
      local kind = MR(1, 4)
      if kind <= 2 then -- box
        local w, h = MR(5, 8), MR(5, 9)
        if x + w > x1 then w = x1 - x end
        local c = ({ "i", "q", "m", "j", "C", "r" })[MR(1, 6)]
        L.rect(img, x, ybase - h, w, h, "t"); L.vline(img, x + w - 1, ybase - h, ybase - 1, "u")
        L.rect(img, x, ybase - h + 1, w - 1, 2, c); L.hline(img, x + 1, x + w - 3, ybase - 2, "v")
        x = x + w + MR(0, 1)
      elseif kind == 3 then -- brown bottle
        L.map(img, x, ybase - 9, { ".uu.", ".gg.", "ffff", "fccf", "fcdf", "fccf", "efff", "efff", "ffff" })
        x = x + 5
      else -- pill jar / blue bottle
        local cap = ({ "i", "m", "q" })[MR(1, 3)]
        if MR(1, 2) == 1 then
          L.map(img, x, ybase - 7, { "CCCC", "tuuv", "tssv", "tssv", "tuuv", "tuuv", "tuuv" }, { sub = { C = cap } })
        else
          L.map(img, x, ybase - 9, { ".tt.", ".qq.", "rqqq", "rttq", "rtsq", "rttq", "rqqq", "rqqq", "qqqx" })
        end
        x = x + 5
      end
    end
  end
  -- left shelving
  for _, y in ipairs({ 46, 62, 78 }) do shelf(img, 14, 56, y); stock(15, 55, y) end
  -- right shelving
  for _, y in ipairs({ 46, 62 }) do shelf(img, 124, 192, y); stock(125, 191, y) end
  shelf(img, 124, 192, 78); stock(125, 170, 78)
  -- glowing green cross
  L.rect(img, 60, 30, 19, 19, "x"); L.rect(img, 61, 31, 17, 17, "z")
  local tmp = Image(img.width, img.height, ColorMode.RGB)
  local main = (f == 3) and "n" or "m"
  L.rect(tmp, 67, 33, 5, 13, main); L.rect(tmp, 63, 37, 13, 5, main)
  L.glow(tmp, main, (f == 3) and "o" or "n")
  if f == 2 then L.rect(tmp, 68, 34, 3, 11, "l"); L.rect(tmp, 64, 38, 11, 3, "l") end
  if f == 4 then L.rect(tmp, 68, 38, 3, 3, "t") end
  img:drawImage(tmp, Point(0, 0))
  L.set(img, 61, 31, "w")
  -- capsule poster
  L.rect(img, 84, 32, 16, 20, "t"); L.vline(img, 99, 32, 51, "u"); L.hline(img, 84, 99, 51, "u")
  L.map(img, 86, 35, { "..iiitttt...", ".iiiiuttttu.", "iDiiiutttttu", "iiiiiuttttvu", ".hiiiuttvvu.", "..hhhvvvv..." })
  L.hline(img, 86, 97, 44, "w"); L.hline(img, 86, 93, 46, "v"); L.hline(img, 86, 95, 48, "v")
  L.set(img, 84, 32, "k"); L.set(img, 99, 32, "k")
  -- brass balance scale on the right lower shelf (beam tips per frame)
  local tilt = ({ 0, 1, 0, -1 })[f]
  L.rect(img, 180, 76, 7, 2, "j"); L.vline(img, 183, 66, 75, "k"); L.set(img, 183, 65, "l")
  L.line(img, 175, 67 - tilt, 191, 67 + tilt, "k")
  for _, s in ipairs({ { 175, -tilt }, { 191, tilt } }) do
    local px, dy = s[1], s[2]
    L.vline(img, px, 68 + dy, 70 + dy, "j")
    L.map(img, px - 3, 71 + dy, { "kkkkkkk", ".jjjjj." })
  end
end)

-- ---------------- 부산: ferry ticket booth
districtBack("stall_back_bsn", function(img)
  L.vgradient(img, 10, 24, 188, 72, { { 24, "r" }, { 40, "q" }, { 72, "x" }, { 95, "y" } })
  for x = 10, 197 do if (x - 10) % 11 == 10 then for y = 24, 95 do darken(img, x, y) end end end
end, function(img, f)
  -- sea poster
  L.rect(img, 16, 31, 21, 24, "c")
  L.vgradient(img, 17, 32, 19, 12, { { 32, "s" }, { 43, "r" } })
  L.ebox(img, 27, 34, 32, 39, "l"); L.set(img, 28, 35, "t")
  L.rect(img, 17, 44, 19, 8, "q")
  for y = 45, 51, 2 do for x = 17, 35 do if (x + y + f) % 6 == 0 then L.set(img, x, y, "t") end end end
  L.hline(img, 17, 35, 44, "s")
  L.map(img, 20, 41, { "...g", "..gg", ".ggg", "gggg" }) -- island
  L.hline(img, 17, 35, 53, "w")
  -- departures board
  L.rect(img, 42, 30, 78, 29, "g"); L.rect(img, 44, 32, 74, 25, "z")
  L.hline(img, 42, 119, 30, "x")
  L.rect(img, 44, 32, 74, 3, "y"); L.hline(img, 46, 52, 33, "t"); L.hline(img, 58, 66, 33, "t"); L.hline(img, 96, 104, 33, "t")
  local BR = L.rng(17)
  for row = 0, 4 do
    local y = 37 + row * 4
    local blink = (row == 2)
    local show = not blink or (f == 1 or f == 3)
    for x = 46, 54 do if x ~= 50 and BR(1, 4) > 1 then if show then L.set(img, x, y, "k"); L.set(img, x, y + 1, BR(1, 3) == 1 and "j" or "k") end end end
    if show then L.set(img, 50, y, "j") end
    local len = BR(16, 28)
    for x = 58, 58 + len do if BR(1, 5) > 1 then
      if show then L.set(img, x, y, "k"); if BR(1, 2) == 1 then L.set(img, x, y + 1, "j") end end
    end end
    local st = (row == 2) and "i" or "m"
    for x = 96, 96 + BR(6, 12) do if BR(1, 4) > 1 then if show or row ~= 2 then L.set(img, x, y, st); L.set(img, x, y + 1, DARK[st] or st) end end end
    if blink and not show then L.hline(img, 96, 107, y, "h") end
  end
  if f == 3 then L.hline(img, 44, 117, 41, "y") end -- refresh line on flicker frame
  L.set(img, 115, 33, (f % 2 == 1) and "i" or "h")
  -- ship poster
  L.rect(img, 124, 31, 21, 24, "c")
  L.vgradient(img, 125, 32, 19, 13, { { 32, "D" }, { 44, "k" } })
  L.rect(img, 125, 45, 19, 7, "q")
  L.map(img, 127, 37, {
    "......ii.......",
    "......gg.......",
    "...tttttttt....",
    "..tttutututt...",
    "gggggggggggggg.",
    ".hhhhhhhhhhhhh.",
    "..hhhhhhhhhhh..",
  })
  local smoke = ({ { 134, 35 }, { 135, 34 }, { 136, 33 }, { 137, 34 } })[f]
  L.set(img, smoke[1], smoke[2], "u"); L.set(img, smoke[1] + 1, smoke[2] - 1, "v")
  for x = 125, 143 do if (x + f) % 5 == 0 then L.set(img, x, 47, "s") end end
  L.hline(img, 125, 143, 53, "w")
  -- ship's bell on a bracket, clapper swings
  L.rect(img, 130, 57, 10, 2, "f"); L.hline(img, 130, 139, 57, "e"); L.vline(img, 135, 59, 60, "g")
  L.map(img, 131, 61, { "...kk...", "..kllj..", "..klkj..", "..kkjj..", ".kkkjjb.", "bbbbbbbb" })
  local cx = 134 + ({ 0, 1, 0, -1 })[f]
  L.set(img, cx, 67, "g"); L.set(img, cx + 1, 67, "g")
  L.vline(img, 135 + ({ 0, 1, 0, -1 })[f], 68, 74, "c")
  -- ticket window
  L.rect(img, 150, 36, 40, 36, "e"); L.rect(img, 152, 38, 36, 28, "f")
  L.hline(img, 150, 189, 36, "d")
  L.vgradient(img, 153, 39, 34, 26, { { 39, "x" }, { 64, "y" } })
  for k = 0, 9 do local x, y = 158 + k, 62 - k * 2; if y >= 39 then L.set(img, x, y, "w"); L.set(img, x + 1, y - 1, "w") end end
  for k = 0, 5 do local x, y = 172 + k, 52 - k * 2; L.set(img, x, y, "w") end
  L.vline(img, 170, 39, 64, "e")
  for _, p in ipairs({ { 177, 45 }, { 179, 45 }, { 178, 44 }, { 178, 46 }, { 178, 45 } }) do L.set(img, p[1], p[2], "z") end
  L.rect(img, 160, 63, 20, 3, "g")
  L.rect(img, 148, 66, 44, 4, "d"); L.hline(img, 148, 191, 66, "c"); L.hline(img, 148, 191, 69, "f")
  -- ticket sign over the window
  L.rect(img, 158, 30, 24, 6, "l"); L.hline(img, 158, 181, 35, "k")
  L.map(img, 162, 31, { "iiiiiiiiiiiiiii", "iti.ttt.ttt.iii", "iiiiiiiiiiiiiii", ".h.h.h.h.h.h.h." })
  -- life ring under the board
  L.vline(img, 53, 59, 61, "c")
  ering(img, 46, 62, 60, 76, function(nx, ny)
    local r = nx * nx + ny * ny
    if r < 0.25 or r > 1 then return nil end
    local a = math.atan(ny, nx)
    local q = math.floor((a + math.pi) / (math.pi / 2) + 0.5) % 2
    local c = q == 0 and "i" or "t"
    if r > 0.8 or (nx + ny > 0.5) then c = q == 0 and "h" or "u" end
    return c
  end)
  L.set(img, 47, 69, "c"); L.set(img, 59, 69, "c"); L.set(img, 53, 63, "c"); L.set(img, 53, 75, "c")
  -- little lamp on the window, blinking
  L.set(img, 186, 40, (f == 2 or f == 4) and "l" or "j")
end)

-- ------------------------------------------------------------ grandma's tea mug (약국 reward) 12x14, 3 frames steam
do
  local spr = L.new(12, 14, 3)
  for f = 1, 3 do
    local img = L.img(spr, f)
    -- steam
    -- mug body: white celadon with a blue band, handle right
    L.rect(img, 2, 5, 7, 8, "t"); L.vline(img, 2, 5, 12, "u"); L.vline(img, 8, 5, 12, "v")
    L.hline(img, 2, 8, 5, "u"); L.rect(img, 3, 5, 5, 1, "j")  -- tea surface
    L.hline(img, 2, 8, 9, "r"); L.hline(img, 3, 7, 10, "q")
    L.map(img, 9, 7, { "uu", ".u", "uu" })
    L.hline(img, 3, 7, 13, "v")
    L.outline(img, "g")
    local sx = ({ 4, 5, 6 })[f]
    L.set(img, sx, 0, "u"); L.set(img, sx + 1, 1, "t"); L.set(img, sx, 2, "u"); L.set(img, sx + 2, 3, "u")
  end
  L.durations(spr, 300)
  L.tag(spr, "steam", 1, 3)
  L.save(spr, "mug")
end
