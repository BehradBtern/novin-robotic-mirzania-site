# QA report — logo-sequence site (v1.3.6 round)

- Revision: `cadb272` · generated 2026-10-06T19:04:35.986Z
- Environment: win32 x64 · Node v22.22.0 · puppeteer-core 25.12.0
- Chrome: Chrome/154.0.8037.95 · Edge: Edg/154.0.4258.53
- Method: puppeteer-core only; local CSP-mirror server; deterministic states via `?qa=`;
  dock measured once pinned and once at maximum scroll (live).
- Labels: PASS/FAIL = instrumented vs threshold; OBSERVED = judged artefact; INFO = recorded; NOT PERFORMED = no runtime.

## Results

| id | check | status | value | threshold | evidence |
|----|-------|--------|-------|-----------|----------|
| a | nav absence (9 cells) | PASS | headers 0; no fixed/sticky outside hero; nav only in footer | zero nav outside footer | evidence/a/nav-sweep.json |
| a | old placeholder elements removed from DOM (incl. the programmes section) | PASS | {"copy":0,"indicator":0,"hint":0,"rmMark":0} galleryGone=0 body=["A.skip-link","NOSCRIPT","SECTION#story.hero","FOOTER#footer.footer"] | copy/indicator/hint/rm-mark/gallery counts all 0; body = skip-link + noscript + hero + footer | evidence/a/nav-sweep.json |
| a | source audit: no dead placeholders; programmes assets removed | PASS | {"deadRefs":0,"imgFiles":0} | no hero__copy/hint/indicator/rm-mark/gallery refs in shipped files; assets/img empty | evidence/a/removal-audit.txt |
| b | intro: big wordmark centered on dark gray, unclipped | PASS | [{"vp":"1280x800","dx":0,"dy":0,"frameW":979.7,"expectedW":979.7,"sizeOk":true,"notClipped":true,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity":1,"sideOp":0},{"vp":"1440x900","dx":0,"dy":0,"frameW":1102.2,"expectedW":1102.2,"sizeOk":true,"notClipped":true,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0," | hero size == min(92vw, 96vh*1.2757, 1600px) ±3; centered ±8px; fully in viewport; side copy hidden; bg rgb(23,25,27) | evidence/a/intro-1440x900.png<br>evidence/a/intro-audit.json |
| c | motion trace (60 steps) | PASS | {"mapErr":0,"monoSpin":true,"spinEnd":360,"maxSpinStep":34.1,"maxPosStep":436.9,"orderOk":true,"opacityOk":true,"cEndTx":719.54,"dEndTy":363.92} | clockwise monotonic to 360±0.5; spin in place; side-copy hold with centred mark; grow left on the middle line; sweep right; enlarged state at exact 45-degree pose; dock travel left+down; no position jumps (max step <= 500px/sample); swap opacity sum=1 | evidence/b/motion-trace.json |
| c | settle / no-oscillation / idle-stability | PASS | {"settleOk":true,"p":0.41667,"mapP":0.41667,"reversals":0,"idleDelta":0} | p==mapping after stop (0.002); <=2 reversals; idle delta 0 | — |
| c | determinism (same scrollY twice) | PASS | identical serialized transforms | identical | — |
| c | enlarged state (right edge): half clipped, exact 45-degree pose, no overflow | PASS | [{"vp":"1280x800","visFrac":0.497,"markCx":1282.6,"spin":360,"overflow":0,"ok":true},{"vp":"1440x900","visFrac":0.497,"markCx":1443,"spin":360,"overflow":0,"ok":true},{"vp":"1920x1080","visFrac":0.497,"markCx":1923.5,"spin":360,"overflow":0,"ok":true},{"vp":"390x844","visFrac":0.497,"markCx":392.6,"spin":360,"overflow" | visible width fraction 0.42-0.58 at max size; centre on the right edge ±5; spin 360±1 (exact 45-degree diamond pose); scrollWidth overflow 0 | evidence/b/halfclip-audit.json<br>evidence/b/bigright-1440x900.png |
| c | big left: half clipped at the left edge, 45-degree pose | PASS | [{"vp":"1280x800","ogGone":0,"visFrac":0.5,"markCx":0,"spin":270,"overflow":0,"ok":true},{"vp":"1440x900","ogGone":0,"visFrac":0.5,"markCx":0,"spin":270,"overflow":0,"ok":true},{"vp":"1920x1080","ogGone":0,"visFrac":0.5,"markCx":0,"spin":270,"overflow":0,"ok":true},{"vp":"390x844","ogGone":0,"visFrac":0.5,"markCx":0,"s | visible fraction 0.42-0.58 with the centre on the left edge; spin 270±1 (45-degree pose); overflow 0; OG overlay gone | evidence/b/bigleft-audit.json<br>evidence/b/bigleft-1440x900.png |
| c | mid-sweep: the big mark crosses the middle, fully on screen | PASS | {"mcx":722.1,"spin":315} | at p=0.77 the big mark sits between the edges, centred vertically | evidence/b/sweep-1440x900.png |
| c | phase 2: blueprint diagram fills the spin (circle drawn in, both labels set) | PASS | {"op":1,"dash":60,"gapY":1} | diagram visible mid-phase (opacity ~1), circle drawn in (dashoffset < 943), top/bottom labels populated | evidence/b/phase2-diagram.png |
| c | side copy: serif type beside the small symbol, then gone before the growth | PASS | [{"vp":"1440x900","centered":true,"visible":true,"noGhost":true,"noOverlap":true,"ogCount":0,"diag0":0,"ff":"\"Cormorant Garamond\", Georgia, \"Times New ","fontOk":true,"mcx":718.5,"mcy":450,"rMark":219.6,"ok":true,"goneAt07":[0,0]},{"vp":"390x844","centered":true,"visible":true,"noGhost":true,"noOverlap":true,"ogCoun | both blocks fully visible + clear of the mark at p=0.5; centred mark; wordmark fully swapped (no ghost); hidden by p=0.7; Cormorant Garamond active; no OG overlay | evidence/b/sidecopy-audit.json<br>evidence/b/sidetext-1440x900.png |
| d | hero end: mark docked upright just above the bottom edge | PASS | [{"vp":"1440x900","center":[721,734.9],"expY":734.9,"spin":360,"overflow":0,"ok":true},{"vp":"834x1112","center":[418,940.4],"expY":940.4,"spin":360,"overflow":0,"ok":true},{"vp":"390x844","center":[195.7,726.5],"expY":726.5,"spin":360,"overflow":0,"ok":true}] | centre == (vw/2, vh−dockR−20) ±6; spin 360±1.5; fully visible; no overflow | evidence/b/herodock-audit.json |
| d | footer: giant text present; the big logo above it removed | PASS | {"endmark":0,"landing":0,"sigLayers":3,"sigW":1180,"overflow":0} | no endmark/landing elements; signature has 3 layers spanning the footer; no overflow | evidence/d/dock-audit.json<br>evidence/d/footer-1440x900.png |
| d2 | footer stability: page height steady across scrolling | PASS | {"h1":3751,"h2":3751} | scrollHeight shift <= 2px | — |
| e | enlarged mark rendered from vector (SVG) source | PASS | {"markSrc":"http://localhost:8123/assets/logo/logo-mark.svg","dpr":2} | mark displayed from .svg (scale-free) | evidence/e/mark-zoom-2x.png |
| f | single content source (no duplicates) | PASS | duplicates outside content.js: 0 | 0 occurrences of sample strings in shipped files | evidence/f/content-audit.txt |
| f | footer: links land + contact/legal intact | PASS | {"landings":[{"label":"Our story","href":"#story","top":0},{"label":"Get in touch","href":"#contact","top":282},{"label":"Back to top","href":"#top","top":0}],"contactCheck":{"emailText":true,"emailHref":true,"phoneHref":true,"address":true,"legal":true}} | 3 links land within viewport; mailto/tel formats; texts == content | evidence/f/footer-links.json<br>evidence/f/footer-1440x900.png |
| f | footer signature: text present, draw-in completes | PASS | {"layers":3,"drawn":true,"dashAfter":0} | 3 text layers with the brand name; stroke draw-in finishes (dashoffset 0) | evidence/f/signature-audit.json<br>evidence/f/footer-signature-1440x900.png |
| g | responsive: no overflow at max size and landing | PASS | [{"vp":"360x740","ok":true,"overflow@0.7":0,"overflow@1":0},{"vp":"768x1024","ok":true,"overflow@0.7":0,"overflow@1":0},{"vp":"1280x800","ok":true,"overflow@0.7":0,"overflow@1":0},{"vp":"1440x900","ok":true,"overflow@0.7":0,"overflow@1":0},{"vp":"1920x1080","ok":true,"overflow@0.7":0,"overflow@1":0},{"vp":"2560x1080"," | scrollWidth overflow <= 1px in both states; no horizontal scrollbar | evidence/g/responsive.json |
| h | reduced motion: signature drawn statically; big mark stays removed | PASS | {"hasClass":true,"sigLayers":3,"sigContent":"NOVIN ROBOTIC MIRZANIA","sigDash":0,"endmark":0,"overflow":0} | reduced class on; signature 3 layers with dashoffset 0; no endmark; no overflow | evidence/h/reduced-1440-full.png |
| i | perf: zero errors, local-only | PASS | {"consoleErrors":0,"pageErrors":0,"failed":0,"hosts":{"localhost:8123":6},"resources":6,"transferBytes":174857} | 0 errors; localhost-only; no failed requests | evidence/i/perf.json |
| i | CLS + frame cadence (headless) | INFO | {"cls":0,"frameMedianMs":16.7,"frameP95Ms":16.8} | informational only | — |
| j | resize mid-sequence | PASS | {"p":[0.55,0.61875],"spin":192.1219889322917,"expSpin":192.1} | state re-renders consistently after resize | — |
| j | fling (wheel bursts) | PASS | {"p":1,"mapP":1} | end state == mapping ±0.002 | — |
| j | reload mid-sequence | PASS | {"scrollY":1080,"p":0.5,"mapP":0.5} | deterministic restore | — |
| j | QA hook robustness | PASS | [{"qa":"abc","got":null,"errors":0},{"qa":"-1","got":0,"errors":0},{"qa":"2","got":1,"errors":0},{"qa":"0.5","got":0.5,"errors":0}] | invalid ignored; clamped; no errors | — |
| k | Edge subset (same engine as Chrome) | PASS | {"version":"Edg/154.0.4258.53","sigLayers":3,"errors":0} | footer signature rendered + zero errors on Edge | evidence/edge/dock-1440x900.png |

## Summary

- PASS: 27
- FAIL: 0
- INFO: 1
- OBSERVED: 0
- NOT PERFORMED: 0

## Evidence files (157)

- `qa/evidence/a/intro-1280x800.png`
- `qa/evidence/a/intro-1440x900.png`
- `qa/evidence/a/intro-1920x1080.png`
- `qa/evidence/a/intro-audit.json`
- `qa/evidence/a/nav-sweep.json`
- `qa/evidence/a/removal-audit.txt`
- `qa/evidence/b/bigleft-1280x800.png`
- `qa/evidence/b/bigleft-1440x900.png`
- `qa/evidence/b/bigleft-1920x1080.png`
- `qa/evidence/b/bigleft-390x844.png`
- `qa/evidence/b/bigleft-audit.json`
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
- `qa/evidence/b/phase2-diagram.png`
- `qa/evidence/b/pin-0-1440x900.png`
- `qa/evidence/b/pin-0-390x844.png`
- `qa/evidence/b/pin-0-834x1112.png`
- `qa/evidence/b/pin-0.06-1440x900.png`
- `qa/evidence/b/pin-0.06-390x844.png`
- `qa/evidence/b/pin-0.06-834x1112.png`
- `qa/evidence/b/pin-0.19-1440x900.png`
- `qa/evidence/b/pin-0.19-390x844.png`
- `qa/evidence/b/pin-0.19-834x1112.png`
- `qa/evidence/b/pin-0.25-1440x900.png`
- `qa/evidence/b/pin-0.25-390x844.png`
- `qa/evidence/b/pin-0.25-834x1112.png`
- `qa/evidence/b/pin-0.3-1440x900.png`
- `qa/evidence/b/pin-0.3-390x844.png`
- `qa/evidence/b/pin-0.3-834x1112.png`
- `qa/evidence/b/pin-0.5-1440x900.png`
- `qa/evidence/b/pin-0.5-390x844.png`
- `qa/evidence/b/pin-0.5-834x1112.png`
- `qa/evidence/b/pin-0.56-1440x900.png`
- `qa/evidence/b/pin-0.56-390x844.png`
- `qa/evidence/b/pin-0.56-834x1112.png`
- `qa/evidence/b/pin-0.66-1440x900.png`
- `qa/evidence/b/pin-0.66-390x844.png`
- `qa/evidence/b/pin-0.66-834x1112.png`
- `qa/evidence/b/pin-0.7-1440x900.png`
- `qa/evidence/b/pin-0.7-390x844.png`
- `qa/evidence/b/pin-0.7-834x1112.png`
- `qa/evidence/b/pin-0.78-1440x900.png`
- `qa/evidence/b/pin-0.78-390x844.png`
- `qa/evidence/b/pin-0.78-834x1112.png`
- `qa/evidence/b/pin-0.8-1440x900.png`
- `qa/evidence/b/pin-0.8-390x844.png`
- `qa/evidence/b/pin-0.8-834x1112.png`
- `qa/evidence/b/pin-0.84-1440x900.png`
- `qa/evidence/b/pin-0.84-390x844.png`
- `qa/evidence/b/pin-0.84-834x1112.png`
- `qa/evidence/b/pin-0.86-1440x900.png`
- `qa/evidence/b/pin-0.86-390x844.png`
- `qa/evidence/b/pin-0.86-834x1112.png`
- `qa/evidence/b/pin-0.92-1440x900.png`
- `qa/evidence/b/pin-0.92-390x844.png`
- `qa/evidence/b/pin-0.92-834x1112.png`
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
- `qa/evidence/d/footer-1440x900.png`
- `qa/evidence/d/rollback-v1.4.2-intro.png`
- `qa/evidence/d/rollback-v1.4.3-big-og.png`
- `qa/evidence/d/rollback-v1.4.4-big.png`
- `qa/evidence/d/rollback-v1.4.5-founder.png`
- `qa/evidence/d/rollback-v1.4.6-founder.png`
- `qa/evidence/d/rollback-v1.4.7-mark.png`
- `qa/evidence/d/rollback-v1.4.8-mark.png`
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
- `qa/evidence/probe/big-og-1440.png`
- `qa/evidence/probe/big-reverted-1440.png`
- `qa/evidence/probe/bottom-viewport.png`
- `qa/evidence/probe/dock-og-1440.png`
- `qa/evidence/probe/el-brand.png`
- `qa/evidence/probe/el-dockedmark.png`
- `qa/evidence/probe/el-logo.png`
- `qa/evidence/probe/founder-bigger-1440.png`
- `qa/evidence/probe/founder-bigger-390.png`
- `qa/evidence/probe/founder-longer-1440.png`
- `qa/evidence/probe/mark-bigger-1440.png`
- `qa/evidence/probe/mark-plus15-1440.png`
- `qa/evidence/probe/mid-crossfade-1440.png`
- `qa/evidence/probe/phase2-0.16.png`
- `qa/evidence/probe/phase2-0.24.png`
- `qa/evidence/probe/phase2-0.31.png`
- `qa/evidence/probe/phase2-diagram-1440.png`
- `qa/evidence/probe/phase2-settled-1440.png`
- `qa/evidence/probe/prod-big-og-1440.png`
- `qa/evidence/probe/prod-founder-1440.png`
- `qa/evidence/probe/prod-founder-longer-1440.png`
- `qa/evidence/probe/prod-mark-bigger-1440.png`
- `qa/evidence/probe/prod-mark-plus15-1440.png`
- `qa/evidence/probe/prod-reverted-1440.png`
- `qa/evidence/probe/side-serif-1440.png`
- `qa/evidence/probe/zoom-brand.png`
- `qa/evidence/probe/zoom-top.png`
