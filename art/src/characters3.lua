-- Generic district customers (동대문, 홍대, 용산, 부산), 32x40, standard 13-frame sheets:
-- frames  1-2 idle | 3 neutral | 4-5 angry | 6-7 happy | 8-9 eat | 10-13 walk
local G = dofile(app.params.root .. "/art/chargen.lua")
local L, build, with, SKIN, SKIN_TAN = G.L, G.build, G.with, G.SKIN, G.SKIN_TAN

-- top-left pixel of a hand (2x2) for the current pose
local function hand(dx, b, pose, side)
  if side == "L" then return 8 + dx, 26 + b + (pose.handL or 0) end
  return 22 + dx, 26 + b + (pose.handR or 0)
end

-- round / square glasses over the eyes (x 10..21, y 10..13)
local function roundGlasses(img, dx, b, c)
  L.map(img, 10 + dx, 10 + b, { ".cc.....cc..", "c..cccccc..c", "c..c....c..c", ".cc......cc." }, { sub = { c = c } })
end
local function thickGlasses(img, dx, b, c)
  L.map(img, 10 + dx, 10 + b, { "cccc....cccc", "c..cccccc..c", "c..c....c..c", "cccc....cccc" }, { sub = { c = c } })
end

-- rolled-up sleeves: bare forearm above the hand + a cuff
local function forearms(img, dx, b, pose, P, cuff)
  for _, s in ipairs({ "L", "R" }) do
    if not (s == "R" and pose.noRightArm) then
      local hx, hy = hand(dx, b, pose, s)
      local top = math.max(hy - 3, 20 + b)
      if top < hy then
        L.rect(img, hx, top, 2, hy - top, P.skin)
        L.set(img, hx + (s == "R" and 1 or 0), top, P.skin2)
        L.hline(img, hx, hx + 1, top - 1, cuff)
      end
    end
  end
end

-- ------------------------------------------------------------------ 동대문
-- cust_e – ajumma shopper: tinted sun visor, permed curls, floral magenta jacket, two shopping bags
local function shoppingBag(img, x, y, c1, c2, logo)
  L.set(img, x + 1, y, "v"); L.set(img, x + 4, y, "v"); L.set(img, x + 1, y - 1, "v"); L.set(img, x + 4, y - 1, "v")
  L.rect(img, x, y + 1, 6, 6, c1)
  L.vline(img, x + 5, y + 1, y + 6, c2); L.hline(img, x, x + 5, y + 6, c2)
  L.hline(img, x, x + 5, y + 1, c2)
  if logo then L.rect(img, x + 2, y + 3, 2, 2, logo) end
end
build("cust_e", with(SKIN, {
  hair = "f", hair2 = "e", top = "m", top2 = "n", pants = "w", pants2 = "x", shoes = "y",
  hairFront = {
    "....h.hh.hh.hh....",
    "..hhhHhhhHhhhHhh..",
    ".hHhhhHhhhHhhhHhh.",
    "hhhHhhhhHhhhhhhHhh",
    "hrrrrrrrrrrrrrrrrh",
    "Hhqqqqqqqqqqqqqqhh",
    "hHh.............Hh",
    "Hhh.............hH",
    "hHh.............Hh",
    ".hH.............hH",
    ".Hh.............Hh",
    "..h..............h",
  },
  face = function(img, dx, b, pose)
    -- tinted visor brim sticking out over the forehead
    L.map(img, 5 + dx, 7 + b, { "..rrrrrrrrrrrrrrrrrr..", ".rssssssssssssssssssr.", "qqqqqqqqqqqqqqqqqqqqqq" })
    local lx, ly = hand(dx, b, pose, "L")
    shoppingBag(img, lx - 2, ly + 1, "t", "u", "i")
    local rx, ry = hand(dx, b, pose, "R")
    if (pose.handR or 0) < -3 then
      shoppingBag(img, 24 + dx, 31, "D", "C", "t") -- put down while eating
    else
      shoppingBag(img, rx - 2, ry + 1, "D", "C", "t")
    end
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- white collar, flower print
    L.map(img, 12 + o, 17 + b, { ".tt....tt.", "..tt..tt.." })
    for _, p in ipairs({ { 11, 20 }, { 17, 21 }, { 13, 23 }, { 19, 25 }, { 11, 26 }, { 15, 26 } }) do
      L.map(img, p[1] + o, p[2] + b, { ".k.", "klk", ".k." })
    end
  end,
}))

