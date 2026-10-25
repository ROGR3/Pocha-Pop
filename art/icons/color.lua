-- Colour words: a paint can with the colour on top and a drip (palette swap of
-- one template), plus 색 = painter's palette.
return function(icon, L, H)
  -- swatch card (barevný vzorek) with a second chip peeking out behind
  local CARD = {
    "......22222222222222..",
    ".....2111111111111332.",
    ".....2111111111111332.",
    ".44..2111111111111332.",
    "4334.2111111111111332.",
    "4334.2111111111111332.",
    "4334.2113111111111332.",
    "4334.2131111111111332.",
    "4334.2111111111111332.",
    "4334.2111111111111332.",
    "4334.2333333333333332.",
    "4334.2tttttttttttttuu.",
    "4334.2tttttttttttttuu.",
    "4334.2tvvvvvvvvvtttuu.",
    "4334.2tttttttttttttuu.",
    "4334.2tvvvvvtttttttuu.",
    "4334.2tttttttttttttuu.",
    ".44..2uuuuuuuuuuuuuuu.",
    "......222222222222222.",
  }
  local NAMES = {
    red = "ppalgansaek", orange = "juhwangsaek", yellow = "noransaek", green = "choroksaek", blue = "paransaek",
    purple = "borasaek", pink = "bunhongsaek", white = "hayansaek", grey = "hoesaek", black = "geomeunsaek", brown = "galsaek",
  }
  for _, name in ipairs(L.COLORS) do
    local r = L.RAMPS[name]
    icon(NAMES[name], function(img)
      local hi, main, shade = r[1], r[2], r[3]
      if name == "white" then hi, main, shade = "t", "t", "u" end
      local edge = r[4]
      if name == "white" then edge = "v" end
      -- tilted chip behind: lighter tint of the same colour
      L.map(img, 1, 3, CARD, { sub = { ["1"] = main, ["2"] = edge, ["3"] = shade, ["4"] = edge } })
      for y = 7, 19 do L.set(img, 2, y, hi); L.set(img, 3, y, main) end
      L.set(img, 8, 9, "t"); L.set(img, 7, 10, "t")
    end)
  end
  -- 색: painter's palette with blobs of colour and a brush
  icon("saek", function(img)
    L.ebox(img, 1, 4, 22, 21, function(nx, ny) if nx < -0.4 and ny < -0.3 then return "c" end if ny > 0.5 or nx > 0.6 then return "e" end return "d" end)
    L.ebox(img, 13, 14, 17, 18, function() return nil end)
    for x = 14, 16 do for y = 15, 17 do L.erase(img, x, y) end end
    L.ebox(img, 4, 7, 7, 10, "i"); L.ebox(img, 9, 6, 12, 9, "l"); L.ebox(img, 14, 7, 17, 10, "r")
    L.ebox(img, 4, 12, 7, 15, "m"); L.ebox(img, 7, 16, 10, 19, "C")
    L.set(img, 5, 8, "D"); L.set(img, 10, 7, "t"); L.set(img, 15, 8, "s"); L.set(img, 5, 13, "l")
    L.line(img, 22, 1, 15, 12, "f"); L.line(img, 22, 2, 16, 12, "e")
    L.map(img, 13, 11, { "..t", ".tu", "tu." })
  end)
end
