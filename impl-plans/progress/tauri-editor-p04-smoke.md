# P04 smoke implementation progress

- Implemented `examples/tauri-editor/scripts/smoke.mjs` against design §8 and the accepted P02 mock contract. Pre-edit file was absent; intent is in `tmp/tauri-editor-20261110/tauri-editor-p04-smoke/intent-01.txt`, post-edit snapshot in `post-01.txt`; SHA-256 `f1f21b803788cc90f3eb57e8ac86d5e7382a834b5d00a1648014014b36a264ab`.
- `node --check scripts/smoke.mjs`: exit 0, `syntax.log`.
- `npm run smoke`: exit 0, 12 passed, 0 failed, `smoke-attempt1.log`. Covers open, edit, save, deferred write and guard, write error, Save As cancel, fallback and 71 registry options. Uses ControlOrMeta+End.
- Browser and in-process Vite server close in `finally`; listener inventory: `ports-after.log`.
- Verification ran on the shared working tree. Formal integrity and adversarial reviews remain downstream.
