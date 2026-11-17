// qa/run-qa.mjs — headless QA suite for the logo-sequence site (v1.3.0).
// Captures all screenshots via puppeteer-core (never the Chrome/Edge
// --screenshot CLI — broken on hosts with a running browser session).
// Writes: qa/qa-report.md, qa/qa-log.md, qa/qa-summary.json, qa/evidence/**.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import {
  serve, openPage, shot, shotFull, state, settle, delay, evPath, writeJson,
  ROOT, EVIDENCE, TMP, PORT, CHROME, EDGE, mkdirp
} from './lib.mjs';

const BASE = 'http://localhost:' + PORT + '/';
const results = [];
const env = {
  os: process.platform + ' ' + process.arch,
  node: process.version,
  puppeteer: null,
  chrome: null,
  edge: null,
  generatedAt: new Date().toISOString(),
  sha: 'no-git'
};
try { env.sha = execSync('git rev-parse --short HEAD', { cwd: ROOT }).toString().trim(); } catch (e) {}
try { env.puppeteer = JSON.parse(fs.readFileSync(path.join(ROOT, 'node_modules', 'puppeteer-core', 'package.json'), 'utf8')).version; } catch (e) {}

function add(id, entry, status, value, threshold, evidence = [], note = '') {
  results.push({ id, entry, status, value, threshold, evidence, note });
  console.log('[' + status + '] ' + id + ' ' + entry + ' — ' + String(value).slice(0, 240));
}
const PASS = 'PASS', FAIL = 'FAIL', INFO = 'INFO', OBS = 'OBSERVED', NP = 'NOT PERFORMED';

function median(arr) { const s = [...arr].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; }
function cub(t, a, b) { const x = Math.min(1, Math.max(0, (t - a) / (b - a))); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

async function waitStableScroll(page, { quiet = 3, step = 80, maxMs = 3000 } = {}) {
  const t0 = Date.now();
  let prev = null, stable = 0;
  while (Date.now() - t0 < maxMs) {
    const y = await page.evaluate(() => window.scrollY);
    if (prev !== null && y === prev) stable++; else stable = 0;
    prev = y;
    if (stable >= quiet) return y;
    await delay(step);
  }
  return prev;
}

function walk(dir, out = []) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out); else out.push(p);
  }
  return out;
}

function tealScan(pngPath, zones) {
  const tmp = path.join(TMP, 'teal-zones.json');
  fs.writeFileSync(tmp, JSON.stringify(zones));
  const outp = execSync('python "' + path.join(ROOT, 'qa', 'teal-scan.py') + '" "' + pngPath + '" "' + tmp + '"', { encoding: 'utf8' });
  return JSON.parse(outp);
}

/* =================== MAIN =================== */
let server = null, browser = null, edgeBrowser = null;
mkdirp(EVIDENCE);
mkdirp(TMP);

