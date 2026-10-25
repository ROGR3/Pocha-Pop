-- Co-op ("Spolu") sprites: player-coloured bubble frames and name tags,
-- runoff bar, crown, QR frame in the style of the stall's tarp.
-- (Spolu / camera / wifi icons live in the uiicons sheet, art/src/ui.lua.)
local L = dofile(app.params.root .. "/art/lib.lua")

-- player colours: { main, dark, light }  (orange / blue / green)
local P = { orange = { "j", "a", "k" }, blue = { "r", "q", "s" }, green = { "m", "n", "l" } }
local ORDER = { "orange", "blue", "green" }

-- ------------------------------------------------------------ bubble frames 15x15 (9-slice, corner 5)
local BUBBLE = {
  "...ggggggggg...",
  ".ggMMMMMMMMMMg.",
  ".gMMttttttttMMg",
  "gMMttttttttttMg",
  "gMtttttttttttMg",
  "gMtttttttttttMg",
  "gMtttttttttttMg",
  "gMtttttttttttMg",
  "gMtttttttttttMg",
  "gMtttttttttttMg",
  "gMttttttttttuMg",
  "gMMtttttttuuMMg",
  ".gMMuuuuuuuMMg.",
  ".ggDDDDDDDDDgg.",
  "...ggggggggg...",
}
for _, name in ipairs(ORDER) do
  local c = P[name]
  local spr = L.new(15, 15, 1)
  L.map(L.img(spr, 1), 0, 0, BUBBLE, { sub = { M = c[1], D = c[2] } })
  L.save(spr, "bubble_p_" .. name)
end

-- ------------------------------------------------------------ name tags 11x11 (9-slice, corner 4): dark plate, coloured rim
for _, name in ipairs(ORDER) do
  local c = P[name]
  local spr = L.new(11, 11, 1)
  L.map(L.img(spr, 1), 0, 0, {
    "..MMMMMMM..",
    ".MLLLLLLLM.",
    "MLzzzzzzzLM",
    "MLzzzzzzzDM",
    "MLzzzzzzzDM",
    "MLzzzzzzzDM",
    "MLzzzzzzzDM",
    "MLzzzzzzzDM",
    "MDzzzzzzzDM",
    ".MDDDDDDDM.",
    "..MMMMMMM..",
  }, { sub = { M = "g", L = c[3], D = c[2] } })
  L.save(spr, "ptag_" .. name)
end

-- ------------------------------------------------------------ player dots 7x7 (sheet: orange, blue, green)
do
  local spr = L.new(7, 7, 3)
  for i, name in ipairs(ORDER) do
    local c = P[name]
    L.map(L.img(spr, i), 0, 0, {
      "..ggg..",
      ".gLMMg.",
      "gLMMMDg",
      "gMMMMDg",
      "gMMMDDg",
      ".gDDDg.",
      "..ggg..",
    }, { sub = { M = c[1], L = c[3], D = c[2] } })
  end
  L.save(spr, "pdot", { sheet = true })
end

-- ------------------------------------------------------------ runoff bar 12x6 (9-slice, corner 3), one frame per colour
do
  local spr = L.new(12, 6, 3)
  for i, name in ipairs(ORDER) do
    local c = P[name]
    L.map(L.img(spr, i), 0, 0, {
      ".gggggggggg.",
      "gLLLLLLLLLLg",
      "gMMMMMMMMMMg",
      "gMMMMMMMMMMg",
      "gDDDDDDDDDDg",
      ".gggggggggg.",
    }, { sub = { M = c[1], L = c[3], D = c[2] } })
  end
  L.save(spr, "ui_runoff", { sheet = true })
end

-- ------------------------------------------------------------ crown 13x10
do
  local spr = L.new(13, 10, 1)
  L.map(L.img(spr, 1), 0, 0, {
    "......i......",
    ".k...klk...k.",
    "klk..kkk..klk",
    ".kk.kkkkk.kk.",
    ".kkkkkkkkkkk.",
    ".kllkkikklkk.",
    ".klkkiiikkkj.",
    ".kkkkkikkkkj.",
    ".jjjjjjjjjjj.",
    ".bbbbbbbbbbb.",
  })
  L.outline(L.img(spr, 1), "g")
  L.save(spr, "crown")
end

-- ------------------------------------------------------------ QR frame 26x26 (9-slice, corner 9): tarp stripes around a white field
do
  local spr = L.new(26, 26, 1)
  local img = L.img(spr, 1)
  L.rect(img, 0, 0, 26, 26, "g")
  for y = 1, 24 do
    for x = 1, 24 do
      local edge = x <= 7 or x >= 18 or y <= 7 or y >= 18
      if edge then
        -- diagonal red/white tarp stripes, darker towards the outside
        local stripe = math.floor((x + y) / 3) % 2 == 0
        local outer = x <= 2 or x >= 23 or y <= 2 or y >= 23
        local c = stripe and (outer and "h" or "i") or (outer and "u" or "c")
        L.set(img, x, y, c)
      else
        L.set(img, x, y, "t")
      end
    end
  end
  -- inner rim
  for i = 7, 18 do L.set(img, i, 7, "f"); L.set(img, i, 18, "f"); L.set(img, 7, i, "f"); L.set(img, 18, i, "f") end
  for _, p in ipairs({ { 0, 0 }, { 25, 0 }, { 0, 25 }, { 25, 25 } }) do L.erase(img, p[1], p[2]) end
  L.save(spr, "qr_frame")
end
