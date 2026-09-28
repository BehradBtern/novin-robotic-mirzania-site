# QA report — logo-sequence site (v1.3.0 round)

- Revision: `1e466bb` · generated 2026-09-28T17:26:54.765Z
- Environment: win32 x64 · Node v22.22.0 · puppeteer-core 25.12.0
- Chrome: Chrome/153.0.8010.54 · Edge: Edg/154.0.4258.37
- Method: puppeteer-core only; local CSP-mirror server; deterministic states via `?qa=`;
  dock measured once pinned and once at maximum scroll (live).
- Labels: PASS/FAIL = instrumented vs threshold; OBSERVED = judged artefact; INFO = recorded; NOT PERFORMED = no runtime.

## Results

| id | check | status | value | threshold | evidence |
|----|-------|--------|-------|-----------|----------|
| a | nav absence (9 cells) | PASS | headers 0; no fixed/sticky outside hero; nav only in footer | zero nav outside footer | evidence/a/nav-sweep.json |
| a | old placeholder elements removed from DOM | PASS | {"copy":0,"indicator":0,"hint":0,"rmMark":0} body=["A.skip-link","NOSCRIPT","SECTION#story.hero","SECTION#programmes.gallery","FOOTER#footer.footer"] | copy/indicator/hint/rm-mark counts all 0; body = skip-link + noscript + hero + programmes + footer | evidence/a/nav-sweep.json |
| a | programmes: 4–7 photo slots present, ordered hero→programmes→footer | PASS | {"cards":6,"ordered":true} | gallery between hero and footer; 4–7 cards each with img/alt/title/text | evidence/a/nav-sweep.json |
| a | source audit: no dead placeholders; gallery assets present | PASS | {"deadRefs":0,"galleryRefs":6,"slots":6,"missing":0,"imgFiles":6} | no hero__copy/hint/indicator/rm-mark refs; every gallery slot points at an existing file | evidence/a/removal-audit.txt |
| b | intro: big wordmark centered on dark gray, unclipped | PASS | [{"vp":"1280x800","dx":0,"dy":0,"frameW":979.7,"expectedW":979.7,"sizeOk":true,"notClipped":true,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity":1,"sideOp":0},{"vp":"1440x900","dx":0,"dy":0,"frameW":1102.2,"expectedW":1102.2,"sizeOk":true,"notClipped":true,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0," | hero size == min(92vw, 96vh*1.2757, 1600px) ±3; centered ±8px; fully in viewport; side copy hidden; bg rgb(23,25,27) | evidence/a/intro-1440x900.png<br>evidence/a/intro-audit.json |
| c | motion trace (60 steps) | PASS | {"mapErr":0,"monoSpin":true,"spinEnd":360,"maxSpinStep":31.7,"maxPosStep":301,"orderOk":true,"opacityOk":true,"cEndTx":-515.71,"dEndTy":382.57} | clockwise monotonic to 360±0.5; spin in place; side-copy hold with centred mark; left travel on the middle line; dock travel right+down; swap opacity sum=1 | evidence/b/motion-trace.json |
| c | settle / no-oscillation / idle-stability | PASS | {"settleOk":true,"p":0.41667,"mapP":0.41667,"reversals":0,"idleDelta":0} | p==mapping after stop (0.002); <=2 reversals; idle delta 0 | — |
| c | determinism (same scrollY twice) | PASS | identical serialized transforms | identical | — |
| c | enlarged state: half clipped at the left edge, no overflow | PASS | [{"vp":"1280x800","visFrac":0.502,"markCx":1.3,"overflow":0,"ok":true},{"vp":"1440x900","visFrac":0.502,"markCx":1.5,"overflow":0,"ok":true},{"vp":"1920x1080","visFrac":0.502,"markCx":1.8,"overflow":0,"ok":true},{"vp":"390x844","visFrac":0.502,"markCx":1.3,"overflow":0,"ok":true}] | visible width fraction 0.42-0.58 at max size; scrollWidth overflow 0 | evidence/b/halfclip-audit.json<br>evidence/b/halfclip-1440x900.png |
| c | side copy: text beside the small symbol, then gone before the growth | PASS | [{"vp":"1440x900","centered":true,"visible":true,"noGhost":true,"noOverlap":true,"mcx":718.9,"mcy":450,"rMark":162.9,"ok":true,"goneAt07":[0,0]},{"vp":"390x844","centered":true,"visible":true,"noGhost":true,"noOverlap":true,"mcx":194.7,"mcy":422,"rMark":50.7,"ok":true,"goneAt07":[0,0]}] | both blocks fully visible + clear of the mark at p=0.5; centred mark; wordmark fully swapped (no ghost); hidden by p=0.7 | evidence/b/sidecopy-audit.json<br>evidence/b/sidetext-1440x900.png |
| d | hero end: mark docked upright just above the bottom edge | PASS | [{"vp":"1440x900","center":[720.7,775.8],"expY":775.8,"spin":360,"overflow":0,"ok":true},{"vp":"834x1112","center":[417.8,972.1],"expY":972.1,"spin":360,"overflow":0,"ok":true},{"vp":"390x844","center":[195.7,726.5],"expY":726.5,"spin":360,"overflow":0,"ok":true}] | centre == (vw/2, vh−dockR−20) ±6; spin 360±1.5; fully visible; no overflow | evidence/b/herodock-audit.json |
| d | landing: centred in the footer band, fully visible, upright | PASS | [{"vp":"1280x800","center":[640,562.8],"bandCy":562.4,"bandCx":640,"frac":1,"size":199.1,"dockD":199.1,"centered":true,"sizeOk":true,"upright":true,"overflow":0,"ok":true},{"vp":"1440x900","center":[720,652.3],"bandCy":651.8,"bandCx":720,"frac":1,"size":208.3,"dockD":208.3,"centered":true,"sizeOk":true,"upright":true," | centre == (viewport/2, footer band centre) ±6/±8px; visible fraction >= 0.9; size == configured ±6; no rotation; overflow 0 | evidence/d/dock-audit.json<br>evidence/b/dock-1440x900.png |
| d | landing stability: scroll + resize | PASS | {"yMax":4021,"yAfter":4021,"drift":0,"resizeOk":true,"resizeBackOk":true} | no scroll past max; drift 0; stays centred after resize ±8px | evidence/d/stability.json |
| e | enlarged mark rendered from vector (SVG) source | PASS | {"markSrc":"http://localhost:8123/assets/logo/logo-mark.svg","dpr":2} | mark displayed from .svg (scale-free) | evidence/e/mark-zoom-2x.png |
| f | single content source (no duplicates) | PASS | duplicates outside content.js: 0 | 0 occurrences of sample strings in shipped files | evidence/f/content-audit.txt |
| f | footer: links land + contact/legal intact | PASS | {"landings":[{"label":"Our story","href":"#story","top":0},{"label":"Programmes","href":"#programmes","top":0},{"label":"Get in touch","href":"#contact","top":476.7},{"label":"Back to top","href":"#top","top":0}],"contactCheck":{"emailText":true,"emailHref":true,"phoneHref":true,"address":true,"legal":true}} | 4 links land within viewport; mailto/tel formats; texts == content | evidence/f/footer-links.json<br>evidence/f/footer-1440x900.png |
| g | responsive: no overflow at max size and landing; gallery columns adapt | PASS | [{"vp":"360x740","ok":true,"overflow@0.86":0,"overflow@1":0,"galleryCols":1},{"vp":"768x1024","ok":true,"overflow@0.86":0,"overflow@1":0,"galleryCols":2},{"vp":"1280x800","ok":true,"overflow@0.86":0,"overflow@1":0,"galleryCols":3},{"vp":"1440x900","ok":true,"overflow@0.86":0,"overflow@1":0,"galleryCols":3},{"vp":"1920x | scrollWidth overflow <= 1px in both states; no horizontal scrollbar; gallery grid 3/2/1 columns by width | evidence/g/responsive.json |
| h | reduced motion: static logo fully visible in hero and footer; gallery static | PASS | {"top":{"x":203.34375,"y":36,"r":1236.65625,"b":846},"end":{"x":615.84375,"y":548.78125,"r":824.15625,"b":755.84375},"bandCy":651.8,"frameComputed":"none","side":"none","gallery":{"count":6,"op":1,"imgOK":true,"inView":true}} | no transforms; no side copy; wordmark fully in viewport; landing centred; gallery cards visible without reveal effects | evidence/h/reduced-1440-full.png |
| i | perf: zero errors, local-only | PASS | {"consoleErrors":0,"pageErrors":0,"failed":0,"hosts":{"localhost:8123":11},"resources":11,"transferBytes":66948} | 0 errors; localhost-only; no failed requests | evidence/i/perf.json |
| i | CLS + frame cadence (headless) | INFO | {"cls":0,"frameMedianMs":6.9,"frameP95Ms":7.1} | informational only | — |
| j | resize mid-sequence | PASS | {"p":[0.55,0.61875],"spin":180,"expSpin":180} | state re-renders consistently after resize | — |
| j | fling (wheel bursts) | PASS | {"p":1,"mapP":1} | end state == mapping ±0.002 | — |
| j | reload mid-sequence | PASS | {"scrollY":1080,"p":0.5,"mapP":0.5} | deterministic restore | — |
| j | QA hook robustness | PASS | [{"qa":"abc","got":null,"errors":0},{"qa":"-1","got":0,"errors":0},{"qa":"2","got":1,"errors":0},{"qa":"0.5","got":0.5,"errors":0}] | invalid ignored; clamped; no errors | — |
| k | Edge subset (same engine as Chrome) | PASS | {"version":"Edg/154.0.4258.37","landingCentered":true,"errors":0} | intro + centred landing + zero errors on Edge | evidence/edge/dock-1440x900.png |

## Summary

- PASS: 24
- FAIL: 0
- INFO: 1
- OBSERVED: 0
- NOT PERFORMED: 0

## Evidence files (93)

- `qa/evidence/a/intro-1280x800.png`
- `qa/evidence/a/intro-1440x900.png`
- `qa/evidence/a/intro-1920x1080.png`
- `qa/evidence/a/intro-audit.json`
- `qa/evidence/a/nav-sweep.json`
- `qa/evidence/a/removal-audit.txt`
- `qa/evidence/b/dock-1280x800.png`
- `qa/evidence/b/dock-1440x900.png`
- `qa/evidence/b/dock-1920x1080.png`
- `qa/evidence/b/dock-2560x1080.png`
- `qa/evidence/b/dock-390x844.png`
- `qa/evidence/b/dock-834x1112.png`
- `qa/evidence/b/halfclip-1280x800.png`
- `qa/evidence/b/halfclip-1440x900.png`
- `qa/evidence/b/halfclip-1920x1080.png`
- `qa/evidence/b/halfclip-390x844.png`
- `qa/evidence/b/halfclip-audit.json`
- `qa/evidence/b/herodock-1440x900.png`
- `qa/evidence/b/herodock-390x844.png`
- `qa/evidence/b/herodock-834x1112.png`
- `qa/evidence/b/herodock-audit.json`
- `qa/evidence/b/motion-trace.json`
- `qa/evidence/b/pin-0-1440x900.png`
- `qa/evidence/b/pin-0-390x844.png`
- `qa/evidence/b/pin-0-834x1112.png`
- `qa/evidence/b/pin-0.25-1440x900.png`
- `qa/evidence/b/pin-0.25-390x844.png`
- `qa/evidence/b/pin-0.25-834x1112.png`
- `qa/evidence/b/pin-0.3-1440x900.png`
- `qa/evidence/b/pin-0.3-390x844.png`
- `qa/evidence/b/pin-0.3-834x1112.png`
- `qa/evidence/b/pin-0.5-1440x900.png`
- `qa/evidence/b/pin-0.5-390x844.png`
- `qa/evidence/b/pin-0.5-834x1112.png`
- `qa/evidence/b/pin-0.8-1440x900.png`
- `qa/evidence/b/pin-0.8-390x844.png`
- `qa/evidence/b/pin-0.8-834x1112.png`
- `qa/evidence/b/pin-0.86-1440x900.png`
- `qa/evidence/b/pin-0.86-390x844.png`
- `qa/evidence/b/pin-0.86-834x1112.png`
- `qa/evidence/b/pin-0.93-1440x900.png`
- `qa/evidence/b/pin-0.93-390x844.png`
- `qa/evidence/b/pin-0.93-834x1112.png`
- `qa/evidence/b/pin-1-1440x900.png`
- `qa/evidence/b/pin-1-390x844.png`
- `qa/evidence/b/pin-1-834x1112.png`
- `qa/evidence/b/sidecopy-audit.json`
- `qa/evidence/b/sidetext-1440x900.png`
- `qa/evidence/b/sidetext-390x844.png`
- `qa/evidence/d/dock-audit.json`
- `qa/evidence/d/stability.json`
- `qa/evidence/e/mark-zoom-2x.png`
- `qa/evidence/e/sharpness.json`
- `qa/evidence/edge/dock-1440x900.png`
- `qa/evidence/edge/intro-1440x900.png`
- `qa/evidence/f/content-audit.txt`
- `qa/evidence/f/footer-1440x900.png`
- `qa/evidence/f/footer-links.json`
- `qa/evidence/f/roundtrip-blurb.png`
- `qa/evidence/f/roundtrip-headline.png`
- `qa/evidence/f/roundtrip-logoswap-dock.png`
- `qa/evidence/f/roundtrip-logoswap-final.png`
- `qa/evidence/f/roundtrip.json`
- `qa/evidence/g/responsive.json`
- `qa/evidence/h/gallery-6-1440x900.png`
- `qa/evidence/h/gallery-audit.json`
- `qa/evidence/h/reduced-1440-full.png`
- `qa/evidence/h/reduced-390-full.png`
- `qa/evidence/h/reduced-motion.json`
- `qa/evidence/h/variant-4-1440x900.png`
- `qa/evidence/h/variant-7-1440x900.png`
- `qa/evidence/h/variant-runs.json`
- `qa/evidence/i/perf.json`
- `qa/evidence/i/resp-1280x500-q070.png`
- `qa/evidence/i/resp-1280x500-q1.png`
- `qa/evidence/i/resp-1280x800-q070.png`
- `qa/evidence/i/resp-1440x900-q070.png`
- `qa/evidence/i/resp-1920x1080-q070.png`
- `qa/evidence/i/resp-2560x1080-q070.png`
- `qa/evidence/i/resp-360x740-q070.png`
- `qa/evidence/i/resp-768x1024-q070.png`
- `qa/evidence/i/responsive.json`
- `qa/evidence/j/dock-live-zoom-2x.png`
- `qa/evidence/j/reduced-motion.json`
- `qa/evidence/rollback/dist-v1.0.0.zip`
- `qa/evidence/rollback/dist-v1.1.0.zip`
- `qa/evidence/rollback/dist-v1.2.0.zip`
- `qa/evidence/rollback/tag-show-v1.1.0.txt`
- `qa/evidence/rollback/tag-show-v1.2.0.txt`
- `qa/evidence/rollback/tag-show.txt`
- `qa/evidence/rollback/v1.0.0-intro.png`
- `qa/evidence/rollback/v1.1.0-intro.png`
- `qa/evidence/rollback/v1.2.0-intro.png`
