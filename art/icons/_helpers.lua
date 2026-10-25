-- Shared drawing helpers for 24x24 icons. Usage: local H = dofile(root .. "/art/icons/_helpers.lua")(L)
return function(L)

local function steam(img, xs, y0)
  for _, x in ipairs(xs) do
    L.map(img, x, y0, { ".t", "t.", "t.", ".u", ".u", "u." })
  end
end

-- White ceramic bowl. rim bbox x0..x1, rim top y, depth d.
local function bowl(img, x0, x1, y, d, cols)
  cols = cols or { "t", "u", "v", "w" }
  local h = 5
  -- body: lower half ellipse
  L.ebox(img, x0, y - d + 2, x1, y + d + 2, function(nx, ny)
    if nx < -0.55 then return cols[1] elseif nx > 0.45 then return cols[3] end
    return cols[2]
  end, { y0 = y + 2 })
  -- foot
  local cx = math.floor((x0 + x1) / 2)
  L.hline(img, cx - 3, cx + 4, y + d + 2, cols[3])
  -- rim ring
  L.ebox(img, x0, y, x1, y + h, function(nx, ny) return ny < 0 and cols[1] or cols[2] end)
end

-- Contents ellipse inside a bowl rim.
local function contents(img, x0, x1, y, fn)
  L.ebox(img, x0 + 1, y + 1, x1 - 1, y + 4, fn)
end

local function plate(img, x0, x1, y, cols)
  cols = cols or { "t", "u", "v" }
  L.ebox(img, x0, y, x1, y + 5, function(nx, ny)
    if ny > 0.55 then return cols[3] end
    if nx * nx + ny * ny < 0.45 then return cols[2] end
    return cols[1]
  end)
end

-- Earthenware pot (ttukbaegi) used for stews.
local function ttuk(img, x0, x1, y, broth)
  L.ebox(img, x0, y - 4, x1, y + 12, function(nx, ny)
    if nx < -0.5 then return "e" elseif nx > 0.45 then return "g" end
    return "f"
  end, { y0 = y + 2, y1 = y + 9 })
  L.hline(img, x0 + 3, x1 - 3, y + 10, "g")
  L.ebox(img, x0, y, x1, y + 5, function(nx, ny) return ny < 0 and "e" or "f" end)
  L.ebox(img, x0 + 1, y + 1, x1 - 1, y + 4, broth)
end


  return { steam = steam, bowl = bowl, contents = contents, plate = plate, ttuk = ttuk }
end
