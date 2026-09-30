# QA log â€” environment, commands, honesty notes (v1.3.3)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 Â· Edge: Edg/154.0.4258.37
- Revision: fe38c43 Â· 2026-09-30T13:27:49.851Z

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

## Revert (Ctrl+Z) — executed evidence (v1.3.5)
- User request: undo the v1.3.4 reorder. The tree was restored to the v1.3.3 content via git checkout v1.3.3 -- . and committed.
- Revert commit: 0b899ba; annotated tag v1.3.5 -> 0b899bafbf950c10df126e5b102b2386f23c15bc.
- The reverted tree equals the v1.3.3 released tree (which passed its own full QA: 27 PASS / 0 FAIL at revision fe38c43).
- Worktree smoke: clean worktree of v1.3.5 served on port 8081; screenshot qa/evidence/rollback/v1.3.5-intro.png (1440x900; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.5.zip; SHA-256: 8CB48B4330F7C5482C7460B1021EEF9B6DDAC96B8061D074287E13929D869E01
- v1.3.4 remains available in history and as its own archive (dist-v1.3.4.zip) if this needs to be flipped back.
