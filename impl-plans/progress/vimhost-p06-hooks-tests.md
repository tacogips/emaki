# vimhost-p06-hooks-tests progress

Implementation complete, pending formal review. `test/vim/host-hooks.test.ts` exercises provided and default behavior for every hook. Reference `keys.ts:27-28` ignores platform; the hook is inert in the pass-through algorithm and `src/vim/keys.ts` is unchanged. Tests spy on the actual call for provided `apple` and absent-navigator `other`.

| Reference case | Target / disposition |
| --- | --- |
| `test/code/vim/controller-io.test.ts:33-46` | Ported shortcut matrix, both platforms and six modes. |
| `test/code/vim/controller-io.test.ts:48-56` and `test/code/vim/keys.test.ts:47` | Ported matched-default pass-through and pending operator preservation. |
| `test/code/vim/controller-io.test.ts:58-96` | Ported modifier pass-through; external input/surface routing excluded because it belongs to the downstream host. |
| `test/code/vim/controller-io.test.ts:125-135` | Ported popup consumption and default escape. |
| `test/code/vim/controller-io.test.ts:266-269` | Ported composition-discard announcement. Mode, error and hop announcements also covered. |
| `test/canvas/input-vim-hook.test.ts:46-84` | Ported relevant modifier pass-through on both platforms; no-hook input routing belongs to the downstream host. |
| `test/canvas/vim-input.test.ts:114-150` | Ported popup and registered shortcut pass-through; actual host keymap dispatch excluded as downstream host behavior. |
| `test/canvas/vim-mount.test.ts:99-160` | Ported primary and alternate modifier pass-through; external action execution and Vim-off behavior belong to the downstream host. |
| `test/code/vim/keys.test.ts:28-47` | Existing keys suites plus new platform and default-keymap tests cover pure shortcut rules. |

Verification on shared working tree: `npx vitest run test/vim/host-hooks.test.ts test/vim/keys.test.ts test/vim/keys-extended.test.ts` 111 passed; `npx tsc --noEmit` exit 0; `npx vitest run test/boundary.test.ts test/vim/purity.test.ts` 5 passed. Complete logs in `tmp/vim-host-20261111/vimhost-p06-hooks-tests/`. Initial fixture failures are retained in `test-attempt.log`; corrected fixtures pass in `test-final-2.log`. Serial integration and independent review are downstream.

## Test-integrity revision P06-TI-1

The history test enters insert mode and dispatches `x` and `y` as two isolated history events, then escapes. It asserts undo depth 0→2 and document `xyabc`. After the same selection update, one `u` gives `xabc` for both the rising-edge hook and a fresh controller, but `abc` for the hook-false control. The default-hook case also restores `abc` in one `u`. The passing differential assertions and named outcomes appear in `tmp/vim-host-20261111/vimhost-p06-hooks-tests/review-differential.log`; this is the requested a≠c alternative to a prohibited source mutation. The default scrollLines case now uses the extended preset and verifies an actual scroll.

Current shared-tree verification: `review-gate-tests.log` 111/111, `review-gate-tsc.log` exit 0, `review-gate-boundary.log` 5/5. `src/vim/controller.ts` SHA-256 remained `a0677a5c0d352e72494a80e43d073deb74d1ef9525ba6f390912e8a729c9712f` throughout this revision. Independent review and serial integration remain downstream.
