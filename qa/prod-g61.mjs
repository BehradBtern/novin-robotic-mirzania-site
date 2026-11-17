import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const W = "C:/Users/USER/.openclaw-autoclaw/agents/auto-coder/workspace/.openclaw/tmp/shots";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 900));
const faces = await p.$$(".gallery__face");
await faces[12].click();
await new Promise(r => setTimeout(r, 700));
const lb = await p.evaluate(() => {
  const d = document.querySelector(".gallery__lightbox");
  const cap = d.querySelector("[class*='caption']") || d.querySelector("figcaption") || d.querySelector("p");
  return { open: d.open, text: (cap && cap.textContent || "").trim(), img: d.querySelector("img").getAttribute("src") };
});
console.log("G13-LIGHTBOX", JSON.stringify(lb));
await p.screenshot({ path: W + "/prod-g61-lightbox.png" });
await b.close();
