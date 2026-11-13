import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const URL = "https://novin-robotic-mirzania-site.vercel.app/";
const IPAD = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
async function probe(w, h, ua, label) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1, hasTouch: true });
  await p.setUserAgent(ua);
  const errs = []; p.on("pageerror", e => errs.push(e.message));
  await p.goto(URL + "?qa=0.696", { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise(r => setTimeout(r, 500));
  const m = await p.evaluate(() => {
    const gated = document.documentElement.classList.contains("is-gated");
    const out = { gated };
    if (!gated) {
      const credits = Array.from(document.querySelectorAll(".hp-photo-credit")).map(c => c.textContent);
      const ph = document.querySelector(".hp-photo");
      let maxRight = 0;
      document.querySelectorAll(".hp-row").forEach(r => r.querySelectorAll(".hp-year,.hp-flag,.hp-name,.hp-rank").forEach(el => {
        const rr = el.getBoundingClientRect(); if (rr.right > maxRight) maxRight = rr.right;
      }));
      out.credits = credits;
      out.gap = Math.round(ph.getBoundingClientRect().left - maxRight);
    }
    out.emailRow = !!document.getElementById("footer-email-row");
    out.footerCredit = (document.getElementById("footer-photocredit") || {}).textContent;
    return out;
  });
  await p.close();
  return { label, vp: w + "x" + h, ...m, errs: errs.length };
}
console.log("PROD", JSON.stringify(await probe(1440, 900, "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36", "desktop")));
console.log("PROD", JSON.stringify(await probe(1104, 884, IPAD, "foldable landscape")));
console.log("PROD", JSON.stringify(await probe(884, 1104, IPAD, "foldable portrait")));
console.log("PROD", JSON.stringify(await probe(1024, 768, IPAD, "iPad landscape")));
await b.close();
