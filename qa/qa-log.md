# QA log — environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 · Node: v22.22.0 · puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 · Edge: Edg/154.0.4258.37
- Revision: fafbb3a · 2026-09-30T14:22:03.091Z

## How to re-run

```
npm install        # dev-only
npm run qa         # full suite -> qa/qa-report.md + qa/evidence/**
node qa/shot.mjs chrome <url> <w> <h> out.png [qa]
```

## Browser matrix (honest)

| Browser | Status | Notes |
|---------|--------|-------|
| Chrome | EXECUTED — full suite | via puppeteer-core |
| Edge | EXECUTED — subset | same Chromium engine as Chrome — not independent coverage |
| Firefox | NOT PERFORMED — not installed | inspection-based notes only |
| Safari / iOS Safari | NOT PERFORMED — cannot run on Windows | inspection-based notes only |
| Android Chrome (device) | NOT PERFORMED — no device | viewport emulation only |

Reduced-motion checks used DevTools emulation (`emulateMediaFeatures`) — labeled, not a real OS test.

## Code-inspection risk notes (NOT test results)

- sticky pinning: present; ancestor chain clean; JS recomputes geometry on resize.
- 100vh/100svh fallback: fallback pair present.
- passive listeners: present.
- modern JS above Safari 15.4 baseline: not found (safe).
- scroll-driven animations API: absent (safe).
- overflow: clip: used (Safari 16+; hidden fallback present on the sticky).

## Rollback drill

See `qa/evidence/rollback/` (v1.3.6 + kept v1.3.5 / v1.3.4 / v1.3.3 / v1.3.2 / v1.3.1 / v1.3.0 / v1.2.0 / v1.1.0 / v1.0.0).
