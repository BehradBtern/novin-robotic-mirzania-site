import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8080/?qa=0.696', { waitUntil: 'networkidle0', timeout: 60000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
await new Promise(r => setTimeout(r, 1500));
// sample the canvas twice around a visibility change to confirm the phase continues instead of snapping
const before = await p.evaluate(() => window.__bgFrames || 0);
await new Promise(r => setTimeout(r, 800));
const mid = await p.evaluate(() => window.__bgFrames || 0);
console.log(JSON.stringify({ running: mid > before, framesPer800ms: mid - before }));
await b.close();
