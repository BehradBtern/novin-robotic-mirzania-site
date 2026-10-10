// qa/roundtrip-test.mjs — supplementary verification for the current site.
// Against a served COPY of the site (repo untouched):
//   (a) editing a footer string in content.js only -> appears on reload, no rebuild;
//   (b) swapping the logo-mark.svg asset -> page loads clean and the landing still centres in the footer.
// Run: node qa/roundtrip-test.mjs   (writes evidence to qa/evidence/f/roundtrip*)
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer-core';
import { CHROME, ROOT, TMP, delay, serve } from './lib.mjs';

const PORT = 8125;
const tmp = path.join(TMP, 'roundtrip');
fs.rmSync(tmp, { recursive: true, force: true });
for (const d of ['assets/logo', 'assets/fonts', 'assets/flags', 'assets/css', 'assets/js']) {
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
for (const f of fs.readdirSync(path.join(ROOT, 'assets/fonts'))) {
  fs.copyFileSync(path.join(ROOT, 'assets/fonts', f), path.join(tmp, 'assets/fonts', f));
}
for (const f of fs.readdirSync(path.join(ROOT, 'assets/flags'))) {
  fs.copyFileSync(path.join(ROOT, 'assets/flags', f), path.join(tmp, 'assets/flags', f));
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
mark = mark.replace(/#[0-9A-Fa-f]{6}/g, '#7AD3D9');
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
  const sig = await page.evaluate(() => {
    const el = document.getElementById('footer-signature');
    const r = el.getBoundingClientRect();
    return { w: r.width };
  });
  results.checks.signatureVisible = sig.w > 300;
  results.checks.signatureWidth = Math.round(sig.w);
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
  results.checks.signatureVisible === true;
fs.writeFileSync(path.join(evidenceDir, 'roundtrip.json'), JSON.stringify(results, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log('ROUNDTRIP', results.pass ? 'PASS' : 'FAIL', JSON.stringify({
  editedBlurbVisible: results.checks.editedBlurbVisible,
  headerCount: results.checks.headerCount,
  errors: results.checks.errors,
  markLoaded: results.checks.markLoaded,
  logoSwapErrors: results.checks.logoSwapErrors,
  signatureVisible: results.checks.signatureVisible,
  signatureWidth: results.checks.signatureWidth
}));
process.exitCode = results.pass ? 0 : 1;
