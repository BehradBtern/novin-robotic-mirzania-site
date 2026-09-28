# QA report — Novin Robotic Mirzania one-page site

- Revision: `52fd9fd` · generated 2026-09-28T13:58:21.331Z
- Environment: win32 x64 · Node v22.22.0 · puppeteer-core 25.12.0
- Chrome: Chrome/153.0.8010.54 · Edge: Edg/154.0.4258.37
- Method: all captures via puppeteer-core (own temp profile); local server mirrors the production CSP header;
  deterministic stage states via the `?qa=` pin; declared holds are [0,0.20] and [0.97,1.00].
- Status labels: PASS/FAIL = instrumented measurement vs threshold; OBSERVED = human-judged artifact;
  INFO = recorded, no guarantee; NOT PERFORMED = no runtime available (never counted as a pass).

## Results

| id | check | status | value | threshold | evidence |
|----|-------|--------|-------|-----------|----------|
| a | nav-absence sweep (9 cells) | PASS | headers 0, fixed/sticky-outside-hero 0, nav only in footer | zero header/nav outside footer at top/mid/footer × 360/768/1440 | evidence/a/nav-sweep.json |
| b | intro: wordmark centered on dark gray | PASS | [{"vp":"1280x800","dx":0,"dy":0,"bg":"rgb(23, 25, 27)"},{"vp":"1440x900","dx":0,"dy":0,"bg":"rgb(23, 25, 27)"},{"vp":"1920x1080","dx":0,"dy":0,"bg":"rgb(23, 25, 27)"}] | |dx|,|dy| <= 8px; bg rgb(23,25,27); copy opacity 0 | evidence/a/intro-1440x900.png<br>evidence/a/intro-audit.json |
| c | scroll mapping trace (60 steps) | PASS | {"mapErr":0,"mono":true,"maxDispStep":1.3545,"dispRange":4.653,"maxRotStep":30.37,"undeclaredFlat":[]} | monotone; mapErr<=0.002; max step <= 45% of range; no undeclared flat >=5% p | evidence/b/scroll-trace.json |
| c | settle / no-oscillation / idle-stability | PASS | {"settleOk":true,"p":0.38462,"mapP":0.38462,"reversals":0,"idleDelta":0} | after wheel stop: p==mapping (+-0.002) within 650ms; <=2 reversals; idle delta 0 | — |
| c | determinism (same scrollY twice) | PASS | identical serialized transforms | identical | — |
| d | copy reveal (p=0.70) | PASS | [{"vp":"1440x900","ok":true,"leftRightEdge":639,"markCx":720,"rightLeftEdge":801,"dcy":0.05,"opacity":[1,1],"contrast":{"head":16.08,"body":9.86,"kicker":5.85}},{"vp":"1920x1080","ok":true,"leftRightEdge":862.8,"markCx":960,"rightLeftEdge":1057.2,"dcy":0.05,"opacity":[1,1],"contrast":{"head":16.08," | opacity>=0.99; left right-edge < mark cx; right left-edge > mark cx; |dcy|<=4px; contrast>=4.5 | evidence/c/copy-audit.json<br>evidence/c/copy-1440x900.png |
| d | copy stagger at p=0.55 | OBSERVED | {"left":0.896,"right":0.216} | left enters before right (stagger) by design | — |
| e | final framing: half-visible giant at left | PASS | [{"vp":"1280x800","frac":0.5,"rz":-14,"k":5.24,"visiblePx":727,"markPx":1454,"overflow":0,"ok":true},{"vp":"1440x900","frac":0.5,"rz":-14,"k":5.23,"visiblePx":816,"markPx":1633,"overflow":0,"ok":true},{"vp":"1920x1080","frac":0.5,"rz":-14,"k":5.64,"visiblePx":979,"markPx":1957,"overflow":0,"ok":true | visible fraction 0.35-0.65; rotation negative; no horizontal overflow | evidence/d/final-framing.json<br>evidence/d/final-1440x900.png |
| f | single content source (no duplicates) | PASS | total hardcoded duplicate strings outside content.js: 0 | 0 occurrences of sample strings in html/css/js/server | evidence/f/content-audit.txt |
| g | footer: links land + contact/legal intact | PASS | {"landings":[{"label":"Our story","href":"#story","top":0,"y":0},{"label":"Programmes","href":"#programmes","top":24,"y":3216},{"label":"Get in touch","href":"#contact","top":476.3,"y":7304},{"label":"Back to top","href":"#top","top":0,"y":0}],"contactCheck":{"emailText":true,"emailHref":true,"phone | 4 explore links land within +-40px; mailto/tel formats; texts == content | evidence/g/footer-links.json<br>evidence/g/footer-1440x900.png |
| h | gallery: 6 cards complete | PASS | {"count":6,"alts":[68,57,60,57,56,50],"decoded":[true,true,true,true,true,true],"mediaVsText":[false,false,false,false,false,false]} | count 6; alt/title/text non-empty; images decoded; no media/text overlap | evidence/h/gallery-audit.json<br>evidence/h/gallery-6-1440x900.png |
| h | gallery count variants (4/7/0/8) | PASS | [{"n":4,"count":4,"overlaps":0,"pageErrors":0,"consoleErrors":0},{"n":7,"count":7,"overlaps":0,"pageErrors":0,"consoleErrors":0},{"n":0,"count":0,"overlaps":0,"pageErrors":0,"consoleErrors":0},{"n":8,"count":8,"overlaps":0,"pageErrors":0,"consoleErrors":0}] | 4/7 render without overlap or errors; 0/8 graceful (no errors) | evidence/h/variant-runs.json<br>evidence/h/variant-4-1440x900.png<br>evidence/h/variant-7-1440x900.png |
| i | responsive overlap + overflow | PASS | [{"vp":"360x740","heroOverlapPairs":0,"rowOverlaps":0,"footerOverlaps":[],"overflow":0,"ok":true},{"vp":"768x1024","heroOverlapPairs":0,"rowOverlaps":0,"footerOverlaps":[],"overflow":0,"ok":true},{"vp":"1280x800","heroOverlapPairs":0,"rowOverlaps":0,"footerOverlaps":[],"overflow":0,"ok":true},{"vp": | 0 overlap pairs at 7 viewports; overflow <= 1px; body not locked | evidence/i/responsive.json<br>evidence/i/resp-360x740-q070.png |
| i | wheel reaches page bottom | PASS | {"y":7304,"max":7304} | scrollY == max +-2px | — |
| j | reduced motion: static readable layout | PASS | {"copyOpacity":[1,1],"rowsOpacity":[1,1,1,1,1,1],"rmMarkWidth":160,"stable":true} | no pinned choreography; copy + rows visible; no transforms; static mark shown | evidence/j/reduced-1440-full.png |
| j | reduced motion toggle semantics | INFO | OS-setting change reloads the page (documented; listener present) | n/a | — |
| k | a11y: contrast, alt, keyboard, focus | PASS | {"contrast":{"headline":16.08,"body":9.86,"kicker":5.85,"intro":9.86,"legal":5.85,"accentVsStage":8.28},"heroFocusables":0,"firstTab":{"tag":"A","id":"","cls":"skip-link","text":"Skip to gallery"},"focusRing":{"width":"2px","style":"solid"},"skipRing":{"width":"2px","style":"solid"},"galleryAlts":[6 | contrast>=4.5 (accent>=3); alt text present; hero has 0 focusables; skip link first; focus ring >=2px | evidence/k/a11y.json<br>evidence/k/focus-skip.png |
| l | perf: no errors, local-only, lazy images | PASS | {"consoleErrors":0,"pageErrors":0,"failedRequests":0,"hosts":{"localhost:8123":11},"resources":11,"transferBytes":330113,"lazy":["lazy","lazy","lazy","lazy","lazy","lazy"],"aspect":[1.5,1.5,1.5,1.5,1.5,1.5]} | 0 errors/failed; localhost-only; lazy below fold; 3:2 frames | evidence/l/perf.json |
| l | CLS + frame cadence (headless) | INFO | {"cls":0,"clsCount":0,"frameMedianMs":6.9,"frameP95Ms":7.1,"frames":838} | informational — headless numbers are not device guarantees | — |
| m | E1 resize during pin | PASS | {"p":[0.5,0.5625,0.4166666666666667],"map":[0.5625,0.4166666666666667],"stickyTop":[0,0]} | render matches recomputed mapping +-0.01p; sticky top 0; single instance | evidence/m/e1-resize.json |
| m | E2 fling (wheel bursts) | PASS | {"p":1,"mapP":1} | end state == mapping +-0.002 | — |
| m | E3 reload mid-pin | PASS | {"behavior":"scroll restored","beforeY":1170,"afterY":1170,"consistent":true} | state consistent with restored position | evidence/m/e3-reload.json |
| m | E4 hash deep-links | PASS | [{"hash":"#programmes","top":24,"consistent":true},{"hash":"#contact","top":476.3,"consistent":true}] | targets land +-40px; hero state consistent | — |
| m | E5 zoom proxy (720x450) | INFO | layout proxy only — labels: approximates 200% zoom; not a real zoom test | n/a | evidence/m/e5-zoomproxy-720x450.png |
| m | E7 short viewport 1280x500 | PASS | {"p":0.7,"stage":2} | choreography functional at short viewport | evidence/m/e7-short-1280x500.png |
| m | E8 rapid reversals | PASS | {"seq":[0.7,0.3,0.6,0.1,0.3],"got":[0.7,0.3,0.6,0.1,0.3]} | same p => same values; no hysteresis | — |
| m | E12 unpin seam | PASS | {"gap":0,"storyBottom":900,"releasedBottom":750} | no gap/overlap at release (<=1px); releases correctly | evidence/m/seam-a-pinend.png<br>evidence/m/seam-b-unpinned.png |
| m | E13 QA hook robustness | PASS | [{"qa":"abc","got":null,"errors":0},{"qa":"-1","got":0,"errors":0},{"qa":"2","got":1,"errors":0},{"qa":"0.5","got":0.5,"errors":0},{"qa":"0.5&qa=x","got":0.5,"errors":0}] | invalid ignored; clamped to [0,1]; no errors | — |
| k | Edge subset (same engine as Chrome) | PASS | {"version":"Edg/154.0.4258.37","headerCount":0,"finalFraction":0.5,"errors":0} | intro + final framing + nav + zero errors on Edge | evidence/edge/intro-1440x900.png<br>evidence/edge/final-1440x900.png |

## Summary

- PASS: 25
- FAIL: 0
- INFO: 3
- OBSERVED: 1
- NOT PERFORMED: 0

## Evidence files (56)

- `qa/evidence/a/intro-1280x800.png`
- `qa/evidence/a/intro-1440x900.png`
- `qa/evidence/a/intro-1920x1080.png`
- `qa/evidence/a/intro-audit.json`
- `qa/evidence/a/nav-sweep.json`
- `qa/evidence/b/pin-0-1440x900.png`
- `qa/evidence/b/pin-0.1-1440x900.png`
- `qa/evidence/b/pin-0.325-1440x900.png`
- `qa/evidence/b/pin-0.55-1440x900.png`
- `qa/evidence/b/pin-0.7-1440x900.png`
- `qa/evidence/b/pin-0.9-1440x900.png`
- `qa/evidence/b/pin-1-1440x900.png`
- `qa/evidence/b/scroll-trace.json`
- `qa/evidence/c/copy-1440x900.png`
- `qa/evidence/c/copy-1920x1080.png`
- `qa/evidence/c/copy-2560x1080.png`
- `qa/evidence/c/copy-audit.json`
- `qa/evidence/d/final-1280x800.png`
- `qa/evidence/d/final-1440x900.png`
- `qa/evidence/d/final-1920x1080.png`
- `qa/evidence/d/final-2560x1080.png`
- `qa/evidence/d/final-390x844.png`
- `qa/evidence/d/final-framing.json`
- `qa/evidence/edge/final-1440x900.png`
- `qa/evidence/edge/intro-1440x900.png`
- `qa/evidence/f/content-audit.txt`
- `qa/evidence/g/footer-1440x900.png`
- `qa/evidence/g/footer-links.json`
- `qa/evidence/h/gallery-6-1440x900.png`
- `qa/evidence/h/gallery-audit.json`
- `qa/evidence/h/variant-4-1440x900.png`
- `qa/evidence/h/variant-7-1440x900.png`
- `qa/evidence/h/variant-runs.json`
- `qa/evidence/i/resp-1280x500-q070.png`
- `qa/evidence/i/resp-1280x500-q1.png`
- `qa/evidence/i/resp-1280x800-q070.png`
- `qa/evidence/i/resp-1440x900-q070.png`
- `qa/evidence/i/resp-1920x1080-q070.png`
- `qa/evidence/i/resp-2560x1080-q070.png`
- `qa/evidence/i/resp-360x740-q070.png`
- `qa/evidence/i/resp-768x1024-q070.png`
- `qa/evidence/i/responsive.json`
- `qa/evidence/j/reduced-1440-full.png`
- `qa/evidence/j/reduced-390-full.png`
- `qa/evidence/j/reduced-motion.json`
- `qa/evidence/k/a11y.json`
- `qa/evidence/k/focus-skip.png`
- `qa/evidence/l/perf.json`
- `qa/evidence/m/e1-resize.json`
- `qa/evidence/m/e12-seam.json`
- `qa/evidence/m/e3-reload.json`
- `qa/evidence/m/e5-zoomproxy-720x450-final.png`
- `qa/evidence/m/e5-zoomproxy-720x450.png`
- `qa/evidence/m/e7-short-1280x500.png`
- `qa/evidence/m/seam-a-pinend.png`
- `qa/evidence/m/seam-b-unpinned.png`
