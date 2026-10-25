-- Customers 32x40, front-facing chibi figures. One sheet per character:
-- frames  1-2 idle | 3 neutral | 4-5 angry | 6-7 happy | 8-9 eat | 10-13 walk
local L = dofile(app.params.root .. "/art/lib.lua")
local FW, FH = 32, 40

-- ------------------------------------------------------------------ parts
local HEAD = {
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
}
local HX, HY = 8, 4 -- head origin

local MOUTH = {
  smile   = { ".f..f.", "..ff.." },
  neutral = { "......", ".ffff." },
  angry   = { "..ff..", ".f..f." },
  happy   = { ".ffff.", ".fhhf.", "..ff.." },
  eat_a   = { "..ff..", ".fhhf.", "..ff.." },
  eat_b   = { "......", ".ffff.", "......" },
}

local function eyes(img, kind, by, P)
  local y = 11 + by
  local ex = P.eyeShift or 0
  local ec = P.eye or "z"
  if kind == "open" then
    for _, x in ipairs({ 11 + ex, 19 + ex }) do
      L.rect(img, x, y, 2, 2, ec)
      L.set(img, x + (ex > 0 and 1 or 0), y, "t")
    end
  elseif kind == "blink" then
    L.hline(img, 11, 12, y + 1, ec); L.hline(img, 19, 20, y + 1, ec)
  elseif kind == "happy" then
    for _, x in ipairs({ 10, 18 }) do
      L.set(img, x, y + 1, ec); L.set(img, x + 1, y, ec); L.set(img, x + 2, y, ec); L.set(img, x + 3, y + 1, ec)
    end
  elseif kind == "angry" then
    for _, x in ipairs({ 11, 19 }) do L.rect(img, x, y, 2, 2, ec) end
    L.set(img, 10, y - 2, "g"); L.set(img, 11, y - 2, "g"); L.set(img, 12, y - 1, "g")
    L.set(img, 19, y - 1, "g"); L.set(img, 20, y - 2, "g"); L.set(img, 21, y - 2, "g")
  elseif kind == "flat" then
    for _, x in ipairs({ 11, 19 }) do L.rect(img, x, y, 2, 2, ec); L.set(img, x, y, "t") end
    L.hline(img, 10, 12, y - 2, P.brow or "g"); L.hline(img, 19, 21, y - 2, P.brow or "g")
  end
end

