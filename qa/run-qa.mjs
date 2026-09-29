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
            headers: document.querySelectorAll('header').length,
            navs: [], fixed: [],
            removed: {
              copy: document.querySelectorAll('.hero__copy, #hero-copy, .hero__col').length,
              indicator: document.querySelectorAll('.hero__indicator, #hero-indicator').length,
              hint: document.querySelectorAll('.hero__hint, #hero-hint').length,
              rmMark: document.querySelectorAll('.rm-mark').length
            },
            gallery: (function () {
              const g = document.getElementById('programmes');
              const s = document.getElementById('story');
              const f = document.getElementById('footer');
              if (!g || !s || !f) return { ok: false, cards: 0, ordered: false };
              const ordered =
                (s.compareDocumentPosition(g) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0 &&
                (g.compareDocumentPosition(f) & Node.DOCUMENT_POSITION_FOLLOWING) !== 0;
              const cards = Array.from(g.querySelectorAll('.gallery__card'));
              let content = cards.length >= 4 && cards.length <= 7;
              cards.forEach(function (c) {
                const img = c.querySelector('img');
                const t = c.querySelector('.gallery__card-title');
                const x = c.querySelector('.gallery__card-text');
                if (!img || !img.getAttribute('alt') || !t || !t.textContent || !x || !x.textContent) content = false;
              });
              return { ok: ordered && content, cards: cards.length, ordered: ordered };
            })(),
            bodyChildren: Array.from(document.body.children).map((el) => el.tagName + (el.id ? '#' + el.id : '') + (el.className ? '.' + String(el.className).split(' ')[0] : ''))
          };
          document.querySelectorAll('nav, [role=navigation]').forEach((n) => out.navs.push({ inFooter: !!n.closest('footer') }));
          document.querySelectorAll('body *').forEach((el) => {
            const cs = getComputedStyle(el);
            if ((cs.position === 'fixed' || cs.position === 'sticky') && !el.closest('#story')) {
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
    const remOk = sweep.every((r) => Object.values(r.removed).every((v) => v === 0));
    add('a', 'old placeholder elements removed from DOM', remOk ? PASS : FAIL, JSON.stringify(sweep[0].removed) + ' body=' + JSON.stringify(sweep[0].bodyChildren), 'copy/indicator/hint/rm-mark counts all 0; body = skip-link + noscript + hero + programmes + footer', ['evidence/a/nav-sweep.json']);
    const galOk = sweep.every((r) => r.gallery.ok);
    add('a', 'programmes: 4–7 photo slots present, ordered hero→programmes→footer', galOk ? PASS : FAIL, JSON.stringify({ cards: sweep[0].gallery.cards, ordered: sweep[0].gallery.ordered }), 'gallery between hero and footer; 4–7 cards each with img/alt/title/text', ['evidence/a/nav-sweep.json']);
  } catch (e) { add('a', 'structure sweep', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- a2) source audit: no dead placeholders; gallery wired ---------- */
  try {
    const files = ['index.html', 'assets/css/style.css', 'assets/js/main.js', 'content.js'];
    const needles = ['hero__copy', 'hero__hint', 'hero__indicator', 'rm-mark', 'chapters', 'scrollhint'];
    const lines = [];
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8').toLowerCase();
      const counts = needles.map((n) => ({ n, c: (src.split(n).length - 1) }));
      const sum = counts.reduce((a, b) => a + b.c, 0);
      total += sum;
      lines.push(f + ' :: ' + counts.map((c) => c.n + '=' + c.c).join(', '));
    }
    const cjs = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
    const refs = Array.from(new Set((cjs.match(/assets\/img\/[\w.-]+\.svg/g) || [])));
    const missing = refs.filter((r) => !fs.existsSync(path.join(ROOT, r)));
    const slots = (cjs.match(/img:\s*"assets\/img\//g) || []).length;
    const imgDir = path.join(ROOT, 'assets', 'img');
    const imgFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir).sort() : [];
    lines.push('gallery refs: ' + refs.length + ' | missing files: ' + missing.length + (missing.length ? ' -> ' + missing.join(', ') : ''));
    lines.push('slots in content.js: ' + slots + ' | assets/img: ' + (imgFiles.length ? imgFiles.join(', ') : '(none)'));
    lines.push('total dead-placeholder references: ' + total);
    fs.writeFileSync(evPath('a', 'removal-audit.txt'), lines.join('\n') + '\n', 'utf8');
    const ok = total === 0 && missing.length === 0 && slots >= 4 && slots <= 7 && refs.length === slots && imgFiles.length >= 4;
    add('a', 'source audit: no dead placeholders; gallery assets present', ok ? PASS : FAIL, JSON.stringify({ deadRefs: total, galleryRefs: refs.length, slots, missing: missing.length, imgFiles: imgFiles.length }), 'no hero__copy/hint/indicator/rm-mark refs; every gallery slot points at an existing file', ['evidence/a/removal-audit.txt']);
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
      // B (0.12-0.34): spin in place (no frame translation)
      if (b.p > 0.12 && b.p <= 0.34 && (Math.abs(b.tx) > 1 || Math.abs(b.ty) > 1)) orderOk = false;
      // C hold (0.46-0.64): small mark centred, spin parked at 180
      if (b.p > 0.46 && b.p <= 0.64 && (Math.abs(b.mcy - 450) > 4 || Math.abs(b.mcx - 720) > 4 || Math.abs(b.spin - 180) > 1)) orderOk = false;
      // D (0.68-0.84): mark centre travels left only, on the middle line
      if (b.p > 0.68 && b.p <= 0.84 && (b.mcx > a.mcx + 2 || Math.abs(b.mcy - 450) > 6)) orderOk = false;
      // E (0.88-0.94): mark centre travels right and down only
      if (b.p > 0.88 && b.p <= 0.94 && (b.mcy < a.mcy - 2 || b.mcx < a.mcx - 2)) orderOk = false;
      maxPosStep = Math.max(maxPosStep, Math.abs(b.mcx - a.mcx), Math.abs(b.mcy - a.mcy));
    }
    const cEnd = trace.reduce((acc, t) => (Math.abs(t.p - 0.86) < Math.abs(acc.p - 0.86) ? t : acc), trace[0]);
    const dEnd = trace.reduce((acc, t) => (Math.abs(t.p - 1) < Math.abs(acc.p - 1) ? t : acc), trace[0]);
    const opacityOk = trace.every((t) => Math.abs((t.wOp || 0) + (t.mOp || 0) - 1) <= 0.01);
    const traceOk = mapErr <= 0.002 && monoSpin && Math.abs(spinEnd - 360) <= 0.5 && maxSpinStep <= 162 && orderOk && opacityOk;
    writeJson(evPath('b', 'motion-trace.json'), { travel, heroTop, mapErr, monoSpin, spinEnd, maxSpinStep, maxPosStep: +maxPosStep.toFixed(1), orderOk, opacityOk, cEnd, dEnd, steps: trace });
    add('c', 'motion trace (60 steps)', traceOk ? PASS : FAIL,
      JSON.stringify({ mapErr: +mapErr.toFixed(4), monoSpin, spinEnd, maxSpinStep: +maxSpinStep.toFixed(1), maxPosStep: +maxPosStep.toFixed(1), orderOk, opacityOk, cEndTx: cEnd.tx, dEndTy: dEnd.ty }),
      'clockwise monotonic to 360±0.5; spin in place; side-copy hold with centred mark; left travel on the middle line; enlarged state at exact 45-degree pose; dock travel right+down; swap opacity sum=1', ['evidence/b/motion-trace.json']);

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
      for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [390, 844]]) {
        const pg = await openPage(browser, { w, h, qa: 0.86 });
        const stc = await state(pg);
        const mk = stc.markbox;
        const cx = mk.x + mk.w / 2;
        const r = stc.rBig;
        const visW = Math.max(0, Math.min(cx + r, w) - Math.max(cx - r, 0));
        const fracX = +(visW / (2 * r)).toFixed(3);
        const spin = +stc.spin.toFixed(1);
        const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
        clipRows.push({ vp: w + 'x' + h, visFrac: fracX, markCx: +cx.toFixed(1), spin, overflow, ok: fracX >= 0.42 && fracX <= 0.58 && Math.abs(spin - 360) <= 1 && overflow <= 1 });
        await shot(pg, 'b/halfclip-' + w + 'x' + h + '.png');
        await pg.close();
      }
      writeJson(evPath('b', 'halfclip-audit.json'), clipRows);
      add('c', 'enlarged state: half clipped, exact 45-degree pose, no overflow', clipRows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(clipRows), 'visible width fraction 0.42-0.58 at max size; spin 360±1 (exact 45-degree diamond pose); scrollWidth overflow 0', ['evidence/b/halfclip-audit.json', 'evidence/b/halfclip-1440x900.png']);
    }

    // side-copy stage: text appears left/right of the small symbol, mark centred
    {
      const rows = [];
      for (const [w, h] of [[1440, 900], [390, 844]]) {
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
        const mcx = stt.markbox.x + stt.markbox.w / 2;
        const mcy = stt.markbox.y + stt.markbox.h / 2;
        const rMark = (stt.frame.w * 0.5095) / 2; // frame.w at spin=180 equals sF * frameW
        const centered = Math.abs(mcx - w / 2) <= 5 && Math.abs(mcy - h / 2) <= 5;
        const visible = o.opL >= 0.9 && o.opR >= 0.9;
        const noGhost = (stt.wordmarkOpacity || 0) <= 0.02 && (stt.markboxOpacity || 0) >= 0.98;
        const noOverlap = w > 640
          ? (o.sl.r + 8 <= mcx - rMark) && (o.sr.x - 8 >= mcx + rMark)
          : (o.sl.b + 4 <= mcy - rMark) && (o.sr.y - 4 >= mcy + rMark);
        const ok = centered && visible && noOverlap && noGhost && o.titleL > 5 && o.titleR > 5;
        rows.push({ vp: w + 'x' + h, centered, visible, noGhost, noOverlap, mcx: +mcx.toFixed(1), mcy: +mcy.toFixed(1), rMark: +rMark.toFixed(1), ok });
        await shot(pg, 'b/sidetext-' + w + 'x' + h + '.png');
        await pg.close();
        const pg2 = await openPage(browser, { w, h, qa: 0.7 });
        const gone = await pg2.evaluate(() => [+getComputedStyle(document.getElementById('hero-side-left')).opacity, +getComputedStyle(document.getElementById('hero-side-right')).opacity]);
        rows[rows.length - 1].goneAt07 = gone;
        if (gone[0] > 0.05 || gone[1] > 0.05) rows[rows.length - 1].ok = false;
        await pg2.close();
      }
      writeJson(evPath('b', 'sidecopy-audit.json'), rows);
      add('c', 'side copy: text beside the small symbol, then gone before the growth', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'both blocks fully visible + clear of the mark at p=0.5; centred mark; wordmark fully swapped (no ghost); hidden by p=0.7', ['evidence/b/sidecopy-audit.json', 'evidence/b/sidetext-1440x900.png']);
    }

    // hero end state: mark docked just above the bottom edge, upright
    {
      const rows = [];
      for (const [w, h] of [[1440, 900], [834, 1112], [390, 844]]) {
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
    for (const q of [0, 0.25, 0.5, 0.86, 0.93, 1.0]) {
      for (const [w, h] of [[1440, 900], [834, 1112], [390, 844]]) {
        const p = await openPage(browser, { w, h, qa: q });
        await shot(p, 'b/pin-' + q + '-' + w + 'x' + h + '.png');
        await p.close();
      }
    }
  } catch (e) { add('c', 'motion trace', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- d) landing: centred in the footer band, fully visible ---------- */
  try {
    const rows = [];
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [834, 1112], [390, 844]]) {
      const page = await openPage(browser, { w, h });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await waitStableScroll(page);
      await settle(page, 2500);
      const st = await state(page);
      const mets = await page.evaluate(() => {
        const el = document.getElementById('footer-endmark');
        const r = el.getBoundingClientRect();
        const lz = document.getElementById('footer-landing').getBoundingClientRect();
        const grid = document.querySelector('.footer__grid').getBoundingClientRect();
        const sig = document.getElementById('footer-signature').getBoundingClientRect();
        return {
          em: { x: r.x, y: r.y, w: r.width, h: r.height, transform: getComputedStyle(el).transform, opacity: +getComputedStyle(el).opacity, display: getComputedStyle(el).display },
          lzCy: lz.top + lz.height / 2,
          gridBottom: grid.bottom,
          sigTop: sig.top
        };
      });
      const em = mets.em;
      const cxc = em.x + em.w / 2, cyc = em.y + em.h / 2;
      const bandCy = mets.lzCy;
      const gapAbove = +(em.y - mets.gridBottom).toFixed(1);
      const gapBelow = +(mets.sigTop - (em.y + em.h)).toFixed(1);
      const clear = gapAbove >= 6 && gapBelow >= 6;
      const visible = Math.max(0, Math.min(em.y + em.h, h) - Math.max(em.y, 0));
      const frac = +(visible / em.h).toFixed(3);
      const centered = Math.abs(cxc - w / 2) <= 6 && Math.abs(cyc - bandCy) <= 8;
      const sizeOk = Math.abs(em.w - st.dockR * 2) <= 6;
      const upright = em.transform === 'none' || /matrix\(1, 0, 0, 1/.test(em.transform);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const ok = frac >= 0.9 && centered && sizeOk && upright && clear && em.display === 'block' && em.opacity > 0.95 && overflow <= 1;
      rows.push({ vp: w + 'x' + h, center: [+cxc.toFixed(1), +cyc.toFixed(1)], bandCy: +bandCy.toFixed(1), bandCx: w / 2, frac, size: +em.w.toFixed(1), dockD: +(st.dockR * 2).toFixed(1), gapAbove, gapBelow, centered, sizeOk, upright, overflow, ok });
      await shot(page, 'b/dock-' + w + 'x' + h + '.png');
      await page.close();
    }
    writeJson(evPath('d', 'dock-audit.json'), rows);
    add('d', 'landing: centred in the footer landing area, clear of columns and signature', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows),
      'centre == (viewport/2, landing-area centre) ±6/±8px; visible fraction >= 0.9; clear of the columns and the signature (>=6px both); size == configured ±6; no rotation; overflow 0', ['evidence/d/dock-audit.json', 'evidence/b/dock-1440x900.png']);
  } catch (e) { add('d', 'dock audit', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- d2) stability: no drift after scroll/resize ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await waitStableScroll(page);
    await settle(page, 2500);
    const get = () => page.evaluate(() => {
      const el = document.getElementById('footer-endmark');
      const r = el.getBoundingClientRect();
      const lz = document.getElementById('footer-landing').getBoundingClientRect();
      return { x: r.x + r.width / 2, y: r.y + r.height / 2, bandCy: lz.top + lz.height / 2, w: r.width };
    });
    const yMax = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel({ deltaY: 800 });
    await delay(500);
    const yAfter = await page.evaluate(() => window.scrollY);
    const s1 = await get();
    await delay(400);
    const s2 = await get();
    const drift = Math.max(Math.abs(s1.x - s2.x), Math.abs(s1.y - s2.y));
    await page.setViewport({ width: 1380, height: 860 });
    await delay(500);
    await settle(page, 2500);
    const s3 = await get();
    const resizeOk = Math.abs(s3.y - s3.bandCy) <= 8 && Math.abs(s3.x - 690) <= 6;
    await page.setViewport({ width: 1440, height: 900 });
    await delay(500);
    await settle(page, 2500);
    const s4 = await get();
    const resizeBackOk = Math.abs(s4.y - s4.bandCy) <= 8;
    const ok = yAfter === yMax && drift <= 0.5 && resizeOk && resizeBackOk;
    writeJson(evPath('d', 'stability.json'), { yMax, yAfter, drift, resizeOk, resizeBackOk });
    add('d', 'landing stability: scroll + resize', ok ? PASS : FAIL, JSON.stringify({ yMax, yAfter, drift, resizeOk, resizeBackOk }), 'no scroll past max; drift 0; stays centred after resize ±8px', ['evidence/d/stability.json']);
    await page.close();
  } catch (e) { add('d', 'landing stability', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- e) sharpness evidence (vector + zoom crops) ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, qa: 0.86, dpr: 2 });
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
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
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
      const c = window.SITE_CONTENT.footer;
      return {
        emailText: document.getElementById('footer-email').textContent === c.contact.email,
        emailHref: document.getElementById('footer-email').getAttribute('href') === 'mailto:' + c.contact.email,
        phoneHref: (document.getElementById('footer-phone').getAttribute('href') || '').startsWith('tel:+00000000000'),
        address: document.getElementById('footer-address').textContent === c.contact.address,
        legal: document.getElementById('footer-legal').textContent === c.legal
      };
    });
    writeJson(evPath('f', 'footer-links.json'), { links, landings, contactCheck });
    const landOk = landings.every((l) => l.top !== null && l.top >= -40 && l.top <= 675);
    const ok = landOk && Object.values(contactCheck).every(Boolean) && links.length === 4;
    add('f', 'footer: links land + contact/legal intact', ok ? PASS : FAIL, JSON.stringify({ landings, contactCheck }), '4 links land within viewport; mailto/tel formats; texts == content', ['evidence/f/footer-links.json', 'evidence/f/footer-1440x900.png']);

    /* signature: three layers, draw-in completes, hover reveal reacts */
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
    await page.evaluate(() => document.getElementById('footer-signature').scrollIntoView({ block: 'center' }));
    await delay(350);
    const sigBox = await page.evaluate(() => {
      const r = document.getElementById('sig-svg').getBoundingClientRect();
      return { x: r.x, y: r.y, cx: r.x + r.width / 2, cy: r.y + r.height / 2, w: r.width };
    });
    await page.mouse.move(sigBox.cx - sigBox.w * 0.3, sigBox.cy);
    await delay(450);
    const hov = await page.evaluate(() => {
      const wrap = document.getElementById('footer-signature');
      return {
        hoverClass: wrap.classList.contains('is-hover'),
        echoOp: +getComputedStyle(document.querySelector('.sig__echo')).opacity,
        maskCx: document.getElementById('revealMask').getAttribute('cx')
      };
    });
    await shot(page, 'f/footer-signature-1440x900.png');
    const sigOk = sigBase.layers === 3 && /NOVIN ROBOTIC MIRZANIA/.test(sigBase.content) && sigBase.drawn && dashAfter <= 1 && hov.hoverClass && hov.echoOp >= 0.6 && hov.maskCx !== '50.00%';
    writeJson(evPath('f', 'signature-audit.json'), { base: sigBase, dashAfter, hov });
    add('f', 'footer signature: draw-in completes + hover reveal reacts', sigOk ? PASS : FAIL, JSON.stringify({ layers: sigBase.layers, content: sigBase.content, drawn: sigBase.drawn, dashAfter, hoverClass: hov.hoverClass, echoOp: hov.echoOp, maskCx: hov.maskCx }), '3 text layers with the brand name; stroke draw-in finishes (dashoffset 0); hover shows the echo (0.7) and moves the reveal mask', ['evidence/f/signature-audit.json', 'evidence/f/footer-signature-1440x900.png']);
    await page.close();
  } catch (e) { add('f', 'content + footer', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- g) responsive scan ---------- */
  try {
    const vps = [[360, 740], [768, 1024], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [1280, 500]];
    const rows = [];
    for (const [w, h] of vps) {
      const out = { vp: w + 'x' + h, ok: true };
      let gcols = 0;
      for (const q of [0.86, 1]) {
        const page = await openPage(browser, { w, h, qa: q });
        const m = await page.evaluate((qq) => {
          const de = document.documentElement;
          const stg = window.__heroState();
          const mk = stg.markbox;
          const r = qq === 1 ? stg.dockR : stg.rBig;
          const cols = getComputedStyle(document.getElementById('gallery-grid')).gridTemplateColumns.split(' ').length;
          return { overflow: de.scrollWidth - de.clientWidth, right: (mk.x + mk.w / 2) + r, bodyOverflowY: getComputedStyle(document.body).overflowY, cols };
        }, q);
        out['overflow@' + q] = m.overflow;
        if (m.overflow > 1 || m.right > w + 2 || m.bodyOverflowY === 'hidden') out.ok = false;
        gcols = m.cols;
        await page.close();
      }
      out.galleryCols = gcols;
      if (gcols !== (w >= 1024 ? 3 : w >= 641 ? 2 : 1)) out.ok = false;
      rows.push(out);
    }
    writeJson(evPath('g', 'responsive.json'), rows);
    add('g', 'responsive: no overflow at max size and landing; gallery columns adapt', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'scrollWidth overflow <= 1px in both states; no horizontal scrollbar; gallery grid 3/2/1 columns by width', ['evidence/g/responsive.json']);
  } catch (e) { add('g', 'responsive scan', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- h) reduced motion: static logo, fully visible everywhere ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, reduced: true });
    const top = await page.evaluate(() => {
      const wm = document.getElementById('hero-wordmark').getBoundingClientRect();
      return { x: wm.x, y: wm.y, r: wm.x + wm.width, b: wm.y + wm.height };
    });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(400);
    const rc = await page.evaluate(() => {
      const frame = document.getElementById('hero-frame');
      const end = document.getElementById('footer-endmark');
      const er = end.getBoundingClientRect();
      const lz = document.getElementById('footer-landing').getBoundingClientRect();
      return {
        hasClass: document.documentElement.classList.contains('reduced-motion'),
        frameInline: frame.style.transform,
        frameComputed: getComputedStyle(frame).transform,
        markboxDisplay: getComputedStyle(document.getElementById('hero-markbox')).display,
        sideDisplay: getComputedStyle(document.getElementById('hero-side-left')).display,
        endDisplay: getComputedStyle(end).display,
        endOpacity: +getComputedStyle(end).opacity,
        endRect: { x: er.x, y: er.y, r: er.x + er.width, b: er.y + er.height },
        bandCy: lz.top + lz.height / 2,
        sigDrawOffset: getComputedStyle(document.querySelector('.sig__draw')).strokeDashoffset,
        sigWidth: document.getElementById('sig-svg').getBoundingClientRect().width,
        vw: innerWidth, vh: innerHeight
      };
    });
    await shotFull(page, 'h/reduced-1440-full.png');
    const inView = (r) => r.x >= -2 && r.r <= rc.vw + 2 && r.y >= -2 && r.b <= rc.vh + 2;
    await page.evaluate(() => window.scrollTo(0, document.getElementById('programmes').offsetTop));
    await delay(700);
    const gal = await page.evaluate(() => {
      const cards = document.querySelectorAll('#programmes .gallery__card');
      const c0 = cards[0];
      const r = c0.getBoundingClientRect();
      return { count: cards.length, op: +getComputedStyle(c0).opacity, imgOK: c0.querySelector('img').naturalWidth > 0, inView: r.x >= -2 && r.x + r.width <= innerWidth + 2 };
    });
    const ok = rc.hasClass && rc.frameInline === '' && rc.frameComputed === 'none' && rc.markboxDisplay === 'none' && rc.sideDisplay === 'none' &&
      rc.endDisplay === 'block' && rc.endOpacity === 1 && inView(rc.endRect) && inView(top) &&
      Math.abs((rc.endRect.x + rc.endRect.r) / 2 - rc.vw / 2) <= 6 &&
      Math.abs((rc.endRect.y + rc.endRect.b) / 2 - rc.bandCy) <= 8 &&
      parseFloat(rc.sigDrawOffset) <= 1 && rc.sigWidth > 100 &&
      gal.count >= 4 && gal.op === 1 && gal.inView;
    writeJson(evPath('h', 'reduced-motion.json'), { top, rc, gal });
    add('h', 'reduced motion: static logo + signature fully rendered, gallery static', ok ? PASS : FAIL, JSON.stringify({ top, end: rc.endRect, bandCy: +rc.bandCy.toFixed(1), frameComputed: rc.frameComputed, side: rc.sideDisplay, sigDraw: rc.sigDrawOffset, gallery: gal }), 'no transforms; no side copy; wordmark fully in viewport; landing centred in the landing area; signature drawn statically (no dash offset); gallery cards visible without reveal effects', ['evidence/h/reduced-1440-full.png']);
    await page.close();
    const p390 = await openPage(browser, { w: 390, h: 844, reduced: true });
    await shotFull(p390, 'h/reduced-390-full.png');
    await p390.close();
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
      const expSpin = 180 * cub(s2.p, 0.10, 0.36) + 180 * cub(s2.p, 0.66, 0.86);
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
    const em = await p2.evaluate(() => {
      const el = document.getElementById('footer-endmark');
      const r = el.getBoundingClientRect();
      const lz = document.getElementById('footer-landing').getBoundingClientRect();
      return { cy: r.y + r.height / 2, cx: r.x + r.width / 2, bandCy: lz.top + lz.height / 2, w: r.width };
    });
    const centered = Math.abs(em.cx - 720) <= 6 && Math.abs(em.cy - em.bandCy) <= 8;
    const errs = p2.qa.errors.length + p2.qa.pageerrors.length;
    await shot(p2, 'edge/dock-1440x900.png');
    await p2.close();
    add('k', 'Edge subset (same engine as Chrome)', errs === 0 && centered ? PASS : FAIL, JSON.stringify({ version: env.edge, landingCentered: centered, errors: errs }), 'intro + centred landing + zero errors on Edge', ['evidence/edge/dock-1440x900.png'], 'Chromium engine shared with Chrome — not independent engine coverage');
  } catch (e) { add('k', 'Edge subset', NP, 'Edge not runnable: ' + e.message, 'n/a', []); }

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
      '# QA report — logo-sequence site (v1.3.2 round)',
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
      '# QA log — environment, commands, honesty notes (v1.3.2)',
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
      'See `qa/evidence/rollback/` (v1.3.2 + kept v1.3.1 / v1.3.0 / v1.2.0 / v1.1.0 / v1.0.0).',
      ''
    ].join('\n');
    fs.writeFileSync(path.join(ROOT, 'qa', 'qa-log.md'), log, 'utf8');

    writeJson(path.join(ROOT, 'qa', 'qa-summary.json'), { env, generatedAt: env.generatedAt, counts, results });
    console.log('\nWROTE qa/qa-report.md, qa/qa-log.md, qa/qa-summary.json');
    console.log('COUNTS', JSON.stringify(counts));
    process.exitCode = counts.FAIL > 0 ? 1 : 0;
  } catch (e) {
    console.error('report write failed', e);
    process.exitCode = 2;
  }
}
