# QA log â€” environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.95 Â· Edge: Edg/154.0.4258.53
- Revision: 8b81b0a Â· 2026-10-03T17:38:17.363Z

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

## Rollback drill — executed evidence (v1.3.9)
- Annotated tag v1.3.9 -> commit 6362bfeb2e1376649cd6f615dbdea14f786d15fc (QA revision 8b81b0a on the same tree).
- Change: footer-left logo replaced with the mark exported from the supplied PSD (, , , .psd) - white background un-composited to transparency, vector-traced (IoU 0.964 at display scale), PNG 1x/2x/3x fallbacks; content.js logos.footerLeft added; main.js footer logo wiring updated (attrs 1195x1187).
- Kept releases for one-step restore: v1.3.8, v1.3.7, v1.3.6, v1.3.5, v1.3.4, v1.3.3, v1.3.2, v1.3.1, v1.3.0, v1.2.0, v1.1.0, v1.0.0.
- Worktree smoke: v1.3.9 served on 8081; shot qa/evidence/rollback/v1.3.9-intro.png (exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.9.zip; SHA-256: 9C5E5AA0B06A27CFAA315DEE065BEF6E4421EC4EE9DFA7617CEB06882AC18613
