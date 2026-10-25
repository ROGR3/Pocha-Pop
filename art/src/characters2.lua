-- Stage-2 cast, 32x40 chibi figures built with art/chargen.lua (same poses/tags as characters.lua):
-- frames  1-2 idle | 3 neutral | 4-5 angry | 6-7 happy | 8-9 eat | 10-13 walk
local G = dofile(app.params.root .. "/art/chargen.lua")
local L, build, with, SKIN, SKIN_TAN = G.L, G.build, G.with, G.SKIN, G.SKIN_TAN

-- forearm length for a pose (arms are 8 px + hand offset, starting at y 18)
local function armLen(pose, right) return 8 + ((right and pose.handR or pose.handL) or 0) end

-- rolled-up sleeves: lower half of each arm shows skin, cuff roll in `cuff`
local function rolledSleeves(img, dx, b, pose, P, cuff)
  for _, a in ipairs({ { 8, false }, { 22, true } }) do
    if not (a[2] and pose.noRightArm) then
      local len = armLen(pose, a[2])
      local x = a[1] + dx
      local cy = 18 + b + math.max(1, len - 5)
      L.hline(img, x, x + 1, cy, cuff)
      for y = cy + 1, 25 + b + (len - 8) do L.hline(img, x, x + 1, y, P.skin); L.set(img, x + (a[2] and 1 or 0), y, P.skin2) end
    end
  end
end

local function isOpenEyes(pose) return pose.eyes == "open" or pose.eyes == "blink" or pose.eyes == "flat" or pose.eyes == "angry" end

-- 이모 – 동대문 seamstress: short tight perm, floral blouse, measuring tape, pincushion bracelet
build("imo", with(SKIN, {
  hair = "f", hair2 = "g", top = "C", top2 = "B", pants = "x", pants2 = "y", shoes = "y",
  hairFront = {
    "...ehe.hhe.ehh.e..",
    "..hhhhhhhhhhhhhhh.",
    ".heHhhehHhhehHhheh",
    "hhhhhhhhhhhhhhhhhh",
    "hHheHhhHehhHhehHhh",
    "hhhhhhhhhhhhhhhhhh",
    "hehh.Hh..hh.hHhheh",
    "hhH............hhh",
    "hHh............Hhh",
    ".hh............hh.",
    ".H..............H.",
  },
  hairX = 7, hairY = 0,
  face = function(img, dx, b, pose)
    -- tiny pearl earrings + pincushion bracelet on the left wrist
    L.set(img, 7 + dx, 12 + b, "t"); L.set(img, 24 + dx, 12 + b, "t")
    local wy = 25 + b + (pose.handL or 0)
    L.map(img, 7 + dx, wy - 1, { ".ti.", "iDii", "hhhh" })
  end,
  bodyDetail = function(img, dx, b)
    -- flowers on the blouse
    for _, p in ipairs({ { 10, 19 }, { 18, 18 }, { 15, 22 }, { 10, 24 }, { 19, 25 } }) do
      local x, y = p[1] + dx - 1, p[2] + b
      L.set(img, x, y - 1, "D"); L.set(img, x - 1, y, "D"); L.set(img, x + 1, y, "D"); L.set(img, x, y + 1, "D"); L.set(img, x, y, "l")
    end
    -- collar + yellow measuring tape draped round the neck with tick marks
    L.map(img, 12 + dx, 17 + b, { "tt....tt", ".t....t." })
    L.map(img, 11 + dx, 17 + b, {
      ".k......k.",
      ".k......k.",
      ".f.......k",
      ".k.......f",
      ".k.......k",
      ".f.......k",
      ".k.......l",
      ".k........",
      ".f........",
      ".k........",
      ".l........",
    })
  end,
}))

