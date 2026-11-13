import puppeteer from "puppeteer-core";
import { CHROME } from "./lib.mjs";
const b = await puppeteer.launch({ executablePath: CHROME, headless: true, args: ["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"] });
const p = await b.newPage();
await p.emulateMediaFeatures([{ name: "prefers-reduced-motion", value: "reduce" }]);
await p.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
await p.goto("http://localhost:8080/", { waitUntil: "networkidle0", timeout: 90000 });
await new Promise(r => setTimeout(r, 600));
const m = await p.evaluate(() => {
  const g = document.getElementById("gallery");
  const out = [];
  document.querySelectorAll("body *").forEach((el) => {
    const r = el.getBoundingClientRect();
    if (r.right > window.innerWidth + 1 && r.width > 0) {
      const cs = getComputedStyle(el);
      if (cs.position !== "fixed") out.push({ sel: el.tagName + (el.id ? "#" + el.id : "") + (el.className && typeof el.className === "string" ? "." + el.className.split(" ")[0] : ""), right: Math.round(r.right), w: Math.round(r.width) });
    }
  });
  return { galleryOverflow: getComputedStyle(g).overflow, galleryW: Math.round(g.getBoundingClientRect().width), offenders: out.slice(0, 8) };
});
console.log(JSON.stringify(m, null, 1));
await b.close();
