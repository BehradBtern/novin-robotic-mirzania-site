import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
const errs = []; p.on("pageerror", e => errs.push(e.message));
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.98", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 1200));
const m = await p.evaluate(() => {
  const g = document.getElementById("gallery");
  return { opacity: +getComputedStyle(g).opacity, inStage: !!g.closest(".hero__sticky"), faces: document.querySelectorAll(".gallery__face").length, loaded: Array.from(document.querySelectorAll(".gallery__face img")).filter(i => i.naturalWidth > 0).length, footerGallery: !!document.querySelector("footer .gallery") };
});
await p.screenshot({ path: "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots/prod-dock-gallery.png" });
console.log("PROD", JSON.stringify(m), "errs", errs.length);
await b.close();
