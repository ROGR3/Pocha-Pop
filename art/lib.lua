-- Pocha Pop art helper library for Aseprite batch scripts.
-- Every sprite is drawn by code in Aseprite: pixel maps (ASCII, one char = one
-- Endesga 32 colour), primitives, and an automatic outline pass.
--
-- Usage from a sprite script:
--   local L = dofile(app.params.root .. "/art/lib.lua")
--   local spr = L.new(24, 24, 1)          -- width, height, frames
--   L.map(img, x, y, { "..ab..", ... })   -- draw ascii map
--   L.save(spr, "icon_name")               -- art/<name>.aseprite + public/assets/<name>.png

local L = {}
L.root = app.params.root or "."

-- Endesga 32, letter codes used in all ascii maps.
L.hex = {
  a = "be4a2f", b = "d77643", c = "ead4aa", d = "e4a672", e = "b86f50", f = "733e39",
  g = "3e2731", h = "a22633", i = "e43b44", j = "f77622", k = "feae34", l = "fee761",
  m = "63c74d", n = "3e8948", o = "265c42", p = "193c3e", q = "124e89", r = "0099db",
  s = "2ce8f5", t = "ffffff", u = "c0cbdc", v = "8b9bb4", w = "5a6988", x = "3a4466",
  y = "262b44", z = "181425", A = "ff0044", B = "68386c", C = "b55088", D = "f6757a",
  E = "e8b796", F = "c28569",
}
L.order = { "a","b","c","d","e","f","g","h","i","j","k","l","m","n","o","p",
            "q","r","s","t","u","v","w","x","y","z","A","B","C","D","E","F" }

local function hexcolor(h, alpha)
  local r = tonumber(h:sub(1, 2), 16)
  local g = tonumber(h:sub(3, 4), 16)
  local b = tonumber(h:sub(5, 6), 16)
  return app.pixelColor.rgba(r, g, b, alpha or 255)
end

L.px = {}
for k, h in pairs(L.hex) do L.px[k] = hexcolor(h) end
L.clear = app.pixelColor.rgba(0, 0, 0, 0)

function L.c(code, alpha)
  if alpha then return hexcolor(L.hex[code], alpha) end
  return L.px[code]
end

-- Create a sprite with `frames` frames and the Endesga 32 palette.
function L.new(w, h, frames)
  local spr = Sprite(w, h, ColorMode.RGB)
  local pal = Palette(33)
  pal:setColor(0, Color { r = 0, g = 0, b = 0, a = 0 })
  for i, k in ipairs(L.order) do
    local h = L.hex[k]
    pal:setColor(i, Color { r = tonumber(h:sub(1, 2), 16), g = tonumber(h:sub(3, 4), 16), b = tonumber(h:sub(5, 6), 16), a = 255 })
  end
  spr:setPalette(pal)
  frames = frames or 1
  for _ = 2, frames do spr:newEmptyFrame() end
  spr.layers[1].name = "art"
  return spr
end

-- Image for a given layer/frame (creates the cel if missing). Cel is always
-- full-canvas at 0,0 so coordinates are sprite-global.
function L.img(spr, frame, layer)
  layer = layer or spr.layers[1]
  local cel = layer:cel(frame)
  if not cel then
    cel = spr:newCel(layer, frame, Image(spr.width, spr.height, ColorMode.RGB), Point(0, 0))
  end
  if cel.position.x ~= 0 or cel.position.y ~= 0 or cel.image.width ~= spr.width or cel.image.height ~= spr.height then
    local full = Image(spr.width, spr.height, ColorMode.RGB)
    full:drawImage(cel.image, cel.position)
    cel.image = full
    cel.position = Point(0, 0)
  end
  return cel.image, cel
end

function L.layer(spr, name)
  for _, l in ipairs(spr.layers) do if l.name == name then return l end end
  local l = spr:newLayer()
  l.name = name
  return l
end

function L.set(img, x, y, code, alpha)
  if x < 0 or y < 0 or x >= img.width or y >= img.height then return end
  if code == nil or code == "." or code == " " then return end
  if type(code) == "string" then img:drawPixel(x, y, L.c(code, alpha)) else img:drawPixel(x, y, code) end
end

function L.erase(img, x, y)
  if x < 0 or y < 0 or x >= img.width or y >= img.height then return end
  img:drawPixel(x, y, L.clear)
end

