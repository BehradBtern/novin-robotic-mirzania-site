import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setCacheEnabled(false);
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86&cb=" + Date.now(), { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 1100));
const m = await p.evaluate(() => {
  const g = window.SITE_CONTENT.gallery;
  const faces = [...document.querySelectorAll(".gallery__face img")].map(i => i.getAttribute("src").replace(/^.*\//, "").split("?")[0]);
  return { n: g.length, srcs: faces, credits: [...new Set(g.map(x => x.credit))], loaded: [...document.querySelectorAll(".gallery__face img")].filter(i => i.naturalWidth > 0).length, title: document.querySelector(".gallery__title").textContent.trim() };
});
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/prod-ig-1440.png" });
console.log("PROD", JSON.stringify(m), "errs", errs.length);
await b.close();
