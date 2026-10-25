-- Greetings / farewells (Expression words). 24x24, outline added by icons.lua.
return function(icon, L, H)
  -- 안녕하세요: hand waving hello, motion lines
  icon("annyeonghaseyo", function(img)
    L.map(img, 3, 1, {
      ".......EE.EE........",
      "......EEEFEEE.EE....",
      "...EE.EEEFEEEFEEE...",
      "..EEEFEEEFEEEFEEE...",
      "..EEEFEEEFEEEFEEE...",
      "..EEEFEEEFEEEFEEE...",
      "..EEEFEEEFEEEFEEF...",
      "..EEEFEEEFEEEFEEF...",
      "..EEEEEEEEEEEEEEF...",
      "..EEEEEEEEEEEEEEF.EE",
      "..EEEEEEEEEEEEEEFEEE",
      "..EEEEEEEEEEEEEEEEEF",
      "..EEEEEEEDDEEEEEEEF.",
      "...EEEEEEEEEEEEEEF..",
      "...EEEEEEEEEEEEEF...",
      "....FEEEEEEEEEEF....",
      ".....FFEEEEEEFF.....",
      ".......jjjjjj.......",
      ".......jkkkkj.......",
      ".......jjjjjj.......",
    })
    -- wave lines
    L.map(img, 0, 4, { ".l", "l.", "l.", ".l" })
    L.map(img, 21, 2, { "l.", ".l", ".l", "l." })
  end)

  -- 환영해요: open door with warm light and confetti
  icon("hwanyeonghaeyo", function(img)
    L.rect(img, 4, 3, 14, 19, "f")                     -- frame
    L.rect(img, 6, 5, 10, 17, "l")                     -- light inside
    L.vgradient(img, 6, 5, 10, 17, { { 5, "l" }, { 14, "k" }, { 21, "j" } })
    L.map(img, 6, 4, {                                  -- door swung open (left)
      "ee....",
      "eee...",
      "ebee..",
      "ebee..",
      "ebee..",
      "ebee..",
      "ebke..",
      "ebee..",
      "ebee..",
      "ebee..",
      "ebee..",
      "ebee..",
      "eee...",
      "ee....",
    })
    L.hline(img, 2, 20, 22, "e"); L.hline(img, 3, 19, 21, "d")   -- doormat
    for _, p in ipairs({ { 19, 3, "i" }, { 21, 6, "r" }, { 18, 8, "m" }, { 2, 2, "C" }, { 20, 11, "l" }, { 1, 7, "s" } }) do
      L.set(img, p[1], p[2], p[3]); L.set(img, p[1] + 1, p[2] + 1, p[3])
    end
  end)

  -- 감사합니다: heart held up by two hands
  icon("gamsahamnida", function(img)
    L.map(img, 3, 2, {
      "..iiii..iiii..",
      ".iDDiii.iiiih.",
      "iDtDiiiiiiiiih",
      "iDDiiiiiiiiiih",
      "iiiiiiiiiiiiih",
      ".iiiiiiiiiiih.",
      "..iiiiiiiiih..",
      "...iiiiiiih...",
      "....iiiiih....",
      ".....iiih.....",
      "......ih......",
    }, {})
    L.map(img, 1, 12, {
      "EE..................",
      "EEE...............EE",
      "EEEE.............EEE",
      ".EEEE...........EEEF",
      "..EEEEE.......EEEEF.",
      "...EEEEEE...EEEEEF..",
      "....FEEEEE.EEEEEF...",
      ".....FFEEE.EEEFF....",
      "......jjjj.jjjj.....",
      "......jkkj.jkkj.....",
    })
    L.map(img, 2, 12, { "", "", "", "", "", "", "", "", "", "" })
    -- tilt heart a little to sit above hands: shift handled by map placement
    L.set(img, 20, 3, "l"); L.set(img, 21, 2, "l"); L.set(img, 22, 3, "l"); L.set(img, 21, 4, "l")
  end)

  -- 또 오세요: shop door with OPEN sign and a come-back arrow
  icon("tto_oseyo", function(img)
    L.rect(img, 1, 2, 12, 20, "q"); L.rect(img, 2, 3, 10, 19, "r")
    L.rect(img, 3, 4, 8, 7, "s"); L.hline(img, 3, 10, 4, "t"); L.set(img, 4, 5, "t")  -- glass
    L.rect(img, 3, 12, 8, 9, "q"); L.vline(img, 3, 12, 20, "r")
    L.set(img, 10, 15, "k"); L.set(img, 9, 15, "l")                                -- handle
    L.line(img, 5, 7, 7, 5, "f"); L.line(img, 9, 7, 7, 5, "f")                     -- sign string
    L.rect(img, 3, 7, 9, 4, "c"); L.hline(img, 4, 10, 8, "m"); L.hline(img, 4, 9, 9, "n")
    -- a heart: "come again, we like you"
    L.map(img, 14, 8, {
      ".ii.ii.",
      "iDiiiih",
      "itiiiih",
      "iiiiiih",
      ".iiiih.",
      "..iih..",
      "...h...",
    })
    L.map(img, 19, 3, { ".l.", "lll", ".l." })
    L.map(img, 15, 18, { "l" }); L.map(img, 21, 16, { "k" })
  end)

  -- 또 봐요: eye with a wink sparkle
  icon("tto_bwayo", function(img)
    L.ebox(img, 1, 5, 22, 18, function(nx, ny) return ny > 0.55 and "u" or "t" end)
    L.ebox(img, 7, 6, 16, 17, function(nx, ny)
      if nx * nx + ny * ny < 0.25 then return "z" end
      if ny < -0.2 and nx < 0 then return "r" end
      return "q"
    end)
    L.rect(img, 9, 8, 2, 2, "t"); L.set(img, 13, 14, "t")
    -- lashes / lids
    for x = 3, 20 do
      local t = math.abs(x - 11.5) / 9
      L.set(img, x, math.floor(4 + t * t * 4), "z")
    end
    L.map(img, 3, 1, { "z.....z.....z" }); L.map(img, 4, 2, { "z....z....z" })
    L.map(img, 18, 18, { ".l.", "lll", ".l." })
  end)

  -- 잘 가요: footsteps walking away down a path, little sun
  icon("jal_gayo", function(img)
    L.ebox(img, 13, 1, 21, 9, function(nx, ny) return (nx < -0.2 and ny < -0.2) and "l" or "k" end, { y1 = 6 })
    L.hline(img, 1, 22, 7, "j")
    L.map(img, 1, 8, {
      "nmmmmmmmmmmmmmmmmmmmmn",
      "nmmmmmmmdddmmmmmmmmmmn",
      "nmmmmmmddddddmmmmmmmmn",
      "nnmmmmddddddddmmmmmmnn",
      "nnmmmddddddddddmmmmmnn",
      "nnnmmdddddddddddmmmnnn",
      "nnnmddddddddddddddmnnn",
      "nnnddddddddddddddddnnn",
      "nnddddddddddddddddddnn",
      "nddddddddddddddddddddn",
      "dddddddddddddddddddddd",
      "dddddddddddddddddddddd",
      "dddddddddddddddddddddd",
      "dddddddddddddddddddddd",
    })
    -- footprints getting smaller towards the horizon
    for _, p in ipairs({ { 7, 18, 2 }, { 12, 15, 2 }, { 9, 12, 1 }, { 12, 10, 1 } }) do
      local x, y, s = p[1], p[2], p[3]
      if s == 2 then L.map(img, x, y, { ".ff", "fff", "fff", ".f." }) else L.map(img, x, y, { "ff", "f." }) end
    end
  end)
end
