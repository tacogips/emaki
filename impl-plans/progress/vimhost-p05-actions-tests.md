# Host actions test progress

The assigned dependencies are admitted by runtime `acceptedPlanIds`; the design §12.2 matches this plan. Added `test/vim/host-actions.test.ts` covering attached leader context, diagnostic move/clamp/visual/null, both directions, unregistered actions, custom void/null, all ex aliases, schema validation, and exception propagation.

| Reference case | Target case / disposition |
| --- | --- |
| `code/vim/controller-io.test.ts:184` | `dispatches :%s to %s`: all four actions and unchanged document; ported. |
| `code/vim/search-ex.test.ts:103` | `dispatches :%s to %s`: eval, evalall, run, hush, format; ported. |
| `code/vim/controller.test.ts:148` | `dispatches :hush to emaki.hush`; ported. |
| `code/vim/keymap-controller.test.ts:246` | `moves to next and previous diagnostic positions`, `reports no diagnostics for null`; ported. |
| `code/vim/host-keymap.test.ts:69` | Reference test-host wrapping implementation; host-supplied diagnostic positioning exercised by `moves to next and previous diagnostic positions`; wrapping belongs to the host registry handler. |
| `code/vim/host-keymap.test.ts:77` | Null diagnostics covered by `reports no diagnostics for null`; visibility belongs to hooks plan p06. |
| `code/vim/actions.test.ts:4` | Existing `test/vim/actions.test.ts` action mode and hop classification assertions; preserved. |
| `code/vim/keymap-schema.test.ts:37,42,70,73` | Existing `test/vim/keymap-schema.test.ts` and `test/vim/actions.test.ts` retain validation assertions; new `accepts host ids`, `rejects host ids`, and `rejects unknown id` cover registry rules. |
| `code/vim/presets.test.ts:51` | Existing `test/vim/presets.test.ts` preserves preset mapping assertions. |
| `canvas/vim-input.test.ts:125,138` | Platform/default-keymap passthrough is assigned to p06; not an action registry dispatch test. |
| `canvas/vim-mount.test.ts:99-157` | Surface/default-keymap integration is assigned to p06/p08. |
| `code/vim/undo-repeat.test.ts:64` | External format-style edit history is outside action dispatch; existing `test/vim/undo-repeat.test.ts` covers repeat/history behavior. |

IR-W3-1 amendment resolves the earlier contract mismatch: the keymap test asserts the exception is swallowed, pending clears and the next key moves; the ex-alias test asserts propagation from `submitPrompt` and a readable snapshot. `src/vim/mapper.ts` is unchanged; reference comparison `tmp/vim-host-20261111/reconcile-wave-003/mapper-vs-reference.diff` is empty. The visual selection's engine head is inclusive, hence the assertion is head 5.

Amendment verification on the moving shared working tree: focused suite 26 passed; `npx tsc --noEmit` exit 0; boundary suite 4 passed. Complete logs are `tmp/vim-host-20261111/vimhost-p05-actions-tests/amendment-r1-{actions,tsc,boundary}.log`. Formal review and combined-tree verification follow downstream.