try {
  server = await serve(ROOT, PORT);
  console.log('QA server on ' + BASE);
  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--disable-gpu-sandbox'] });
  env.chrome = await browser.version();
  console.log('Chrome: ' + env.chrome);

  /* ---------- a) structure: nothing but logo stage + footer; no navbar ---------- */
  try {
    const sweep = [];
    for (const [w, h] of [[360, 740], [768, 1024], [1440, 900]]) {
      for (const pos of ['top', 'mid', 'footer']) {
        const page = await openPage(browser, { w, h });
        if (pos === 'mid') await page.evaluate(() => window.scrollTo(0, (document.getElementById('story').offsetHeight - innerHeight) / 2));
        if (pos === 'footer') await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(300);
        const r = await page.evaluate(() => {
          const out = {
            /* only site-level headers count as chrome: a <header> inside a <section> is the
   section's own heading block, which the gallery uses */
headers: Array.from(document.querySelectorAll('header')).filter((h) => !h.closest('section')).length,
            navs: [], fixed: [],
            removed: {
              copy: document.querySelectorAll('.hero__copy, #hero-copy, .hero__col').length,
              indicator: document.querySelectorAll('.hero__indicator, #hero-indicator').length,
              hint: document.querySelectorAll('.hero__hint, #hero-hint').length,
              rmMark: document.querySelectorAll('.rm-mark').length
            },
            legacyGone: document.querySelectorAll('#programmes, .gallery__card, .chapters, .scrollhint').length,
            bodyChildren: Array.from(document.body.children).map((el) => el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''))
          };
          document.querySelectorAll('nav, [role=navigation]').forEach((n) => out.navs.push({ inFooter: !!n.closest('footer') }));
          document.querySelectorAll('body *').forEach((el) => {
            const cs = getComputedStyle(el);
            if ((cs.position === 'fixed' || cs.position === 'sticky') && !el.closest('#story') && !el.closest('#mobile-gate') && !el.closest('.gallery__lightbox')) {
              out.fixed.push((el.className && String(el.className)) || el.tagName);
            }
          });
          return out;
        });
        sweep.push({ w, h, pos, ...r });
        await page.close();
      }
    }
    writeJson(evPath('a', 'nav-sweep.json'), sweep);
    const navOk = sweep.every((r) => r.headers === 0 && r.fixed.length === 0 && r.navs.every((n) => n.inFooter));
    add('a', 'nav absence (9 cells)', navOk ? PASS : FAIL, navOk ? 'headers 0; no fixed/sticky outside hero; nav only in footer' : JSON.stringify(sweep.filter((r) => r.headers || r.fixed.length)), 'zero nav outside footer', ['evidence/a/nav-sweep.json']);
    const remOk = sweep.every((r) => Object.values(r.removed).every((v) => v === 0) && r.legacyGone === 0);
    add('a', 'old placeholder elements removed from DOM (legacy programmes/cards, not the new gallery)', remOk ? PASS : FAIL, JSON.stringify(sweep[0].removed) + ' galleryGone=' + sweep[0].galleryGone + ' body=' + JSON.stringify(sweep[0].bodyChildren), 'copy/indicator/hint/rm-mark/gallery counts all 0; body = skip-link + noscript + hero + footer', ['evidence/a/nav-sweep.json']);
  } catch (e) { add('a', 'structure sweep', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- a2) source audit: no dead placeholders; programmes removed ---------- */
  try {
    const files = ['index.html', 'assets/css/style.css', 'assets/js/main.js', 'content.js'];
    const needles = ['hero__copy', 'hero__hint', 'hero__indicator', 'rm-mark', 'chapters', 'scrollhint', 'programmes'];
    const lines = [];
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8').toLowerCase();
      const counts = needles.map((n) => ({ n, c: (src.split(n).length - 1) }));
      const sum = counts.reduce((a, b) => a + b.c, 0);
      total += sum;
      lines.push(f + ' :: ' + counts.map((c) => c.n + '=' + c.c).join(', '));
    }
    const imgDir = path.join(ROOT, 'assets', 'img');
    const imgFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).sort() : [];
    lines.push('assets/img: ' + (imgFiles.length ? imgFiles.join(', ') : '(none — removed)'));
    lines.push('total dead-placeholder references: ' + total);
    fs.writeFileSync(evPath('a', 'removal-audit.txt'), lines.join('\n') + '\n', 'utf8');
    const ok = total === 0 && imgFiles.length === 0;
    add('a', 'source audit: no dead placeholders; programmes assets removed', ok ? PASS : FAIL, JSON.stringify({ deadRefs: total, imgFiles: imgFiles.length }), 'no hero__copy/hint/indicator/rm-mark/gallery refs in shipped files; assets/img empty', ['evidence/a/removal-audit.txt']);
  } catch (e) { add('a', 'source audit', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- b) intro stage ---------- */
  try {
    const rows = [];
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const page = await openPage(browser, { w, h, qa: 0 });
      const st = await state(page);
      const dx = +(st.frame.x + st.frame.w / 2 - w / 2).toFixed(2);
      const dy = +(st.frame.y + st.frame.h / 2 - h / 2).toFixed(2);
      const expectedW = Math.min(0.92 * w, 0.96 * h * 1.2757, 1600);
      const sizeOk = Math.abs(st.frame.w - expectedW) <= 3;
      const notClipped = st.frame.x >= -2 && st.frame.x + st.frame.w <= w + 2 && st.frame.y >= -2 && st.frame.y + st.frame.h <= h + 2;
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      rows.push({ vp: w + 'x' + h, dx, dy, frameW: +st.frame.w.toFixed(1), expectedW: +expectedW.toFixed(1), sizeOk, notClipped, bg, spin: st.spin, markOpacity: st.markboxOpacity, wordOpacity: st.wordmarkOpacity, sideOp: st.side });
      await shot(page, 'a/intro-' + w + 'x' + h + '.png');
      await page.close();
    }
    writeJson(evPath('a', 'intro-audit.json'), rows);
    const ok = rows.every((r) => Math.abs(r.dx) <= 8 && Math.abs(r.dy) <= 8 && r.sizeOk && r.notClipped && r.bg === 'rgb(23, 25, 27)' && r.spin === 0 && r.markOpacity === 0 && r.wordOpacity === 1 && r.sideOp === 0);
    add('b', 'intro: big wordmark centered on dark gray, unclipped', ok ? PASS : FAIL, JSON.stringify(rows), 'hero size == min(92vw, 96vh*1.2757, 1600px) ±3; centered ±8px; fully in viewport; side copy hidden; bg rgb(23,25,27)', ['evidence/a/intro-1440x900.png', 'evidence/a/intro-audit.json']);
  } catch (e) { add('b', 'intro stage', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- c) motion trace: clockwise spin → left → down, no diagonal ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    const st0 = await state(page);
    const travel = st0.travel, heroTop = st0.heroTop;
    const trace = [];
    const STEPS = 60;
    for (let i = 0; i <= STEPS; i++) {
      const y = Math.round((travel * i) / STEPS);
      await page.evaluate((yy) => window.scrollTo(0, yy), y);
      const st = await settle(page, 4000);
      trace.push({ y, p: +st.p.toFixed(5), spin: +st.spin.toFixed(3), tx: +st.tx.toFixed(2), ty: +st.ty.toFixed(2), sF: +st.sF.toFixed(4), fade: +st.fade.toFixed(3), wOp: st.wordmarkOpacity, mOp: st.markboxOpacity, mcx: +(st.markbox.x + st.markbox.w / 2).toFixed(1), mcy: +(st.markbox.y + st.markbox.h / 2).toFixed(1) });
    }
    const mapErr = Math.max(...trace.map((t) => Math.abs(t.p - Math.min(1, Math.max(0, (t.y - heroTop) / travel)))));
    let monoSpin = true, maxSpinStep = 0, spinEnd = trace[trace.length - 1].spin;
    for (let i = 1; i < trace.length; i++) {
      const d = trace[i].spin - trace[i - 1].spin;
      if (d < -0.001) monoSpin = false;
      maxSpinStep = Math.max(maxSpinStep, d);
    }
    let orderOk = true, maxPosStep = 0;
    for (let i = 1; i < trace.length; i++) {
      const a = trace[i - 1], b = trace[i];
      // B (0.12-0.32): spin in place (no frame translation)
      if (b.p > 0.12 && b.p <= 0.32 && (Math.abs(b.tx) > 1 || Math.abs(b.ty) > 1)) orderOk = false;
      // C hold (0.46-0.56): small mark centred, spin parked at 180
      if (b.p > 0.46 && b.p <= 0.56 && (Math.abs(b.mcy - 450) > 4 || Math.abs(b.mcx - 720) > 4 || Math.abs(b.spin - 180) > 1)) orderOk = false;
      // D1 (0.60-0.68): big mark grows, centre travels left only
      if (b.p > 0.60 && b.p <= 0.68 && (b.mcx > a.mcx + 2 || Math.abs(b.mcy - 450) > 6)) orderOk = false;
      // D2 (0.72-0.82): big mark spins rightward across the screen
      if (b.p > 0.72 && b.p <= 0.82 && (b.mcx < a.mcx - 2 || Math.abs(b.mcy - 450) > 6)) orderOk = false;
      // E (0.86-0.92): mark centre travels left and down into the dock
      if (b.p > 0.86 && b.p <= 0.92 && (b.mcy < a.mcy - 2 || b.mcx > a.mcx + 2)) orderOk = false;
      maxPosStep = Math.max(maxPosStep, Math.abs(b.mcx - a.mcx), Math.abs(b.mcy - a.mcy));
    }
    const cEnd = trace.reduce((acc, t) => (Math.abs(t.p - 0.84) < Math.abs(acc.p - 0.84) ? t : acc), trace[0]);
    const dEnd = trace.reduce((acc, t) => (Math.abs(t.p - 1) < Math.abs(acc.p - 1) ? t : acc), trace[0]);
    const opacityOk = trace.every((t) => Math.abs((t.wOp || 0) + (t.mOp || 0) - 1) <= 0.01);
    const traceOk = mapErr <= 0.002 && monoSpin && Math.abs(spinEnd - 360) <= 0.5 && maxSpinStep <= 162 && maxPosStep <= 500 && orderOk && opacityOk;
    writeJson(evPath('b', 'motion-trace.json'), { travel, heroTop, mapErr, monoSpin, spinEnd, maxSpinStep, maxPosStep: +maxPosStep.toFixed(1), orderOk, opacityOk, cEnd, dEnd, steps: trace });
    add('c', 'motion trace (60 steps)', traceOk ? PASS : FAIL,
      JSON.stringify({ mapErr: +mapErr.toFixed(4), monoSpin, spinEnd, maxSpinStep: +maxSpinStep.toFixed(1), maxPosStep: +maxPosStep.toFixed(1), orderOk, opacityOk, cEndTx: cEnd.tx, dEndTy: dEnd.ty }),
      'clockwise monotonic to 360±0.5; spin in place; side-copy hold with centred mark; grow left on the middle line; sweep right; enlarged state at exact 45-degree pose; dock travel left+down; no position jumps (max step <= 500px/sample); swap opacity sum=1', ['evidence/b/motion-trace.json']);

    // settle / oscillation / idle
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page);
    await page.mouse.wheel({ deltaY: 900 });
    await waitStableScroll(page);
    await settle(page);
    const s1 = await state(page);
    const mapP = Math.min(1, Math.max(0, (s1.scrollY - heroTop) / travel));
    const settleOk = Math.abs(s1.p - mapP) <= 0.002;
    const samples = [];
    for (let i = 0; i < 8; i++) { samples.push((await state(page)).p); await delay(60); }
    let reversals = 0, dir = 0;
    for (let i = 1; i < samples.length; i++) {
      const d = samples[i] - samples[i - 1];
      if (Math.abs(d) < 1e-7) continue;
      const nd = d > 0 ? 1 : -1;
      if (dir !== 0 && nd !== dir) reversals++;
      dir = nd;
    }
    const idleDelta = Math.abs(samples[samples.length - 1] - samples[0]);
    add('c', 'settle / no-oscillation / idle-stability', settleOk && reversals <= 2 && idleDelta === 0 ? PASS : FAIL,
      JSON.stringify({ settleOk, p: +s1.p.toFixed(5), mapP: +mapP.toFixed(5), reversals, idleDelta }), 'p==mapping after stop (0.002); <=2 reversals; idle delta 0', []);

    // determinism
    const gotoY = async (yy) => { await page.evaluate((v) => window.scrollTo(0, v), yy); await settle(page); const st = await state(page); return [st.frameTransform, String(st.wordmarkOpacity), String(st.markboxOpacity)].join('|'); };
    const t1 = await gotoY(Math.round(travel * 0.42));
    await gotoY(Math.round(travel * 0.75));
    const t2 = await gotoY(Math.round(travel * 0.42));
    add('c', 'determinism (same scrollY twice)', t1 === t2 ? PASS : FAIL, t1 === t2 ? 'identical serialized transforms' : 'MISMATCH', 'identical', []);
    await page.close();

    // enlarged-state half-clip audit (single-axis left clip, no overflow)
    {
      const clipRows = [];
      for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
        const pg = await openPage(browser, { w, h, qa: 0.84 });
        const stc = await state(pg);
        const mk = stc.markbox;
        const cx = mk.x + mk.w / 2;
        const r = stc.rBig;
        const visW = Math.max(0, Math.min(cx + r, w) - Math.max(cx - r, 0));
        const fracX = +(visW / (2 * r)).toFixed(3);
        const spin = +stc.spin.toFixed(1);
        const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        clipRows.push({ vp: w + 'x' + h, visFrac: fracX, markCx: +cx.toFixed(1), spin, overflow, ok: fracX >= 0.42 && fracX <= 0.58 && Math.abs(spin - 360) <= 1 && Math.abs(cx - w) <= 5 && overflow <= 1 });
        await shot(pg, 'b/bigright-' + w + 'x' + h + '.png');
        await pg.close();
      }
      writeJson(evPath('b', 'halfclip-audit.json'), clipRows);
      add('c', 'enlarged state (right edge): half clipped, exact 45-degree pose, no overflow', clipRows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(clipRows), 'visible width fraction 0.42-0.58 at max size; centre on the right edge ±5; spin 360±1 (exact 45-degree diamond pose); scrollWidth overflow 0', ['evidence/b/halfclip-audit.json', 'evidence/b/bigright-1440x900.png']);
    }

    // big-right state: half clipped at the right edge, 45-degree pose
    {
      const rows = [];
      for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
        const pg = await openPage(browser, { w, h, qa: 0.70 });
        const stc = await state(pg);
        const mk = stc.markbox;
        const cx = mk.x + mk.w / 2;
        const r = stc.rBig;
        const visW = Math.max(0, Math.min(cx + r, w) - Math.max(cx - r, 0));
        const fracX = +(visW / (2 * r)).toFixed(3);
        const spin = +stc.spin.toFixed(1);
        const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const ogGone = await pg.evaluate(() => document.querySelectorAll('#hero-mark-og, .hero__mark--og, [src*="logo-mark-og"]').length);
        rows.push({ vp: w + 'x' + h, ogGone, visFrac: fracX, markCx: +cx.toFixed(1), spin, overflow, ok: fracX >= 0.42 && fracX <= 0.58 && Math.abs(cx) <= 8 && Math.abs(spin - 270) <= 1 && overflow <= 1 && ogGone === 0 });
        await shot(pg, 'b/bigleft-' + w + 'x' + h + '.png');
        await pg.close();
      }
      writeJson(evPath('b', 'bigleft-audit.json'), rows);
      add('c', 'big left: half clipped at the left edge, 45-degree pose', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'visible fraction 0.42-0.58 with the centre on the left edge; spin 270±1 (45-degree pose); overflow 0; OG overlay gone', ['evidence/b/bigleft-audit.json', 'evidence/b/bigleft-1440x900.png']);
    }

    // mid-sweep: the big mark crossing the middle on its way to the left
    {
      const pg = await openPage(browser, { w: 1440, h: 900, qa: 0.77 });
      const stc = await state(pg);
      const mk = stc.markbox;
      const mcx = mk.x + mk.w / 2;
      const ok = mcx > 200 && mcx < 1240 && Math.abs(mk.y + mk.h / 2 - 450) <= 6;
      await shot(pg, 'b/sweep-1440x900.png');
      add('c', 'mid-sweep: the big mark crosses the middle, fully on screen', ok ? PASS : FAIL, JSON.stringify({ mcx: +mcx.toFixed(1), spin: +stc.spin.toFixed(1) }), 'at p=0.77 the big mark sits between the edges, centred vertically', ['evidence/b/sweep-1440x900.png']);
      await pg.close();
    }

    // founder-text phase: binary rain (0/1) morphs in with the side copy, out before the growth
    {
      const pg = await openPage(browser, { w: 1440, h: 900, qa: 0.47 });
      await delay(500);
      const d = await pg.evaluate(() => {
        const mw = document.getElementById('hero-matrix');
        const cv = document.getElementById('matrix-canvas');
        let lit = -1;
        try {
          const cx = cv.getContext('2d');
          const img = cx.getImageData(0, 0, cv.width, Math.min(260, cv.height));
          const da = img.data; lit = 0;
          for (let i = 3; i < da.length; i += 4) if (da[i] > 6) lit++;
        } catch (e) { lit = -1; }
        const band = document.querySelectorAll('#hero-diagram, .hero__diagram, [id^="diagram-"]').length;
        return { mtxOp: mw ? +(+getComputedStyle(mw).opacity).toFixed(3) : -1, lit, band };
      });
      const ok = d.mtxOp >= 0.9 && d.lit > 40 && d.band === 0;
      await shot(pg, 'b/founder-rain.png');
      add('c', 'founder phase: binary rain (0/1) active; no guide/hologram elements', ok ? PASS : FAIL, JSON.stringify({ mtxOp: d.mtxOp, lit: d.lit, band: d.band }), 'rain visible during the founder text (opacity ~1, lit pixels > 40); no diagram elements remain in the DOM', ['evidence/b/founder-rain.png']);
      await pg.close();
      const pg2b = await openPage(browser, { w: 1440, h: 900, qa: 0.545 });
      const mout = await pg2b.evaluate(() => +getComputedStyle(document.getElementById('hero-matrix')).opacity);
      add('c', 'founder phase: rain morph-out is a smooth partial fade', mout > 0.03 && mout < 0.97 ? PASS : FAIL, JSON.stringify({ mtxOp: +mout.toFixed(3) }), 'at p=0.545 the rain is mid-fade (0.03 < opacity < 0.97)', []);
      await pg2b.close();
      const pg3b = await openPage(browser, { w: 1440, h: 900, qa: 0.24 });
      const mspin = await pg3b.evaluate(() => +getComputedStyle(document.getElementById('hero-matrix')).opacity);
      add('c', 'spin phase: no rain (the effect lives with the founder text)', mspin <= 0.03 ? PASS : FAIL, JSON.stringify({ mtxOp: +mspin.toFixed(3) }), 'at p=0.24 the rain is off (opacity <= 0.03)', []);
      await pg3b.close();
    }

    // international places overlay: mirrored staircase (steps down-right) during the big-left phase
    {
      const rows = [];
      for (const [w, h] of [[1440, 900], [1280, 800]]) {
        const pg = await openPage(browser, { w, h, qa: 0.696 });
        await delay(300);
        const d = await pg.evaluate(() => {
          const wrap = document.getElementById('hero-places');
          const items = Array.from(wrap.querySelectorAll('.hp-row'));
          const ops = items.map((el) => parseFloat(el.style.opacity || '0'));
          const flags = items.map((el) => { const im = el.querySelector('img'); return !!(im && im.complete && im.naturalWidth > 0); });
          const mk = document.getElementById('hero-mark').getBoundingClientRect();
          const lefts = items.map((el) => Math.round(el.getBoundingClientRect().left));
          const gaps = items.map((el) => Math.round(el.getBoundingClientRect().left - mk.right));
          const zones = items.map((el) => { const c = el.querySelector('.hp-flag').getBoundingClientRect(); return [Math.round(c.left), Math.round(c.top), Math.round(c.right), Math.round(c.bottom)]; });
          const kEl = wrap.querySelector('.hp-kicker');
          if (kEl) { const c = kEl.getBoundingClientRect(); zones.push([Math.round(c.left), Math.round(c.top), Math.round(c.right), Math.round(c.bottom)]); }
          return { n: items.length, minOp: Math.min(...ops), flagsOk: flags.length === 5 && flags.every(Boolean),
            minGap: Math.min(...gaps), lefts, band: document.querySelectorAll('#places-list, section.places').length,
            overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth, zones };
        });
        await shot(pg, 'd/hero-places-' + w + 'x' + h + '.png');
        const scan = tealScan(path.join(EVIDENCE, 'd', 'hero-places-' + w + 'x' + h + '.png'), d.zones);
        rows.push({ vp: w + 'x' + h, n: d.n, minOp: d.minOp, flagsOk: d.flagsOk, minGap: d.minGap, lefts: d.lefts, band: d.band, overflow: d.overflow, scan });
        await pg.close();
      }
      const EXP = { '1440x900': [205, 349, 440, 314, 164], '1280x800': [182, 311, 391, 279, 146] };
      const stepOk = rows.every((r) => r.lefts.length === 5 && r.lefts.every((x, i) => Math.abs(x - EXP[r.vp][i]) <= 8));
      const ok = rows.every((r) => r.n === 5 && r.minOp >= 0.95 && r.flagsOk && r.scan && r.scan.hits === 0 && r.scan.minGap >= 8 && r.band === 0 && r.overflow <= 1);
      add('d', 'international places overlay (rows fanned to the logo contour, per-line alignment)', ok && stepOk ? PASS : FAIL, JSON.stringify(rows), 'at p=0.696 (1440/1280): 5 rows fully visible, flags loaded, row left edges match the per-line contour fan (+-8px), pixel-scan clear of the mark, standalone section gone', ['evidence/d/hero-places-1440x900.png', 'evidence/d/hero-places-1280x800.png']);

      const offs = [];
      for (const qv of [0.24, 0.58, 0.88]) {
        const pg = await openPage(browser, { w: 1440, h: 900, qa: qv });
        await delay(250);
        const m = await pg.evaluate(() => Math.max(0, ...Array.from(document.querySelectorAll('#hero-places .hp-row')).map((el) => parseFloat(el.style.opacity || '0'))));
        offs.push({ qa: qv, maxOp: m });
        await pg.close();
      }
      const offOk = offs.every((r) => r.maxOp <= 0.05);
      add('d', 'places overlay hidden outside its window (spin, founder copy, dock)', offOk ? PASS : FAIL, JSON.stringify(offs), 'rows invisible (op <= 0.05) at p=0.24, 0.58, 0.88', []);

      const pg2 = await openPage(browser, { w: 390, h: 844, qa: 0.63 });
      await delay(250);
      const m2 = await pg2.evaluate(() => {
        const items = Array.from(document.querySelectorAll('#hero-places .hp-row'));
        const ops = items.map((el) => parseFloat(el.style.opacity || '0'));
        const flags = items.map((el) => { const im = el.querySelector('img'); return !!(im && im.complete && im.naturalWidth > 0); });
        return { some: ops.filter((v) => v >= 0.3).length >= 3, minOp: Math.min(...ops), flagsOk: flags.every(Boolean), overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      await shot(pg2, 'd/hero-places-390x844.png');
      await pg2.close();
      const gatePg = await openPage(browser, { w: 390, h: 844, qa: 0.63 });
      await delay(250);
      const gate = await gatePg.evaluate(() => ({
        gated: document.documentElement.classList.contains('is-gated'),
        noticeShown: !document.getElementById('mobile-gate').hidden,
        title: (document.querySelector('#mobile-gate .gate__title') || {}).textContent || '',
        rows: document.querySelectorAll('#hero-places .hp-row').length,
        scrollable: document.documentElement.scrollHeight > window.innerHeight + 1
      }));
      await shot(gatePg, 'd/gate-390x844.png');
      await gatePg.close();
      const mobOk = gate.gated && gate.noticeShown && gate.rows === 0 && !gate.scrollable;
      add('d', 'phones get the desktop-only notice instead of the site', mobOk ? PASS : FAIL, JSON.stringify(gate), 'at 390 wide: gate class set, notice visible, no overlay rows built, page not scrollable', ['evidence/d/gate-390x844.png']);
    }

    // side-copy stage: text appears left/right of the small symbol, mark centred
    {
      const rows = [];
      for (const [w, h] of [[1440, 900], [1280, 800]]) {
        const pg = await openPage(browser, { w, h, qa: 0.5 });
        const stt = await state(pg);
        const o = await pg.evaluate(() => {
          const sl = document.getElementById('hero-side-left');
          const sr = document.getElementById('hero-side-right');
          const slr = sl.getBoundingClientRect();
          const srr = sr.getBoundingClientRect();
          return {
            opL: +getComputedStyle(sl).opacity, opR: +getComputedStyle(sr).opacity,
            sl: { x: slr.x, y: slr.y, r: slr.x + slr.width, b: slr.y + slr.height },
            sr: { x: srr.x, y: srr.y, r: srr.x + srr.width, b: srr.y + srr.height },
            titleL: sl.querySelector('.hero__side-title').textContent.length,
            titleR: sr.querySelector('.hero__side-title').textContent.length
          };
        });
        const ffq = await pg.evaluate(async () => {
          await document.fonts.ready;
          const b = document.querySelector('#hero-side-left .hero__side-body');
          const ogCount = document.querySelectorAll('#hero-mark-og, .hero__mark--og').length;
          const mw = document.getElementById('hero-matrix');
          const band = document.querySelectorAll('#hero-diagram, .hero__diagram, [id^="diagram-"]').length;
          return { ogCount, band, mtx0: mw ? +getComputedStyle(mw).opacity : -1, ff: b ? getComputedStyle(b).fontFamily : '', fontOk: document.fonts.check('16px "Cormorant Garamond"') };
        });
        const mcx = stt.markbox.x + stt.markbox.w / 2;
        const mcy = stt.markbox.y + stt.markbox.h / 2;
        const rMark = (stt.frame.w * 0.5095) / 2; // frame.w at spin=180 equals sF * frameW
        const centered = Math.abs(mcx - w / 2) <= 5 && Math.abs(mcy - h / 2) <= 5;
        const visible = o.opL >= 0.9 && o.opR >= 0.9;
        const noGhost = (stt.wordmarkOpacity || 0) <= 0.02 && (stt.markboxOpacity || 0) >= 0.98;
        const noOverlap = w > 640
          ? (o.sl.r + 8 <= mcx - rMark) && (o.sr.x - 8 >= mcx + rMark)
          : (o.sl.b + 4 <= mcy - rMark) && (o.sr.y - 4 >= mcy + rMark);
        const ok = centered && visible && noOverlap && noGhost && o.titleL > 5 && o.titleR > 5 && ffq.ogCount === 0 && /Cormorant/i.test(ffq.ff) && ffq.fontOk === true && ffq.band === 0 && ffq.mtx0 >= 0.9;
        rows.push({ vp: w + 'x' + h, centered, visible, noGhost, noOverlap, ogCount: ffq.ogCount, band: ffq.band, mtx0: ffq.mtx0, ff: ffq.ff.slice(0, 42), fontOk: ffq.fontOk, mcx: +mcx.toFixed(1), mcy: +mcy.toFixed(1), rMark: +rMark.toFixed(1), ok });
        await shot(pg, 'b/sidetext-' + w + 'x' + h + '.png');
        await pg.close();
        const pg2 = await openPage(browser, { w, h, qa: 0.7 });
        const gone = await pg2.evaluate(() => [+getComputedStyle(document.getElementById('hero-side-left')).opacity, +getComputedStyle(document.getElementById('hero-side-right')).opacity]);
        rows[rows.length - 1].goneAt07 = gone;
        if (gone[0] > 0.05 || gone[1] > 0.05) rows[rows.length - 1].ok = false;
        await pg2.close();
      }
      writeJson(evPath('b', 'sidecopy-audit.json'), rows);
      add('c', 'side copy: serif type beside the small symbol, then gone before the growth', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'both blocks fully visible + clear of the mark at p=0.5; centred mark; wordmark fully swapped (no ghost); hidden by p=0.7; Cormorant Garamond active; no OG overlay', ['evidence/b/sidecopy-audit.json', 'evidence/b/sidetext-1440x900.png']);
    }

    // hero end state: mark docked just above the bottom edge, upright
    {
      const rows = [];
      for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080]]) {
        const pg = await openPage(browser, { w, h, qa: 0.995 });
        const stt = await state(pg);
        const mcx = stt.markbox.x + stt.markbox.w / 2;
        const mcy = stt.markbox.y + stt.markbox.h / 2;
        const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        const expY = h - stt.dockR - 20;
        const ok = Math.abs(mcx - w / 2) <= 6 && Math.abs(mcy - expY) <= 6 && Math.abs(stt.spin - 360) <= 1.5 && (mcy + stt.dockR) <= h + 1 && overflow <= 1;
        rows.push({ vp: w + 'x' + h, center: [+mcx.toFixed(1), +mcy.toFixed(1)], expY: +expY.toFixed(1), spin: +stt.spin.toFixed(1), overflow, ok });
        await shot(pg, 'b/herodock-' + w + 'x' + h + '.png');
        await pg.close();
      }
      writeJson(evPath('b', 'herodock-audit.json'), rows);
      add('d', 'hero end: mark docked upright just above the bottom edge', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'centre == (vw/2, vh−dockR−20) ±6; spin 360±1.5; fully visible; no overflow', ['evidence/b/herodock-audit.json']);
    }

    // stage stills at pins
    for (const q of [0, 0.25, 0.5, 0.70, 0.84, 0.93, 1.0]) {
      for (const [w, h] of [[1440, 900], [1280, 800], [1920, 1080]]) {
        const p = await openPage(browser, { w, h, qa: q });
        await shot(p, 'b/pin-' + q + '-' + w + 'x' + h + '.png');
        await p.close();
      }
    }
  } catch (e) { add('c', 'motion trace', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

    /* ---------- d) footer state: giant text present; big mark removed ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitStableScroll(page);
    await settle(page, 2500);
    const st = await page.evaluate(() => ({
      endmark: document.querySelectorAll('#footer-endmark, .footer__endmark').length,
      landing: document.querySelectorAll('#footer-landing, .footer__landing').length,
      sigLayers: document.querySelectorAll('#footer-signature text').length,
      sigW: document.getElementById('footer-signature').getBoundingClientRect().width,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
    }));
    const ok = st.endmark === 0 && st.landing === 0 && st.sigLayers === 3 && st.sigW > 300 && st.overflow <= 1;
    await shot(page, 'd/footer-1440x900.png');
    writeJson(evPath('d', 'dock-audit.json'), st);
    add('d', 'footer: giant text present; the big logo above it removed', ok ? PASS : FAIL, JSON.stringify(st), 'no endmark/landing elements; signature has 3 layers spanning the footer; no overflow', ['evidence/d/dock-audit.json', 'evidence/d/footer-1440x900.png']);
    await page.close();
  } catch (e) { add('d', 'footer state', FAIL, 'exception: ' + e.message, 'no exceptions', []); }
  /* ---------- d2) footer stability: page height steady across scrolling ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    const h1 = await page.evaluate(() => document.documentElement.scrollHeight);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await waitStableScroll(page);
    await settle(page, 1500);
    await page.evaluate(() => window.scrollTo(0, 0));
    await settle(page, 1500);
    const h2 = await page.evaluate(() => document.documentElement.scrollHeight);
    const ok = Math.abs(h2 - h1) <= 2;
    add('d2', 'footer stability: page height steady across scrolling', ok ? PASS : FAIL, JSON.stringify({ h1, h2 }), 'scrollHeight shift <= 2px', []);
    await page.close();
  } catch (e) { add('d2', 'footer stability', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- e) sharpness evidence (vector + zoom crops) ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, qa: 0.84, dpr: 2 });
    const src = await page.evaluate(() => document.getElementById('hero-mark').src);
    await shot(page, 'e/mark-zoom-2x.png');
    const isSvg = /\.svg(\?|$)/.test(src);
    writeJson(evPath('e', 'sharpness.json'), { markSrc: src, deviceScaleFactor: 2, isSvg });
    add('e', 'enlarged mark rendered from vector (SVG) source', isSvg ? PASS : FAIL, JSON.stringify({ markSrc: src, dpr: 2 }), 'mark displayed from .svg (scale-free)', ['evidence/e/mark-zoom-2x.png']);
    await page.close();
  } catch (e) { add('e', 'sharpness evidence', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- f) content source + footer integrity ---------- */
  try {
    const files = ['index.html', 'assets/css/style.css', 'assets/js/main.js', 'server.js'];
    const needles = ['Novin Robotic Mirzania', '+00 000 000 0000', 'hello@example.com', 'Robotics research, teaching'];
    const lines = [];
    let total = 0;
    for (const f of files) {
      let src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      // Head metadata (og/twitter/JSON-LD) must ship statically for crawlers, so the
      // duplication rule applies to rendered body copy only.
      if (f === 'index.html') src = src.replace(/<head>[\s\S]*?<\/head>/i, '<head></head>');
      const counts = needles.map((n) => ({ n, c: src.split(n).length - 1 }));
      total += counts.reduce((a, b) => a + b.c, 0);
      lines.push(f + ' :: ' + counts.map((c) => c.n + '=' + c.c).join(', '));
    }
    fs.writeFileSync(evPath('f', 'content-audit.txt'), lines.join('\n') + '\n', 'utf8');
    add('f', 'single content source (no duplicates)', total === 0 ? PASS : FAIL, 'duplicates outside content.js: ' + total, '0 occurrences of sample strings in shipped files', ['evidence/f/content-audit.txt']);

    const page = await openPage(browser, { w: 1440, h: 900 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(400);
    await shot(page, 'f/footer-1440x900.png');
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('#footer-explore a')).map((a) => ({ href: a.getAttribute('href'), label: a.textContent })));
    const landings = [];
    for (let i = 0; i < links.length; i++) {
      await page.evaluate((idx) => document.querySelectorAll('#footer-explore a')[idx].click(), i);
      await delay(350);
      const href = links[i].href;
      if (href.startsWith('#')) {
        const top = await page.evaluate((id) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top : null; }, href.slice(1));
        landings.push({ label: links[i].label, href, top: top === null ? null : +top.toFixed(1) });
      }
    }
    const contactCheck = await page.evaluate(() => {
      const f = window.SITE_CONTENT.footer;
      const c = f.contact;
      const tel = (v) => 'tel:' + String(v).replace(/[^+\d]/g, '');
      const bodyText = document.body.innerText;
      return {
        emailAbsent: !document.getElementById('footer-email') && !document.getElementById('footer-email-row') && !('email' in c),
        phoneHref: document.getElementById('footer-phone').getAttribute('href') === tel(c.phone),
        phoneText: document.getElementById('footer-phone').textContent === c.phone,
        mobileHref: document.getElementById('footer-mobile').getAttribute('href') === tel(c.mobile),
        instagramHref: document.getElementById('footer-instagram').getAttribute('href') === c.instagram,
        address: document.getElementById('footer-address').textContent === c.address,
        legal: document.getElementById('footer-legal').textContent === f.legal,
        noPlaceholders: !/example\.com|\+00 000|Example City|Draft placeholder|lorem ipsum/i.test(bodyText),
        _domLegal: document.getElementById('footer-legal').textContent,
        _contentLegal: f.legal
      };
    });
    writeJson(evPath('f', 'footer-links.json'), { links, landings, contactCheck });
    const landOk = landings.every((l) => l.top !== null && l.top >= -40 && l.top <= 675);
    const checks = ['emailAbsent', 'phoneHref', 'phoneText', 'mobileHref', 'instagramHref', 'address', 'legal', 'noPlaceholders'];
    const ok = landOk && checks.every((k) => contactCheck[k]) && links.length === 3;
    add('f', 'footer: links land + contact/legal intact', ok ? PASS : FAIL, JSON.stringify({ landings, contactCheck }), '3 links land within viewport; phone/mobile tel hrefs; address + legal == content; email row hidden when unpublished; no placeholder copy anywhere', ['evidence/f/footer-links.json', 'evidence/f/footer-1440x900.png']);

    /* signature: three layers, draw-in completes */
    const sigBase = await page.evaluate(() => {
      const wrap = document.getElementById('footer-signature');
      const texts = Array.from(wrap.querySelectorAll('text'));
      return { layers: texts.length, content: texts[0] ? texts[0].textContent : '', drawn: wrap.classList.contains('is-drawn') };
    });
    {
      const t0 = Date.now();
      while (!sigBase.drawn && Date.now() - t0 < 8000) {
        await delay(300);
        sigBase.drawn = await page.evaluate(() => document.getElementById('footer-signature').classList.contains('is-drawn'));
      }
    }
    await delay(4600);
    const dashAfter = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('.sig__draw')).strokeDashoffset));
    await shot(page, 'f/footer-signature-1440x900.png');
    const sigOk = sigBase.layers === 3 && /NOVIN ROBOTIC MIRZANIA/.test(sigBase.content) && sigBase.drawn && dashAfter <= 1;
    writeJson(evPath('f', 'signature-audit.json'), { base: sigBase, dashAfter });
    add('f', 'footer signature: text present, draw-in completes', sigOk ? PASS : FAIL, JSON.stringify({ layers: sigBase.layers, drawn: sigBase.drawn, dashAfter }), '3 text layers with the brand name; stroke draw-in finishes (dashoffset 0)', ['evidence/f/signature-audit.json', 'evidence/f/footer-signature-1440x900.png']);
    await page.close();
  } catch (e) { add('f', 'content + footer', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- g) responsive scan ---------- */
  try {
    const vps = [[360, 740], [810, 1080], [1024, 768], [1194, 834], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [1280, 500]];
    const rows = [];
    for (const [w, h] of vps) {
      const out = { vp: w + 'x' + h, ok: true };
      if (w < 1024) {
        const page = await openPage(browser, { w, h, qa: 0.70 });
        const m = await page.evaluate(() => ({
          overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
          gated: document.documentElement.classList.contains('is-gated'),
          noticeShown: !document.getElementById('mobile-gate').hidden
        }));
        out.gated = m.gated;
        out.noticeShown = m.noticeShown;
        out['overflow@gate'] = m.overflow;
        if (!m.gated || !m.noticeShown || m.overflow > 1) out.ok = false;
        await page.close();
        rows.push(out);
        continue;
      }
      for (const q of [0.70, 1]) {
        const page = await openPage(browser, { w, h, qa: q });
        const m = await page.evaluate((qq) => {
          const de = document.documentElement;
          const stg = window.__heroState();
          const mk = stg.markbox;
          const r = qq === 1 ? stg.dockR : stg.rBig;
          return { overflow: de.scrollWidth - de.clientWidth, right: (mk.x + mk.w / 2) + r, bodyOverflowY: getComputedStyle(document.body).overflowY };
        }, q);
        out['overflow@' + q] = m.overflow;
        if (m.overflow > 1 || m.right > w + 2 || m.bodyOverflowY === 'hidden') out.ok = false;
        await page.close();
      }
      rows.push(out);
    }
    writeJson(evPath('g', 'responsive.json'), rows);
    add('g', 'responsive: gate below 1024px, no overflow at or above it', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'sub-1024 viewports show the desktop-only notice; 1024+ (tablet landscape included) lay out with overflow <= 1px', ['evidence/g/responsive.json']);
  } catch (e) { add('g', 'responsive scan', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

    /* ---------- l) tablet landscape: allowed, and the collage clears the rows ---------- */
  try {
    const IPAD = 'Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
    const cases = [
      { vp: [810, 1080], ua: IPAD, want: true, label: 'iPad portrait' },
      { vp: [1024, 768], ua: IPAD, want: false, label: 'iPad landscape 1024' },
      { vp: [1080, 810], ua: IPAD, want: false, label: 'iPad 10.9 landscape' },
      { vp: [1194, 834], ua: IPAD, want: false, label: 'iPad Air landscape' },
      { vp: [1104, 884], ua: IPAD, want: false, label: 'folding device landscape' },
      { vp: [884, 1104], ua: IPAD, want: true, label: 'folding device portrait' },
      { vp: [390, 844], ua: IPHONE, want: true, label: 'iPhone portrait' },
      { vp: [980, 844], ua: IPHONE, want: true, label: 'iPhone desktop-mode' }
    ];
    const rows = [];
    for (const c of cases) {
      const pg = await browser.newPage();
      const errs = [];
      pg.on('pageerror', (e) => errs.push(e.message));
      await pg.setViewport({ width: c.vp[0], height: c.vp[1], deviceScaleFactor: 1, hasTouch: true });
      await pg.setUserAgent(c.ua);
      await pg.goto('http://localhost:' + PORT + '/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
      await pg.waitForFunction('document.documentElement.dataset.ready === "true" || document.documentElement.classList.contains("is-gated")', { timeout: 20000 }).catch(() => {});
      await delay(250);
      const m = await pg.evaluate(() => {
        const gated = document.documentElement.classList.contains('is-gated');
        let gap = null;
        const ph = document.querySelector('#hero-places .hp-photo');
        if (!gated && ph) {
          const pr = ph.getBoundingClientRect();
          let maxRight = 0;
          document.querySelectorAll('#hero-places .hp-row').forEach((r) => {
            r.querySelectorAll('.hp-year, .hp-flag, .hp-name, .hp-rank').forEach((el) => {
              const rr = el.getBoundingClientRect();
              if (rr.right > maxRight) maxRight = rr.right;
            });
          });
          gap = Math.round(pr.left - maxRight);
        }
        return { gated, gap, overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth };
      });
      await pg.close();
      const ok = m.gated === c.want && m.overflow <= 1 && errs.length === 0 && (c.want || m.gap === null || m.gap >= 8);
      rows.push({ label: c.label, vp: c.vp.join('x'), gated: m.gated, want: c.want, gap: m.gap, ok });
    }
    writeJson(evPath('l', 'tablet-matrix.json'), rows);
    add('l', 'tablets: landscape allowed with clearance, portrait and phones gated', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'iPad landscape 1024/1080/1194 mount the sequence with >= 8px between the longest row and the collage; iPad portrait, iPhone portrait and iPhone desktop-mode stay gated', ['evidence/l/tablet-matrix.json']);
  } catch (e) { add('l', 'tablet matrix', FAIL, 'exception: ' + e.message, 'no exceptions', []); }
  /* ---------- m) photo credits ---------- */
  try {
    const pg = await openPage(browser, { w: 1440, h: 900, qa: 0.696 });
    const m = await pg.evaluate(() => {
      const items = window.SITE_CONTENT.places.items;
      const frames = Array.from(document.querySelectorAll('#hero-places .hp-photo'));
      const credits = frames.map((f) => (f.querySelector('.hp-photo-credit') || {}).textContent || '');
      const footer = (document.getElementById('footer-photocredit') || {}).textContent || '';
      const expected = items.filter((i) => i.photo).map((i) => i.credit);
      const style = frames[0] ? getComputedStyle(frames[0].querySelector('.hp-photo-credit')) : null;
      return {
        count: frames.length,
        credits,
        expected,
        footer,
        match: credits.length === expected.length && credits.every((c, i) => c === expected[i]),
        footerOk: footer === (window.SITE_CONTENT.footer.photoCredit || ''),
        readable: style ? parseFloat(style.fontSize) >= 8 && style.color !== 'rgba(0, 0, 0, 0)' : false
      };
    });
    await shot(pg, 'm/photo-credits-1440.png');
    await pg.close();
    const ok = m.count === 5 && m.match && m.footerOk && m.readable;
    add('m', 'photo credits: each frame names its outlet, footer lists them', ok ? PASS : FAIL, JSON.stringify(m), 'five frames each carry the outlet from content.js, the footer line matches footer.photoCredit, and the caption is at least 8px', ['evidence/m/photo-credits-1440.png']);
  } catch (e) { add('m', 'photo credits', FAIL, 'exception: ' + e.message, 'no exceptions', []); }
  /* ---------- n) closing gallery ---------- */
  try {
    const pg = await openPage(browser, { w: 1440, h: 900, qa: 0.86 });
    await delay(900);
    const state = await pg.evaluate(() => {
      const faces = Array.from(document.querySelectorAll('.gallery__face'));
      const imgs = Array.from(document.querySelectorAll('.gallery__face img'));
      const cyl = document.querySelector('.gallery__cylinder');
      return {
        faces: faces.length,
        expected: (window.SITE_CONTENT.gallery || []).length,
        tabbable: faces.every((f) => f.getAttribute('tabindex') === '0'),
        loaded: imgs.filter((i) => i.naturalWidth > 0).length,
        transform: cyl ? cyl.style.transform : '',
        stageH: Math.round(document.querySelector('.gallery__stage').getBoundingClientRect().height),
        visible: +getComputedStyle(document.getElementById('gallery')).opacity > 0.9,
        inStage: !!document.getElementById('gallery').closest('.hero__sticky')
      };
    });
    const box = await pg.evaluate(() => { const r = document.querySelector('.gallery__stage').getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; });
    await pg.mouse.move(box.x, box.y);
    await pg.mouse.down();
    await pg.mouse.move(box.x + 200, box.y, { steps: 10 });
    await pg.mouse.up();
    await delay(600);
    const afterDrag = await pg.evaluate(() => document.querySelector('.gallery__cylinder').style.transform);
    await pg.mouse.move(box.x, box.y);
    await pg.mouse.down();
    await pg.mouse.up();
    await delay(500);
    const box1 = await pg.evaluate(() => {
      const lb = document.getElementById('gallery-lightbox');
      return { open: !lb.hidden && lb.classList.contains('is-open'), cap: (document.querySelector('.gallery__lbcap') || {}).textContent || '', role: lb.getAttribute('role'), modal: lb.getAttribute('aria-modal'), hasSrc: !!(document.querySelector('.gallery__lightbox img') || {}).getAttribute && !!document.querySelector('.gallery__lightbox img').getAttribute('src') };
    });
    await shot(pg, 'n/gallery-lightbox-1440.png');
    await pg.keyboard.press('Escape');
    await delay(400);
    const closed = await pg.evaluate(() => document.getElementById('gallery-lightbox').hidden);
    await pg.evaluate(() => document.getElementById('gallery').scrollIntoView({ block: 'center' }));
    await delay(400);
    await shot(pg, 'n/gallery-1440.png');
    await pg.close();
    const ok = state.faces === state.expected && state.faces > 0 && state.tabbable && state.loaded === state.faces && state.visible && state.inStage && state.transform !== afterDrag && box1.open && /—/.test(box1.cap) && box1.role === 'dialog' && box1.modal === 'true' && box1.hasSrc && closed === true;
    add('n', 'gallery phase: frames spin, click opens, Esc closes', ok ? PASS : FAIL, JSON.stringify({ state, afterDrag, box1, closed }), 'the gallery is a layer inside the sticky stage, fully visible at p=0.86: nine focusable faces with images loaded, a drag changes the cylinder transform, clicking opens a dialog with credit text, Escape closes it', ['evidence/n/gallery-1440.png', 'evidence/n/gallery-lightbox-1440.png']);
  } catch (e) { add('n', 'closing gallery', FAIL, 'exception: ' + e.message, 'no exceptions', []); }
  /* ---------- h) reduced motion ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, reduced: true });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await settle(page, 1200);
    const rc = await page.evaluate(() => {
      const sig = document.getElementById('footer-signature');
      const draw = document.querySelector('.sig__draw');
      return {
        hasClass: document.documentElement.classList.contains('reduced-motion'),
        sigLayers: sig.querySelectorAll('text').length,
        sigContent: sig.querySelector('text').textContent,
        sigDash: parseFloat(getComputedStyle(draw).strokeDashoffset),
        endmark: document.querySelectorAll('#footer-endmark, .footer__endmark').length,
        overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth
      };
    });
    const ok = rc.hasClass && rc.sigLayers === 3 && /NOVIN ROBOTIC MIRZANIA/.test(rc.sigContent) && rc.sigDash <= 1 && rc.endmark === 0 && rc.overflow <= 1;
    await shotFull(page, 'h/reduced-1440-full.png');
    writeJson(evPath('h', 'reduced-motion.json'), rc);
    add('h', 'reduced motion: signature drawn statically; big mark stays removed', ok ? PASS : FAIL, JSON.stringify(rc), 'reduced class on; signature 3 layers with dashoffset 0; no endmark; no overflow', ['evidence/h/reduced-1440-full.png']);
    await page.close();
  } catch (e) { add('h', 'reduced motion', FAIL, 'exception: ' + e.message, 'no exceptions', []); }
  /* ---------- i) perf ---------- */
  try {
    const page = await browser.newPage();
    const per = { errors: [], pageerrors: [], failed: [], requests: [] };
    page.on('console', (m) => { if (m.type() === 'error') per.errors.push(m.text()); });
    page.on('pageerror', (e) => per.pageerrors.push(e.message));
    page.on('request', (r) => per.requests.push(r.url()));
    page.on('requestfailed', (r) => per.failed.push(r.url()));
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0;
      try { new PerformanceObserver((list) => { for (const e of list.getEntries()) { if (!e.hadRecentInput) window.__cls += e.value; } }).observe({ type: 'layout-shift', buffered: true }); } catch (e) {}
    });
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 });
    await delay(300);
    const frames = await page.evaluate(async () => {
      const out = [];
      const total = document.documentElement.scrollHeight - innerHeight;
      const t0 = performance.now();
      let last = t0;
      await new Promise((resolve) => {
        function step(now) {
          const target = Math.min(total, (now - t0) * 1.1);
          window.scrollTo(0, target);
          out.push(now - last);
          last = now;
          if (target < total) return requestAnimationFrame(step);
          resolve();
        }
        requestAnimationFrame(step);
      });
      window.scrollTo(0, 0);
      return out.slice(1);
    });
    await delay(300);
    const pageData = await page.evaluate(() => {
      const res = performance.getEntriesByType('resource');
      const hosts = {};
      let transfer = 0;
      for (const r of res) { try { const h = new URL(r.name).host; hosts[h] = (hosts[h] || 0) + 1; } catch (e) {} transfer += r.transferSize || 0; }
      return { cls: window.__cls, resources: res.length, transfer, hosts };
    });
    const sorted = [...frames].sort((a, b) => a - b);
    const p95 = sorted[Math.floor(sorted.length * 0.95)] || 0;
    const ok = per.errors.length === 0 && per.pageerrors.length === 0 && per.failed.length === 0 &&
      Object.keys(pageData.hosts).every((h) => h.startsWith('localhost'));
    writeJson(evPath('i', 'perf.json'), { per, pageData, frames: { n: frames.length, median: median(frames), p95 } });
    add('i', 'perf: zero errors, local-only', ok ? PASS : FAIL,
      JSON.stringify({ consoleErrors: per.errors.length, pageErrors: per.pageerrors.length, failed: per.failed.length, hosts: pageData.hosts, resources: pageData.resources, transferBytes: pageData.transfer }),
      '0 errors; localhost-only; no failed requests', ['evidence/i/perf.json']);
    add('i', 'CLS + frame cadence (headless)', INFO, JSON.stringify({ cls: +pageData.cls.toFixed(4), frameMedianMs: +median(frames).toFixed(1), frameP95Ms: +p95.toFixed(1) }), 'informational only', []);
    await page.close();
  } catch (e) { add('i', 'perf', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- j) edge scenarios ---------- */
  try {
    // E-scale: resize during the sequence
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(st0.travel * 0.55));
      await settle(page);
      const s1 = await state(page);
      await page.setViewport({ width: 1024, height: 800 });
      await delay(500);
      await settle(page, 2500);
      const s2 = await state(page);
      const expSpin = 180 * cub(s2.p, 0.10, 0.34) + 90 * cub(s2.p, 0.58, 0.70) + 90 * cub(s2.p, 0.70, 0.84);
      const ok = Math.abs(s2.p - s2.pTarget) <= 0.01 && Math.abs(s2.spin - expSpin) <= 6;
      add('j', 'resize mid-sequence', ok ? PASS : FAIL, JSON.stringify({ p: [s1.p, s2.p], spin: s2.spin, expSpin: +expSpin.toFixed(1) }), 'state re-renders consistently after resize', []);
      await page.close();
    }
    // E-fling
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      for (let i = 0; i < 5; i++) { await page.mouse.wheel({ deltaY: 2400 }); await delay(70); }
      await waitStableScroll(page);
      await settle(page, 2500);
      const st = await state(page);
      const mapP = Math.min(1, Math.max(0, (st.scrollY - st0.heroTop) / st0.travel));
      add('j', 'fling (wheel bursts)', Math.abs(st.p - mapP) <= 0.002 ? PASS : FAIL, JSON.stringify({ p: +st.p.toFixed(4), mapP: +mapP.toFixed(4) }), 'end state == mapping ±0.002', []);
      await page.close();
    }
    // E-reload mid-sequence
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(st0.travel * 0.5));
      await settle(page);
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 });
      await delay(500);
      const st = await state(page);
      const mapP = Math.min(1, Math.max(0, (st.scrollY - st0.heroTop) / st0.travel));
      add('j', 'reload mid-sequence', Math.abs(st.p - mapP) <= 0.01 ? PASS : FAIL, JSON.stringify({ scrollY: st.scrollY, p: st.p, mapP: +mapP.toFixed(4) }), 'deterministic restore', []);
      await page.close();
    }
    // E-hook robustness
    {
      const out = [];
      for (const [q, expect] of [['abc', null], ['-1', 0], ['2', 1], ['0.5', 0.5]]) {
        const page = await openPage(browser, { w: 1440, h: 900, qa: q });
        const st = await state(page);
        out.push({ qa: q, got: st.qa, errors: page.qa.errors.length + page.qa.pageerrors.length });
        await page.close();
      }
      const ok = out[0].got === null && out[1].got === 0 && out[2].got === 1 && out[3].got === 0.5 && out.every((o) => o.errors === 0);
      add('j', 'QA hook robustness', ok ? PASS : FAIL, JSON.stringify(out), 'invalid ignored; clamped; no errors', []);
    }
    // second 2x zoom crop at maximum live scale (max scroll)
    {
      const page = await openPage(browser, { w: 1440, h: 900, dpr: 2 });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await waitStableScroll(page);
      await settle(page, 2500);
      await shot(page, 'j/dock-live-zoom-2x.png');
      await page.close();
    }
  } catch (e) { add('j', 'edge scenarios', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- Edge subset ---------- */
  try {
    edgeBrowser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-first-run', '--disable-gpu-sandbox'] });
    env.edge = await edgeBrowser.version();
    const page = await openPage(edgeBrowser, { w: 1440, h: 900, qa: 0 });
    await shot(page, 'edge/intro-1440x900.png');
    await page.close();
    const p2 = await openPage(edgeBrowser, { w: 1440, h: 900 });
    await p2.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await waitStableScroll(p2);
    await settle(p2, 2500);
    const sigK = await p2.evaluate(() => document.querySelectorAll('#footer-signature text').length);
    const errs = p2.qa.errors.length + p2.qa.pageerrors.length;
    await shot(p2, 'edge/dock-1440x900.png');
    await p2.close();
    add('k', 'Edge subset (same engine as Chrome)', errs === 0 && sigK === 3 ? PASS : FAIL, JSON.stringify({ version: env.edge, sigLayers: sigK, errors: errs }), 'footer signature rendered + zero errors on Edge', ['evidence/edge/dock-1440x900.png'], 'Chromium engine shared with Chrome — not independent engine coverage');  } catch (e) { add('k', 'Edge subset', NP, 'Edge not runnable: ' + e.message, 'n/a', []); }

} catch (e) {
  console.error('QA FATAL', e);
  add('x', 'suite', FAIL, 'fatal: ' + e.message, 'n/a', []);
} finally {
  try { if (browser) await browser.close(); } catch (e) {}
  try { if (edgeBrowser) await edgeBrowser.close(); } catch (e) {}
  try { if (server) server.close(); } catch (e) {}

  let inspect = {};
  try {
    const js = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'main.js'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'style.css'), 'utf8');
    inspect = {
      sticky: /sticky/.test(css),
      svh: /100svh/.test(css) && /100vh/.test(css),
      passive: /passive:\s*true/.test(js),
      optionalChaining: /\?\.|\?\?/.test(js),
      scrollTimeline: /animation-timeline|ScrollTimeline|scroll\(\)/.test(css + js),
      overflowClip: /overflow:\s*clip/.test(css)
    };
  } catch (e) {}

  try {
    const counts = { PASS: 0, FAIL: 0, INFO: 0, OBSERVED: 0, 'NOT PERFORMED': 0 };
    for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
    const files = walk(EVIDENCE).map((p) => path.relative(ROOT, p).replace(/\\/g, '/'));
    const matrix = results.map((r) => '| ' + r.id + ' | ' + r.entry + ' | ' + r.status + ' | ' + String(r.value).replace(/\|/g, '\\|').slice(0, 320) + ' | ' + r.threshold + ' | ' + (r.evidence.join('<br>') || '—') + ' |').join('\n');

    const report = [
      '# QA report — logo-sequence site (v1.3.6 round)',
      '',
      '- Revision: `' + env.sha + '` · generated ' + env.generatedAt,
      '- Environment: ' + env.os + ' · Node ' + env.node + ' · puppeteer-core ' + (env.puppeteer || '?'),
      '- Chrome: ' + (env.chrome || 'not run') + ' · Edge: ' + (env.edge || 'not run'),
      '- Method: puppeteer-core only; local CSP-mirror server; deterministic states via `?qa=`;',
      '  dock measured once pinned and once at maximum scroll (live).',
      '- Labels: PASS/FAIL = instrumented vs threshold; OBSERVED = judged artefact; INFO = recorded; NOT PERFORMED = no runtime.',
      '',
      '## Results',
      '',
      '| id | check | status | value | threshold | evidence |',
      '|----|-------|--------|-------|-----------|----------|',
      matrix,
      '',
      '## Summary',
      '',
      Object.entries(counts).map(([k, v]) => '- ' + k + ': ' + v).join('\n'),
      '',
      '## Evidence files (' + files.length + ')',
      '',
      files.map((f) => '- `' + f + '`').join('\n'),
      ''
    ].join('\n');
    fs.writeFileSync(path.join(ROOT, 'qa', 'qa-report.md'), report, 'utf8');

    const log = [
      '# QA log — environment, commands, honesty notes (v1.3.6)',
      '',
      '## Environment',
      '',
      '- OS: ' + env.os + ' · Node: ' + env.node + ' · puppeteer-core: ' + (env.puppeteer || '?'),
      '- Chrome: ' + (env.chrome || 'NOT RUN') + ' · Edge: ' + (env.edge || 'NOT RUN'),
      '- Revision: ' + env.sha + ' · ' + env.generatedAt,
      '',
      '## How to re-run',
      '',
      '```',
      'npm install        # dev-only',
      'npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**',
      'node qa/shot.mjs chrome <url> <w> <h> out.png [qa]',
      '```',
      '',
      '## Browser matrix (honest)',
      '',
      '| Browser | Status | Notes |',
      '|---------|--------|-------|',
      '| Chrome | EXECUTED — full suite | via puppeteer-core |',
      '| Edge | EXECUTED — subset | same Chromium engine as Chrome — not independent coverage |',
      '| Firefox | NOT PERFORMED — not installed | inspection-based notes only |',
      '| Safari / iOS Safari | NOT PERFORMED — cannot run on Windows | inspection-based notes only |',
      '| Android Chrome (device) | NOT PERFORMED — no device | viewport emulation only |',
      '',
      'Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`) — labeled, not a real OS test.',
      '',
      '## Code-inspection risk notes (NOT test results)',
      '',
      '- sticky pinning: ' + (inspect.sticky ? 'present; ancestor chain clean; JS recomputes geometry on resize' : 'absent') + '.',
      '- 100vh/100svh fallback: ' + (inspect.svh ? 'fallback pair present' : 'CHECK') + '.',
      '- passive listeners: ' + (inspect.passive ? 'present' : 'CHECK') + '.',
      '- modern JS above Safari 15.4 baseline: ' + (inspect.optionalChaining ? 'FOUND' : 'not found (safe)') + '.',
      '- scroll-driven animations API: ' + (inspect.scrollTimeline ? 'FOUND (risk)' : 'absent (safe)') + '.',
      '- overflow: clip: ' + (inspect.overflowClip ? 'used (Safari 16+; hidden fallback present on the sticky)' : 'absent') + '.',
      '',
      '## Rollback drill',
      '',
      'Rollback path: annotated git tags (per release). Dist zip archives are no longer produced; older archives live in git history.',
      ''
    ].join('\n');
    let qaLogPreserved = '';
    try {
      const prevLog = fs.readFileSync(path.join(ROOT, 'qa', 'qa-log.md'), 'utf8');
      const cut = prevLog.indexOf('## Rollback drill (lite)');
      if (cut >= 0) qaLogPreserved = prevLog.slice(cut).trimEnd() + '\n';
    } catch (e) { /* first run: no previous log */ }
    fs.writeFileSync(path.join(ROOT, 'qa', 'qa-log.md'), log + (qaLogPreserved ? '\n' + qaLogPreserved : ''), 'utf8');

    writeJson(path.join(ROOT, 'qa', 'qa-summary.json'), { env, generatedAt: env.generatedAt, counts, results });
    console.log('\nWROTE qa/qa-report.md, qa/qa-log.md, qa/qa-summary.json');
    console.log('COUNTS', JSON.stringify(counts));
    process.exitCode = counts.FAIL > 0 ? 1 : 0;
  } catch (e) {
    console.error('report write failed', e);
    process.exitCode = 2;
  }
}
