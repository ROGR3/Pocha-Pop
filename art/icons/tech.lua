-- 용산 (electronics bazaar): devices and repairs. 24x24, outline added by icons.lua.
return function(icon, L, H)
  local floor = math.floor

  -- Diagonal thick line: same line drawn with offsets, each in its own colour.
  local function thick(img, x1, y1, x2, y2, layers)
    for _, l in ipairs(layers) do L.line(img, x1 + l[1], y1 + l[2], x2 + l[1], y2 + l[2], l[3]) end
  end
  local function corners(img, x0, y0, x1, y1)
    L.erase(img, x0, y0); L.erase(img, x1, y0); L.erase(img, x0, y1); L.erase(img, x1, y1)
  end
  local function sparkle(img, x, y, c) L.map(img, x, y, { "." .. c .. ".", c .. c .. c, "." .. c .. "." }) end

  -- 핸드폰: smartphone with app grid
  icon("haendeupon", function(img)
    L.rect(img, 6, 1, 12, 22, "y"); corners(img, 6, 1, 17, 22)
    L.vline(img, 6, 2, 21, "x"); L.hline(img, 7, 16, 1, "x")
    L.vgradient(img, 7, 3, 10, 17, { { 3, "r" }, { 19, "B" } })
    L.hline(img, 10, 13, 2, "w")
    local cols = { "i", "l", "m", "s", "D", "j", "t", "k", "C", "m", "r", "l" }
    local k = 1
    for row = 0, 3 do for c = 0, 2 do
      local x, y = 8 + c * 3, 5 + row * 3
      L.rect(img, x, y, 2, 2, cols[k]); k = k + 1
    end end
    L.hline(img, 8, 15, 18, "x"); L.hline(img, 10, 13, 21, "v")
    L.set(img, 7, 3, "s"); L.set(img, 8, 3, "s")
  end)

  -- 노트북: open laptop
  icon("noteubuk", function(img)
    L.rect(img, 3, 2, 18, 13, "u"); corners(img, 3, 2, 20, 14)
    L.hline(img, 4, 19, 2, "t"); L.vline(img, 20, 3, 13, "v")
    L.vgradient(img, 4, 3, 16, 11, { { 3, "r" }, { 13, "q" } })
    L.rect(img, 6, 5, 8, 5, "t"); L.hline(img, 6, 13, 5, "s"); L.hline(img, 7, 12, 7, "v"); L.hline(img, 7, 10, 8, "v")
    L.rect(img, 15, 8, 3, 3, "l")
    for y = 15, 20 do
      local inset = floor((20 - y) * 2 / 5 + 0.5)
      L.hline(img, 1 + inset, 22 - inset, y, y == 20 and "v" or "u")
    end
    for y = 16, 17 do for x = 5 + (17 - y), 18 - (17 - y), 2 do L.set(img, x, y, "w") end end
    L.rect(img, 9, 18, 6, 1, "v")
    L.hline(img, 3, 20, 15, "t")
  end)

  -- 카메라: black camera with big lens
  icon("kamera", function(img)
    L.rect(img, 7, 4, 9, 4, "y"); L.hline(img, 7, 15, 4, "x")
    L.rect(img, 2, 5, 4, 2, "u"); L.hline(img, 2, 5, 5, "t")
    L.rect(img, 17, 5, 3, 2, "i"); L.set(img, 17, 5, "D")
    L.rect(img, 1, 7, 22, 14, "y"); corners(img, 1, 7, 22, 20)
    L.rect(img, 1, 8, 22, 2, "v"); L.hline(img, 2, 21, 8, "u")
    L.vline(img, 1, 10, 19, "x"); L.rect(img, 2, 11, 3, 8, "z")
    L.ebox(img, 6, 8, 17, 19, function(nx, ny)
      local d = nx * nx + ny * ny
      if d > 0.75 then return (nx + ny < 0) and "u" or "v" end
      if d > 0.5 then return "w" end
      if d > 0.3 then return "z" end
      if nx < -0.1 and ny < -0.1 then return "r" end
      return "q"
    end)
    L.set(img, 10, 12, "t"); L.set(img, 11, 12, "s"); L.set(img, 10, 13, "s")
    L.rect(img, 19, 11, 2, 2, "l")
  end)

  -- 컴퓨터: desktop tower, monitor and keyboard
  icon("keompyuteo", function(img)
    L.rect(img, 1, 4, 6, 18, "u"); L.vline(img, 1, 4, 21, "t"); L.vline(img, 6, 4, 21, "v")
    L.hline(img, 2, 5, 6, "v"); L.hline(img, 2, 5, 8, "v")
    L.set(img, 3, 11, "m"); L.set(img, 4, 11, "n")
    for y = 15, 19, 2 do L.hline(img, 2, 5, y, "v") end
    L.rect(img, 8, 2, 15, 12, "u"); L.hline(img, 8, 22, 2, "t"); L.vline(img, 22, 3, 13, "v")
    L.rect(img, 9, 3, 13, 9, "r")
    L.hline(img, 9, 21, 11, "x")
    L.rect(img, 11, 5, 6, 4, "t"); L.hline(img, 11, 16, 5, "q"); L.set(img, 16, 5, "i")
    L.rect(img, 18, 7, 2, 2, "l")
    L.rect(img, 14, 14, 3, 2, "v"); L.hline(img, 12, 18, 16, "w")
    L.rect(img, 8, 18, 15, 3, "u"); L.hline(img, 8, 22, 18, "t"); L.hline(img, 8, 22, 20, "v")
    for x = 9, 21, 2 do L.set(img, x, 19, "w") end
  end)

  -- 텔레비전: old wooden CRT TV on legs with rabbit-ear antenna
  icon("tellebijeon", function(img)
    L.line(img, 11, 5, 6, 1, "v"); L.line(img, 12, 5, 17, 1, "v")
    L.set(img, 6, 1, "u"); L.set(img, 17, 1, "u")
    L.rect(img, 10, 4, 4, 2, "w")
    L.rect(img, 2, 6, 20, 13, "e"); corners(img, 2, 6, 21, 18)
    L.hline(img, 3, 20, 6, "d"); L.vline(img, 2, 7, 17, "d"); L.hline(img, 3, 20, 18, "f"); L.vline(img, 21, 7, 17, "f")
    L.rect(img, 4, 8, 12, 9, "w"); corners(img, 4, 8, 15, 16)
    L.rect(img, 5, 9, 10, 7, "v")
    L.hline(img, 6, 8, 9, "u"); L.set(img, 5, 10, "u"); L.set(img, 5, 11, "u"); L.set(img, 6, 10, "t")
    for y = 11, 15, 2 do L.hline(img, 7, 14, y, "w") end
    L.ebox(img, 17, 8, 19, 10, function(nx, ny) return nx < 0 and "c" or "u" end)
    L.ebox(img, 17, 11, 19, 13, function(nx, ny) return nx < 0 and "c" or "u" end)
    for y = 14, 16 do L.hline(img, 17, 19, y, (y % 2 == 0) and "f" or "e") end
    L.line(img, 5, 19, 4, 22, "f"); L.line(img, 18, 19, 19, 22, "f")
  end)

  -- 냉장고: two-door refrigerator with magnets
  icon("naengjanggo", function(img)
    L.rect(img, 5, 1, 14, 21, "t"); corners(img, 5, 1, 18, 21)
    L.vline(img, 17, 2, 20, "u"); L.vline(img, 18, 2, 20, "v"); L.hline(img, 6, 17, 21, "u")
    L.hline(img, 5, 18, 8, "v"); L.hline(img, 6, 17, 9, "u")
    L.vline(img, 6, 3, 7, "s"); L.vline(img, 6, 11, 19, "s")
    L.rect(img, 15, 3, 1, 4, "w"); L.rect(img, 15, 11, 1, 6, "w")
    L.rect(img, 8, 11, 2, 2, "i"); L.rect(img, 11, 13, 2, 2, "l"); L.rect(img, 8, 15, 2, 2, "m")
    L.rect(img, 9, 4, 4, 3, "c"); L.hline(img, 9, 12, 5, "v")
    L.rect(img, 6, 22, 2, 1, "w"); L.rect(img, 16, 22, 2, 1, "w")
  end)

  -- 세탁기: front-loading washing machine
  icon("setakgi", function(img)
    L.rect(img, 3, 1, 18, 21, "t"); corners(img, 3, 1, 20, 21)
    L.vline(img, 20, 2, 20, "v"); L.vline(img, 19, 2, 20, "u"); L.hline(img, 4, 19, 21, "u")
    L.hline(img, 3, 20, 5, "v")
    L.rect(img, 5, 2, 5, 2, "u"); L.hline(img, 5, 9, 3, "v")
    L.ebox(img, 15, 1, 18, 4, function(nx, ny) return nx < 0 and "w" or "x" end); L.set(img, 16, 2, "u")
    L.set(img, 12, 2, "m"); L.set(img, 13, 3, "i")
    L.ebox(img, 4, 7, 19, 21, function(nx, ny)
      local d = nx * nx + ny * ny
      if d > 0.78 then return (nx + ny < 0) and "u" or "v" end
      if d > 0.6 then return "w" end
      if ny > 0.05 then return (nx < -0.2) and "r" or "q" end
      return (nx < -0.2 and ny < -0.3) and "t" or "s"
    end, { y1 = 21 })
    L.set(img, 9, 12, "t"); L.set(img, 13, 16, "s"); L.set(img, 11, 18, "s"); L.set(img, 15, 15, "t")
    L.hline(img, 7, 9, 14, "s"); L.hline(img, 13, 16, 13, "s")
  end)

  -- 에어컨: wall unit blowing cold air
  icon("eeokeon", function(img)
    L.rect(img, 1, 2, 22, 8, "t"); corners(img, 1, 2, 22, 9)
    L.hline(img, 2, 21, 9, "v"); L.hline(img, 1, 22, 7, "u"); L.hline(img, 2, 21, 8, "w")
    L.vline(img, 22, 3, 6, "u")
    L.set(img, 19, 4, "s"); L.set(img, 20, 4, "m")
    L.hline(img, 3, 9, 4, "u")
    for i, x0 in ipairs({ 4, 10, 16 }) do
      for y = 11, 21 do
        local x = x0 + floor(math.sin((y - 11) * 0.7 + i) * 1.4 + 0.5) + floor((y - 11) / 4)
        L.set(img, x, y, "s"); L.set(img, x + 1, y, (y > 16) and "q" or "r")
      end
    end
    L.map(img, 1, 13, { ".t.", "tst", ".t." })
  end)

  -- 선풍기: electric fan
  icon("seonpunggi", function(img)
    L.ebox(img, 5, 18, 18, 22, function(nx, ny) return ny < 0 and "t" or "u" end)
    L.set(img, 8, 20, "s"); L.set(img, 10, 20, "m")
    L.rect(img, 11, 14, 2, 6, "u"); L.vline(img, 11, 14, 19, "t")
    L.ebox(img, 2, 1, 21, 17, function(nx, ny)
      local d = math.sqrt(nx * nx + ny * ny)
      if d > 0.9 then return (nx + ny < 0) and "t" or "v" end
      local a
      if nx > 0 then a = math.atan(ny / nx) elseif nx < 0 then a = math.atan(ny / nx) + math.pi else a = (ny > 0) and math.pi / 2 or -math.pi / 2 end
      if d < 0.2 then return "u" end
      if d < 0.28 then return "v" end
      if math.cos(3 * (a - d * 1.2)) > -0.25 then return (math.cos(3 * (a - d * 1.2) + 0.9) > 0.6) and "s" or "r" end
      if d > 0.55 and d < 0.62 then return "v" end
      return (nx + ny < 0) and "t" or "u"
    end)
    L.set(img, 11, 8, "t")
  end)

  -- 복사기: office copier with paper coming out
  icon("boksagi", function(img)
    L.rect(img, 3, 8, 18, 14, "u"); L.vline(img, 3, 8, 21, "t"); L.vline(img, 20, 8, 21, "v")
    L.rect(img, 2, 6, 15, 2, "w"); L.hline(img, 2, 16, 6, "v")
    L.rect(img, 15, 3, 7, 5, "x"); L.hline(img, 15, 21, 3, "w")
    L.rect(img, 16, 4, 3, 2, "s"); L.set(img, 20, 4, "m"); L.set(img, 20, 6, "i")
    L.hline(img, 4, 19, 14, "v"); L.hline(img, 4, 19, 18, "v")
    L.rect(img, 9, 15, 6, 1, "w"); L.rect(img, 9, 19, 6, 1, "w")
    L.hline(img, 4, 19, 21, "w")
    -- output paper on the left
    L.rect(img, 1, 10, 7, 3, "x")
    L.map(img, 1, 2, {
      "..tttt.",
      ".tttttu",
      ".tvvvtu",
      "ttttttu",
      "tvvvvtu",
      "ttttttu",
      "tvvttuu",
      "tttttu.",
    })
  end)

  -- 인터넷: globe with wifi waves
  icon("inteonet", function(img)
    L.ebox(img, 1, 7, 16, 22, function(nx, ny, x, y)
      local land = (math.sin(x * 0.9) + math.cos(y * 0.8 + x * 0.3)) > 0.6
      if land then return (nx < -0.2 and ny < -0.2) and "m" or ((nx + ny > 0.6) and "o" or "n") end
      if nx < -0.3 and ny < -0.3 then return "s" end
      if nx + ny > 0.6 then return "q" end
      return "r"
    end)
    L.set(img, 5, 10, "t")
    local cx, cy = 17, 9
    for y = 1, 10 do for x = 10, 22 do
      local dx, dy = x + 0.5 - cx, y + 0.5 - cy
      local d = math.sqrt(dx * dx + dy * dy)
      if dy < 0 and math.abs(dx) < -dy * 1.1 then
        for _, r in ipairs({ 3, 5.5, 8 }) do
          if math.abs(d - r) < 0.75 then L.set(img, x, y, "l") end
        end
      end
    end end
    L.rect(img, 16, 8, 2, 2, "k")
  end)

  -- 카드: credit card with chip (second card behind)
  icon("kadeu", function(img)
    L.rect(img, 4, 3, 19, 13, "C"); corners(img, 4, 3, 22, 15); L.hline(img, 5, 21, 3, "D")
    L.rect(img, 1, 7, 19, 14, "q"); corners(img, 1, 7, 19, 20)
    L.vgradient(img, 2, 8, 17, 12, { { 8, "r" }, { 19, "q" } })
    L.hline(img, 2, 18, 7, "s"); L.vline(img, 1, 8, 19, "s")
    L.rect(img, 3, 10, 4, 3, "k"); L.hline(img, 3, 6, 10, "l"); L.set(img, 4, 11, "j"); L.set(img, 5, 12, "j")
    for x = 3, 13, 3 do L.hline(img, x, x + 1, 15, "t") end
    L.hline(img, 3, 8, 17, "u")
    L.ebox(img, 13, 16, 15, 18, "i"); L.ebox(img, 15, 16, 17, 18, "k"); L.set(img, 15, 17, "j")
  end)

  -- 볼펜: ballpoint pen with an ink scribble
  icon("bolpen", function(img)
    L.map(img, 3, 18, { "....q.....q.", "q..q.q...q.q", ".qq...q.q...", "......qq...." })
    thick(img, 19, 3, 8, 14, { { -1, 0, "s" }, { 0, 0, "r" }, { 1, 0, "q" }, { 1, 1, "x" } })
    thick(img, 9, 13, 6, 16, { { -1, 0, "w" }, { 0, 0, "y" }, { 1, 0, "y" }, { 1, 1, "z" } })
    L.line(img, 5, 16, 4, 17, "u"); L.line(img, 6, 17, 5, 18, "v"); L.set(img, 4, 18, "z"); L.set(img, 5, 17, "u")
    thick(img, 21, 1, 20, 2, { { -1, 0, "t" }, { 0, 0, "u" }, { 1, 0, "v" } })
    L.line(img, 21, 4, 16, 9, "u"); L.set(img, 16, 9, "v")
  end)

  -- 할인: red price tag with a pixel % sign
  icon("harin", function(img)
    for y = 4, 19 do
      local d = math.abs(y - 11.5)
      local xl = 1 + floor(d * 0.8)
      if d > 5 then xl = 5 end
      L.hline(img, xl, 21, y, "i")
    end
    L.erase(img, 21, 4); L.erase(img, 21, 19)
    L.hline(img, 5, 20, 4, "D"); L.line(img, 1, 11, 5, 6, "D")
    L.hline(img, 5, 20, 19, "h"); L.vline(img, 21, 5, 18, "h")
    L.rect(img, 4, 11, 2, 2, "_")
    L.map(img, 9, 7, {
      ".tt.....tt",
      "tttt...tt.",
      "tttt..tt..",
      ".tt..tt...",
      "....tt....",
      "...tt.....",
      "..tt..tt..",
      ".tt..tttt.",
      "tt...tttt.",
      "......tt..",
    })
    L.map(img, 1, 1, { "c...", ".c..", "..c.", "..c." })
    sparkle(img, 19, 0, "l")
  end)

  -- 고장났어요: cracked retro radio with smoke and a spark
  icon("gojangnasseoyo", function(img)
    L.line(img, 6, 8, 3, 3, "v"); L.line(img, 3, 3, 5, 1, "v")
    L.rect(img, 1, 8, 19, 14, "m"); corners(img, 1, 8, 19, 21)
    L.hline(img, 2, 18, 8, "t"); L.vline(img, 1, 9, 20, "t")
    L.hline(img, 2, 18, 21, "o"); L.vline(img, 19, 9, 20, "n")
    L.ebox(img, 3, 11, 10, 18, function(nx, ny, x, y) return ((x + y) % 2 == 0) and "o" or "n" end)
    L.rect(img, 12, 11, 6, 3, "c"); L.hline(img, 12, 17, 13, "d"); L.set(img, 15, 11, "i"); L.set(img, 15, 12, "i")
    L.ebox(img, 12, 15, 14, 17, "c"); L.ebox(img, 15, 15, 17, 17, "c")
    -- crack
    L.map(img, 6, 8, {
      "zz....",
      ".z....",
      ".zz...",
      "..z...",
      "..zz..",
      "...z..",
      "...zz.",
      "....z.",
      "...zz.",
      "...z..",
      "...zz.",
      "....z.",
    })
    -- smoke
    L.ebox(img, 13, 3, 18, 7, function(nx, ny) return ny < 0 and "u" or "v" end)
    L.ebox(img, 17, 1, 22, 5, function(nx, ny) return (nx < 0 and ny < 0) and "u" or "v" end)
    L.ebox(img, 19, 5, 22, 8, "w")
    L.map(img, 20, 10, { "l..", ".ll", "ll.", "..l" })
  end)

  -- 고치다: crossed wrench and screwdriver
  icon("gochida", function(img)
    -- wrench (bottom-left to top-right)
    thick(img, 5, 18, 16, 7, { { -1, 0, "t" }, { 0, 0, "u" }, { 1, 0, "u" }, { 1, 1, "v" } })
    L.ebox(img, 14, 1, 22, 9, function(nx, ny) return (nx + ny < -0.3) and "t" or ((nx + ny > 0.6) and "v" or "u") end)
    for _, p in ipairs({ { 18, 5 }, { 19, 4 }, { 20, 3 }, { 21, 2 }, { 19, 3 }, { 20, 2 }, { 18, 4 }, { 19, 5 }, { 20, 4 }, { 21, 3 }, { 22, 2 }, { 21, 1 }, { 22, 1 } }) do
      L.erase(img, p[1], p[2])
    end
    L.ebox(img, 1, 16, 7, 22, function(nx, ny) return (nx + ny < -0.3) and "t" or ((nx + ny > 0.6) and "v" or "u") end)
    L.rect(img, 3, 18, 3, 3, "_"); L.set(img, 3, 18, "u"); L.set(img, 5, 20, "u")
    -- screwdriver (tip top-left, handle bottom-right)
    thick(img, 3, 3, 12, 12, { { 0, 0, "u" }, { 1, 0, "v" } })
    L.set(img, 2, 2, "w"); L.set(img, 3, 2, "w")
    thick(img, 13, 13, 20, 20, { { -1, 0, "D" }, { 0, -1, "D" }, { 0, 0, "i" }, { 1, 0, "i" }, { 0, 1, "h" }, { 1, 1, "h" }, { 2, 1, "h" } })
    L.set(img, 13, 12, "k"); L.set(img, 12, 13, "k"); L.set(img, 13, 13, "k"); L.set(img, 14, 14, "k")
    L.set(img, 21, 21, "h"); L.set(img, 20, 21, "h"); L.set(img, 21, 20, "h")
    L.set(img, 15, 15, "l"); L.set(img, 17, 17, "l")
  end)

  local _ = H
end
