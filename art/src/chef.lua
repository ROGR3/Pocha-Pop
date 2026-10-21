-- The player: chef behind the counter, 32x40, looking right towards customers.
-- Tags: idle 1-4 | cook 5-10 | serve 11-14 | happy 15-18
local L = dofile(app.params.root .. "/art/lib.lua")
local FW, FH = 32, 40

local function figureChef(img, pose)
  local b = pose.bob or 0
  local skin, skin2 = "E", "F"
  -- legs (mostly hidden behind the counter in game)
  L.rect(img, 11, 29, 4, 7, "x"); L.rect(img, 17, 29, 4, 7, "x")
  L.rect(img, 10, 36, 5, 2, "z"); L.rect(img, 17, 36, 5, 2, "z")
  -- torso: cream shirt + red apron
  L.map(img, 10, 17 + b, {
    "...cccccc...",
    ".cccccccccc.",
    "cccciiiiiccd",
    "ccciiiiiiicd",
    "ccciiiiiiidd",
    "cciiiiiiiihd",
    "cciiAtiiiihd",
    "cciittiiiihd",
    "cciiiiiiiihd",
    "cciiiiiiiihd",
    "cdhhhhhhhhhd",
  })
  L.set(img, 13, 18 + b, "i"); L.set(img, 18, 18 + b, "i") -- apron straps
  L.rect(img, 11, 28 + b, 10, 2, "x")
  -- left arm
  local hl = pose.handL or 0
  L.rect(img, 8, 18 + b, 2, 8 + hl, "c"); L.rect(img, 8, 26 + b + hl, 2, 2, skin)
  -- right arm (custom)
  if pose.arm == "reach" then
    local len = pose.len or 6
    L.rect(img, 22, 19 + b, 2 + len, 2, "c"); L.set(img, 22 + len + 1, 20 + b, "d")
    L.rect(img, 24 + len, 19 + b, 2, 2, skin); L.set(img, 25 + len, 20 + b, skin2)
  elseif pose.arm == "ladle" then
    local hx, hy = pose.hx, pose.hy
    L.line(img, 22, 19 + b, hx, hy + b, "c"); L.line(img, 23, 19 + b, hx + 1, hy + b, "d")
    -- ladle: shaft down into the pot, bowl at the end
    L.line(img, hx + 1, hy + b + 1, hx + 4, hy + b + 9, "v")
    L.rect(img, hx + 3, hy + b + 9, 3, 2, "u")
    L.rect(img, hx, hy + b, 2, 2, skin)
  elseif pose.arm == "up" then
    L.rect(img, 22, 11 + b, 2, 9, "c"); L.rect(img, 22, 9 + b, 2, 2, skin)
  else
    local hr = pose.handR or 0
    L.rect(img, 22, 18 + b, 2, 8 + hr, "d"); L.rect(img, 22, 26 + b + hr, 2, 2, skin)
  end
  if pose.armL == "up" then
    L.erase(img, 8, 26 + b); L.erase(img, 9, 26 + b); L.erase(img, 8, 27 + b); L.erase(img, 9, 27 + b)
    L.rect(img, 8, 11 + b, 2, 15, L.clear)
    for y = 18 + b, 27 + b do L.erase(img, 8, y); L.erase(img, 9, y) end
    L.rect(img, 8, 11 + b, 2, 9, "c"); L.rect(img, 8, 9 + b, 2, 2, skin)
  end
  -- head
  L.map(img, 8, 4 + b, {
    "....11111111....",
    "..111111111111..",
    ".11111111111111.",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111111",
    "1111111111111112",
    "1111111111111112",
    ".11111111111112.",
    ".11111111111122.",
    "..111111111122..",
    "....11111122....",
  }, { sub = { ["1"] = skin, ["2"] = skin2 } })
  L.set(img, 7, 11 + b, skin); L.set(img, 24, 11 + b, skin2)
  -- hair + white head towel (머리수건) with knot on the left
  L.map(img, 6, 1 + b, {
    "......yyyyyyyy.....",
    "....yyyyyyyyyyyy...",
    "...ttttttttttttttt.",
    "..tttuttttttttttttt",
    "..tuuuuuuuuuuuuuuut",
    "uttyyyyyyyyyyyyyyyy",
    "tu.yyyyy.yyyyyyyyyy",
    "u..yyy....yy.yyyyyy",
    "...yy...........yyy",
    "...y.............yy",
  })
  -- face, eyes look to the right
  local y = 11 + b
  if pose.eyes == "happy" then
    for _, x in ipairs({ 11, 19 }) do
      L.set(img, x, y + 1, "z"); L.set(img, x + 1, y, "z"); L.set(img, x + 2, y, "z"); L.set(img, x + 3, y + 1, "z")
    end
    L.hline(img, 9, 10, 13 + b, "D"); L.hline(img, 22, 23, 13 + b, "D")
    L.map(img, 14, 14 + b, { ".ffff.", ".fhhf.", "..ff.." })
  elseif pose.eyes == "blink" then
    L.hline(img, 12, 13, y + 1, "z"); L.hline(img, 20, 21, y + 1, "z")
    L.map(img, 14, 14 + b, { ".f..f.", "..ff.." })
  elseif pose.eyes == "focus" then
    L.rect(img, 12, y, 2, 2, "z"); L.rect(img, 20, y, 2, 2, "z"); L.set(img, 13, y, "t"); L.set(img, 21, y, "t")
    L.hline(img, 11, 13, y - 2, "y"); L.hline(img, 20, 22, y - 2, "y")
    L.map(img, 15, 14 + b, { "....", ".ff." })
  else
    L.rect(img, 12, y, 2, 2, "z"); L.rect(img, 20, y, 2, 2, "z"); L.set(img, 13, y, "t"); L.set(img, 21, y, "t")
    L.map(img, 14, 14 + b, { ".f..f.", "..ff.." })
  end