-- 민수 – 홍대 rapper: backwards black snapback, oversized red hoodie, chunky gold chain, white sneakers
build("minsu", with(SKIN, {
  hair = "t", hair2 = "u", hair3 = "v", top = "i", top2 = "h", pants = "x", pants2 = "y", shoes = "t", shoes2 = "u",
  hairFront = {
    "...........zzzzz..",
    "......hhhhhzzzz...",
    "....hhhhhhhhhh....",
    "...hhhhhhhhhhhH...",
    "..hhhhhhhhhhhhHH..",
    "..hhhhhhhhhhhhhH..",
    "..hhhhuxxxxuhhhH..",
    "..xxxxu.zz.uxxxx..",
    "..yy.yzzzzzzy.yy..",
    "..y............y..",
  },
  hairX = 6, hairY = 1,
  body = {
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
    "555555555666",
    "555555555666",
    "666666666666",
  },
  face = function(img, dx, b, pose)
    L.set(img, 23 + dx, 12 + b, "k") -- ear stud
    -- baggy sleeve cuffs
    L.hline(img, 8 + dx, 9 + dx, 24 + b + (pose.handL or 0), "h")
    if not pose.noRightArm then L.hline(img, 22 + dx, 23 + dx, 24 + b + (pose.handR or 0), "a") end
  end,
  bodyDetail = function(img, dx, b)
    -- hood behind the neck, strings, kangaroo pocket
    L.map(img, 10 + dx, 16 + b, { "hhhhhhhhhh", "h.hh..hh.h" })
    L.vline(img, 13 + dx, 18 + b, 21 + b, "t"); L.vline(img, 17 + dx, 18 + b, 21 + b, "t")
    L.map(img, 11 + dx, 24 + b, { ".hhhhhhh.", "h.......h", "h.......h", "hhhhhhhhh" })
    -- chunky gold chain with a pendant
    L.map(img, 11 + dx, 18 + b, { "k........k", "lk......kl", ".kk....kk.", "..kkllkk..", "....kk....", "...kllk...", "....kk...." })
  end,
}))

-- 박 사장 – 용산 repair-shop owner: thinning hair, square glasses, khaki work vest with a screwdriver, rolled sleeves
build("park", with(SKIN_TAN, {
  hair = "y", hair2 = "x", top = "r", top2 = "q", pants = "x", pants2 = "y", shoes = "f",
  hairFront = {
    "..................",
    "..................",
    ".......h..h.......",
    "......h..h..h.....",
    "..................",
    "..h............h..",
    ".hhH...........Hhh",
    ".hhH...........Hhh",
    ".hh.............hh",
    ".hh.............hh",
    ".h...............h",
  },
  face = function(img, dx, b, pose)
    -- forehead shine + wrinkle
    L.set(img, 12 + dx, 6 + b, "t"); L.set(img, 13 + dx, 6 + b, "E")
    L.hline(img, 14 + dx, 17 + dx, 8 + b, "F")
    -- square black glasses
    L.map(img, 10 + dx, 10 + b, { "zzzz...zzzz", "z..zzzzz..z", "z..z...z..z", "zzzz...zzzz" })
    rolledSleeves(img, dx, b, pose, { skin = "d", skin2 = "F" }, "u")
  end,
  bodyDetail = function(img, dx, b)
    -- open khaki vest over the blue shirt, collar, chest pockets, screwdriver
    L.map(img, 9 + dx, 17 + b, {
      "...tt..tt...",
      "dddd.tt.dddd",
      "dddd.r..dddd",
      "eeed.r..eeed",
      "dkdd.r..dkdd",
      "dddd.r..dddd",
      "dddd.r..dddd",
      "eeed.r..eeed",
      "dddd.r..dddd",
      "eeee.r..eeee",
      "eeee.q..eeee",
    })
    -- screwdriver in the left chest pocket, pen in the right
    L.vline(img, 10 + dx, 16 + b, 18 + b, "v"); L.vline(img, 10 + dx, 19 + b, 20 + b, "i")
    L.vline(img, 18 + dx, 18 + b, 19 + b, "k")
  end,
}))

-- 강 이사 – redevelopment executive: glossy side part, sharp grey suit, red tie, stern brows
build("kang", with(SKIN, {
  hair = "y", hair2 = "z", hair3 = "x", top = "v", top2 = "w", pants = "w", pants2 = "x", shoes = "z", shoes2 = "y",
  brow = "z",
  hairFront = {
    "......hhhhhhhh....",
    "....hhhhhhhhhhhh..",
    "..hhhHhxxhhhhhhhh.",
    ".hhhhHhhhxxhhhhhhh",
    ".hhhhHhhhhhxxhhhhh",
    ".hhhhH.hhhhhhhhhhh",
    ".hhhH....hhhhhhhhh",
    ".hhh.........hhhhh",
    ".hh............hhh",
    ".hh.............hh",
  },
  face = function(img, dx, b, pose)
    if pose.eyes == "open" or pose.eyes == "blink" then
      -- stern, heavy straight brows pulled down to the nose
      L.hline(img, 10 + dx, 12 + dx, 9 + b, "z"); L.set(img, 13 + dx, 10 + b, "z")
      L.hline(img, 19 + dx, 21 + dx, 9 + b, "z"); L.set(img, 18 + dx, 10 + b, "z")
    end
    if pose.mouth == "smile" then L.rect(img, 13 + dx, 14 + b, 6, 2, "E"); L.hline(img, 14 + dx, 17 + dx, 15 + b, "f") end
  end,
  bodyDetail = function(img, dx, b)
    -- white shirt V, red tie, lapels, pocket square, gold lapel pin, buttons
    L.map(img, 12 + dx, 17 + b, {
      "wtiitw",
      "wtiitw",
      "wwiiww",
      ".wihw.",
      ".wihw.",
      "..ih..",
      "..ih..",
      "..hh..",
    })
    L.map(img, 10 + dx, 18 + b, { "wv........vw", ".wv......vw.", "..w......w.." })
    L.set(img, 11 + dx, 19 + b, "k")
    L.map(img, 16 + dx, 20 + b, { "tu" })
    L.set(img, 14 + dx, 25 + b, "x"); L.set(img, 14 + dx, 27 + b, "x")
    L.vline(img, 14 + dx, 24 + b, 27 + b, "w")
  end,
}))

