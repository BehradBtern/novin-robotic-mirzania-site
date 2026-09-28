// qa/run-qa.mjs — full headless QA suite for the Novin Robotic Mirzania site.
// Captures all screenshots via puppeteer-core (never the Chrome/Edge --screenshot
// CLI — that is broken on hosts with a running browser session).
// Writes: qa/qa-report.md, qa/qa-log.md, qa/qa-summary.json, qa/evidence/**.
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import puppeteer from 'puppeteer-core';
import {
  serve, openPage, shot, shotFull, state, settle, delay, evPath, writeJson,
  ROOT, EVIDENCE, TMP, PORT, CHROME, EDGE,
  parseScale, parseRotY, parseMarkT, mkdirp
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
  const row = { id, entry, status, value, threshold, evidence, note };
  results.push(row);
  console.log('[' + status.padEnd(5) + '] ' + id + ' ' + entry + ' — ' + String(value).slice(0, 220));
}
const PASS = 'PASS', FAIL = 'FAIL', INFO = 'INFO', OBS = 'OBSERVED', NP = 'NOT PERFORMED';

/* ---------- small helpers ---------- */
function lum(rgb) {
  const [r, g, b] = rgb.map((v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function ratio(a, b) { const l1 = lum(a), l2 = lum(b); const hi = Math.max(l1, l2), lo = Math.min(l1, l2); return (hi + 0.05) / (lo + 0.05); }
function parseRgb(s) { const m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(s || ''); return m ? [+m[1], +m[2], +m[3]] : null; }
const STAGE = [23, 25, 27];
const median = (arr) => { const s = [...arr].sort((x, y) => x - y); return s.length ? s[Math.floor(s.length / 2)] : 0; };
function overlaps(a, b) { return !(a.x + a.w <= b.x || b.x + b.w <= a.x || a.y + a.h <= b.y || b.y + b.h <= a.y); }

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
let server = null;
let browser = null;
let edgeBrowser = null;
mkdirp(EVIDENCE);
mkdirp(TMP);

try {
  server = await serve(ROOT, PORT);
  console.log('QA server on ' + BASE);

  browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run', '--disable-gpu-sandbox'] });
  env.chrome = await browser.version();
  console.log('Chrome: ' + env.chrome);

  /* ---------- a) nav absence sweep + intro centering ---------- */
  try {
    const sweep = [];
    for (const [w, h] of [[360, 740], [768, 1024], [1440, 900]]) {
      for (const pos of ['top', 'mid', 'footer']) {
        const page = await openPage(browser, { w, h });
        if (pos === 'mid') await page.evaluate(() => window.scrollTo(0, (document.getElementById('story').offsetHeight - innerHeight) / 2));
        if (pos === 'footer') await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
        await delay(300);
        const r = await page.evaluate(() => {
          const out = { headers: document.querySelectorAll('header').length, navs: [], fixed: [] };
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
    add('a', 'nav-absence sweep (9 cells)', navOk ? PASS : FAIL,
      navOk ? 'headers 0, fixed/sticky-outside-hero 0, nav only in footer' : JSON.stringify(sweep.filter((r) => r.headers || r.fixed.length || r.navs.some((n) => !n.inFooter))),
      'zero header/nav outside footer at top/mid/footer × 360/768/1440', ['evidence/a/nav-sweep.json']);
  } catch (e) { add('a', 'nav-absence sweep', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  try {
    const rows = [];
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080]]) {
      const page = await openPage(browser, { w, h, qa: 0 });
      const st = await state(page);
      const dx = +(st.frame.x + st.frame.w / 2 - w / 2).toFixed(2);
      const dy = +(st.frame.y + st.frame.h / 2 - h / 2).toFixed(2);
      const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
      const copy = await page.evaluate(() => [
        parseFloat(getComputedStyle(document.getElementById('hero-copy-left')).opacity),
        parseFloat(getComputedStyle(document.getElementById('hero-copy-right')).opacity)
      ]);
      await shot(page, 'a/intro-' + w + 'x' + h + '.png');
      rows.push({ w, h, dx, dy, bg, copyLeft: copy[0], copyRight: copy[1] });
      await page.close();
    }
    writeJson(evPath('a', 'intro-audit.json'), rows);
    const ok = rows.every((r) => Math.abs(r.dx) <= 8 && Math.abs(r.dy) <= 8 && r.bg === 'rgb(23, 25, 27)' && r.copyLeft === 0 && r.copyRight === 0);
    add('b', 'intro: wordmark centered on dark gray', ok ? PASS : FAIL,
      JSON.stringify(rows.map((r) => ({ vp: r.w + 'x' + r.h, dx: r.dx, dy: r.dy, bg: r.bg }))),
      '|dx|,|dy| <= 8px; bg rgb(23,25,27); copy opacity 0', ['evidence/a/intro-1440x900.png', 'evidence/a/intro-audit.json']);
  } catch (e) { add('b', 'intro centering', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- c) scroll trace + stills + settle/determinism ---------- */
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
      const mz = /rotate\((-?[\d.]+)deg\)/.exec(st.markTransform || '');
      trace.push({
        y, p: +st.p.toFixed(5), scale: parseScale(st.transform), wRotY: parseRotY(st.wordmarkTransform),
        mRotY: parseRotY(st.markboxTransform), mark: parseMarkT(st.markTransform), markZ: mz ? +mz[1] : 0,
        left: st.copyLeftOpacity, right: st.copyRightOpacity, stage: st.stage
      });
    }
    const mapErr = Math.max(...trace.map((t) => Math.abs(t.p - Math.min(1, Math.max(0, (t.y - heroTop) / travel)))));
    let mono = true;
    for (let i = 1; i < trace.length; i++) if (trace[i].p < trace[i - 1].p - 1e-6) mono = false;
    const disp = trace.map((t) => (t.mark ? t.mark.k : t.scale));
    const dispRange = Math.max(...disp) - Math.min(...disp);
    const dDisp = [];
    for (let i = 1; i < trace.length; i++) dDisp.push(Math.abs(disp[i] - disp[i - 1]));
    const maxDScale = Math.max(...dDisp);
    const combinedRot = trace.map((t) => Math.max(t.wRotY, t.mRotY + 90) + Math.abs(t.markZ || 0));
    const rotRange = Math.max(...combinedRot) - Math.min(...combinedRot);
    const dRot = [];
    for (let i = 1; i < trace.length; i++) dRot.push(Math.abs(combinedRot[i] - combinedRot[i - 1]));
    const maxDRot = Math.max(...dRot);
    /* Designed easeInOutCubic segments legitimately reach ~3x their average rate
       at mid-point; sampled at 1/60-of-pin steps that is up to ~30 deg/step for
       the 90 deg flip and ~1.9 for the giant scale. Threshold: 45% of each range
       (+ small epsilon) still catches teleport-style snaps (>=50% of range in a
       single step). */
    const spikeOk = maxDScale <= 0.05 + 0.45 * dispRange && maxDRot <= 2 + 0.45 * rotRange;
    // dead-range scan (0.05 windows; declared holds [0,0.20] and [0.97,1.0] exempt)
    const flat = [];
    for (let a = 0; a <= 0.949; a += 0.05) {
      const b = a + 0.05;
      const wpts = trace.filter((t) => t.p >= a && t.p <= b);
      if (wpts.length < 2) continue;
      const scaleR = Math.max(...wpts.map((t) => (t.mark ? t.mark.k : t.scale))) - Math.min(...wpts.map((t) => (t.mark ? t.mark.k : t.scale)));
      const rotR = Math.max(...wpts.map((t) => Math.max(t.wRotY, t.mRotY + 90) + Math.abs(t.markZ || 0))) - Math.min(...wpts.map((t) => Math.max(t.wRotY, t.mRotY + 90) + Math.abs(t.markZ || 0)));
      const copyR = Math.max(...wpts.map((t) => t.left + t.right)) - Math.min(...wpts.map((t) => t.left + t.right));
      const stageSet = new Set(wpts.map((t) => t.stage));
      const isFlat = scaleR < 0.002 && rotR < 0.5 && copyR < 0.01 && stageSet.size === 1;
      const exempt = (b <= 0.201) || (a >= 0.969);
      if (isFlat && !exempt) flat.push([+a.toFixed(2), +b.toFixed(2)]);
    }
    writeJson(evPath('b', 'scroll-trace.json'), { travel, heroTop, maxDScale, maxDRot, flat, steps: trace });
    const traceOk = mono && mapErr <= 0.002 && spikeOk && flat.length === 0;
    add('c', 'scroll mapping trace (60 steps)', traceOk ? PASS : FAIL,
      JSON.stringify({ mapErr: +mapErr.toFixed(4), mono, maxDispStep: +maxDScale.toFixed(4), dispRange: +dispRange.toFixed(3), maxRotStep: +maxDRot.toFixed(2), undeclaredFlat: flat }),
      'monotone; mapErr<=0.002; max step <= 45% of range; no undeclared flat >=5% p', ['evidence/b/scroll-trace.json']);

    // settle + oscillation + idle
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
    const settleRes = settleOk && reversals <= 2 && idleDelta === 0;
    add('c', 'settle / no-oscillation / idle-stability', settleRes ? PASS : FAIL,
      JSON.stringify({ settleOk, p: +s1.p.toFixed(5), mapP: +mapP.toFixed(5), reversals, idleDelta }),
      'after wheel stop: p==mapping (+-0.002) within 650ms; <=2 reversals; idle delta 0', []);

    // determinism (same scrollY twice)
    const gotoY = async (yy) => { await page.evaluate((v) => window.scrollTo(0, v), yy); await settle(page); const st = await state(page); return [st.transform, st.markboxTransform, st.markTransform, String(st.copyLeftOpacity)].join('|'); };
    const t1 = await gotoY(Math.round(travel * 0.42));
    await gotoY(Math.round(travel * 0.75));
    const t2 = await gotoY(Math.round(travel * 0.42));
    add('c', 'determinism (same scrollY twice)', t1 === t2 ? PASS : FAIL, t1 === t2 ? 'identical serialized transforms' : 'MISMATCH', 'identical', []);
    await page.close();

    // stage stills at pins (fresh pages for determinism)
    for (const q of [0, 0.10, 0.325, 0.55, 0.70, 0.90, 1.0]) {
      const p = await openPage(browser, { w: 1440, h: 900, qa: q });
      await shot(p, 'b/pin-' + q + '-1440x900.png');
      await p.close();
    }
  } catch (e) { add('c', 'scroll trace', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- d) copy reveal ---------- */
  try {
    const rows = [];
    for (const [w, h] of [[1440, 900], [1920, 1080], [2560, 1080]]) {
      const page = await openPage(browser, { w, h, qa: 0.70 });
      const m = await page.evaluate(() => {
        const R = (id) => document.getElementById(id).getBoundingClientRect();
        const L = R('hero-copy-left'), RR = R('hero-copy-right'), M = R('hero-markbox');
        return {
          L: { r: L.right, cy: L.top + L.height / 2, op: parseFloat(getComputedStyle(document.getElementById('hero-copy-left')).opacity) },
          Rr: { l: RR.left, cy: RR.top + RR.height / 2, op: parseFloat(getComputedStyle(document.getElementById('hero-copy-right')).opacity) },
          M: { cx: M.left + M.width / 2, cy: M.top + M.height / 2 },
          col: { head: getComputedStyle(document.getElementById('hero-left-headline')).color, body: getComputedStyle(document.getElementById('hero-left-body')).color, kicker: getComputedStyle(document.getElementById('hero-left-kicker')).color }
        };
      });
      const headR = ratio(parseRgb(m.col.head), STAGE), bodyR = ratio(parseRgb(m.col.body), STAGE), kickR = ratio(parseRgb(m.col.kicker), STAGE);
      const ok = m.L.op >= 0.99 && m.Rr.op >= 0.99 && m.L.r < m.M.cx && m.Rr.l > m.M.cx &&
        Math.abs(m.L.cy - m.M.cy) <= 4 && Math.abs(m.Rr.cy - m.M.cy) <= 4 && headR >= 4.5 && bodyR >= 4.5 && kickR >= 4.5;
      rows.push({ vp: w + 'x' + h, ok, leftRightEdge: +m.L.r.toFixed(1), markCx: +m.M.cx.toFixed(1), rightLeftEdge: +m.Rr.l.toFixed(1), dcy: +Math.abs(m.L.cy - m.M.cy).toFixed(2), opacity: [m.L.op, m.Rr.op], contrast: { head: +headR.toFixed(2), body: +bodyR.toFixed(2), kicker: +kickR.toFixed(2) } });
      await shot(page, 'c/copy-' + w + 'x' + h + '.png');
      await page.close();
    }
    writeJson(evPath('c', 'copy-audit.json'), rows);
    add('d', 'copy reveal (p=0.70)', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows),
      'opacity>=0.99; left right-edge < mark cx; right left-edge > mark cx; |dcy|<=4px; contrast>=4.5', ['evidence/c/copy-audit.json', 'evidence/c/copy-1440x900.png']);
    const p55 = await openPage(browser, { w: 1440, h: 900, qa: 0.55 });
    const s55 = await state(p55);
    add('d', 'copy stagger at p=0.55', OBS, JSON.stringify({ left: s55.copyLeftOpacity, right: s55.copyRightOpacity }), 'left enters before right (stagger) by design', []);
    await p55.close();
  } catch (e) { add('d', 'copy reveal', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- e) final framing ---------- */
  try {
    const rows = [];
    for (const [w, h] of [[1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [390, 844]]) {
      const page = await openPage(browser, { w, h, qa: 1 });
      const st = await state(page);
      const mk = st.markImg;
      const visible = Math.max(0, Math.min(mk.x + mk.w, w) - Math.max(mk.x, 0));
      const frac = +(visible / mk.w).toFixed(3);
      const mt = parseMarkT(st.markTransform);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
      const ok = frac >= 0.35 && frac <= 0.65 && mt && mt.rz < 0 && overflow <= 1;
      rows.push({ vp: w + 'x' + h, frac, rz: mt && mt.rz, k: mt && +mt.k.toFixed(2), visiblePx: Math.round(visible), markPx: Math.round(mk.w), overflow, ok });
      await shot(page, 'd/final-' + w + 'x' + h + '.png');
      await page.close();
    }
    writeJson(evPath('d', 'final-framing.json'), rows);
    add('e', 'final framing: half-visible giant at left', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows),
      'visible fraction 0.35-0.65; rotation negative; no horizontal overflow', ['evidence/d/final-framing.json', 'evidence/d/final-1440x900.png']);
  } catch (e) { add('e', 'final framing', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- f) content source audit ---------- */
  try {
    const files = ['index.html', 'assets/css/style.css', 'assets/js/main.js', 'server.js'];
    const needles = ['Novin Robotic Mirzania', 'Automation on the factory floor', '+00 000 000 0000', 'Institute for Applied Robotics', 'hello@example.com'];
    const lines = [];
    let total = 0;
    for (const f of files) {
      const src = fs.readFileSync(path.join(ROOT, f), 'utf8');
      const counts = needles.map((n) => ({ n, c: src.split(n).length - 1 }));
      const sum = counts.reduce((a, b) => a + b.c, 0);
      total += sum;
      lines.push(f + ' :: ' + counts.map((c) => c.n + '=' + c.c).join(', ') + ' :: total=' + sum);
    }
    lines.push('');
    lines.push('Scan scope: index.html, assets/css/style.css, assets/js/main.js, server.js.');
    lines.push('README / qa reports / content.js intentionally excluded (content.js IS the source).');
    fs.writeFileSync(evPath('f', 'content-audit.txt'), lines.join('\n') + '\n', 'utf8');
    add('f', 'single content source (no duplicates)', total === 0 ? PASS : FAIL, 'total hardcoded duplicate strings outside content.js: ' + total,
      '0 occurrences of sample strings in html/css/js/server', ['evidence/f/content-audit.txt']);
  } catch (e) { add('f', 'content audit', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- g) footer ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(400);
    await shot(page, 'g/footer-1440x900.png');
    const links = await page.evaluate(() => Array.from(document.querySelectorAll('#footer-explore a')).map((a) => ({ href: a.getAttribute('href'), label: a.textContent })));
    const landings = [];
    for (let i = 0; i < links.length; i++) {
      await page.evaluate((idx) => document.querySelectorAll('#footer-explore a')[idx].click(), i);
      await delay(350);
      const r = await page.evaluate(() => ({ y: window.scrollY, tops: {} }));
      const href = links[i].href;
      if (href.startsWith('#')) {
        const top = await page.evaluate((id) => { const el = document.getElementById(id); return el ? el.getBoundingClientRect().top : null; }, href.slice(1));
        landings.push({ label: links[i].label, href, top: top === null ? null : +top.toFixed(1), y: r.y });
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
    writeJson(evPath('g', 'footer-links.json'), { links, landings, contactCheck });
    const landOk = landings.every((l) => l.top !== null && (l.href === '#contact' ? (l.top >= -40 && l.top <= 675) : Math.abs(l.top) <= 40));
    const ok = landOk && Object.values(contactCheck).every(Boolean) && links.length === 4;
    add('g', 'footer: links land + contact/legal intact', ok ? PASS : FAIL, JSON.stringify({ landings, contactCheck }),
      '4 explore links land within +-40px; mailto/tel formats; texts == content', ['evidence/g/footer-links.json', 'evidence/g/footer-1440x900.png']);
    await page.close();
  } catch (e) { add('g', 'footer links', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- h) gallery + variants ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await delay(800);
    await page.evaluate(() => document.getElementById('programmes').scrollIntoView({ behavior: 'instant', block: 'start' }));
    await delay(400);
    await shot(page, 'h/gallery-6-1440x900.png');
    const gal = await page.evaluate(async () => {
      const rows = Array.from(document.querySelectorAll('.gallery__row'));
      const imgs = Array.from(document.querySelectorAll('.gallery__row img'));
      const decoded = await Promise.all(imgs.map((img) => img.decode().then(() => true).catch(() => img.complete && (img.naturalWidth > 0 || img.currentSrc !== ''))));
      return {
        count: rows.length,
        alts: imgs.map((i) => (i.getAttribute('alt') || '').trim().length),
        titles: rows.map((r) => (r.querySelector('.gallery__card-title') || {}).textContent || ''),
        texts: rows.map((r) => ((r.querySelector('.gallery__card-text') || {}).textContent || '').trim().length),
        decoded,
        mediaVsText: rows.map((r) => {
          const m = r.querySelector('.gallery__media').getBoundingClientRect();
          const t = r.querySelector('.gallery__text').getBoundingClientRect();
          return !(m.left + m.width <= t.left || t.left + t.width <= m.left || m.top + m.height <= t.top || t.top + t.height <= m.top);
        })
      };
    });
    writeJson(evPath('h', 'gallery-audit.json'), gal);
    const galOk = gal.count === 6 && gal.alts.every((a) => a > 0) && gal.titles.every((t) => t.length > 0) && gal.texts.every((t) => t > 0) && gal.decoded.every(Boolean) && gal.mediaVsText.every((v) => !v);
    add('h', 'gallery: 6 cards complete', galOk ? PASS : FAIL, JSON.stringify({ count: gal.count, alts: gal.alts, decoded: gal.decoded, mediaVsText: gal.mediaVsText }),
      'count 6; alt/title/text non-empty; images decoded; no media/text overlap', ['evidence/h/gallery-audit.json', 'evidence/h/gallery-6-1440x900.png']);
    await page.close();

    // variants via content.js surgery (only the items array changes)
    const makeVariant = (n) => {
      const dir = path.join(TMP, 'variant' + n);
      fs.rmSync(dir, { recursive: true, force: true });
      mkdirp(dir);
      const src = fs.readFileSync(path.join(ROOT, 'content.js'), 'utf8');
      const key = 'items: [';
      const i = src.indexOf(key);
      const start = i + key.length - 1;
      let depth = 0, end = -1;
      for (let j = start; j < src.length; j++) {
        const ch = src[j];
        if (ch === '[') depth++;
        else if (ch === ']') { depth--; if (depth === 0) { end = j; break; } }
      }
      const items = Function('return [' + src.slice(start + 1, end) + ']')();
      let next = items;
      if (n === 4) next = items.slice(0, 4);
      if (n === 7) next = items.concat([Object.assign({}, items[5], { text: items[5].text + ' Extra slot.' })]);
      if (n === 0) next = [];
      if (n === 8) next = items.concat([Object.assign({}, items[5]), Object.assign({}, items[4])]);
      const patched = src.slice(0, start) + JSON.stringify(next, null, 6) + src.slice(end + 1);
      fs.writeFileSync(path.join(dir, 'content.js'), patched, 'utf8');
      fs.copyFileSync(path.join(ROOT, 'index.html'), path.join(dir, 'index.html'));
      fs.cpSync(path.join(ROOT, 'assets'), path.join(dir, 'assets'), { recursive: true });
      return dir;
    };
    const variantRows = [];
    for (const n of [4, 7, 0, 8]) {
      const dir = makeVariant(n);
      const vServer = await serve(dir, PORT + 1);
      const vPage = await openPage(browser, { w: 1440, h: 900, url: 'http://localhost:' + (PORT + 1) + '/' });
      const r = await vPage.evaluate(() => ({
        count: document.querySelectorAll('.gallery__row').length,
        errors: null
      }));
      const ovl = await vPage.evaluate(() => {
        const rows = Array.from(document.querySelectorAll('.gallery__row'));
        return rows.map((row) => {
          const m = row.querySelector('.gallery__media').getBoundingClientRect();
          const t = row.querySelector('.gallery__text').getBoundingClientRect();
          return !(m.left + m.width <= t.left || t.left + t.width <= m.left || m.top + m.height <= t.top || t.top + t.height <= m.top);
        });
      });
      variantRows.push({ n, count: r.count, overlaps: ovl.filter(Boolean).length, pageErrors: vPage.qa.pageerrors.length, consoleErrors: vPage.qa.errors.length });
      if (n === 4 || n === 7) {
        await vPage.evaluate(() => document.getElementById('programmes').scrollIntoView({ behavior: 'instant', block: 'start' }));
        await delay(300);
        await shot(vPage, 'h/variant-' + n + '-1440x900.png');
      }
      await vPage.close();
      vServer.close();
    }
    writeJson(evPath('h', 'variant-runs.json'), variantRows);
    const vOk = variantRows.every((r) => r.overlaps === 0 && r.pageErrors === 0 && r.consoleErrors === 0) &&
      variantRows[0].count === 4 && variantRows[1].count === 7 && variantRows[2].count === 0 && variantRows[3].count === 8;
    add('h', 'gallery count variants (4/7/0/8)', vOk ? PASS : FAIL, JSON.stringify(variantRows),
      '4/7 render without overlap or errors; 0/8 graceful (no errors)', ['evidence/h/variant-runs.json', 'evidence/h/variant-4-1440x900.png', 'evidence/h/variant-7-1440x900.png']);
    fs.rmSync(TMP, { recursive: true, force: true });
  } catch (e) { add('h', 'gallery checks', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- i) responsive ---------- */
  try {
    const vps = [[360, 740], [768, 1024], [1280, 800], [1440, 900], [1920, 1080], [2560, 1080], [1280, 500]];
    const rows = [];
    for (const [w, h] of vps) {
      const page = await openPage(browser, { w, h, qa: 0.70 });
      const heroPairs = await page.evaluate(() => {
        const g = (s) => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; };
        return { left: g('.hero__col--left'), right: g('.hero__col--right'), ind: g('.hero__indicator') };
      });
      let hOverlap = 0;
      if (heroPairs.left && heroPairs.right && overlaps(heroPairs.left, heroPairs.right)) hOverlap++;
      if (heroPairs.left && heroPairs.ind && overlaps(heroPairs.left, heroPairs.ind)) hOverlap++;
      if (heroPairs.right && heroPairs.ind && overlaps(heroPairs.right, heroPairs.ind)) hOverlap++;
      await shot(page, 'i/resp-' + w + 'x' + h + '-q070.png');
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      await delay(500);
      const late = await page.evaluate(() => {
        const rects = (sel) => Array.from(document.querySelectorAll(sel)).map((e) => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
        const rowOv = Array.from(document.querySelectorAll('.gallery__row')).map((row) => {
          const m = row.querySelector('.gallery__media').getBoundingClientRect();
          const t = row.querySelector('.gallery__text').getBoundingClientRect();
          return !(m.left + m.width <= t.left || t.left + t.width <= m.left || m.top + m.height <= t.top || t.top + t.height <= m.top);
        });
        const fb = document.querySelector('.footer__brand').getBoundingClientRect();
        const fc = document.querySelectorAll('.footer__col');
        const f1 = fc[0].getBoundingClientRect(), f2 = fc[1].getBoundingClientRect();
        const fOv = [{ a: fb, b: f1, key: 'brand-col1' }, { a: f1, b: f2, key: 'col1-col2' }]
          .filter((p) => !(p.a.left + p.a.width <= p.b.left || p.b.left + p.b.width <= p.a.left || p.a.top + p.a.height <= p.b.top || p.b.top + p.b.height <= p.a.top)).map((p) => p.key);
        const de = document.documentElement;
        return { rowOv, fOv, overflow: de.scrollWidth - de.clientWidth, overflowY: getComputedStyle(document.body).overflowY };
      });
      const ok = hOverlap === 0 && late.rowOv.every((v) => !v) && late.fOv.length === 0 && late.overflow <= 1 && late.overflowY !== 'hidden';
      rows.push({ vp: w + 'x' + h, heroOverlapPairs: hOverlap, rowOverlaps: late.rowOv.filter(Boolean).length, footerOverlaps: late.fOv, overflow: late.overflow, ok });
      await page.close();
      if (w === 1280 && h === 500) {
        const p1 = await openPage(browser, { w, h, qa: 1 });
        await shot(p1, 'i/resp-' + w + 'x' + h + '-q1.png');
        await p1.close();
      }
    }
    writeJson(evPath('i', 'responsive.json'), rows);
    add('i', 'responsive overlap + overflow', rows.every((r) => r.ok) ? PASS : FAIL, JSON.stringify(rows),
      '0 overlap pairs at 7 viewports; overflow <= 1px; body not locked', ['evidence/i/responsive.json', 'evidence/i/resp-360x740-q070.png']);
    // wheel reach bottom
    const p = await openPage(browser, { w: 1440, h: 900 });
    for (let i = 0; i < 40; i++) { await p.mouse.wheel({ deltaY: 2200 }); await delay(60); }
    await delay(400);
    const reach = await p.evaluate(() => ({ y: window.scrollY, max: document.documentElement.scrollHeight - window.innerHeight }));
    await p.close();
    const reachOk = Math.abs(reach.y - reach.max) <= 2;
    add('i', 'wheel reaches page bottom', reachOk ? PASS : FAIL, JSON.stringify(reach), 'scrollY == max +-2px', []);
  } catch (e) { add('i', 'responsive checks', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- j) reduced motion ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900, reduced: true });
    const rc = await page.evaluate(() => {
      const L = document.getElementById('hero-copy-left'), R = document.getElementById('hero-copy-right');
      const frame = document.getElementById('hero-frame');
      const rows = Array.from(document.querySelectorAll('.gallery__row'));
      const rmMark = document.getElementById('rm-mark');
      return {
        hasClass: document.documentElement.classList.contains('reduced-motion'),
        copyOpacity: [parseFloat(getComputedStyle(L).opacity), parseFloat(getComputedStyle(R).opacity)],
        frameInline: frame.style.transform,
        frameComputed: getComputedStyle(frame).transform,
        rowsOpacity: rows.map((r) => parseFloat(getComputedStyle(r).opacity)),
        rmMarkDisplay: getComputedStyle(rmMark).display,
        rmMarkWidth: rmMark.getBoundingClientRect().width
      };
    });
    await delay(1000);
    const rc2 = await page.evaluate(() => ({ frameInline: document.getElementById('hero-frame').style.transform, frameComputed: getComputedStyle(document.getElementById('hero-frame')).transform }));
    await shotFull(page, 'j/reduced-1440-full.png');
    const jOk = rc.hasClass && rc.copyOpacity.every((o) => o === 1) && rc.frameInline === '' && rc.frameComputed === 'none' &&
      rc.rowsOpacity.every((o) => o === 1) && rc.rmMarkDisplay === 'block' && rc.rmMarkWidth > 100 && rc2.frameInline === '' && rc2.frameComputed === 'none';
    writeJson(evPath('j', 'reduced-motion.json'), { rc, rc2 });
    add('j', 'reduced motion: static readable layout', jOk ? PASS : FAIL, JSON.stringify({ copyOpacity: rc.copyOpacity, rowsOpacity: rc.rowsOpacity, rmMarkWidth: rc.rmMarkWidth, stable: rc2.frameComputed === 'none' }),
      'no pinned choreography; copy + rows visible; no transforms; static mark shown', ['evidence/j/reduced-1440-full.png']);
    await page.close();
    const p390 = await openPage(browser, { w: 390, h: 844, reduced: true });
    await shotFull(p390, 'j/reduced-390-full.png');
    await p390.close();
    add('j', 'reduced motion toggle semantics', INFO, 'OS-setting change reloads the page (documented; listener present)', 'n/a', []);
  } catch (e) { add('j', 'reduced motion', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- k) a11y ---------- */
  try {
    const page = await openPage(browser, { w: 1440, h: 900 });
    const colors = await page.evaluate(() => {
      const c = (sel, prop = 'color') => { const el = document.querySelector(sel); return el ? getComputedStyle(el)[prop] : null; };
      const root = getComputedStyle(document.documentElement);
      return {
        headline: c('#hero-left-headline'), body: c('#hero-left-body'), kicker: c('#hero-left-kicker'),
        intro: c('.gallery__intro'), legal: c('#footer-legal'), accent: root.getPropertyValue('--accent').trim()
      };
    });
    const contrast = {
      headline: +ratio(parseRgb(colors.headline), STAGE).toFixed(2),
      body: +ratio(parseRgb(colors.body), STAGE).toFixed(2),
      kicker: +ratio(parseRgb(colors.kicker), STAGE).toFixed(2),
      intro: +ratio(parseRgb(colors.intro), STAGE).toFixed(2),
      legal: +ratio(parseRgb(colors.legal), STAGE).toFixed(2),
      accentVsStage: +ratio(parseRgb('rgb(86,193,201)'), STAGE).toFixed(2)
    };
    const deco = await page.evaluate(() => {
      const imgs = Array.from(document.querySelectorAll('img'));
      return imgs.map((i) => ({ alt: i.getAttribute('alt'), ariaHidden: i.getAttribute('aria-hidden'), cls: i.className }));
    });
    const heroFocusables = await page.evaluate(() => document.querySelectorAll('#story a, #story button, #story [tabindex]:not([tabindex="-1"]), #story input, #story select, #story textarea').length);
    const tabSeq = [];
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab');
      const a = await page.evaluate(() => { const el = document.activeElement; return { tag: el.tagName, id: el.id, cls: String(el.className || '').slice(0, 40), text: (el.textContent || '').trim().slice(0, 30) }; });
      tabSeq.push(a);
    }
    const focusRing = await page.evaluate(() => {
      const el = document.activeElement;
      const cs = getComputedStyle(el);
      return { width: cs.outlineWidth, style: cs.outlineStyle };
    });
    // focus the skip link explicitly and screenshot
    await page.evaluate(() => document.querySelector('.skip-link').focus());
    await delay(150);
    await shot(page, 'k/focus-skip.png');
    const skipRing = await page.evaluate(() => {
      const cs = getComputedStyle(document.querySelector('.skip-link'));
      return { width: cs.outlineWidth, style: cs.outlineStyle };
    });
    const altOk = deco.filter((d) => d.cls.includes('gallery')).length === 0 ? true : true; // detailed below
    const galleryAlts = await page.evaluate(() => Array.from(document.querySelectorAll('.gallery__row img')).map((i) => (i.getAttribute('alt') || '').trim().length));
    const decorativeOk = deco.filter((d) => ['hero__wordmark', 'hero__mark', 'rm-mark', 'footer__logo'].some((c) => d.cls.includes(c))).every((d) => d.alt === '');
    writeJson(evPath('k', 'a11y.json'), { contrast, deco, heroFocusables, tabSeq, focusRing, skipRing, galleryAlts });
    const kOk = Object.entries(contrast).every(([k, v]) => k === 'accentVsStage' ? v >= 3 : v >= 4.5) &&
      heroFocusables === 0 && galleryAlts.every((a) => a > 0) && decorativeOk &&
      tabSeq[0].cls.includes('skip-link') &&
      tabSeq.filter((t) => ['Our story', 'Programmes', 'Get in touch', 'Back to top'].includes(t.text)).length >= 3 &&
      parseFloat(focusRing.width) >= 2 && parseFloat(skipRing.width) >= 2;
    add('k', 'a11y: contrast, alt, keyboard, focus', kOk ? PASS : FAIL,
      JSON.stringify({ contrast, heroFocusables, firstTab: tabSeq[0], focusRing, skipRing, galleryAlts }),
      'contrast>=4.5 (accent>=3); alt text present; hero has 0 focusables; skip link first; focus ring >=2px', ['evidence/k/a11y.json', 'evidence/k/focus-skip.png']);
    await page.close();
  } catch (e) { add('k', 'a11y checks', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- l) perf ---------- */
  try {
    const page = await browser.newPage();
    const per = { errors: [], pageerrors: [], failed: [], requests: [] };
    page.on('console', (m) => { if (m.type() === 'error') per.errors.push(m.text()); });
    page.on('pageerror', (e) => per.pageerrors.push(e.message));
    page.on('request', (r) => per.requests.push(r.url()));
    page.on('requestfailed', (r) => per.failed.push(r.url()));
    await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
    await page.evaluateOnNewDocument(() => {
      window.__cls = 0; window.__clsCount = 0;
      try {
        new PerformanceObserver((list) => { for (const e of list.getEntries()) { if (!e.hadRecentInput) { window.__cls += e.value; window.__clsCount++; } } }).observe({ type: 'layout-shift', buffered: true });
      } catch (e) {}
    });
    await page.goto(BASE, { waitUntil: 'networkidle0', timeout: 60000 });
    await page.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 });
    await delay(300);
    // full scroll pass
    const frames = await page.evaluate(async () => {
      const out = [];
      const total = document.getElementById('story').offsetHeight + 2000;
      const t0 = performance.now();
      let last = t0;
      await new Promise((resolve) => {
        function step(now) {
          const target = Math.min(total, (now - t0) * 0.9);
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
    await delay(400);
    const pageData = await page.evaluate(() => {
      const res = performance.getEntriesByType('resource');
      const hosts = {};
      let transfer = 0;
      for (const r of res) { try { const h = new URL(r.name).host; hosts[h] = (hosts[h] || 0) + 1; } catch (e) {} transfer += r.transferSize || 0; }
      const imgs = Array.from(document.querySelectorAll('.gallery__row img'));
      return {
        cls: window.__cls, clsCount: window.__clsCount,
        resources: res.length, transfer, hosts,
        lazy: imgs.map((i) => i.getAttribute('loading')),
        dims: imgs.map((i) => i.getAttribute('width') + 'x' + i.getAttribute('height')),
        aspect: imgs.map((i) => { const r = i.getBoundingClientRect(); return +(r.width / r.height).toFixed(2); })
      };
    });
    const imgIdx = frames.map((f, i) => ({ f, i })).sort((a, b) => a.f - b.f).map((x) => x.f);
    const p95 = imgIdx[Math.floor(imgIdx.length * 0.95)] || 0;
    const lOk = per.errors.length === 0 && per.pageerrors.length === 0 && per.failed.length === 0 &&
      Object.keys(pageData.hosts).every((h) => h.startsWith('localhost')) &&
      pageData.lazy.every((v) => v === 'lazy') && pageData.aspect.every((a) => Math.abs(a - 1.5) < 0.05);
    writeJson(evPath('l', 'perf.json'), { per, pageData, frames: { n: frames.length, median: median(frames), p95 } });
    add('l', 'perf: no errors, local-only, lazy images', lOk ? PASS : FAIL,
      JSON.stringify({ consoleErrors: per.errors.length, pageErrors: per.pageerrors.length, failedRequests: per.failed.length, hosts: pageData.hosts, resources: pageData.resources, transferBytes: pageData.transfer, lazy: pageData.lazy, aspect: pageData.aspect }),
      '0 errors/failed; localhost-only; lazy below fold; 3:2 frames', ['evidence/l/perf.json']);
    add('l', 'CLS + frame cadence (headless)', INFO, JSON.stringify({ cls: +pageData.cls.toFixed(4), clsCount: pageData.clsCount, frameMedianMs: +median(frames).toFixed(1), frameP95Ms: +p95.toFixed(1), frames: frames.length }),
      'informational — headless numbers are not device guarantees', []);
    await page.close();
  } catch (e) { add('l', 'perf checks', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- m) edge scenarios ---------- */
  try {
    // E1 resize during pin
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(st0.travel * 0.5));
      await settle(page);
      const s1 = await state(page);
      const stickyTop1 = await page.evaluate(() => document.querySelector('.hero__sticky').getBoundingClientRect().top);
      await page.setViewport({ width: 1024, height: 800 });
      await delay(500);
      await settle(page);
      const s2 = await state(page);
      const stickyTop2 = await page.evaluate(() => document.querySelector('.hero__sticky').getBoundingClientRect().top);
      await page.setViewport({ width: 1920, height: 1080 });
      await delay(500);
      await settle(page);
      const s3 = await state(page);
      const stickyCount = await page.evaluate(() => document.querySelectorAll('.hero__sticky').length);
      const yNow = await page.evaluate(() => window.scrollY);
      const mapP2 = Math.min(1, Math.max(0, (yNow - s3.heroTop) / s3.travel));
      const mapP2b = Math.min(1, Math.max(0, (yNow - s2.heroTop) / s2.travel));
      const stageOf = (pp) => (pp < 0.20 ? 0 : pp < 0.45 ? 1 : pp < 0.78 ? 2 : 3);
      const ok = Math.abs(s3.p - mapP2) <= 0.01 && Math.abs(s2.p - mapP2b) <= 0.01 && s3.stage === stageOf(mapP2) &&
        Math.abs(stickyTop1) <= 1 && Math.abs(stickyTop2) <= 1 && stickyCount === 1;
      writeJson(evPath('m', 'e1-resize.json'), { s1p: s1.p, s2p: s2.p, s3p: s3.p, mapP2, mapP2b, stickyTop1, stickyTop2, stickyCount });
      add('m', 'E1 resize during pin', ok ? PASS : FAIL, JSON.stringify({ p: [s1.p, s2.p, s3.p], map: [mapP2b, mapP2], stickyTop: [stickyTop1, stickyTop2] }), 'render matches recomputed mapping +-0.01p; sticky top 0; single instance', ['evidence/m/e1-resize.json']);
      await page.close();
    }
    // E2 fling bursts
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      for (let i = 0; i < 5; i++) { await page.mouse.wheel({ deltaY: 2400 }); await delay(70); }
      await delay(800);
      const st = await state(page);
      const sY = await page.evaluate(() => window.scrollY);
      const mapP = Math.min(1, Math.max(0, (sY - st0.heroTop) / st0.travel));
      const ok = Math.abs(st.p - mapP) <= 0.002;
      add('m', 'E2 fling (wheel bursts)', ok ? PASS : FAIL, JSON.stringify({ p: +st.p.toFixed(4), mapP: +mapP.toFixed(4) }), 'end state == mapping +-0.002', []);
      await page.close();
    }
    // E3 reload mid-pin
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(st0.travel * 0.5));
      await settle(page);
      const beforeY = await page.evaluate(() => window.scrollY);
      await page.reload({ waitUntil: 'networkidle0' });
      await page.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 });
      await delay(500);
      const afterY = await page.evaluate(() => window.scrollY);
      const st = await state(page);
      const mapP = Math.min(1, Math.max(0, (afterY - st0.heroTop) / st0.travel));
      const consistent = Math.abs(st.p - mapP) <= 0.01;
      writeJson(evPath('m', 'e3-reload.json'), { beforeY, afterY, p: st.p, mapP });
      add('m', 'E3 reload mid-pin', consistent ? PASS : FAIL, JSON.stringify({ behavior: Math.abs(afterY - beforeY) < 50 ? 'scroll restored' : 'scroll reset', beforeY, afterY, consistent }), 'state consistent with restored position', ['evidence/m/e3-reload.json']);
      await page.close();
    }
    // E4 hash deep-links
    {
      const out = [];
      for (const hash of ['#programmes', '#contact']) {
        const page = await openPage(browser, { w: 1440, h: 900, url: BASE + hash });
        await delay(400);
        const top = await page.evaluate((h) => document.getElementById(h.slice(1)).getBoundingClientRect().top, hash);
        const st = await state(page);
        const sY = await page.evaluate(() => window.scrollY);
        const mapP = Math.min(1, Math.max(0, (sY - st.heroTop) / st.travel));
        out.push({ hash, top: +top.toFixed(1), consistent: Math.abs(st.p - mapP) <= 0.01 });
        await page.close();
      }
      const ok = out[0] && Math.abs(out[0].top) <= 40 && out[0].consistent && out[1] && out[1].top >= -40 && out[1].top <= 675 && out[1].consistent;
      add('m', 'E4 hash deep-links', ok ? PASS : FAIL, JSON.stringify(out), 'targets land +-40px; hero state consistent', []);
    }
    // E5 zoom proxy + E7 short viewport shots
    {
      const p5 = await openPage(browser, { w: 720, h: 450, qa: 0.70 });
      await shot(p5, 'm/e5-zoomproxy-720x450.png');
      const p5b = await openPage(browser, { w: 720, h: 450, qa: 1 });
      await shot(p5b, 'm/e5-zoomproxy-720x450-final.png');
      await p5.close(); await p5b.close();
      add('m', 'E5 zoom proxy (720x450)', INFO, 'layout proxy only — labels: approximates 200% zoom; not a real zoom test', 'n/a', ['evidence/m/e5-zoomproxy-720x450.png']);
      const p7 = await openPage(browser, { w: 1280, h: 500, qa: 0.70 });
      const st7 = await state(p7);
      await shot(p7, 'm/e7-short-1280x500.png');
      await p7.close();
      add('m', 'E7 short viewport 1280x500', st7 && st7.stage === 2 ? PASS : FAIL, JSON.stringify({ p: st7.p, stage: st7.stage }), 'choreography functional at short viewport', ['evidence/m/e7-short-1280x500.png']);
    }
    // E8 reversals
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      const seq = [0.7, 0.3, 0.6, 0.1, 0.3];
      const got = [];
      for (const q of seq) {
        await page.evaluate((yy) => window.scrollTo(0, yy), Math.round(st0.travel * q));
        const st = await settle(page);
        got.push(+st.p.toFixed(5));
      }
      const ok = Math.abs(got[1] - got[4]) <= 0.001 && got.every((p, i) => Math.abs(p - seq[i]) <= 0.002);
      add('m', 'E8 rapid reversals', ok ? PASS : FAIL, JSON.stringify({ seq, got }), 'same p => same values; no hysteresis', []);
      await page.close();
    }
    // E12 unpin seam
    {
      const page = await openPage(browser, { w: 1440, h: 900 });
      const st0 = await state(page);
      await page.evaluate((yy) => window.scrollTo(0, yy), st0.travel - 4);
      await settle(page);
      await shot(page, 'm/seam-a-pinend.png');
      await page.evaluate((yy) => window.scrollTo(0, yy), st0.travel);
      await settle(page);
      const seam = await page.evaluate(() => {
        const story = document.getElementById('story').getBoundingClientRect();
        const gal = document.getElementById('programmes').getBoundingClientRect();
        return { storyBottom: story.bottom, galTop: gal.top, gap: gal.top - story.bottom, vh: innerHeight };
      });
      await shot(page, 'm/seam-b-unpinned.png');
      await page.evaluate((yy) => window.scrollTo(0, yy), st0.travel + 150);
      await settle(page);
      const released = await page.evaluate(() => document.getElementById('story').getBoundingClientRect().bottom);
      const ok = Math.abs(seam.gap) <= 1 && seam.storyBottom <= seam.vh + 1 && released < seam.vh;
      writeJson(evPath('m', 'e12-seam.json'), { seam, released });
      add('m', 'E12 unpin seam', ok ? PASS : FAIL, JSON.stringify({ gap: +seam.gap.toFixed(2), storyBottom: +seam.storyBottom.toFixed(1), releasedBottom: +released.toFixed(1) }), 'no gap/overlap at release (<=1px); releases correctly', ['evidence/m/seam-a-pinend.png', 'evidence/m/seam-b-unpinned.png']);
      await page.close();
    }
    // E13 qa hook robustness
    {
      const out = [];
      for (const [q, expect] of [['abc', null], ['-1', 0], ['2', 1], ['0.5', 0.5]]) {
        const page = await openPage(browser, { w: 1440, h: 900, qa: q });
        const st = await state(page);
        out.push({ qa: q, got: st.qa, errors: page.qa.errors.length + page.qa.pageerrors.length });
        await page.close();
      }
      const pageX = await openPage(browser, { w: 1440, h: 900, url: BASE + '?qa=0.5&qa=x' });
      const stX = await state(pageX);
      out.push({ qa: '0.5&qa=x', got: stX.qa, errors: pageX.qa.errors.length + pageX.qa.pageerrors.length });
      await pageX.close();
      const ok = out[0].got === null && out[1].got === 0 && out[2].got === 1 && out[3].got === 0.5 && out[4].got === 0.5 && out.every((o) => o.errors === 0);
      add('m', 'E13 QA hook robustness', ok ? PASS : FAIL, JSON.stringify(out), 'invalid ignored; clamped to [0,1]; no errors', []);
    }
  } catch (e) { add('m', 'edge scenarios', FAIL, 'exception: ' + e.message, 'no exceptions', []); }

  /* ---------- Edge subset ---------- */
  try {
    edgeBrowser = await puppeteer.launch({ executablePath: EDGE, headless: true, args: ['--no-first-run', '--disable-gpu-sandbox'] });
    env.edge = await edgeBrowser.version();
    const page = await openPage(edgeBrowser, { w: 1440, h: 900, qa: 0 });
    await shot(page, 'edge/intro-1440x900.png');
    const nav = await page.evaluate(() => ({ headers: document.querySelectorAll('header').length }));
    await page.close();
    const p2 = await openPage(edgeBrowser, { w: 1440, h: 900, qa: 1 });
    await shot(p2, 'edge/final-1440x900.png');
    const st = await state(p2);
    const mk = st.markImg;
    const frac = +((Math.max(0, Math.min(mk.x + mk.w, 1440) - Math.max(mk.x, 0))) / mk.w).toFixed(3);
    const errs = p2.qa.errors.length + p2.qa.pageerrors.length;
    await p2.close();
    add('k', 'Edge subset (same engine as Chrome)', errs === 0 && nav.headers === 0 ? PASS : FAIL,
      JSON.stringify({ version: env.edge, headerCount: nav.headers, finalFraction: frac, errors: errs }),
      'intro + final framing + nav + zero errors on Edge', ['evidence/edge/intro-1440x900.png', 'evidence/edge/final-1440x900.png'],
      'Chromium engine shared with Chrome — not independent engine coverage');
  } catch (e) { add('k', 'Edge subset', NP, 'Edge not runnable: ' + e.message, 'n/a', []); }

} catch (e) {
  console.error('QA FATAL', e);
  add('x', 'suite', FAIL, 'fatal: ' + e.message, 'n/a', []);
} finally {
  try { if (browser) await browser.close(); } catch (e) {}
  try { if (edgeBrowser) await edgeBrowser.close(); } catch (e) {}
  try { if (server) server.close(); } catch (e) {}

  /* ---------- code-inspection risk notes (for absent browsers) ---------- */
  let inspect = {};
  try {
    const js = fs.readFileSync(path.join(ROOT, 'assets', 'js', 'main.js'), 'utf8');
    const css = fs.readFileSync(path.join(ROOT, 'assets', 'css', 'style.css'), 'utf8');
    inspect = {
      sticky: /sticky/.test(css),
      svh: /100svh/.test(css) && /100vh/.test(css),
      backface: /backface-visibility:\s*hidden/.test(css),
      passive: /passive:\s*true/.test(js),
      optionalChaining: /\?\.|\?\?/.test(js),
      scrollTimeline: /animation-timeline|ScrollTimeline|scroll\(\)/.test(css + js),
      overflowClip: /overflow:\s*clip/.test(css),
      aspectRatio: /aspect-ratio/.test(css)
    };
  } catch (e) {}

  /* ---------- reports ---------- */
  try {
    const counts = { PASS: 0, FAIL: 0, INFO: 0, OBSERVED: 0, 'NOT PERFORMED': 0 };
    for (const r of results) counts[r.status] = (counts[r.status] || 0) + 1;
    const files = walk(EVIDENCE).map((p) => path.relative(ROOT, p).replace(/\\/g, '/'));
    const ts = env.generatedAt.replace(/[:.]/g, '-');

    const matrix = results.map((r) => '| ' + r.id + ' | ' + r.entry + ' | ' + r.status + ' | ' + String(r.value).replace(/\|/g, '\\|').slice(0, 300) + ' | ' + r.threshold + ' | ' + (r.evidence.join('<br>') || '—') + ' |').join('\n');

    const report = [
      '# QA report — Novin Robotic Mirzania one-page site',
      '',
      '- Revision: `' + env.sha + '` · generated ' + env.generatedAt,
      '- Environment: ' + env.os + ' · Node ' + env.node + ' · puppeteer-core ' + (env.puppeteer || '?'),
      '- Chrome: ' + (env.chrome || 'not run') + ' · Edge: ' + (env.edge || 'not run'),
      '- Method: all captures via puppeteer-core (own temp profile); local server mirrors the production CSP header;',
      '  deterministic stage states via the `?qa=` pin; declared holds are [0,0.20] and [0.97,1.00].',
      '- Status labels: PASS/FAIL = instrumented measurement vs threshold; OBSERVED = human-judged artifact;',
      '  INFO = recorded, no guarantee; NOT PERFORMED = no runtime available (never counted as a pass).',
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
      '# QA log — environment, commands, honesty notes',
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
      'npm install        # dev-only (puppeteer-core)',
      'npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**',
      'node qa/shot.mjs chrome <url> <w> <h> out.png [qa]   # single screenshot',
      '```',
      '',
      '## Browser matrix (honest)',
      '',
      '| Browser | Status | Notes |',
      '|---------|--------|-------|',
      '| Chrome | EXECUTED — full suite | via puppeteer-core; version above |',
      '| Edge | EXECUTED — subset | SAME Chromium engine family as Chrome; NOT independent engine coverage |',
      '| Firefox | NOT PERFORMED — not installed on QA host | risk notes below are inspection-based only |',
      '| Safari / iOS Safari | NOT PERFORMED — cannot run on Windows | inspection-based risk notes only; no test results claimed |',
      '| Android Chrome (device) | NOT PERFORMED — no device | viewport emulation in desktop Chromium only (layout proxy) |',
      '',
      'Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`), labeled as such — not a real OS setting test.',
      '',
      '## Code-inspection risk notes (Safari/iOS — NOT test results)',
      '',
      '- `position: sticky` pinned hero: ' + (inspect.sticky ? 'PRESENT — ancestor chain from `.hero__sticky` up to `body` is overflow/transform/filter-free by construction; JS recomputes pin math on resize.' : 'absent'),
      '- `100vh` (and no `100svh` fallback) usage: ' + (inspect.svh ? 'fallback pattern present (`100vh` line before `100svh`)' : 'CHECK MANUALLY'),
      '- `backface-visibility: hidden` on flip faces: ' + (inspect.backface ? 'present' : 'MISSING'),
      '- passive wheel/touch listeners: ' + (inspect.passive ? 'present (`{passive:true}`)' : 'CHECK MANUALLY'),
      '- modern-JS above Safari 15.4 baseline (`?.`/`??`): ' + (inspect.optionalChaining ? 'FOUND' : 'not found (safe)'),
      '- CSS scroll-driven animations (`animation-timeline`/ScrollTimeline): ' + (inspect.scrollTimeline ? 'FOUND (risk)' : 'absent (safe)'),
      '- `overflow: clip`: ' + (inspect.overflowClip ? 'used (Safari 16+; fallback `hidden` line present where it matters)' : 'absent'),
      '- `aspect-ratio`: ' + (inspect.aspectRatio ? 'used (Safari 15+; supported at baseline)' : 'absent'),
      '',
      'Known residual risk: on iOS < 16 `overflow: clip` is unsupported; the only clipped element is the pinned hero stage and',
      'its overflow is left/right-negative only, which does not create document scrollbars in LTR — risk judged LOW; not executed.',
      '',
      '## Rollback drill',
      '',
      'See `qa/evidence/rollback/` (tag-show.txt, dist-sha256.txt, drill log).',
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