-- Draw an ascii map. '.' and ' ' are transparent, '_' erases.
-- opts.flip mirrors horizontally, opts.sub = { from = to } remaps codes.
function L.map(img, ox, oy, rows, opts)
  opts = opts or {}
  for j, row in ipairs(rows) do
    local n = #row
    for i = 1, n do
      local ch = row:sub(i, i)
      if opts.sub and opts.sub[ch] then ch = opts.sub[ch] end
      local x = opts.flip and (ox + n - i) or (ox + i - 1)
      if ch == "_" then L.erase(img, x, oy + j - 1)
      elseif ch ~= "." and ch ~= " " then L.set(img, x, oy + j - 1, ch) end
    end
  end
end

function L.rect(img, x, y, w, h, code, alpha)
  for j = y, y + h - 1 do for i = x, x + w - 1 do L.set(img, i, j, code, alpha) end end
end

function L.hline(img, x1, x2, y, code) for i = x1, x2 do L.set(img, i, y, code) end end
function L.vline(img, x, y1, y2, code) for j = y1, y2 do L.set(img, x, j, code) end end

function L.line(img, x1, y1, x2, y2, code)
  local dx, dy = math.abs(x2 - x1), -math.abs(y2 - y1)
  local sx = x1 < x2 and 1 or -1
  local sy = y1 < y2 and 1 or -1
  local err = dx + dy
  while true do
    L.set(img, x1, y1, code)
    if x1 == x2 and y1 == y2 then break end
    local e2 = 2 * err
    if e2 >= dy then err = err + dy; x1 = x1 + sx end
    if e2 <= dx then err = err + dx; y1 = y1 + sy end
  end
end

-- Filled ellipse (integer, pixel-art friendly).
function L.ellipse(img, cx, cy, rx, ry, code, alpha)
  for j = -ry, ry do
    for i = -rx, rx do
      local v = (i * i) / ((rx + 0.5) * (rx + 0.5)) + (j * j) / ((ry + 0.5) * (ry + 0.5))
      if v <= 1.0 then L.set(img, cx + i, cy + j, code, alpha) end
    end
  end
end

-- Ellipse by bounding box (inclusive). fn(nx, ny, x, y) -> code|nil, where
-- nx, ny are normalised -1..1 coordinates (use them for shading).
-- clip = { y0 = .., y1 = .. } optionally limits rows.
function L.ebox(img, x0, y0, x1, y1, fn, clip)
  local cx, cy = (x0 + x1 + 1) / 2, (y0 + y1 + 1) / 2
  local rx, ry = (x1 - x0 + 1) / 2, (y1 - y0 + 1) / 2
  for y = y0, y1 do
    if not clip or ((not clip.y0 or y >= clip.y0) and (not clip.y1 or y <= clip.y1)) then
      for x = x0, x1 do
        local nx, ny = (x + 0.5 - cx) / rx, (y + 0.5 - cy) / ry
        if nx * nx + ny * ny <= 1.0 then
          local code = type(fn) == "function" and fn(nx, ny, x, y) or fn
          if code then L.set(img, x, y, code) end
        end
      end
    end
  end
end

-- 3-tone ball/cylinder shading helper: light from top-left.
function L.shade3(light, mid, dark, bias)
  bias = bias or 0
  return function(nx, ny)
    local v = nx * 0.8 + ny * 0.6 + bias
    if v < -0.45 then return light elseif v > 0.45 then return dark end
    return mid
  end
end

-- Seeded RNG so art builds are deterministic.
function L.rng(seed)
  local s = seed or 1
  return function(a, b)
    s = (s * 1103515245 + 12345) % 2147483648
    local r = s / 2147483648
    if a then return a + math.floor(r * (b - a + 1)) end
    return r
  end
end


