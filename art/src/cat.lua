-- 나비 the stray cat, 24x16 side view facing left. Two builds: thin (early
-- chapters) and chubby (after chapter 2). Kittens 12x10.
-- Tags: walk 1-4 | sit 5-8 (tail swish) | eat 9-10
local L = dofile(app.params.root .. "/art/lib.lua")

local function cat(img, f, chubby)
  -- colours: orange tabby
  local o, o2, o3, w = "j", "b", "e", "c"
  local bob = (f.bob or 0)
  local belly = chubby and 2 or 0
  if f.sit then
    -- sitting body (upright), face left
    L.ebox(img, 7, 5 + bob - belly, 16 + belly, 15, function(nx, ny) if nx > 0.5 then return o2 end if ny > 0.4 and nx < 0.1 then return w end return o end)
    L.map(img, 9, 7 + bob, { "..b..b", ".b..b.", "......" })
    -- front paws
    L.map(img, 7, 14, { "cc.cc" })
  else
    -- walking body (horizontal)
    L.ebox(img, 6, 6 + bob - belly, 19, 12 + bob + belly, function(nx, ny) if ny > 0.45 then return w end if ny < -0.4 then return o end return o end)
    L.map(img, 9, 6 + bob - belly, { "..b...b...b", ".b...b...b.", "..b...b...b" })
    -- legs
    local legs = f.legs or { 0, 0, 0, 0 }
    local xs = { 7, 9, 15, 17 }
    for k, x in ipairs(xs) do
      local l = legs[k]
      L.rect(img, x + l, 12 + bob, 2, 3 - math.abs(l) + 0, k % 2 == 0 and o2 or o)
      L.set(img, x + l, 14 + bob - (math.abs(l) > 0 and 1 or 0), w)
    end
  end
  -- head
  local hx, hy = f.sit and 3 or 1, (f.sit and 1 or 2) + bob + (f.headDown or 0)
  L.map(img, hx, hy, {
    ".o.....o..",
    ".oo...oo..",
    ".oDo.oDo..",
    "ooooooooo.",
    "ooooooooob",
    "ozooooozob",
    "otoooooob.",
    "occcfcccb.",
    ".ccccccb..",
    "..bbbbb...",
  }, { sub = { o = o } })
  if f.blink then L.set(img, hx + 1, hy + 5, o3); L.set(img, hx + 7, hy + 5, o3); L.set(img, hx + 1, hy + 6, "o") end
  if f.mouth then L.map(img, hx + 3, hy + 8, { "ADA" }) end
  -- tail
  local t = f.tail or 0
  local tails = {
    [0] = { { 20, 7 }, { 21, 6 }, { 22, 5 }, { 22, 4 }, { 22, 3 } },
    [1] = { { 20, 7 }, { 21, 6 }, { 22, 6 }, { 23, 5 }, { 23, 4 } },
    [2] = { { 20, 8 }, { 21, 7 }, { 22, 7 }, { 23, 7 }, { 23, 6 } },
    [3] = { { 20, 7 }, { 21, 6 }, { 21, 5 }, { 21, 4 }, { 22, 3 } },
  }
  local base = f.sit and { -3, 7 } or { 0, bob }
  for k, p in ipairs(tails[t]) do
    L.set(img, p[1] + base[1], p[2] + base[2], (k % 2 == 0) and o2 or o)
    L.set(img, p[1] + base[1], p[2] + base[2] + 1, o)
  end
end

local FR = {
  { legs = { 1, -1, -1, 1 }, bob = 0, tail = 0 }, { legs = { 0, 0, 0, 0 }, bob = 1, tail = 1 },
  { legs = { -1, 1, 1, -1 }, bob = 0, tail = 0 }, { legs = { 0, 0, 0, 0 }, bob = 1, tail = 3 },
  { sit = true, tail = 0 }, { sit = true, tail = 1 }, { sit = true, tail = 2 }, { sit = true, tail = 1, blink = true },
  { sit = true, tail = 0, headDown = 2, mouth = true }, { sit = true, tail = 3, headDown = 1, blink = true },
}

