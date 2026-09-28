// Single-screenshot CLI for QA and the rollback drill.
// Usage: node qa/shot.mjs [chrome|edge] <url> <w> <h> <outfile> [qa]
import puppeteer from 'puppeteer-core';
import path from 'path';
import { CHROME, EDGE } from './lib.mjs';

const [, , browserArg = 'chrome', url, w = '1440', h = '900', out = 'qa-shot.png', qa] = process.argv;
const exe = browserArg === 'edge' ? EDGE : CHROME;

const b = await puppeteer.launch({ executablePath: exe, headless: true, args: ['--no-first-run'] });
const p = await b.newPage();
await p.setViewport({ width: +w, height: +h, deviceScaleFactor: 1 });
let target = url;
if (qa != null) {
  const u = new URL(url);
  u.searchParams.set('qa', qa);
  target = u.href;
}
await p.goto(target, { waitUntil: 'networkidle0', timeout: 60000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
await p.evaluate(() => document.fonts && document.fonts.ready);
await new Promise((r) => setTimeout(r, 300));
await p.screenshot({ path: out });
await b.close();
console.log('SHOT', path.resolve(out));
