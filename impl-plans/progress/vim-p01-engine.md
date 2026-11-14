# P01 implementation progress — incomplete

Reference modules currently present: actions.ts, controller.ts, ex.ts, execute.ts, extended.ts, hints.ts, hop.ts, host.ts, keymap-runtime.ts, keymap-schema.ts, keys.ts, mapper.ts, marks.ts, motions.ts, notation.ts, operators.ts, parser.ts, record.ts, registers.ts, search.ts, session.ts, surround.ts, textobjects.ts, types.ts, undo.ts, words.ts; presets are in `src/vim/presets/`.

C1 host types and a state-backed fixture exist. The controller currently uses an internal compatibility shim. Surface mapping still requires review: state/dispatch, history, viewport/scroll, clipboard and editing are shimmed; app actions and announcements are no-ops; overlays, options and update synchronization are incomplete. Hints are currently retained, but their rendering decision is not complete.

| Reference suite | Target | Status |
|---|---|---|
| actions.test.ts | test/vim/actions.test.ts | ported; counts pending |
| controller-io.test.ts | test/vim/controller-io.test.ts | not yet ported |
| controller.test.ts | test/vim/controller.test.ts | not yet ported |
| extended-controller.test.ts | test/vim/extended-controller.test.ts | not yet ported |
| extended.test.ts | test/vim/extended.test.ts | ported; counts pending |
| hints.test.ts | test/vim/hints.test.ts | ported; counts pending |
| hop.test.ts | test/vim/hop.test.ts | ported; counts pending |
| host-keymap.test.ts | test/vim/host-keymap.test.ts | not yet ported |
| keymap-controller.test.ts | test/vim/keymap-controller.test.ts | not yet ported |
| keymap-parity.test.ts | test/vim/keymap-parity.test.ts | not yet ported |
| keymap-schema.test.ts | test/vim/keymap-schema.test.ts | ported; counts pending |
| keys-extended.test.ts | test/vim/keys-extended.test.ts | ported; counts pending |
| keys.test.ts | test/vim/keys.test.ts | ported; counts pending |
| macro-marks.test.ts | test/vim/macro-marks.test.ts | not yet ported |
| mapper.test.ts | test/vim/mapper.test.ts | ported; counts pending |
| marks.test.ts | test/vim/marks.test.ts | ported; counts pending |
| motions.test.ts | test/vim/motions.test.ts | ported; counts pending |
| notation.test.ts | test/vim/notation.test.ts | ported; counts pending |
| operators.test.ts | test/vim/operators.test.ts | ported; counts pending |
| parser-extended.test.ts | test/vim/parser-extended.test.ts | ported; counts pending |
| parser.test.ts | test/vim/parser.test.ts | ported; counts pending |
| presets.test.ts | test/vim/presets.test.ts | ported; counts pending |
| purity.test.ts | test/vim/purity.test.ts | ported; counts pending |
| record.test.ts | test/vim/record.test.ts | ported; counts pending |
| registers.test.ts | test/vim/registers.test.ts | ported; counts pending |
| search-ex.test.ts | test/vim/search-ex.test.ts | ported; counts pending |
| surround.test.ts | test/vim/surround.test.ts | ported; counts pending |
| textobjects.test.ts | test/vim/textobjects.test.ts | ported; counts pending |
| undo-repeat.test.ts | test/vim/undo-repeat.test.ts | not yet ported |
| undo.test.ts | test/vim/undo.test.ts | ported; counts pending |
| words.test.ts | test/vim/words.test.ts | ported; counts pending |
| vim-clipboard.test.ts | test/vim/clipboard.test.ts | not yet ported |
| vim-settings.test.ts | test/vim/settings.test.ts | not yet ported |
| vim-keymap-store.test.ts | test/vim/keymap-store.test.ts | not yet ported |

Case counts, exclusion classification, and full surface mapping remain outstanding. Renamed application-specific action IDs are placeholders and require reconciliation with the accepted design.

Current-source gates (moving shared tree): `npx vitest run test/vim` exit 1, 860 passed and 1 failed (purity: controller timer global); `npx tsc --noEmit` exit 0; `npx vitest run test/boundary.test.ts` exit 0, 4 passed; forbidden-string negated check exit 0. Complete logs are in `tmp/vim-20261111/vim-p01-engine/`.

Remaining: controller contract and behavioral cases, missing suites, inventory and exclusion table, hints decision, final verification. Review and commit are downstream workflow steps.

Review repair: the reference injects scheduling via its host. `VimEngineOptions.timer` is optional; p03 may pass it through unchanged. Without it, zero-delay callbacks use a cancellable microtask and nonzero delays remain pending. `npx vitest run test/vim` now exits 0 (861 passed, 23 files), purity exits 0 (1 passed), `npx tsc --noEmit` exits 0, boundary exits 0 (4 passed), and both raw forbidden-string and timer-global searches exit 1 with no matches. Logs: `tmp/vim-20261111/vim-p01-engine/revision-{vim,purity,tsc,boundary,forbidden,timer-rg}.log`. The missing suites and controller behavior remain incomplete; a passing existing suite does not satisfy the required port. The repair's narrower allowed paths omit required `test/vim/macro-marks.test.ts`; scope clarification is needed before creating it.

