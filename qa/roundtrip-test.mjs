// qa/roundtrip-test.mjs — supplementary post-release verification.
// Proves, against a served COPY of the site (the repo itself is untouched):
//   (a) editing one headline in content.js only -> the edit appears on reload, no rebuild;
//   (b) swapping the logo-mark.svg asset -> the choreography still runs, zero console errors.
// Run: node qa/roundtrip-test.mjs   (writes evidence to qa/evidence/f/roundtrip*)
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { CHROME, ROOT, TMP, delay, serve } from './lib.mjs';

const PORT = 8125;
const tmp = path.join(TMP, 'roundtrip');
fs.rmSync(tmp, { recursive: true, force: true });
for (const d of ['assets/logo', 'assets/css', 'assets/js', 'assets/img']) {
  fs.mkdirSync(path.join(tmp, d), { recursive: true });
}
for (const f of ['index.html', 'server.js', 'content.js']) {
  fs.copyFileSync(path.join(ROOT, f), path.join(tmp, f));
}
fs.copyFileSync(path.join(ROOT, 'assets/css/style.css'), path.join(tmp, 'assets/css/style.css'));
fs.copyFileSync(path.join(ROOT, 'assets/js/main.js'), path.join(tmp, 'assets/js/main.js'));
fs.copyFileSync(path.join(ROOT, 'assets/favicon.svg'), path.join(tmp, 'assets/favicon.svg'));
for (const f of fs.readdirSync(path.join(ROOT, 'assets/img'))) {
  fs.copyFileSync(path.join(ROOT, 'assets/img', f), path.join(tmp, 'assets/img', f));
}
for (const f of fs.readdirSync(path.join(ROOT, 'assets/logo'))) {
  fs.copyFileSync(path.join(ROOT, 'assets/logo', f), path.join(tmp, 'assets/logo', f));
}

// (a) edit ONE headline in content.js only
const EDITED = 'EDITED HEADLINE (content round-trip test)';
let content = fs.readFileSync(path.join(tmp, 'content.js'), 'utf8');
const beforeA = content;
content = content.replace('An institute where robotics research meets practical training', EDITED);
if (content === beforeA) throw new Error('headline not found for edit');
fs.writeFileSync(path.join(tmp, 'content.js'), content, 'utf8');

// (b) swap the mark asset (recolour fill)
let mark = fs.readFileSync(path.join(tmp, 'assets/logo/logo-mark.svg'), 'utf8');
const beforeB = mark;
mark = mark.split('fill="#56C1C9"').join('fill="#7AD3D9"');
if (mark === beforeB) throw new Error('logo fill not found for swap');
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
  await page.goto('http://localhost:' + PORT + '/?qa=0.70', { waitUntil: 'networkidle0' });
  await page.waitForFunction('document.documentElement.dataset.ready === "true"');
  await delay(300);
  const dom = await page.evaluate(() => ({
    headline: document.getElementById('hero-left-headline').textContent,
    headers: document.querySelectorAll('header').length
  }));
  results.checks.headlineEditedVisible = dom.headline === EDITED;
  results.checks.domHeadline = dom.headline;
  results.checks.headerCount = dom.headers;
  results.checks.headlineErrors = errs.length;
  await page.screenshot({ path: path.join(evidenceDir, 'roundtrip-headline.png') });
  await page.close();
}

{
  const page = await browser.newPage();
  const errs = [];
  page.on('console', (m) => { if (m.type() === 'error') errs.push(m.text()); });
  page.on('pageerror', (e) => errs.push(e.message));
  await page.setViewport({ width: 1440, height: 900 });
  await page.goto('http://localhost:' + PORT + '/?qa=1', { waitUntil: 'networkidle0' });
  await page.waitForFunction('document.documentElement.dataset.ready === "true"');
  await delay(300);
  const st = await page.evaluate(() => window.__heroState());
  const mk = st.markImg;
  const frac = (Math.max(0, Math.min(mk.x + mk.w, 1440) - Math.max(mk.x, 0))) / mk.w;
  const loaded = await page.evaluate(() => {
    const i = document.getElementById('hero-mark');
    return i.decode().then(() => true).catch(() => i.complete);
  });
  results.checks.markLoaded = loaded === true;
  results.checks.finalFraction = +frac.toFixed(3);
  results.checks.logoSwapErrors = errs.length;
  await page.screenshot({ path: path.join(evidenceDir, 'roundtrip-logoswap-final.png') });
  await page.close();
}

await browser.close();
server.close();
results.pass =
  results.checks.headlineEditedVisible === true &&
  results.checks.headerCount === 0 &&
  results.checks.headlineErrors === 0 &&
  results.checks.markLoaded === true &&
  results.checks.logoSwapErrors === 0 &&
  Math.abs(results.checks.finalFraction - 0.5) <= 0.05;
fs.writeFileSync(path.join(evidenceDir, 'roundtrip.json'), JSON.stringify(results, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('ROUNDTRIP', results.pass ? 'PASS' : 'FAIL', JSON.stringify({
  headlineEditedVisible: results.checks.headlineEditedVisible,
  headerCount: results.checks.headerCount,
  headlineErrors: results.checks.headlineErrors,
  markLoaded: results.checks.markLoaded,
  logoSwapErrors: results.checks.logoSwapErrors,
  finalFraction: results.checks.finalFraction
}));
process.exitCode = results.pass ? 0 : 1;
