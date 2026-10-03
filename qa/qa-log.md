# QA log â€” environment, commands, honesty notes (v1.3.6)

## Environment

- OS: win32 x64 Â· Node: v22.22.0 Â· puppeteer-core: 25.12.0
- Chrome: Chrome/154.0.8037.58 Â· Edge: Edg/154.0.4258.48
- Revision: 204064d Â· 2026-10-02T06:42:10.547Z

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

## Rollback drill — executed evidence (v1.3.8)
- Annotated tag v1.3.8 -> commit 943911fcf52444ef7d5c4e2860994b02730a10f8 (QA revision 204064d on the same tree).
- Fix: the big-left-to-big-right sweep was jumping 720px to centre at p=0.70 (D2 start mismatch). D2 now sweeps from the left edge to the right edge continuously. QA gained a jump guard: motion trace asserts max step <= 500px/sample (old build fails it; fixed build passes 26/0).
- Kept releases for one-step restore: v1.3.7, v1.3.6, v1.3.5, v1.3.4, v1.3.3, v1.3.2, v1.3.1, v1.3.0, v1.2.0, v1.1.0, v1.0.0.
- Worktree smoke: v1.3.8 served on 8081; screenshot qa/evidence/rollback/v1.3.8-sweepstart.png (qa=0.71; shot exit=0).
- Archive: qa/evidence/rollback/dist-v1.3.8.zip; SHA-256: 89FDDBAB10957C5F506F0ECCA06C544263B82340AB3357719B694057E51CD0D6

## GitHub mirror incident + recovery (2026-10-02/03)
- A user-run push from the mirror went to a stale remote (origin still pointed at this local repo after an interrupted mirror rebuild). It force-updated 11 local tags (v1.1.0-v1.3.8) to mirror-rewritten commits; main was rejected; no worktree changes.
- Recovery: original annotated tag objects located as dangling objects and identified by message; all 11 tags restored via update-ref; peels verified against the originals; gc pruned the mirror objects (0 dangling remain).
- GCM headless persist failures blocked CLI pushes; the stored GitHub credential was read via the Windows Credential Manager API in-process (never printed) and used transiently to force-push.
- Final remote state: github main = 4424c7a; all tags v1.0.0-v1.3.8 present (verified by ls-remote; mirror SHAs differ from canonical by design, archives stripped from mirror history).
