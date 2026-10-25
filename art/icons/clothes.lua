-- Clothes & accessories (동대문 market). Recolourable set: every item is drawn
-- with a colour ramp R = { hi, main, shade, dark, name = colourName } for the
-- fabric/material; fixed details (buttons, metal, lenses, soles...) use fixed
-- palette letters. The game palette-swaps each item into all L.COLORS.
local L = dofile(app.params.root .. "/art/lib.lua")

-- Draw an ascii map where digits 1..4 = R[1..4] and '#' = auto-shaded fabric
-- (top/left edge -> hi, right/bottom edge -> shade, inside -> main).
local function M(img, ox, oy, rows, R)
  local function at(i, j)
    local row = rows[j]
    if not row or i < 1 or i > #row then return false end
    local ch = row:sub(i, i)
    return ch ~= "." and ch ~= " "
  end
  for j, row in ipairs(rows) do
    for i = 1, #row do
      local ch = row:sub(i, i)
      local code
      if ch == "#" then
        if not at(i - 1, j) or not at(i, j - 1) then code = R[1]
        elseif not at(i + 1, j) or not at(i, j + 1) then code = R[3]
        else code = R[2] end
      elseif ch:match("%d") then code = R[tonumber(ch)]
      elseif ch ~= "." and ch ~= " " then code = ch end
      if code then L.set(img, ox + i - 1, oy + j - 1, code) end
    end
  end
end

-- Mirror left halves into symmetric rows.
local function sym(halves)
  local out = {}
  for k, h in ipairs(halves) do out[k] = h .. h:reverse() end
  return out
end

-- a dark detail that stays visible on black fabric too
local function seam(R) return R.name == "black" and "w" or R[4] end