for _, variant in ipairs({ { "nabi", false }, { "nabi_fat", true } }) do
  local spr = L.new(24, 16, #FR)
  for i, f in ipairs(FR) do
    local img = L.img(spr, i)
    cat(img, f, variant[2])
    L.outline(img, "g")
  end
  L.durations(spr, 150)
  L.tag(spr, "walk", 1, 4); L.tag(spr, "sit", 5, 8); L.tag(spr, "eat", 9, 10)
  L.save(spr, variant[1])
end

-- kittens: 12x10, 4 frames (idle 1-2, hop 3-4), three colours in rows of one sheet each
local KIT = { { "kitten_a", "t", "u", "v" }, { "kitten_b", "v", "w", "x" }, { "kitten_c", "k", "j", "b" } }
for _, k in ipairs(KIT) do
  local spr = L.new(12, 10, 4)
  for i = 1, 4 do
    local img = L.img(spr, i)
    local b = (i == 3) and -2 or 0
    L.map(img, 0, 1 + b, {
      ".1...1......",
      ".11.11......",
      "1111111.....",
      "1z111z1.2...",
      "1D111D12.2..",
      ".1111122222.",
      "..222222222.",
      "..23.3.23.3.",
    }, { sub = { ["1"] = k[2], ["2"] = k[3], ["3"] = k[4] } })
    if i == 2 then L.set(img, 1, 4, k[3]); L.set(img, 5, 4, k[3]) end
    if i == 4 then L.set(img, 10, 4, k[2]) end
    L.outline(img, "g")
  end
  L.durations(spr, 220)
  L.tag(spr, "idle", 1, 2); L.tag(spr, "hop", 3, 4)
  L.save(spr, k[1])
end

-- head anchor per frame (for hats): x = head map left, y = head map top
do
  local f = io.open(L.root .. "/public/assets/nabi_head.json", "w")
  local q = {}
  for _, fr in ipairs(FR) do
    local hx = fr.sit and 3 or 1
    local hy = (fr.sit and 1 or 2) + (fr.bob or 0) + (fr.headDown or 0)
    q[#q + 1] = "[" .. hx .. "," .. hy .. "]"
  end
  f:write('{ "frames": [' .. table.concat(q, ",") .. '] }\n')
  f:close()
end

-- hats for 나비 14x10, bottom row sits on the head top (head y + 3).
-- Facing left like the cat. Order: cap, bow, crown, beanie, straw.
local HATS = {
  { -- kšiltovka: red cap, brim forward (left)
    "..............",
    "..............",
    "..............",
    "..............",
    "......iii.....",
    ".....iDiii....",
    "....iDiiiih...",
    "....iiiiiih...",
    "hhhhhhhhhhh...",
    "..............",
  },
  { -- mašle: pink bow on the right ear
    "..............",
    "..............",
    "..............",
    "..............",
    "..............",
    "..........C...",
    "........DDCDD.",
    "........DtDDC.",
    ".........C.C..",
    "..............",
  },
  { -- korunka: little gold crown
    "..............",
    "..............",
    "..............",
    "....l..l..l...",
    "....ll.l.ll...",
    "....lllllll...",
    "....lkiklkk...",
    "....kkkkkkj...",
    "..............",
    "..............",
  },
  { -- čepička s bambulí: blue beanie with white pompom
    "..............",
    ".......tt.....",
    "......tttu....",
    ".......uu.....",
    "......rrrr....",
    ".....rsrrrq...",
    "....rsrrrrrq..",
    "....rrrrrrrq..",
    "...ttuttuttu..",
    "..............",
  },
  { -- slaměný klobouk: straw hat with red band, wide brim
    "..............",
    "..............",
    "..............",
    "......kkk.....",
    ".....klkkkj...",
    ".....kkkkkj...",
    ".....iiiiih...",
    "..dkkkkkkkkkb.",
    ".dddddddddddbb",
    "..............",
  },
}
do
  local spr = L.new(14, 10, #HATS)
  for i, h in ipairs(HATS) do
    local img = L.img(spr, i)
    L.map(img, 0, 0, h)
    L.outline(img, "g")
  end
  L.save(spr, "hats", { sheet = true })
end
