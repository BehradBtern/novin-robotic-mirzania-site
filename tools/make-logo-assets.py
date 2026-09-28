#!/usr/bin/env python3
"""Regenerate the site's vector logo assets from the source PNGs at the repo root.

Inputs  (repo root):  logo-mirzania.png        (wordmark lockup, transparent)
                      logo-mirzania-mark.png   (mark only, transparent)
Outputs:              assets/logo/logo-wordmark.svg
                      assets/logo/logo-mark.svg

Method (validated): 4x LANCZOS upscale -> binary ink mask -> vtracer (binary,
spline) -> recolor to brand teal #56C1C9 -> inject viewBox. When puppeteer-core
is installed (npm install), the script renders each SVG and reports a fidelity
IoU against the source PNG (pass >= 0.93). If IoU is below threshold it also
writes a 4x LANCZOS PNG fallback next to the SVG and tells you to point
content.js at the PNG instead.

Requires: Python 3 + Pillow, and `python -m pip install vtracer`.
"""
import os
import re
import subprocess
import sys

from PIL import Image

try:
    import vtracer
except ImportError:
    print("vtracer is not installed. Run: python -m pip install vtracer")
    sys.exit(1)

TEAL = "#56C1C9"
ALPHA_THRESHOLD = 96
IOU_PASS = 0.93

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT_DIR = os.path.join(ROOT, "assets", "logo")
TMP_DIR = os.path.join(ROOT, "tools", ".tmp")


def prep_binary(src_path, dst_path, scale=4):
    im = Image.open(src_path).convert("RGBA")
    im = im.resize((im.width * scale, im.height * scale), Image.LANCZOS)
    bw = Image.new("L", im.size, 255)
    px = im.load()
    bx = bw.load()
    for y in range(im.height):
        for x in range(im.width):
            bx[x, y] = 0 if px[x, y][3] > ALPHA_THRESHOLD else 255
    bw.save(dst_path)
    return im.size


def trace_and_postprocess(bw_path, svg_path):
    raw = svg_path + ".raw.svg"
    vtracer.convert_image_to_svg_py(
        bw_path, raw, colormode="binary", mode="spline", filter_speckle=4
    )
    svg = open(raw, encoding="utf-8").read()
    svg = svg.replace('fill="#000000"', 'fill="%s"' % TEAL)
    svg = re.sub(
        r'(<svg[^>]*?width="(\d+)"\s+height="(\d+)")',
        r'\1 viewBox="0 0 \2 \3"',
        svg,
        count=1,
    )
    open(svg_path, "w", encoding="utf-8").write(svg)
    os.remove(raw)
    return svg


def make_render_script(path):
    code = """
import puppeteer from 'puppeteer-core';
import fs from 'fs';
const CHROME = process.env.CHROME_PATH || 'C:\\\\Program Files\\\\Google\\\\Chrome\\\\Application\\\\chrome.exe';
const [, , svgPath, outPng, wStr, hStr] = process.argv;
const w = parseInt(wStr, 10), h = parseInt(hStr, 10);
let svg = fs.readFileSync(svgPath, 'utf8');
if (svg.startsWith('<?xml')) svg = svg.split('?>').slice(1).join('?>');
const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`;
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await new Promise(r => setTimeout(r, 250));
await page.screenshot({ path: outPng, omitBackground: true });
await browser.close();
console.log('RENDERED', outPng);
"""
    open(path, "w", encoding="utf-8").write(code)


def ink_mask(path, size):
    im = Image.open(path).convert("RGBA").resize(size, Image.LANCZOS)
    px = im.load()
    return [[px[x, y][3] > ALPHA_THRESHOLD for x in range(size[0])] for y in range(size[1])]


def iou(a, b):
    inter = union = 0
    for y in range(len(a)):
        for x in range(len(a[0])):
            if a[y][x] or b[y][x]:
                union += 1
            if a[y][x] and b[y][x]:
                inter += 1
    return inter / union if union else 1.0


def validate(name, src_path, svg_path, src_size):
    """Render the SVG with puppeteer-core and report IoU vs source. Best effort."""
    tools_node_modules = os.path.join(ROOT, "node_modules", "puppeteer-core")
    if not os.path.isdir(tools_node_modules):
        print("  validation skipped (run `npm install` to enable puppeteer-core checks)")
        return None
    os.makedirs(TMP_DIR, exist_ok=True)
    render_js = os.path.join(TMP_DIR, "render.mjs")
    make_render_script(render_js)
    out_png = os.path.join(TMP_DIR, name + "-render.png")
    r = subprocess.run(
        ["node", render_js, svg_path, out_png, str(src_size[0] * 4), str(src_size[1] * 4)],
        capture_output=True, text=True, cwd=ROOT,
    )
    if r.returncode != 0 or not os.path.exists(out_png):
        print("  validation render failed:", (r.stderr or r.stdout)[-300:])
        return None
    score = iou(ink_mask(src_path, src_size), ink_mask(out_png, src_size))
    print("  IoU vs source: %.4f (pass >= %.2f)" % (score, IOU_PASS))
    if score < IOU_PASS:
        fallback = os.path.splitext(svg_path)[0] + ".png"
        im = Image.open(src_path).convert("RGBA")
        im = im.resize((im.width * 4, im.height * 4), Image.LANCZOS)
        im.save(fallback)
        print("  WARNING: IoU below threshold. Wrote PNG fallback:", fallback)
        print("  -> point content.js at the PNG file(s) instead of the SVG.")
    return score


def main():
    jobs = [
        ("wordmark", os.path.join(ROOT, "logo-mirzania.png"), os.path.join(OUT_DIR, "logo-wordmark.svg")),
        ("mark", os.path.join(ROOT, "logo-mirzania-mark.png"), os.path.join(OUT_DIR, "logo-mark.svg")),
    ]
    os.makedirs(OUT_DIR, exist_ok=True)
    os.makedirs(TMP_DIR, exist_ok=True)
    for name, src, svg in jobs:
        if not os.path.exists(src):
            print("MISSING source file:", src)
            sys.exit(1)
        im = Image.open(src).convert("RGBA")
        src_size = im.size
        bw = os.path.join(TMP_DIR, name + "-bw.png")
        prep_binary(src, bw)
        trace_and_postprocess(bw, svg)
        print("wrote %s (%d bytes) from %s %s" % (svg, os.path.getsize(svg), os.path.basename(src), src_size))
        validate(name, src, svg, src_size)
    print("done.")


if __name__ == "__main__":
    main()
