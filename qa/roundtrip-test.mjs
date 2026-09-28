// qa/roundtrip-test.mjs — supplementary verification for the v1.1.0 site.
// Against a served COPY of the site (repo untouched):
//   (a) editing one footer string in content.js only -> appears on reload, no rebuild;
//   (b) swapping the logo-mark.svg asset -> page loads clean and the dock still lands half-visible.
// Run: node qa/roundtrip-test.mjs   (writes evidence to qa/evidence/f/roundtrip*)
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { CHROME, ROOT, TMP, delay, serve } from './lib.mjs';

const PORT = 8125;
const tmp = path.join(TMP, 'roundtrip');
fs.rmSync(tmp, { recursive: true, force: true });
for (const d of ['assets/logo', 'assets/css', 'assets/js']) {
  fs.mkdirSync(path.join(tmp, d), { recursive: true });
}
for (const f of ['index.html', 'server.js', 'content.js']) {
  fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
}
fs.copyFileSync(path.join(ROOT, 'assets/css/style.css'), path.join(tmp, 'assets/css/style.css'));
fs.copyFileSync(path.join(ROOT, 'assets/js/main.js'), path.join(tmp, 'assets/js/main.js'));
fs.copyFileSync(path.join(ROOT, 'assets/favicon.svg'), path.join(tmp, 'assets/favicon.svg'));
for (const f of fs.readdirSync(path.join(ROOT, 'assets/logo'))) {
  fs.copyFileSync(path.join(ROOT, 'assets/logo', f), path.join(tmp, 'assets/logo', f));
}

// (a) edit ONE footer string in content.js only
const EDITED = 'EDITED BLURB (content round-trip test).';
let content = fs.readFileSync(path.join(tmp, 'content.js'), 'utf8');
const beforeA = content;
content = content.replace('Novin Robotic Mirzania is an applied robotics institute. We research, teach, and partner with people who want machines to be useful, understandable, and well made.', EDITED);
if (content === beforeA) throw new Error('footer blurb not found for edit');
fs.writeFileSync(path.join(tmp, 'content.js'), content, 'utf8');

// (b) swap the mark asset (recolour fill)
let mark = fs.readFileSync(path.join(tmp, 'assets/logo/logo-mark.svg'), 'utf8');
const beforeB = mark;
mark = mark.split('#56C1C9').join('#7AD3D9');
if (mark === beforeB) throw new Error('logo colour not found for swap');
fs.writeFileSync(path.join(tmp, 'assets/logo/logo-mark.svg'), mark, 'utf8');

const evidenceDir = path.join(ROOT, 'qa', 'evidence', 'f');
fs.mkdirSync(evidenceDir, { recursive: true });

const server = await serve(tmp, PORT);
const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
const results = { editedText: EDITED, filesChanged: ['content.js', 'assets/logo/logo-mark.svg'], checks: {} };

{
  const page = await browser.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'networkidle0' });
  await page.waitForFunction('document.documentElement.dataset.ready === "true"');
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await delay(600);
  const dom = await page.evaluate(() => ({
    blurb: document.getElementById('footer-blurb').textContent,
    headers: document.querySelectorAll('header').length
  }));
  results.checks.editedBlurbVisible = dom.blurb === EDITED;
  results.checks.domBlurb = dom.blurb;
  results.checks.headerCount = dom.headers;
  results.checks.errors = errs.length;
  await page.screenshot({ path: path.join(evidenceDir, 'roundtrip-blurb.png') });
  await page.close();
}

{
  const page = await browser.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:' + PORT + '/', { waitUntil: 'networkidle0' });
  await page.waitForFunction('document.documentElement.dataset.ready === "true"');
  await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
  await delay(700);
  const em = await page.evaluate(() => {
    const el = document.getElementById('footer-endmark');
    const r = el.getBoundingClientRect();
    const ft = document.getElementById('footer').getBoundingClientRect();
    return { x: r.x, y: r.y, w: r.width, h: r.height, bandCy: ft.top + ft.height / 2, vw: innerWidth, vh: innerHeight };
  });
  const frac = +((Math.max(0, Math.min(em.y + em.h, em.vh) - Math.max(em.y, 0))) / em.h).toFixed(3);
  results.checks.landingVisibleFrac = frac;
  results.checks.landingCenter = [+(em.x + em.w / 2).toFixed(1), +(em.y + em.h / 2).toFixed(1)];
  results.checks.bandCy = +em.bandCy.toFixed(1);
  const loaded = await page.evaluate(() => {
    const i = document.getElementById('hero-mark');
    return i.decode().then(() => true).catch(() => i.complete);
  });
  results.checks.markLoaded = loaded === true;
  results.checks.logoSwapErrors = errs.length;
  await page.screenshot({ path: path.join(evidenceDir, 'roundtrip-logoswap-dock.png') });
  await page.close();
}

await browser.close();
server.close();
results.pass =
  results.checks.editedBlurbVisible === true &&
  results.checks.headerCount === 0 &&
  results.checks.errors === 0 &&
  results.checks.markLoaded === true &&
  results.checks.logoSwapErrors === 0 &&
  results.checks.landingVisibleFrac >= 0.9 &&
  Math.abs(results.checks.landingCenter[0] - 720) <= 6;
fs.writeFileSync(path.join(evidenceDir, 'roundtrip.json'), JSON.stringify(results, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('ROUNDTRIP', results.pass ? 'PASS' : 'FAIL', JSON.stringify({
  editedBlurbVisible: results.checks.editedBlurbVisible,
  headerCount: results.checks.headerCount,
  errors: results.checks.errors,
  markLoaded: results.checks.markLoaded,
  logoSwapErrors: results.checks.logoSwapErrors,
  landingVisibleFrac: results.checks.landingVisibleFrac,
  landingCenter: results.checks.landingCenter
}));
process.exitCode = results.pass ? 0 : 1;
