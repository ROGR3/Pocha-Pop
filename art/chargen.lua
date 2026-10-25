-- Character generator shared by art/src/characters*.lua (32x40 chibi customers).
-- frames 1-2 idle | 3 neutral | 4-5 angry | 6-7 happy | 8-9 eat | 10-13 walk
local L = dofile(app.params.root .. "/art/lib.lua")
local FW, FH = 32, 40

-- ------------------------------------------------------------------ parts
local HEAD = {
  "....11111111....",
  "..111111111111..",
  ".11111111111111.",
  "1111111111111111",
  "1111111111111111",
  "1111111111111111",
  "1111111111111111",
  "1111111111111111",
  "1111111111111112",
  "1111111111111112",
  ".11111111111112.",
  ".11111111111122.",
  "..111111111122..",
  "....11111122....",
}
local HX, HY = 8, 4 -- head origin

local MOUTH = {
  smile   = { ".f..f.", "..ff.." },
  neutral = { "......", ".ffff." },
  angry   = { "..ff..", ".f..f." },
  happy   = { ".ffff.", ".fhhf.", "..ff.." },
  eat_a   = { "..ff..", ".fhhf.", "..ff.." },
  eat_b   = { "......", ".ffff.", "......" },
}

local function eyes(img, kind, by, P)
  local y = 11 + by
  local ex = P.eyeShift or 0
  local ec = P.eye or "z"
  if kind == "open" then
    for _, x in ipairs({ 11 + ex, 19 + ex }) do
      L.rect(img, x, y, 2, 2, ec)
      L.set(img, x + (ex > 0 and 1 or 0), y, "t")
    end
  elseif kind == "blink" then
    L.hline(img, 11, 12, y + 1, ec); L.hline(img, 19, 20, y + 1, ec)
  elseif kind == "happy" then
    for _, x in ipairs({ 10, 18 }) do
      L.set(img, x, y + 1, ec); L.set(img, x + 1, y, ec); L.set(img, x + 2, y, ec); L.set(img, x + 3, y + 1, ec)
    end
  elseif kind == "angry" then
    for _, x in ipairs({ 11, 19 }) do L.rect(img, x, y, 2, 2, ec) end
    L.set(img, 10, y - 2, "g"); L.set(img, 11, y - 2, "g"); L.set(img, 12, y - 1, "g")
    L.set(img, 19, y - 1, "g"); L.set(img, 20, y - 2, "g"); L.set(img, 21, y - 2, "g")
  elseif kind == "flat" then
    for _, x in ipairs({ 11, 19 }) do L.rect(img, x, y, 2, 2, ec); L.set(img, x, y, "t") end
    L.hline(img, 10, 12, y - 2, P.brow or "g"); L.hline(img, 19, 21, y - 2, P.brow or "g")
  end
end

-- pose: { bob, legL, legR, handL, handR, eyes, mouth, blush, fx, dx }
local function figure(img, P, pose)
  local b = pose.bob or 0
  local dx = pose.dx or 0
  local sub = { ["1"] = P.skin, ["2"] = P.skin2, ["5"] = P.top, ["6"] = P.top2, ["7"] = P.pants, ["8"] = P.shoes, ["9"] = P.accent or P.top }

  -- back hair (long hair falls behind the shoulders)
  if P.backHair then L.map(img, dx, b, P.backHair, { sub = { h = P.hair, H = P.hair2 } }) end

  -- legs
  local function leg(x, lift)
    local top, bot = 29, 36 - lift
    L.rect(img, x + dx, top, 4, bot - top + 1, P.legs or P.pants)
    L.rect(img, x + dx, top, 1, bot - top + 1, P.legs2 or P.pants2 or P.pants)
    L.rect(img, x - 1 + dx + (x < 16 and 0 or 1), bot, 5, 2, P.shoes)
    L.set(img, x + dx + (x < 16 and 0 or 4), bot, P.shoes2 or P.shoes)
  end
  if P.skirt then
    leg(11, pose.legL or 0); leg(17, pose.legR or 0)
    L.map(img, 9 + dx, 27 + b, P.skirt, { sub = sub })
  else
    leg(11, pose.legL or 0); leg(17, pose.legR or 0)
    L.rect(img, 11 + dx, 28 + b, 10, 2, P.pants)
  end

  -- torso
  L.map(img, 10 + dx, 17 + b, P.body or {
    "...555555...",
    ".5555555555.",
    "555555555556",
    "555555555556",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555566",
    "555555555666",
    "556666666666",
  }, { sub = sub })
  if P.bodyDetail then P.bodyDetail(img, dx + 1, b) end

  -- arms + hands
  local function arm(x, hy, flip)
    L.rect(img, x + dx, 18 + b, 2, 8 + hy, flip and P.top2 or P.top)
    L.rect(img, x + dx, 26 + b + hy, 2, 2, P.skin)
    L.set(img, x + dx + (flip and 1 or 0), 27 + b + hy, P.skin2)
  end
  arm(8, pose.handL or 0, false)
  if not pose.noRightArm then arm(22, pose.handR or 0, true) end

  -- head
  L.map(img, HX + dx, HY + b, HEAD, { sub = sub })
  -- ears
  L.set(img, HX - 1 + dx, 11 + b, P.skin); L.set(img, HX + 16 + dx, 11 + b, P.skin2)
  -- face
  eyes(img, pose.eyes or "open", b, P)
  if P.eyeBags then L.hline(img, 11 + dx, 12 + dx, 13 + b, "B"); L.hline(img, 19 + dx, 20 + dx, 13 + b, "B") end
  L.map(img, 13 + dx, 14 + b, MOUTH[pose.mouth or "smile"])
  if pose.blush then
    L.hline(img, 9 + dx, 10 + dx, 13 + b, "D"); L.hline(img, 21 + dx, 22 + dx, 13 + b, "D")
  end
  -- front hair / hat / accessories
  if P.hairFront then L.map(img, (P.hairX or 7) + dx, (P.hairY or 1) + b, P.hairFront, { sub = { h = P.hair, H = P.hair2, x = P.hair3 or P.hair2 } }) end
  if P.face then P.face(img, dx, b, pose) end
  if pose.extra then pose.extra(img, b, P) end
