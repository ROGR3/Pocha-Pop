-- Preview harness: builds ONE icon part into a scratch sheet without touching
-- public/assets. Run: bash scripts/preview-icons.sh <part> [outdir]
local L = dofile(app.params.root .. "/art/lib.lua")
local H = dofile(L.root .. "/art/icons/_helpers.lua")(L)
local ICONS = {}
local function icon(name, fn) ICONS[#ICONS + 1] = { name = name, fn = fn } end
local part = app.params.part
local ret = dofile(L.root .. "/art/icons/" .. part .. ".lua")
if type(ret) == "function" then ret(icon, L, H)
else -- recolourable set: { items = { {id, default, fn(img, R)} } }
  for _, it in ipairs(ret.items) do
    for _, cname in ipairs({ it[2], "grey", "red", "blue", "yellow", "green", "black", "white", "pink" }) do
      local r = L.RAMPS[cname]
      icon(it[1] .. "@" .. cname, function(img) it[3](img, { r[1], r[2], r[3], r[4], name = cname }) end)
    end
  end
end
local spr = L.new(24, 24, #ICONS)
local names = {}
for i, ic in ipairs(ICONS) do
  local img = L.img(spr, i)
  ic.fn(img)
  L.outline(img, "g")
  names[#names + 1] = ic.name
end
local out = app.params.out
app.command.ExportSpriteSheet { ui = false, askOverwrite = false, type = SpriteSheetType.ROWS, columns = (type(ret) == "function") and 8 or 9,
  textureFilename = out .. "/" .. part .. ".png", dataFilename = out .. "/" .. part .. ".json", dataFormat = SpriteSheetDataFormat.JSON_HASH }
local f = io.open(out .. "/" .. part .. ".names", "w"); f:write(table.concat(names, "\n")); f:close()
print("previewed " .. #ICONS .. " icons of " .. part)
