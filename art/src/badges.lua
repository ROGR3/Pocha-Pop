-- Achievement badges (odznáčky): enamel pins with a metal rim.
--   badges   24x24, one frame per achievement (order = ORDER), sheet 8 columns + badges.json names
--   badges_s 10x10 tiny pins (same order) pinned on the stall's side tarp
-- Round pins = regular achievements, shields = bosses. Gold rim (l k j b) for bosses and
-- big ones, silver (t u v w) for the rest. Light from top-left.
local L = dofile(app.params.root .. "/art/lib.lua")

local ORDER = {
  "first_night", "combo10", "clean100", "shift", "all_jamo", "polite",
  "book_food", "book_ddm", "book_hgd", "book_ysn", "book_phm", "book_bsn",
  "boss_critic", "boss_blogger", "boss_manager", "boss_trader", "boss_captain",
  "streak7", "colors", "hats", "helper", "stories", "daily", "pharmacy",
}

local GOLD = { hi = "t", light = "l", mid = "k", dark = "j", deep = "b" }
local SILVER = { hi = "t", light = "t", mid = "u", dark = "v", deep = "w" }

-- field = enamel ramp { hi, main, dark }; gold = gold rim; shield = boss shape
-- line = colour of the outline drawn around the symbol (default field dark)
local B = {
  first_night = { field = { "w", "x", "y" } },
  combo10 = { field = { "C", "B", "x" } },
  clean100 = { field = { "m", "n", "o" }, gold = true },
  shift = { field = { "v", "w", "x" } },
  all_jamo = { field = { "D", "i", "h" }, gold = true },
  polite = { field = { "s", "r", "q" } },
  book_food = { field = { "k", "j", "a" } },
  book_ddm = { field = { "D", "C", "B" } },
  book_hgd = { field = { "C", "B", "x" } },
  book_ysn = { field = { "o", "p", "z" } },
  book_phm = { field = { "m", "n", "o" } },
  book_bsn = { field = { "r", "q", "x" } },
  boss_critic = { field = { "i", "h", "g" }, gold = true, shield = true },
  boss_blogger = { field = { "D", "C", "B" }, gold = true, shield = true },
  boss_manager = { field = { "C", "B", "x" }, gold = true, shield = true },
  boss_trader = { field = { "n", "o", "p" }, gold = true, shield = true },
  boss_captain = { field = { "r", "q", "x" }, gold = true, shield = true },
  streak7 = { field = { "x", "y", "z" }, gold = true },
  colors = { field = { "t", "c", "d" } },
  hats = { field = { "D", "C", "B" } },
  helper = { field = { "s", "r", "q" } },
  stories = { field = { "D", "i", "h" }, gold = true },
  daily = { field = { "l", "k", "j" } },
  pharmacy = { field = { "d", "e", "f" } },
}

