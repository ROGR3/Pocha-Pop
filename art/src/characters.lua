-- Customers 32x40, front-facing chibi figures. One sheet per character:
-- frames  1-2 idle | 3 neutral | 4-5 angry | 6-7 happy | 8-9 eat | 10-13 walk
local G = dofile(app.params.root .. "/art/chargen.lua")
local L, build, with, SKIN, SKIN_TAN = G.L, G.build, G.with, G.SKIN, G.SKIN_TAN


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
