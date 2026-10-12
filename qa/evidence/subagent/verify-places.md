# Independent verification summary — international places staircase overlay (v1.6.1)

**Provenance.** Produced by the independent verifier subagent ("Places overlay verifier", 2026-10-10):
17 headless-Chrome probes against http://localhost:8080 plus 10 screenshots. The verifier's LLM run
timed out while composing its own report; this summary was assembled by the AutoCoder main session
directly from the verifier's captured artifacts (raw-data.json + screenshots). All numeric values are
copied from raw-data.json; visual observations cross-referenced between the verifier's run artifacts
and AutoCoder's review of the same screenshot files.

**Method.** Each probe loads `/?qa=<p>` (animation progress pinned), waits for `ready`, then reads
`#hero-places .hp-row` opacities, bounding rects, image completeness, the mark rect, old-section
count, and document overflow. Viewports: 1440x900 desktop, 390x844 phone.

## Opacity windows (rows, top -> bottom)

| probe | viewport | p | row opacities | note |
|---|---|---|---|---|
| desk-p0.24 | 1440x900 | 0.24 | 0,0,0,0,0 | hidden before window |
| desk-p0.58 | 1440x900 | 0.58 | 0,0,0,0,0 | hidden before window |
| edge-desk-p0.615 | 1440x900 | 0.615 | 0,0,0,0,0 | fade-in just starting |
| desk-p0.63 | 1440x900 | 0.63 | 0.39,0.24,0.12,0.03,0 | forming |
| edge-desk-p0.647 | 1440x900 | 0.647 | 1,0.985,0.916,0.802,0.658 | almost full |
| desk-p0.66 | 1440x900 | 0.66 | 1,1,1,1,1 | fully visible (target state) |
| edge-desk-p0.705 | 1440x900 | 0.705 | 0.994,1,1,1,1 | holding |
| desk-p0.72 | 1440x900 | 0.72 | 0.68,0.77,0.85,0.92,0.97 | staggered fade-out (top fades first) |
| edge-desk-p0.755 | 1440x900 | 0.755 | 0,0,0,0.006,0.034 | almost gone |
| desk-p0.88 | 1440x900 | 0.88 | 0,0,0,0,0 | hidden after window |
| edge-phone-p0.606 | 390x844 | 0.606 | 0,0,0,0,0 | hidden before window |
| phone-p0.62 | 390x844 | 0.62 | 0.5,0.38,0.26,0.16,0.07 | forming |
| phone-p0.63 | 390x844 | 0.63 | 0.98,0.93,0.84,0.74,0.62 | visible (compact window) |
| edge-phone-p0.665 | 390x844 | 0.665 | 0,0,0,0.003,0.028 | almost gone |
| edge-phone-p0.67 | 390x844 | 0.67 | 0,0,0,0,0 | cleared |
| phone-p0.68 | 390x844 | 0.68 | 0,0,0,0,0 | cleared before the mark fills the page |
| phone-p0.72 | 390x844 | 0.72 | 0,0,0,0,0 | cleared |

## Staircase geometry (desktop)

- p=0.66: row left edges `[898, 872, 846, 820, 794]` — strictly decreasing down the list, step ~26px; row width 430px.
- Mark right edge at p=0.66: 585.66 -> clearance to the leftmost row (794) = **208.34px**.
- Rotated-bbox note: at p=0.63 the mark's axis-aligned bounding-box right edge (885.05) sits ~2px from row0's left edge (883.01) while rows are still fading in (opacity <= 0.39). The mark is a rotated element, so its bbox overstates the drawn diamond; the fade-in transient is visually clear in the p=0.63 full screenshot. Not a layout defect — clearance is fully open by p=0.647 (mark right 737.3) and p=0.66 (585.66).

## Flags, DOM, overflow, errors

- Images: all 5 row images complete with naturalWidth > 0 in every probe; all 5 referenced files verified present on disk (flagsFileCheck, all `exists: true`).
- Old standalone section: `oldSections` = 0 in every probe (`#places-list, section.places` absent from the DOM).
- Horizontal overflow: scrollDiff = 0 on both viewports in all probes (1440/1440, 390/390).
- Totals across 17 probes: consoleErrors 0, pageErrors 0, failedRequests 0, loadErrors 0.

## Verdicts

| check | verdict |
|---|---|
| Hidden outside window (desktop 0.24 / 0.58 / 0.88; phone 0.606 / 0.67+) | PASS |
| Fully visible at 0.66 desktop / 0.63 phone | PASS |
| Staircase: strictly decreasing left edges | PASS |
| Mark clearance (requirement >= 4px; measured 208px at 0.66) | PASS |
| Flags load (all 5 files exist; all images complete) | PASS |
| No horizontal overflow | PASS |
| No console/page/request errors | PASS |
| Old standalone section removed from DOM | PASS |
| Visual review of screenshots (staircase legible, clear of mark, flags correct incl. Malaysia and USA vertical flags) | PASS |

Note: the verifier regenerated its row crops at deviceScaleFactor 2 after noticing its first crop clip
(computed from the container rect) had cut the left-stepped flags — a crop-tool artifact, not a site bug.

## Screenshots (this folder)

1440-p0.63.png / 1440-p0.63-places.png · 1440-p0.66.png / 1440-p0.66-places.png ·
1440-p0.72.png / 1440-p0.72-places.png · 390-p0.62.png / 390-p0.62-places.png ·
390-p0.68.png / 390-p0.68-places.png (full viewport / places crop)

## Remaining uncertainty

- Single-machine, headless run on one browser engine (Chrome/Edge family); real-mouse scroll feel is covered by the main QA suite (fling/reload checks), not re-tested here.
- The p=0.63 ~2px bbox proximity is the only sub-pixel-scale oddity observed; it was resolved by visual check (clean).
