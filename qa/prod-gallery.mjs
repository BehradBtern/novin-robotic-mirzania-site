import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const URL = "https://novin-robotic-mirzania-site.vercel.app/";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto(URL, { waitUntil: "networkidle0", timeout: 90000 });
await p.evaluate(() => document.getElementById("gallery").scrollIntoView({ block: "center" }));
await new Promise(r => setTimeout(r, 1500));
const st = await p.evaluate(() => {
  const faces = document.querySelectorAll(".gallery__face");
  const imgs = Array.from(document.querySelectorAll(".gallery__face img"));
  return { faces: faces.length, loaded: imgs.filter(i => i.naturalWidth > 0).length, transform: document.querySelector(".gallery__cylinder").style.transform, credits: Array.from(document.querySelectorAll(".gallery__face figcaption")).map(c => c.textContent) };
});
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/prod-gallery-1440.png" });
console.log("PROD", JSON.stringify(st), "errs", errs.length);
await b.close();