-- cust_f – fashion student: red beret, black bob, round tortoise glasses, oversized grey blazer, tote bag
build("cust_f", with(SKIN, {
  hair = "y", hair2 = "z", top = "v", top2 = "w", pants = "y", pants2 = "z", shoes = "f",
  hairFront = {
    "...........ii.....",
    ".....iiiiiiiiii...",
    "...iiiiiiiiiiiiii.",
    "..iiaiiiiiiiiiiiii",
    "..aaaaaaaaaaaaaaaa",
    ".hhhhhhhhhhhhhhhhh",
    ".hhhhhhhhhhhhhhhhh",
    ".hhHhhhhhhhhhhhHhh",
    ".hh.............hh",
    ".hh.............hh",
    ".hh.............hh",
    ".hh.............hh",
    ".hH.............Hh",
    ".HH.............HH",
  },
  face = function(img, dx, b, pose)
    roundGlasses(img, dx, b, "f")
    -- canvas tote hanging off the left shoulder
    L.line(img, 11 + dx, 18 + b, 8 + dx, 22 + b, "c")
    L.line(img, 12 + dx, 18 + b, 10 + dx, 22 + b, "d")
    L.map(img, 4 + dx, 23 + b, { "cccccc", "cccccd", "ccyycd", "ccyycd", "cccccd", "cccccd", "dddddd" })
  end,
  body = {
    "..555555555.",
    "555555555556",
    "555555555556",
    "555555555556",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555666",
    "556666666666",
  },
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- black turtleneck inside a deep V, lapels, pocket
    L.map(img, 13 + o, 17 + b, { "zzzzzz", "uzzzzu", ".uzzu.", ".uzzu.", "..uu..", "..ww.." })
    L.hline(img, 11 + o, 13 + o, 24 + b, "w")
    L.set(img, 16 + o, 25 + b, "w"); L.set(img, 16 + o, 27 + b, "w")
  end,
}))

-- ------------------------------------------------------------------ 홍대
-- cust_g – hipster: mustard beanie, beard, headphones round the neck, open red flannel over a black tee
build("cust_g", with(SKIN, {
  hair = "e", hair2 = "f", top = "i", top2 = "h", pants = "q", pants2 = "x", shoes = "f", shoes2 = "e",
  hairFront = {
    "........kk........",
    "......kkkkkk......",
    "....kkkkkkkkkk....",
    "...kkkklkkkkkkk...",
    "..kkklkkkkkkkkkk..",
    ".bkbkbkbkbkbkbkbk.",
    ".kbkbkbkbkbkbkbkb.",
    ".hhh..h......hhhh.",
    ".hh............hh.",
    ".h..............h.",
  },
  face = function(img, dx, b, pose)
    L.map(img, 8 + dx, 13 + b, {
      "F..............F",
      "ff............ff",
      ".fff........fff.",
      "...ffff..ffff...",
      "....ffffffff....",
    })
    if pose.mouth ~= "happy" and pose.mouth ~= "eat_a" then L.hline(img, 13 + dx, 18 + dx, 13 + b, "f") end
    -- headphones resting on the collarbones
    L.map(img, 9 + dx, 16 + b, { ".ww........ww.", "wuvy......yvuw", "wvvy......yvvw", ".wA........Aw." })
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- plaid
    for _, x in ipairs({ 11, 19 }) do L.vline(img, x + o, 18 + b, 27 + b, "a") end
    for _, y in ipairs({ 20, 24 }) do L.hline(img, 10 + o, 21 + o, y + b, "h") end
    -- black tee in the open front + collar flaps
    L.rect(img, 14 + o, 18 + b, 4, 10, "y")
    L.map(img, 13 + o, 17 + b, { "hzzzzh", ".h..h." })
  end,
}))

