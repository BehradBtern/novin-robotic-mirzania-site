import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/", { waitUntil: "networkidle0", timeout: 60000 });
await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
await new Promise(r => setTimeout(r, 900));
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/footer-credit-153.png" });
const t = await p.evaluate(() => ({
  emailRow: !!document.getElementById("footer-email-row"),
  emailEl: !!document.getElementById("footer-email"),
  photocredit: (document.getElementById("footer-photocredit") || {}).textContent,
  contentKeys: Object.keys(window.SITE_CONTENT.footer.contact)
}));
console.log(JSON.stringify(t));
await b.close();
