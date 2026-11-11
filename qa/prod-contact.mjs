import puppeteer from 'puppeteer-core';
import { CHROME } from './lib.mjs';
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errs = []; p.on('console', m => { if (m.type()==='error') errs.push(m.text()); });
await p.goto('https://novin-robotic-mirzania-site.vercel.app/', { waitUntil: 'networkidle0', timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 1000));
const t = await p.evaluate(() => ({
  contact: document.getElementById('contact').innerText,
  legal: document.getElementById('footer-legal').textContent,
  credit: document.getElementById('footer-credit').textContent,
  emailRowHidden: document.getElementById('footer-email-row').hidden,
  phoneHref: document.getElementById('footer-phone').getAttribute('href'),
  mobileHref: document.getElementById('footer-mobile').getAttribute('href'),
  igHref: document.getElementById('footer-instagram').getAttribute('href'),
  placeholders: /example\.com|\+00 000|Example City|Draft placeholder/i.test(document.body.innerText)
}));
await p.screenshot({ path: 'C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/prod-footer-contact.png' });
console.log(JSON.stringify(t, null, 1), 'errors:', errs.length);
await b.close();
