# QA log â€” environment, commands, honesty notes (v1.3.1)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 Â· Edge: Edg/154.0.4258.37
- Revision: 2dcd960 Â· 2026-09-29T17:18:22.521Z

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

## Rollback drill — executed evidence (v1.3.1)
- Annotated tag v1.3.1 -> commit 3c61d81deed65f1a0a523c962faa08a603f5fd5d (QA revision in qa-report.md = 2dcd960, the code parent; identical code tree).
- Kept releases for one-step restore: v1.3.0, v1.2.0, v1.1.0, v1.0.0 — tags + archives under qa/evidence/rollback/.
- git show v1.3.1 --stat -> qa/evidence/rollback/tag-show-v1.3.1.txt
- Worktree checkout smoke: a clean worktree of v1.3.1 served on port 8081; screenshot qa/evidence/rollback/v1.3.1-bigstate.png (big state at qa=0.86; zero console errors; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.1.zip; SHA-256: 9184C261878FC1A8DC785EE56A685CF704816CFC1E61FAE3A3EAEC0E83C94173
- Limits: repository-level restore demonstrated on this machine; hosting/CDN rollback not covered. Remote: none configured.
