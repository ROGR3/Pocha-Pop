-- Food / drink icons 24x24, one frame per icon. Exported as a horizontal
-- sheet public/assets/icons.png + icons.json ({ "names": [...] }).
local L = dofile(app.params.root .. "/art/lib.lua")
local W = 24
local ICONS = {}
local function icon(name, fn) ICONS[#ICONS + 1] = { name = name, fn = fn } end

-- ---------------------------------------------------------------- helpers
local OUT = "g" -- warm dark outline

local function steam(img, xs, y0)
  for _, x in ipairs(xs) do
    L.map(img, x, y0, { ".t", "t.", "t.", ".u", ".u", "u." })
  end
end

-- White ceramic bowl. rim bbox x0..x1, rim top y, depth d.
local function bowl(img, x0, x1, y, d, cols)
  cols = cols or { "t", "u", "v", "w" }
  local h = 5
  -- body: lower half ellipse
  L.ebox(img, x0, y - d + 2, x1, y + d + 2, function(nx, ny)
    if nx < -0.55 then return cols[1] elseif nx > 0.45 then return cols[3] end
    return cols[2]
  end, { y0 = y + 2 })
  -- foot
  local cx = math.floor((x0 + x1) / 2)
  L.hline(img, cx - 3, cx + 4, y + d + 2, cols[3])
  -- rim ring
  L.ebox(img, x0, y, x1, y + h, function(nx, ny) return ny < 0 and cols[1] or cols[2] end)
end

-- Contents ellipse inside a bowl rim.
local function contents(img, x0, x1, y, fn)
  L.ebox(img, x0 + 1, y + 1, x1 - 1, y + 4, fn)
end

local function plate(img, x0, x1, y, cols)
  cols = cols or { "t", "u", "v" }
  L.ebox(img, x0, y, x1, y + 5, function(nx, ny)
    if ny > 0.55 then return cols[3] end
    if nx * nx + ny * ny < 0.45 then return cols[2] end
    return cols[1]
  end)
end

-- Earthenware pot (ttukbaegi) used for stews.
local function ttuk(img, x0, x1, y, broth)
  L.ebox(img, x0, y - 4, x1, y + 12, function(nx, ny)
    if nx < -0.5 then return "e" elseif nx > 0.45 then return "g" end
    return "f"
  end, { y0 = y + 2, y1 = y + 9 })
  L.hline(img, x0 + 3, x1 - 3, y + 10, "g")
  L.ebox(img, x0, y, x1, y + 5, function(nx, ny) return ny < 0 and "e" or "f" end)
  L.ebox(img, x0 + 1, y + 1, x1 - 1, y + 4, broth)
end

-- ---------------------------------------------------------------- icons
icon("ramyeon", function(img)
  -- yellow aluminium pot with handles
  L.ebox(img, 3, 6, 20, 20, function(nx) if nx < -0.6 then return "l" elseif nx > 0.5 then return "j" end return "k" end, { y0 = 11, y1 = 19 })
  L.rect(img, 3, 11, 18, 5, "k"); L.rect(img, 3, 11, 2, 5, "l"); L.rect(img, 18, 11, 3, 5, "j")
  L.hline(img, 5, 18, 20, "b")
  L.map(img, 0, 10, { "ff....................ff", "f......................f", "ff....................ff" })
  L.ebox(img, 2, 7, 21, 13, function(nx, ny) return ny < 0 and "l" or "k" end)
  L.ebox(img, 3, 8, 20, 12, function(nx, ny) return ny < -0.2 and "a" or "j" end)
  L.map(img, 4, 8, {
    "...l.ll..ll..l..",
    "..l.l..ll..lc.l.",
    ".l.cl.l..ttkt.l.",
    "..l..l.l.tkkt.lm",
    "...ll.l..lttl.m.",
  })
  steam(img, { 7, 15 }, 0)
end)

icon("uyu", function(img)
  -- milk carton
  L.map(img, 5, 1, {
    "....ccuu....",
    "...cttuuu...",
    "..ctttuuuv..",
    ".cttttuuuuv.",
    "ctttttuuuuvv",
    "tttttttuuuuv",
    "rrrrrrrqqqqq",
    "ttttttrqqqqq",
    "tqqqtttruuuu",
    "tqtqtttruuuv",
    "tqqqtttruuuv",
    "ttttttturuuv",
    "trrrrttruuuv",
    "ttttttturuuv",
    "tttttttruuuv",
    "tttttttruuuv",
    "trrrrrrrqqqq",
    "ttttttttuuuv",
    "tttttttuuuvv",
    "uuuuuuuvvvvv",
  })
end)

icon("cha", function(img)
  -- green tea cup on saucer
  plate(img, 2, 21, 16, { "u", "t", "v" })
  L.ebox(img, 5, 4, 18, 22, function(nx) if nx < -0.5 then return "t" elseif nx > 0.45 then return "v" end return "u" end, { y0 = 11, y1 = 18 })
  L.map(img, 18, 11, { "uvv.", "...v", "...v", "..v.", "vv.." })
  L.ebox(img, 5, 8, 18, 13, function(nx, ny) return ny < 0 and "t" or "u" end)
  L.ebox(img, 6, 9, 17, 12, function(nx, ny) return (nx < -0.3 and ny < 0) and "m" or "n" end)
  steam(img, { 8, 13 }, 1)
end)

icon("mul", function(img)
  -- glass of water
  L.map(img, 5, 3, {
    "uuuuuuuuuuuuu",
    "u...........u",
    "u.t.........u",
    "ussssssssssru",
    "usttsssssssru",
    "ustssssssssru",
    "ustssssssssru",
    "ustssssssssru",
    ".ustssssssru.",
    ".ustssssssru.",
    ".ustsssssrru.",
    ".ustsssssrru.",
    ".ussssssrrru.",
    "..usssssrru..",
    "..usssrrrru..",
    "..urrrrrrru..",
    "..uuuuuuuuu..",
    "...vvvvvvv...",
  })
end)

icon("dubu", function(img)
  -- tofu block on a small plate with soy drop
  plate(img, 1, 22, 15)
  L.map(img, 4, 6, {
    "..tttttttttttt..",
    ".tccccccccccccv.",
    "tcccccccccccccvv",
    "ttttttttttttttdv",
    "tcccccccccccccdv",
    "tcccccccccccccdv",
    "tcccccccccccccdv",
    "tcccccccccccccdd",
    "dcccccccccccccdd",
    ".dddddddddddddd.",
  })
  L.map(img, 7, 8, { "nn..", ".mn." })
end)

icon("mandu", function(img)
  plate(img, 1, 22, 15, { "t", "u", "v" })
  local function dumpling(x, y)
    L.map(img, x, y, {
      "...tcdc...",
      "..tcdcdc..",
      ".tccdcdcd.",
      "tccccccdde",
      "cccccccdde",
      ".eeeeeeee.",
    })
  end
  dumpling(1, 10); dumpling(13, 10); dumpling(7, 5)
end)

icon("gimbap", function(img)
  plate(img, 1, 22, 15)
  local function slice(x, y)
    L.map(img, x, y, {
      "..zzzz..",
      ".zttttz.",
      "zttlmttz",
      "ztjitfyz",
      "ztmlkttz",
      ".zttttz.",
      "..zzzz..",
    })
  end
  slice(1, 10); slice(8, 11); slice(15, 10); slice(4, 4); slice(12, 4)
end)

icon("tteokbokki", function(img)
  plate(img, 1, 22, 14, { "t", "u", "v" })
  L.ebox(img, 3, 13, 20, 19, function(nx, ny) return ny < -0.2 and "a" or "h" end)
  local cakes = { { 4, 12, 0 }, { 11, 12, 0 }, { 6, 15, 0 }, { 13, 15, 0 }, { 7, 9, 1 }, { 14, 9, 1 } }
  for _, p in ipairs(cakes) do
    L.map(img, p[1], p[2], { ".iiiii.", "iDDiiih", "iiiiiih", ".hhhhh." })
  end
  -- fish cake triangle + egg + green onion
  L.map(img, 2, 9, { "kk...", "kdk..", "kddk.", "kkkkk" })
  L.map(img, 17, 12, { ".tt.", "tkkt", "tkkt", ".tu." })
  L.map(img, 10, 7, { "m.n", ".m." })
  L.map(img, 18, 8, { "mn" })
end)

icon("jjajangmyeon", function(img)
  bowl(img, 1, 22, 9, 9)
  contents(img, 1, 22, 9, function(nx, ny) return "l" end)
  L.map(img, 3, 10, { "..l.k.l.k.l.k.l.k.", ".k.l.k.l.k.l.k.l.k" })
  L.ebox(img, 6, 9, 17, 14, function(nx, ny) if nx < -0.3 and ny < -0.2 then return "x" end return ny > 0.3 and "z" or "y" end)
  L.map(img, 8, 10, { ".w..f.", "f..w..", "..f..w" })
  L.map(img, 9, 7, { "mmmo..", "..mmmo", ".mmo.." })
  L.map(img, 5, 6, { "t", ".u" })
end)

icon("kimchijjigae", function(img)
  ttuk(img, 1, 22, 8, function(nx, ny) return ny < -0.2 and "j" or "i" end)
  L.map(img, 4, 9, { "..cc..hh...cc.", ".ccv.hih..ccv.", "....hih.m.....", ".hh....mn.hih.", "hih.cc....hh.." })
  steam(img, { 6, 11, 16 }, 1)
end)

icon("bibimbap", function(img)
  ttuk(img, 1, 22, 9, "c")
  L.map(img, 3, 10, {
    "..mmmjjjjcccc...",
    ".mnmmjjjjcucccff",
    "mmnmmttttttcfeff",
    "nnmnttkkkkttffff",
    ".iiittkkkkttnmm.",
    "..iiiittttmnmm..",
  })
end)

icon("danmuji", function(img)
  plate(img, 1, 22, 13)
  local function moon(x, y)
    L.map(img, x, y, { ".llllll.", "lkkkkkkl", "llllllll", ".kkkkkk." })
  end
  moon(2, 12); moon(11, 13); moon(6, 8); moon(14, 8)
end)

icon("tteok", function(img)
  plate(img, 1, 22, 14)
  local function song(x, y, a, b)
    L.map(img, x, y, { "..aaaa..", ".attaaab", "aataaaab", "aaaaaabb", ".bbbbbb." }, { sub = { a = a, b = b } })
  end
  song(2, 11, "D", "C"); song(9, 12, "m", "n"); song(15, 11, "c", "d"); song(5, 6, "c", "d"); song(12, 6, "D", "C")
end)

icon("naengmyeon", function(img)
  bowl(img, 1, 22, 9, 9, { "t", "u", "v" })
  contents(img, 1, 22, 9, function(nx, ny) return ny < -0.3 and "d" or "c" end)
  L.map(img, 3, 10, { ".f.e.f.e.f.e.f.e.", "e.f.e.f.e.f.e.f.e", ".e.f.e.f.e.f.e.f." })
  L.map(img, 8, 6, { ".tttt.", "tkkkkt", "tkkkkt", ".tttt." })
  L.map(img, 4, 8, { "mm.", "mlm", ".mm" })
  L.map(img, 16, 8, { "ss", "st" })
  L.map(img, 14, 6, { "nm", ".m" })
end)

icon("galbi", function(img)
  plate(img, 1, 22, 14)
  local function rib(x, y)
    L.map(img, x, y, {
      "cc.........",
      "ctbbbbbbbb.",
      ".cebgbbgbbf",
      ".ceffeffeff",
      "..ffgffgff.",
    })
  end
  rib(2, 11); rib(10, 8); rib(6, 4)
  L.map(img, 16, 13, { ".mm", "mnm", "mn." })
  L.map(img, 9, 9, { "c" })
end)

icon("doenjangjjigae", function(img)
  ttuk(img, 1, 22, 8, function(nx, ny) return ny < -0.2 and "d" or "b" end)
  L.map(img, 4, 9, { "..cc....ll...", ".ccv...lmml..", ".......lmml.e", "..m.cc..ll.ee", ".mn.ccv....f." })
  steam(img, { 6, 11, 16 }, 1)
end)

icon("galbitang", function(img)
  bowl(img, 1, 22, 9, 9)
  contents(img, 1, 22, 9, function(nx, ny) return ny < -0.3 and "c" or "d" end)
  L.map(img, 5, 9, { "cc.......m.", "ctfffff.mn.", ".cfeeff.....", "..ffff..u.u.", "......u.u.u." })
  steam(img, { 7, 14 }, 1)
end)

icon("kimchi", function(img)
  plate(img, 1, 22, 14)
  L.map(img, 3, 4, {
    "......ii.........",
    "....iijii..ii....",
    "...ijjiihiijji...",
    "..ijiihhiijiiih..",
    "..ccijiiiihiici..",
    ".tcciiihiijicct..",
    ".tcccciiiicccct..",
    "..tccccccccccc...",
    "...ihhccccchh....",
    "....hh...hh......",
  })
  L.map(img, 16, 12, { "mm", "nm" })
end)

icon("japchae", function(img)
  plate(img, 1, 22, 13)
  L.ebox(img, 3, 9, 20, 17, function(nx, ny) return ny < -0.3 and "d" or "e" end)
  L.map(img, 4, 9, {
    "..c.d.c.d.c.d.c.",
    ".d.c.j.c.d.m.d.c",
    "c.d.jj.d.cmm.c.d",
    ".c.f.c.d.c.d.f.c",
    "d.ff.d.c.j.c.ff.",
    ".c.d.m.d.jj.d.c.",
    "..d.mm.c.d.c.d..",
  })
  L.map(img, 8, 8, { "c.t" })
end)

icon("bap", function(img)
  -- stainless rice bowl with a dome of rice
  L.ebox(img, 3, 3, 20, 21, function(nx) if nx < -0.55 then return "t" elseif nx > 0.45 then return "w" end return "v" end, { y0 = 13, y1 = 20 })
  L.hline(img, 8, 15, 21, "w")
  L.ebox(img, 3, 10, 20, 15, function(nx, ny) return ny < 0 and "u" or "v" end)
  L.ebox(img, 4, 4, 19, 14, function(nx, ny) if nx < -0.4 and ny < -0.3 then return "t" end return ny > 0.5 and "u" or "c" end, { y1 = 12 })
  L.map(img, 6, 6, { ".t.t..", "t...t.", "..t..t", ".u..u." }, {})
end)

icon("jjigae", function(img)
  -- black two-handled pot (budae-style) with mixed stew
  L.map(img, 0, 11, { "yy....................yy", "y......................y", "yy....................yy" })
  L.ebox(img, 2, 4, 21, 21, function(nx) if nx < -0.6 then return "w" elseif nx > 0.5 then return "y" end return "x" end, { y0 = 12, y1 = 20 })
  L.ebox(img, 2, 8, 21, 14, function(nx, ny) return ny < 0 and "w" or "x" end)
  L.ebox(img, 3, 9, 20, 13, function(nx, ny) return ny < -0.2 and "j" or "a" end)
  L.map(img, 4, 8, { "..hD....ll...", ".hDDh..lkkl..", "..hh.c..ll.m.", ".cc..ct...mn.", ".ct.....ii..." })
  steam(img, { 6, 12, 17 }, 1)
end)

icon("gogi", function(img)
  -- samgyeopsal slices on a wooden board
  L.map(img, 1, 15, {
    "eeeeeeeeeeeeeeeeeeeeee",
    "bbbbbbbbbbbbbbbbbbbbbe",
    "ebbbbbbbbbbbbbbbbbbbbf",
    ".ffffffffffffffffffff.",
  })
  local function slice(x, y)
    L.map(img, x, y, {
      ".tcccccccccc.",
      "DDDDDDDDDDDDi",
      "tccctcccccccD",
      "DDiDDDDiDDDDi",
      "iiiiiiiiiiiih",
    })
  end
  slice(2, 11); slice(8, 6); slice(4, 2)
  L.map(img, 16, 11, { "mmn", "mn.", ".n." })
  L.map(img, 18, 3, { "c", "cd" })
end)

icon("ppang", function(img)
  L.map(img, 2, 5, {
    "......bbbbbbbbb.....",
    "....bbkkkkkkkkbbb...",
    "..bbkllkkkkkkkkkbb..",
    ".bkllkkbkkkbkkkkkbb.",
    "bkllkkbkkkbkkkbkkkbe",
    "bkkkkbkkkbkkkbkkkkbe",
    "bkkkkkkkkkkkkkkkkbbe",
    "ebkkkkkkkkkkkkkkbbee",
    "ebbbbbbbbbbbbbbbbeee",
    "eeccccccbeeeeeeeeeee",
    "ecctcccceeeeeeeeeeef",
    "ecccccccfeeeeeeeeeff",
    ".eeeeeeeeffffffffff.",
  })
end)

icon("gwaja", function(img)
  -- chips bag
  L.map(img, 3, 1, {
    "uvuvuvuvuvuvuvuvu",
    "iiiiiiiiiiiiiiiih",
    ".iDDiiiiiiiiiiih.",
    ".iDiiikkkkkiiiih.",
    ".iiiikllllkkiiih.",
    ".iiiklltllkkkiih.",
    ".iiiklllllkkkiih.",
    ".iiikkllkkkkkiih.",
    ".iiiikkkkkkkiiih.",
    ".iiiiiiiiiiiiiih.",
    ".itttiiitttiiiih.",
    ".iiiiiiiiiiiiiih.",
    ".iiiiiiiiiiiiiih.",
    ".iiiiiiiiiiiiihh.",
    "uvuvuvuvuvuvuvuvu",
  })
  L.map(img, 2, 17, { ".kkk.....kk..", "kllkk...kllk.", "kkkb..kkkkkb.", "...kkklk.....", "....kkkb....." })
end)

icon("satang", function(img)
  -- wrapped candy
  L.map(img, 1, 6, {
    "CC................CC..",
    "DCC..............CDC..",
    "DDCC...iiiiii...CDDC..",
    ".DDCC.itiiDDDi.CDDC...",
    ".DDDCittiDDDDDiCDDD...",
    "..DDCiiDDDDDiiiCDD....",
    "..DDCiDDDDDiiiiCDD....",
    ".DDDCiDDDiiiiihCDDD...",
    ".DDCC.iiiiiihh.CDDC...",
    "DDCC...hhhhhh...CDDC..",
    "DCC..............CDC..",
    "CC................CC..",
  })
end)

icon("dijeoteu", function(img)
  -- caramel pudding with cream & cherry
  plate(img, 1, 22, 16)
  L.map(img, 5, 2, {
    "......ii......",
    ".....iDi......",
    "......hn......",
    "....tttttt....",
    "...tttttttu...",
    "..ffbfbbfbbf..",
    "..fbbbbbbbbf..",
    ".kkklkkkkkkkb.",
    ".kllkkkkkkkkb.",
    "kllkkkkkkkkkbb",
    "klkkkkkkkkkkbb",
    "kkkkkkkkkkkbbb",
    "bbbbbbbbbbbbbb",
    ".bbbbbbbbbbbb.",
  })
end)

icon("gansik", function(img)
  -- bungeoppang (fish-shaped bread)
  L.map(img, 1, 5, {
    "......bbbbbbbb.........",
    "....bbkkkkkkkkbb...bb..",
    "...bkkklkkkkkkkkbbbkkb.",
    "..bkklgllkbkbkbkkkkkkb.",
    ".bkkllllkkkkkkkkkbkkbb.",
    "bkklkllkkbkbkbkbkkkkkb.",
    "bkkkkkkkkkkkkkkkkkbkkb.",
    "bkkbbkkkbkbkbkbkkkkkkbb",
    ".bkkkkkkkkkkkkkkkbbkkkb",
    "..bkkkkkkkkkkkkkbb.bbbb",
    "...bbkkkkkkkkbbb.......",
    ".....bbbbbbbbb.........",
  })
  steam(img, { 9 }, 0)
end)

icon("eumsik", function(img)
  -- dosirak lunch box with compartments
  L.map(img, 1, 5, {
    "qqqqqqqqqqqqqqqqqqqqqq",
    "qrrrrrrrrrrrrrrrrrrrrq",
    "qrttttttttrkkkkkkkkkrq",
    "qrtcttcttcrkllklklkkrq",
    "qrttctttctrkkkkkkkkkrq",
    "qrtcttttttrrrrrrrrrrrq",
    "qrttttcttcrimmiDiinmrq",
    "qrctttttttriimmDDiimrq",
    "qrttcttcttrmmniDDmmnrq",
    "qrrrrrrrrrrrrrrrrrrrrq",
    "qqqqqqqqqqqqqqqqqqqqqq",
    ".yyyyyyyyyyyyyyyyyyyy.",
  })
  L.map(img, 4, 3, { "ll.", "kl." })
  L.map(img, 3, 1, { "..ff..................", "....ffff..............", "........ffffffff......" })
end)

icon("gwail", function(img)
  -- fruit basket
  L.map(img, 4, 3, { "...nm", "..nmm", ".nm.." })
  L.ebox(img, 2, 3, 10, 11, L.shade3("D", "i", "h"))
  L.ebox(img, 13, 5, 19, 11, L.shade3("k", "j", "b"))
  L.map(img, 9, 4, { "..B.", ".BCB", "BCBC", ".BCB" })
  L.map(img, 1, 10, {
    "ffeeeeeeeeeeeeeeeeeeff",
    ".fbebebebebebebebebef.",
    ".febebebebebebebebeff.",
    "..fbebebebebebebebef..",
    "..febebebebebebebeff..",
    "...fbebebebebebebef...",
    "...ffffffffffffffff...",
  })
  L.map(img, 5, 9, { "lllllllll", ".kkkkkkk." })
end)

icon("podo", function(img)
  L.map(img, 10, 1, { ".f.", "f.mn", ".mnmn", "..mnm" })
  local pts = { { 6, 5 }, { 11, 5 }, { 16, 5 }, { 4, 9 }, { 9, 9 }, { 14, 9 }, { 7, 13 }, { 12, 13 }, { 10, 17 } }
  for _, p in ipairs(pts) do
    L.ebox(img, p[1] - 2, p[2] - 2, p[1] + 2, p[2] + 2, function(nx, ny) if nx < -0.2 and ny < -0.2 then return "C" end return (nx + ny > 0.6) and "y" or "B" end)
    L.set(img, p[1] - 1, p[2] - 1, "t")
  end
end)

icon("banana", function(img)
  local function one(x, y)
    L.map(img, x, y, {
      "..............kke",
      ".............kllk",
      "...........kkllkk",
      ".........kkllllkb",
      "......kkkllllkkb.",
      "...kkklllllkkkbb.",
      ".kkllllllkkkkbb..",
      "fklllkkkkkbbbb...",
      ".kkkkkbbbbbb.....",
      "..bbbbbb.........",
    })
  end
  one(2, 3); one(3, 7); one(4, 11)
  L.map(img, 18, 1, { ".ff", "fne", "fe." })
end)

icon("sagwa", function(img)
  L.map(img, 11, 1, { ".f..", "f.nm", "f.mm.", ".." })
  L.ebox(img, 3, 4, 20, 21, function(nx, ny)
    if (nx + 0.45) ^ 2 + (ny + 0.4) ^ 2 < 0.06 then return "t" end
    local v = nx * 0.7 + ny * 0.7
    if v < -0.5 then return "D" elseif v > 0.55 then return "h" end
    return "i"
  end)
  L.erase(img, 11, 4); L.erase(img, 12, 4); L.erase(img, 10, 4); L.erase(img, 13, 4)
  L.set(img, 11, 5, "h"); L.set(img, 12, 5, "h")
end)

icon("ttalgi", function(img)
  L.map(img, 2, 2, {
    "....mm.nn.mm....",
    "...nmmmnnmmmn...",
    ".iinnmnmmnmnnii.",
    "iDDiinnnnnniiiih",
    "iDtDiiiliiiiliih",
    "iDDiliiiiliiiiih",
    ".iiiiiiliiiiliih",
    ".iliiiiiiiliiih.",
    "..iiiliiiiiiihh.",
    "..iiiiiiliiiih..",
    "...iliiiiiliih..",
    "....iiiiiiihh...",
    ".....iiliihh....",
    "......iihh......",
    ".......hh.......",
  })
  L.map(img, 2, 2, {}, {})
end)

icon("gyul", function(img)
  L.map(img, 10, 2, { "..mm.", ".mnmm", "nm..." })
  L.ebox(img, 3, 5, 20, 20, function(nx, ny)
    local v = nx * 0.7 + ny * 0.7
    if v < -0.55 then return "k" elseif v > 0.5 then return "b" end
    return "j"
  end)
  L.map(img, 6, 8, { "t.", ".", "..k" })
  L.set(img, 11, 5, "f"); L.set(img, 12, 5, "f")
  L.map(img, 14, 14, { ".j.", "...", "b.." })
end)

icon("mellon", function(img)
  L.ebox(img, 3, 3, 20, 20, function(nx, ny, x, y)
    local v = nx * 0.7 + ny * 0.7
    local base = v < -0.5 and "m" or (v > 0.5 and "o" or "n")
    if (x + y) % 5 == 0 or (x - y) % 5 == 0 then return v < -0.4 and "c" or (v > 0.5 and "n" or "m") end
    return base
  end)
  L.map(img, 6, 6, { "tt", "t." })
  L.map(img, 10, 0, { "..f.", ".ff.", "nmf." })
end)

icon("chokollit", function(img)
  L.map(img, 3, 2, {
    ".ffffffffffffff.",
    "fbbeebbeebbeebef",
    "fbeefbeefbeefeef",
    "feeffeeffeeffeff",
    "fbbeebbeebbeebef",
    "fbeefbeefbeefeef",
    "feeffeeffeeffeff",
    "tuutuuvuutuuvuuv",
    "iiiiiiiiiiiiiiih",
    "iDiiiiiiiiiiiiih",
    "iDiitttiiiiiiiih",
    "iDitiiitttiiiiih",
    "iDiiiiiiiittiiih",
    "iDiiiiiiiiiiiiih",
    "iDiilllllllliiih",
    "iDiiiiiiiiiiiiih",
    "iiiiiiiiiiiiiihh",
    "hhhhhhhhhhhhhhh.",
  })
end)

icon("aiseukeurim", function(img)
  L.ebox(img, 5, 1, 18, 12, function(nx, ny) if nx < -0.3 and ny < -0.3 then return "t" end return ny > 0.4 and "D" or "D" end)
  L.ebox(img, 5, 1, 18, 12, function(nx, ny) if nx < -0.35 and ny < -0.3 then return "t" end if nx + ny > 0.7 then return "C" end return "D" end)
  L.map(img, 5, 10, { ".DD.DD.DDDD..", "..D..D..DD..." })
  L.map(img, 9, 3, { "i.", ".", "..m" })
  L.map(img, 6, 11, {
    "kkkkkkkkkkkk",
    ".klkbkbkbkb.",
    ".kkbkbkbkbk.",
    "..lkbkbkbb..",
    "..kbkbkbkb..",
    "...kbkbkb...",
    "...kkbkbb...",
    "....kbkb....",
    "....kkbb....",
    ".....kb.....",
    ".....bb.....",
  })
end)

icon("keikeu", function(img)
  -- strawberry shortcake slice
  L.map(img, 2, 2, {
    "...........ii.......",
    "..........iDii......",
    "......ttttihht......",
    "....tttttttttttt....",
    "..tttttttttttttttu..",
    "ttttttttttttttttttuu",
    "tttttttttttttttttuuu",
    "kkkkkkkkkkkkkkkkkuuu",
    "kllkkkkkkkkkkkkkkuuv",
    "kkkkkkkkkkkkkkkkkuuv",
    "tttiitttiitttiittuvv",
    "tttiitttiitttiittvvv",
    "kkkkkkkkkkkkkkkkkvvv",
    "kllkkkkkkkkkkkkkkvvv",
    "kkkkkkkkkkkkkkkkkvv.",
    "bbbbbbbbbbbbbbbbbv..",
  })
  plate(img, 0, 23, 18, { "t", "u", "v" })
  -- redraw cake base above plate edge
  L.map(img, 2, 16, { "kkkkkkkkkkkkkkkkkvv.", "bbbbbbbbbbbbbbbbbv.." })
end)

icon("saendeuwichi", function(img)
  L.map(img, 1, 4, {
    "..................dd..",
    "...............ddccd..",
    "............ddcccccd..",
    ".........ddcccccccccd.",
    "......ddccccccccccccd.",
    "...ddcccccccccccccccd.",
    ".dcccccccccccccccccccd",
    "mmmmnmmmmnmmmmnmmmmmmm",
    "ccccccccccccccccccccc.",
    "iiiiihiiiiiihiiiiiiii.",
    "llklllllklllllklllll..",
    "mmmmnmmmmmnmmmmmnmm...",
    "cccccccccccccccccc....",
    "dddddddddddddddd......",
  })
end)

icon("bingsu", function(img)
  bowl(img, 1, 22, 12, 8, { "s", "r", "q" })
  L.ebox(img, 3, 3, 20, 17, function(nx, ny, x, y)
    if nx < -0.4 and ny < -0.3 then return "t" end
    if (x * 7 + y * 3) % 9 == 0 then return "u" end
    return nx > 0.5 and "u" or "t"
  end, { y1 = 14 })
  L.ebox(img, 7, 3, 16, 9, function(nx, ny) if nx < -0.3 and ny < -0.3 then return "a" end return ny > 0.3 and "f" or "h" end)
  L.map(img, 8, 4, { ".f..f", "..f..", "f..f." })
  L.map(img, 3, 9, { ".tt.", "tccu" })
  L.map(img, 16, 9, { ".DD.", "DtDi" })
  L.map(img, 12, 1, { "nm" })
end)

icon("popkon", function(img)
  L.map(img, 4, 0, {
    "...t.tt..ttt.t...",
    "..tttctttctttct..",
    ".ttctttlttctltttt",
    "tcttlttcttttctlct",
    ".tcttcttltctttct.",
  })
  L.map(img, 4, 5, {
    "iitttiitttiitttii",
    "iitttiitttiitttih",
    ".itttiitttiitttih",
    ".itttiitttiitttih",
    ".itttiitttiittuh.",
    "..itttiitttiituh.",
    "..itttiitttiituh.",
    "..itttiitttiituh.",
    "...ittiitttiiuh..",
    "...ittiitttiiuh..",
    "...ittiitttiiuh..",
    "...ittiitttiiuh..",
    "....hhhhhhhhhh...",
  })
  L.map(img, 7, 9, { "..kkk..", ".klllk.", ".klllk.", "..kkk.." })
end)

icon("chikin", function(img)
  -- fried chicken in a paper box
  local function leg(x, y)
    L.map(img, x, y, {
      "..bkkkkb...",
      ".bklkkbkb..",
      "bkllkbkkkb.",
      "bkkbkkkbkb.",
      "bkkkkbkkkb.",
      ".bkbkkkkbb.",
      "..bbkkbbtt.",
      "....bb.ttct",
      ".......tcc.",
    })
  end
  leg(2, 3); leg(10, 2); leg(6, 7)
  L.map(img, 1, 13, {
    "iiiiiiiiiiiiiiiiiiiiii",
    "ittttttttttttttttttttih",
    ".iiiiiiiiiiiiiiiiiiih.",
    ".itttttttttttttttttth.",
    ".ittiiittiiittiiittth.",
    ".itttttttttttttttttth.",
    ".iiiiiiiiiiiiiiiiiiih.",
    ".hhhhhhhhhhhhhhhhhhhh.",
  })
end)

icon("paseuta", function(img)
  plate(img, 1, 22, 13)
  L.ebox(img, 4, 9, 19, 17, "k")
  L.map(img, 4, 9, {
    "....l.k.l.k.l..",
    "..k.l.ll.l.k.l.",
    ".l.kll.k.ll.k.l",
    "l.k..l.k.l.lk.l",
    ".l.k.ll.k..l.k.",
    "..l.k..l.lk.l..",
    "....l.kl.l.k...",
  })
  L.ebox(img, 8, 9, 15, 14, function(nx, ny) return (nx < -0.3 and ny < -0.2) and "i" or (ny > 0.3 and "h" or "a") end)
  L.map(img, 9, 10, { "m.t", ".mn" })
  L.map(img, 17, 1, { "u.u.u", "u.u.u", "uuuuu", ".uuu.", "..u..", "..u..", "..v..", "..v..", "..v.." })
end)

icon("maekju", function(img)
  L.map(img, 3, 1, {
    "...ttt.tttt.....",
    "..ttttttttttt...",
    ".tttttttttttttt.",
    ".ttuttttuttttu..",
    ".kkkuttkkutkkk..",
    ".klkkkkkkkkkkkuuu.",
    ".klkkkkkkkkkkku..u",
    ".klkkktkkkkkkku..u",
    ".klkkkkkkkkkkku..u",
    ".klkkkkkkkktkku..u",
    ".klkkkkkkkkkkku..u",
    ".klkktkkkkkkkku..u",
    ".klkkkkkkkkkkkuuu.",
    ".klkkkkkkkkkkku...",
    ".kllkkkkkkkkbku...",
    ".kkkkkkkkkkkbbu...",
    ".uuuuuuuuuuuuuu...",
    ".tuuuuuuuuuuuvu...",
    "..vvvvvvvvvvvv....",
  })
end)

icon("eumnyosu", function(img)
  -- small soft-drink bottle
  L.map(img, 7, 0, {
    "..mmmmm...",
    "..nnnnn...",
    "...ruq....",
    "...rsq....",
    "..rssrq...",
    ".rsssrrq..",
    "rssksrrrq.",
    "rsstssrrq.",
    "kkkkkkkkkj",
    "kllllllkkj",
    "klitiiilkj",
    "kliiiiilkj",
    "kllllllkkj",
    "kkkkkkkkkj",
    "rsstsrrrq.",
    "rsssssrrq.",
    "rsstsrrrq.",
    "rssssrrrq.",
    "rsssrrrrq.",
    ".rrrrrrq..",
    "..qqqqq...",
  })
end)

icon("kolla", function(img)
  L.map(img, 6, 1, {
    "..vuuuuuv...",
    ".uttttuuuv..",
    "uvvvvvvvvvv.",
    "iiiiiiiiiih.",
    "iDiiiiiiiih.",
    "iDiiiiiiiih.",
    "iDitttiiiih.",
    "iDtiiittiih.",
    "iDiiiiiitth.",
    "iDiiiiiiiih.",
    "iDitttiiiih.",
    "iDtiiittiih.",
    "iDiiiiiitth.",
    "iDiiiiiiiih.",
    "iDiiiiiiiih.",
    "iiiiiiiiiih.",
    "hhhhhhhhhhh.",
    "uvvvvvvvvvv.",
    ".uuuuuuuuv..",
  })
end)

icon("juseu", function(img)
  L.map(img, 13, 0, { "....DD", "...DD.", "..DD..", ".DD...", ".D...." })
  L.map(img, 3, 4, {
    "......jjkkj.....",
    "....jkklllkkj...",
    "uuuujkllcllkjuuu",
    "u...jkllllllkj.u",
    "ukkkkjkkkkkkjkku",
    "ukllkkjjjjjjkkju",
    "ukltkkkkkkkkkkju",
    "ukltkkkkkkkkkkju",
    ".uklkkkkkkkkkju.",
    ".ukltkkkkkkkkju.",
    ".uklkkkkkkkkjju.",
    ".ukkkkkkkkkkjju.",
    "..ukkkkkkkkjju..",
    "..ukkkkkkkjjju..",
    "..ujjjjjjjjjju..",
    "..uuuuuuuuuuuu..",
    "...vvvvvvvvvv...",
  })
end)

icon("beobeulti", function(img)
  L.map(img, 12, 0, { ".DD", ".DD", "DD.", "DD." })
  L.map(img, 4, 3, {
    ".....tttttt.....",
    "...ttuuuuuuuu...",
    "..tuuuuuuuuuuv..",
    "uuuuuuuuuuuuuuuv",
    "vvvvvvvvvvvvvvvv",
    ".tdddddddddddde.",
    ".tcddddddddddde.",
    ".tcdddddddddde..",
    "..tdddddddddde..",
    "..tcddddddddde..",
    "..tcddddddddde..",
    "..tddddddddde...",
    "..tzzdzzdzzde...",
    "...zxzzxzzxe....",
    "...zzzzzzzze....",
    "...txzzxzzxe....",
    "...tzzzzzzze....",
    "....uuuuuuu.....",
  })
end)

icon("keopi", function(img)
  -- iced americano
  L.map(img, 13, 0, { "..ll", ".ll.", ".l..", "ll..", "l..." })
  L.map(img, 4, 4, {
    "uuuuuuuuuuuuuuuu",
    "u..............u",
    "utsstfsstffsffbu",
    "ufsstffsffssfffu",
    "ufttfffffssffffu",
    ".ufffffffffffeu.",
    ".utfffffffffeeu.",
    ".utffffffffffeu.",
    ".utfffffffffeeu.",
    ".utffffffffffeu.",
    "..utffffffffeu..",
    "..utffffffffeu..",
    "..utfffffffeeu..",
    "..ufffffffffeu..",
    "..ufffffffffeu..",
    "...uuuuuuuuuu...",
  })
end)

icon("samgyetang", function(img)
  ttuk(img, 1, 22, 8, function(nx, ny) return ny < -0.2 and "t" or "c" end)
  L.map(img, 5, 6, {
    "....ddcccd.....",
    "..ddcttcccdd...",
    ".dctttcccccdd..",
    ".dccccccccccd..",
    "..ddcccccddh...",
    "....dddddhh.mm.",
  })
  L.map(img, 3, 11, { "h.", "hh" })
  L.map(img, 17, 10, { "dd", ".d" })
  steam(img, { 6, 15 }, 0)
end)

icon("phrase", function(img)
  -- speech bubble with "가" glyph
  L.map(img, 1, 3, {
    "...tttttttttttttttt...",
    "..ttttttttttttttttuu..",
    ".ttttttttttttttttttuu.",
    "ttttttzzzttttzzttttuuv",
    "ttttttttzttttzzttttuuv",
    "tttttttzzttttzttttttuv",
    "ttttttzzttttzzzttttuuv",
    "tttttzzttttttzzttttuuv",
    "ttttttttttttttzttttuuv",
    "tttttttttttttttttttuuv",
    ".ttttttttttttttttuuvv.",
    "..ttttttttttttuuuuvv..",
    "....ttttuvvvvvvvvv....",
    "....tuuv..............",
    "...tuv................",
    "..uv..................",
  })
end)

-- ---------------------------------------------------------------- build
local spr = L.new(W, W, #ICONS)
local names = {}
for i, ic in ipairs(ICONS) do
  local img = L.img(spr, i)
  ic.fn(img)
  L.outline(img, OUT)
  names[#names + 1] = '"' .. ic.name .. '"'
end
L.save(spr, "icons", { sheet = true })
local f = io.open(L.root .. "/public/assets/icons.json", "w")
f:write('{ "size": 24, "names": [' .. table.concat(names, ", ") .. "] }\n")
f:close()
