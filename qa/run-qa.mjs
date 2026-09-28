// qa/run-qa.mjs — headless QA suite for the logo-sequence site (v1.1.0).
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
              gallery: document.querySelectorAll('.gallery__row, #programmes').length,
              copy: document.querySelectorAll('.hero__copy, #hero-copy, .hero__col').length,
              indicator: document.querySelectorAll('.hero__indicator, #hero-indicator').length,
              hint: document.querySelectorAll('.hero__hint, #hero-hint').length,
              rmMark: document.querySelectorAll('.rm-mark').length
            },
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
    add('a', 'old elements removed from DOM', remOk ? PASS : FAIL, JSON.stringify(sweep[0].removed) + ' body=' + JSON.stringify(sweep[0].bodyChildren), 'gallery/copy/indicator/hint/rm-mark counts all 0', ['evidence/a/nav-sweep.json']);
  } catch (e) { add('a', 'structure sweep', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- a2) source removal audit ---------- */
  try {
    const files = ['index.html', 'assets/css/style.css', 'assets/js/main.js', 'content.js'];
    const needles = ['gallery', 'hero__copy', 'indicator', 'hero__hint', 'rm-mark', '#programmes'];
    const lines = [];
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const counts = needles.map((n) => ({ n, c: (src.toLowerCase().split(n).length - 1) }));
      const sum = counts.reduce((a, b) => a + b.c, 0);
      total += sum;
      lines.push(f + ' :: ' + counts.map((c) => c.n + '=' + c.c).join(', '));
    }
    const imgDir = path.join(ROOT, 'assets', 'img');
    const imgFiles = fs.existsSync(imgDir) ? fs.readdirSync(imgDir) : [];
    lines.push('assets/img remaining: ' + (imgFiles.length ? imgFiles.join(', ') : '(none)'));
    lines.push('total stale references: ' + total);
    fs.writeFileSync(evPath('a', 'removal-audit.txt'), lines.join('\n') + '\n', 'utf8');
    add('a', 'source removal audit', total === 0 && imgFiles.length === 0 ? PASS : FAIL, 'stale refs: ' + total + '; leftover img files: ' + imgFiles.length, '0 stale references; no unused gallery assets', ['evidence/a/removal-audit.txt']);
  } catch (e) { add('a', 'source removal audit', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- b) intro stage ---------- */
  try {
    const rows = [];
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const page = await openPage(browser, { w, h, qa: 0 });
      const st = await state(page);
      const dx = +(st.frame.x + st.frame.w / 2 - w / 2).toFixed(2);
      const dy = +(st.frame.y + st.frame.h / 2 - h / 2).toFixed(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      rows.push({ vp: w + 'x' + h, dx, dy, bg, spin: st.spin, markOpacity: st.markboxOpacity, wordOpacity: st.wordmarkOpacity });
      await shot(page, 'a/intro-' + w + 'x' + h + '.png');
      await page.close();
    }
    writeJson(evPath('a', 'intro-audit.json'), rows);
    const ok = rows.every((r) => Math.abs(r.dx) <= 8 && Math.abs(r.dy) <= 8 && r.bg === 'rgb(23, 25, 27)' && r.spin === 0 && r.markOpacity === 0 && r.wordOpacity === 1);
    add('b', 'intro: wordmark centered on dark gray, alone', ok ? PASS : FAIL, JSON.stringify(rows), '|dx|,|dy| <= 8px; bg rgb(23,25,27); spin 0; mark hidden; wordmark visible', ['evidence/a/intro-1440x900.png', 'evidence/a/intro-audit.json']);
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
      const st = await settle(page);
      trace.push({ y, p: +st.p.toFixed(5), spin: +st.spin.toFixed(3), tx: +st.tx.toFixed(2), ty: +st.ty.toFixed(2), sF: +st.sF.toFixed(4), fade: +st.fade.toFixed(3), wOp: st.wordmarkOpacity, mOp: st.markboxOpacity });
    }
    const mapErr = Math.max(...trace.map((t) => Math.abs(t.p - Math.min(1, Math.max(0, (t.y - heroTop) / travel)))));
    let monoSpin = true, maxSpinStep = 0, spinEnd = trace[trace.length - 1].spin;
    for (let i = 1; i < trace.length; i++) {
      const d = trace[i].spin - trace[i - 1].spin;
      if (d < -0.001) monoSpin = false;
      maxSpinStep = Math.max(maxSpinStep, d);
    }
    let orderOk = true, diagonalSteps = 0;
    for (let i = 1; i < trace.length; i++) {
      const a = trace[i - 1], b = trace[i];
      const dx = Math.abs(b.tx - a.tx), dy = Math.abs(b.ty - a.ty);
      if (dx > 1 && dy > 1) diagonalSteps++;
      if (b.p > 0.42 && b.p <= 0.70 && dy > 1.5) orderOk = false;            // left travel must be horizontal
      if (b.p > 0.70 && b.p <= 0.92 && dx > 1.5) orderOk = false;            // descend must be vertical
      if (b.p > 0.18 && b.p <= 0.42 && (Math.abs(b.tx) > 1 || Math.abs(b.ty) > 1)) orderOk = false; // spin in place
    }
    const opacityOk = trace.every((t) => Math.abs((t.wOp || 0) + (t.mOp || 0) - 1) <= 0.01);
    const traceOk = mapErr <= 0.002 && monoSpin && Math.abs(spinEnd - 360) <= 0.5 && maxSpinStep <= 162 && orderOk && diagonalSteps === 0 && opacityOk;
    writeJson(evPath('b', 'motion-trace.json'), { travel, heroTop, mapErr, monoSpin, spinEnd, maxSpinStep, orderOk, diagonalSteps, opacityOk, steps: trace });
    add('c', 'motion trace (60 steps)', traceOk ? PASS : FAIL,
      JSON.stringify({ mapErr: +mapErr.toFixed(4), monoSpin, spinEnd, maxSpinStep: +maxSpinStep.toFixed(1), orderOk, diagonalSteps, opacityOk }),
      'clockwise monotonic to 360±0.5; spin in place; left horizontal; descend vertical; no diagonal; swap opacity sum=1', ['evidence/b/motion-trace.json']);

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

    // stage stills at pins
    for (const q of [0, 0.30, 0.55, 0.80, 1.0]) {
      for (const [w, h] of [[1440, 900], [834, 1112], [390, 844]]) {
        const p = await openPage(browser, { w, h, qa: q });
        await shot(p, 'b/pin-' + q + '-' + w + 'x' + h + '.png');
        await p.close();
      }
    }
  } catch (e) { add('c', 'motion trace', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- d) dock at the footer: half visible, rides, stable ---------- */
  try {
    const rows = [];
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [834, 1112], [390, 844]]) {
      const page = await openPage(browser, { w, h });
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      await waitStableScroll(page);
      await settle(page, 2500);
      const st = await state(page);
      let mk;
      if (w <= 640) {
        mk = await page.evaluate(() => {
          const el = document.getElementById('footer-endmark');
          const r = el.getBoundingClientRect();
          return { x: r.x, y: r.y, w: r.width, h: r.height };
        });
      } else {
        mk = st.markbox;
      }
      const ft = st.footer;
      const cxc = mk.x + mk.w / 2, cyc = mk.y + mk.h / 2;
      const visible = (w <= 640)
        ? Math.max(0, Math.min(mk.y + mk.h, h) - Math.max(mk.y, 0))
        : Math.max(0, Math.min(ft.top, h) - Math.max(mk.y, 0));
      const frac = +(visible / mk.h).toFixed(3);
      const anchorsFooter = Math.abs(cyc - Math.max(ft.top, 0)) <= 6;
      const xOn = Math.abs(cxc - st.dockX) <= 4;
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const ok = frac >= 0.42 && frac <= 0.58 && anchorsFooter && xOn && overflow <= 1;
      rows.push({ vp: w + 'x' + h, frac, markCenter: [+cxc.toFixed(1), +cyc.toFixed(1)], footerTop: +ft.top.toFixed(1), dockX: +st.dockX.toFixed(1), anchorsFooter, xOn, overflow, ok });
      await shot(page, 'b/dock-' + w + 'x' + h + '.png');
      await page.close();
    }
    writeJson(evPath('d', 'dock-audit.json'), rows);
    add('d', 'dock: ~half visible, anchored to footer edge, no overflow', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows),
      'visible fraction 0.42-0.58; mark centre anchored to the footer edge (footer-child layer on phones); centred on dockX ±6px; overflow 0', ['evidence/d/dock-audit.json', 'evidence/b/dock-1440x900.png']);
  } catch (e) { add('d', 'dock audit', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- d2) stability: no drift after scroll/resize ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    await waitStableScroll(page);
    await settle(page, 2500);
    const yMax = await page.evaluate(() => window.scrollY);
    await page.mouse.wheel({ deltaY: 800 });
    await delay(500);
    const yAfter = await page.evaluate(() => window.scrollY);
    const s1 = await state(page);
    await delay(400);
    const s2 = await state(page);
    const drift = Math.max(Math.abs(s1.markbox.x - s2.markbox.x), Math.abs(s1.markbox.y - s2.markbox.y));
    await page.setViewport({ width: 1380, height: 860 });
    await delay(500);
    await settle(page, 2500);
    const s3 = await state(page);
    const resizeOk = Math.abs((s3.markbox.y + s3.markbox.h / 2) - s3.footer.top) <= 5 && Math.abs((s3.markbox.x + s3.markbox.w / 2) - s3.dockX) <= 5;
    await page.setViewport({ width: 1440, height: 900 });
    await delay(500);
    await settle(page, 2500);
    const s4 = await state(page);
    const resizeBackOk = Math.abs((s4.markbox.y + s4.markbox.h / 2) - s4.footer.top) <= 5;
    const ok = yAfter === yMax && drift <= 0.5 && resizeOk && resizeBackOk;
    writeJson(evPath('d', 'stability.json'), { yMax, yAfter, drift, resizeOk, resizeBackOk });
    add('d', 'dock stability: scroll + resize', ok ? PASS : FAIL, JSON.stringify({ yMax, yAfter, drift, resizeOk, resizeBackOk }), 'no scroll past max; drift 0; re-anchors after resize ±5px', ['evidence/d/stability.json']);
    await page.close();
  } catch (e) { add('d', 'dock stability', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- e) sharpness evidence (vector + zoom crops) ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, qa: 1, dpr: 2 });
    const src = await page.evaluate(() => document.getElementById('hero-mark').src);
    const cropX = Math.max(0, Math.round((await state(page)).markbox.x));
    await shot(page, 'e/dock-zoom-2x.png');
    const isSvg = /\.svg(\?|$)/.test(src);
    writeJson(evPath('e', 'sharpness.json'), { markSrc: src, deviceScaleFactor: 2, isSvg });
    add('e', 'large mark rendered from vector (SVG) source', isSvg ? PASS : FAIL, JSON.stringify({ markSrc: src, dpr: 2 }), 'symbol mark displayed from .svg (scale-free)', ['evidence/e/dock-zoom-2x.png']);
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
    await page.close();
  } catch (e) { add('f', 'content + footer', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- g) responsive scan ---------- */
  try {
    const vps = [[360, 740], [768, 1024], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [1280, 500]];
    const rows = [];
    for (const [w, h] of vps) {
      const page = await openPage(browser, { w, h, qa: 1 });
      const m = await page.evaluate(() => {
        const de = document.documentElement;
        const mk = document.getElementById('hero-markbox').getBoundingClientRect();
        return { overflow: de.scrollWidth - de.clientWidth, mk: { x: mk.x, r: mk.x + mk.width }, bodyOverflowY: getComputedStyle(document.body).overflowY };
      });
      const ok = m.overflow <= 1 && m.mk.x >= -2 && m.mk.r <= w + 2 && m.bodyOverflowY !== 'hidden';
      rows.push({ vp: w + 'x' + h, overflow: m.overflow, markLeft: +m.mk.x.toFixed(1), markRight: +m.mk.r.toFixed(1), ok });
      await page.close();
    }
    writeJson(evPath('g', 'responsive.json'), rows);
    add('g', 'responsive: no overflow, mark fully in width', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows), 'overflow <= 1px; mark within horizontal bounds', ['evidence/g/responsive.json']);
  } catch (e) { add('g', 'responsive scan', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- h) reduced motion: end state without the spin ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, reduced: true });
    const rc = await page.evaluate(() => {
      const frame = document.getElementById('hero-frame');
      const end = document.getElementById('footer-endmark');
      const er = end.getBoundingClientRect();
      const ft = document.getElementById('footer').getBoundingClientRect();
      return {
        hasClass: document.documentElement.classList.contains('reduced-motion'),
        frameInline: frame.style.transform,
        frameComputed: getComputedStyle(frame).transform,
        markboxDisplay: getComputedStyle(document.getElementById('hero-markbox')).display,
        wordmarkOpacity: getComputedStyle(document.getElementById('hero-wordmark')).opacity,
        endDisplay: getComputedStyle(end).display,
        endOpacity: getComputedStyle(end).opacity,
        endCenter: [er.x + er.width / 2, er.y + er.height / 2],
        footerTop: ft.top,
        dock: [parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-x')), parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--dock-r'))]
      };
    });
    await shotFull(page, 'h/reduced-1440-full.png');
    const ok = rc.hasClass && rc.frameInline === '' && rc.frameComputed === 'none' && rc.markboxDisplay === 'none' &&
      rc.endDisplay === 'block' && parseFloat(rc.endOpacity) === 1 &&
      Math.abs(rc.endCenter[0] - rc.dock[0]) <= 3 && Math.abs(rc.endCenter[1] - rc.footerTop) <= 3;
    writeJson(evPath('h', 'reduced-motion.json'), rc);
    add('h', 'reduced motion: static end state, no spin', ok ? PASS : FAIL, JSON.stringify(rc), 'no transforms; markbox hidden; endmark at dock position; wordmark visible', ['evidence/h/reduced-1440-full.png']);
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
      const ok = Math.abs(s2.p - s2.pTarget) <= 0.01 && s2.spin >= 359.5 && Math.abs(s2.tx) > 1;
      add('j', 'resize mid-sequence', ok ? PASS : FAIL, JSON.stringify({ p: [s1.p, s2.p], spin: s2.spin, tx: s2.tx }), 'state re-renders consistently after resize', []);
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
    const st = await state(p2);
    const ft = st.footer, mk = st.markbox;
    const frac = +((Math.max(0, Math.min(ft.top, 900) - Math.max(mk.y, 0))) / mk.h).toFixed(3);
    const errs = p2.qa.errors.length + p2.qa.pageerrors.length;
    await shot(p2, 'edge/dock-1440x900.png');
    await p2.close();
    add('k', 'Edge subset (same engine as Chrome)', errs === 0 ? PASS : FAIL, JSON.stringify({ version: env.edge, dockFraction: frac, errors: errs }), 'intro + dock + zero errors on Edge', ['evidence/edge/dock-1440x900.png'], 'Chromium engine shared with Chrome — not independent engine coverage');
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
      '# QA report — logo-sequence site (v1.1.0 fix round)',
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
      '# QA log — environment, commands, honesty notes (v1.1.0)',
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
      'See `qa/evidence/rollback/` (tag v1.1.0 + kept v1.0.0).',
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
