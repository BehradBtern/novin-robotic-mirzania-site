# QA log â€” environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.95 Â· Edge: Edg/154.0.4258.53
- Revision: 85ceed1 Â· 2026-10-06T12:38:26.931Z

## How to re-run

```
npm install        # dev-only
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]
```

## Browser matrix (honest)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | EXECUTED â€” full suite | via puppeteer-core |
| Edge | EXECUTED â€” subset | same Chromium engine as Chrome â€” not independent coverage |
| Firefox | NOT PERFORMED â€” not installed | inspection-based notes only |
| Safari / iOS Safari | NOT PERFORMED â€” cannot run on Windows | inspection-based notes only |
| Android Chrome (device) | NOT PERFORMED â€” no device | viewport emulation only |

Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`) â€” labeled, not a real OS test.

## Code-inspection risk notes (NOT test results)

- sticky pinning: present; ancestor chain clean; JS recomputes geometry on resize.
- 100vh/100svh fallback: fallback pair present.
- passive listeners: present.
- modern JS above Safari 15.4 baseline: not found (safe).
- scroll-driven animations API: absent (safe).
- overflow: clip: used (Safari 16+; hidden fallback present on the sticky).

## Rollback drill

See `qa/evidence/rollback/` (v1.3.6 + kept v1.3.5 / v1.3.4 / v1.3.3 / v1.3.2 / v1.3.1 / v1.3.0 / v1.2.0 / v1.1.0 / v1.0.0).

## Rollback drill — executed evidence (v1.4.1)
- Annotated tag v1.4.1 -> commit a7e67d513a7f0ae718664bc9984f4f09dc84ad67 (QA revision d6449ff + follow-ups on the same tree).
- Changes: founder side-copy text (Hadis Mirzania bio, verbatim); mobile side-copy clamp (10 lines) + layout tune; the footer giant outline signature (giant outlined brand text) fully removed (markup/JS/styles/content) per user request.
- Kept releases for one-step restore: v1.4.0, v1.3.9, ... v1.0.0.
- Worktree smoke: v1.4.1 served on 8081; shot qa/evidence/rollback/v1.4.1-founder.png (qa=0.5; exit=0).
- Archive: qa/evidence/rollback/dist-v1.4.1.zip; SHA-256: 

## Publication update (2026-10-06)
- Vercel production redeployed: founder side-copy text live; footer giant-outline signature removed; sequence mark = PSD artwork; verified via prod fetches (content.js / logo-mark.svg).
- GitHub: main pushed 7cbb59c..a305094 (fast-forward onto the user's cleaned history; 0 large objects reachable); tag v1.4.1 pushed; tag v1.4.0 force-corrected to the canonical commit. Older tags on the remote remain the mirror-era variants (content-equivalent).
- The qa/evidence/rollback archives were removed from tracking by the user intent (kept only in delivery packs / git history).
