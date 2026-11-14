# P07 `vim-p07-docs-verify`: root-cause note, conditional input fix, full gates V0–V9

- **Wave:** 4
- **dependsOn:** `vim-p03-adapter`, `vim-p06-tauri-vim`, `vim-p08-engine-keymap-contract`, `vim-p09-keymap-store`, `vim-p10-readme` (p01, p02, p04 and p05 are landed)
- **Design:** `design-docs/specs/design-vim.md` rev 4:
  - §7 (native confirmation and the conditional input fix)
  - §8
  - §9 D8
  - §10 V0–V8
- **writePaths:**
  - `src/input/input.ts` (conditional, see Changes 2)
  - `test/input/native-dirty-sequence.test.ts` (conditional)
  - `dist` (artifact)
  - `perf-results` (artifact)
  - `examples/tauri-editor/dist` (artifact)
  - `examples/tauri-editor/src-tauri/target` (artifact)
  - `tmp/vim-20261111/vim-p07-docs-verify` (artifact)
  - `impl-plans/progress/vim-p07-docs-verify.md`
- **sharedPaths:**
  - `README.md`
- **sharedPathNotes:**
  - `README.md`: p10 (wave 3) wrote the vim, keymap and Tauri sections. p07 only appends the dirty-on-launch root-cause paragraph and the V7 observation status inside the existing Tauri section. Do not rewrite p10's text.

## Intent

Prove every acceptance gate after all feature plans join. That includes:
- the **byte-identical core bundle**
- the DR-06 timing regression
- the Tauri keymap smoke
- the native debug build

Also record the dirty-on-launch root cause and its observation status.

## Non-goals

- No feature work and no edits to other plans' files. A failing gate is recorded with its log path and owning plan; serial reconciliation repairs it.
- Do not implement user-qa #1 or user-qa #5.
- Do not run any GUI app in the background.
- Plan archiving is done by the workflow's `plan-archive` node, not by this plan.

## Changes

### 1. `README.md` (append only)

In the Tauri section, add the dirty-on-launch paragraph:
- the root cause is any `docChanged` setting dirty without a content comparison
- the fix is the `clean` baseline
- the V7 status: the observed event, or "analyzed, not natively observed"

### 2. Conditional input fix

This applies **only if** V7 is natively observed **and** shows a non-identical `docChanged` coming from an emaki input path. Then:
1. Make a minimal fix in `src/input/input.ts`.
2. Add `test/input/native-dirty-sequence.test.ts` (jsdom), which replays the observed sequence. Imitate `test/input/vertical-motion.test.ts`.
3. Re-run V1–V3. V2 must remain byte-identical; otherwise stop and record a blocker.

Otherwise, do not touch either file.

## Verification

Run from the repository root unless noted. Each log goes to `tmp/vim-20261111/vim-p07-docs-verify/<name>.log`. Use foreground runs only and record each exit code.