end

local function fxVein(img, b)
  L.map(img, 24, 2 + b, { ".i.i", "i...", "....", "i..i", ".ii." })
end
local function fxSweat(img, b)
  L.map(img, 24, 7 + b, { ".r", "rs", "rr" })
end
local function fxHeart(img, b)
  L.map(img, 24, 1 + b, { ".A.A.", "AAiAA", ".AAA.", "..A.." })
end
local function fxSteam(img, b)
  L.map(img, 3, 1 + b, { ".u.", "u.u", ".u." })
  L.map(img, 26, 3 + b, { "u.", ".u", "u." })
end

local POSES = {
  { name = "idle", eyes = "open", mouth = "smile" },
  { name = "idle", eyes = "blink", mouth = "smile" },
  { name = "neutral", eyes = "flat", mouth = "neutral", fx = fxSweat },
  { name = "angry", eyes = "angry", mouth = "angry", fx = fxVein },
  { name = "angry", eyes = "angry", mouth = "angry", fx = fxSteam, dx = 1 },
  { name = "happy", eyes = "happy", mouth = "happy", blush = true },
  { name = "happy", eyes = "happy", mouth = "happy", blush = true, bob = -1, handL = -3, handR = -3, fx = fxHeart },
  { name = "eat", eyes = "happy", mouth = "eat_a", blush = true, handR = -6 },
  { name = "eat", eyes = "happy", mouth = "eat_b", blush = true, handR = -4, bob = 1 },
  { name = "walk", eyes = "open", mouth = "smile", legL = 0, legR = 2, bob = -1, handL = 1, handR = -1 },
  { name = "walk", eyes = "open", mouth = "smile" },
  { name = "walk", eyes = "open", mouth = "smile", legL = 2, legR = 0, bob = -1, handL = -1, handR = 1 },
  { name = "walk", eyes = "blink", mouth = "smile" },
}

local DEFAULT_TAGS = { { "idle", 1, 2 }, { "neutral", 3, 3 }, { "angry", 4, 5 }, { "happy", 6, 7 }, { "eat", 8, 9 }, { "walk", 10, 13 } }

local function build(name, P, poses, tags)
  poses = poses or POSES
  local spr = L.new(FW, FH, #poses)
  for i, pose in ipairs(poses) do
    local img = L.img(spr, i)
    figure(img, P, pose)
    if pose.name == "eat" and P.chopsticks ~= false and pose.handR then
      -- chopsticks in the raised right hand
      local hy = 26 + (pose.bob or 0) + (pose.handR or 0)
      L.line(img, 23, hy, 18, hy - 5, "d"); L.line(img, 24, hy, 20, hy - 6, "e")
    end
    L.outline(img, P.outline or "g")
    if pose.fx then pose.fx(img, pose.bob or 0) end
  end
  L.durations(spr, 160)
  for _, t in ipairs(tags or DEFAULT_TAGS) do L.tag(spr, t[1], t[2], t[3]) end
  L.save(spr, "char_" .. name)
end

local SKIN = { skin = "E", skin2 = "F" }
local SKIN_TAN = { skin = "d", skin2 = "F" }
local function with(base, t) local r = {}; for k, v in pairs(base) do r[k] = v end; for k, v in pairs(t) do r[k] = v end; return r end

return { L = L, build = build, with = with, SKIN = SKIN, SKIN_TAN = SKIN_TAN, POSES = POSES, figure = figure }
