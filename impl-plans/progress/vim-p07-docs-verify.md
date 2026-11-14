# P07 progress: blocked during combined verification

All five dependencies were accepted in the dispatch. The design rev 4 and P07 plan agree on the verification and conditional input fix. V7: not observed (no GUI session); neither input file was edited.

| Gate | Command | Exit | Log |
| --- | --- | --- | --- |
| V0 | `mkdir -p tmp/vim-20261111/vim-p07-docs-verify/base; set -o pipefail; git archive f204032b695104f402d3217542d7fb06f56feeed \| tar -x -C tmp/vim-20261111/vim-p07-docs-verify/base && node scripts/bundle-size.mjs --root tmp/vim-20261111/vim-p07-docs-verify/base --entries core --out tmp/vim-20261111/vim-p07-docs-verify/core-before.json` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v0.log` (bundle output; archive emitted no output) |
| V1 | `npm run check && npm test && npm run build && node scripts/bundle-size.mjs --out tmp/vim-20261111/vim-p07-docs-verify/all.json` | 1 | `tmp/vim-20261111/vim-p07-docs-verify/v1.log` |

V1 ran 1505 tests: 1504 passed, one failed. `test/boundary.test.ts` recursively scans the V0 archive under `tmp/` and reports six forbidden imports in its example files. The test is outside P07's write scope. Preserve the V0 archive and obtain an approved boundary-test or plan amendment; rerun V1 and the remaining gates on the final combined tree. V1t, V2, V2b, V3–V6, V8 and V9 have not run; no V2 byte comparison is yet available.

The dirty-on-launch root cause was analyzed, not natively observed: any `docChanged` marked dirty without a content comparison; the example compares to a clean baseline. Rev 4 adds C1 `setKeymap` and cmdline contracts, fixes bang forwarding, gives the adapter a cancelable DR-06 scheduler, adds KeymapStore persistence, and loads Tauri keymaps through the dialog. Formal reviews, archive and commit belong to downstream workflow steps.

## Amendment retry (current evidence)

The previous archive blocker is superseded: `core-before.json` and `v0.log` were retained, and the transient base was removed before V1. The following commands ran in the foreground on the shared integration tree; paths are relative to the repository root. V7 remains **not observed (no GUI session)**; neither conditional input file was edited. The previous README paragraph remains intact.

| Gate | Command | Exit | Complete log |
| --- | --- | --- | --- |
| V0 cleanup | `python3 -c 'import pathlib,shutil; p=pathlib.Path("tmp/vim-20261111/vim-p07-docs-verify"); assert (p/"core-before.json").is_file(); shutil.rmtree(p/"base", ignore_errors=True); assert not (p/"base").exists(); (p/"cleanup-base.log").write_text("Baseline exists; transient base removed; exit 0\n")'` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/cleanup-base.log` |
| V1 | `npm run check && npm test && npm run build && node scripts/bundle-size.mjs --out tmp/vim-20261111/vim-p07-docs-verify/all.json` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v1-retry.log` (1505 passed) |
| V1t | `npx vitest run test/vim/editor-integration.test.ts test/vim/keymap-controller.test.ts test/vim/mapper.test.ts --reporter=verbose` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v1t-retry.log` (60 passed, including five DR-06 timing cases) |
| V2 | `node scripts/bundle-size.mjs --entries core --out tmp/vim-20261111/vim-p07-docs-verify/core-after.json` and compare baseline/current raw and gzip entries with Node | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v2-retry.log` |
| V2b | `git diff --name-only f204032b695104f402d3217542d7fb06f56feeed -- src ':!src/vim'` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v2b-retry.log` (empty) |
| V3 | `npm run perf` | 1 | `tmp/vim-20261111/vim-p07-docs-verify/v3-retry.log` |
| V4 | `cd examples/tauri-editor && npm run check && npm run build && npm run smoke` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v4-retry.log` (30 smoke checks passed) |
| V5 | `cd examples/tauri-editor/src-tauri && PATH="$HOME/.cargo/bin:$PATH" ~/.cargo/bin/cargo test` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v5-retry.log` (8 passed) |
| V6 | `cd examples/tauri-editor && PATH="$HOME/.cargo/bin:$PATH" npx tauri build --debug --no-bundle && test -f src-tauri/target/debug/emaki-tauri-editor` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v6-retry.log` |
| V8 | `! rg -n 'vactr\|solid-js\|/editor/' src test scripts` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v8-retry.log` (empty) |
| V9 | `git status --porcelain` | 0 | `tmp/vim-20261111/vim-p07-docs-verify/v9-retry.log` (no generated artifacts or lockfiles listed) |

V2 raw/gzip bytes before and after: `.` 160599/42528; `./engine` 158740/42723; `./json` 2853/1387; `./diff` 3011/1269.

V3 remains a failed required gate: WebKit `firstPaintMs` 275 ms, `firstPaintMs@c` 2962 ms, and `firstPaintMs@css` 443 ms exceeded the 200 ms budget. The cause is unclassified; do not claim a passing gate or assume noise without evidence. Full samples: `perf-results/2026-11-11T02-27-06.809Z`. Serial reconciliation must investigate and obtain a passing required run. Formal review, archive and commit remain downstream.

## Continuation 1: full V3 rerun

`npm run perf` exited **1**, complete log `tmp/vim-20261111/vim-p07-docs-verify/v3-continuation-1.log`; samples `perf-results/2026-11-11T02-43-18.560Z`. WebKit failures: firstPaintMs 285 ms, firstPaintMs@rust 299 ms, firstPaintMs@c 1251 ms, firstPaintMs@html 401 ms and firstPaintMs@css 404 ms (200 ms budgets); keyWorkP95@markdown 19 ms (16.7 ms budget). V3 remains incomplete. The previous run's `env.json` reported load averages rising from 24.52 to 100.94 on a 10-core host, and its first-paint failures included isolated outliers; contention is plausible but not established as the cause. No threshold or harness changes were made.

## Operator disposition (V3 perf)

V3 failures were host-load noise, not a regression. With load average ~30-50 (concurrent agent workflows), the baseline f204032 also failed WebKit firstPaintMs@rust (259 ms > 200 ms). The core source outside src/vim is byte-identical to the baseline (V2b empty; V2 bytes unchanged). Re-run at load ~7: `npm run perf` on this tree exit 0, allPass true. The p07 plan is closed by operator decision. V7 (native GUI observation) remains pending, blocked on an unlocked GUI session.