-- 약사 – grandma's pharmacist friend: neat short bob, thin glasses, white coat, green name badge
build("yaksa", with(SKIN, {
  hair = "f", hair2 = "g", top = "t", top2 = "u", pants = "w", pants2 = "x", shoes = "f", eye = "y",
  backHair = {
    "", "", "", "", "", "", "", "", "", "",
    ".......hhhhhhhhhhhhhhhhhh.......",
    ".......hhhhhhhhhhhhhhhhhh.......",
    ".......hhh............hhh.......",
    ".......hhh............hhh.......",
    ".......Hhh............hhH.......",
    "........HH............HH........",
  },
  hairFront = {
    "......hhhhhhh.....",
    "....hhhhhhhhhhh...",
    "..hhhHhhhhhhhhhh..",
    ".hhhHhhhhhhhhhhhh.",
    ".hhHhhhhhhhhhhhhh.",
    ".hhhhhhhhhhhhhhhh.",
    ".hhhhhh....hhhhhh.",
    ".hhh..........hhh.",
    ".hh............hh.",
    ".hh............hh.",
    ".hh............hh.",
    ".hh............hh.",
    ".Hh............hH.",
    "..H............H..",
  },
  body = {
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
    "555555555666",
    "556665566666",
  },
  face = function(img, dx, b, pose)
    -- thin rectangular glasses
    L.map(img, 10 + dx, 10 + b, { "BBBB...BBBB", "B..BBBBB..B", "BBBB...BBBB" })
    L.set(img, 9 + dx, 13 + b, "D")
    if pose.eyes ~= "happy" then L.set(img, 9 + dx, 13 + b, "E") end
  end,
  bodyDetail = function(img, dx, b)
    -- teal blouse V, coat lapels, green badge with a cross, pen
    L.map(img, 12 + dx, 17 + b, { "upppu.", ".upu..", "..u..." })
    L.map(img, 11 + dx, 17 + b, { "u......u", ".u....u.", "..u..u..", "...uu..." })
    L.map(img, 16 + dx, 21 + b, { "nnnn", "nmtn", "nnnn" })
    L.vline(img, 12 + dx, 21 + b, 23 + b, "q"); L.set(img, 12 + dx, 20 + b, "x")
    L.hline(img, 11 + dx, 13 + dx, 25 + b, "u"); L.hline(img, 17 + dx, 19 + dx, 25 + b, "u")
  end,
}))