-- cust_h – K-pop fan: white bucket hat, magenta hair with low pigtails, cropped blue jacket, glowing lightstick
build("cust_h", with(SKIN, {
  hair = "C", hair2 = "B", top = "r", top2 = "q", pants = "z", pants2 = "y", shoes = "t", shoes2 = "u",
  legs = "E", legs2 = "F",
  backHair = {
    "", "", "", "", "", "", "", "", "", "", "",
    "......tt.................tt.....",
    ".....hhhh...............hhhh....",
    ".....hhhh...............hhhH....",
    ".....hhhH...............hhHH....",
    "......hH.................HH.....",
    "......hH.................H......",
  },
  hairFront = {
    "......tttttt......",
    "....tttttttttt....",
    "...tuttttttttttt..",
    "...tttttttttttttt.",
    "..uuuuuuuuuuuuuuu.",
    ".tttttttttttttttttu",
    "uuuuuuuuuuuuuuuuuu",
    ".hhhhhhh.hhhhhhhhh",
    ".hhHh.hh..hh.hHhh.",
    ".hh.............hh",
    ".h...............h",
  },
  skirt = {
    ".zzzzzzzzzzzzz.",
    "zzzzzzzzzzzzzzz",
    "zzzyzzzyzzzyzzz",
    ".zzyzzzyzzzyzz.",
  },
  face = function(img, dx, b, pose)
    -- lightstick held up in the left hand
    local x, y = hand(dx, b, pose, "L")
    L.line(img, x, y - 1, x - 2, y - 5, "u")
    L.line(img, x + 1, y - 1, x - 1, y - 5, "v")
    L.map(img, x - 5, y - 11, { ".ss.", "sllt", "lltl", "sllk", ".kk." })
    L.set(img, x - 6, y - 9, "s"); L.set(img, x - 1, y - 10, "s")
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- cropped jacket ends at the waist: white top beneath, open front, star pin
    L.rect(img, 10 + o, 24 + b, 12, 3, "t"); L.hline(img, 10 + o, 21 + o, 26 + b, "u")
    L.map(img, 14 + o, 17 + b, { "tttt", ".tt.", ".tt.", ".tt.", ".tt.", ".tt.", ".tt." })
    L.hline(img, 10 + o, 21 + o, 23 + b, "q")
    L.set(img, 12 + o, 19 + b, "l")
  end,
}))

-- ------------------------------------------------------------------ 용산
-- cust_i – gamer: messy black hair, thick glasses, dark hoodie with pixel print, backpack straps
build("cust_i", with(SKIN, {
  hair = "y", hair2 = "x", top = "x", top2 = "y", pants = "w", pants2 = "x", shoes = "i", shoes2 = "t",
  hairFront = {
    "..h...h.hh..h.....",
    "...hhhhhhhhhhhh.h.",
    "..hhHhhhhhhhhHhh..",
    "hhhhhHhhhhhhhhhhhh",
    ".hhhhhhhhhhhhhhhh.",
    "hhhhhhhhhhhhhhhhhh",
    ".hhhh.hhhh.hhhhhhh",
    ".hhh..hhh...hh.hhh",
    ".hh....h.......hh.",
    ".h..............h.",
  },
  face = function(img, dx, b, pose)
    thickGlasses(img, dx, b, "z")
    L.set(img, 13 + dx, 12 + b, "t"); L.set(img, 21 + dx, 12 + b, "t")
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- hood bunched behind the neck, strings, backpack straps, pixel invader print
    L.map(img, 11 + o, 16 + b, { "yy......yy", "xyy....yyx" })
    L.vline(img, 14 + o, 18 + b, 21 + b, "u"); L.vline(img, 17 + o, 18 + b, 21 + b, "u")
    for _, x in ipairs({ 11, 19 }) do
      L.rect(img, x + o, 18 + b, 2, 9, "z"); L.set(img, x + o, 18 + b, "w")
      L.hline(img, x + o, x + 1 + o, 23 + b, "A")
    end
    L.map(img, 13 + o, 22 + b, { "m....m", ".mmmm.", "mm.m.m", "mmmmmm", ".m..m." })
  end,
}))

-- cust_j – office worker: neat brown bob, light blue shirt, red lanyard + ID badge, laptop bag strap
build("cust_j", with(SKIN, {
  hair = "f", hair2 = "e", top = "u", top2 = "v", pants = "y", pants2 = "z", shoes = "z",
  hairFront = {
    ".....hhhhhhhh.....",
    "...hhhhhhhhhhhh...",
    "..hhhHHhhhhhhhhh..",
    ".hhhHhhhhhhhhhhhh.",
    ".hhhhhhhhh.hhhhhhh",
    ".hhhhhhh...hhhhhhh",
    ".hhhhh......hhhhhh",
    ".hhh.........hhhhh",
    ".hh............hhh",
    ".hh.............hh",
    ".hh.............hh",
    ".hH.............Hh",
  },
  face = function(img, dx, b, pose)
    -- laptop bag strap across the chest from the right shoulder
    L.line(img, 21 + dx, 18 + b, 11 + dx, 27 + b, "y")
    L.line(img, 21 + dx, 19 + b, 12 + dx, 27 + b, "z")
    L.rect(img, 20 + dx, 19 + b, 1, 1, "v")
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- collar, button line, lanyard + badge
    L.map(img, 13 + o, 17 + b, { "tt..tt", ".t..t." })
    L.vline(img, 16 + o, 19 + b, 27 + b, "v")
    L.line(img, 13 + o, 18 + b, 14 + o, 22 + b, "i"); L.line(img, 18 + o, 18 + b, 17 + o, 22 + b, "i")
    L.map(img, 14 + o, 23 + b, { "tttt", "trrt", "tvvt", "tttt" })
  end,
}))

