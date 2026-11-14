# P01 engine contract progress

Implementation scope: internal tags, grammar compiler, five family factories, fixture helper, tests, and the sole fixture exclusion in tsconfig. Grammar and families are not re-exported. No predecessor dependencies; design §§4.4–5.4 agrees with the pinned P01 contract.

Acceptance: required contracts exist; language tests cover multiline, captures, zero-length matches, astral characters, eolPop, static/dynamic/nested embeds and long-line transitions; tsconfig adds only the fixture exclude; forbidden core files remain unchanged; owned-path diagnostics are empty. Formal review and final commit are downstream.

Pre-edit: all new P01 source/test/progress files were absent; tsconfig SHA-256 `bc7edf7d6f42bff48a0cf9bdfd8d140ab18ff7f9643c15308a9ecee1ee5b2e56`. Per-edit snapshots and intentions are in `tmp/syntax-highlighting-20261102/syntax-p01-engine-contract/`. Post-edit SHA-256:
725aba6a399515d132fbb7ab4e0733d36fdd1444f27398eb57e1f3a0fbb72721  src/language/tags.ts
5df96f593097696c7783c8c092db065983958d9b21a5f2b36084ba586160685c  src/language/grammar.ts
f9b3fd4b2f49ce03afa67918db8ce73e48d66dd91c9f5f4f0f5c77da7e557b70  src/language/families/c-like.ts
ce870e0223b16e09349c0c99f7492b9ea3983639245e861680725fab8a12dbb9  src/language/families/ini-like.ts
1e750e5e57f320bd7ae396d34f79cc5863d4df6a5d2d8d2e0a9b9944c09872c3  src/language/families/lisp-like.ts
29018af2a87c4914a42d5b98c94b6329019672a0de5b94a50e455ede9fb036fb  src/language/families/markup-like.ts
118ddf48349e0cb39188df4ab484da00913af0d3717c9546b405aef2f8824b86  src/language/families/shell-like.ts
a6e42febd9b6080da38951c3b0c329320183ecf38153bfc12a87084f6c4e4756  test/language/support/fixture-check.ts
3b19464881dc31fc219a37289b3bb04aaf11789cc8215784da4b8ccab6fca5f0  test/language/grammar.test.ts
a92d6599d1c1398d9a18023b947d7aac5eafcaa036fe90105a9ac75f711f2bc0  test/language/families.test.ts
04d18372c60a5a891e56bc8a8af6c21f755535d484ef66bd34da8686cbcfbea5  test/language/tags.test.ts
b018024c89844d3cd2aa21aa2235d53d833189c91c06e7421b9806a5e49497ff  tsconfig.json

Foreground verification on the moving shared tree (complete logs in `tmp/syntax-highlighting-20261102/syntax-p01-engine-contract/`):
- `npx vitest run test/language`: exit 0, 28 passed, `test.log`.
- `npm run check`: exit 0, `check.log`.
- P01 check-log owned-path grep: exit 1, no matches, `check-owned.log`.
- `npx vitest run test/boundary.test.ts`: exit 1, 1 passed / 1 failed, `boundary.log`. Informational workspace failure: `tmp/syntax-highlighting-20261102/checkpoint/gen.mjs` has forbidden text and an import; checkpoint evidence is outside P01 ownership, with no plan owner identified. No P01 path is named.
- P01 boundary-log owned-path grep: exit 1, no matches, `boundary-owned.log`.
- `grep -n 'export function compileGrammar' src/language/grammar.ts`: exit 0, `signature.log`.
- `git diff --stat -- src/index.ts src/engine.ts src/language/index.ts src/language/incremental.ts src/types.ts`: exit 0 and empty, `forbidden-diff.log`.

The boundary-test restoration described below is blocked on an owner-authorized change outside P01's write paths. No review decision is claimed here.

## Current-source author self-check

The existing implementation was present in the pre-node snapshot. The author self-check added a per-position zero-width rule guard and surrogate-boundary checks, with regression coverage for a state cycle and astral input. Pre-edit snapshots, intent, and hashes are under `tmp/syntax-highlighting-20261102/syntax-p01-engine-contract/`. Current SHA-256: grammar.ts `55cddf2a9af0373701a03b329eaf48d969577a43d11a66012ff7ca070b4c280f`; grammar.test.ts `01737fe0d7bc8fb5ef3395697701f6765fe8b213cd9cd1484d2202f57477055f`. Other owned hashes remain as recorded above.

Moving-tree foreground verification (complete logs in `tmp/syntax-highlighting-20261102/syntax-p01-engine-contract/`): `npx vitest run test/language` exit 0, 29 passed (`final-test.log`); `npm run check` exit 0 (`final-check.log`); owned check grep exit 1, no matches (`final-check-owned.log`); `npx vitest run test/boundary.test.ts` exit 0, 2 passed (`final-boundary.log`); owned boundary grep exit 1, no matches (`final-boundary-owned.log`); signature grep exit 0 (`final-signature.log`); forbidden core diff exit 0, empty (`final-forbidden.log`). The passing boundary runs used an unowned modification to `test/boundary.test.ts` that skips root `tmp`, `.git`, `coverage`, `perf-results`, `test-results`, and `playwright-report`; P01 did not author that modification and its author is unknown. These narrowed runs do not supersede the earlier boundary failure. The workspace boundary exit is informational for P01; the assigned gate is the owned-path grep, which printed nothing. Formal reviews, serial integration checks and commit remain downstream.

## Test-integrity revision: p01-ti-boundary-narrowing

