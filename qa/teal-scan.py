import json, sys
from PIL import Image
png, chips_path = sys.argv[1], sys.argv[2]
zones = json.load(open(chips_path, encoding='utf-8'))
im = Image.open(png).convert('RGB'); px = im.load(); W, H = im.size
def teal(r, g, b):
    return g >= 150 and b >= 135 and r <= 140 and (g - r) >= 60
out = []; hits_total = 0; min_gap = 10 ** 9
for c in zones:
    l, t, r_, btm = c
    edge = 0; hits = 0
    for y in range(max(0, t + 1), min(H, btm - 1)):
        for x in range(0, min(W, r_ + 5)):
            rr, gg, bb = px[x, y]
            if teal(rr, gg, bb):
                if x < l - 4 and x > edge: edge = x
                if x >= l - 12: hits += 1
    gap = l - edge
    hits_total += hits
    if gap < min_gap: min_gap = gap
    out.append({"left": l, "edge": edge, "gap": gap, "hits": hits})
print(json.dumps({"zones": out, "hits": hits_total, "minGap": min_gap}))
