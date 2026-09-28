import fs from 'fs';

// render-exact.mjs <svgPath> <outPng> <W> <H>
// Renders an SVG at exactly W×H pixels with a transparent background.
import puppeteer from 'puppeteer-core';

const CHROME = process.env.CHROME_PATH || 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const [, , svgPath, outPng, wStr, hStr] = process.argv;
const w = parseInt(wStr, 10);
const h = parseInt(hStr, 10);

let svg = fs.readFileSync(svgPath, 'utf8');
if (svg.startsWith('<?xml')) svg = svg.split('?>').slice(1).join('?>');
svg = svg.replace(/\swidth="[^"]*"/, '').replace(/\sheight="[^"]*"/, '');
svg = svg.replace('<svg ', `<svg width="${w}" height="${h}" `);

const html = `<!doctype html><html><head><meta charset="utf-8"><style>html,body{margin:0;padding:0;background:transparent}svg{display:block}</style></head><body>${svg}</body></html>`;

const browser = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--no-first-run'] });
const page = await browser.newPage();
await page.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
await page.setContent(html, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 250));
await page.screenshot({ path: outPng, omitBackground: true });
await browser.close();
console.log('RENDERED', outPng, w, h);
