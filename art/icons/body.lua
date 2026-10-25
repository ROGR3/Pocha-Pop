-- Body / pharmacy words (약사 side line). 24x24, outline added by icons.lua.
return function(icon, L, H)
  ------------------------------------------------------------------ helpers
  -- Chibi figure template. Digits/symbols are region placeholders so that a
  -- single part can be recoloured red without touching the rest.
  local FIG = {
    "....yyyyyyyy....",
    "...yxxyyyyyyy...",
    "..yxyyyyyyyyyy..",
    "..yyy1y111y1yy..",
    "..y1111111111y..",
    "..11z111111z12..",
    "..11z111111z12..",
    "..1D11111111D2..",
    "...1111ff1122...",
    "....12222222....",
    "....75555556....",
    "..756555555656..",
    "..756888888956..",
    "..3F68888889+4..",
    "..3F98888889+4..",
    "....99999999....",
    "....!!!@###$....",
    "....!!@..##$....",
    "....!!@..##$....",
    "....!!@..##$....",
    "...%%%%..^^^^...",
    "...&&&&..****...",
  }
  local BASE = {
    ["1"] = "E", ["2"] = "F", ["3"] = "E", ["4"] = "F", ["+"] = "E",
    ["5"] = "r", ["6"] = "q", ["7"] = "s", ["8"] = "r", ["9"] = "q",
    ["!"] = "w", ["@"] = "x", ["#"] = "w", ["$"] = "x",
    ["%"] = "e", ["&"] = "f", ["^"] = "e", ["*"] = "f",
  }
  local RED = { light = "D", main = "i", shade = "h" }
  -- which placeholders belong to a part, and their red tone
  local PARTS = {
    head = { ["1"] = "D", ["2"] = "i" },
    belly = { ["8"] = "i", ["9"] = "h" },
    leg = { ["#"] = "i", ["$"] = "h", ["^"] = "i", ["*"] = "h" },
    hand = { ["+"] = "D", ["4"] = "i" },
    foot = { ["^"] = "i", ["*"] = "h" },
  }

  -- ray-shaped "ouch" marks
  local function ouch(img, x, y, dir, c)
    c = c or "l"
    local P = {
      ne = { "..c.", "c..c", ".c..", "...." },
      nw = { ".c..", "c..c", "..c.", "...." },
      e = { "..cc", "....", "cc..", "....", "..cc" },
      w = { "cc..", "....", "..cc", "....", "cc.." },
    }
    local rows = {}
    for i, r in ipairs(P[dir]) do rows[i] = r:gsub("c", c) end
    L.map(img, x, y, rows)
  end

  -- halo in `code` on transparent pixels around the pixels in list
  local function halo(img, pts, code)
    local todo = {}
    for _, p in ipairs(pts) do
      for dy = -1, 1 do for dx = -1, 1 do
        local x, y = p[1] + dx, p[2] + dy
        if not L.isOpaque(img, x, y) then todo[#todo + 1] = { x, y } end
      end end
    end
    for _, p in ipairs(todo) do L.set(img, p[1], p[2], code) end
  end

  local function figure(img, ox, oy, part, haloCode)
    local sub = {}
    for k, v in pairs(BASE) do sub[k] = v end
    local hl = PARTS[part] or {}
    for k, v in pairs(hl) do sub[k] = v end
    L.map(img, ox, oy, FIG, { sub = sub })
    local pts = {}
    for j, row in ipairs(FIG) do
      for i = 1, #row do
        local ch = row:sub(i, i)
        if (part == "body" and ch ~= ".") or hl[ch] then pts[#pts + 1] = { ox + i - 1, oy + j - 1 } end
      end
    end
    halo(img, pts, haloCode or "D")
  end

  -- Big front-facing head (close-up). hl = "ear" | "eye" | nil
  local function bigHead(img, hl)
    -- ears
    local function ear(x0, red)
      L.ebox(img, x0, 10, x0 + 3, 16, function(nx)
        if red then return nx < -0.2 and "D" or "i" end
        return nx < 0.1 and "E" or "F"
      end)
    end
    ear(2, false); ear(18, hl == "ear")
    if hl == "ear" then L.vline(img, 20, 12, 14, "h") else L.vline(img, 20, 12, 14, "F") end
    L.vline(img, 3, 12, 14, "F")
    -- face
    L.ebox(img, 4, 4, 19, 22, function(nx, ny)
      if nx > 0.55 or ny > 0.7 then return "F" end
      return "E"
    end)
    -- hair cap + bangs
    L.ebox(img, 3, 1, 20, 16, function(nx, ny)
      if nx < -0.3 and ny < -0.5 then return "x" end
      return "y"
    end, { y1 = 7 })
    L.map(img, 5, 8, { "yyy.yyyyy.yyyy", "yy...yyy...yyy", "y.....y.....yy" })
    L.vline(img, 4, 8, 11, "y"); L.vline(img, 19, 8, 11, "y")
    -- eyes
    L.map(img, 7, 12, { "tz", "zz", "zz" }); L.map(img, 15, 12, { "tz", "zz", "zz" })
    -- cheeks + mouth
    L.hline(img, 6, 7, 16, "D"); L.hline(img, 16, 17, 16, "D")
    L.hline(img, 11, 12, 18, "f")
  end

  ------------------------------------------------------------------ figures
  -- 머리: head aches
  icon("meori", function(img)
    figure(img, 4, 1, "head")
    ouch(img, 19, 1, "ne"); ouch(img, 1, 1, "nw")
  end)

  -- 배: belly
  icon("bae_belly", function(img)
    figure(img, 4, 1, "belly")
    ouch(img, 19, 14, "e"); ouch(img, 1, 14, "w")
  end)

  -- 다리: one leg
  icon("dari", function(img)
    figure(img, 4, 1, "leg")
    ouch(img, 17, 17, "e")
  end)

  -- 손: a hand
  icon("son", function(img)
    figure(img, 4, 1, "hand")
    ouch(img, 20, 13, "e")
  end)

  -- 발: a foot
  icon("bal", function(img)
    figure(img, 4, 1, "foot")
    ouch(img, 18, 18, "e")
  end)

  -- 몸: whole body glowing
  icon("mom", function(img)
    figure(img, 4, 1, "body", "l")
    ouch(img, 19, 1, "ne", "k"); ouch(img, 1, 1, "nw", "k")
  end)

  -- 귀: ear
  icon("gwi", function(img)
    bigHead(img, "ear")
    halo(img, { { 18, 10 }, { 19, 10 }, { 20, 10 }, { 21, 11 }, { 21, 12 }, { 21, 13 }, { 21, 14 }, { 21, 15 }, { 20, 16 }, { 19, 16 } }, "D")
    ouch(img, 20, 6, "ne")
  end)

  -- 눈: eye
  icon("nun_eye", function(img)
    bigHead(img, "eye")
    L.map(img, 5, 10, {
      ".DDDD.",
      "DD..DD",
      "D....D",
      "D....D",
      "D....D",
      "DD..DD",
      ".DDDD.",
    })
    L.map(img, 7, 12, { "Di", "ii", "ih" })
    L.map(img, 4, 17, { "s", "r" })
    ouch(img, 0, 8, "w")
  end)

  ------------------------------------------------------------------ ailments
  -- 감기: cold - sick face, thermometer, red nose, tissue
  icon("gamgi", function(img)
    L.ebox(img, 2, 3, 19, 21, function(nx, ny)
      if nx > 0.55 or ny > 0.7 then return "F" end
      return "E"
    end)
    L.ebox(img, 1, 1, 20, 14, function(nx, ny) return (nx < -0.3 and ny < -0.5) and "x" or "y" end, { y1 = 6 })
    L.map(img, 3, 7, { "yy.yyyy.yyy.yy", "y...yy....y..y" })
    L.vline(img, 2, 7, 10, "y"); L.vline(img, 19, 7, 10, "y")
    -- droopy tired eyes
    L.map(img, 5, 11, { "zzz", ".F." }); L.map(img, 13, 11, { "zzz", ".F." })
    -- flushed cheeks
    L.map(img, 4, 14, { "DiD" }); L.map(img, 14, 14, { "DiD" })
    -- red nose
    L.map(img, 9, 13, { "Di", "ih" })
    -- mouth + thermometer pointing out to the right
    L.hline(img, 9, 10, 17, "f")
    L.line(img, 11, 17, 19, 13, "t"); L.line(img, 11, 18, 19, 14, "u"); L.line(img, 12, 18, 20, 14, "v")
    L.line(img, 13, 17, 17, 15, "i")
    L.set(img, 20, 13, "u"); L.set(img, 21, 13, "v")
    -- crumpled tissue bottom-left
    L.map(img, 1, 17, {
      "..t.tt.",
      ".tttttu",
      "tttttuu",
      "tttuuuv",
      ".uuvvv.",
    })
  end)

  -- 상처: scraped knee
  icon("sangcheo", function(img)
    -- shorts (top left)
    L.map(img, 1, 2, {
      "rrrrrrrr",
      "rsrrrrrq",
      "rrrrrrqq",
      "qqqqqqqq",
    })
    -- thigh going right, knee, shin going down
    L.map(img, 1, 6, {
      "EEEEEEEEEEEEEE......",
      "EEEEEEEEEEEEEEEE....",
      "EEEEEEEEEEEEEEEEEE..",
      "EEEEEEEEEEEEEEEEEEE.",
      "FFFFFFFFFFEEEEEEEEEE",
      "........FFEEEEEEEEEE",
      "..........FEEEEEEEEF",
      "...........EEEEEEEEF",
      "...........EEEEEEEEF",
      "...........EEEEEEEFF",
      "...........EEEEEEEFF",
      "...........EEEEEEEF.",
      "...........EEEEEEEF.",
      "...........EEEEEEEF.",
      "..........bbbbbbbbb.",
      "..........jjjjjjjjj.",
    })
    -- scrape on knee
    L.map(img, 13, 7, {
      ".DiD.",
      "DihiD",
      "ihAhi",
      "DihiD",
      ".DiD.",
    })
    L.set(img, 15, 13, "i"); L.set(img, 15, 14, "h")  -- drip
    ouch(img, 19, 1, "ne")
  end)

  -- 약: pill bottle + pills
  icon("yak", function(img)
    -- cap
    L.rect(img, 4, 1, 11, 4, "u"); L.hline(img, 4, 14, 1, "t"); L.vline(img, 14, 1, 4, "v")
    for x = 5, 13, 2 do L.vline(img, x, 2, 4, "v") end
    -- amber bottle
    L.ebox(img, 3, 5, 15, 22, function(nx, ny)
      if nx < -0.6 then return "k" end
      if nx > 0.5 then return "b" end
      return "j"
    end, { y1 = 21 })
    L.rect(img, 3, 6, 13, 15, "j"); L.vline(img, 3, 6, 20, "k"); L.vline(img, 4, 6, 20, "k")
    L.vline(img, 14, 6, 20, "b"); L.vline(img, 15, 6, 20, "b"); L.hline(img, 4, 14, 21, "b")
    L.vline(img, 5, 6, 9, "l")
    -- label with red cross
    L.rect(img, 5, 10, 9, 8, "t"); L.hline(img, 5, 13, 17, "u")
    L.rect(img, 8, 11, 3, 6, "i"); L.rect(img, 6, 13, 7, 2, "i")
    -- capsule (red / white) + round pill
    L.map(img, 16, 10, {
      ".DDtt.",
      "Diittu",
      "iiiuuu",
      ".hhvv.",
    })
    L.map(img, 17, 17, {
      ".ttu.",
      "tttuu",
      "tuuuv",
      "uuuvv",
      ".vvv.",
    })
  end)

  -- 반창고: band-aid, diagonal
  icon("banchanggo", function(img)
    -- rotated strip: u along (1,-1), v across
    for y = 0, 23 do for x = 0, 23 do
      local u = ((x - 11.5) - (y - 11.5)) / 1.414
      local v = ((x - 11.5) + (y - 11.5)) / 1.414
      if math.abs(u) <= 13 and math.abs(v) <= 4.3 and (math.abs(u) < 10.5 or u * u / 1 + 0 < 0 or (math.abs(u) - 10.5) ^ 2 + v * v < 4.3 * 4.3) then
        local code
        if math.abs(u) < 3.6 and math.abs(v) < 3.2 then
          code = (v < -1.8) and "c" or "d"
        else
          code = v < -2.6 and "c" or (v > 2.6 and "e" or "d")
          if v > 2.6 then code = "e" elseif v < -2.6 then code = "c" else code = "k" end
          code = v > 2.6 and "e" or "d"
          if v < -2.6 then code = "c" end
        end
        if x >= 1 and x <= 22 and y >= 1 and y <= 22 then L.set(img, x, y, code) end
      end
    end end
    -- pad
    for y = 0, 23 do for x = 0, 23 do
      local u = ((x - 11.5) - (y - 11.5)) / 1.414
      local v = ((x - 11.5) + (y - 11.5)) / 1.414
      if math.abs(u) < 3.6 and math.abs(v) < 3.0 then L.set(img, x, y, v < -1.6 and "t" or "c") end
    end end
    -- breathing holes
    for _, p in ipairs({ { 5, 13 }, { 7, 15 }, { 4, 16 }, { 6, 11 }, { 16, 4 }, { 18, 6 }, { 15, 8 }, { 19, 9 }, { 13, 6 }, { 8, 18 } }) do
      L.set(img, p[1], p[2], "e")
    end
  end)

  ------------------------------------------------------------------ people / places
  -- 병원: hospital building with red cross
  icon("byeongwon", function(img)
    -- main block
    L.rect(img, 2, 8, 20, 14, "u")
    L.rect(img, 2, 8, 2, 14, "t"); L.vline(img, 21, 8, 21, "v")
    L.hline(img, 1, 22, 7, "v"); L.hline(img, 1, 22, 8, "w")
    -- tower with cross
    L.rect(img, 7, 1, 10, 7, "t"); L.vline(img, 16, 1, 7, "u")
    L.rect(img, 10, 2, 4, 5, "i"); L.rect(img, 9, 3, 6, 3, "i")
    L.rect(img, 10, 2, 1, 1, "D"); L.hline(img, 9, 9, 3, "D")
    L.vline(img, 13, 5, 6, "h"); L.hline(img, 13, 14, 5, "h")
    -- windows
    for _, x in ipairs({ 4, 8, 14, 18 }) do
      L.rect(img, x, 10, 2, 3, "r"); L.set(img, x, 10, "s")
      if x ~= 8 and x ~= 14 then L.rect(img, x, 15, 2, 3, "r"); L.set(img, x, 15, "s") end
    end
    -- door
    L.rect(img, 9, 15, 6, 7, "q"); L.rect(img, 10, 16, 2, 5, "r"); L.rect(img, 12, 16, 2, 5, "r")
    L.vline(img, 10, 16, 17, "s")
    L.hline(img, 1, 22, 22, "w")
  end)

  -- small head used by staff icons; hair = {main, hi}
  local function staffHead(img, hair)
    L.ebox(img, 6, 6, 17, 17, function(nx, ny)
      if nx > 0.55 or ny > 0.7 then return "F" end
      return "E"
    end)
    L.ebox(img, 5, 4, 18, 15, function(nx, ny) return (nx < -0.3 and ny < -0.5) and hair[2] or hair[1] end, { y1 = 8 })
    L.map(img, 7, 9, { "....hh....", }, { sub = { h = hair[1] } })
    L.vline(img, 5, 8, 12, hair[1]); L.vline(img, 18, 8, 12, hair[1])
    L.map(img, 8, 11, { "z...z" }); L.map(img, 8, 12, { "z...z" })
    L.set(img, 7, 13, "D"); L.set(img, 15, 13, "D")
    L.hline(img, 10, 11, 14, "f")
  end
  -- white coat torso
  local function coat(img)
    L.map(img, 3, 17, {
      "...tttFFFFFtttt...",
      "..tttttFFFtttttu..",
      ".tttttttFttttttuu.",
      ".ttttttt.tttttttu.",
      ".ttttttt.tttttttuu",
      ".ttttttt.tttttttuu",
    })
  end

  -- 간호사: nurse with cap
  icon("ganhosa", function(img)
    L.map(img, 3, 17, {
      "...DDDEEEEEDDDD...",
      "..DDDDDDEDDDDDDC..",
      ".DDDDDDDDDDDDDDCC.",
      ".DDDDDDDDDDDDDDDC.",
      ".DDDDDDDDDDDDDDDCC",
      ".DDDDDDDDDDDDDDDCC",
    })
    L.map(img, 7, 17, { "tt.....tt" }); L.map(img, 8, 18, { "tt.tt" })
    staffHead(img, { "f", "e" })
    -- bun
    L.ebox(img, 15, 3, 20, 8, function(nx, ny) return (nx < 0 and ny < 0) and "e" or "f" end)
    -- cap
    L.map(img, 6, 1, {
      "..tttttttt..",
      ".tttttttttu.",
      "tttttttttuuu",
      "uuuuuuuuuuvv",
    })
    L.rect(img, 11, 1, 2, 3, "i"); L.rect(img, 10, 2, 4, 1, "i")
  end)

  -- 의사: doctor with head mirror and stethoscope
  icon("uisa", function(img)
    coat(img)
    -- shirt + tie
    L.map(img, 9, 17, { "rrrrr", ".rir.", "..i..", "..h.." })
    staffHead(img, { "y", "x" })
    -- head mirror band + disc
    L.hline(img, 5, 18, 7, "w")
    L.map(img, 8, 2, {
      ".uuuu.",
      "uttuuv",
      "uttuuv",
      "uuuuvv",
      ".vvvv.",
    })
    L.set(img, 11, 4, "z")
    -- stethoscope
    L.map(img, 5, 17, { "x.......", ".x......", ".x......", "..x....." })
    L.map(img, 15, 17, { ".......x", "......x.", "......x.", ".....x.." })
    L.map(img, 7, 20, { "xx" })
    L.map(img, 6, 21, { "uuv" }); L.map(img, 6, 22, { "vvw" })
  end)

  -- 약사: pharmacist holding a medicine bottle, green cross sign
  icon("yaksa", function(img)
    coat(img)
    L.map(img, 9, 17, { "mmmmm", ".mmm." })
    staffHead(img, { "f", "e" })
    -- green pharmacy cross sign, top-left
    L.map(img, 1, 1, {
      "..mm..",
      "..mn..",
      "mmmmnn",
      "nnnnnn",
      "..nn..",
      "..no..",
    })
    L.set(img, 2, 3, "s"); L.set(img, 3, 1, "s")
    -- bottle held in front with hands
    L.map(img, 15, 13, {
      ".uuu.",
      ".vvv.",
      "kjjjb",
      "jtttb",
      "jtitb",
      "jtttb",
      "jjjjb",
      "EjjbF",
      "EEFFF",
    })
    L.map(img, 13, 20, { "EE" })
  end)

  -- 아프다: wincing face holding cheek
  icon("apeuda", function(img)
    L.ebox(img, 2, 2, 20, 21, function(nx, ny)
      if nx > 0.55 or ny > 0.7 then return "F" end
      return "E"
    end)
    L.ebox(img, 1, 1, 21, 14, function(nx, ny) return (nx < -0.3 and ny < -0.5) and "x" or "y" end, { y1 = 6 })
    L.map(img, 3, 7, { "yy.yyyy.yyyy.yy", "y...yy....yy..y" })
    L.vline(img, 2, 7, 10, "y"); L.vline(img, 20, 7, 10, "y")
    -- >< eyes
    L.map(img, 5, 10, { "z..", ".zz", "z.." })
    L.map(img, 14, 10, { "..z", "zz.", "..z" })
    -- wobbly mouth
    L.map(img, 8, 16, { ".z.z.z", "z.z.z." })
    -- hand on cheek (right), fingers up
    L.map(img, 14, 9, {
      "..E.E.E.",
      ".EEFEFEF",
      ".EEFEFEF",
      "EEEFEFEF",
      "EEEEEEEF",
      "EEEEEEEF",
      ".EEEEEFF",
      "..EEEFF.",
      "...FFF..",
      "...FF...",
    })
    -- swollen red patch peeking + pain marks
    L.set(img, 13, 14, "D"); L.set(img, 13, 15, "i")
    ouch(img, 19, 1, "ne", "i")
    L.map(img, 2, 13, { "s", "r" })
  end)

  -- 조심하다: yellow warning triangle with "!"
  icon("josimhada", function(img)
    for y = 2, 21 do
      local half = math.floor((y - 2) * 10.5 / 19 + 0.5)
      for x = 12 - half - 1, 11 + half + 1 do
        if x >= 1 and x <= 22 then
          local code = "k"
          if x <= 12 - half then code = "l" elseif x >= 11 + half then code = "j" end
          if y == 21 then code = "j" end
          L.set(img, x, y, code)
        end
      end
    end
    -- inner face
    for y = 6, 19 do
      local half = math.floor((y - 6) * 7 / 13 + 0.5)
      for x = 12 - half - 1, 11 + half + 1 do L.set(img, x, y, y < 9 and "l" or "l") end
    end
    -- !
    L.rect(img, 11, 9, 2, 6, "z"); L.rect(img, 11, 16, 2, 2, "z")
  end)
end