end

local POSES = {
  -- idle (breathing)
  { eyes = "open" }, { eyes = "open" }, { eyes = "open", bob = 1 }, { eyes = "blink", bob = 1 },
  -- cook: stirring with a ladle
  { eyes = "focus", arm = "ladle", hx = 19, hy = 24 }, { eyes = "focus", arm = "ladle", hx = 21, hy = 25 },
  { eyes = "focus", arm = "ladle", hx = 23, hy = 26, bob = 1 }, { eyes = "focus", arm = "ladle", hx = 22, hy = 27, bob = 1 },
  { eyes = "focus", arm = "ladle", hx = 20, hy = 26 }, { eyes = "focus", arm = "ladle", hx = 18, hy = 25 },
  -- serve: push the dish along the counter
  { eyes = "open", arm = "reach", len = 1 }, { eyes = "open", arm = "reach", len = 4 },
  { eyes = "happy", arm = "reach", len = 6 }, { eyes = "open", arm = "reach", len = 3 },
  -- happy: little jump with arms up
  { eyes = "happy", arm = "up", armL = "up", bob = -2 }, { eyes = "happy", bob = 0 },
  { eyes = "happy", arm = "up", armL = "up", bob = -2 }, { eyes = "happy", bob = 0, handL = -2, handR = -2 },
}

local spr = L.new(FW, FH, #POSES)
for i, p in ipairs(POSES) do
  local img = L.img(spr, i)
  figureChef(img, p)
  L.outline(img, "g")
  if i >= 15 and (i % 2 == 1) then
    L.map(img, 26, 3, { "..l..", ".lkl.", "lktkl", ".lkl.", "..l.." })
    L.map(img, 1, 6, { ".l.", "lkl", ".l." })
  end
end
L.durations(spr, 140)
spr.frames[4].duration = 0.3
L.tag(spr, "idle", 1, 4); L.tag(spr, "cook", 5, 10); L.tag(spr, "serve", 11, 14); L.tag(spr, "happy", 15, 18)
L.save(spr, "chef")
