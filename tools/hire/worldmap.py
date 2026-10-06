"""Build the dotted world map for the hiring film from world-atlas (Natural Earth, 1:50m, TopoJSON):
land dots on a regular lon/lat grid, Romania's dots and outline in finer detail. Writes src/hire/worldmap.json.
usage: python3 tools/hire/worldmap.py path/to/countries-50m.json"""
import json, os, sys
import numpy as np
from PIL import Image, ImageDraw

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", ".."))
topo = json.load(open(sys.argv[1]))
sc, tr = topo["transform"]["scale"], topo["transform"]["translate"]
arcs = []
for a in topo["arcs"]:
    x = y = 0
    pts = []
    for dx, dy in a:
        x += dx
        y += dy
        pts.append((x * sc[0] + tr[0], y * sc[1] + tr[1]))
    arcs.append(pts)


def ring(idx):
    out = []
    for i in idx:
        seg = arcs[i] if i >= 0 else arcs[~i][::-1]
        out.extend(seg if not out else seg[1:])
    return out


def polys(geom):
    if geom["type"] == "Polygon":
        return [[ring(r) for r in geom["arcs"]]]
    if geom["type"] == "MultiPolygon":
        return [[ring(r) for r in p] for p in geom["arcs"]]
    return []


geoms = topo["objects"]["countries"]["geometries"]
RES = 8  # px per degree for the raster
w, h = 360 * RES, 180 * RES
land = Image.new("L", (w, h), 0)
ro = Image.new("L", (w, h), 0)
dl, dr = ImageDraw.Draw(land), ImageDraw.Draw(ro)
ro_outline = []
for g in geoms:
    is_ro = str(g.get("id")) == "642"
    for p in polys(g):
        for k, r in enumerate(p):
            xy = [((lon + 180) * RES, (90 - lat) * RES) for lon, lat in r]
            if len(xy) < 3:
                continue
            fill = 255 if k == 0 else 0
            dl.polygon(xy, fill=fill)
            if is_ro:
                dr.polygon(xy, fill=fill)
                if k == 0:
                    ro_outline.append([[round(lon, 3), round(lat, 3)] for lon, lat in r])
L = np.array(land) > 0
R = np.array(ro) > 0


def dots(mask, step, lat_max=78, lat_min=-56):
    out = []
    for lat in np.arange(lat_max, lat_min, -step):
        for lon in np.arange(-180 + step / 2, 180, step):
            px, py = int((lon + 180) * RES), int((90 - lat) * RES)
            if 0 <= px < w and 0 <= py < h and mask[py, px]:
                out.append([round(float(lon), 2), round(float(lat), 2)])
    return out


world = dots(L & ~R, 1.0)
romania = dots(R, 0.22, 49, 43)
json.dump({"world": world, "romania": romania, "outline": ro_outline}, open(os.path.join(ROOT, "src/hire/worldmap.json"), "w"), separators=(",", ":"))
print(len(world), "land dots,", len(romania), "romania dots,", len(ro_outline), "outline rings")
