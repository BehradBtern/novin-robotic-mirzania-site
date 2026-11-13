import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/", { waitUntil: "networkidle0", timeout: 90000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 800));
const t = await p.evaluate(() => ({
  address: document.getElementById("footer-address").textContent,
  emailRowHidden: document.getElementById("footer-email-row").hidden,
  placeholders: /example\.com|\+00 000|Example City|Draft placeholder/i.test(document.body.innerText)
}));
console.log(JSON.stringify(t));
await b.close();
