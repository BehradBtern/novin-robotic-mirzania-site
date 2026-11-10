import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8139, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8139/', { waitUntil: 'networkidle0', timeout: 60000 });
await new Promise(r => setTimeout(r, 500));
const t = await p.evaluate(() => ({
  legalEl: (document.getElementById('footer-legal')||{}).textContent,
  contentLegal: window.SITE_CONTENT.footer.legal,
  credit: (document.getElementById('footer-credit')||{}).textContent,
  emailRowHidden: (document.getElementById('footer-email-row')||{}).hidden,
  footerInner: (document.getElementById('footer')||{}).innerText?.slice(0, 400)
}));
console.log(JSON.stringify(t, null, 1));
await b.close(); server.close();