-- pose: { bob, legL, legR, handL, handR, eyes, mouth, blush, fx, dx }
local function figure(img, P, pose)
  local b = pose.bob or 0
  local dx = pose.dx or 0
  local sub = { ["1"] = P.skin, ["2"] = P.skin2, ["5"] = P.top, ["6"] = P.top2, ["7"] = P.pants, ["8"] = P.shoes, ["9"] = P.accent or P.top }

  -- back hair (long hair falls behind the shoulders)
  if P.backHair then L.map(img, dx, b, P.backHair, { sub = { h = P.hair, H = P.hair2 } }) end

  -- legs
  local function leg(x, lift)
    local top, bot = 29, 36 - lift
    L.rect(img, x + dx, top, 4, bot - top + 1, P.legs or P.pants)
    L.rect(img, x + dx, top, 1, bot - top + 1, P.legs2 or P.pants2 or P.pants)
    L.rect(img, x - 1 + dx + (x < 16 and 0 or 1), bot, 5, 2, P.shoes)
    L.set(img, x + dx + (x < 16 and 0 or 4), bot, P.shoes2 or P.shoes)
  end
  if P.skirt then
    leg(11, pose.legL or 0); leg(17, pose.legR or 0)
    L.map(img, 9 + dx, 27 + b, P.skirt, { sub = sub })
  else
    leg(11, pose.legL or 0); leg(17, pose.legR or 0)
    L.rect(img, 11 + dx, 28 + b, 10, 2, P.pants)
  end

  -- torso
  L.map(img, 10 + dx, 17 + b, P.body or {
    "...555555...",
    ".5555555555.",
    "555555555556",
    "555555555556",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555666",
    "556666666666",
  }, { sub = sub })
  if P.bodyDetail then P.bodyDetail(img, dx + 1, b) end

  -- arms + hands
  local function arm(x, hy, flip)
    L.rect(img, x + dx, 18 + b, 2, 8 + hy, flip and P.top2 or P.top)
    L.rect(img, x + dx, 26 + b + hy, 2, 2, P.skin)
    L.set(img, x + dx + (flip and 1 or 0), 27 + b + hy, P.skin2)
  end
  arm(8, pose.handL or 0, false)
  if not pose.noRightArm then arm(22, pose.handR or 0, true) end

  -- head
  L.map(img, HX + dx, HY + b, HEAD, { sub = sub })
  -- ears
  L.set(img, HX - 1 + dx, 11 + b, P.skin); L.set(img, HX + 16 + dx, 11 + b, P.skin2)
  -- face
  eyes(img, pose.eyes or "open", b, P)
  if P.eyeBags then L.hline(img, 11 + dx, 12 + dx, 13 + b, "B"); L.hline(img, 19 + dx, 20 + dx, 13 + b, "B") end
  L.map(img, 13 + dx, 14 + b, MOUTH[pose.mouth or "smile"])
  if pose.blush then
    L.hline(img, 9 + dx, 10 + dx, 13 + b, "D"); L.hline(img, 21 + dx, 22 + dx, 13 + b, "D")
  end
  -- front hair / hat / accessories
  if P.hairFront then L.map(img, (P.hairX or 7) + dx, (P.hairY or 1) + b, P.hairFront, { sub = { h = P.hair, H = P.hair2, x = P.hair3 or P.hair2 } }) end
  if P.face then P.face(img, dx, b, pose) end
  if pose.extra then pose.extra(img, b, P) end
end

local function fxVein(img, b)
  L.map(img, 24, 2 + b, { ".i.i", "i...", "....", "i..i", ".ii." })
end
local function fxSweat(img, b)
  L.map(img, 24, 7 + b, { ".r", "rs", "rr" })
end
local function fxHeart(img, b)
  L.map(img, 24, 1 + b, { ".A.A.", "AAiAA", ".AAA.", "..A.." })
end
local function fxSteam(img, b)
  L.map(img, 3, 1 + b, { ".u.", "u.u", ".u." })
  L.map(img, 26, 3 + b, { "u.", ".u", "u." })
end

local POSES = {
  { name = "idle", eyes = "open", mouth = "smile" },
  { name = "idle", eyes = "blink", mouth = "smile" },
  { name = "neutral", eyes = "flat", mouth = "neutral", fx = fxSweat },
  { name = "angry", eyes = "angry", mouth = "angry", fx = fxVein },
  { name = "angry", eyes = "angry", mouth = "angry", fx = fxSteam, dx = 1 },
  { name = "happy", eyes = "happy", mouth = "happy", blush = true },
  { name = "happy", eyes = "happy", mouth = "happy", blush = true, bob = -1, handL = -3, handR = -3, fx = fxHeart },
  { name = "eat", eyes = "happy", mouth = "eat_a", blush = true, handR = -6 },
  { name = "eat", eyes = "happy", mouth = "eat_b", blush = true, handR = -4, bob = 1 },
  { name = "walk", eyes = "open", mouth = "smile", legL = 0, legR = 2, bob = -1, handL = 1, handR = -1 },
  { name = "walk", eyes = "open", mouth = "smile" },
  { name = "walk", eyes = "open", mouth = "smile", legL = 2, legR = 0, bob = -1, handL = -1, handR = 1 },
  { name = "walk", eyes = "blink", mouth = "smile" },
}

local DEFAULT_TAGS = { { "idle", 1, 2 }, { "neutral", 3, 3 }, { "angry", 4, 5 }, { "happy", 6, 7 }, { "eat", 8, 9 }, { "walk", 10, 13 } }

