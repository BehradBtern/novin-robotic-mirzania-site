import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
for (const q of [0.70, 0.82, 0.90, 0.98]) {
  await p.goto("http://localhost:8080/?qa=" + q, { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise(r => setTimeout(r, 700));
  const m = await p.evaluate(() => {
    const g = document.getElementById("gallery");
    const cs = getComputedStyle(g);
    return { opacity: +cs.opacity, live: g.classList.contains("is-live"), loaded: Array.from(document.querySelectorAll(".gallery__face img")).filter(i => i.naturalWidth > 0).length };
  });
  console.log("qa=" + q, JSON.stringify(m));
  if (Math.abs(q - 0.90) < 0.001) await p.screenshot({ path: W + "/gallery-phase-090.png" });
}
console.log("errs", errs.slice(0, 2));
await b.close();
