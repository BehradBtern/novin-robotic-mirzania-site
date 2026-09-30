# QA report — logo-sequence site (v1.3.3 round)

- Revision: `fe38c43` · generated 2026-09-30T13:27:49.851Z
- Environment: win32 x64 · Node v22.22.0 · puppeteer-core 25.12.0
- Chrome: Chrome/154.0.8037.58 · Edge: Edg/154.0.4258.37
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
| c | motion trace (60 steps) | PASS | {"mapErr":0,"monoSpin":true,"spinEnd":360,"maxSpinStep":34.1,"maxPosStep":435.2,"orderOk":true,"opacityOk":true,"cEndTx":-719.22,"dEndTy":354.87} | clockwise monotonic to 360±0.5; spin in place; side-copy hold with centred mark; left travel on the middle line; enlarged state at exact 45-degree pose; dock travel right+down; swap opacity sum=1 | evidence/b/motion-trace.json |
| c | settle / no-oscillation / idle-stability | PASS | {"settleOk":true,"p":0.41667,"mapP":0.41667,"reversals":0,"idleDelta":0} | p==mapping after stop (0.002); <=2 reversals; idle delta 0 | — |
| c | determinism (same scrollY twice) | PASS | identical serialized transforms | identical | — |
| c | enlarged state: half clipped, exact 45-degree pose, no overflow | PASS | [{"vp":"1280x800","visFrac":0.503,"markCx":2.6,"spin":360,"overflow":0,"ok":true},{"vp":"1440x900","visFrac":0.503,"markCx":3,"spin":360,"overflow":0,"ok":true},{"vp":"1920x1080","visFrac":0.503,"markCx":3.5,"spin":360,"overflow":0,"ok":true},{"vp":"390x844","visFrac":0.503,"markCx":2.6,"spin":360,"overflow":0,"ok":tru | visible width fraction 0.42-0.58 at max size; spin 360±1 (exact 45-degree diamond pose); scrollWidth overflow 0 | evidence/b/halfclip-audit.json<br>evidence/b/halfclip-1440x900.png |
| c | big right: half clipped at the right edge, 45-degree pose | PASS | [{"vp":"1280x800","visFrac":0.5,"markCx":1280,"spin":270,"overflow":0,"ok":true},{"vp":"1440x900","visFrac":0.5,"markCx":1440,"spin":270,"overflow":0,"ok":true},{"vp":"1920x1080","visFrac":0.5,"markCx":1920,"spin":270,"overflow":0,"ok":true},{"vp":"390x844","visFrac":0.5,"markCx":390,"spin":270,"overflow":0,"ok":true}] | visible fraction 0.42-0.58 with the centre on the right edge; spin 270±1 (45-degree pose); overflow 0 | evidence/b/bigright-audit.json<br>evidence/b/bigright-1440x900.png |
| c | mid-sweep: the big mark crosses the middle, fully on screen | PASS | {"mcx":722.1,"spin":315} | at p=0.77 the big mark sits between the edges, centred vertically | evidence/b/sweep-1440x900.png |
| c | side copy: text beside the small symbol, then gone before the growth | PASS | [{"vp":"1440x900","centered":true,"visible":true,"noGhost":true,"noOverlap":true,"mcx":718.9,"mcy":450,"rMark":162.9,"ok":true,"goneAt07":[0,0]},{"vp":"390x844","centered":true,"visible":true,"noGhost":true,"noOverlap":true,"mcx":194.7,"mcy":422,"rMark":50.7,"ok":true,"goneAt07":[0,0]}] | both blocks fully visible + clear of the mark at p=0.5; centred mark; wordmark fully swapped (no ghost); hidden by p=0.7 | evidence/b/sidecopy-audit.json<br>evidence/b/sidetext-1440x900.png |
| d | hero end: mark docked upright just above the bottom edge | PASS | [{"vp":"1440x900","center":[721.1,715],"expY":715,"spin":360,"overflow":0,"ok":true},{"vp":"834x1112","center":[418.1,927],"expY":927,"spin":360,"overflow":0,"ok":true},{"vp":"390x844","center":[195.7,726.5],"expY":726.5,"spin":360,"overflow":0,"ok":true}] | centre == (vw/2, vh−dockR−20) ±6; spin 360±1.5; fully visible; no overflow | evidence/b/herodock-audit.json |
| d | landing: centred in the footer landing area, clear of columns and signature | PASS | [{"vp":"1280x800","center":[640,278.3],"bandCy":278.3,"bandCx":640,"frac":1,"size":330,"dockD":330,"gapAbove":25,"gapBelow":33,"centered":true,"sizeOk":true,"upright":true,"overflow":0,"ok":true},{"vp":"1440x900","center":[720,360.8],"bandCy":360.8,"bandCx":720,"frac":1,"size":330,"dockD":330,"gapAbove":25,"gapBelow":3 | centre == (viewport/2, landing-area centre) ±6/±8px; visible fraction >= 0.9; clear of the columns and the signature (>=6px both); size == configured ±6; no rotation; overflow 0 | evidence/d/dock-audit.json<br>evidence/b/dock-1440x900.png |
| d | landing stability: scroll + resize | PASS | {"yMax":4556,"yAfter":4556,"drift":0,"resizeOk":true,"resizeBackOk":true} | no scroll past max; drift 0; stays centred after resize ±8px | evidence/d/stability.json |
| e | enlarged mark rendered from vector (SVG) source | PASS | {"markSrc":"http://localhost:8123/assets/logo/logo-mark.svg","dpr":2} | mark displayed from .svg (scale-free) | evidence/e/mark-zoom-2x.png |
| f | single content source (no duplicates) | PASS | duplicates outside content.js: 0 | 0 occurrences of sample strings in shipped files | evidence/f/content-audit.txt |
| f | footer: links land + contact/legal intact | PASS | {"landings":[{"label":"Our story","href":"#story","top":0},{"label":"Programmes","href":"#programmes","top":0},{"label":"Get in touch","href":"#contact","top":-0.3},{"label":"Back to top","href":"#top","top":0}],"contactCheck":{"emailText":true,"emailHref":true,"phoneHref":true,"address":true,"legal":true}} | 4 links land within viewport; mailto/tel formats; texts == content | evidence/f/footer-links.json<br>evidence/f/footer-1440x900.png |
| f | footer signature: draw-in completes + hover reveal reacts | PASS | {"layers":3,"content":"NOVIN ROBOTIC MIRZANIA","drawn":true,"dashAfter":0,"hoverClass":true,"echoOp":0.7,"maskCx":"20.04%"} | 3 text layers with the brand name; stroke draw-in finishes (dashoffset 0); hover shows the echo (0.7) and moves the reveal mask | evidence/f/signature-audit.json<br>evidence/f/footer-signature-1440x900.png |
| g | responsive: no overflow at max size and landing; gallery columns adapt | PASS | [{"vp":"360x740","ok":true,"overflow@0.84":0,"overflow@1":0,"galleryCols":1},{"vp":"768x1024","ok":true,"overflow@0.84":0,"overflow@1":0,"galleryCols":2},{"vp":"1280x800","ok":true,"overflow@0.84":0,"overflow@1":0,"galleryCols":3},{"vp":"1440x900","ok":true,"overflow@0.84":0,"overflow@1":0,"galleryCols":3},{"vp":"1920x | scrollWidth overflow <= 1px in both states; no horizontal scrollbar; gallery grid 3/2/1 columns by width | evidence/g/responsive.json |
| h | reduced motion: static logo + signature fully rendered, gallery static | PASS | {"top":{"x":203.34375,"y":36,"r":1236.65625,"b":846},"end":{"x":555,"y":196.7890625,"r":885,"b":524.8046875},"bandCy":360.8,"frameComputed":"none","side":"none","sigDraw":"0px","gallery":{"count":6,"op":1,"imgOK":true,"inView":true}} | no transforms; no side copy; wordmark fully in viewport; landing centred in the landing area; signature drawn statically (no dash offset); gallery cards visible without reveal effects | evidence/h/reduced-1440-full.png |
| i | perf: zero errors, local-only | PASS | {"consoleErrors":0,"pageErrors":0,"failed":0,"hosts":{"localhost:8123":11},"resources":11,"transferBytes":71175} | 0 errors; localhost-only; no failed requests | evidence/i/perf.json |
| i | CLS + frame cadence (headless) | INFO | {"cls":0,"frameMedianMs":6.9,"frameP95Ms":7.1} | informational only | — |
| j | resize mid-sequence | PASS | {"p":[0.55,0.61875],"spin":192.1219889322917,"expSpin":192.1} | state re-renders consistently after resize | — |
| j | fling (wheel bursts) | PASS | {"p":1,"mapP":1} | end state == mapping ±0.002 | — |
| j | reload mid-sequence | PASS | {"scrollY":1080,"p":0.5,"mapP":0.5} | deterministic restore | — |
| j | QA hook robustness | PASS | [{"qa":"abc","got":null,"errors":0},{"qa":"-1","got":0,"errors":0},{"qa":"2","got":1,"errors":0},{"qa":"0.5","got":0.5,"errors":0}] | invalid ignored; clamped; no errors | — |
| k | Edge subset (same engine as Chrome) | PASS | {"version":"Edg/154.0.4258.37","landingCentered":true,"errors":0} | intro + centred landing + zero errors on Edge | evidence/edge/dock-1440x900.png |

## Summary

- PASS: 27
- FAIL: 0
- INFO: 1
- OBSERVED: 0
- NOT PERFORMED: 0

## Evidence files (116)

- `qa/evidence/a/intro-1280x800.png`
- `qa/evidence/a/intro-1440x900.png`
- `qa/evidence/a/intro-1920x1080.png`
- `qa/evidence/a/intro-audit.json`
- `qa/evidence/a/nav-sweep.json`
- `qa/evidence/a/removal-audit.txt`
- `qa/evidence/b/bigright-1280x800.png`
- `qa/evidence/b/bigright-1440x900.png`
- `qa/evidence/b/bigright-1920x1080.png`
- `qa/evidence/b/bigright-390x844.png`
- `qa/evidence/b/bigright-audit.json`
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
- `qa/evidence/b/pin-0.7-1440x900.png`
- `qa/evidence/b/pin-0.7-390x844.png`
- `qa/evidence/b/pin-0.7-834x1112.png`
- `qa/evidence/b/pin-0.8-1440x900.png`
- `qa/evidence/b/pin-0.8-390x844.png`
- `qa/evidence/b/pin-0.8-834x1112.png`
- `qa/evidence/b/pin-0.84-1440x900.png`
- `qa/evidence/b/pin-0.84-390x844.png`
- `qa/evidence/b/pin-0.84-834x1112.png`
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
- `qa/evidence/b/sweep-1440x900.png`
- `qa/evidence/d/dock-audit.json`
- `qa/evidence/d/stability.json`
- `qa/evidence/e/mark-zoom-2x.png`
- `qa/evidence/e/sharpness.json`
- `qa/evidence/edge/dock-1440x900.png`
- `qa/evidence/edge/intro-1440x900.png`
- `qa/evidence/f/content-audit.txt`
- `qa/evidence/f/footer-1440x900.png`
- `qa/evidence/f/footer-links.json`
- `qa/evidence/f/footer-signature-1440x900.png`
- `qa/evidence/f/roundtrip-blurb.png`
- `qa/evidence/f/roundtrip-headline.png`
- `qa/evidence/f/roundtrip-logoswap-dock.png`
- `qa/evidence/f/roundtrip-logoswap-final.png`
- `qa/evidence/f/roundtrip.json`
- `qa/evidence/f/signature-audit.json`
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
- `qa/evidence/rollback/dist-v1.3.0.zip`
- `qa/evidence/rollback/dist-v1.3.1.zip`
- `qa/evidence/rollback/dist-v1.3.2.zip`
- `qa/evidence/rollback/tag-show-v1.1.0.txt`
- `qa/evidence/rollback/tag-show-v1.2.0.txt`
- `qa/evidence/rollback/tag-show-v1.3.0.txt`
- `qa/evidence/rollback/tag-show-v1.3.1.txt`
- `qa/evidence/rollback/tag-show-v1.3.2.txt`
- `qa/evidence/rollback/tag-show.txt`
- `qa/evidence/rollback/v1.0.0-intro.png`
- `qa/evidence/rollback/v1.1.0-intro.png`
- `qa/evidence/rollback/v1.2.0-intro.png`
- `qa/evidence/rollback/v1.3.0-intro.png`
- `qa/evidence/rollback/v1.3.1-bigstate.png`
- `qa/evidence/rollback/v1.3.2-footer.png`