return { items = {
  -- 옷: shirt on a hanger
  { "ot", "blue", function(img, R)
    L.map(img, 10, 1, { ".uv.", "u..v", "...v", "..v.", ".vv." })
    M(img, 1, 6, sym({
      "......###44",
      "....#####14",
      "..#######1#",
      ".###4#####3",
      ".###4######",
      ".###4######",
      ".###4######",
      ".###4######",
      ".###4######",
      ".###4######",
      ".###4######",
      ".1114######",
      "....#######",
      "....#######",
      "....#######",
      "....#######",
    }), R)
    local s = seam(R)
    for y = 9, 21 do L.set(img, 12, y, R[3]) end
    for _, y in ipairs({ 10, 13, 16, 19 }) do L.set(img, 12, y, "t") end
    L.set(img, 5, 9, "t")
    L.set(img, 2, 10, s); L.set(img, 21, 10, s)
  end },

  -- 치마: pleated A-line skirt with waistband and button
  { "chima", "red", function(img, R)
    local cx = 12
    for y = 2, 4 do
      for x = 6, 17 do
        local c = (y == 2) and R[1] or R[2]
        if x == 17 then c = R[3] end
        if y == 4 then c = R[4] end
        L.set(img, x, y, c)
      end
    end
    L.set(img, 15, 3, "u"); L.set(img, 15, 2, "t")
    for y = 5, 21 do
      local k = (y - 5) / 16
      local hw = math.floor(6 + k * 5.5 + 0.5)
      local x0, x1 = cx - hw, cx + hw - 1
      for x = x0, x1 do
        local f = (x - x0) / (x1 - x0)
        local p = math.floor(f * 6) -- pleat index
        local within = f * 6 - p
        local c = R[2]
        if within < 0.25 then c = R[1] elseif within > 0.8 then c = R[3] end
        if f > 0.85 and c == R[2] then c = R[3] end
        if y == 21 then c = (x % 3 == 0) and R[4] or R[3] end
        L.set(img, x, y, c)
      end
    end
  end },

  -- 바지: trousers
  { "baji", "blue", function(img, R)
    M(img, 1, 1, sym({
      "...########",
      "...333333#3",
      "...########",
      "...#4######",
      "...##4#####",
      "...######4#",
      "...######4#",
      "..#######4#",
      "..########.",
      "..#######..",
      "..#######..",
      "..#######..",
      ".########..",
      ".#######...",
      ".#######...",
      ".#######...",
      ".#######...",
      ".#######...",
      ".#######...",
      ".#######...",
      ".3333333...",
    }), R)
    L.set(img, 12, 2, "u") -- button
    for _, x in ipairs({ 6, 17 }) do L.set(img, x, 1, R[3]); L.set(img, x, 3, R[3]) end
  end },

  -- 모자: baseball cap, side view, brim to the right
  { "moja", "yellow", function(img, R)
    L.ebox(img, 1, 5, 17, 25, function(nx, ny)
      if nx < -0.55 or (ny < -0.75 and nx < 0.2) then return R[1] end
      if nx > 0.45 then return R[3] end
      return R[2]
    end, { y1 = 15 })
    -- panel seams
    L.line(img, 9, 5, 7, 15, R[3])
    L.line(img, 10, 5, 13, 15, R[3])
    L.set(img, 8, 4, R[2]); L.set(img, 9, 4, R[1]); L.set(img, 10, 4, R[2]) -- button
    -- eyelets
    L.set(img, 5, 9, R[4]); L.set(img, 13, 8, R[4])
    -- band + brim
    L.hline(img, 1, 17, 16, R[4] == "z" and "w" or R[4])
    M(img, 12, 13, {
      "...111111..",
      "..12222222.",
      "1222222223.",
      "3333333334.",
    }, R)
    L.hline(img, 1, 11, 17, R[3])
    L.hline(img, 2, 10, 18, R[3])
  end },

  -- 구두: pair of leather shoes, glossy, thin dark sole + heel
  { "gudu", "brown", function(img, R)
    local SHOE = {
      "11#.............",
      "1#44#...........",
      "1##44#4t........",
      "1###4t4#####....",
      "1###########3...",
      "1#########3##13.",
      "1#########3###t3",
      "################",
      "yyyywwwwwwwwwwww",
      "yyyy.........yy.",
    }
    M(img, 7, 3, SHOE, R)
    M(img, 1, 12, SHOE, R)
  end },

  -- 운동화: sneakers, chunky white sole, laces, stripe
  { "undonghwa", "white", function(img, R)
    local SN = {
      "..11#.........",
      ".1#44#tt......",
      "1###4t#t#.....",
      "1###4#t#t##...",
      "1#4444######3.",
      "1#####4444###3",
      "1#############",
      "tttttttttttttt",
      "uuuuuuuuuuuuuu",
      "vvvvvvvvvvvvv.",
    }
    M(img, 9, 2, SN, R)
    M(img, 1, 11, SN, R)
  end },

  -- 티셔츠: T-shirt
  { "tisyeocheu", "green", function(img, R)
    M(img, 1, 3, sym({
      "....####444",
      "..######111",
      ".##########",
      "###########",
      "###########",
      "###########",
      "1114#######",
      "...########",
      "...########",
      "...########",
      "...########",
      "...########",
      "...########",
      "...########",
      "...########",
      "...########",
      "...########",
      "...33333333",
    }), R)
  end },

  -- 한복: white jeogori with saekdong (rainbow) sleeves, red goreum bow,
  -- full skirt in the item colour
  { "hanbok", "pink", function(img, R)
    M(img, 1, 1, sym({
      "......ttttt",
      "....ttttttt",
      "..ttttttttt",
      ".tttttttttt",
      "iiiittttttt",
      "llllttuuuuu",
      "mmmm1######",
      "rrrr1######",
      "CCCC1######",
      "tttu1######",
      "44441######",
      ".##########",
      ".##########",
      ".#########3",
      ".#########3",
      "##########3",
      "##########3",
      "##########3",
      "##########3",
      "##########3",
      "33333333333",
    }), R)
    for y = 9, 20 do L.set(img, 8, y, R[3]); L.set(img, 15, y, R[3]) end
    -- collar (git) crossing to the right, white dongjeong
    local s = seam(R)
    L.line(img, 8, 1, 13, 6, R[3]); L.line(img, 9, 1, 14, 6, R[2])
    L.line(img, 7, 1, 7, 2, "u")
    L.line(img, 15, 1, 11, 5, s)
    -- goreum bow
    L.map(img, 12, 5, { "AiA", "hih", ".ii", ".i.h", ".h..", })
  end },

  -- 가방: handbag with handle, flap and gold clasp
  { "gabang", "brown", function(img, R)
    L.map(img, 6, 2, {
      "...444444...",
      "..4......4..",
      ".4........4.",
      ".4........4.",
    }, { sub = { ["4"] = R[3] } })
    M(img, 2, 6, {
      "...##############...",
      "..################..",
      ".##################.",
      "4444444444444444444.",
      "####################",
      "####################",
      "####################",
      "####################",
      "####################",
      "####################",
      "####################",
      "####################",
      "####################",
      "####################",
      ".33333333333333333..",
    }, R)
    L.map(img, 10, 8, { "llkk", "lkkj", "kkjj" })
    L.set(img, 4, 7, "t")
  end },

  -- 지갑: bifold wallet with cards peeking out and a snap
  { "jigap", "black", function(img, R)
    L.map(img, 4, 3, {
      "...ssssssssr..",
      "..ssttttttsrr.",
      "..ssssssssrrr.",
      "kkkkkkkkkkkj..",
    })
    M(img, 1, 7, {
      "######################",
      "######################",
      "#4444444444444444#####",
      "##############4#######",
      "##############4#######",
      "##############4#######",
      "##############4#######",
      "##############4#######",
      "##############4#######",
      "##############4#######",
      "#4444444444444444#####",
      "######################",
      "3333333333333333333333",
    }, R)
    L.map(img, 15, 10, { ".vu", "vtu", "wvv" })
  end },

  -- 안경: glasses, frame colourable, light blue lenses
  { "angyeong", "black", function(img, R)
    local F = R.name == "black" and { "w", "x", "y", "z" } or { R[1], R[2], R[3], R[4] }
    local lens = function(x0)
      L.ebox(img, x0, 7, x0 + 9, 16, function(nx, ny)
        if nx * nx + ny * ny > 0.36 then
          if ny < -0.3 or nx < -0.6 then return F[1] end
          if ny > 0.3 then return F[3] end
          return F[2]
        end
        if nx < -0.2 and ny < -0.1 and nx + ny > -1.0 then return "t" end
        return ny > 0.2 and "r" or "s"
      end)
    end
    lens(1); lens(13)
    L.vline(img, 1, 10, 12, F[1]); L.vline(img, 22, 10, 12, F[3])
    L.hline(img, 10, 13, 9, F[2]); L.hline(img, 10, 13, 8, F[1])
    L.hline(img, 0, 1, 9, F[3]); L.hline(img, 22, 23, 9, F[3])
  end },

  -- 시계: wristwatch, strap colourable, metal case, white face
  { "sigye", "brown", function(img, R)
    M(img, 8, 0, {
      "########",
      "########",
      "###4####",
      "########",
      "###4####",
      "########",
    }, R)
    M(img, 8, 18, {
      "########",
      "###4####",
      "########",
      "###4####",
      "########",
      "33333333",
    }, R)
    L.ebox(img, 4, 5, 18, 18, function(nx, ny)
      if nx * nx + ny * ny > 0.62 then return (nx + ny < 0) and "u" or "v" end
      return "t"
    end)
    L.rect(img, 19, 10, 2, 3, "v"); L.set(img, 19, 10, "u")
    -- hands + ticks
    L.vline(img, 11, 8, 12, "z"); L.hline(img, 11, 14, 12, "z")
    L.set(img, 11, 7, "w"); L.set(img, 11, 16, "w"); L.set(img, 6, 12, "w"); L.set(img, 16, 12, "w")
    L.set(img, 11, 12, "i")
  end },

  -- 목걸이: gold chain with coloured beads and a gem pendant
  { "mokgeori", "purple", function(img, R)
    for y = 0, 16 do
      for x = 2, 21 do
        local nx, ny = (x + 0.5 - 12) / 10, (y + 0.5 + 4) / 20.5
        local d = nx * nx + ny * ny
        if d > 0.8 and d <= 1 then L.set(img, x, y, (x + y) % 2 == 0 and "k" or "l") end
      end
    end
    for _, p in ipairs({ { 3, 8 }, { 18, 8 }, { 6, 12 }, { 15, 12 } }) do
      L.map(img, p[1], p[2], { ".1.", "123", ".3." }, { sub = { ["1"] = R[1], ["2"] = R[2], ["3"] = R[3] } })
    end
    L.map(img, 11, 15, { "kk" })
    M(img, 9, 16, {
      ".1##.",
      "1t###",
      "#####",
      "####3",
      ".#33.",
      "..3..",
    }, R)
  end },

  -- 우산: open umbrella, coloured canopy, metal shaft, J handle
  { "usan", "blue", function(img, R)
    L.set(img, 12, 1, "v"); L.set(img, 11, 1, "u")
    L.ebox(img, 1, 2, 22, 22, function(nx, ny, x, y)
      local seg = math.floor((nx + 1) * 2.5)
      local c = (seg % 2 == 0) and R[2] or R[3]
      if seg == 0 then c = R[1] end
      if seg == 4 then c = R[3] end
      if ny < -0.8 and nx < 0 then c = R[1] end
      return c
    end, { y1 = 11 })
    -- scalloped edge
    for i = 0, 4 do
      local x0 = 1 + i * 4 + (i > 2 and 1 or 0)
      L.hline(img, x0 + 1, x0 + 3, 12, R[3])
    end
    for _, x in ipairs({ 5, 10, 13, 18 }) do L.vline(img, x, 6, 11, R[4] == "z" and "w" or R[4]) end
    L.vline(img, 12, 12, 20, "v"); L.vline(img, 11, 12, 20, "u")
    L.map(img, 7, 19, { "....uv", "e...uv", "ef..ev", ".effe." })
  end },
} }
