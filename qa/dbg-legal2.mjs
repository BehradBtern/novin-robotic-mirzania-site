import puppeteer from 'puppeteer-core';
import { serve, CHROME, ROOT } from './lib.mjs';
const server = await serve(ROOT, 8140, { csp: true });
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto('http://localhost:8140/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.waitForFunction('document.documentElement.dataset.ready === "true"', { timeout: 20000 }).catch(() => {});
// mimic the QA flow: click the three explore links
for (let i = 0; i < 3; i++) {
  await p.evaluate((idx) => { const a = document.querySelectorAll('#footer-explore a')[idx]; if (a) a.click(); }, i);
  await new Promise(r => setTimeout(r, 350));
}
const t = await p.evaluate(() => {
  const el = document.getElementById('footer-legal');
  const c = window.SITE_CONTENT.footer;
  return {
    dom: el ? el.textContent : null,
    domCodes: el ? Array.from(el.textContent).map(ch => ch.charCodeAt(0)).slice(0, 6) : null,
    content: c.legal,
    contentCodes: Array.from(c.legal).map(ch => ch.charCodeAt(0)).slice(0, 6),
    equal: el ? el.textContent === c.legal : false
  };
});
console.log(JSON.stringify(t, null, 1));
await b.close(); server.close();
