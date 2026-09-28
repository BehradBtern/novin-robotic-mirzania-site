#!/usr/bin/env python3
"""Export web-ready logo assets from the CorelDRAW master (LOGO MIRZANIA.cdr).

Pipeline (all local; LibreOffice provides the CDR import):
  1. soffice --headless --convert-to odg  (libcdr reads the CDR into Draw)
  2. extract the 41 path objects from the ODG (position, size, path data)
  3. rebuild a clean SVG of the lockup at the original 300x300 mm geometry
     - NOTE: libcdr drops four "I" glyphs of the Latin line; they are rebuilt
       automatically from measured stem width / cap height / slot centres
  4. write assets/logo/logo-wordmark.svg (content-cropped)
     and assets/logo/logo-mark.svg (the diamond, cropped)
  5. write 2x/3x PNG fallbacks (rendered with node + puppeteer-core if present)

Requirements: LibreOffice installed, Python 3 + Pillow, Node + puppeteer-core
(for the PNG fallbacks only). Run:  python tools/export-logo-from-cdr.py
"""
import json
import os
import re
import shutil
import subprocess
import sys
import zipfile

from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CDR = os.path.join(ROOT, 'LOGO MIRZANIA.cdr')
TMP = os.path.join(ROOT, 'tools', '.tmp', 'logo-export')
LOGO_DIR = os.path.join(ROOT, 'assets', 'logo')
COLOR = '#56C1C9'
SOFFICE_CANDIDATES = [
    r'C:\Program Files\LibreOffice\program\soffice.exe',
    r'C:\Program Files (x86)\LibreOffice\program\soffice.exe',
]


def find_soffice():
    for p in SOFFICE_CANDIDATES:
        if os.path.exists(p):
            return p
    w = shutil.which('soffice')
    if w:
        return w
    sys.exit('LibreOffice not found — install it (https://www.libreoffice.org) and re-run.')


def convert(cdr, to, outdir):
    os.makedirs(outdir, exist_ok=True)
    subprocess.run(
        [find_soffice(), '-env:UserInstallation=file:///' + os.path.join(TMP, 'lo-profile').replace('\\', '/'),
         '--headless', '--convert-to', to, '--outdir', outdir, cdr],
        check=False, capture_output=True, text=True, timeout=300)
    base = os.path.splitext(os.path.basename(cdr))[0]
    out = os.path.join(outdir, base + '.' + to)
    if not os.path.exists(out):
        sys.exit('Conversion failed: ' + out)
    return out