-- Tiny 7x7 Hangul glyphs for neon signs / sign boards.
L.glyph = {
  ["포"] = { "#######", ".#...#.", ".#...#.", "#######", "...#...", "#######", "......." },
  ["차"] = { "..#..#.", "####.#.", "..#..##", ".#.#.#.", "#...##.", ".....#.", "......." },
  ["호"] = { "...#...", ".#####.", "..###..", ".#...#.", "..###..", "...#...", "#######" },
  ["프"] = { "#######", ".#...#.", ".#...#.", "#######", ".......", "#######", "......." },
  ["치"] = { "..#..#.", "####.#.", "..#..#.", ".#.#.#.", "#...##.", ".....#.", "......." },
  ["킨"] = { "####.#.", "...#.#.", "####.#.", "...#.#.", "#......", "#......", "######." },
  ["맥"] = { "###.#.#", "#.#.###", "###.#.#", ".......", "######.", ".....#.", ".....#." },
  ["주"] = { "#######", "...#...", "..#.#..", ".#...#.", "#######", "...#...", "...#..." },
  ["노"] = { "#......", "#......", "######.", "...#...", "...#...", "#######", "......." },
  ["래"] = { "###.#.#", "..#.#.#", "###.###", "#...#.#", "###.#.#", ".......", "......." },
  ["방"] = { "#.#.#..", "###.##.", "#.#.#..", "###.#..", "..###..", ".#...#.", "..###.." },
  ["라"] = { "###.#..", "..#.#..", "###.##.", "#...#..", "###.#..", ".......", "......." },
  ["면"] = { "###..#.", "#.###..", "###..#.", "......#", "#......", "#......", "######." },
  ["밥"] = { "#.#.#..", "###.##.", "###.#..", ".......", "#.#....", "###....", "###...." },
  ["커"] = { "####.#.", "...#.#.", "####.#.", "...##..", "...#.#.", "...#.#.", ".....#." },
  ["피"] = { "#####.#", ".#.#..#", ".#.#..#", "#####.#", "......#", "......#", "......." },
  ["을"] = { "..###..", ".#...#.", "..###..", "#######", "######.", ".....#.", "######." },
  ["지"] = { "####.#.", "...#.#.", "..#..#.", ".#.#.#.", "#...##.", ".....#.", "......." },
  ["로"] = { "######.", ".....#.", "######.", "#......", "######.", "...#...", "#######" },
  ["메"] = { "###.#.#", "#.#.#.#", "#.###.#", "###.#.#", ".....#.", ".......", "......." },
  ["뉴"] = { "#......", "#......", "######.", ".......", "#######", ".#...#.", ".#...#." },
}

-- Draw a string of glyphs. step = advance per glyph, vertical = stack downwards.
function L.text(img, x, y, str, code, opts)
  opts = opts or {}
  local step = opts.step or 8
  local i = 0
  for _, cp in utf8.codes(str) do
    local ch = utf8.char(cp)
    local g = L.glyph[ch]
    if g then
      local gx = opts.vertical and x or (x + i * step)
      local gy = opts.vertical and (y + i * step) or y
      for j, row in ipairs(g) do
        for k = 1, #row do
          if row:sub(k, k) == "#" then
            local sc = opts.scale or 1
            for sy = 0, sc - 1 do for sx = 0, sc - 1 do L.set(img, gx + (k - 1) * sc + sx, gy + (j - 1) * sc + sy, code) end end
          end
        end
      end
    end
    i = i + 1
  end
end

