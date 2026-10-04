# QA log â€” environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.95 Â· Edge: Edg/154.0.4258.53
- Revision: d6449ff Â· 2026-10-04T16:37:57.107Z

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

## Rollback drill — executed evidence (v1.4.0)
- Annotated tag v1.4.0 -> commit b6f328fc515a41893994961bbbecd76cb051734c (QA revision d6449ff on the same tree).
- Change: the sequence mark (the symbol shown in the 3rd phase / side-copy stage and everywhere after the swap, incl. the docked footer copy) replaced with the artwork exported from the supplied PSD (thin outlined weave, #58C1C9); footer-left logo reverted to the wordmark (previous change undone). Mark PNG fallbacks regenerated.
- Kept releases for one-step restore: v1.3.9, v1.3.8, ... v1.0.0.
- Worktree smoke: v1.4.0 served on 8081; shot qa/evidence/rollback/v1.4.0-symbol.png (qa=0.5; exit=0).
- Archive: qa/evidence/rollback/dist-v1.4.0.zip; SHA-256: 56C7BD513B07A92372382AAC7242A7CF0B378FC40616234648516D9E3E1EBC37

## GitHub mirror lag (2026-10-04)
- Mirror rebuilt at v1.4.0 (main 75c43dc, 14 tags, staged in .cluster\robotics-site\github-mirror).
- Push blocked: the stored GitHub OAuth token (gho_) read via CredMan was rejected ("Invalid username or token") - it expired/revoked since the Oct 3 push. Remote currently at the v1.3.8-era mirror (main 4424c7a). Fix: run git push -f origin main --tags in the mirror folder from a user terminal (interactive GCM re-login), or provide a PAT.
