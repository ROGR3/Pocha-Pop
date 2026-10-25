-- UI sprites: bubble, panels, buttons, coin, stars, faces, map lanterns, icons,
-- particles, postcard, logo, app icon.
local L = dofile(app.params.root .. "/art/lib.lua")

local function sheet(name, w, h, frames, draw, opts)
  opts = opts or {}
  local spr = L.new(w, h, #frames)
  for i, f in ipairs(frames) do
    local img = L.img(spr, i)
    draw(img, f, i)
    if opts.outline then L.outline(img, opts.outline) end
  end
  if opts.ms then L.durations(spr, opts.ms) end
  if opts.tags then for _, t in ipairs(opts.tags) do L.tag(spr, t[1], t[2], t[3]) end end
  L.save(spr, name, { sheet = #frames > 1 or opts.sheet })
end

-- ------------------------------------------------------------ speech bubble 9-slice 15x15 (corner 5)
do
  local spr = L.new(15, 15, 1)
  local img = L.img(spr, 1)
  L.map(img, 0, 0, {
    "...ggggggggg...",
    ".ggttttttttttg.",
    ".gttttttttttttg",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttttug",
    "gttttttttttuuug",
    ".gtttttttuuuug.",
    ".gguuuuuuuuugg.",
    "...ggggggggg...",
  })
  L.save(spr, "bubble")
  -- tail
  local t = L.new(9, 7, 1)
  L.map(L.img(t, 1), 0, 0, { "gtttttug.", ".gtttug..", ".gttug...", "..gtug...", "..gug....", "..gg.....", "..g......" })
  L.save(t, "bubble_tail")
  -- highlighted (matching) bubble variant: yellow
  local h = L.new(15, 15, 1)
  local hi = L.img(h, 1)
  hi:drawImage(img, Point(0, 0))
  L.swap(hi, { t = "l", u = "k", g = "f" })
  L.save(h, "bubble_hi")
end

-- ------------------------------------------------------------ panel 9-slice 24x24 (corner 8): night-blue paper with lantern-orange trim
do
  local spr = L.new(24, 24, 1)
  local img = L.img(spr, 1)
  L.rect(img, 1, 1, 22, 22, "y")
  L.rect(img, 2, 2, 20, 20, "x")
  L.rect(img, 3, 3, 18, 18, "y")
  L.hline(img, 2, 21, 1, "j"); L.hline(img, 2, 21, 22, "a"); L.vline(img, 1, 2, 21, "j"); L.vline(img, 22, 2, 21, "a")
  L.set(img, 1, 1, "k"); L.set(img, 22, 1, "j"); L.set(img, 1, 22, "j"); L.set(img, 22, 22, "a")
  L.outline(img, "z")
  L.save(spr, "panel")
  -- paper panel (postcard / recipe cards)
  local p = L.new(24, 24, 1)
  local pi = L.img(p, 1)
  L.rect(pi, 1, 1, 22, 22, "c"); L.hline(pi, 1, 22, 22, "d"); L.vline(pi, 22, 1, 22, "d")
  L.hline(pi, 2, 21, 1, "t")
  L.outline(pi, "f")
  L.save(p, "paper")
end

-- ------------------------------------------------------------ buttons 9-slice 16x16 (corner 5): red, pressed, wood, disabled
do
  local function btn(name, face, light, dark, edge, pressed)
    local spr = L.new(16, 16, 1)
    local img = L.img(spr, 1)
    local top = pressed and 2 or 0
    L.rect(img, 1, 1 + top, 14, 14 - top, face)
    L.hline(img, 2, 13, 1 + top, light); L.vline(img, 1, 2 + top, 11, light)
    if not pressed then L.rect(img, 1, 12, 14, 3, dark); L.hline(img, 2, 13, 11, face) end
    L.set(img, 1, 1 + top, L.clear); L.set(img, 14, 1 + top, L.clear); L.set(img, 1, 14, L.clear); L.set(img, 14, 14, L.clear)
    L.outline(img, edge)
    L.save(spr, name)
  end
  btn("btn", "i", "D", "h", "g", false)
  btn("btn_down", "i", "D", "h", "g", true)
  btn("btn_wood", "b", "d", "e", "g", false)
  btn("btn_wood_down", "b", "d", "e", "g", true)
  btn("btn_off", "w", "v", "x", "z", false)
end

-- ------------------------------------------------------------ coin 10x10, 6 frames rotation
do
  local widths = { 8, 6, 3, 1, 3, 6 }
  sheet("coin", 10, 10, widths, function(img, w, i)
    local x0 = 5 - math.ceil(w / 2)
    if w == 1 then L.rect(img, 4, 1, 2, 8, "b"); L.vline(img, 4, 1, 8, "k"); return end
    L.ebox(img, x0, 1, x0 + w - 1, 8, function(nx, ny)
      if nx < -0.5 then return "l" elseif nx > 0.5 then return "b" end
      return "k"
    end)
    if w >= 6 then L.ebox(img, x0 + 2, 3, x0 + w - 3, 6, function(nx) return nx < 0 and "j" or "k" end); L.set(img, x0 + 1, 2, "t") end
  end, { outline = "g", ms = 90, tags = { { "spin", 1, 6 } } })
end

-- ------------------------------------------------------------ stars 14x14: full, empty, ding 1-4
do
  local STAR = {
    "......#......",
    ".....###.....",
    ".....###.....",
    "....#####....",
    "#############",
    ".###########.",
    "..#########..",
    "...#######...",
    "...#######...",
    "..####.####..",
    "..###...###..",
    ".##.......##.",
  }
  local function star(img, ox, oy, fill, light, dark)
    for j, row in ipairs(STAR) do
      for k = 1, #row do
        if row:sub(k, k) == "#" then
          local c = fill
          if j <= 5 and k <= 7 then c = light end
          if j >= 9 then c = dark end
          L.set(img, ox + k - 1, oy + j - 1, c)
        end
      end
    end
  end
  sheet("star", 15, 14, { "full", "empty", "d1", "d2", "d3", "d4" }, function(img, f, i)
    if f == "empty" then star(img, 1, 1, "x", "w", "y")
    else star(img, 1, 1, "k", "l", "j") end
    if f == "d1" then L.set(img, 4, 3, "t") end
    if f == "d2" then L.set(img, 4, 3, "t"); L.set(img, 5, 4, "t"); L.set(img, 3, 5, "t") end
    if f == "d3" then L.set(img, 7, 6, "t"); L.set(img, 8, 6, "t"); L.set(img, 6, 6, "t"); L.set(img, 7, 5, "t"); L.set(img, 7, 7, "t") end
    if f == "d4" then L.set(img, 10, 8, "t") end
  end, { outline = "g", ms = 80, tags = { { "ding", 3, 6 } } })
end


-- ------------------------------------------------------------ small stars 8x8: full, empty
do
  local S = { "...#...", "..###..", "#######", ".#####.", "..###..", ".##.##.", ".#...#." }
  sheet("star_s", 9, 9, { "full", "empty" }, function(img, f)
    for j, row in ipairs(S) do for k = 1, #row do
      if row:sub(k, k) == "#" then L.set(img, k, j, f == "full" and (j <= 3 and "l" or "k") or "x") end
    end end
  end, { outline = "g" })
end

-- ------------------------------------------------------------ mood faces 11x11: happy, neutral, angry
do
  sheet("faces", 11, 11, { "happy", "neutral", "angry" }, function(img, f)
    local base = ({ happy = "m", neutral = "k", angry = "i" })[f]
    local light = ({ happy = "c", neutral = "l", angry = "D" })[f]
    local dark = ({ happy = "n", neutral = "j", angry = "h" })[f]
    L.ebox(img, 1, 1, 9, 9, function(nx, ny) if nx + ny < -0.8 then return light elseif nx + ny > 0.8 then return dark end return base end)
    L.set(img, 3, 4, "g"); L.set(img, 7, 4, "g")
    if f == "happy" then L.map(img, 3, 6, { "g...g", ".ggg." })
    elseif f == "neutral" then L.hline(img, 3, 7, 7, "g")
    else L.map(img, 3, 6, { ".ggg.", "g...g" }); L.set(img, 2, 3, "g"); L.set(img, 8, 3, "g") end
  end, { outline = "g" })
end

-- ------------------------------------------------------------ map lanterns 16x22: lit a/b, cleared, locked ; boss 26x34 locked/lit
do
  sheet("node", 16, 22, { "lit1", "lit2", "dim", "locked" }, function(img, f)
    L.vline(img, 8, 0, 2, "z")
    L.rect(img, 5, 2, 6, 2, "g")
    local glow = f == "lit2" and "l" or "k"
    L.ebox(img, 1, 3, 14, 19, function(nx, ny, x, y)
      if f == "locked" then
        if (y - 3) % 4 == 0 then return "y" end
        return nx < -0.4 and "w" or "x"
      end
      if (y - 3) % 4 == 0 then return "h" end
      if f ~= "dim" and math.abs(nx) < 0.35 and math.abs(ny) < 0.5 then return glow end
      if nx < -0.55 then return "j" end
      if nx > 0.5 then return "a" end
      return f == "dim" and "a" or "i"
    end)
    L.rect(img, 5, 19, 6, 2, "g")
    if f == "locked" then L.map(img, 5, 8, { ".vv.", "v..v", "vvvv", "vwwv", "vvvv" }) end
  end, { outline = "g", ms = 300, tags = { { "lit", 1, 2 } } })
  sheet("node_boss", 26, 34, { "locked", "lit1", "lit2" }, function(img, f)
    L.vline(img, 13, 0, 3, "z")
    L.rect(img, 8, 3, 10, 3, "k"); L.hline(img, 8, 17, 3, "l")
    L.ebox(img, 1, 5, 24, 29, function(nx, ny, x, y)
      if f == "locked" then
        if (y - 5) % 5 == 0 then return "y" end
        return nx < -0.4 and "B" or "y"
      end
      if (y - 5) % 5 == 0 then return "f" end
      if math.abs(nx) < 0.3 and math.abs(ny) < 0.45 then return f == "lit2" and "t" or "l" end
      if nx < -0.55 then return "C" end
      if nx > 0.5 then return "h" end
      return "A"
    end)
    L.rect(img, 8, 29, 10, 3, "k")
    L.vline(img, 13, 32, 33, "k")
    -- crown / star mark for the critic
    if f == "locked" then L.map(img, 9, 13, { "k.k.k.k", "kkkkkkk", "kkkkkkk" }) else L.map(img, 9, 13, { "l.l.l.l", "lllllll", "kkkkkkk" }) end
  end, { outline = "g", ms = 300, tags = { { "lit", 2, 3 } } })
end

-- ------------------------------------------------------------ icons 14x14
do
  local ICONS = {
    gear = { "....kkkk....", "..k.kllk.k..", ".kkkkllkkkk.", "..kkkjjkkk..", "kkkjj..jjkkk", "kllj....jllk", "kllj....jllk", "kkkjj..jjkkk", "..kkkjjkkk..", ".kkkkjjkkkk.", "..k.kjjk.k..", "....kjjk...." },
    book = { ".hhhhhhhhhh.", "hiiiiiiiiiih", "hiDiiiiiiiih", "hiDiccccciih", "hiDiiiiiiiih", "hiDiccccciih", "hiDiiiiiiiih", "hiDiiiiiiiih", "hiDiiiiiiiih", "hiiiiiiiiiih", "httttttttttu", ".uuuuuuuuuu." },
    bag = { "....hhhh....", "...h....h...", "...h....h...", ".jjjjjjjjjj.", "jkkkkkkkkkkj", "jkllkkkkkkkj", "jklkkkkkkkkj", "jkkkkllkkkkj", "jkkkkllkkkkj", "jkkkkkkkkkkj", "jkkkkkkkkkbj", ".bbbbbbbbbb." },
    back = { ".....t......", "....tt......", "...ttt......", "..tttttttt..", ".ttttttttttt", "tttttttttttt", ".ttttttttttt", "..tttttttttt", "...ttt...ttt", "....tt...ttt", ".....t..ttt.", "......ttt..." },
    help = { "...tttttt...", "..tt....tt..", "..tt....tt..", "........tt..", ".......tt...", "......tt....", ".....tt.....", ".....tt.....", "............", ".....tt.....", ".....tt.....", "............" },
    pause = { "............", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "..ttt..ttt..", "............" },
    sound = { ".....t......", "....tt...t..", "...ttt....t.", "tttttt..t..t", "tttttt...t.t", "tttttt...t.t", "tttttt...t.t", "tttttt..t..t", "...ttt....t.", "....tt...t..", ".....t......", "............" },
    mute = { ".....t......", "....tt......", "...ttt......", "tttttt.i...i", "tttttt..i.i.", "tttttt...i..", "tttttt..i.i.", "tttttt.i...i", "...ttt......", "....tt......", ".....t......", "............" },
    fire = { ".....i......", "....ii......", "....iji..i..", "...ijji.ii..", "..ijjjjiji..", "..ijjkjjjji.", ".ijjkkkjjji.", ".ijkklkkjji.", ".ijkllllkji.", ".ijklttlkji.", "..ijklllji..", "...iiiiii..." },
    heart = { "............", ".iii....iii.", "iDDii..iiiih", "iDiiiiiiiiih", "iiiiiiiiiiih", "iiiiiiiiiiih", ".iiiiiiiiih.", "..iiiiiiih..", "...iiiiih...", "....iiih....", ".....ih.....", "............" },
    keyboard = { "............", "vvvvvvvvvvvv", "vtutututututv", "vuuuuuuuuuuv", "vtutututututv", "vuuuuuuuuuuv", "vttutttttutv", "vvvvvvvvvvvv", "............", "............", "............", "............" },
    lock = { "...vvvvvv...", "..v......v..", "..v......v..", "..v......v..", ".kkkkkkkkkk.", ".kllkkkkkkk.", ".klkkggkkkk.", ".kkkkggkkkb.", ".kkkkggkkkb.", ".kkkkkkkkkb.", ".bbbbbbbbbb.", "............" },
    check = { "............", "..........mm", ".........mm.", "........mm..", "mm.....mm...", ".mm...mm....", "..mm.mm.....", "...mmm......", "....m.......", "............", "............", "............" },
    play = { "..t.........", "..ttt.......", "..ttttt.....", "..ttttttt...", "..ttttttttt.", "..tttttttttt", "..ttttttttt.", "..ttttttt...", "..ttttt.....", "..ttt.......", "..t.........", "............" },
    map = { "............", "uu..uuu..uuu", "utuuvvvuuvtu", "uttuvivuvttu", "uttuviivvttu", "utuuvvivvttu", "uuuuvviivtuu", "uttuvvvivttu", "uttuvvvvvttu", "utuuvvvuuvtu", "uu..uuu..uuu", "............" },
    stool = { "............", "..DDDDDDDD..", ".DiiiiiiiiD.", ".hiiiiiiiih.", "..hhhhhhhh..", "..ih....hi..", "..ih.hh.hi..", "..ih.hh.hi..", "...ih..hi...", "...ih..hi...", "..hhh..hhh..", "............" },
    hand = { "...E.E......", "..EEFEFE....", "..EFEFEFE...", "..EFEFEFE...", "E.EEEEEFE...", "EEEEEEEEF...", ".EEEEEEEF...", "..EEEEEEF...", "..EEEEEF....", "...FEEEF....", "...jjjj.....", "...jkkj....." },
    door = { "..ffffffff..", "..fbbbbbbf..", "..fbeeeebf..", "..fbeeeebf..", "..fbbbbbbf..", "..fbeeeebf..", "..fbeeekbf..", "..fbeeeebf..", "..fbeeeebf..", "..fbbbbbbf..", "..ffffffff..", ".dddddddddd." },
    paint = { "..........ff", ".........fef", "........fef.", ".......fef..", "......fef...", ".....uvu....", "....uvvu....", "...iiiv.....", "..iDii......", ".iiih.......", "iiih........", "hhh........." },
    stool_s = { "............", "............", "............", "............", "....DDDD....", "...iiiiii...", "....h..h....", "....h..h....", "...hh..hh...", "............", "............", "............" },
    trophy = { "kkkkkkkkkkkk", "klllllllllkj", "klllllllllkj", ".kllllllkkj.", ".kllllllkkj.", "..kllllkkj..", "...kllkkj...", ".....kj.....", ".....kj.....", "...kkkkjj...", "..ffffffff..", "..eeeeeeee.." },
    calendar = { ".i..i..i..i.", "iiiiiiiiiiii", "ihhhhhhhhhhi", "tttttttttttu", "tvtvtvtvtvtu", "tttttttttttu", "tvtvtiivtvtu", "ttttiiitttu.", "tvtvtvtvtvtu", "tttttttttttu", "uuuuuuuuuuuu", "............" },
    target = { "....iiii....", "..iittttii..", ".iittttttii.", ".ittiiiitti.", "ittittttitti", "ittitlltitth", "ittitlltitth", "ittittttitth", ".ittiiiitth.", ".iitttttthh.", "..iitttthh..", "....ihhh...." },
    together = { "............", "DDDD....DDDD", "iiiih..iiiih", "hhhh....hhhh", ".ih......ih.", ".ih..ll..ih.", ".ih.lkkl.ih.", ".ih.lkkl.ih.", ".ih..kk..ih.", "hhh......hhh", "............", "............" },
    camera = { "............", "....vvvv....", "xxxvuuuuvxxx", "xwwwwwwwwwux", "xwwwqqqqwwwx", "xwwqrsrrqwwx", "xwwqrrrrqwwx", "xwwqrrrrqwwx", "xwwwqqqqwwwx", "xwwwwwwwwwwx", "xxxxxxxxxxxx", "............" },
    wifi = { "............", "...tttttt...", ".tt......tt.", "t..tttttt..t", "..t......t..", "....tttt....", "...t....t...", "............", ".....tt.....", ".....tt.....", "............", "............" },
    close = { "............", ".tt......tt.", ".ttt....ttt.", "..ttt..ttt..", "...tttttt...", "....tttt....", "....tttt....", "...tttttt...", "..ttt..ttt..", ".ttt....ttt.", ".tt......tt.", "............" },
  }
  local order = { "gear", "book", "bag", "back", "help", "pause", "sound", "mute", "fire", "heart", "keyboard", "lock", "check", "play", "map", "close", "stool", "hand", "door", "paint", "stool_s", "trophy", "calendar", "target", "together", "camera", "wifi" }
  sheet("uiicons", 14, 14, order, function(img, n) L.map(img, 1, 1, ICONS[n]) end, { outline = "g" })
  local f = io.open(L.root .. "/public/assets/uiicons.json", "w")
  local q = {}
  for _, n in ipairs(order) do q[#q + 1] = '"' .. n .. '"' end
  f:write('{ "size": 14, "names": [' .. table.concat(q, ", ") .. "] }\n")
  f:close()
end

-- ------------------------------------------------------------ particles 8x8
do
  local P = {
    pop1 = { "...t....", "...t....", "...t....", "ttt.ttt.", "...t....", "...t....", "...t....", "........" },
    pop2 = { "..l.....", ".lkl....", "..l.....", "........", "........", "........", "........", "........" },
    spark = { "...l....", "...l....", ".lllll..", "...l....", "...l....", "........", "........", "........" },
    puff = { "..uuu...", ".utttu..", "utttttu.", "utttttu.", ".utttu..", "..uuu...", "........", "........" },
    puff2 = { "........", "..uu....", ".uttu...", ".uttu...", "..uu....", "........", "........", "........" },
    drop = { "s.......", "s.......", "r.......", "r.......", "q.......", "........", "........", "........" },
    splash = { "........", "........", "........", "........", "........", "s.....s.", ".r...r..", "..rrr..." },
    heart = { ".A.A....", "AiAiA...", "AiiiA...", ".AiA....", "..A.....", "........", "........", "........" },
    note = { "...ll...", "...lkl..", "...l.k..", "...l....", ".lll....", "lkkl....", ".ll.....", "........" },
    dot = { "tt......", "tt......", "........", "........", "........", "........", "........", "........" },
    crumb = { "kj......", "jb......", "........", "........", "........", "........", "........", "........" },
    snow = { "...t....", ".t.u.t..", "..tut...", "tuu.uut.", "..tut...", ".t.u.t..", "...t....", "........" },
    zz = { "zzzz....", "...z....", "..z.....", ".z......", "zzzz....", "........", "........", "........" },
  }
  local order = { "pop1", "pop2", "spark", "puff", "puff2", "drop", "splash", "heart", "note", "dot", "crumb", "zz", "snow" }
  sheet("particles", 8, 8, order, function(img, n) L.map(img, 0, 0, P[n]) end)
  local f = io.open(L.root .. "/public/assets/particles.json", "w")
  local q = {}
  for _, n in ipairs(order) do q[#q + 1] = '"' .. n .. '"' end
  f:write('{ "size": 8, "names": [' .. table.concat(q, ", ") .. "] }\n")
  f:close()
end

-- ------------------------------------------------------------ postcard picture: 제주 (sea, 한라산, 돌하르방, 귤) 200x60
do
  local spr = L.new(200, 60, 1)
  local img = L.img(spr, 1)
  L.vgradient(img, 0, 0, 200, 30, { { 0, "r" }, { 20, "s" }, { 30, "t" } })
  -- Hallasan
  for x = 0, 199 do
    local t = (x - 70) / 70
    local top = math.floor(14 + 14 * t * t)
    for y = top, 38 do
      local c = L.dither(x, y, math.max(0, math.min(1, (t + 0.6) / 1.4)), "n", "o")
      if y < top + 2 and math.abs(t) < 0.3 then c = "t" elseif y < top + 3 and math.abs(t) < 0.18 then c = "u" end
      L.set(img, x, y, c)
    end
  end
  -- sea
  for y = 36, 48 do for x = 0, 199 do L.set(img, x, y, L.dither(x, y, (y - 36) / 14, "r", "q")) end end
  for x = 4, 196, 9 do L.set(img, x + (x % 2), 40 + (x % 5), "t") end
  -- beach / black lava stone ground
  L.rect(img, 0, 48, 200, 12, "d")
  for x = 0, 199 do if (x * 7) % 11 < 3 then L.set(img, x, 48, "c") end end
  -- tangerine tree
  L.rect(img, 150, 36, 3, 14, "f")
  L.ebox(img, 136, 18, 166, 40, function(nx, ny) return nx + ny < -0.6 and "m" or "n" end)
  for _, p in ipairs({ { 142, 26 }, { 150, 22 }, { 158, 30 }, { 146, 34 }, { 156, 24 } }) do L.rect(img, p[1], p[2], 3, 3, "j"); L.set(img, p[1], p[2], "k") end
  -- dol hareubang (stone grandpa)
  L.map(img, 20, 22, {
    "...wwwwww...",
    "..wvvvvvvw..",
    "..wwwwwwww..",
    ".wvvvvvvvvw.",
    ".wvzvvvvzvw.",
    ".wvvvvvvvvw.",
    ".wvvvwwvvvw.",
    "wvvvvvvvvvvw",
    "wvvwwvvwwvvw",
    "wvvvvvvvvvvw",
    "wvvvvvvvvvvw",
    "wvwvvvvvvwvw",
    "wvvwvvvvwvvw",
    "wvvvvvvvvvvw",
    ".wvvvvvvvvw.",
    ".wwwwwwwwww.",
    "..wwwwwwww..",
    "..xxxxxxxx..",
  })
  -- seagulls
  L.map(img, 96, 8, { "t.t", ".t." }); L.map(img, 108, 4, { "t.t", ".t." })
  L.outline(img, "g")
  L.save(spr, "postcard_jeju")
  -- stamp 22x26
  local st = L.new(22, 26, 1)
  local si = L.img(st, 1)
  for y = 0, 25 do for x = 0, 21 do
    local edge = x == 0 or y == 0 or x == 21 or y == 25
    if not edge or (x + y) % 2 == 0 then L.set(si, x, y, "t") end
  end end
  L.rect(si, 3, 3, 16, 20, "r")
  L.ebox(si, 6, 8, 15, 18, function(nx, ny) return nx + ny < -0.5 and "k" or "j" end)
  L.rect(si, 10, 6, 2, 3, "n")
  L.hline(si, 4, 17, 21, "q")
  L.save(st, "stamp")
end

-- ------------------------------------------------------------ logo "POCHA POP" + 포차팝 128x44, 4 frames shine
do
  L.glyph["팝"] = { "####.#.", ".##..##", "####.#.", "#...#..", "#####..", "#...#..", "#####.." }
  local F = {
    P = { "#####.", "##..##", "##..##", "#####.", "##....", "##....", "##...." },
    O = { ".####.", "##..##", "##..##", "##..##", "##..##", "##..##", ".####." },
    C = { ".####.", "##..##", "##....", "##....", "##....", "##..##", ".####." },
    H = { "##..##", "##..##", "##..##", "######", "##..##", "##..##", "##..##" },
    A = { ".####.", "##..##", "##..##", "######", "##..##", "##..##", "##..##" },
  }
  local spr = L.new(128, 44, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    local x = 4
    local word = "POCHA POP"
    for i = 1, #word do
      local ch = word:sub(i, i)
      if ch == " " then x = x + 8 else
        local g = F[ch]
        local wob = (i % 2 == 0) and 1 or 0
        for j, row in ipairs(g) do
          for k = 1, #row do
            if row:sub(k, k) == "#" then
              for sy = 0, 1 do for sx = 0, 1 do
                local px, py = x + (k - 1) * 2 + sx, 3 + wob + (j - 1) * 2 + sy
                local c = (j <= 2) and "l" or ((j >= 6) and "j" or "k")
                -- shine sweep
                local sweepX = ({ -20, 30, 70, 110 })[f]
                if math.abs(px - (sweepX + py)) < 3 then c = "t" end
                L.set(img, px, py, c)
              end end
            end
          end
        end
        x = x + 14
      end
    end
    L.outline(img, "h")
    L.outline(img, "g")
    -- 포차팝 plate
    L.rect(img, 38, 26, 52, 14, "i"); L.hline(img, 38, 89, 26, "D"); L.hline(img, 38, 89, 39, "h")
    L.text(img, 45, 30, "포차팝", "t", { step = 13 })
    L.outline(img, "g")
  end
  L.durations(spr, 140)
  spr.frames[4].duration = 1.6
  L.tag(spr, "shine", 1, 4)
  L.save(spr, "logo")
end

-- ------------------------------------------------------------ app icon 64x64 (scaled to 1024 by scripts/make-icons.sh)
do
  local spr = L.new(64, 64, 1)
  local img = L.img(spr, 1)
  L.vgradient(img, 0, 0, 64, 64, { { 0, "z" }, { 30, "y" }, { 52, "B" }, { 63, "C" } })
  -- stall roof
  for y = 26, 35 do
    local inset = math.floor((35 - y) * 0.7)
    for x = 9 + inset, 54 - inset do L.set(img, x, y, (y < 28) and "k" or ((x % 7 == 0) and "b" or "j")) end
  end
  for x = 7, 56 do for y = 35, 38 + ((x % 6 < 3) and 1 or 0) do L.set(img, x, y, y == 35 and "k" or "i") end end
  -- interior
  L.rect(img, 10, 39, 44, 10, "b"); L.rect(img, 10, 39, 44, 2, "j")
  -- chef: head with white towel
  L.ebox(img, 14, 38, 25, 49, "E")
  L.rect(img, 14, 38, 12, 3, "t"); L.set(img, 13, 39, "t"); L.set(img, 12, 40, "u")
  L.set(img, 17, 44, "z"); L.set(img, 22, 44, "z"); L.hline(img, 18, 21, 47, "f"); L.set(img, 16, 46, "D"); L.set(img, 23, 46, "D")
  -- pot with steam
  L.rect(img, 33, 44, 12, 6, "v"); L.rect(img, 33, 44, 3, 6, "u"); L.hline(img, 32, 45, 43, "u"); L.hline(img, 34, 43, 44, "j")
  L.map(img, 35, 37, { ".t..t", "t..t.", ".t..t", "t..t." })
  -- counter
  L.rect(img, 6, 50, 52, 3, "d"); L.hline(img, 6, 57, 50, "c")
  L.rect(img, 8, 53, 48, 8, "e"); L.rect(img, 8, 55, 48, 2, "j")
  for x = 11, 54, 6 do L.set(img, x, 55, "l") end
  L.rect(img, 6, 35, 2, 26, "w"); L.rect(img, 56, 35, 2, 26, "w")
  -- speech bubble with 팝
  L.ebox(img, 26, 2, 60, 26, function(nx, ny) return (nx + ny > 0.9) and "u" or "t" end)
  L.map(img, 30, 22, { "ttt..", "tt...", "t...." })
  L.text(img, 36, 6, "팝", "i", { scale = 2 })
  L.outline(img, "z")
  L.save(spr, "appicon")
end
