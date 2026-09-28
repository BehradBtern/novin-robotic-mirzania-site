# QA report — logo-sequence site (v1.2.0 round)

- Revision: `4ac298f` · generated 2026-09-28T16:34:11.699Z
- Environment: win32 x64 · Node v22.22.0 · puppeteer-core 25.12.0
- Chrome: Chrome/153.0.8010.54 · Edge: Edg/154.0.4258.37
- Method: puppeteer-core only; local CSP-mirror server; deterministic states via `?qa=`;
  dock measured once pinned and once at maximum scroll (live).
- Labels: PASS/FAIL = instrumented vs threshold; OBSERVED = judged artefact; INFO = recorded; NOT PERFORMED = no runtime.

## Results

| id | check | status | value | threshold | evidence |
|----|-------|--------|-------|-----------|----------|
| a | nav absence (9 cells) | PASS | headers 0; no fixed/sticky outside hero; nav only in footer | zero nav outside footer | evidence/a/nav-sweep.json |
| a | old elements removed from DOM | PASS | {"gallery":0,"copy":0,"indicator":0,"hint":0,"rmMark":0} body=["A.skip-link","NOSCRIPT","SECTION#story.hero","FOOTER#footer.footer"] | gallery/copy/indicator/hint/rm-mark counts all 0 | evidence/a/nav-sweep.json |
| a | source removal audit | PASS | stale refs: 0; leftover img files: 0 | 0 stale references; no unused gallery assets | evidence/a/removal-audit.txt |
| b | intro: big wordmark centered on dark gray, unclipped | PASS | [{"vp":"1280x800","dx":0,"dy":0,"frameW":876.1,"expectedW":876.1,"sizeOk":true,"notClipped":true,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity":1},{"vp":"1440x900","dx":0,"dy":0,"frameW":985.6,"expectedW":985.6,"sizeOk":true,"notClipped":true,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity": | hero size == min(92vw, 86vh*1.2734, 1250px) ±3; centered ±8px; fully in viewport; bg rgb(23,25,27) | evidence/a/intro-1440x900.png<br>evidence/a/intro-audit.json |
| c | motion trace (60 steps) | PASS | {"mapErr":0,"monoSpin":true,"spinEnd":360,"maxSpinStep":30.2,"maxPosStep":130,"orderOk":true,"opacityOk":true,"cEndTx":-515.86,"dEndTy":767.74} | clockwise monotonic to 360±0.5; spin in place; left travel horizontal; footer travel right+down; swap opacity sum=1 | evidence/b/motion-trace.json |
| c | settle / no-oscillation / idle-stability | PASS | {"settleOk":true,"p":0.41667,"mapP":0.41667,"reversals":0,"idleDelta":0} | p==mapping after stop (0.002); <=2 reversals; idle delta 0 | — |
| c | determinism (same scrollY twice) | PASS | identical serialized transforms | identical | — |
| c | enlarged state: half clipped at the left edge, no overflow | PASS | [{"vp":"1280x800","visFrac":0.502,"markCx":1.3,"overflow":0,"ok":true},{"vp":"1440x900","visFrac":0.502,"markCx":1.5,"overflow":0,"ok":true},{"vp":"1920x1080","visFrac":0.502,"markCx":1.8,"overflow":0,"ok":true},{"vp":"390x844","visFrac":0.502,"markCx":1.3,"overflow":0,"ok":true}] | visible width fraction 0.42-0.58 at max size; scrollWidth overflow 0 | evidence/b/halfclip-audit.json<br>evidence/b/halfclip-1440x900.png |
| d | landing: centred in the footer band, fully visible, upright | PASS | [{"vp":"1280x800","center":[640,553.2],"bandCy":552.7,"bandCx":640,"frac":1,"size":207.9,"dockD":207.9,"centered":true,"sizeOk":true,"upright":true,"overflow":0,"ok":true},{"vp":"1440x900","center":[720,642.2],"bandCy":641.7,"bandCx":720,"frac":1,"size":217.1,"dockD":217.1,"centered":true,"sizeOk":true,"upright":true," | centre == (viewport/2, footer band centre) ±6/±8px; visible fraction >= 0.9; size == configured ±6; no rotation; overflow 0 | evidence/d/dock-audit.json<br>evidence/b/dock-1440x900.png |
| d | landing stability: scroll + resize | PASS | {"yMax":2677,"yAfter":2677,"drift":0,"resizeOk":true,"resizeBackOk":true} | no scroll past max; drift 0; stays centred after resize ±8px | evidence/d/stability.json |
| e | enlarged mark rendered from vector (SVG) source | PASS | {"markSrc":"http://localhost:8123/assets/logo/logo-mark.svg","dpr":2} | mark displayed from .svg (scale-free) | evidence/e/mark-zoom-2x.png |
| f | single content source (no duplicates) | PASS | duplicates outside content.js: 0 | 0 occurrences of sample strings in shipped files | evidence/f/content-audit.txt |
| f | footer: links land + contact/legal intact | PASS | {"landings":[{"label":"Our story","href":"#story","top":0},{"label":"Programmes","href":"#story","top":0},{"label":"Get in touch","href":"#contact","top":456},{"label":"Back to top","href":"#top","top":0}],"contactCheck":{"emailText":true,"emailHref":true,"phoneHref":true,"address":true,"legal":true}} | 4 links land within viewport; mailto/tel formats; texts == content | evidence/f/footer-links.json<br>evidence/f/footer-1440x900.png |
| g | responsive: no overflow at max size and landing | PASS | [{"vp":"360x740","ok":true,"overflow@0.68":0,"overflow@1":0},{"vp":"768x1024","ok":true,"overflow@0.68":0,"overflow@1":0},{"vp":"1280x800","ok":true,"overflow@0.68":0,"overflow@1":0},{"vp":"1440x900","ok":true,"overflow@0.68":0,"overflow@1":0},{"vp":"1920x1080","ok":true,"overflow@0.68":0,"overflow@1":0},{"vp":"2560x10 | scrollWidth overflow <= 1px in both states; no horizontal scrollbar | evidence/g/responsive.json |
| h | reduced motion: static logo fully visible in hero and footer | PASS | {"top":{"x":227.1875,"y":90,"r":1212.796875,"b":863.96875},"end":{"x":611.4375,"y":534.2578125,"r":828.5625,"b":750.0234375},"bandCy":641.6,"frameComputed":"none"} | no transforms; wordmark fully in viewport; landing centred in the footer band and fully visible | evidence/h/reduced-1440-full.png |
| i | perf: zero errors, local-only | PASS | {"consoleErrors":0,"pageErrors":0,"failed":0,"hosts":{"localhost:8123":5},"resources":5,"transferBytes":49155} | 0 errors; localhost-only; no failed requests | evidence/i/perf.json |
| i | CLS + frame cadence (headless) | INFO | {"cls":0,"frameMedianMs":6.9,"frameP95Ms":7.1} | informational only | — |
| j | resize mid-sequence | PASS | {"p":[0.55,0.61875],"spin":294.9755859375,"tx":-305.81428571272534} | state re-renders consistently after resize | — |
| j | fling (wheel bursts) | PASS | {"p":1,"mapP":1} | end state == mapping ±0.002 | — |
| j | reload mid-sequence | PASS | {"scrollY":1080,"p":0.5,"mapP":0.5} | deterministic restore | — |
| j | QA hook robustness | PASS | [{"qa":"abc","got":null,"errors":0},{"qa":"-1","got":0,"errors":0},{"qa":"2","got":1,"errors":0},{"qa":"0.5","got":0.5,"errors":0}] | invalid ignored; clamped; no errors | — |
| k | Edge subset (same engine as Chrome) | PASS | {"version":"Edg/154.0.4258.37","landingCentered":true,"errors":0} | intro + centred landing + zero errors on Edge | evidence/edge/dock-1440x900.png |

## Summary

- PASS: 21
- FAIL: 0
- INFO: 1
- OBSERVED: 0
- NOT PERFORMED: 0

## Evidence files (77)

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
- `qa/evidence/b/motion-trace.json`
- `qa/evidence/b/pin-0-1440x900.png`
- `qa/evidence/b/pin-0-390x844.png`
- `qa/evidence/b/pin-0-834x1112.png`
- `qa/evidence/b/pin-0.3-1440x900.png`
- `qa/evidence/b/pin-0.3-390x844.png`
- `qa/evidence/b/pin-0.3-834x1112.png`
- `qa/evidence/b/pin-0.55-1440x900.png`
- `qa/evidence/b/pin-0.55-390x844.png`
- `qa/evidence/b/pin-0.55-834x1112.png`
- `qa/evidence/b/pin-0.68-1440x900.png`
- `qa/evidence/b/pin-0.68-390x844.png`
- `qa/evidence/b/pin-0.68-834x1112.png`
- `qa/evidence/b/pin-0.8-1440x900.png`
- `qa/evidence/b/pin-0.8-390x844.png`
- `qa/evidence/b/pin-0.8-834x1112.png`
- `qa/evidence/b/pin-1-1440x900.png`
- `qa/evidence/b/pin-1-390x844.png`
- `qa/evidence/b/pin-1-834x1112.png`
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
- `qa/evidence/rollback/tag-show-v1.1.0.txt`
- `qa/evidence/rollback/tag-show.txt`
- `qa/evidence/rollback/v1.0.0-intro.png`
- `qa/evidence/rollback/v1.1.0-intro.png`