-- 12x12 symbols (drawn at 6,6 inside the 24x24 frame), auto-outlined in field dark.
local OPEN_BOOK = {
  "tttt....uuuu",
  "ttttttuuuuuu",
  "cccccfcccccc",
  "ffffffffffff",
}
local SYM = {
  first_night = {
    ".....gg.....",
    "....bkkb....",
    "...iiiiii...",
    "..iDDiiiih..",
    "..iDiklkih..",
    "..iiklllkh..",
    "..iiklllkh..",
    "..iiiklkhh..",
    "...iiiihh...",
    "....bkkb....",
    ".....kk.....",
    "......k.....",
  },
  combo10 = {
    "......tlk...",
    ".....tlk....",
    "....tlk.....",
    "...tlk......",
    "..tllllllk..",
    "..kkkkklk...",
    "......lk....",
    ".....lk.....",
    "....lk......",
    "...lk.......",
    "..lk........",
    "..k.........",
  },
  clean100 = {
    "..l.........",
    ".ltl........",
    "..l.......tu",
    "..........tu",
    ".........ttu",
    ".t.......tu.",
    ".ttu....ttu.",
    "..ttu..ttu..",
    "...ttuttu...",
    "....tttu....",
    ".....tu.....",
    "............",
  },
  shift = {
    ".....tt.....",
    "....tvvt....",
    "...tvvvvt...",
    "..tvvvvvvt..",
    ".tvvvvvvvvt.",
    ".tttvvvvttu.",
    "...tvvvvu...",
    "...tvvvvu...",
    "...tvvvvu...",
    "...tuuuuu...",
    "............",
    "............",
  },
  all_jamo = {
    "............",
    "............",
    "ttttt...tt..",
    "uuuut...tt..",
    "...ut...tttt",
    "...ut...tuuu",
    "...ut...tt..",
    "..tu....tt..",
    ".tu.....tt..",
    ".u......uu..",
    "............",
    "............",
  },
  polite = {
    "......E.....",
    "....E.E.E...",
    "....E.E.E.E.",
    "..t.EFEFEFE.",
    ".t..EFEFEFE.",
    ".t..EEEEEEE.",
    ".EE.EEEEEEE.",
    "..EEEEEEEEF.",
    "...EEEEEEEF.",
    "....EEEEEF..",
    ".....EEFF...",
    "......FF....",
  },
  book_food = {
    "..u..u..u...",
    "...u..u..u..",
    "..u..u..u...",
    ".tttttttttu.",
    ".uitttttuvv.",
    "..vuuuuvvv..",
    "...vvvvvv...",
    "....wwww....",
  },
  book_ddm = {
    ".....uu.....",
    "....u..u....",
    ".......u....",
    "......u.....",
    "...tuuuuv...",
    "..tu....uv..",
    ".tvvvvvvvvw.",
    "............",
  },
  book_hgd = {
    "......tttt..",
    "......tuuu..",
    "......t..u..",
    "......t..u..",
    "......t..u..",
    "...ttut.ttu.",
    "...tuuu.tuu.",
    "....uu...u..",
  },
  book_ysn = {
    "...u....u...",
    "....u..u....",
    ".tttttttttu.",
    ".tssssssstu.",
    ".tsttsssrtu.",
    ".tssssrrrtu.",
    ".uuuuuuuuuv.",
    "....v..v....",
  },
  book_phm = {
    "....tttt....",
    "....tmmu....",
    ".ttttmmuuuu.",
    ".tmmmmmmmmu.",
    ".tnnnnmnnnv.",
    ".uuvvnnvvvv.",
    "....vnnv....",
    "....vvvv....",
  },
  book_bsn = {
    ".....tt.....",
    "....u..u....",
    ".....tu.....",
    "...tttuuu...",
    ".....tu.....",
    ".t...tu...u.",
    ".tu..tu..uv.",
    "..ttttuuuv..",
  },
  boss_critic = {
    "......z.....",
    "....yyyyy...",
    "..xyyyyyyyy.",
    ".xxyyyyyyyyz",
    "..zzzzzzzz..",
    "............",
    "............",
    ".l.l.l.l.l..",
    "............",
    "............",
    "............",
    "............",
  },
  boss_blogger = {
    "............",
    "..xxxxxxx...",
    "..xyyyyyx...",
    "..xyDtDyx...",
    "..xyiDiyx...",
    "..xyyiyyx...",
    "..xyyyyyx...",
    "..xyyyyyx...",
    "..xxxvxxx...",
    "..xxxxxxx...",
    "............",
    "............",
  },
  boss_manager = {
    "....tuu...l.",
    "...tuvvv.lll",
    "...uvvvw..k.",
    "...vvvww....",
    "....www.....",
    ".....x......",
    ".....x......",
    ".....x......",
    "....xxx.....",
    "............",
    "............",
    "............",
  },
  boss_trader = {
    "....fe.f....",
    ".....ef.....",
    "....kkkk....",
    "...lkkkkj...",
    "..lkkjjkkj..",
    "..lkjkkkkj..",
    "..kkkjjkkb..",
    "..kkkkkjkb..",
    "..kkkjjkjb..",
    "...kkkkbb...",
    "............",
    "............",
  },
  boss_captain = {
    ".....dd.....",
    "..d..de..e..",
    "...ddeeee...",
    "...de..ee...",
    "dddd.cc.eeee",
    "dddd.cc.eeef",
    "...ee..ef...",
    "...eeeeff...",
    "..e..ef..f..",
    ".....ff.....",
    "............",
    "............",
  },
  streak7 = {
    ".....j......",
    ".....jj.....",
    "....jjj..j..",
    "...jjkjj.j..",
    "...jkkkjjj..",
    "..jjkllkjj..",
    "..jklllkjj..",
    "..jkltlkja..",
    "...jkllkj...",
    "....aaaa....",
    "..lklklkl...",
    "............",
  },
  colors = {
    "............",
    "............",
    "...iiiiii...",
    "..ijjjjjji..",
    ".ijllllllji.",
    ".ijlmmmmlji.",
    "ijlmrrrrmlji",
    "ijlmr..rmlji",
    "ijlmr..rmlji",
    "............",
    "............",
    "............",
  },
  hats = {
    "...l.l.l....",
    "...lklklk...",
    "...kkkkkj...",
    "............",
    ".j........j.",
    ".jj......jj.",
    ".jDj....jDj.",
    ".jDDjjjjDDj.",
    "jjjjjjjjjjjj",
    "jjjjjjjjjjjb",
    "jgjjjjjjgjjb",
    "jjjjfjjjjjbb",
  },
  helper = {
    "...t....t...",
    "...t....t...",
    "....tttt....",
    "....tttt....",
    ".iiitttttii.",
    "...tttttt...",
    "..tttttttt..",
    "..ttiiiitu..",
    "..tttttttu..",
    "..tttttuuu..",
    "..uuuuuuuu..",
    "............",
  },
  stories = {
    ".tttttttttt.",
    "tttttttttttu",
    "ttiittiiittu",
    "tiiiiiiiiitu",
    "tiDiiiiiiitu",
    "ttiiiiiiittu",
    "tttiiiiittuu",
    "ttttiiittuuu",
    ".ttttittuuu.",
    "...ttuuu....",
    "...tu.......",
    "...u........",
  },
  daily = {
    "..u....u....",
    ".iuiiiiuiii.",
    ".iiiiiiiiih.",
    ".tttttttttu.",
    ".tttttttttu.",
    ".tt.t.t.ttu.",
    ".tttttttttu.",
    ".tt.t.t.i.u.",
    ".tttttttttu.",
    ".tt.t.t.ttu.",
    ".uuuuuuuuuv.",
    "............",
  },
  pharmacy = {
    "...u..u.....",
    "....u..u....",
    "...u..u.....",
    "..tttttttt..",
    "..ttttnttuuu",
    "..tttnnntu.u",
    "..ttttnttu.u",
    "..ttttttuuuu",
    "..tttttuuu..",
    "...uuuuuv...",
    "............",
    "............",
  },
}
-- book badges: symbol (8 rows) above an open book (4 rows)
for _, n in ipairs({ "book_food", "book_ddm", "book_hgd", "book_ysn", "book_phm", "book_bsn" }) do
  local s = SYM[n]
  for _, r in ipairs(OPEN_BOOK) do s[#s + 1] = r end
end

-- 4x4 hints for the tiny pins (drawn in the 4x4 enamel well; '.' = field)
local MINI = {
  first_night = { ".k..", "iDi.", "iih.", ".k.." },
  combo10 = { "..l.", ".ll.", ".l..", "...." },
  clean100 = { "....", "...t", "t.t.", ".t.." },
  shift = { ".t..", "ttt.", ".t..", "...." },
  all_jamo = { "tt.t", ".t.t", ".ttt", "...t" },
  polite = { "E.E.", "EEE.", ".EE.", "...." },
  book_food = { "....", "tttu", ".uv.", "...." },
  book_ddm = { ".u..", "tuu.", "....", "...." },
  book_hgd = { "..t.", "..t.", ".tt.", "...." },
  book_ysn = { "....", "ttu.", "tsu.", "...." },
  book_phm = { ".t..", "ttt.", ".t..", "...." },
  book_bsn = { ".t..", ".t..", "t.t.", ".t.." },
  boss_critic = { ".yy.", "yyyy", "....", "...." },
  boss_blogger = { "....", ".Di.", ".i..", "...." },
  boss_manager = { ".u..", ".v..", ".x..", "...." },
  boss_trader = { "....", ".k..", "kkk.", "...." },
  boss_captain = { "....", ".d..", "dcd.", ".d.." },
  streak7 = { ".j..", "jkj.", "jlj.", "...." },
  colors = { "....", "iii.", "jlm.", "...." },
  hats = { "l.l.", "....", "j..j", "jjjj" },
  helper = { "....", "ttt.", "ttt.", "...." },
  stories = { "ttt.", "tDt.", "tt..", "t..." },
  daily = { "....", "iii.", "ttt.", "ttt." },
  pharmacy = { "....", "ttt.", "tnt.", "...." },
}


-- ------------------------------------------------------------ shapes + rim
local function depthMap(mask, w, h)
  local d = {}
  for y = 0, h - 1 do d[y] = {} for x = 0, w - 1 do d[y][x] = mask(x, y) and 999 or 0 end end
  for pass = 1, 6 do
    for y = 0, h - 1 do for x = 0, w - 1 do
      if d[y][x] == 999 then
        local n = function(xx, yy) if xx < 0 or yy < 0 or xx >= w or yy >= h then return 0 end return d[yy][xx] end
        local m = math.min(n(x - 1, y), n(x + 1, y), n(x, y - 1), n(x, y + 1))
        if m == pass - 1 then d[y][x] = pass end
      end
    end end
  end
  return d
end

local function circleMask(x0, size)
  local c = x0 + size / 2
  return function(x, y)
    local dx, dy = x + 0.5 - c, y + 0.5 - c
    return dx * dx + dy * dy <= (size / 2) * (size / 2) + 0.3
  end
end

local function shieldMask(x0, size)
  return function(x, y)
    local lx, ly = x - x0, y - x0
    if lx < 0 or ly < 0 or lx >= size or ly >= size then return false end
    local fx = math.abs(lx + 0.5 - size / 2)
    local hw = size / 2
    local top = size * 0.5
    if ly == 0 and (lx == 0 or lx == size - 1) then return false end
    if ly + 0.5 > top then
      local t = (ly + 0.5 - top) / (size - top)
      hw = hw * (1 - t ^ 2.2)
      hw = math.max(hw, 0.6)
    end
    return fx <= hw
  end
end

-- big badge
local function drawBig(img, name)
  local b = B[name]
  local m = b.gold and GOLD or SILVER
  local mask = b.shield and shieldMask(2, 20) or circleMask(2, 20)
  local d = depthMap(mask, 24, 24)
  local c = 12
  local fh, fm, fd = b.field[1], b.field[2], b.field[3]
  for y = 0, 23 do for x = 0, 23 do
    local k = d[y][x]
    if k > 0 then
      local nx, ny = (x + 0.5 - c) / 10, (y + 0.5 - c) / 10
      local v = nx * 0.75 + ny * 0.65
      local col
      if k == 1 then
        col = v < -0.55 and m.light or (v > 0.35 and m.dark or m.mid)
        if v < -0.8 then col = m.hi end
      elseif k == 2 then
        col = v < -0.3 and m.mid or (v > 0.3 and m.light or m.mid)
        if v > 0.3 and v < 0.5 then col = m.mid end
      elseif k == 3 then
        col = v < 0.1 and fd or fm   -- recessed: shadow under the top-left rim
      else
        col = fm
        if v > 0.55 then col = fh end
      end
      L.set(img, x, y, col)
    end
  end end
  -- rim screw dots / bottom shadow on rim
  -- symbol
  local tmp = Image(24, 24, ColorMode.RGB)
  L.map(tmp, 6, 6, SYM[name])
  L.outline(tmp, b.line or fd)
  for y = 0, 23 do for x = 0, 23 do
    if d[y][x] >= 3 and L.isOpaque(tmp, x, y) then img:drawPixel(x, y, tmp:getPixel(x, y)) end
  end end
  -- gloss on enamel, top-left
  local gl = b.shield and { { 6, 5 }, { 5, 6 }, { 7, 5 } } or { { 7, 6 }, { 6, 7 }, { 8, 6 } }
  for _, p in ipairs(gl) do
    if not L.isOpaque(tmp, p[1], p[2]) then L.set(img, p[1], p[2], fh) end
  end
  L.outline(img, "g")
end

local function drawSmall(img, name)
  local b = B[name]
  local m = b.gold and GOLD or SILVER
  local rows = b.shield and { "######", "######", "######", "######", ".####.", "..##.." }
    or { ".####.", "######", "######", "######", "######", ".####." }
  local fh, fm, fd = b.field[1], b.field[2], b.field[3]
  for j, r in ipairs(rows) do for i = 1, 6 do
    if r:sub(i, i) == "#" then
      local x, y = 1 + i, 1 + j
      local edge = j == 1 or j == 6 or i == 1 or i == 6 or (b.shield and j >= 5)
      local col = fm
      if edge then
        local v = (i - 3.5) + (j - 3.5)
        if b.gold then
          col = v < -1 and m.light or (v > 1.5 and m.dark or m.mid)
        else
          -- coloured pin: enamel up to the edge, silver glints top-left / bottom-right
          col = v < -1 and fh or (v > 1.5 and fd or fm)
          if v <= -4 then col = m.light end
          if v >= 3 then col = m.dark end
        end
      end
      L.set(img, x, y, col)
    end
  end end
  L.map(img, 3, 3, MINI[name])
  L.outline(img, "g")
end

-- ------------------------------------------------------------ export
do
  local spr = L.new(24, 24, #ORDER)
  for i, n in ipairs(ORDER) do drawBig(L.img(spr, i), n) end
  L.save(spr, "badges", { sheet = true, columns = 8 })
  local f = io.open(L.root .. "/public/assets/badges.json", "w")
  local q = {}
  for _, n in ipairs(ORDER) do q[#q + 1] = '"' .. n .. '"' end
  f:write('{ "size": 24, "names": [' .. table.concat(q, ", ") .. "] }\n")
  f:close()
end
do
  local spr = L.new(10, 10, #ORDER)
  for i, n in ipairs(ORDER) do drawSmall(L.img(spr, i), n) end
  L.save(spr, "badges_s", { sheet = true, columns = 8 })
end
