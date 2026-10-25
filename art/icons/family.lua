-- Family (추석 family night): chibi head-and-shoulder portraits. 24x24,
-- outline added by icons.lua. Tricky pairs (언니/누나, 오빠/형) share the same
-- target person; a small speaker (girl with pigtails / boy) in the bottom-right
-- corner with a heart tells them apart.
return function(icon, L, H)
  -- skin head, light from top-left
  local function head(img, x0, y0, x1, y1)
    L.ebox(img, x0, y0, x1, y1, function(nx, ny)
      if nx > 0.5 or (ny > 0.7 and nx > -0.2) then return "F" end
      return "E"
    end)
  end
  -- eyes (2px tall) at x and x+5, blush and mouth below
  local function face(img, x, y, mouth)
    L.vline(img, x, y, y + 1, "z"); L.vline(img, x + 5, y, y + 1, "z")
    L.set(img, x - 1, y + 2, "D"); L.set(img, x + 6, y + 2, "D")
    if mouth == "smile" then L.map(img, x + 1, y + 2, { "h..h", ".hh." })
    elseif mouth == "open" then L.map(img, x + 2, y + 2, { "hh", "hh" })
    elseif mouth == "lips" then L.map(img, x + 2, y + 2, { "AA" })
    elseif mouth then L.hline(img, x + 2, x + 3, y + 2, "h") end
  end
  -- shoulders: clipped ellipse with 3-tone shading
  local function body(img, x0, y0, x1, hi, mid, sh)
    L.ebox(img, x0, y0, x1, y0 + 12, function(nx, ny)
      if nx < -0.55 then return hi elseif nx > 0.45 then return sh end
      return mid
    end, { y1 = 22 })
  end
  -- overlay with its own 1px outline ring (separates it from what is below)
  local function stamp(img, x, y, rows)
    local function at(i, j)
      local r = rows[j]
      if not r or i < 1 or i > #r then return "." end
      return r:sub(i, i)
    end
    for j = 1, #rows do for i = 1, #rows[j] do
      if at(i, j) ~= "." then
        for _, d in ipairs({ { 1, 0 }, { -1, 0 }, { 0, 1 }, { 0, -1 } }) do
          if at(i + d[1], j + d[2]) == "." then L.set(img, x + i + d[1] - 1, y + j + d[2] - 1, "g") end
        end
      end
    end end
    L.map(img, x, y, rows)
  end
  local heart = { ".i.i.", "iDiii", "iiiih", ".iih.", "..h.." }

  -- small speakers for the bottom-right corner
  local girl = {
    "...yyy...",
    "..yyyyy..",
    "yDyyyyyDy",
    "yyEEEEEyy",
    "y.EzEzE.y",
    "..EDEDE..",
    "...EEE...",
    "..DDDDD..",
    ".DDDtDDD.",
    ".DDDDDDC.",
  }
  local boy = {
    ".........",
    "..yyyyy..",
    ".yyyyyyy.",
    ".yyyyyyy.",
    ".yEzEzEy.",
    "..EDEDE..",
    "...EEE...",
    "..rrrrr..",
    ".rrrsrrr.",
    ".rrrrrrq.",
  }
  local function speaker(img, who)
    stamp(img, 14, 13, who)
    stamp(img, 17, 7, heart)
  end

  -- teen girl target (언니 / 누나): long black hair, red hairband, school uniform
  local function teenGirl(img)
    L.map(img, 1, 2, {
      "....yyyyyy....",
      "..yyyyyyyyyy..",
      ".yyyyyyyyyyyy.",
    })
    body(img, 1, 17, 17, "w", "x", "y")
    L.map(img, 5, 17, { "tt...tt", ".tt.tt.", "..tit..", "..iii..", "..i.i.." })
    L.rect(img, 1, 6, 2, 14, "y"); L.rect(img, 14, 6, 2, 14, "y")   -- long hair falling
    L.vline(img, 1, 7, 18, "x")
    head(img, 3, 3, 14, 15)
    L.map(img, 2, 2, {
      "...yyyyyyy...",
      ".yyyyyyyyyyy.",
      "yiiiiiiiiiiiy",
      "yyyyxyyyyyyyy",
      "yyyyyy.yyyyyy",
      "yy.y.....y.yy",
      "yy.........yy",
    })
    face(img, 6, 9, "smile")
  end
  -- teen boy target (오빠 / 형): spiky brown hair, blue hoodie
  local function teenBoy(img)
    body(img, 1, 17, 17, "s", "r", "q")
    L.map(img, 4, 17, { "uu...uu", ".u...u.", ".u...u." })
    head(img, 3, 4, 14, 16)
    L.map(img, 1, 1, {
      "...f..f..f.....",
      "...ff.ff.ff.f..",
      "..ffeeffeeffff.",
      ".ffeeeeeeeefff.",
      ".fffeeeeffffff.",
      ".fffffffffffff.",
      "..ff.ff.fff.ff.",
      "..f.........ff.",
    })
    face(img, 6, 10, "smile")
  end

  -- 할머니: grey bun, round glasses, pink hanbok
  icon("halmeoni", function(img)
    body(img, 2, 17, 21, "D", "C", "B")
    L.map(img, 8, 17, { "tt..tt", ".tt.t.", "..tt..", "..kk..", ".k..k." })
    L.ebox(img, 9, 1, 14, 5, function(nx, ny) return (nx < -0.2 and ny < -0.2) and "t" or (nx > 0.4 and "v" or "u") end)
    head(img, 6, 4, 17, 16)
    L.map(img, 5, 3, {
      "...uuuuuuuu...",
      ".uuttuuuuuuuu.",
      "uuttuuuuuuuuvu",
      "uuuuuuu.uuuuvu",
      "uuu.......uuvv",
      "uv.........vv.",
      "v...........v.",
    })
    -- round glasses (gold rims)
    L.map(img, 7, 9, {
      ".kkk..kkk.",
      "ktzkkktzk.",
      "k.zk.k.zk.",
      ".kkk..kkk.",
    })
    L.set(img, 7, 12, "D"); L.set(img, 16, 12, "D")
    L.map(img, 10, 13, { "h..h", ".hh." })
    L.set(img, 8, 14, "F"); L.set(img, 15, 14, "F")
  end)

  -- 할아버지: black gat hat, white moustache and beard, white hanbok
  icon("harabeoji", function(img)
    body(img, 2, 17, 21, "t", "u", "v")
    L.map(img, 8, 17, { "vv..vv", ".vv.v.", "..vv..", "..qq..", ".q..q." })
    head(img, 6, 5, 17, 16)
    L.map(img, 5, 8, { "u............u", "uu..........uu", "u............u" })
    face(img, 9, 10)
    L.map(img, 8, 12, {                                -- moustache + beard
      ".tttttt.",
      "tuuttuut",
      ".tttttt.",
      "..tttu..",
      "...tu...",
    })
    L.set(img, 8, 11, "u"); L.hline(img, 8, 9, 9, "u"); L.hline(img, 14, 15, 9, "u")   -- brows
    -- gat: crown + wide brim
    L.map(img, 1, 1, {
      "......wyyyyy..........",
      "......wyyyyy..........",
      "......wyyyyy..........",
      "......wyyyyy..........",
      ".xwwwwxxxxxxxxxxxxxxy.",
      "yyyyyyyyyyyyyyyyyyyyyy",
      "....i.............i...",
      "....i.............i...",
    })
    L.hline(img, 8, 12, 5, "k")                         -- hat band
  end)

  -- 엄마: brown bob, smile, apron over red top
  icon("eomma", function(img)
    body(img, 2, 17, 21, "D", "i", "h")
    L.map(img, 7, 17, { ".t....t...", ".t....t...", "tttttttt..", "tttttttu.." })
    L.map(img, 5, 17, { "..........", "..........", "..........", "..........", "..........", })
    L.rect(img, 4, 7, 2, 12, "f"); L.rect(img, 18, 7, 2, 12, "f")
    L.vline(img, 4, 8, 17, "e")
    head(img, 6, 4, 17, 16)
    L.map(img, 4, 2, {
      ".....ffffff.....",
      "...ffffffffff...",
      "..ffeeffffffff..",
      ".ffeefffffffffff",
      ".fffffffffffffff",
      ".ffffff..ffffff.",
      ".fff.........ff.",
      ".ff..........ff.",
    })
    face(img, 9, 10, "smile")
  end)

  -- 아빠: short black side-part hair, glasses, suit and tie
  icon("appa", function(img)
    body(img, 2, 17, 21, "w", "x", "y")
    L.map(img, 9, 17, { "tt..tt", ".tiit.", "..ii..", "..ii..", "..ih.." })
    head(img, 6, 4, 17, 16)
    L.map(img, 5, 2, {
      "....yyyyyy....",
      "..yyyyyyyyyy..",
      ".yyxxyyyyyyyy.",
      ".yxyyyyyyyyyy.",
      ".yyyyy.yyyyyy.",
      ".yy.......yyy.",
      ".y..........y.",
    })
    L.map(img, 6, 9, {
      ".yyyy.yyyy.",
      "yuz.yyu.zyy",
      ".yyyy.yyyy.",
    })
    L.map(img, 11, 13, { "hh" })
  end)

  -- 이모: big curly perm, gold earrings, lipstick, green blouse
  icon("imo", function(img)
    body(img, 2, 17, 21, "m", "n", "o")
    L.map(img, 9, 17, { "t....t", ".t..t.", "..tt.." })
    -- perm volume behind the head
    L.ebox(img, 2, 1, 21, 17, function(nx, ny, x, y)
      if ny > 0.55 and math.abs(nx) < 0.55 then return nil end
      local v = (x + y * 2) % 4
      if v == 0 then return "C" elseif v == 2 and nx < 0 then return "D" end
      return "B"
    end)
    L.rect(img, 10, 15, 4, 3, "F")
    head(img, 6, 5, 17, 16)
    L.map(img, 5, 3, {
      "..BCBBCBBCBB..",
      ".BBDBBCBBDBBB.",
      "BCBBBCBBBCBBCB",
      "BBB.BB..BB.BBB",
      "BB..........BB",
    })
    face(img, 9, 10, "lips")
    L.map(img, 5, 13, { "k", "l", "k" }); L.map(img, 18, 13, { "k", "l", "k" })   -- earrings
  end)

  -- 사촌: kid with a red cap (brim to the side), big grin, yellow tee
  icon("sachon", function(img)
    body(img, 3, 18, 20, "l", "k", "j")
    head(img, 6, 6, 17, 17)
    L.map(img, 5, 7, { "f............f", "ff..........ff" })
    L.map(img, 4, 1, {
      "......iiii......",
      "....iiiiiiii....",
      "...iDDiiiiiiih..",
      "..iDDiiitiiiiih.",
      "..iiiiiiiiiiiih.",
      "hhhhhhhhhhhhhhhh",
      "hhhhhh..........",
    })
    face(img, 9, 11, "open")
    L.set(img, 12, 13, "t")
    L.set(img, 8, 12, "e"); L.set(img, 10, 13, "e"); L.set(img, 15, 13, "e")   -- freckles
  end)

  -- 언니 (said by a girl) / 누나 (said by a boy)
  icon("eonni", function(img) teenGirl(img); speaker(img, girl) end)
  icon("nuna", function(img) teenGirl(img); speaker(img, boy) end)
  -- 오빠 (said by a girl) / 형 (said by a boy)
  icon("oppa", function(img) teenBoy(img); speaker(img, girl) end)
  icon("hyeong", function(img) teenBoy(img); speaker(img, boy) end)

  -- child portrait helpers for 아들/딸 and toddler for 남동생/여동생
  local function child(img, girlish)
    if girlish then
      body(img, 5, 17, 20, "l", "k", "j")
      L.map(img, 10, 17, { "tt.tt", ".ttt." })
    else
      body(img, 5, 17, 20, "m", "n", "o")
      L.map(img, 10, 17, { "t...t", ".ttt." })
    end
    head(img, 7, 6, 18, 17)
    if girlish then
      L.rect(img, 6, 9, 2, 8, "f"); L.rect(img, 18, 9, 2, 8, "f")
      L.map(img, 6, 6, { "..ffffffff..", ".ffeeffffff.", "fffffffffffff", "fff.f..f.fff", "ff........ff" })
      L.rect(img, 5, 12, 2, 6, "f"); L.rect(img, 19, 12, 2, 6, "f")   -- pigtails
      L.map(img, 4, 11, { "D.D", "DiD", "D.D" }); L.map(img, 18, 11, { "D.D", "DiD", "D.D" })
    else
      L.map(img, 6, 6, { "..ffffffff..", ".ffeeffffff.", "fffffffffff.", "fff.ff.f.ff.", "f..........f" })
    end
    face(img, 10, 12, "smile")
  end
  -- parent's big hand (red sleeve, like 엄마) resting on the head
  local function parentHand(img)
    stamp(img, 1, 1, {
      "........EEEEEEE.....",
      "hhh..EEEEEEEEEEEE...",
      "iiiEEEEEEEEEEEEEEE..",
      "iiiEEEEEEEEEEEEEEEE.",
      "hhhFFFFFEEEFEEFEEFE.",
      ".........EEFEEFEEFE.",
      "..........EF.EF.EF..",
    })
  end
  icon("adeul", function(img) child(img, false); parentHand(img) end)
  icon("ttal", function(img) child(img, true); parentHand(img) end)

  -- toddler holding an older sibling's hand (blue hoodie sleeve, like 오빠)
  local function toddler(img, girlish)
    body(img, 8, 16, 21, girlish and "t" or "t", girlish and "D" or "s", girlish and "C" or "r")
    L.map(img, 13, 17, { "ttt", "tut" })
    L.ebox(img, 7, 3, 21, 16, function(nx, ny)
      if nx > 0.55 or (ny > 0.7 and nx > -0.2) then return "F" end
      return "E"
    end)
    if girlish then
      L.map(img, 11, 1, { "f.f.f", ".fff.", ".iDi." })        -- sprout ponytail with bow
      L.map(img, 9, 4, { "..ffffff...", ".ffffffff.." })
    else
      L.map(img, 13, 1, { ".ff", "f..", "ff." })                -- single curl
      L.map(img, 9, 4, { "...ffff....", ".ffeefff..." })
    end
    -- big round eyes, pacifier-free grin
    L.map(img, 10, 9, { "zz....zz", "zt....zt", "zz....zz" })
    L.set(img, 9, 12, "D"); L.set(img, 10, 12, "D"); L.set(img, 17, 12, "D"); L.set(img, 18, 12, "D")
    L.map(img, 13, 12, { "h.h", ".h." }); L.set(img, 14, 12, "E")
    -- sibling's hand from the left holding the toddler's little hand
    stamp(img, 1, 15, {
      "qq.........",
      "rrr.EEE....",
      "rrrEEEEEEE.",
      "rrrEEEEEEEE",
      "qqq.FFFFFF.",
    })
  end
  icon("namdongsaeng", function(img) toddler(img, false) end)
  icon("yeodongsaeng", function(img) toddler(img, true) end)
end
