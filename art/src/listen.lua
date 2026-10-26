-- Poslech (listening campaign) sprites:
--   speaker   18x14, 4 frames: silent, 1, 2, 3 sound waves (bubble while a customer speaks)
--   track_s   8x8,   2 frames: eye (Čtení), ear (Poslech)
--   track_m   12x12, 2 frames: eye, ear (Settings switch, map tag)
--   note      9x11   music note over the not-yet-played nights on the Poslech map
local L = dofile(app.params.root .. "/art/lib.lua")

-- ------------------------------------------------------------ speaker
do
  local SPK = {
    "......gg",
    ".....gug",
    "....guug",
    "...guuvg",
    "ggggtuvg",
    "gtttuuvg",
    "gtuuuuvg",
    "gtuuuuvg",
    "gtuvvvvg",
    "ggggvvvg",
    "...gvvvg",
    "....gvvg",
    ".....gvg",
    "......gg",
  }
  local ARCS = {
    { { 9, 5 }, { 10, 6 }, { 10, 7 }, { 9, 8 } },
    { { 11, 3 }, { 12, 4 }, { 13, 5 }, { 13, 6 }, { 13, 7 }, { 13, 8 }, { 12, 9 }, { 11, 10 } },
    { { 14, 1 }, { 15, 2 }, { 16, 3 }, { 17, 4 }, { 17, 5 }, { 17, 6 }, { 17, 7 }, { 17, 8 }, { 17, 9 }, { 16, 10 }, { 15, 11 }, { 14, 12 } },
  }
  local spr = L.new(18, 14, 4)
  for f = 1, 4 do
    local img = L.img(spr, f)
    L.map(img, 0, 0, SPK)
    for a = 1, f - 1 do
      for _, p in ipairs(ARCS[a]) do L.set(img, p[1], p[2], a == f - 1 and "j" or "b") end
    end
  end
  L.save(spr, "speaker", { sheet = true })
end

-- ------------------------------------------------------------ eye / ear 8x8
do
  local spr = L.new(8, 8, 2)
  L.map(L.img(spr, 1), 0, 0, {
    "........",
    "..gggg..",
    ".gtrrtg.",
    "gtrzzrtg",
    "gtrztrtg",
    ".gtrrtg.",
    "..gggg..",
    "........",
  })
  L.map(L.img(spr, 2), 0, 0, {
    "..ggg...",
    ".gEEEg..",
    "gEFFFEg.",
    "gEFggEg.",
    "gEEgFEg.",
    ".gEEFg..",
    "..gEEg..",
    "...gg...",
  })
  L.save(spr, "track_s", { sheet = true })
end

-- ------------------------------------------------------------ eye / ear 12x12
do
  local spr = L.new(12, 12, 2)
  L.map(L.img(spr, 1), 0, 0, {
    "............",
    "............",
    "....gggg....",
    "..ggttttgg..",
    ".gttrrrrttg.",
    "gttrrzzrrttg",
    "gttrrztrrttg",
    ".gttrrrrttg.",
    "..ggttttgg..",
    "....gggg....",
    "............",
    "............",
  })
  L.map(L.img(spr, 2), 0, 0, {
    "...gggggg...",
    "..gEEEEEEg..",
    ".gEEFFFFEEg.",
    ".gEFFggFFEg.",
    ".gEFgEEgFEg.",
    ".gEFFgEgFEg.",
    "..gEFFgFFEg.",
    "...gEFFFEEg.",
    "....gEFEEg..",
    "...gEEEEg...",
    "...gEEgg....",
    "....gg......",
  })
  L.save(spr, "track_m", { sheet = true })
end

-- ------------------------------------------------------------ note
do
  local spr = L.new(9, 11, 1)
  L.map(L.img(spr, 1), 0, 0, {
    "....gg...",
    "....glgg.",
    "....gllg.",
    "....glglg",
    "....gl.gg",
    "....gl...",
    ".gggkl...",
    "gkllll...",
    "gkllllg..",
    ".gllkg...",
    "..ggg....",
  })
  L.save(spr, "note")
end