local function build(name, P, poses, tags)
  poses = poses or POSES
  local spr = L.new(FW, FH, #poses)
  for i, pose in ipairs(poses) do
    local img = L.img(spr, i)
    figure(img, P, pose)
    if pose.name == "eat" and P.chopsticks ~= false and pose.handR then
      -- chopsticks in the raised right hand
      local hy = 26 + (pose.bob or 0) + (pose.handR or 0)
      L.line(img, 23, hy, 18, hy - 5, "d"); L.line(img, 24, hy, 20, hy - 6, "e")
    end
    L.outline(img, P.outline or "g")
    if pose.fx then pose.fx(img, pose.bob or 0) end
  end
  L.durations(spr, 160)
  for _, t in ipairs(tags or DEFAULT_TAGS) do L.tag(spr, t[1], t[2], t[3]) end
  L.save(spr, "char_" .. name)
end

-- ------------------------------------------------------------------ cast
local SKIN = { skin = "E", skin2 = "F" }
local SKIN_TAN = { skin = "d", skin2 = "F" }
local function with(base, t) local r = {}; for k, v in pairs(base) do r[k] = v end; for k, v in pairs(t) do r[k] = v end; return r end

-- 김 대리 – tired office worker: neat black side part, white shirt, loose red tie, eye bags
local KIM = with(SKIN, {
  hair = "y", hair2 = "x", top = "t", top2 = "u", pants = "x", pants2 = "y", shoes = "z", eyeBags = true,
  hairFront = {
    ".....yyyyyyyyy....",
    "...yyyyyyyyyyyyy..",
    "..yyyxxyyyyyyyyyy.",
    ".yyyxxyyyyyyyyyyyy",
    ".yyyyyyyyyxyyyyyyy",
    ".yyyyyyyy...yyyyyy",
    ".yyyyy.......yyyyy",
    ".yyy...........yyy",
    ".yy.............yy",
    ".y...............y",
  },
  bodyDetail = function(img, dx, b)
    L.map(img, 13 + dx, 17 + b, { "t..t", ".ii.", ".ii.", "..ih", "..ih", ".ih.", ".ih.", "..h." })
    L.map(img, 9 + dx, 17 + b, { "...ttt", "......" })
    L.set(img, 11 + dx, 22 + b, "r"); L.rect(img, 10 + dx, 23 + b, 2, 3, "r"); L.set(img, 10 + dx, 23 + b, "s")
  end,
})
build("kim", KIM)

-- 김 as the stall helper (after he quit): orange bandana, rolled-up sleeves,
-- navy apron, no more eye bags. idle 1-2 | cook 3-6 (chopping) | wave 7-8
do
  local H = with(KIM, {
    eyeBags = false,
    hairFront = {
      ".....yyyyyyyyy....",
      "...yyyyyyyyyyyyy..",
      "..yyyxxyyyyyyyyyy.",
      ".jjjjjjjjjjjjjjjjk",
      ".bbbbbbbbbbbbbbbjk",
      ".yyyyyyyy...yyyy.j",
      ".yyyyy.......yyyy.",
      ".yyy...........yyy",
      ".yy.............yy",
      ".y...............y",
    },
    bodyDetail = function(img, dx, b)
      -- apron over the white shirt: bib, straps, pocket with a pen
      L.map(img, 10 + dx, 17 + b, { "..x....x..", "..x....x..", "..xxxxxx..", ".xxxxxxxxx", ".xxxxxxxxy", ".xxwwwxxxy", ".xxwkwxxxy", ".xxxxxxxxy", ".xxxxxxxxy", ".yyyyyyyyy" })
      L.set(img, 13 + dx, 23 + b, "k")
    end,
  })
  local function board(img, b, P, up, chips)
    -- cutting board with a green onion, knife in the right hand
    L.rect(img, 7, 27, 18, 2, "d"); L.hline(img, 7, 24, 27, "c"); L.hline(img, 7, 24, 29, "f")
    L.hline(img, 9, 15, 26, "m"); L.set(img, 16, 26, "t"); L.set(img, 17, 26, "t")
    if up then
      L.line(img, 24, 21 + b, 26, 17 + b, "v"); L.line(img, 25, 21 + b, 27, 17 + b, "t"); L.set(img, 24, 22 + b, "f")
    else
      L.hline(img, 16, 21, 26, "v"); L.hline(img, 17, 21, 25, "t"); L.set(img, 22, 26, "f"); L.set(img, 23, 26, "f")
    end
    if chips then L.set(img, 15, 23 + chips, "m"); L.set(img, 18, 22 + chips, "n"); L.set(img, 13, 24 + chips, "m") end
  end
  local function waveArm(x)
    return function(img, b, P)
      L.rect(img, 22, 18 + b, 2, 3, P.top2)
      L.line(img, 23, 17 + b, 24 + x, 10 + b, P.top2); L.line(img, 22, 17 + b, 23 + x, 10 + b, P.top)
      L.rect(img, 23 + x, 7 + b, 3, 3, P.skin); L.set(img, 25 + x, 9 + b, P.skin2); L.set(img, 23 + x, 6 + b, P.skin)
    end
  end
  local HP = {
    { name = "idle", eyes = "open", mouth = "smile" },
    { name = "idle", eyes = "blink", mouth = "smile" },
    { name = "cook", eyes = "flat", mouth = "neutral", handL = -1, handR = -4, extra = function(img, b, P) board(img, b, P, true) end },
    { name = "cook", eyes = "flat", mouth = "neutral", handL = -1, handR = -1, bob = 1, extra = function(img, b, P) board(img, b, P, false, 0) end },
    { name = "cook", eyes = "open", mouth = "smile", handL = -1, handR = -4, extra = function(img, b, P) board(img, b, P, true, -2) end },
    { name = "cook", eyes = "happy", mouth = "smile", handL = -1, handR = -1, bob = 1, extra = function(img, b, P) board(img, b, P, false) end },
    { name = "wave", eyes = "happy", mouth = "happy", blush = true, noRightArm = true, extra = waveArm(0) },
    { name = "wave", eyes = "happy", mouth = "happy", blush = true, noRightArm = true, bob = -1, extra = waveArm(2) },
  }
  build("kim_helper", H, HP, { { "idle", 1, 2 }, { "cook", 3, 6 }, { "wave", 7, 8 } })
end

-- 하은 – student before 수능: long brown hair, exam headband, navy uniform, ribbon
build("haeun", with(SKIN, {
  hair = "f", hair2 = "e", top = "q", top2 = "x", pants = "y", pants2 = "z", shoes = "f", legs = "E", legs2 = "F",
  backHair = {
    "",
    "", "", "", "", "", "", "", "", "",
    ".......hhhhhhhhhhhhhhhhhh.......",
    "......hhhhhhhhhhhhhhhhhhhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......Hhh..............hhH......",
    "......Hhh..............hhH......",
    "......HHh..............hHH......",
    "......HH................HH......",
    "......H..................H......",
  },
  hairFront = {
    ".....hhhhhhhhh....",
    "...hhhhhhhhhhhhh..",
    "..hhHHhhhhhhhhhhh.",
    ".tttttttiitttttttt",
    ".hhhhhhhiihhhhhhhh",
    ".hhhhhhhhhhhhhhhhh",
    ".hhhh.hhhh.hhhhhhh",
    ".hhh...hh...h.hhhh",
    ".hh.............hh",
    ".hh.............hh",
    ".hh.............hh",
  },
  skirt = {
    ".7777777777777.",
    "777777777777777",
    "777y777y777y777",
    "777y777y777y777",
    ".77y777y777y77.",
  },
  bodyDetail = function(img, dx, b)
    L.map(img, 13 + dx, 17 + b, { "tttt", ".ii.", "iAAi", ".ii." })
    L.vline(img, 10 + dx, 18 + b, 26 + b, "j"); L.vline(img, 21 + dx, 18 + b, 26 + b, "b")
  end,
}))

-- 미식가 – food critic: grey hair, purple beret, round gold glasses, mustache, tweed jacket, scarf
build("critic", with(SKIN, {
  hair = "u", hair2 = "v", top = "e", top2 = "f", pants = "f", pants2 = "g", shoes = "z",
  hairFront = {
    ".......BBBBBBB.....",
    "....BBBBBBBBBBBBB..",
    "..BBBCCBBBBBBBBBBB.",
    ".BBBCCBBBBBBBBBBBBB",
    ".BBBBBBBBBBBBBBBBBB",
    "..xxxxxxxxxxxxxxxx.",
    ".uu..............uu",
    ".uu..............uu",
    ".uv..............vu",
    ".uv..............vu",
    "..v...............v",
  },
  hairX = 6, hairY = 0,
  face = function(img, dx, b, pose)
    if pose.eyes == "open" or pose.eyes == "flat" or pose.eyes == "angry" or pose.eyes == "blink" then
      L.map(img, 10 + dx, 10 + b, { "kkkk...kkkk", "k..kkkkk..k", "k..k...k..k", "kkkk...kkkk" })
    else
      L.map(img, 10 + dx, 10 + b, { "kkkk...kkkk", "k..kkkkk..k", "k..k...k..k", "kkkk...kkkk" })
    end
    L.map(img, 12 + dx, 14 + b, { "uuuuuuuu", ".uu..uu." })
  end,
  bodyDetail = function(img, dx, b)
    L.map(img, 9 + dx, 17 + b, { "..CCCCCCCC..", ".CBBBBBBBBC.", "....CB.tt...", "....CB.tt...", "....BB..t...", "......tt...." })
    L.set(img, 12 + dx, 24 + b, "f"); L.set(img, 12 + dx, 26 + b, "f")
    L.map(img, 17 + dx, 22 + b, { "fff", "e.e" })
  end,
}))

-- generic A – hoodie guy
build("cust_a", with(SKIN_TAN, {
  hair = "f", hair2 = "g", top = "n", top2 = "o", pants = "q", pants2 = "x", shoes = "t", shoes2 = "u",
  hairFront = {
    "...f..fffff.f.....",
    "...fffffffffffff..",
    "..ffeefffffeffff..",
    ".fffeffffffffffff.",
    ".ffffffffffffffff.",
    ".ffff.ff.fff.ffff.",
    ".fff...f..f...fff.",
    ".ff............ff.",
    ".f..............f.",
  },
  bodyDetail = function(img, dx, b)
    L.map(img, 9 + dx, 16 + b, { "..oooooooo..", ".o........o.", "....t..t....", "....t..t....", "............", "............", "...oooooo...", "...o....o...", "...oooooo..." })
  end,
}))

-- generic B – long black hair, pink cardigan
build("cust_b", with(SKIN, {
  hair = "y", hair2 = "x", top = "D", top2 = "C", pants = "x", pants2 = "y", shoes = "h",
  backHair = {
    "", "", "", "", "", "", "", "", "", "",
    ".......hhhhhhhhhhhhhhhhhh.......",
    "......hhhhhhhhhhhhhhhhhhhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hhh..............hhh......",
    "......hHh..............hHh......",
    "......hH................Hh......",
  },
  hairFront = {
    ".....hhhhhhhhh....",
    "...hhhhhhhhhhhhh..",
    "..hhHHhhhhhhhhhhh.",
    ".hhHHhhhhhhhhhhhhh",
    ".hhhhhhhhhhhhhhhhh",
    ".hhhhhhhhhhhhhhhhh",
    ".hhhhhhhhhhhhhhhhh",
    ".hh.............hh",
    ".hh.............hh",
    ".hh.............hh",
  },
  bodyDetail = function(img, dx, b)
    L.map(img, 13 + dx, 17 + b, { "tttt", "tttt", "tttt", "tttt", "tttt", "tttt", "tttt", "tttt", "tttt", "tttt" })
    L.set(img, 12 + dx, 21 + b, "t"); L.set(img, 12 + dx, 24 + b, "t")
  end,
}))

-- generic C – ajeossi with cap and dark jacket
build("cust_c", with(SKIN_TAN, {
  hair = "v", hair2 = "w", top = "w", top2 = "x", pants = "y", pants2 = "z", shoes = "f",
  hairFront = {
    "......qqqqqqq.....",
    "....qqqqqqqqqqq...",
    "...qqrrqqqqqqqqq..",
    "..qqrqqqqqqtqqqqq.",
    "..qqqqqqqqqqqqqqq.",
    "qqqqqqqqqqqqqqqqq.",
    ".xxxxxxxxxxxxxxxx.",
    ".vv............vv.",
    ".vv............vv.",
    ".v..............v.",
  },
  face = function(img, dx, b, pose)
    L.map(img, 12 + dx, 13 + b, { ".v....v." })
  end,
  bodyDetail = function(img, dx, b)
    L.map(img, 9 + dx, 17 + b, { "...vvvvvv...", "....v..v....", "......y.....", "......y.....", "..xx..y..xx.", "......y.....", "......y.....", "......y....." })
  end,
}))

-- generic D – yellow raincoat
build("cust_d", with(SKIN, {
  hair = "b", hair2 = "e", top = "k", top2 = "j", pants = "j", pants2 = "b", shoes = "i", shoes2 = "h", legs = "q", legs2 = "x",
  hairFront = {
    "......kkkkkk......",
    "....kkkkkkkkkk....",
    "...kkllkkkkkkkk...",
    "..kkllkkkkkkkkkk..",
    ".kklkkkkkkkkkkkkk.",
    ".kkkbbbbbbbbbbbkk.",
    "kkkbbbbbbbbbbbbbkk",
    "kkbbbbe..ebbbbbbkk",
    "kkbb..........bbkj",
    "kkb............bkj",
    "kk..............kj",
    "kk..............kj",
    "kk..............jj",
    "kkj............jjj",
  },
  bodyDetail = function(img, dx, b)
    L.map(img, 9 + dx, 17 + b, { "............", "......t.....", "......j.....", "......t.....", "......j.....", "......t.....", "..jj..j..jj.", "......t....." })
  end,
}))

-- 할머니 – grandma: grey bun, purple cardigan, round glasses, apron
build("halmeoni", with(SKIN, {
  hair = "u", hair2 = "v", top = "B", top2 = "y", pants = "w", pants2 = "x", shoes = "f",
  hairFront = {
    "......uuuuuu......",
    ".....uuvvvvuu.....",
    "......uuuuuu......",
    "....uuuuuuuuuu....",
    "...uuuuuuuuuuuu...",
    "..uuuvuuuuuuvuuu..",
    ".uuuu.uuuuuu.uuuu.",
    ".uuu..........uuu.",
    ".uu............uu.",
    ".u..............u.",
  },
  hairY = -1,
  face = function(img, dx, b, pose)
    L.map(img, 10 + dx, 10 + b, { "vvvv...vvvv", "v..vvvvv..v", "v..v...v..v", "vvvv...vvvv" })
    L.set(img, 10 + dx, 15 + b, "F"); L.set(img, 21 + dx, 15 + b, "F")
  end,
  bodyDetail = function(img, dx, b)
    L.map(img, 10 + dx, 18 + b, { "..cccccc..", ".cccccccc.", ".cDccccDc.", ".cccccccc.", ".cccDDccc.", ".cccccccc.", ".cccccccc.", ".cccccccc.", ".dddddddd." })
  end,
}))
