import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 900));
const res = [];
for (const target of ["g13.jpg", "g12.jpg", "g6.jpg"]) {
  const idx = await p.evaluate(t => [...document.querySelectorAll(".gallery__face img")].findIndex(i => (i.getAttribute("src") || "").endsWith(t)), target);
  if (idx < 0) { res.push({ target, err: "not found" }); continue; }
  const faces = await p.$$(".gallery__face");
  await faces[idx].click();
  await new Promise(r => setTimeout(r, 500));
  const t = await p.evaluate(() => { const d = document.querySelector(".gallery__lightbox"); const c = d.querySelector("[class*='caption']") || d.querySelector("figcaption"); return c ? c.textContent.trim() : ""; });
  res.push({ target, caption: t });
  await p.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 350));
}
console.log(JSON.stringify(res, null, 1));
await p.screenshot({ path: W + "/prod-g61-check.png" });
await b.close();