-- 블로거 (boss) – trendy fashion blogger: ash-blonde long hair, big sunglasses on her head,
-- pastel pink outfit, hoop earrings, phone held up for a selfie
do
  local function phone(img, dx, b, pose)
    local hy = 25 + b + (pose.handL or 0)
    L.map(img, 6 + dx, hy - 4, { "zzz", "zsz", "zrz", "zzz" })
  end
  build("blogger", with(SKIN, {
    hair = "c", hair2 = "d", top = "D", top2 = "C", pants = "D", pants2 = "C", shoes = "t", shoes2 = "u", legs = "E", legs2 = "F",
    backHair = {
      "", "", "", "", "", "", "", "", "", "",
      ".......hhhhhhhhhhhhhhhhhh.......",
      "......hhhhhhhhhhhhhhhhhhhh......",
      "......hhh..............hhh......",
      "......hhh..............hhh......",
      "......hhh..............hhh......",
      "......hhh..............hhh......",
      "......hhh..............hhh......",
      "......Hhh..............hhH......",
      "......Hhh..............hhH......",
      "......HHh..............hHH......",
      "......HHh..............hHH......",
      ".......Hh..............hH.......",
      ".......H................H.......",
    },
    hairFront = {
      "......hhhhhhh.....",
      "....hhhhhhhhhhh...",
      "..hhhhhhhhhhhhhhh.",
      ".hCCCCCChhCCCCCCh.",
      ".CzzzzzCCCzzzzzzC.",
      ".CzzszzChCzzszzzC.",
      ".hhhhhhhhhhHhhhhh.",
      ".hhhhHhhhhh..hhhh.",
      ".hhhh.........hhh.",
      ".hh............hh.",
      ".hh............hh.",
      ".hh............hh.",
    },
    skirt = {
      ".7777777777777.",
      "777777777777777",
      "777777777777777",
      "766766676667666",
    },
    face = function(img, dx, b, pose)
      -- gold hoops and glossy lips
      L.map(img, 7 + dx, 12 + b, { "k", ".", "k" }); L.set(img, 6 + dx, 13 + b, "k"); L.set(img, 8 + dx, 13 + b, "k")
      L.map(img, 24 + dx, 12 + b, { "k", ".", "k" }); L.set(img, 23 + dx, 13 + b, "k"); L.set(img, 25 + dx, 13 + b, "k")
      if pose.mouth == "smile" then L.map(img, 13 + dx, 14 + b, { ".A..A.", "..AA.." }) end
      phone(img, dx, b, pose)
    end,
    bodyDetail = function(img, dx, b)
      -- cropped pastel jacket over a white top, pearl necklace, little bow
      L.map(img, 12 + dx, 17 + b, { "tttttt", "ttttt.", ".tttt.", ".tttt.", ".tttt.", ".tttt.", ".tttt.", ".tttt." })
      L.map(img, 12 + dx, 17 + b, { "u....u", ".u..u.", "..uu.." })
      L.map(img, 11 + dx, 18 + b, { "CC....CC", ".C....C." })
      L.set(img, 10 + dx, 22 + b, "t"); L.set(img, 10 + dx, 24 + b, "t")
      L.map(img, 12 + dx, 25 + b, { "C.CC.C", "CCCCCC" })
    end,
  }))
end

-- 매니저 (boss) – K-pop group manager: black cap & clothes, earpiece, red lanyard badge,
-- clipboard, tired eye bags but sharp brows
build("manager", with(SKIN, {
  hair = "z", hair2 = "y", top = "y", top2 = "z", pants = "z", pants2 = "y", shoes = "z", shoes2 = "x", eyeBags = true, brow = "z",
  hairFront = {
    ".....zzzzzzzz.....",
    "...zzzzzzzzzzzz...",
    "..zzwwzzzzzzzzzz..",
    "..zwzzzzzzzzzzzz..",
    "..zzzzzzzzzzzzzz..",
    "..zzzzzttttzzzzz..",
    ".wwxxxxxxxxxxxxww.",
    "zyyyyyyyyyyyyyyyyz",
    "zz..............zz",
    ".hh............hh.",
    ".h..............h.",
  },
  face = function(img, dx, b, pose)
    -- earpiece with coiled wire down to the collar
    L.set(img, 24 + dx, 11 + b, "w"); L.set(img, 24 + dx, 12 + b, "u")
    L.map(img, 23 + dx, 13 + b, { ".u", "u.", ".u", "u." })
    -- clipboard held in the left hand
    local hy = 25 + b + (pose.handL or 0)
    L.map(img, 5 + dx, hy - 5, { ".vv.", "eeee", "ette", "eyte", "etye", "ette", "eeee" })
    L.rect(img, 8 + dx, hy + 1, 2, 2, "E")
  end,
  bodyDetail = function(img, dx, b)
    -- zip jacket with a red lanyard and white badge
    L.vline(img, 15 + dx, 17 + b, 27 + b, "x")
    L.map(img, 11 + dx, 17 + b, { "i......i", ".i....i.", "..i..i..", "...ii...", "..tttt..", "..tqqt..", "..tttt..", "..tvvt..", "..tttt.." })
    L.map(img, 9 + dx, 17 + b, { "..x......x..", "............" })
  end,
}))

