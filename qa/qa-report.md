# QA report — logo-sequence site (v1.1.0 fix round)

- Revision: `ca0993c` · generated 2026-09-28T15:51:49.218Z
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
| b | intro: wordmark centered on dark gray, alone | PASS | [{"vp":"1280x800","dx":0,"dy":0,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity":1},{"vp":"1440x900","dx":0,"dy":0,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity":1},{"vp":"1920x1080","dx":0,"dy":0,"bg":"rgb(23, 25, 27)","spin":0,"markOpacity":0,"wordOpacity":1}] | |dx|,|dy| <= 8px; bg rgb(23,25,27); spin 0; mark hidden; wordmark visible | evidence/a/intro-1440x900.png<br>evidence/a/intro-audit.json |
| c | motion trace (60 steps) | PASS | {"mapErr":0,"monoSpin":true,"spinEnd":360,"maxSpinStep":65.1,"orderOk":true,"diagonalSteps":0,"opacityOk":true} | clockwise monotonic to 360±0.5; spin in place; left horizontal; descend vertical; no diagonal; swap opacity sum=1 | evidence/b/motion-trace.json |
| c | settle / no-oscillation / idle-stability | PASS | {"settleOk":true,"p":0.41667,"mapP":0.41667,"reversals":0,"idleDelta":0} | p==mapping after stop (0.002); <=2 reversals; idle delta 0 | — |
| c | determinism (same scrollY twice) | PASS | identical serialized transforms | identical | — |
| d | dock: ~half visible, anchored to footer edge, no overflow | PASS | [{"vp":"1280x800","frac":0.5,"markCenter":[385.9,305.1],"footerTop":305,"dockX":384,"anchorsFooter":true,"xOn":true,"overflow":0,"ok":true},{"vp":"1440x900","frac":0.5,"markCenter":[434.5,383.1],"footerTop":383,"dockX":432,"anchorsFooter":true,"xOn":true,"overflow":0,"ok":true},{"vp":"1920x1080","frac":0.5,"markCenter" | visible fraction 0.42-0.58; mark centre anchored to the footer edge (footer-child layer on phones); centred on dockX ±6px; overflow 0 | evidence/d/dock-audit.json<br>evidence/b/dock-1440x900.png |
| d | dock stability: scroll + resize | PASS | {"yMax":2677,"yAfter":2677,"drift":0,"resizeOk":true,"resizeBackOk":true} | no scroll past max; drift 0; re-anchors after resize ±5px | evidence/d/stability.json |
| e | large mark rendered from vector (SVG) source | PASS | {"markSrc":"http://localhost:8123/assets/logo/logo-mark.svg","dpr":2} | symbol mark displayed from .svg (scale-free) | evidence/e/dock-zoom-2x.png |
| f | single content source (no duplicates) | PASS | duplicates outside content.js: 0 | 0 occurrences of sample strings in shipped files | evidence/f/content-audit.txt |
| f | footer: links land + contact/legal intact | PASS | {"landings":[{"label":"Our story","href":"#story","top":0},{"label":"Programmes","href":"#story","top":0},{"label":"Get in touch","href":"#contact","top":456},{"label":"Back to top","href":"#top","top":0}],"contactCheck":{"emailText":true,"emailHref":true,"phoneHref":true,"address":true,"legal":true}} | 4 links land within viewport; mailto/tel formats; texts == content | evidence/f/footer-links.json<br>evidence/f/footer-1440x900.png |
| g | responsive: no overflow, mark fully in width | PASS | [{"vp":"360x740","overflow":0,"markLeft":128.9,"markRight":348.6,"ok":true},{"vp":"768x1024","overflow":0,"markLeft":14.3,"markRight":758.7,"ok":true},{"vp":"1280x800","overflow":0,"markLeft":28,"markRight":744.8,"ok":true},{"vp":"1440x900","overflow":0,"markLeft":21.2,"markRight":848.5,"ok":true},{"vp":"1920x1080","ov | overflow <= 1px; mark within horizontal bounds | evidence/g/responsive.json |
| h | reduced motion: static end state, no spin | PASS | {"hasClass":true,"frameInline":"","frameComputed":"none","markboxDisplay":"none","wordmarkOpacity":"1","endDisplay":"block","endOpacity":"1","endCenter":[432,510.8125],"footerTop":509.8125,"dock":[432,363]} | no transforms; markbox hidden; endmark at dock position; wordmark visible | evidence/h/reduced-1440-full.png |
| i | perf: zero errors, local-only | PASS | {"consoleErrors":0,"pageErrors":0,"failed":0,"hosts":{"localhost:8123":5},"resources":5,"transferBytes":48076} | 0 errors; localhost-only; no failed requests | evidence/i/perf.json |
| i | CLS + frame cadence (headless) | INFO | {"cls":0,"frameMedianMs":6.9,"frameP95Ms":7} | informational only | — |
| j | resize mid-sequence | PASS | {"p":[0.55,0.61875],"spin":360,"tx":-184.78360058309045} | state re-renders consistently after resize | — |
| j | fling (wheel bursts) | PASS | {"p":1,"mapP":1} | end state == mapping ±0.002 | — |
| j | reload mid-sequence | PASS | {"scrollY":1080,"p":0.5,"mapP":0.5} | deterministic restore | — |
| j | QA hook robustness | PASS | [{"qa":"abc","got":null,"errors":0},{"qa":"-1","got":0,"errors":0},{"qa":"2","got":1,"errors":0},{"qa":"0.5","got":0.5,"errors":0}] | invalid ignored; clamped; no errors | — |
| k | Edge subset (same engine as Chrome) | PASS | {"version":"Edg/154.0.4258.37","dockFraction":0.5,"errors":0} | intro + dock + zero errors on Edge | evidence/edge/dock-1440x900.png |

## Summary

- PASS: 20
- FAIL: 0
- INFO: 1
- OBSERVED: 0
- NOT PERFORMED: 0

## Evidence files (67)

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
- `qa/evidence/b/pin-0.8-1440x900.png`
- `qa/evidence/b/pin-0.8-390x844.png`
- `qa/evidence/b/pin-0.8-834x1112.png`
- `qa/evidence/b/pin-1-1440x900.png`
- `qa/evidence/b/pin-1-390x844.png`
- `qa/evidence/b/pin-1-834x1112.png`
- `qa/evidence/d/dock-audit.json`
- `qa/evidence/d/stability.json`
- `qa/evidence/e/dock-zoom-2x.png`
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
- `qa/evidence/l/perf.json`
- `qa/evidence/rollback/dist-v1.0.0.zip`
- `qa/evidence/rollback/tag-show.txt`
- `qa/evidence/rollback/v1.0.0-intro.png`
