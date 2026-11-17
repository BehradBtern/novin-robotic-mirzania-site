import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 900));
const faces = await p.$$(".gallery__face");
// direct: click each face, read dialog text + img src, escape
const out = [];
for (const i of [5, 6, 11, 12, 13]) {
  const before = await p.evaluate(() => document.querySelector(".gallery__lightbox").open);
  try { await faces[i].click(); } catch (e) { out.push({ i, err: "click failed" }); continue; }
  await new Promise(r => setTimeout(r, 450));
  const info = await p.evaluate(() => {
    const d = document.querySelector(".gallery__lightbox");
    const img = d.querySelector("img");
    return { open: d.open, text: (d.innerText || "").replace(/\n+/g, " | ").trim().slice(0, 120), src: img ? img.getAttribute("src") : null };
  });
  out.push({ i, before, ...info });
  await p.keyboard.press("Escape");
  await new Promise(r => setTimeout(r, 300));
}
console.log(JSON.stringify(out, null, 1));
await b.close();