| # | command | must show |
|---|---|---|
| V0 | `mkdir -p tmp/vim-20261111/vim-p07-docs-verify/base && git archive f204032b695104f402d3217542d7fb06f56feeed \| tar -x -C tmp/vim-20261111/vim-p07-docs-verify/base`, then `node scripts/bundle-size.mjs --root tmp/vim-20261111/vim-p07-docs-verify/base --entries core --out tmp/vim-20261111/vim-p07-docs-verify/core-before.json`. If `--root` is unsupported, run the script from inside `base` with a symlinked `node_modules`, and record the method used. **Then** `rm -rf tmp/vim-20261111/vim-p07-docs-verify/base && test ! -e tmp/vim-20261111/vim-p07-docs-verify/base` (see Amendment, round 2) | exit 0; `core-before.json` exists; `base` is removed |
| V1 | `npm run check && npm test && npm run build && node scripts/bundle-size.mjs --out tmp/vim-20261111/vim-p07-docs-verify/all.json` | exit 0. `test/vim/*` (including `editor-integration`, `public-api` and `keymap-store`) and `test/boundary.test.ts` pass. `all.json` has `./vim` |
| V1t | `npx vitest run test/vim/editor-integration.test.ts test/vim/keymap-controller.test.ts test/vim/mapper.test.ts` | exit 0, and the DR-06 timing cases are listed as passed |
| V2 | `node scripts/bundle-size.mjs --entries core --out tmp/vim-20261111/vim-p07-docs-verify/core-after.json`, then a `node -e` comparison of `entries[k].raw` and `.gzip` for `.`, `./engine`, `./json` and `./diff`, exiting 1 on any difference | exit 0, with identical bytes |
| V2b | `git diff --name-only f204032 -- src ':!src/vim'` | empty, or only `src/input/input.ts` when Changes 2 applied |
| V3 | `npm run perf` | exit 0 with the harness's pass criteria. A noise regression is recorded, not fixed |
| V4 | `cd examples/tauri-editor && npm run check && npm run build && npm run smoke` | exit 0. The smoke JSON has every check `ok`: the old ones, p04, and p06 checks 1–12 |
| V5 | `cd examples/tauri-editor/src-tauri && PATH="$HOME/.cargo/bin:$PATH" ~/.cargo/bin/cargo test` | exit 0, including the absolutize test. Never use the mise shim |
| V6 | `cd examples/tauri-editor && PATH="$HOME/.cargo/bin:$PATH" npx tauri build --debug --no-bundle` | exit 0; `src-tauri/target/debug/emaki-tauri-editor` exists |
| V7 | native observation | only with an interactive GUI session: run in the foreground with `traceDirty`, and record the `[dirty-trace]` lines and the title. Otherwise record "not observed (no GUI session)". Never claim a pass |
| V8 | `rg -n 'vactr\|solid-js\|/editor/' src test scripts` | no matches |
| V9 | `git status --porcelain` | no `node_modules`, `dist`, `target` or `tmp` entries. `package-lock.json`, `examples/tauri-editor/package-lock.json` and `Cargo.lock` are unchanged |

## Done criteria

- V0–V6, V8 and V9 meet their expectations, and V7 is recorded honestly.
- The progress log contains:
  - every command with its exit code and full log path
  - the V2 byte table
  - the root-cause statement for the commit message
  - a short summary of the rev 4 features: the C1 additions, the bang fix, the DR-06 scheduler, the KeymapStore, and the Tauri keymap

## Implementation status

The archive blocker is resolved and V1, V1t, V2, V2b, V4–V6, V8 and V9 passed. V7 was not observed (no GUI session). V3 exited 1 again on six WebKit thresholds; its cause is unclassified and the required gate remains incomplete. See `impl-plans/progress/vim-p07-docs-verify.md` for evidence and reconciliation.

## Amendment 2026-11-11 (blocked-wave-scope-or-contract, round 2)

**Blocker (wave-006).** V1 exited 1: `test/boundary.test.ts` > "keeps the package independent" failed with 1 of 1505 tests failing (log `tmp/vim-20261111/vim-p07-docs-verify/v1.log`). The six violations are all inside the V0 archive, under `tmp/vim-20261111/vim-p07-docs-verify/base/examples/tauri-editor/...`.

**Root cause (confirmed).** The package-independence walk (`test/boundary.test.ts:89-100`, `walk('')`) scans the whole repository. It skips only `node_modules`, `dist` and the live `examples/tauri-editor` path, so a full checkout extracted under `tmp/` is scanned as package source.

**Decision.** No boundary-test change and no extra paths; the fix stays inside p07's own artifact root. The V0 base archive is **transient**:
1. Extract it.
2. Write `core-before.json`.
3. Delete `tmp/vim-20261111/vim-p07-docs-verify/base` before any later gate.

`core-before.json`, the commit id `f204032b695104f402d3217542d7fb06f56feeed` and `v0.log` are the retained V0 evidence. The base directory itself is not evidence.

**Resume steps.**
1. If `tmp/vim-20261111/vim-p07-docs-verify/core-before.json` exists from the earlier run and `v0.log` shows exit 0, keep it. Otherwise rerun V0.
2. `rm -rf tmp/vim-20261111/vim-p07-docs-verify/base`, then `test ! -e tmp/vim-20261111/vim-p07-docs-verify/base`. Log to `cleanup-base.log`.
3. Rerun V1, then V1t through V9 in order, as specified above. The README append and V7 "not observed" note already made in wave-006 stay as they are. Do not duplicate the README paragraph.

**Forbidden.** Editing `test/boundary.test.ts`. Moving the archive elsewhere inside the repository. Skipping V1. Weakening any gate.
