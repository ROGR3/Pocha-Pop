-- Adjectives used in customer reactions. 24x24.
return function(icon, L, H)
  -- 맵다: red chili with a flame
  icon("maepda", function(img)
    L.map(img, 2, 1, {
      ".............k......",
      "............klk.....",
      "...........kllk..k..",
      "..........kllllkkl..",
      "...........kllllll..",
      "............jlllj...",
      ".............jjj....",
      "...........mmn......",
      "..........mmnn......",
      ".........iiiih......",
      "........iDiiiih.....",
      ".......iDiiiiih.....",
      "......iDiiiiiih.....",
      ".....iiiiiiiih......",
      "....iiiiiiiih.......",
      "...iiiiiiihh........",
      "..iiiiiihh..........",
      ".iiiiihh............",
      "iiiihh..............",
      "ihh.................",
    })
  end)

  -- 뜨겁다: thermometer in the red + heat waves
  icon("tteugeopda", function(img)
    L.rect(img, 9, 2, 6, 15, "u"); L.rect(img, 10, 2, 4, 15, "t")
    L.hline(img, 10, 13, 1, "u")
    L.rect(img, 11, 6, 2, 12, "i"); L.set(img, 11, 6, "D")
    L.ebox(img, 7, 15, 16, 22, function(nx, ny) return (nx < -0.3 and ny < -0.2) and "D" or (nx > 0.4 and "h" or "i") end)
    for y = 4, 12, 3 do L.hline(img, 14, 15, y, "v") end
    L.map(img, 1, 3, { ".j", "j.", ".j", "j.", ".j", "j." })
    L.map(img, 19, 4, { "j.", ".j", "j.", ".j", "j.", ".j" })
    L.map(img, 3, 1, { "k" }); L.map(img, 20, 2, { "k" })
  end)

  -- 달다: honey jar dripping
  icon("dalda", function(img)
    L.rect(img, 6, 3, 12, 3, "e"); L.hline(img, 6, 17, 3, "d"); L.hline(img, 6, 17, 5, "f")
    L.ebox(img, 4, 5, 19, 22, function(nx, ny)
      if nx < -0.55 then return "l" end
      if nx > 0.5 then return "j" end
      if ny < -0.45 then return "l" end
      return "k"
    end)
    L.rect(img, 7, 11, 10, 6, "c"); L.hline(img, 7, 16, 11, "t"); L.hline(img, 7, 16, 16, "d")
    L.map(img, 9, 12, { ".j.j.", "jjjjj", ".jjj.", "..j.." }) -- little bee-ish heart label
    -- drip over the rim
    L.map(img, 6, 6, { "kk", "kk", "k.", "k." }); L.map(img, 15, 6, { "kk", ".k" })
    L.set(img, 5, 6, "l")
  end)

  -- 맛있다: happy face licking its lips
  icon("masitda", function(img)
    L.ebox(img, 1, 1, 22, 22, function(nx, ny)
      if nx < -0.4 and ny < -0.4 then return "l" end
      if nx > 0.5 or ny > 0.6 then return "j" end
      return "k"
    end)
    -- happy closed eyes
    L.map(img, 5, 7, { ".zz.", "z..z" }); L.map(img, 15, 7, { ".zz.", "z..z" })
    -- big smile + tongue
    L.map(img, 5, 12, {
      "z............z",
      ".z..........z.",
      "..zzzzzzzzzz..",
      "...zhhhhDDz...",
      "....zzzDDDz...",
      ".........zz...",
    })
    L.set(img, 4, 11, "D"); L.set(img, 19, 11, "D"); L.hline(img, 3, 5, 11, "D"); L.hline(img, 18, 20, 11, "D")
  end)

  -- 비싸다: money bag with an up arrow
  icon("bissada", function(img)
    L.ebox(img, 2, 7, 17, 22, function(nx, ny)
      if nx < -0.5 then return "c" end
      if nx > 0.45 then return "e" end
      return "d"
    end)
    L.map(img, 6, 3, { "f....f", ".ffff.", ".dddd.", "dddddd", "..ff.." })
    L.map(img, 7, 11, { ".kkk.", "k.k..", ".kkk.", "..k.k", ".kkk." })
    L.vline(img, 9, 10, 16, "k")
    -- red up arrow
    L.map(img, 15, 1, {
      "...i...",
      "..iii..",
      ".iiiii.",
      "iiiiiii",
      "..iii..",
      "..iii..",
      "..iii..",
      "..iii..",
    })
  end)

  -- 싸다: price tag with a green down arrow
  icon("ssada", function(img)
    L.map(img, 1, 3, {
      ".....cccccccccccc",
      "....ccccccccccccd",
      "...cccccccccccccd",
      "..cccfcccccccccccd",
      ".cccf.fcccccccccd",
      "cccccfccccccccccd",
      ".ccccccccccccccd.",
      "..ccccccccccccd..",
      "...ddddddddddd...",
    })
    L.map(img, 8, 6, { "mm.mm", ".mmm.", "..m.." })
    L.map(img, 7, 10, { "nnnnnnnn" })
    -- green down arrow
    L.map(img, 15, 12, {
      "..mmm..",
      "..mmm..",
      "..mmm..",
      "..mmm..",
      "mmmmmmm",
      ".mmmmm.",
      "..mmm..",
      "...m...",
    })
  end)

  -- 예쁘다: pink flower with sparkles
  icon("yeppeuda", function(img)
    local petals = { { 12, 5 }, { 18, 10 }, { 16, 17 }, { 8, 17 }, { 6, 10 } }
    for _, p in ipairs(petals) do
      L.ebox(img, p[1] - 4, p[2] - 4, p[1] + 3, p[2] + 3, function(nx, ny) return (nx < -0.2 and ny < -0.2) and "t" or (ny > 0.4 and "C" or "D") end)
    end
    L.ebox(img, 9, 9, 15, 15, function(nx, ny) return nx < 0 and "l" or "k" end)
    L.set(img, 11, 11, "t")
    L.map(img, 0, 0, { ".l.", "lll", ".l." })
    L.map(img, 20, 19, { ".l.", "lll", ".l." })
    L.set(img, 21, 2, "t")
  end)

  -- 크다: big box pushing arrows outwards
  icon("keuda", function(img)
    L.rect(img, 6, 6, 12, 12, "j"); L.rect(img, 6, 6, 12, 2, "k"); L.rect(img, 16, 8, 2, 10, "a"); L.hline(img, 6, 17, 17, "a")
    L.vline(img, 11, 6, 17, "b"); L.vline(img, 12, 6, 17, "b")
    local arrow = { "ttt", "tt.", "t.t" }
    L.map(img, 1, 1, arrow)
    L.map(img, 20, 1, arrow, { flip = true })
    L.map(img, 1, 20, { "t.t", "tt.", "ttt" })
    L.map(img, 20, 20, { "t.t", "tt.", "ttt" }, { flip = true })
    L.line(img, 2, 2, 5, 5, "t"); L.line(img, 21, 2, 18, 5, "t"); L.line(img, 2, 21, 5, 18, "t"); L.line(img, 21, 21, 18, 18, "t")
  end)

  -- 작다: tiny box with arrows squeezing inwards
  icon("jakda", function(img)
    L.rect(img, 9, 9, 6, 6, "j"); L.hline(img, 9, 14, 9, "k"); L.vline(img, 14, 10, 14, "a"); L.hline(img, 9, 14, 14, "a")
    L.line(img, 1, 1, 6, 6, "t"); L.map(img, 4, 6, { "...", "ttt" }); L.map(img, 6, 4, { "t", "t" })
    L.line(img, 22, 1, 17, 6, "t"); L.map(img, 17, 6, { "ttt" }); L.map(img, 17, 4, { "t", "t" })
    L.line(img, 1, 22, 6, 17, "t"); L.map(img, 4, 17, { "ttt" }); L.map(img, 6, 18, { "t", "t" })
    L.line(img, 22, 22, 17, 17, "t"); L.map(img, 17, 17, { "ttt" }); L.map(img, 17, 18, { "t", "t" })
  end)

  -- 좋다: thumbs up
  icon("jota", function(img)
    L.map(img, 2, 2, {
      ".........EE.........",
      "........EEEF........",
      "........EEEF........",
      ".......EEEEF........",
      "......EEEEF.........",
      ".....EEEEEF.........",
      "rrr.EEEEEEEEEEEEF...",
      "rqrEEEEEEEEEEEEEEF..",
      "rqrEEEEEEEEEEEEEEF..",
      "rqrEEEEEEEEFFFFFF...",
      "rqrEEEEEEEEEEEEEEF..",
      "rqrEEEEEEEEEEEEEEF..",
      "rqrEEEEEEEEFFFFFF...",
      "rqrEEEEEEEEEEEEEF...",
      "rqrEEEEEEEEEEEEEF...",
      "rqr.EEEEEEEFFFFF....",
      "rqr..EEEEEEEEEEF....",
      "rrr...FFFFFFFFF.....",
    })
    L.map(img, 19, 0, { ".l.", "lll", ".l." })
  end)
end
