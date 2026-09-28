// qa/lib.mjs — shared helpers for the QA harness: local server (production-mirror
// CSP), page factory, evidence paths, tiny transform parsers, writers.
import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

export const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const ROOT = path.resolve(__dirname, '..');
export const EVIDENCE = path.join(__dirname, 'evidence');
export const TMP = path.join(__dirname, '.tmp');
export const PORT = Number(process.env.QA_PORT || 8123);
export const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
export const EDGE = process.env.EDGE_PATH || 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

export const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8'
};

export const CSP = "default-src 'self'; img-src 'self'; style-src 'self'; script-src 'self'";

export function serve(dir, port, { csp = true } = {}) {
  const server = http.createServer((req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost');
      let p = decodeURIComponent(url.pathname);
      if (p === '/') p = '/index.html';
      const file = path.normalize(path.join(dir, p));
      if (!file.startsWith(dir)) { res.writeHead(403); res.end('Forbidden'); return; }
      fs.readFile(file, (err, data) => {
        if (err) { res.writeHead(404); res.end('Not found: ' + p); return; }
        const headers = {
          'Content-Type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
          'Cache-Control': 'no-store'
        };
        if (csp) headers['Content-Security-Policy'] = CSP;
        res.writeHead(200, headers);
        res.end(data);
      });
    } catch (e) {
      res.writeHead(500); res.end('Server error');
    }
  });
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, () => resolve(server));
  });
}

export function mkdirp(p) { fs.mkdirSync(p, { recursive: true }); }

export function evPath(...segments) {
  const p = path.join(EVIDENCE, ...segments);
  mkdirp(path.dirname(p));
  return p;
}

export function delay(ms) { return new Promise((r) => setTimeout(r, ms)); }

export async function openPage(browser, opts = {}) {
  const {
    w = 1440, h = 900, qa, reduced = false, dpr = 1,
    url = 'http://localhost:' + PORT + '/', fullPageReady = true
  } = opts;
  const page = await browser.newPage();
  const info = { errors: [], pageerrors: [], failed: [], requests: [] };
  page.on('console', (m) => { if (m.type() === 'error') info.errors.push(m.text()); });
  page.on('pageerror', (e) => info.pageerrors.push(e.message));
  page.on('request', (r) => info.requests.push(r.url()));
  page.on('requestfailed', (r) => info.failed.push(r.url() + ' :: ' + (r.failure() ? r.failure().errorText : '')));
  await page.setViewport({ width: w, height: h, deviceScaleFactor: dpr });
  if (reduced) await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'reduce' }]);
  let target = url;
  if (qa !== undefined && qa !== null) {
    const u = new URL(url);
    u.searchParams.set('qa', String(qa));
    target = u.href;
  }
  await page.goto(target, { waitUntil: 'networkidle0', timeout: 60000 });
  if (fullPageReady) {
    await page.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 });
    await page.evaluate(() => document.fonts && document.fonts.ready);
    await delay(250);
  }
  page.qa = info;
  return page;
}

export async function shot(page, rel) {
  const p = evPath(...rel.split('/'));
  await page.screenshot({ path: p });
  return p;
}

export async function shotFull(page, rel) {
  const p = evPath(...rel.split('/'));
  await page.screenshot({ path: p, fullPage: true });
  return p;
}

export async function state(page) { return page.evaluate(() => window.__heroState()); }

export async function settle(page, timeout = 2000) {
  const t0 = Date.now();
  for (;;) {
    const st = await state(page);
    if (st) {
      const mapP = Math.min(1, Math.max(0, (st.scrollY - st.heroTop) / st.travel));
      const acked = Math.abs(st.pTarget - mapP) <= 0.0005;
      const done = acked && Math.abs(st.p - st.pTarget) <= 0.0005;
      if (done) return st;
    }
    if (Date.now() - t0 > timeout) return st;
    await delay(40);
  }
}

export function writeJson(file, obj) { fs.writeFileSync(file, JSON.stringify(obj, null, 2), 'utf8'); }

/* transform string parsers */
export function parseScale(t) { const m = /scale\(([-\d.]+)\)/.exec(t || ''); return m ? parseFloat(m[1]) : null; }
export function parseTY(t) { const m = /translateY\(([-\d.]+)px\)/.exec(t || ''); return m ? parseFloat(m[1]) : null; }
export function parseRotY(t) { const m = /rotateY\(([-\d.]+)deg\)/.exec(t || ''); return m ? parseFloat(m[1]) : null; }
export function parseMarkT(t) {
  const m = /translate\(([-\d.]+)px,\s*([-\d.]+)px\)\s*rotate\(([-\d.]+)deg\)\s*scale\(([-\d.]+)\)/.exec(t || '');
  return m ? { tx: +m[1], ty: +m[2], rz: +m[3], k: +m[4] } : null;
}