`git diff --stat -- test/boundary.test.ts` exit 0 shows one modified file (`revision-boundary-diff.log`). `npx vitest run test/language` exit 0, 29 passed (`revision-test.log`). The orchestrator/reconcile owner must restore `test/boundary.test.ts` to HEAD or provide an explicit scope amendment; it is outside P01's write paths. Once restored, rerun the boundary test and owned-path grep, and record their actual exits and logs. Do not delete or move `tmp/syntax-highlighting-20261102/checkpoint/gen.mjs`.

## Amendment round 1: restored boundary scope

The orchestrator-owned `tmp/syntax-highlighting-20261102/checkpoint/gen.mjs` remains present (`test ! -e`, exit 1). P01 did not move or edit it. `git checkout 0e8f398 -- test/boundary.test.ts` exited 0; SHA-256 before `be5f3461e99672a3e85bc7e03ec43349d7ba539d001513a01972efb711e5dcfd`, after `7f8da167a567de7c3e7edfe857242e8ed7de6a3bf398b1b7544d33bcffdd61a1`. `git diff --quiet 0e8f398 -- test/boundary.test.ts` exited 0. Earlier passes using the narrowed test do not count.

Foreground, current-source logs under `tmp/syntax-p01/`: `npx vitest run test/language` exit 0, 29 passed (`test.log`); `npm run check` exit 0 (`check.log`); check owned-path grep exit 1, empty (`check-owned.log`); `npx vitest run test/boundary.test.ts` exit 1, 1 passed and 1 failed (`boundary.log`); boundary owned-path grep exit 1, empty (`boundary-owned.log`); compileGrammar signature grep exit 0 (`signature.log`); protected-file diff exit 0, empty (`protected.log`); restore and checkpoint diff exit 0 (`restore.log`, `diff.log`).

Blocker: the restored boundary test reports only `tmp/syntax-highlighting-20261102/checkpoint/gen.mjs` (forbidden text and disallowed import). The orchestrator must relocate that file outside the scanned repository and record the move, then rerun the boundary test and owned-path grep. Formal test-integrity and adversarial reviews follow successful implementation verification.

## Integration redispatch: current verification

The previous blocker is cleared: `test ! -e tmp/syntax-highlighting-20261102/checkpoint/gen.mjs` exited 0. The boundary file already matched checkpoint `0e8f398`; `git diff --quiet 0e8f398 -- test/boundary.test.ts` exited 0, SHA-256 `7f8da167a567de7c3e7edfe857242e8ed7de6a3bf398b1b7544d33bcffdd61a1`. No further restore was necessary. Added a regression proving a script embed closes past offset 4096 and host tagging resumes. Grammar SHA-256 `55cddf2a9af0373701a03b329eaf48d969577a43d11a66012ff7ca070b4c280f`; grammar test SHA-256 `045705d63ffa0f0e4f40392bfb8ac08d97db386c0bdff30334a102591c64cb4c`.

Final-source foreground logs under `tmp/syntax-p01/`: `npx vitest run test/language` exit 0, 30 passed (`final2-test.log`); `npm run check` exit 0 (`final2-check.log`); check owned-path grep exit 1, empty (`final2-check-owned.log`); `npx vitest run test/boundary.test.ts` exit 0, 2 passed (`final2-boundary.log`); boundary owned-path grep exit 1, empty (`final2-boundary-owned.log`). Signature grep exit 0 (`rerun-signature.log`). Protected files are unchanged and tsconfig contains only the fixture exclusion. Formal test-integrity and adversarial review decisions remain downstream; no acceptance is claimed here.

## Redispatch at a42f676: implementation verification

The earlier boundary blocker is resolved; the checkpoint generator is absent and the unchanged boundary test matches both HEAD and 0e8f398. The prior narrowed boundary pass remains invalid historical evidence. Accepted design §§4.4–5.4 and 9.1 align with the P01 contract; current grammar scans to the true end, and the existing long-line comment and script regressions remain in place. No source change was needed in this redispatch.

Current SHA-256 identities for every P01 source, test and shared tsconfig are in `tmp/syntax-highlighting-20261102/syntax-p01-engine-contract/redispatch-hashes.log`. `git status --short --untracked-files=all` is preserved in `redispatch-status.log`. P01 owns the grammar, tags, families, helper, three named tests, its progress log and fixture-only tsconfig exclusion. `scripts/bundle-size.mjs` and P00 progress are P00 output; the language modules, fixtures, expectations, language-group tests and other plan progress files are preserved foreign outputs owned by P02–P08 or their respective plans, not P01. No foreign files were edited. Native change tracking and serial reconciliation must classify the full status inventory.

Fresh foreground results on the shared tree, with complete logs in `tmp/syntax-highlighting-20261102/syntax-p01-engine-contract/`:
- `npx vitest run test/language`: exit 0, 100 passed (`redispatch-language.log`).
- `npm run check`: exit 0 (`redispatch-check.log`); P01 diagnostic grep exit 1, no matches (`redispatch-check-owned.log`).
- `npx vitest run test/boundary.test.ts`: exit 0, 2 passed (`redispatch-boundary.log`); P01 diagnostic grep exit 1, no matches (`redispatch-boundary-owned.log`).
- `npm test`: exit 0, 223 passed (`redispatch-all-tests.log`).
- `node scripts/bundle-size.mjs --entries core`: exit 0, core gzip 42528 bytes, equal to the P00 baseline (`redispatch-bundle.log`).
- Boundary HEAD and checkpoint diffs exit 0; protected-file diff exit 0 and empty; compileGrammar signature grep exit 0; relocated-file check exit 0 (`redispatch-boundary-head.log`, `redispatch-boundary-checkpoint.log`, `redispatch-protected.log`, `redispatch-signature.log`, `redispatch-relocated.log`).

Formal test-integrity and adversarial decisions, native fanout join and session-specific wave summary are workflow-owned downstream operations; no review acceptance or provenance is fabricated here. The current implementation has no remaining identified P01 source or behavioral verification blocker.