-- ------------------------------------------------------------------ 부산
-- cust_k – tourist: wide straw sun hat, hawaiian shirt, camera on a strap, backpack, shorts
build("cust_k", with(SKIN, {
  hair = "b", hair2 = "e", top = "r", top2 = "q", pants = "c", pants2 = "d", shoes = "f", legs = "E", legs2 = "F",
  backHair = {
    "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "", "",
    ".......ff................ff.....",
    ".......af................fa.....",
    ".......aa................aa.....",
    ".......aa................aa.....",
    ".......aa................aa.....",
    ".......aa................aa.....",
  },
  hairFront = {
    "",
    "........dddddddd........",
    ".......ccccccccccc......",
    ".......cdcccccccccc.....",
    ".......iiiiiiiiiiii.....",
    "..cccccccccccccccccccc..",
    "dccdccccccccccccccdcccdd",
    ".dddddddddddddddddddddd.",
    "....hhhh.hhhhhh.hhhh....",
    "....hh............hh....",
    "....h..............h....",
  },
  hairX = 4, hairY = 0,
  face = function(img, dx, b, pose)
    -- camera hanging on the chest
    L.line(img, 12 + dx, 18 + b, 14 + dx, 21 + b, "z"); L.line(img, 19 + dx, 18 + b, 17 + dx, 21 + b, "z")
    L.map(img, 13 + dx, 21 + b, { ".zz...", "zzzzzz", "zwwzuz", "zwsz.z", "zzzzzz" })
    -- khaki shorts
    L.rect(img, 11 + dx, 30, 4, 2, "c"); L.rect(img, 17 + dx, 30, 4, 2, "c")
    L.set(img, 11 + dx, 30, "d"); L.set(img, 11 + dx, 31, "d"); L.set(img, 17 + dx, 30, "d"); L.set(img, 17 + dx, 31, "d")
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- backpack straps, hibiscus print, collar
    L.vline(img, 11 + o, 18 + b, 26 + b, "a"); L.vline(img, 20 + o, 18 + b, 26 + b, "a")
    L.map(img, 13 + o, 17 + b, { "tt..tt" })
    for _, p in ipairs({ { 11, 24 }, { 18, 25 }, { 18, 18 } }) do
      L.map(img, p[1] + o, p[2] + b, { ".t.", "tlt", ".t." })
    end
    L.map(img, 15 + o, 26 + b, { "mm" }); L.set(img, 12 + o, 20 + b, "m")
  end,
}))

-- cust_l – fisherman: red knitted beanie, weathered tan skin, grey stubble, yellow rubber bib overalls,
-- rolled sleeves on a navy sweater, black rubber boots
build("cust_l", with(SKIN_TAN, {
  hair = "v", hair2 = "w", top = "x", top2 = "y", pants = "k", pants2 = "j", shoes = "y", shoes2 = "z",
  hairFront = {
    "",
    "......iiiiii......",
    "....iiiiiiiiii....",
    "...iaiiiiiiiiii...",
    "..iiaiiaiiaiiaii..",
    "..iiaiiaiiaiiaii..",
    ".hahahahahahahaha.",
    ".hhh..........hhh.",
    ".hh............hh.",
    ".h..............h.",
  },
  face = function(img, dx, b, pose)
    forearms(img, dx, b, pose, { skin = "d", skin2 = "F" }, "w")
    -- crow's feet + stubble
    L.set(img, 9 + dx, 11 + b, "F"); L.set(img, 22 + dx, 11 + b, "F")
    L.map(img, 9 + dx, 15 + b, { "v............v", ".v.v......v.v.", "...v.v.vv.v..." })
  end,
  bodyDetail = function(img, dx, b)
    local o = dx - 1
    -- overall bib + straps + buckles
    L.map(img, 11 + o, 17 + b, { "k........k", "k........k", "kk......kk" })
    L.map(img, 12 + o, 20 + b, {
      "zkkkkkkz",
      "kkkkkkkj",
      "kkjjjjkj",
      "kkjkkjkj",
      "kkjjjjkj",
      "kkkkkkkj",
      "kkkkkkkj",
      "kkkkkkkj",
    })
    L.rect(img, 10 + o, 27 + b, 12, 1, "k")
  end,
}))
