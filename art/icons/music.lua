-- 홍대 (club street): music, entertainment, leisure. 24x24, outline added by icons.lua.
return function(icon, L, H)
  local floor = math.floor
  local function round(v) return floor(v + 0.5) end

  -- Thick shaded tube along a polyline: pts = { {x, y, r}, ... }.
  local function tube(img, pts, cols)
    local dots = {}
    for k = 1, #pts - 1 do
      local a, b = pts[k], pts[k + 1]
      local n = math.max(math.abs(b[1] - a[1]), math.abs(b[2] - a[2]), 1)
      for s = 0, n do
        local t = s / n
        dots[#dots + 1] = { round(a[1] + (b[1] - a[1]) * t), round(a[2] + (b[2] - a[2]) * t), round(a[3] + (b[3] - a[3]) * t) }
      end
    end
    for _, d in ipairs(dots) do L.ellipse(img, d[1] + 1, d[2] + 1, d[3], d[3], cols[3]) end
    for _, d in ipairs(dots) do L.ellipse(img, d[1], d[2], d[3], d[3], cols[2]) end
    for _, d in ipairs(dots) do if d[3] >= 2 then L.ellipse(img, d[1] - 1, d[2] - 1, d[3] - 2, d[3] - 2, cols[1]) end end
  end

  local function sparkle(img, x, y, c) L.map(img, x, y, { "." .. c .. ".", c .. c .. c, "." .. c .. "." }) end

  -- 노래: two beamed notes and a small floating note
  icon("norae", function(img)
    local function beamY(x) return 5 - round((x - 10) * 0.3) end
    L.rect(img, 10, 4, 2, 14, "q"); L.vline(img, 10, 6, 16, "r")
    L.rect(img, 19, 2, 2, 13, "q"); L.vline(img, 19, 4, 13, "r")
    for x = 10, 20 do
      local y = beamY(x)
      L.vline(img, x, y - 1, y + 1, "q"); L.set(img, x, y - 1, "r")
    end
    local function head(x0, y0)
      L.ebox(img, x0, y0, x0 + 6, y0 + 4, function(nx, ny)
        if nx < -0.1 and ny < -0.1 then return "r" end
        if nx + ny > 0.7 then return "x" end
        return "q"
      end)
      L.set(img, x0 + 2, y0 + 1, "t")
    end
    head(5, 15); head(14, 12)
    -- small pink note
    L.ebox(img, 1, 9, 4, 12, function(nx, ny) return (nx < 0 and ny < 0) and "D" or "C" end)
    L.vline(img, 4, 3, 10, "C"); L.map(img, 5, 3, { "C.", "CC", ".C" })
    sparkle(img, 17, 18, "l")
  end)

  -- 가수: singer with long hair holding a microphone
  icon("gasu", function(img)
    L.ebox(img, 2, 15, 19, 30, function(nx, ny)
      if nx < -0.55 then return "D" elseif nx > 0.5 then return "h" end
      return "i"
    end, { y1 = 22 })
    L.ebox(img, 3, 1, 18, 20, function(nx, ny)
      if nx < -0.3 and ny < -0.5 then return "x" end
      return "y"
    end, { y1 = 16 })
    L.rect(img, 9, 13, 4, 3, "F")
    L.ebox(img, 5, 4, 16, 15, function(nx, ny) return nx > 0.6 and "F" or "E" end)
    L.ebox(img, 4, 1, 17, 9, function(nx, ny)
      if nx < -0.3 and ny < -0.3 then return "x" end
      return "y"
    end, { y1 = 6 })
    L.map(img, 7, 7, { "yy......", "y..y" })
    -- closed happy eyes, cheeks, open mouth
    L.map(img, 7, 9, { "z.....z.", ".zz..zz." })
    L.set(img, 8, 9, "."); L.set(img, 7, 9, "z")
    L.set(img, 6, 11, "D"); L.set(img, 15, 11, "D")
    L.map(img, 10, 12, { "hh", "ii" })
    -- microphone
    L.line(img, 16, 15, 20, 20, "z"); L.line(img, 17, 15, 21, 20, "y")
    L.ebox(img, 14, 10, 19, 15, function(nx, ny)
      if nx < -0.2 and ny < -0.2 then return "t" end
      if (nx + ny) > 0.6 then return "v" end
      return "u"
    end)
    L.set(img, 16, 12, "v"); L.set(img, 17, 13, "w"); L.set(img, 15, 13, "v")
    L.map(img, 17, 16, { ".EE.", "EEEE", "EEEF", ".FF." })
    L.map(img, 20, 1, { ".kk", ".k.", "kk.", "kk." })
  end)

  -- 걸그룹: three girls in matching pink stage outfits
  icon("geolgeurup", function(img)
    local function girl(x, y, h1, h2)
      L.map(img, x, y, {
        ".2111.",
        "211111",
        "11EEE1",
        "1EzEzE1",
        "1DEEED1",
        "11EiE11",
        ".1FEF1.",
        "ECtDtCE",
        "ECDDDCE",
        "E.CDC.E",
        ".CDDDC.",
        "CDDDDDC",
        "CCCCCCB",
        ".E...E.",
        ".E...E.",
        ".z...z.",
      }, { sub = { ["1"] = h1, ["2"] = h2 } })
    end
    girl(1, 6, "f", "e")
    girl(15, 6, "k", "l")
    girl(8, 3, "y", "x")
    sparkle(img, 1, 1, "l"); sparkle(img, 19, 1, "s")
  end)

  -- 콘서트: stage with curtains, spotlights, performer and lightstick crowd
  icon("konseoteu", function(img)
    L.rect(img, 1, 1, 22, 16, "y")
    for y = 4, 15 do
      local t = (y - 4) / 11
      for x = 1, 22 do
        local inA = x >= 5 + 4 * t and x <= 5 + 9 * t
        local inB = x >= 18 - 9 * t and x <= 18 - 4 * t
        if inA and inB then L.set(img, x, y, "l")
        elseif inA or inB then L.set(img, x, y, L.dither(x, y, 0.5, "y", "k")) end
      end
    end
    -- curtains + valance
    for y = 1, 16 do
      L.hline(img, 1, 3, y, "h"); L.set(img, 2, y, "i")
      L.hline(img, 20, 22, y, "h"); L.set(img, 21, y, "i")
    end
    L.hline(img, 1, 22, 1, "h"); L.hline(img, 1, 22, 2, "i")
    for x = 1, 22, 3 do L.set(img, x + 1, 3, "i") end
    L.rect(img, 4, 3, 2, 2, "v"); L.rect(img, 18, 3, 2, 2, "v")
    L.set(img, 5, 4, "l"); L.set(img, 18, 4, "l")
    -- performer
    L.rect(img, 11, 8, 2, 2, "E"); L.hline(img, 11, 12, 7, "y")
    L.rect(img, 10, 10, 4, 4, "A"); L.set(img, 10, 10, "D")
    L.vline(img, 11, 14, 14, "z"); L.vline(img, 12, 14, 14, "z")
    L.set(img, 14, 9, "E"); L.set(img, 13, 10, "E")
    -- stage floor
    L.rect(img, 1, 15, 22, 3, "e"); L.hline(img, 1, 22, 15, "d"); L.hline(img, 1, 22, 17, "f")
    -- crowd with lightsticks
    for i, cx in ipairs({ 3, 8, 13, 18, 21 }) do
      L.ebox(img, cx - 2, 18, cx + 2, 23, function(nx, ny) return (nx < -0.2 and ny < -0.2) and "w" or "x" end, { y1 = 22 })
    end
    for _, p in ipairs({ { 5, "s" }, { 10, "D" }, { 16, "s" }, { 20, "l" } }) do
      L.vline(img, p[1], 16, 17, p[2]); L.set(img, p[1], 18, "u"); L.set(img, p[1], 19, "u")
    end
  end)

  -- 케이팝: glowing lightstick with a heart
  icon("keipap", function(img)
    L.ebox(img, 4, 1, 19, 16, function(nx, ny)
      local d = nx * nx + ny * ny
      if d > 0.72 then return (nx < 0 and ny < 0.2) and "t" or "u" end
      if d < 0.3 or (nx < -0.2 and ny < -0.2) then return "D" end
      return "C"
    end)
    L.map(img, 7, 5, {
      ".AAA..AAA.",
      "AtDAAAAAAh",
      "ADAAAAAAAh",
      "AAAAAAAAAh",
      ".AAAAAAAh.",
      "..AAAAAh..",
      "...AAAh...",
      "....Ah....",
    })
    L.set(img, 6, 4, "t"); L.set(img, 7, 3, "t")
    L.rect(img, 8, 15, 8, 2, "C"); L.hline(img, 8, 15, 15, "D")
    L.rect(img, 10, 17, 4, 6, "u"); L.vline(img, 10, 17, 22, "t"); L.vline(img, 13, 17, 22, "v")
    L.set(img, 11, 19, "A"); L.set(img, 12, 19, "i")
    L.hline(img, 1, 2, 9, "l"); L.hline(img, 21, 22, 9, "l")
    L.set(img, 2, 3, "l"); L.set(img, 3, 4, "l"); L.set(img, 21, 3, "l"); L.set(img, 20, 4, "l")
    L.set(img, 3, 14, "l"); L.set(img, 2, 15, "l"); L.set(img, 20, 14, "l"); L.set(img, 21, 15, "l")
  end)

  -- 랩: boombox
  icon("raep", function(img)
    L.rect(img, 5, 2, 14, 2, "w"); L.hline(img, 5, 18, 2, "v")
    L.rect(img, 5, 2, 2, 5, "w"); L.rect(img, 17, 2, 2, 5, "w")
    L.rect(img, 1, 6, 22, 14, "i")
    L.hline(img, 1, 22, 6, "D"); L.vline(img, 1, 6, 19, "D")
    L.hline(img, 1, 22, 19, "h"); L.vline(img, 22, 7, 19, "h")
    local function speaker(x0)
      L.ebox(img, x0, 9, x0 + 7, 16, function(nx, ny)
        local d = nx * nx + ny * ny
        if d > 0.7 then return "z" end
        if d < 0.12 then return "z" end
        if nx < -0.1 and ny < -0.1 then return "w" end
        return "x"
      end)
      L.set(img, x0 + 2, x0 == 2 and 11 or 11, "v")
    end
    speaker(2); speaker(14)
    L.rect(img, 10, 11, 4, 4, "z"); L.rect(img, 10, 12, 4, 2, "x")
    L.set(img, 10, 12, "u"); L.set(img, 13, 12, "u")
    L.set(img, 10, 8, "l"); L.set(img, 12, 8, "m"); L.set(img, 13, 8, "s")
    L.hline(img, 3, 8, 8, "h"); L.hline(img, 15, 20, 8, "h")
    L.hline(img, 9, 14, 17, "h")
    L.rect(img, 3, 20, 3, 1, "z"); L.rect(img, 18, 20, 3, 1, "z")
    -- sound waves
    L.map(img, 1, 1, { ".l", "l." }); L.map(img, 21, 1, { "l.", ".l" })
  end)

  -- 재즈: saxophone
  icon("jaejeu", function(img)
    tube(img, {
      { 5, 4, 1 }, { 9, 7, 1 }, { 10, 9, 2 }, { 10, 15, 2 }, { 11, 18, 2 }, { 13, 20, 2 },
      { 16, 20, 2 }, { 18, 18, 2 }, { 19, 15, 2 }, { 19, 11, 3 }, { 19, 9, 3 },
    }, { "l", "k", "j" })
    L.ebox(img, 15, 4, 22, 8, function(nx, ny) return ny < -0.2 and "l" or "k" end)
    L.ebox(img, 16, 5, 21, 7, "f"); L.hline(img, 17, 20, 7, "a")
    L.map(img, 1, 1, { "zz..", "zyy.", ".yy.", "...k" })
    for _, y in ipairs({ 10, 12, 14, 16 }) do L.set(img, 12, y, "c"); L.set(img, 13, y, "e") end
    L.set(img, 17, 12, "c"); L.set(img, 17, 14, "c")
    L.map(img, 1, 12, { ".l.", "l.l" }); L.map(img, 2, 16, { "l", ".", "l" })
  end)

  -- 피아노: black upright piano with keys
  icon("piano", function(img)
    L.rect(img, 1, 2, 22, 2, "x"); L.hline(img, 1, 22, 2, "w")
    L.rect(img, 2, 4, 20, 16, "y")
    L.vline(img, 2, 4, 19, "x"); L.vline(img, 21, 4, 19, "z")
    L.rect(img, 7, 5, 10, 5, "c"); L.vline(img, 16, 5, 9, "d")
    for _, y in ipairs({ 6, 8 }) do L.hline(img, 8, 15, y, "w") end
    L.set(img, 9, 7, "z"); L.set(img, 13, 7, "z")
    L.rect(img, 1, 10, 22, 2, "x"); L.hline(img, 1, 22, 10, "w")
    L.rect(img, 2, 12, 20, 4, "t")
    for k = 0, 6 do
      local dv = 2 + 3 * k + 2
      if dv <= 21 then L.vline(img, dv, 12, 15, "u") end
      if k == 0 or k == 1 or k == 3 or k == 4 or k == 5 then
        L.rect(img, dv, 12, 2, 2, "z")
      end
    end
    L.hline(img, 2, 21, 16, "z")
    L.rect(img, 3, 17, 18, 2, "y"); L.rect(img, 5, 17, 14, 2, "x")
    L.rect(img, 2, 20, 2, 2, "y"); L.rect(img, 20, 20, 2, 2, "y")
    L.set(img, 10, 20, "k"); L.set(img, 13, 20, "k")
  end)

  -- 드럼: drum kit with cymbals
  icon("deureom", function(img)
    L.vline(img, 3, 5, 20, "v"); L.line(img, 3, 20, 1, 22, "v"); L.line(img, 3, 20, 5, 22, "v")
    L.vline(img, 20, 3, 20, "v"); L.line(img, 20, 20, 18, 22, "v"); L.line(img, 20, 20, 22, 22, "v")
    L.ebox(img, 1, 4, 7, 6, function(nx, ny) return ny < 0 and "l" or "k" end); L.set(img, 6, 6, "j")
    L.ebox(img, 16, 2, 22, 4, function(nx, ny) return ny < 0 and "l" or "k" end); L.set(img, 21, 4, "j")
    -- two toms
    for _, x0 in ipairs({ 5, 13 }) do
      L.rect(img, x0, 7, 6, 4, "i"); L.vline(img, x0, 7, 10, "D"); L.vline(img, x0 + 5, 7, 10, "h")
      L.ebox(img, x0, 5, x0 + 5, 8, function(nx, ny) return nx < 0 and "t" or "c" end)
      L.set(img, x0 + 2, 9, "u")
    end
    -- bass drum
    L.ebox(img, 5, 10, 18, 22, function(nx, ny)
      local d = nx * nx + ny * ny
      if d > 0.68 then
        if nx + ny < -0.5 then return "D" elseif nx + ny > 0.5 then return "h" end
        return "i"
      end
      if nx + ny > 0.6 then return "u" end
      return "t"
    end)
    L.hline(img, 8, 15, 16, "i"); L.hline(img, 7, 16, 17, "i"); L.hline(img, 8, 15, 18, "h")
    L.map(img, 10, 13, { "..k..", ".kkk." }, {})
    L.set(img, 8, 12, "t"); L.set(img, 7, 13, "c")
  end)

  -- 영화: clapperboard
  icon("yeonghwa", function(img)
    L.rect(img, 2, 10, 19, 12, "y")
    L.vline(img, 2, 10, 21, "x"); L.hline(img, 2, 20, 21, "z")
    L.hline(img, 4, 12, 13, "u"); L.hline(img, 14, 18, 13, "u")
    L.hline(img, 4, 18, 16, "v"); L.hline(img, 4, 10, 19, "v"); L.hline(img, 12, 16, 19, "v")
    L.vline(img, 12, 12, 20, "x")
    for y = 7, 9 do for x = 2, 20 do
      L.set(img, x, y, (floor((x - y + 30) / 3) % 2 == 0) and "t" or "z")
    end end
    for x = 2, 21 do
      local yb = 6 - round((x - 2) * 4 / 19)
      for y = yb - 2, yb do
        L.set(img, x, y, (floor((x + y) / 3) % 2 == 0) and "t" or "z")
      end
      L.set(img, x, yb - 2, (floor((x + yb - 2) / 3) % 2 == 0) and "t" or "y")
    end
    L.rect(img, 2, 5, 2, 3, "u"); L.set(img, 2, 5, "t")
  end)

  -- 드라마: flat TV with a couple and a heart
  icon("deurama", function(img)
    L.rect(img, 1, 2, 22, 16, "y"); L.hline(img, 1, 22, 2, "x"); L.vline(img, 1, 2, 17, "x")
    L.vgradient(img, 2, 3, 20, 14, { { 3, "B" }, { 16, "C" } })
    L.rect(img, 10, 18, 4, 2, "x"); L.rect(img, 6, 20, 12, 2, "y"); L.hline(img, 6, 17, 20, "x")
    local function person(x, hair, shirt, flip)
      L.map(img, x, 6, {
        ".hhhh.",
        "hhhhhh",
        "hEEEEh",
        "hEzEzE",
        "hEEEEE",
        ".EEDE.",
        "..EE..",
        ".ssss.",
        "ssssss",
        "ssssss",
      }, { sub = { h = hair, s = shirt }, flip = flip })
    end
    person(3, "f", "q", false)
    person(15, "y", "m", true)
    L.map(img, 9, 6, { ".A.A.", "AAAAA", "AAAAA", ".AAA.", "..A.." })
    L.set(img, 10, 7, "t")
    L.set(img, 3, 4, "t"); L.set(img, 4, 4, "D")
  end)

  -- 게임: game controller
  icon("geim", function(img)
    L.ebox(img, 1, 8, 9, 20, "w"); L.ebox(img, 14, 8, 22, 20, "w")
    L.rect(img, 4, 6, 16, 10, "w")
    L.ebox(img, 4, 5, 19, 9, "w")
    -- bevel: top edge light, bottom edge dark
    for y = 1, 22 do for x = 1, 22 do
      if L.isOpaque(img, x, y) then
        if not L.isOpaque(img, x, y - 1) or not L.isOpaque(img, x - 1, y) then L.set(img, x, y, "v")
        elseif not L.isOpaque(img, x, y + 1) or not L.isOpaque(img, x + 1, y) then L.set(img, x, y, "x") end
      end
    end end
    L.hline(img, 10, 13, 16, "x")
    L.map(img, 2, 8, {
      "..zz..",
      "..zy..",
      "zzyyzz",
      "zzyyzz",
      "..yy..",
      "..zz..",
    })
    L.set(img, 3, 10, "x")
    local function btn(x, y, c, hi) L.rect(img, x, y, 2, 2, c); L.set(img, x, y, hi) end
    btn(16, 7, "k", "l"); btn(14, 10, "r", "s"); btn(18, 10, "i", "D"); btn(16, 13, "n", "m")
    L.hline(img, 9, 10, 10, "x"); L.hline(img, 12, 13, 10, "x")
    L.hline(img, 9, 14, 7, "u")
  end)

  -- 노래방: karaoke screen with lyric lines and a pink microphone
  icon("noraebang", function(img)
    L.rect(img, 1, 1, 18, 14, "y"); L.hline(img, 1, 18, 1, "x")
    L.vgradient(img, 2, 2, 16, 12, { { 2, "q" }, { 13, "B" } })
    L.hline(img, 4, 15, 6, "t"); L.hline(img, 4, 9, 6, "l")
    L.hline(img, 5, 13, 9, "t")
    L.map(img, 3, 2, { "l.", "ll" })
    L.rect(img, 8, 15, 4, 1, "x"); L.rect(img, 5, 16, 10, 1, "y")
    -- mic
    L.line(img, 12, 21, 16, 17, "C"); L.line(img, 13, 21, 17, 17, "C"); L.line(img, 13, 22, 17, 18, "B")
    L.line(img, 11, 21, 15, 17, "D")
    L.ebox(img, 15, 10, 21, 16, function(nx, ny)
      if nx < -0.2 and ny < -0.2 then return "t" end
      if nx + ny > 0.6 then return "v" end
      return "u"
    end)
    L.set(img, 18, 13, "v"); L.set(img, 17, 12, "v"); L.set(img, 19, 12, "v"); L.set(img, 18, 11, "v")
    L.hline(img, 15, 18, 17, "A")
    L.map(img, 20, 2, { ".l.", "lll", ".l." }); L.set(img, 22, 7, "s")
  end)

  -- 피씨방: gaming monitor wearing a headset, RGB keyboard
  icon("pissibang", function(img)
    -- headset band over the monitor
    L.ebox(img, 2, 1, 21, 22, function(nx, ny)
      if nx * nx + ny * ny > 0.78 then return (ny < -0.85) and "w" or "x" end
    end, { y1 = 9 })
    L.rect(img, 4, 4, 16, 12, "y"); L.hline(img, 4, 19, 4, "x")
    L.rect(img, 5, 5, 14, 9, "z")
    for _, x in ipairs({ 6, 10, 14 }) do L.map(img, x, 6, { "m.m", "mmm", "m.m" }) end
    L.map(img, 10, 11, { ".l.", "lll" }, {})
    L.set(img, 11, 10, "t")
    -- ear cups
    L.rect(img, 1, 8, 4, 6, "i"); L.vline(img, 1, 9, 12, "D"); L.vline(img, 4, 9, 13, "h"); L.hline(img, 1, 4, 13, "h")
    L.rect(img, 19, 8, 4, 6, "i"); L.vline(img, 19, 9, 12, "D"); L.vline(img, 22, 9, 13, "h"); L.hline(img, 19, 22, 13, "h")
    L.line(img, 4, 13, 7, 16, "x")
    L.rect(img, 10, 16, 4, 1, "x")
    -- keyboard
    L.rect(img, 2, 17, 20, 5, "y"); L.hline(img, 2, 21, 17, "x")
    for x = 3, 20, 2 do L.set(img, x, 18, "v"); L.set(img, x + 1, 19, "v") end
    L.hline(img, 6, 16, 20, "v")
    for x = 2, 21 do L.set(img, x, 21, ({ "A", "j", "l", "m", "s", "C" })[floor((x - 2) / 4) % 6 + 1]) end
  end)

  -- 캐릭터: cute plush bear mascot
  icon("kaerikteo", function(img)
    L.ebox(img, 2, 1, 8, 7, "e"); L.ebox(img, 15, 1, 21, 7, "e")
    L.ebox(img, 4, 3, 6, 5, "D"); L.ebox(img, 17, 3, 19, 5, "D")
    L.ebox(img, 5, 14, 18, 23, function(nx, ny) return nx > 0.5 and "e" or "d" end)
    L.ebox(img, 8, 16, 15, 23, "c")
    L.ebox(img, 1, 15, 6, 20, function(nx, ny) return (nx < 0 and ny < 0) and "c" or "d" end)
    L.ebox(img, 17, 15, 22, 20, function(nx, ny) return nx > 0.3 and "e" or "d" end)
    L.ebox(img, 2, 3, 21, 17, function(nx, ny)
      if nx < -0.4 and ny < -0.4 then return "c" end
      if nx + ny > 0.9 then return "e" end
      return "d"
    end)
    L.ebox(img, 8, 10, 15, 15, "c")
    L.rect(img, 10, 11, 4, 2, "z"); L.set(img, 10, 11, "w")
    L.map(img, 9, 13, { ".z..z.", "..zz.." })
    L.rect(img, 6, 8, 2, 2, "z"); L.set(img, 6, 8, "t")
    L.rect(img, 16, 8, 2, 2, "z"); L.set(img, 16, 8, "t")
    L.rect(img, 4, 12, 2, 1, "D"); L.rect(img, 18, 12, 2, 1, "D")
    -- bow
    L.map(img, 9, 17, { "AA..AA", "AAiiAA", "AA..AA" }, {})
    L.rect(img, 11, 17, 2, 3, "i"); L.set(img, 9, 17, "D")
  end)

  -- 파티: party popper bursting confetti
  icon("pati", function(img)
    local tx, ty, ex, ey = 2, 21, 11, 12
    local ax, ay = ex - tx, ey - ty
    local len = math.sqrt(ax * ax + ay * ay); ax, ay = ax / len, ay / len
    for y = 1, 22 do for x = 1, 22 do
      local px, py = x + 0.5 - tx, y + 0.5 - ty
      local t = px * ax + py * ay
      local s = px * ay - py * ax
      local w = t * 0.42
      if t >= 0 and t <= len and math.abs(s) <= w + 0.3 then
        local band = floor(t / 3) % 2 == 0
        local c
        if s < -w * 0.35 then c = band and "D" or "l"
        elseif s > w * 0.45 then c = band and "h" or "j"
        else c = band and "A" or "k" end
        L.set(img, x, y, c)
      end
    end end
    L.ebox(img, 9, 10, 13, 14, function(nx, ny) return "f" end)
    L.line(img, 13, 10, 20, 2, "r"); L.line(img, 14, 10, 18, 6, "r"); L.line(img, 18, 6, 21, 6, "r")
    L.line(img, 13, 12, 17, 13, "m"); L.line(img, 17, 13, 21, 11, "m")
    L.line(img, 12, 9, 13, 5, "C"); L.line(img, 13, 5, 11, 2, "C")
    for _, p in ipairs({ { 16, 2, "l" }, { 21, 9, "i" }, { 8, 4, "s" }, { 19, 15, "k" }, { 15, 16, "C" }, { 22, 3, "m" }, { 5, 8, "l" }, { 16, 9, "t" } }) do
      L.set(img, p[1], p[2], p[3]); L.set(img, p[1] + 1, p[2], p[3])
    end
  end)

  -- 텐트: A-frame tent with open door on grass
  icon("tenteu", function(img)
    L.rect(img, 1, 20, 22, 3, "m"); L.hline(img, 1, 22, 22, "n")
    for x = 2, 22, 4 do L.set(img, x, 19, "m"); L.set(img, x + 1, 18, "m") end
    L.line(img, 3, 13, 1, 19, "c"); L.line(img, 20, 13, 22, 19, "c")
    for y = 3, 20 do
      local hw = (y - 2) * 10.5 / 18
      for x = 1, 22 do
        local d = x + 0.5 - 12
        if math.abs(d) <= hw then
          local c = d < 0 and "j" or "b"
          if d < 0 and d > -hw + 2 and d < -hw + 3.5 then c = "k" end
          L.set(img, x, y, c)
        end
      end
      -- door
      if y >= 9 then
        local dw = (y - 8) * 4.5 / 12
        for x = 1, 22 do
          local d = x + 0.5 - 12
          if math.abs(d) <= dw then L.set(img, x, y, (math.abs(d) > dw - 1) and "l" or (y > 17 and "f" or "g")) end
        end
      end
    end
    L.vline(img, 11, 3, 8, "a"); L.vline(img, 12, 3, 8, "a")
    L.vline(img, 11, 1, 2, "f"); L.vline(img, 12, 1, 2, "e")
  end)

  -- 캠핑: campfire with stones and a toasting marshmallow
  icon("kaemping", function(img)
    L.map(img, 6, 2, {
      ".....i......",
      "....ii......",
      "....iji..i..",
      "...ijji.ii..",
      "...ijjiiji..",
      "..ijjkjjji..",
      "..ijkkkjjii.",
      ".ijjklkkjji.",
      ".ijklllkkji.",
      ".ijkllllkji.",
      "ijjklltlkjji",
      "ijkkllllkkji",
      ".ijkkllkkji.",
      "..ijjkkjji..",
    })
    L.line(img, 3, 20, 20, 15, "f"); L.line(img, 3, 19, 20, 14, "e"); L.line(img, 3, 21, 20, 16, "f")
    L.line(img, 3, 14, 20, 19, "e"); L.line(img, 3, 15, 20, 20, "f"); L.line(img, 3, 16, 20, 21, "f")
    L.rect(img, 2, 19, 2, 3, "d"); L.rect(img, 2, 14, 2, 3, "d"); L.rect(img, 20, 14, 2, 3, "d"); L.rect(img, 20, 19, 2, 3, "d")
    for _, cx in ipairs({ 5, 9, 13, 17 }) do
      L.ebox(img, cx - 2, 20, cx + 1, 22, function(nx, ny) return ny < 0 and "u" or "v" end)
    end
    L.line(img, 22, 2, 17, 7, "f")
    L.rect(img, 15, 6, 3, 3, "t"); L.set(img, 17, 8, "u"); L.set(img, 15, 8, "d"); L.set(img, 16, 8, "d")
  end)

  local _ = H
end