-- Glow: soft 1px halo in `code` around every pixel of colour `src` (8-neighbour).
function L.glow(img, srcCode, code, alpha)
  local src = L.c(srcCode)
  local pts = {}
  for y = 0, img.height - 1 do
    for x = 0, img.width - 1 do
      if img:getPixel(x, y) == src then pts[#pts + 1] = { x, y } end
    end
  end
  for _, p in ipairs(pts) do
    for dy = -1, 1 do for dx = -1, 1 do
      local x, y = p[1] + dx, p[2] + dy
      if x >= 0 and y >= 0 and x < img.width and y < img.height and img:getPixel(x, y) ~= src then
        L.set(img, x, y, code, alpha)
      end
    end end
  end
end


-- Neon text: glyphs in `code` with a 1px halo in `glowCode`, isolated from
-- whatever is already on the image.
function L.neon(img, x, y, str, code, glowCode, opts)
  local tmp = Image(img.width, img.height, ColorMode.RGB)
  L.text(tmp, x, y, str, code, opts)
  if glowCode then L.glow(tmp, code, glowCode) end
  img:drawImage(tmp, Point(0, 0))
end

-- Ordered (Bayer 4x4) dither between two codes; t in 0..1 = share of b.
local BAYER = { 0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5 }
function L.dither(x, y, t, a, b)
  local thr = (BAYER[(y % 4) * 4 + (x % 4) + 1] + 0.5) / 16
  return t > thr and b or a
end

-- Vertical multi-stop gradient with dithering. stops = { {y, code}, ... }
function L.vgradient(img, x0, y0, w, h, stops)
  for y = y0, y0 + h - 1 do
    local a, b, t = stops[1][2], stops[1][2], 0
    for k = 1, #stops - 1 do
      if y >= stops[k][1] and y <= stops[k + 1][1] then
        a, b = stops[k][2], stops[k + 1][2]
        t = (y - stops[k][1]) / math.max(1, stops[k + 1][1] - stops[k][1])
      end
    end
    if y > stops[#stops][1] then a, b, t = stops[#stops][2], stops[#stops][2], 0 end
    for x = x0, x0 + w - 1 do L.set(img, x, y, L.dither(x, y, t, a, b)) end
  end
end

function L.isOpaque(img, x, y)
  if x < 0 or y < 0 or x >= img.width or y >= img.height then return false end
  return app.pixelColor.rgbaA(img:getPixel(x, y)) > 0
end

-- Outline pass: every transparent pixel touching an opaque one (4-neighbour)
-- gets `code`. Use corners=true for 8-neighbour (thicker) outline.
function L.outline(img, code, corners)
  local todo = {}
  for y = 0, img.height - 1 do
    for x = 0, img.width - 1 do
      if not L.isOpaque(img, x, y) then
        local hit = L.isOpaque(img, x - 1, y) or L.isOpaque(img, x + 1, y) or L.isOpaque(img, x, y - 1) or L.isOpaque(img, x, y + 1)
        if not hit and corners then
          hit = L.isOpaque(img, x - 1, y - 1) or L.isOpaque(img, x + 1, y - 1) or L.isOpaque(img, x - 1, y + 1) or L.isOpaque(img, x + 1, y + 1)
        end
        if hit then todo[#todo + 1] = { x, y } end
      end
    end
  end
  for _, p in ipairs(todo) do L.set(img, p[1], p[2], code) end
end

-- Copy whole image content (sprite-global) into another image with offset.
function L.blit(dst, src, dx, dy)
  dst:drawImage(src, Point(dx or 0, dy or 0))
end

function L.copyFrame(spr, from, to, layer)
  local src = L.img(spr, from, layer)
  local dst = L.img(spr, to, layer)
  dst:clear()
  dst:drawImage(src, Point(0, 0))
end

-- Replace one colour code by another inside an image (palette swaps).
function L.swap(img, pairs_)
  local map = {}
  for from, to in pairs(pairs_) do map[L.c(from)] = L.c(to) end
  for y = 0, img.height - 1 do
    for x = 0, img.width - 1 do
      local p = img:getPixel(x, y)
      if map[p] then img:drawPixel(x, y, map[p]) end
    end
  end
end

function L.tag(spr, name, from, to)
  local t = spr:newTag(from, to)
  t.name = name
  return t
end

function L.durations(spr, ms)
  for _, f in ipairs(spr.frames) do f.duration = ms / 1000 end
end

-- Save .aseprite source + export. If the sprite has >1 frame a horizontal
-- spritesheet + Phaser-compatible JSON (hash) is exported.
function L.save(spr, name, opts)
  opts = opts or {}
  local src = L.root .. "/art/" .. name .. ".aseprite"
  spr:saveAs(src)
  local out = L.root .. "/public/assets/" .. name .. ".png"
  if #spr.frames == 1 and not opts.sheet then
    spr:saveCopyAs(out)
  else
    app.command.ExportSpriteSheet {
      ui = false,
      askOverwrite = false,
      type = opts.columns and SpriteSheetType.ROWS or SpriteSheetType.HORIZONTAL,
      columns = opts.columns or 0,
      textureFilename = out,
      dataFilename = L.root .. "/public/assets/" .. name .. ".json",
      dataFormat = SpriteSheetDataFormat.JSON_HASH,
      filenameFormat = "{frame}",
      listTags = true,
      mergeDuplicates = false,
    }
  end
  print("saved " .. name .. " (" .. spr.width .. "x" .. spr.height .. ", " .. #spr.frames .. "f)")
end

-- Cosmetic colours (Barvírna): 4-tone ramps { hi, main, shade, dark }.
-- Order = frame index 1..11 in every colour sheet (frame 0 = original look).
L.COLORS = { "red", "orange", "yellow", "green", "blue", "purple", "pink", "white", "grey", "black", "brown" }
L.RAMPS = {
  red = { "D", "i", "h", "g" },
  orange = { "k", "j", "b", "a" },
  yellow = { "t", "l", "k", "j" },
  green = { "m", "n", "o", "p" },
  blue = { "s", "r", "q", "x" },
  purple = { "C", "B", "x", "z" },
  pink = { "t", "D", "C", "B" },
  white = { "t", "t", "u", "v" },
  grey = { "u", "v", "w", "x" },
  black = { "w", "x", "y", "z" },
  brown = { "d", "e", "f", "g" },
}
-- Colours light enough to need dark text on top.
L.LIGHT = { yellow = true, white = true, pink = true, grey = true, orange = true }

return L
