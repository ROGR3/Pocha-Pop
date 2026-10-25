-- Travel words (부산 harbour ticket booth): transport, documents, places.
-- 24x24, outline added by icons.lua.
return function(icon, L, H)
  -- 기차: KTX bullet train nose, side view heading left
  icon("gicha", function(img)
    L.map(img, 1, 4, {
      "............tttttttttt",
      "..........ttuuuuuuuuuu",
      "........ttuuuuuuuuuuuu",
      "......ttuzzzzuyyyuyyyu",
      ".....tuzzszzzuyryuyryu",
      "....tuzszzzzuuyyyuyyyu",
      "...tuuuuuuuuuuuuuuuuuu",
      "..tuuuuuuuuuuuuuuuuuuu",
      ".tuuuurrrrrrrrrrrrrrrr",
      "tuurrrqqqqqqqqqqqqqqqq",
      "vvvqqqvvvvvvvvvvvvvvvv",
      ".vvvvvvvvvvvvvvvvvvvvv",
      "..wwwwwwwwwwwwwwwwwwww",
      "....xzzx....xzzx..xzzx",
    })
    L.hline(img, 1, 22, 18, "f"); L.hline(img, 1, 22, 19, "e")
    for x = 2, 22, 3 do L.set(img, x, 19, "f") end
    L.set(img, 2, 13, "l")
  end)

  -- 버스: green city bus, front view
  icon("beoseu", function(img)
    L.map(img, 1, 1, {
      "...mmmmmmmmmmmmmmmm...",
      "..mmzzzzzzzzzzzzzzmn..",
      "..mmzkkkkkkzzlzzzzmn..",
      "..mmzzzzzzzzzzzzzzmn..",
      "..mmmmmmmmmmmmmmmmmn..",
      ".xmssssssssssssssrrnx.",
      "x.msstssssssssssrrrn.x",
      "x.mststsssssssrrrrrn.x",
      "x.msstsssssssrrrrrrn.x",
      "x.mssssssssrrrrrrrrn.x",
      "..msssssrrrrrrrrrrrn..",
      "..mrrrrrrrrrrrrrrrrn..",
      "..mmmmmmmmmmmmmmmmmn..",
      "..mmmmmmmmmmmmmmmmmn..",
      "..mtlmmmmmmmmmmmmltn..",
      "..mllmmmmmmmmmmmmlln..",
      "..nnnnnnnnnnnnnnnnnn..",
      "..uuuuuuuuuuuuuuuuuv..",
      "..wwwwwwwwwwwwwwwwwx..",
      "..zzz............zzz..",
      "..zzz............zzz..",
    })
    L.hline(img, 6, 16, 13, "n")
  end)

  -- 지하철: metro car front with an orange line stripe, in a tunnel arch
  icon("jihacheol", function(img)
    L.ebox(img, 1, 1, 22, 34, function(nx, ny, x, y)
      if nx * nx + ny * ny > 0.7 then return ((x + (y % 2) * 2) % 4 == 0) and "x" or "w" end
      return "y"
    end, { y1 = 22 })
    L.map(img, 4, 5, {
      "..tuuuuuuuuuuv..",
      ".tuuuuuuuuuuuuv.",
      "tuxxxxxuuxxxxxuv",
      "tuxsxxxuuxsxxxuv",
      "tusxxxxuuxxxxxuv",
      "tuxxxxxuuxxxxxuv",
      "tuuuuuuuuuuuuuuv",
      "jjjjjjjjjjjjjjjb",
      "kkkkkkkkkkkkkkkj",
      "tuuuuuuuuuuuuuuv",
      "tlluuuuuuuuuullv",
      "tuuuuuuuuuuuuuuv",
      "vvvvvvvwwvvvvvvw",
      ".wwzzw.ww.wzzww.",
    })
    L.line(img, 6, 19, 2, 22, "v"); L.line(img, 17, 19, 21, 22, "v")
    L.hline(img, 4, 19, 21, "f"); L.hline(img, 3, 20, 22, "f")
  end)

  -- 택시: orange Korean taxi with roof sign, side view
  icon("taeksi", function(img)
    L.map(img, 1, 3, {
      "........llllll........",
      "........kkkkkk........",
      ".........bbbb.........",
      "......jjjjjjjjjjj.....",
      ".....jrsssrjrrrsrj....",
      "....jrsstrrjrrsrrrj...",
      "...jrssrrrrjrrrrrrrj..",
      ".kkkkkkkkkkkkkkkkkkkkj",
      "kkjjjjjjjjjjbjjjjjjjjj",
      "ljjjjjjjjjjjbjjjjjjjlj",
      "jjjjjjjjjjjjbjjjjjjjjb",
      "jbzzzbbbbbbbbbbbzzzbbb",
      ".zzvvz.........zzvvz..",
      ".zvwwvz.......zvwwvz..",
      ".zvwwvz.......zvwwvz..",
      "..zvvz.........zvvz...",
    })
    L.hline(img, 5, 7, 12, "t"); L.set(img, 10, 4, "h"); L.set(img, 11, 4, "h"); L.set(img, 12, 4, "h")
  end)

  -- 표: paper ticket with perforated stub
  icon("pyo", function(img)
    L.map(img, 1, 5, {
      "tttttttttttttt.ccccccc",
      "tiiiiiiiiiiiih.ciiiiic",
      "tiiiiiiiiiiiih.chhhhhc",
      "tcccccccccccccc.cccccd",
      ".cfffffffcccccccccccd.",
      ".cccccccccccccc.cffcd.",
      ".cffffcccccccccccccd..",
      ".ccccccccqqqqqq.cffcd.",
      "tccccccccqrrrrqccccccd",
      "tcfcfcfcfqqqqqq.cffccd",
      "tccccccccccccccccccccd",
      "ddddddddddddddd.dddddd",
    })
    -- perforation notches
    L.erase(img, 16, 5); L.erase(img, 16, 16)
  end)

  -- 여권: dark blue passport with gold emblem
  icon("yeogwon", function(img)
    L.rect(img, 5, 2, 15, 20, "c"); L.vline(img, 20, 3, 21, "d"); L.hline(img, 6, 20, 21, "d")
    L.rect(img, 3, 1, 16, 20, "x")
    L.vline(img, 3, 1, 20, "w"); L.hline(img, 3, 18, 1, "w"); L.vline(img, 4, 2, 20, "y")
    L.vline(img, 18, 2, 20, "y"); L.hline(img, 4, 18, 20, "y")
    L.hline(img, 7, 15, 4, "k")
    L.ebox(img, 7, 7, 15, 15, function(nx, ny)
      local d = nx * nx + ny * ny
      if d > 0.62 then return ny < 0 and "l" or "k" end
      if d < 0.12 then return "k" end
      return nil
    end)
    L.map(img, 9, 9, { "..l..", ".lkl.", "lkkkk", ".kkk.", "..k.." })
    L.hline(img, 8, 14, 17, "k")
    L.rect(img, 10, 18, 3, 1, "k")
  end)

  -- 공항: airplane over a control tower
  icon("gonghang", function(img)
    L.map(img, 13, 3, {
      ".ttttttt.",
      "tssssssrr",
      "tsysysyrq",
      "xxxxxxxxx",
      ".uuuuuuv.",
      "..tuuuv..",
      "..tuuuv..",
      "..tuyuv..",
      "..tuuuv..",
      "..tuuuv..",
      "..tuyuv..",
      "..tuuuv..",
      ".tuuuuuv.",
      ".tuuuuuv.",
      "tuuyyyuuv",
      "vvvvvvvvv",
    })
    L.set(img, 17, 2, "w"); L.set(img, 17, 1, "i")
    L.map(img, 1, 6, {
      "rr..........",
      "rrr...qq....",
      ".rrr..qrr...",
      ".ttttttttt..",
      "tsusususuut.",
      ".vuuuuuuuuv.",
      "...vvqrrr...",
      ".....qrr....",
      "......q.....",
    })
    L.hline(img, 1, 22, 22, "w")
  end)

  -- 게이트: boarding gate door under a sign board (plane + arrow)
  icon("geiteu", function(img)
    L.rect(img, 1, 1, 22, 8, "k"); L.hline(img, 1, 22, 1, "l"); L.vline(img, 1, 1, 8, "l")
    L.hline(img, 2, 22, 8, "j"); L.vline(img, 22, 2, 8, "j")
    L.map(img, 3, 2, {
      "...z...",
      "..zzz..",
      ".zzzzz.",
      "zzzzzzz",
      "...z...",
      "..zzz..",
    })
    L.map(img, 12, 2, { "....z....", "....zz...", "zzzzzzz..", "zzzzzzzz.", "....zz...", "....z...." })
    L.rect(img, 4, 10, 16, 13, "v"); L.hline(img, 4, 19, 10, "u"); L.vline(img, 4, 10, 22, "u"); L.vline(img, 19, 11, 22, "w")
    L.rect(img, 6, 12, 12, 11, "x")
    for _, x in ipairs({ 6, 12 }) do
      L.rect(img, x, 12, 6, 11, "w"); L.rect(img, x + 1, 13, 4, 7, "r")
      L.line(img, x + 1, 16, x + 4, 13, "s"); L.set(img, x + 1, 13, "t")
    end
    L.vline(img, 11, 15, 17, "u"); L.vline(img, 12, 15, 17, "u")
    L.vline(img, 2, 9, 22, "w"); L.vline(img, 21, 9, 22, "w")
  end)

  -- 출구: green emergency exit sign with a running man
  icon("chulgu", function(img)
    L.rect(img, 9, 2, 6, 2, "v"); L.hline(img, 9, 14, 2, "u")
    L.rect(img, 1, 4, 22, 16, "m")
    L.hline(img, 1, 22, 4, "m"); L.vline(img, 22, 4, 19, "n"); L.hline(img, 1, 22, 19, "n")
    L.rect(img, 2, 5, 20, 14, "n")
    L.rect(img, 3, 6, 18, 12, "m")
    -- door
    L.rect(img, 15, 7, 5, 10, "t"); L.rect(img, 16, 8, 3, 9, "n")
    -- running man
    L.map(img, 4, 7, {
      "......tt..",
      "......tt..",
      "...ttttt..",
      "..tt.ttt.t",
      ".t...tt.tt",
      "....ttt...",
      "...tt.tt..",
      ".ttt...t..",
      ".t.....tt.",
      "..........",
    })
    L.map(img, 12, 11, { "t.", "tt", "t." })
  end)

  -- 역: station building with dome and clock
  icon("yeok", function(img)
    L.map(img, 7, 1, {
      "....nn....",
      "...mnnn...",
      "..mmnnnn..",
      ".mmmnnnno.",
      "mmmnnnnnoo",
      "dddddddddd",
      ".ccttttee.",
      ".cttzttte.",
      ".cttzzzte.",
      ".cttttttte",
      ".cettttee.",
    })
    L.rect(img, 1, 11, 22, 11, "a")
    L.hline(img, 1, 22, 11, "c"); L.hline(img, 1, 22, 12, "d")
    L.rect(img, 1, 13, 22, 9, "a"); L.vline(img, 1, 13, 21, "b")
    L.hline(img, 1, 22, 21, "f")
    for _, x in ipairs({ 3, 6, 16, 19 }) do
      L.rect(img, x, 14, 2, 4, "x"); L.set(img, x, 14, "r"); L.hline(img, x, x + 1, 18, "c")
    end
    L.ebox(img, 9, 13, 14, 26, function(nx, ny) return ny < -0.75 and "c" or "y" end, { y1 = 21 })
    L.rect(img, 10, 16, 4, 6, "y"); L.vline(img, 11, 16, 21, "x"); L.vline(img, 12, 16, 21, "x")
    L.hline(img, 1, 22, 22, "v")
  end)

  -- 정류장: bus stop pole with sign and a small shelter
  icon("jeongnyujang", function(img)
    -- shelter
    L.rect(img, 9, 4, 14, 2, "q"); L.hline(img, 9, 22, 4, "r"); L.hline(img, 9, 22, 6, "x")
    L.vline(img, 10, 7, 21, "v"); L.vline(img, 21, 7, 21, "w")
    L.rect(img, 11, 7, 10, 9, "s"); L.vgradient(img, 11, 7, 10, 9, { { 7, "s" }, { 15, "r" } })
    L.line(img, 12, 11, 15, 8, "t"); L.line(img, 13, 12, 16, 9, "t")
    L.rect(img, 11, 15, 10, 2, "e"); L.hline(img, 11, 20, 15, "d"); L.hline(img, 11, 20, 17, "f")
    L.vline(img, 12, 18, 21, "w"); L.vline(img, 19, 18, 21, "w")
    -- pole + round sign
    L.rect(img, 4, 8, 2, 14, "v"); L.vline(img, 4, 8, 21, "u")
    L.ebox(img, 1, 1, 8, 8, function(nx, ny) local d = nx * nx + ny * ny if d > 0.55 then return (nx + ny < 0) and "r" or "q" end return "t" end)
    L.map(img, 3, 3, { "qqqq", "qssq", "qqqq", "z..z" })
    L.hline(img, 1, 22, 22, "w")
  end)

  -- 터미널: terminal building with buses parked in bays
  icon("teomineol", function(img)
    L.rect(img, 1, 3, 22, 9, "u")
    L.hline(img, 1, 22, 2, "t"); L.hline(img, 1, 22, 3, "t")
    L.rect(img, 2, 5, 20, 5, "r")
    for x = 2, 21 do for y = 5, 9 do
      if x % 4 == 1 then L.set(img, x, y, "v") elseif (x + y) % 7 == 0 then L.set(img, x, y, "s") end
    end end
    L.hline(img, 2, 21, 5, "s")
    L.rect(img, 9, 2, 6, 2, "q"); L.hline(img, 10, 13, 2, "l")
    L.hline(img, 0, 23, 11, "w"); L.hline(img, 1, 22, 10, "v")
    for i, c in ipairs({ { "m", "n", "o" }, { "r", "q", "x" }, { "i", "h", "f" } }) do
      local x = 1 + (i - 1) * 8
      L.map(img, x, 12, {
        "111111",
        "1sssr2",
        "1ssrr2",
        "1rrrr2",
        "222222",
        "l2222l",
        "uuuuuv",
        "z....z",
      }, { sub = { ["1"] = c[1], ["2"] = c[2], ["3"] = c[3] } })
      L.set(img, x + 1, 13, "t")
    end
    L.hline(img, 1, 22, 21, "x")
  end)

  -- 배: ferry ship on waves
  icon("bae_boat", function(img)
    L.map(img, 1, 2, {
      "............ii........",
      "............ih........",
      "...........tttt.......",
      "........tuuuuuuuv.....",
      "........uqyqyqyuv.....",
      "....ttttttttttttttt...",
      "....uyyuyyuyyuyyuuv...",
      "tttttttttttttttttttttt",
      ".uuuuuuuuuuuuuuuuuuuv.",
      ".uuuuyuuuyuuuyuuuyuuv.",
      "..iiiiiiiiiiiiiiiiih..",
      "..qqqqqqqqqqqqqqqqqq..",
      "...qqqqqqqqqqqqqqqq...",
    })
    L.map(img, 1, 15, {
      ".tt....tt....tt....tt.",
      "tsrsstsrsstsrsstsrsstr",
      "rrrsrrrrsrrrrsrrrrsrrr",
      "qrrrrqqrrrrqqrrrrqqrrq",
      "qqqqqqqqqqqqqqqqqqqqqq",
      "xqqqxqqqxqqqxqqqxqqqxq",
    })
  end)

  -- 바다: sea waves under a sun with a seagull
  icon("bada", function(img)
    L.ebox(img, 13, 1, 21, 9, function(nx, ny) if nx + ny < -0.6 then return "l" end if nx + ny > 0.7 then return "j" end return "k" end)
    L.map(img, 2, 3, { "tt...tt", "uttttu.", "...u..." })
    L.map(img, 1, 9, {
      "................tt....",
      "..............ttsst...",
      "............tsrrrsst..",
      "..tt.......tsrrqqrst..",
      ".tsst.....tsrrqq.tst..",
      "tsrrst...tsrrqq...t...",
      "srrqrsttssrrqq........",
      "rrqqqrrrrrrqqqqqqqqqq.",
      "rqqqqqqrrqqqqqqqqqqqq.",
      "qqqqxqqqqqqqqxqqqqqqqq",
      "qqxqqqqqqxqqqqqqqxqqqq",
      "qqqqqqqxqqqqqqqqqqqqqq",
      "xxxxxxxxxxxxxxxxxxxxxx",
    })
    L.rect(img, 19, 16, 4, 1, "q")
  end)

  -- 서울: N Seoul Tower on Namsan hill
  icon("seoul", function(img)
    L.vline(img, 11, 1, 3, "u"); L.set(img, 11, 0, "i"); L.set(img, 11, 1, "i")
    L.map(img, 9, 4, {
      "..ttv..",
      ".tuuvv.",
      "tuuuuvw",
      "iiiiiih",
      "tuuuuvw",
      ".wwwww.",
      "..tuv..",
      "..tuv..",
      "..tuv..",
      "..tuv..",
      "..tuv..",
      ".ttuvv.",
    })
    L.ebox(img, 1, 14, 22, 32, function(nx, ny) if nx + ny < -0.75 then return "m" end if nx > 0.35 then return "o" end return "n" end, { y1 = 22 })
    for _, p in ipairs({ { 4, 18 }, { 7, 17 }, { 16, 18 }, { 19, 19 }, { 13, 20 } }) do
      L.map(img, p[1], p[2], { ".m.", "mno", ".o." })
    end
    L.rect(img, 10, 14, 4, 2, "u"); L.hline(img, 10, 13, 14, "t")
  end)

  -- 부산: Gwangan bridge lit at night over the sea
  icon("busan", function(img)
    for _, x in ipairs({ 6, 16 }) do
      L.rect(img, x, 3, 2, 13, "u"); L.vline(img, x, 3, 15, "t"); L.vline(img, x + 1, 3, 15, "v")
      L.hline(img, x, x + 1, 6, "w"); L.hline(img, x, x + 1, 2, "C")
    end
    -- main cables
    L.line(img, 7, 3, 11, 10, "D"); L.line(img, 11, 10, 12, 10, "D"); L.line(img, 12, 10, 16, 3, "D")
    L.line(img, 6, 3, 1, 10, "D"); L.line(img, 17, 3, 22, 10, "D")
    for _, x in ipairs({ 3, 9, 10, 13, 14, 20 }) do
      for y = 5, 12 do
        if not L.isOpaque(img, x, y) then L.set(img, x, y, "C") else break end
      end
    end
    -- deck
    L.hline(img, 1, 22, 12, "u"); L.hline(img, 1, 22, 13, "w")
    for x = 1, 22, 2 do L.set(img, x, 12, "l") end
    -- sea with reflections
    L.rect(img, 1, 16, 22, 7, "q")
    L.hline(img, 1, 22, 16, "r")
    L.map(img, 1, 17, {
      ".....C.........C......",
      "rr...lC....rr..lC...rr",
      "......C.........C.....",
      "..rr....rrr.....rr....",
      "xxxxxxxxxxxxxxxxxxxxxx",
    })
    for x = 2, 21 do L.set(img, x, 14, "y"); L.set(img, x, 15, "q") end
  end)

  -- 인천: Incheon Chinatown paifang gate
  icon("incheon", function(img)
    -- centre roof
    L.map(img, 4, 1, {
      "n..............n",
      "mnmnmnmnmnmnmnmn",
      ".nonononononono.",
      "..hhhhhhhhhhhh..",
    })
    -- side roofs
    L.map(img, 1, 8, { "n.....", "mnmnmn", ".onono", "..hhhh" })
    L.map(img, 17, 8, { ".....n", "nmnmnm", "onono.", "hhhh.." })
    L.rect(img, 5, 5, 14, 4, "i"); L.hline(img, 5, 18, 5, "D")
    L.rect(img, 8, 6, 8, 3, "k"); L.hline(img, 8, 15, 6, "l"); L.map(img, 9, 7, { "f.ff.f" })
    -- pillars
    for _, x in ipairs({ 4, 9, 14, 19 }) do
      L.rect(img, x, 9, 2, 11, "i"); L.vline(img, x + 1, 9, 19, "h")
      L.rect(img, x - 1, 19, 4, 3, "u"); L.hline(img, x - 1, x + 2, 21, "v")
    end
    L.hline(img, 4, 20, 12, "h"); L.hline(img, 4, 20, 11, "i")
  end)

  -- 제주도: island with Hallasan and a dol hareubang
  icon("jejudo", function(img)
    L.map(img, 1, 3, {
      "......mm..nn..........",
      ".....mmnoonnn.........",
      "....mmnnnnnnno........",
      "...mmnnnnnnnnoo.......",
      "..mmnnnnnnnnnnoo......",
      ".mmnnnnnnnnnnnnoo.....",
      "mmnnnnnnnnnnnnnnoo....",
    })
    L.map(img, 6, 3, { "tt..tt" }); L.map(img, 7, 4, { "u.." })
    L.rect(img, 0, 10, 24, 0, "n")
    L.map(img, 1, 10, {
      "dnnnnnnnnnnnnnnnnoo...",
      "ddddddddddddddddddd...",
      "rrrrrrrrrrrrrrrrrrrrrr",
      "srrrrsrrrrrsrrrrrrsrrr",
      "qqqqqqqqqqqqqqqqqqqqqq",
    })
    -- dol hareubang
    L.map(img, 13, 6, {
      "..vvvvv...",
      ".vuuuuuvw.",
      "wwwwwwwwwx",
      ".uuuuuuvw.",
      ".uzuuzuvw.",
      ".uuvvuuvw.",
      ".uuvvuuvw.",
      ".uuuuuuvw.",
      ".uvvvvuvw.",
      "uuuuvvuuvw",
      "uvvuuuvvvw",
      "uuuuuuuuvw",
      "uuuuuuuvvw",
      ".uuuuuuvw.",
      ".wwwwwwww.",
    })
    L.map(img, 1, 17, {}, {})
    L.ebox(img, 2, 17, 7, 22, function(nx, ny) if nx + ny < -0.6 then return "k" end if nx + ny > 0.6 then return "b" end return "j" end)
    L.map(img, 4, 15, { ".m", "mn" }); L.set(img, 3, 18, "l")
  end)

  -- 강남: cluster of glass skyscrapers
  icon("gangnam", function(img)
    local function tower(x, y, w, cols)
      L.rect(img, x, y, w, 22 - y, cols[2])
      L.vline(img, x, y, 21, cols[1]); L.vline(img, x + w - 1, y, 21, cols[3])
      for yy = y + 2, 20, 2 do for xx = x + 1, x + w - 2, 2 do L.set(img, xx, yy, cols[4]) end end
      L.hline(img, x, x + w - 1, y, cols[1])
    end
    tower(14, 5, 6, { "s", "r", "q", "s" })
    tower(2, 8, 6, { "u", "v", "w", "s" })
    tower(7, 2, 7, { "s", "r", "q", "t" })
    L.vline(img, 10, 0, 1, "u"); L.set(img, 10, 0, "i")
    L.map(img, 7, 1, { "..ttt.." })
    tower(18, 11, 5, { "u", "w", "x", "l" })
    L.line(img, 8, 6, 12, 2, "t")
    L.hline(img, 1, 22, 22, "x")
  end)

  -- 여행: suitcase with travel stickers
  icon("yeohaeng", function(img)
    L.map(img, 8, 1, { "..ffff..", ".f....f.", ".f....f." })
    L.rect(img, 3, 4, 18, 16, "b")
    L.ebox(img, 3, 4, 20, 19, function(nx, ny) return nil end)
    L.hline(img, 4, 19, 4, "d"); L.vline(img, 3, 5, 18, "d")
    L.vline(img, 20, 5, 18, "e"); L.hline(img, 4, 19, 19, "e")
    L.rect(img, 4, 5, 16, 14, "b")
    L.hline(img, 4, 19, 5, "d")
    for _, x in ipairs({ 7, 16 }) do L.vline(img, x, 4, 19, "f"); L.vline(img, x + 1, 4, 19, "e") end
    L.erase(img, 3, 4); L.erase(img, 20, 4); L.erase(img, 3, 19); L.erase(img, 20, 19)
    -- stickers
    L.ebox(img, 9, 7, 14, 12, function(nx, ny) local d = nx * nx + ny * ny return d < 0.25 and "i" or "l" end)
    L.map(img, 4, 13, { "rrr", "rtr", "rrr" })
    L.map(img, 11, 14, { "mmmm", "mmtm", "nnnn" })
    L.map(img, 17, 8, { "DD", "CD", "DD" })
    -- wheels
    L.map(img, 4, 20, { "zz" }); L.map(img, 18, 20, { "zz" })
    L.set(img, 4, 21, "w"); L.set(img, 19, 21, "w")
  end)

  -- 출발: departure board with a take-off pictogram
  icon("chulbal", function(img)
    L.rect(img, 1, 2, 22, 19, "y")
    L.hline(img, 1, 22, 2, "x"); L.vline(img, 1, 2, 20, "x"); L.hline(img, 1, 22, 20, "z"); L.vline(img, 22, 2, 20, "z")
    L.rect(img, 2, 3, 20, 6, "k"); L.hline(img, 2, 21, 3, "l")
    L.map(img, 3, 3, {
      "........z...",
      "z......zz...",
      "zz...zzz....",
      ".zzzzzz.....",
      "..zzz.......",
      ".zz.........",
    })
    L.map(img, 15, 4, { "...z..", "....z.", "zzzzzz", "....z.", "...z.." })
    local rows = { "kkkk.kkkkkk.kk", "kkkkkk.kkk....", "kkk.kkkkkkk.kk", "kkkkk.kkkk....", "kk.kkkkkk.kkk." }
    for i, st in ipairs({ "m", "m", "i", "m", "m" }) do
      local y = 8 + i * 2
      L.map(img, 3, y, { rows[i] })
      L.rect(img, 18, y, 3, 1, st)
    end
    L.vline(img, 6, 21, 22, "w"); L.vline(img, 17, 21, 22, "w")
  end)
end