## Integration-review rerun (incomplete)

The latest dispatch restores `macro-marks.test.ts` to P01 scope. The controller now compiles the optional keymap or named preset and filters public subscription notifications to changes in C1 state. `test/vim/controller.test.ts` adds six focused C1 cases, including E492, E486, prompt cancellation, Meta pass-through, keymap and notification behavior. These cases do not constitute the full reference controller suite. The reference injects its timer in its mount layer; the existing optional timer and zero-delay microtask fallback remain in place.

On the moving shared tree, `npx vitest run test/vim` exited 0 (871 passed, 25 files), `npx tsc --noEmit` exited 0, and `npx vitest run test/boundary.test.ts` exited 0 (4 passed). Logs are `tmp/vim-20261111/vim-p01-engine/rerun3-{vim,tsc,boundary}.log`. `controller-io.test.ts` appeared concurrently and was preserved.

Still required: complete all reference suite ports and case-level exclusion table, surface mapping, hints and overlay decision/implementation, external update synchronization, action identifier reconciliation, and full final-source verification. Keymap option invalid-input behavior and subscription reentrancy also need review. The prior statement that macro-marks is outside scope is superseded. Formal review, commit and push are downstream.

Final rerun on the moving tree after the subscription reentrancy adjustment: `npx vitest run test/vim` exit 0 (871/871); purity exit 0 (1/1); `npx tsc --noEmit` exit 0; boundary exit 0 (4/4); timer-global and forbidden-string raw searches exit 1 with no matches. Complete logs: `tmp/vim-20261111/vim-p01-engine/final-{vim,purity,tsc,boundary,timer,forbidden}.log`. Nine suite files remain absent: extended-controller, host-keymap, keymap-controller, keymap-parity, macro-marks, undo-repeat, clipboard, settings, keymap-store. Existing controller and controller-io files do not establish a complete reference port. Implementation remains incomplete.

## Continuation 1 — incomplete

Controller changes: C1 external document updates in insert/replace are recorded as text changes because C1 does not carry transaction annotations; synchronous echoes of controller dispatch are suppressed. Search, hop and hints now render through `emaki-vim-search`, `emaki-vim-hop`, and `emaki-vim-hints` marks. Hints are retained as cursor-anchored labels containing the summary and entries. The next command clears an earlier message. Search marks and cleanup are tested; hop and hint rendering still need focused tests. C1 cannot distinguish external non-input document changes during an insert session; this inference needs review.

| Reference surface member | C1 or local mapping |
|---|---|
| state, dispatch | `state`, `dispatch`; controller dispatch echo suppressed |
| subscribe | `noteUpdate`, with external input inferred in insert/replace |
| undo, redo | `undo`, `redo` |
| historyReduced | unavailable; false |
| viewport, scrollLines, scrollCaret | `viewport`, `lineTop`, `scrollTo` |
| isVisible | `coordsAtPos` |
| clipboard | optional clipboard adapter or internal mirror |
| typeText, defaultKey | dispatch and CodeMirror newline command |
| timer | optional injected timer; zero-delay microtask fallback |
| actions, announce, popup, composition, platform, default keymap | dropped/no-op in engine shim; application-specific UI and transport are out of scope |
| overlays | `marks` owners listed above |

Application action identifiers were renamed by replacing the reference application prefix with `emaki.` for each of `evaluate`, `evaluateAll`, `hush`, `format`, `diagnostic.next`, `diagnostic.prev`, and `completion`; they currently call no-op shim actions. Hop identifiers remain unchanged. These placeholders need a design disposition; C1 has no action callback.

New suites: extended-controller 7/7 reference cases; macro-marks 18/19 (tapMode UI case excluded class 2); undo-repeat 32 cases adapted, with the tapMode UI operation replaced by i/Escape (class 2 operation not exercised); keymap-parity 33 parameterized cases, with dynamic reset replaced by reconstruction (same-instance reset unverified); keymap-controller 4 of 26 direct cases (22 unported); host-keymap 4 precedence cases, 11 reference cases still require individual disposition; clipboard 3 new C1 tests, with all five browser-wrapper reference cases excluded class 2: browser read/write, absent API, synchronous exception, asynchronous rejection, and absent jsdom clipboard. The existing controller and controller-io suites remain partial.

All five settings cases are class 2 persistence exclusions: absent storage defaults off; exact stored true/key; getItem error; writes and setItem errors; storage round-trip. All 12 keymap-store cases are class 2 persistence/transport exclusions: empty storage; raw JSON key round-trip; reset; unavailable storage read; unavailable write/reset; storage errors; oversized write; transport get; transport set; transport reset; transport errors; oversized transport write. Their target files remain absent; no empty or unrelated placeholder suite was created. The per-suite complete counts and exclusion table remain outstanding.

