import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const out = {};
for (const [w, h] of [[1280, 800], [1920, 1080]]) {
  const p = await b.newPage();
  await p.setViewport({ width: w, height: h, deviceScaleFactor: 1 });
  await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
  await new Promise(r => setTimeout(r, 1000));
  const m = await p.evaluate(() => {
    const f = [...document.querySelectorAll(".gallery__face")].map(e => e.getBoundingClientRect()).filter(r => r.width > 40 && r.right > 0 && r.left < innerWidth);
    const xs = f.map(r => [Math.round(r.left), Math.round(r.right)]).sort((a, b) => a[0] - b[0]);
    const mk = document.getElementById("hero-mark").getBoundingClientRect();
    return { strip: xs.length ? [xs[0][0], xs[xs.length - 1][1]] : null, faces: document.querySelectorAll(".gallery__face").length, mark: Math.round(mk.left) };
  });
  out[w] = m;
  await p.screenshot({ path: `${W}/prod-g60-${w}.png` });
  await p.close();
}
// lightbox on a replaced frame
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 900));
const faces = await p.$$(".gallery__face");
await faces[Math.min(12, faces.length - 1)].click();
await new Promise(r => setTimeout(r, 600));
const lb = await p.evaluate(() => {
  const d = document.querySelector(".gallery__lightbox");
  const img = d && d.querySelector("img");
  return { open: d ? d.open || getComputedStyle(d).display !== "none" : false, caption: (d && d.querySelector(".gallery__lb-caption")?.textContent || "").trim(), src: img ? img.getAttribute("src") : null, w: img ? img.naturalWidth : 0 };
});
console.log("GEOM", JSON.stringify(out));
console.log("LIGHTBOX", JSON.stringify(lb));
await p.screenshot({ path: `${W}/prod-g60-lightbox.png` });
await b.close();
