-- Words added for the last jamo (ㅒ ㅙ ㅞ ㅝ): 얘기, 웨이터, 반가워요, 괜찮다.
return function(icon, L, H)
  -- 얘기: two overlapping chat bubbles with dots
  icon("yaegi", function(img)
    L.map(img, 1, 2, {
      "..tttttttttttt....",
      ".ttttttttttttuu...",
      "tttttttttttttuuv..",
      "tttzttzttzttttuv..",
      "ttttttttttttttuv..",
      ".tttttttttttuuv...",
      "..ttttttttuuvv....",
      "...tuv............",
      "..tu..............",
      ".tv...............",
    })
    L.map(img, 7, 10, {
      "....kkkkkkkkkkkk.",
      "...klllllllllllkj",
      "..klllllllllllllj",
      "..lllflllflllflkj",
      "..llllllllllllllj",
      "...llllllllllllkj",
      "....kkkkkkkkkkjj.",
      "............kkj..",
      ".............kj..",
      "..............j..",
    })
  end)

  -- 웨이터: waiter's tray with a cloche and a bow tie
  icon("weiteo", function(img)
    L.ebox(img, 4, 3, 19, 14, function(nx, ny) if ny > 0.55 then return nil end if nx < -0.4 and ny < 0 then return "t" end if nx > 0.4 then return "v" end return "u" end)
    L.map(img, 10, 1, { ".vv.", "vuuv" })
    L.set(img, 7, 6, "t"); L.set(img, 8, 5, "t")
    L.rect(img, 2, 11, 20, 2, "w"); L.hline(img, 2, 21, 11, "u"); L.hline(img, 3, 20, 13, "x")
    -- hand under the tray
    L.map(img, 9, 14, { ".EEEEE.", "EEEEEEF", ".FFFFF." })
    L.rect(img, 10, 17, 5, 3, "t"); L.vline(img, 14, 17, 19, "u")
    -- bow tie
    L.map(img, 7, 19, { "zz.....zz", "zzzzzzzzz", "zz.....zz" }, { sub = { z = "i" } })
    L.rect(img, 11, 19, 2, 3, "h")
  end)

  -- 반가워요: handshake (blue sleeve from the left, orange from the right)
  icon("bangawoyo", function(img)
    L.map(img, 0, 6, {
      "qqq...................",
      "qrrq..............jjj.",
      "qrrrq...........jkkkj.",
      "qrrrrqEEEE....FEjkkkj.",
      ".qrrrqEEEEEEFEEEjkkkj.",
      "..qqqEEFEFEFEEEEjjjj..",
      "....EEEFEFEFEEEEEj....",
      "....EEEEEEEEEEEEF.....",
      ".....FEEEEEEEEEF......",
      "......FFFEEEFFF.......",
      ".........FFF..........",
    })
    L.map(img, 9, 1, { ".l.", "lll", ".l." }); L.map(img, 3, 18, { ".l.", "lll", ".l." }); L.map(img, 18, 18, { "l" })
  end)

  -- 괜찮다: OK hand sign (thumb + index ring, three fingers up) on a green badge
  icon("gwaenchanta", function(img)
    L.ebox(img, 1, 1, 22, 22, function(nx, ny) if nx < -0.4 and ny < -0.4 then return "m" end if nx > 0.5 or ny > 0.6 then return "o" end return "n" end)
    L.map(img, 4, 2, {
      "..........EE.EE.",
      "..........EE.EEE",
      "......EE..EE.EEF",
      "......EEF.EEFEEF",
      "......EEF.EEFEEF",
      "..EEE.EEFEEEFEEF",
      ".EE.EEEEEEEEEEF.",
      ".E...EEEEEEEEEF.",
      ".EE.EEEEEEEEEEF.",
      "..EEEFEEEEEEEF..",
      "...EFEEEEEEEF...",
      "....EEEEEEEF....",
      ".....EEEEEEF....",
      ".....EEEEEF.....",
      ".....FFFFFF.....",
    })
  end)
end