Focused `npx vitest run test/vim/controller.test.ts test/vim/macro-marks.test.ts test/vim/undo-repeat.test.ts` exited 0 (58 passed), log `tmp/vim-20261111/vim-p01-engine/continuation1-focused.log`. Additional per-port and earlier failing logs are retained in the same directory. Formal review and commit remain downstream.

Continuation final moving-tree gates: `npx vitest run test/vim` exit 0 (974 passed, 32 files); purity exit 0 (1 passed); `npx tsc --noEmit` exit 0; boundary exit 0 (4 passed); raw timer and forbidden-string searches exit 1 (no matches). Logs: `tmp/vim-20261111/vim-p01-engine/continuation1-final-{vim,purity,tsc,boundary,timer,forbidden}.log`. These do not close the absent suite and partial-port criteria.

## Continuation 2 — incomplete

`controller.test.ts` now includes 112 reference scenario rows and seven non-matrix cases, with the application hush assertion excluded class 2. `controller-io.test.ts` adds 19 portable cases (23 total); its platform shortcut matrix, modified deletion, popup/UI, replace Backspace, clipboard failure, scrolling and snapshot cases still require porting or case-level disposition. `keymap-controller.test.ts` now has 16 cases; ten reference cases remain to port or classify, including hop replay, disabled hop and extended activation. `host-keymap.test.ts` still has four precedence tests versus 11 reference declarations requiring disposition. Hop and hint mark lifecycle tests were added to their existing suites; `npx vitest run test/vim/hop.test.ts test/vim/hints.test.ts` exit 0, 40 passed, log `tmp/vim-20261111/vim-p01-engine/continuation2-overlays.log`.

Current moving-tree gates: `npx vitest run test/vim` exit 0 (1126 passed, 32 files); purity exit 0 (1 passed); `npx tsc --noEmit` exit 0; boundary exit 0 (4 passed); raw timer and forbidden-string searches exit 1 (no matches). Logs: `tmp/vim-20261111/vim-p01-engine/continuation2-final-{vim,purity,tsc,boundary,timer,forbidden}.log`. The two persistence-only target files remain absent, and the complete per-suite case and exclusion table remains outstanding. Parameterized declaration counts are not case counts; no completeness claim is inferred from matching declarations.

## Continuation 3 — incomplete

Ported three further keymap-controller cases: change-list traversal, double Escape search clearing and recorded hop replay. Fixed clipboard fallback to preserve linewise register metadata when no external clipboard is supplied; a regression covers linewise yank and put. The five settings and twelve keymap-store reference cases concern excluded persistence or transport, but their required target files remain absent. Further portable controller-io, host-keymap and keymap-controller cases and the complete case-level table remain outstanding. The implementation checkpoint remains incomplete; formal review and commit belong to later workflow steps.

Moving-tree verification: `npx vitest run test/vim` exit 0 (1130 passed, 32 files), `npx vitest run test/vim/purity.test.ts` exit 0 (1 passed), `npx tsc --noEmit` exit 0, `npx vitest run test/boundary.test.ts` exit 0 (4 passed), timer-global and forbidden-string searches exit 1 (no matches). Complete logs: `tmp/vim-20261111/vim-p01-engine/continuation3-{vim,purity,tsc,boundary,timer,forbidden}.log`.

## Continuation 4 — incomplete

Added `settings.test.ts` and `keymap-store.test.ts` with new per-controller option isolation tests; these are seam tests, not ports of the reference storage cases. All five settings and twelve keymap-store reference cases are excluded class 2 as detailed above. Added reference operator-hop and disabled-hop cases and a clipboard-read failure fallback regression. All 34 target suite paths now exist. Hints are retained and represented by marks.

Moving-tree verification: `npx vitest run test/vim` exit 0 (1135 passed, 34 files); purity exit 0 (1 passed); `npx tsc --noEmit` exit 0; boundary exit 0 (4 passed); raw timer and forbidden-string searches exit 1 (no matches). Logs: `tmp/vim-20261111/vim-p01-engine/continuation4-{vim,purity,tsc,boundary,timer,forbidden}.log`.

Still incomplete: portable controller-io, host-keymap and keymap-controller reference scenarios, complete per-suite case counts and case-level exclusions, and assertion parity accounting. Static declaration comparisons do not establish parameterized case counts or assertion parity. Formal review and commit are downstream.

## Continuation 5 — incomplete

Ported controller-io cases for replace Backspace, linewise clipboard yank, denied clipboard write with internal fallback, and operator-pending shortcut pass-through. The reference controller-io suite has 49 expanded cases; the target now runs 27 cases including seam tests, so counts alone do not establish parity. The reference Meta-modified deletion expectation conflicts with the accepted unconditional Meta pass-through and must be adapted accordingly. Full case-level accounting, remaining portable scenarios and the per-suite table remain outstanding.

Moving-tree verification: `npx vitest run test/vim` exit 0 (1139 passed, 34 files); purity exit 0 (1 passed); `npx tsc --noEmit` exit 0; boundary exit 0 (4 passed); raw timer and forbidden-string searches exit 1 (no matches). Logs: `tmp/vim-20261111/vim-p01-engine/continuation5-{vim,purity,tsc,boundary,timer,forbidden}.log`.
