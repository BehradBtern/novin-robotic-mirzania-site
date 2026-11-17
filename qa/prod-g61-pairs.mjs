import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
await p.goto("https://novin-robotic-mirzania-site.vercel.app/?qa=0.86", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 800));
const audit = await p.evaluate(() => {
  const g = window.SITE_CONTENT.gallery;
  const faces = [...document.querySelectorAll(".gallery__face img")].map(i => (i.getAttribute("src") || "").replace(/^.*\//, "").split("?")[0]);
  const pairs = g.map((it, k) => ({ k, want: it.src.replace(/^.*\//, ""), got: faces[k], credit: it.credit, caption: it.caption }));
  return { n: g.length, mismatches: pairs.filter(x => x.want !== x.got), credits: [...new Set(g.map(x => x.credit))] };
});
console.log(JSON.stringify(audit, null, 1));
await b.close();