-- 상인 (boss) – tough 용산 electronics trader: buzz cut, thick brows, big belly, olive jacket,
-- gold chain on a white tee, fanny pack stuffed with cash
build("trader", with(SKIN_TAN, {
  hair = "y", hair2 = "x", top = "o", top2 = "p", pants = "x", pants2 = "y", shoes = "z", brow = "z",
  hairFront = {
    "..................",
    "..................",
    "..................",
    "......h.h.h.h.....",
    "....h.h.h.h.h.h...",
    "...h.h.h.h.h.h.h..",
    "..h.h.h.h.h.h.h.h.",
    "..H.H.........H.H.",
    "..h.............h.",
  },
  body = {
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
  },
  face = function(img, dx, b, pose)
    -- thick brows (always), scar, stubble
    if pose.eyes ~= "angry" then
      L.rect(img, 10 + dx, 9 + b, 4, 1, "z"); L.rect(img, 18 + dx, 9 + b, 4, 1, "z")
      L.hline(img, 10 + dx, 12 + dx, 8 + b, "z"); L.hline(img, 19 + dx, 21 + dx, 8 + b, "z")
    else
      L.hline(img, 10 + dx, 12 + dx, 8 + b, "z"); L.hline(img, 19 + dx, 21 + dx, 8 + b, "z")
    end
    L.set(img, 21 + dx, 6 + b, "F"); L.set(img, 22 + dx, 7 + b, "F")
  end,
  bodyDetail = function(img, dx, b)
    -- white tee showing between the jacket fronts, round belly, gold chain
    L.map(img, 11 + dx, 17 + b, {
      "o.tttttt.o",
      "o.tttttt.o",
      ".ttttttttp",
      ".ttttttttp",
      "tttttttttt",
      "tttttttttu",
      "tttttttttu",
      ".ttttttuu.",
    })
    L.map(img, 12 + dx, 17 + b, { "k......k", "lk....kl", ".kk..kk.", "..kllk.." })
    -- fanny pack across the belly, banknotes sticking out
    L.map(img, 9 + dx, 24 + b, {
      "z.....mnm...",
      "zzzyyyyyyyzz",
      "..zyyyyyyyz.",
      "..zyyykyyyz.",
      "...zzzzzzz..",
    })
    L.set(img, 15 + dx, 23 + b, "m")
  end,
}))

-- 선장 (final boss) – Jeju ferry captain: white cap with gold anchor badge, grey beard,
-- navy double-breasted jacket with gold buttons and cuff stripes
build("captain", with(SKIN_TAN, {
  hair = "u", hair2 = "v", top = "x", top2 = "y", pants = "y", pants2 = "z", shoes = "z", shoes2 = "y", brow = "v",
  hairFront = {
    "...tttttttttttt...",
    "..tttttttttttttt..",
    ".ttttttttkttttttu.",
    ".uuuuuukkkkkuuuuu.",
    ".zzzzzzzkkkzzzzzz.",
    ".zzyyyyyyyyyyyyzz.",
    "..zz.........zzz..",
    ".uu............uu.",
    ".uu............uu.",
    ".uv............vu.",
    ".uv............vu.",
  },
  hairX = 7, hairY = 1,
  face = function(img, dx, b, pose)
    -- grey beard framing the jaw, moustache over the mouth
    L.map(img, 8 + dx, 12 + b, {
      "uv..............vu",
      "uuv...vvvvvv...vuu",
      ".uuvuuu......uuvuu",
      ".uuuuv.......vuuu.",
      "..uuuu......uuuu..",
      "...uuuuuuuuuuuu...",
      "......uuuuuu......",
    })
    L.map(img, 12 + dx, 14 + b, { "v........v" })
    L.hline(img, 8 + dx, 9 + dx, 24 + b + (pose.handL or 0), "k")
    if not pose.noRightArm then L.hline(img, 22 + dx, 23 + dx, 24 + b + (pose.handR or 0), "k") end
    if pose.mouth == "smile" or pose.mouth == "neutral" or pose.mouth == "angry" then
      L.map(img, 14 + dx, 15 + b, { "uuuu" })
    end
  end,
  bodyDetail = function(img, dx, b)
    -- white shirt + black tie, gold buttons in two rows, epaulettes
    L.map(img, 13 + dx, 17 + b, { "tzzt", ".tz.", "..z." })
    L.map(img, 9 + dx, 17 + b, { "kk........kk", "............" })
    for y = 21, 26, 2 do L.set(img, 12 + dx, y + b, "k"); L.set(img, 18 + dx, y + b, "k") end
    L.vline(img, 15 + dx, 20 + b, 27 + b, "y")
  end,
}))
