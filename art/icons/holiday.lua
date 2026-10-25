-- Holidays & celebrations. 24x24, outline added by icons.lua.
return function(icon, L, H)
  local function sparkle(img, x, y, c) L.map(img, x, y, { "." .. c .. ".", c .. "t" .. c, "." .. c .. "." }) end
  local function ball(img, x0, y0, x1, y1, hi, mid, sh)
    L.ebox(img, x0, y0, x1, y1, function(nx, ny)
      local v = nx * 0.8 + ny * 0.6
      if v < -0.45 then return hi elseif v > 0.45 then return sh end
      return mid
    end)
  end

  -- 선물: wrapped box with ribbon and a big bow
  icon("seonmul", function(img)
    L.rect(img, 3, 11, 18, 11, "i")
    L.rect(img, 3, 11, 3, 11, "D"); L.rect(img, 17, 11, 4, 11, "h")
    L.rect(img, 2, 8, 20, 4, "i"); L.hline(img, 2, 21, 8, "D"); L.rect(img, 18, 9, 4, 3, "h")
    L.hline(img, 3, 20, 12, "h")                                -- lid shadow
    L.rect(img, 10, 8, 4, 14, "k"); L.vline(img, 10, 8, 21, "l"); L.vline(img, 13, 8, 21, "j")
    L.map(img, 3, 1, {                                          -- bow
      "..kkk.......kkk...",
      ".klllk.....kllkk..",
      "kll..kk...kk..lkj.",
      "kl....kkkkk....kj.",
      ".kk...klllk...kj..",
      "..kkkkkkkkjjjjj...",
      ".....jk....kj.....",
    })
    L.set(img, 4, 14, "t"); L.set(img, 3, 9, "t")
  end)

  -- 크리스마스: decorated tree with a star
  icon("keuriseumaseu", function(img)
    local tiers = { { 4, 8, 4 }, { 8, 13, 6 }, { 12, 18, 9 } }   -- top y, bottom y, half width
    for _, t in ipairs(tiers) do
      for y = t[1], t[2] do
        local hw = math.floor((y - t[1] + 1) / (t[2] - t[1] + 1) * t[3] + 0.5)
        for x = 12 - hw, 11 + hw do
          local code = "n"
          if x < 12 - hw + 2 then code = "m" elseif x > 11 + hw - 2 then code = "o" end
          if y == t[2] then code = (x < 12) and "n" or "o" end
          L.set(img, x, y, code)
        end
      end
    end
    L.rect(img, 10, 19, 4, 3, "f"); L.vline(img, 10, 19, 21, "e")
    for _, p in ipairs({ { 11, 7, "i" }, { 9, 11, "k" }, { 14, 10, "r" }, { 12, 13, "D" }, { 7, 16, "i" }, { 15, 15, "k" }, { 11, 17, "r" }, { 17, 17, "i" }, { 5, 18, "k" } }) do
      L.set(img, p[1], p[2], p[3])
    end
    L.line(img, 7, 12, 15, 9, "l"); L.line(img, 5, 17, 17, 13, "l")   -- garland
    L.map(img, 9, 0, {                                          -- star
      "...l..",
      "..lk..",
      "llkkkk",
      ".lkkj.",
      ".k..j.",
    })
    L.set(img, 3, 3, "t"); L.set(img, 20, 6, "t"); L.set(img, 1, 10, "u"); L.set(img, 21, 12, "t")
  end)

  -- 메리 크리스마스: Santa hat with holly and sparkles
  icon("meri_keuriseumaseu", function(img)
    L.map(img, 3, 2, {
      "..........iiii....",
      ".......iiiiiiiih..",
      ".....iiDDiiiiiihh.",
      "....iiDiiiiiiiiih.",
      "...iiDiiiiiiihh.hh",
      "..iiDiiiiiiiihh..h",
      "..iiiiiiiiiiih...h",
      ".iiiiiiiiiiiihh...",
      ".iiiiiiiiiiiiih...",
      ".iiiiiiiiiiiiih...",
      ".hiiiiiiiiiiihh...",
    })
    L.ebox(img, 17, 11, 22, 16, function(nx, ny) return (nx < -0.1 and ny < -0.1) and "t" or (nx + ny > 0.6 and "v" or "u") end)  -- pompom
    L.ebox(img, 1, 13, 18, 19, function(nx, ny) return ny < -0.3 and "t" or (ny > 0.4 and "v" or "u") end)                    -- fur trim
    L.map(img, 2, 17, { "mm.....", "nmmn.nm", ".nnmmnn", "..n..n." })             -- holly
    L.map(img, 7, 18, { "ii", "ih" })
    sparkle(img, 1, 1, "l"); sparkle(img, 19, 19, "k")
    L.set(img, 12, 1, "l"); L.set(img, 22, 2, "t")
  end)

  -- 눈: snowman under falling snowflakes
  icon("nun_snow", function(img)
    ball(img, 4, 11, 19, 22, "t", "u", "v")
    ball(img, 6, 3, 17, 13, "t", "u", "v")
    L.set(img, 9, 7, "z"); L.set(img, 13, 7, "z")
    L.map(img, 11, 9, { "jjj", "jj." })                       -- carrot
    L.map(img, 9, 11, { "z...z", ".zzz." }, {})
    L.set(img, 11, 15, "y"); L.set(img, 11, 18, "y")
    L.line(img, 3, 13, 1, 10, "f"); L.line(img, 20, 13, 22, 10, "f")   -- twig arms
    for _, p in ipairs({ { 2, 2 }, { 20, 4 }, { 1, 19 }, { 21, 18 } }) do
      L.map(img, p[1] - 1, p[2] - 1, { ".s.", "sts", ".s." })
    end
    L.set(img, 18, 1, "t"); L.set(img, 4, 6, "t")
  end)

  -- 겨울: knitted mitten and striped scarf
  icon("gyeoul", function(img)
    -- pair of mittens: red one behind (mirrored), blue one in front with a ring
    local mitten = {
      "......rrrrr...",
      ".....rssrrrrq.",
      "....rssrrrrrrq",
      "....rsrrrrrrrq",
      "rr..rsrrrrrrrq",
      "srr.rsrrrrrrrq",
      "srrrrrrrrrrrrq",
      "srrrrrrrtrrrrq",
      "srrrrrrtttrrrq",
      ".srrrrrrtrrrrq",
      "..rrrrrrrrrrq.",
      "...rrrrrrrrq..",
      "...qqqqqqqqq..",
      "..ttttttttttt.",
      "..tutututututu",
      "..tutututututu",
      "..uuuuuuuuuuu.",
    }
    L.map(img, 9, 6, mitten, { flip = true, sub = { r = "i", s = "D", q = "h" } })
    for j = 1, #mitten do for i = 1, #mitten[j] do
      if mitten[j]:sub(i, i) ~= "." then
        for _, d in ipairs({ { 1, 0 }, { 0, 1 }, { -1, 0 }, { 0, -1 } }) do
          local r = mitten[j + d[2]]; local ch = r and r:sub(i + d[1], i + d[1]) or "."
          if ch == "." or ch == "" then L.set(img, i + d[1], j + d[2] - 1, "g") end
        end
      end
    end end
    L.map(img, 1, 0, mitten)
    L.set(img, 7, 3, "t")
    L.map(img, 18, 0, { ".s.", "sts", ".s." }); L.set(img, 22, 4, "t")
  end)

  -- 장난감: wind-up robot
  icon("jangnangam", function(img)
    L.vline(img, 10, 1, 3, "v"); L.rect(img, 9, 0, 3, 2, "i"); L.set(img, 9, 0, "D")
    L.rect(img, 4, 3, 13, 8, "u"); L.vline(img, 4, 3, 10, "t"); L.hline(img, 4, 16, 3, "t"); L.rect(img, 15, 4, 2, 7, "v")
    L.map(img, 6, 5, { "zz...zz", "zs...zs" })
    L.map(img, 8, 8, { "kkkkk" }); L.map(img, 8, 8, { "k.k.k" })
    L.set(img, 3, 6, "i"); L.set(img, 17, 6, "i")             -- ear bolts
    L.rect(img, 5, 12, 11, 7, "r"); L.vline(img, 5, 12, 18, "s"); L.rect(img, 14, 12, 2, 7, "q")
    L.rect(img, 8, 13, 5, 3, "x"); L.set(img, 9, 14, "i"); L.set(img, 11, 14, "m"); L.set(img, 10, 14, "l")
    L.rect(img, 2, 12, 2, 5, "v"); L.rect(img, 17, 12, 2, 5, "w")   -- arms
    L.rect(img, 1, 17, 3, 2, "u"); L.rect(img, 17, 17, 3, 2, "u")
    L.rect(img, 6, 19, 3, 3, "w"); L.rect(img, 12, 19, 3, 3, "w"); L.hline(img, 5, 9, 22, "x"); L.hline(img, 11, 15, 22, "x")
    L.map(img, 18, 7, { "kk...", ".k...", ".kkkk", ".k..k", "kk..k" }, {})
    L.map(img, 19, 8, { "kkk", ".k.", ".k.", "kkk" })          -- wind-up key
  end)

  -- 생일: whole birthday cake with three lit candles
  icon("saengil", function(img)
    L.rect(img, 3, 12, 18, 9, "c")
    L.rect(img, 3, 12, 3, 9, "t"); L.rect(img, 17, 12, 4, 9, "d")
    L.hline(img, 3, 20, 17, "i"); L.hline(img, 3, 20, 18, "h")   -- jam layer
    L.ebox(img, 3, 9, 20, 14, function(nx, ny) return ny < -0.2 and "t" or "D" end)
    for _, x in ipairs({ 4, 7, 11, 15, 18 }) do L.vline(img, x, 13, 14 + (x % 3), "D") end
    L.ebox(img, 1, 19, 22, 22, function(nx, ny) return ny < 0 and "u" or "v" end, {})
    L.rect(img, 3, 19, 18, 2, "c"); L.rect(img, 3, 19, 3, 2, "t"); L.rect(img, 17, 19, 4, 2, "d")
    for _, x in ipairs({ 6, 11, 16 }) do
      L.rect(img, x, 5, 2, 6, "r"); L.set(img, x, 6, "t"); L.set(img, x, 8, "t"); L.vline(img, x + 1, 5, 10, "q")
      L.map(img, x, 1, { ".l", "lk", "kj", "jj" })
    end
    for _, p in ipairs({ { 8, 11 }, { 14, 11 } }) do L.map(img, p[1], p[2], { "ii", "ih" }) end
  end)

  -- 생일 축하해요: party hat, balloon and confetti
  icon("saengil_chukahaeyo", function(img)
    -- balloon + string
    L.ebox(img, 1, 1, 9, 11, function(nx, ny)
      if nx < -0.2 and ny < -0.3 and nx > -0.7 then return "D" end
      if nx + ny > 0.7 then return "h" end
      return "i"
    end)
    L.set(img, 3, 3, "t")
    L.map(img, 4, 12, { "ih.", ".h.", "..f", "..f", ".f.", "f..", "f..", ".f." })
    -- party hat (cone)
    for y = 6, 21 do
      local hw = math.floor((y - 5) * 0.5)
      for x = 16 - hw, 16 + hw do
        local band = (math.floor((x - y * 0.6 + 40) / 3)) % 2 == 0
        local code = band and "r" or "l"
        if x == 16 - hw then code = band and "s" or "t" elseif x >= 16 + hw - 1 then code = band and "q" or "k" end
        L.set(img, x, y, code)
      end
    end
    L.hline(img, 8, 22, 22, "C"); L.hline(img, 9, 22, 21, "D")
    L.ebox(img, 14, 2, 18, 6, function(nx, ny) return (nx < 0 and ny < 0) and "t" or "D" end)  -- pompom
    for _, p in ipairs({ { 11, 1, "m" }, { 21, 3, "i" }, { 12, 7, "k" }, { 21, 10, "D" }, { 1, 16, "s" }, { 9, 14, "C" }, { 2, 21, "k" }, { 8, 19, "m" } }) do
      L.set(img, p[1], p[2], p[3]); L.set(img, p[1] + 1, p[2], p[3])
    end
  end)

  -- 꽃: bouquet wrapped in paper with a ribbon
  icon("kkot", function(img)
    -- leaves
    L.map(img, 1, 7, { ".mm.........", "mmnn......n.", ".nno....nnm.", "..o......mmn" })
    L.map(img, 17, 6, { "...mm", "..mmn", ".nno.", "oo..." })
    -- flowers
    local function bloom(cx, cy, hi, mid, sh, ctr)
      L.ebox(img, cx - 3, cy - 3, cx + 3, cy + 3, function(nx, ny)
        if nx * nx + ny * ny < 0.18 then return ctr end
        if nx + ny < -0.6 then return hi elseif nx + ny > 0.6 then return sh end
        return mid
      end)
    end
    bloom(7, 5, "D", "i", "h", "k")
    bloom(16, 4, "t", "l", "k", "j")
    bloom(11, 9, "t", "D", "C", "k")
    bloom(4, 11, "s", "r", "q", "l")
    bloom(18, 11, "C", "B", "x", "l")
    -- wrapping paper cone
    for y = 12, 22 do
      local hw = math.max(1, math.floor((22 - y) * 0.8 + 1.5))
      for x = 12 - hw, 11 + hw do
        local code = "c"
        if x < 12 - hw + 2 then code = "t" elseif x > 11 + hw - 2 then code = "d" end
        L.set(img, x, y, code)
      end
    end
    L.hline(img, 4, 19, 12, "t")
    L.map(img, 9, 16, { "D..D", "DiiD", ".ii.", "i..i" })      -- ribbon bow
  end)
end