def main():
    os.makedirs(TMP, exist_ok=True)
    os.makedirs(LOGO_DIR, exist_ok=True)

    print('1) converting CDR -> ODG via LibreOffice ...')
    odg = convert(CDR, 'odg', os.path.join(TMP, 'odg'))

    print('2) extracting geometry ...')
    z = zipfile.ZipFile(odg)
    content = z.read('content.xml').decode('utf-8', 'replace')
    path_re = re.compile(r'<draw:path\b([^>]*)/?>', re.S)
    attr_re = re.compile(r'([\w:.-]+)="([^"]*)"')
    items = []
    for pm in path_re.finditer(content):
        a = dict(attr_re.findall(pm.group(1)))
        if 'svg:d' not in a:
            continue
        items.append({
            'x': float(a['svg:x'].replace('cm', '')) * 1000.0,
            'y': float(a['svg:y'].replace('cm', '')) * 1000.0,
            'w': float(a['svg:width'].replace('cm', '')) * 1000.0,
            'h': float(a['svg:height'].replace('cm', '')) * 1000.0,
            'vb': [float(t) for t in a['svg:viewBox'].split()],
            'd': a['svg:d'],
        })
    if len(items) < 10:
        sys.exit('Unexpected: only %d paths extracted.' % len(items))
    print('   paths:', len(items))

    diamond = items[0]
    ux0 = min(i['x'] for i in items)
    uy0 = min(i['y'] for i in items)
    ux1 = max(i['x'] + i['w'] for i in items)
    uy1 = max(i['y'] + i['h'] for i in items)

    print('3) rebuilding the four dropped "I" bars ...')
    line1 = sorted([i for i in items if 17500 < i['y'] < 20200], key=lambda i: i['x'])
    gaps = sorted([(line1[k + 1]['x'] - (line1[k]['x'] + line1[k]['w']), k) for k in range(len(line1) - 1)], reverse=True)
    slot_ks = sorted([k for _, k in gaps[:4]])
    stem_u = 185.0
    flats = [i for i in line1 if i['h'] < 1330]
    i_top = min(i['y'] for i in flats)
    i_bot = max(i['y'] + i['h'] for i in flats)
    bars = []
    for k in slot_ks:
        center = ((line1[k]['x'] + line1[k]['w']) + line1[k + 1]['x']) / 2
        bars.append({'x': center - stem_u / 2, 'y': i_top, 'w': stem_u, 'h': i_bot - i_top})
    print('   bars:', len(bars))

    def build_svg(viewbox, with_bars):
        parts = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="%s">' % ' '.join(str(round(v, 2)) for v in viewbox)]
        for it in items:
            sx = it['w'] / it['vb'][2]
            sy = it['h'] / it['vb'][3]
            parts.append('<g transform="translate(%.2f,%.2f) scale(%.6f,%.6f)"><path fill="%s" fill-rule="evenodd" d="%s"/></g>'
                         % (it['x'], it['y'], sx, sy, COLOR, it['d']))
        if with_bars:
            for r in bars:
                parts.append('<rect x="%.2f" y="%.2f" width="%.2f" height="%.2f" fill="%s"/>' % (r['x'], r['y'], r['w'], r['h'], COLOR))
        parts.append('</svg>')
        return '\n'.join(parts)

    content_box = [ux0, uy0, ux1, uy1]
    diamond_box = [diamond['x'], diamond['y'], diamond['w'], diamond['h']]
    word = build_svg(content_box, True).replace(
        'viewBox="%s">' % ' '.join(str(round(v, 2)) for v in content_box),
        'viewBox="%s" width="1304" height="1022">' % ' '.join(str(round(v, 2)) for v in content_box))
    mark = build_svg(diamond_box, False).replace(
        'viewBox="%s">' % ' '.join(str(round(v, 2)) for v in diamond_box),
        'viewBox="%s" width="668" height="664">' % ' '.join(str(round(v, 2)) for v in diamond_box))
    open(os.path.join(LOGO_DIR, 'logo-wordmark.svg'), 'w', encoding='utf-8').write(word)
    open(os.path.join(LOGO_DIR, 'logo-mark.svg'), 'w', encoding='utf-8').write(mark)
    shutil.copyfile(os.path.join(LOGO_DIR, 'logo-mark.svg'), os.path.join(ROOT, 'assets', 'favicon.svg'))
    print('   wrote logo-wordmark.svg + logo-mark.svg + favicon.svg')

    print('4) PNG fallbacks (2x/3x) ...')
    render_exact = os.path.join(ROOT, 'tools', 'render-exact.mjs')
    node_modules = os.path.join(ROOT, 'node_modules', 'puppeteer-core')
    if os.path.isdir(node_modules):
        jobs = [
            ('logo-wordmark.svg', 'logo-wordmark@2x.png', 2608, 2044),
            ('logo-wordmark.svg', 'logo-wordmark@3x.png', 3912, 3066),
            ('logo-mark.svg', 'logo-mark@2x.png', 1336, 1328),
            ('logo-mark.svg', 'logo-mark@3x.png', 2004, 1992),
        ]
        for src, dst, w, h in jobs:
            r = subprocess.run(['node', render_exact, os.path.join(LOGO_DIR, src), os.path.join(LOGO_DIR, dst), str(w), str(h)],
                               capture_output=True, text=True, timeout=180, cwd=ROOT)
            print('   ', dst, 'ok' if r.returncode == 0 else ('FAILED: ' + r.stderr[-200:]))
    else:
        print('   skipped (run `npm install` first to enable puppeteer-core renders)')

    print('done. Verify the vector output by rendering assets/logo/*.svg at a large size.')


if __name__ == '__main__':
    main()
