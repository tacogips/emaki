# vimhost-p05-actions-tests: host action registry tests and the class-2 "application actions" port

- **Wave:** 3
- **dependsOn:** `vimhost-p01-engine-contract`, `vimhost-p02-action-schema`, `vimhost-p03-public-adapter`
- **Design:** `design-vim.md` §12.2 and §12.8 (`host-actions.test.ts`)
- **writePaths:**
  - `test/vim/host-actions.test.ts`
  - `tmp/vim-host-20261111/vimhost-p05-actions-tests` (artifact)
  - `impl-plans/progress/vimhost-p05-actions-tests.md`
- **sharedPaths:** none

## Context to imitate

- **jsdom editor setup:** `test/vim/editor-integration.test.ts`, which uses `createEditor(host, {modalKeys: v})`, `v.attach(editor, host)` and keydown dispatch on the bridge textarea.
- **Pure host:** `test/support/vim-host.ts:TestVimHost` with `createVimController` imported from `../../src/vim/index`. Do not edit the support file.

## Test cases (`input -> expected`)

**Leader binding.** `vim({keymap: {version: 1, leader: '<Space>', maps: {n: [{lhs: '<leader>e', action: 'app.explore'}]}}, actions: {'app.explore': spy}})`, attached. Press `Space`, `e` → `spy` is called once with `{id: 'app.explore', mode: 'normal', cursor: <head>, state: <EditorState>}`.

**`emaki.diagnostic.next`** bound to `]d`:
- the handler returns `5` on a 10-character doc → head is `5`
- the handler returns `999` → head is clamped to the normal-mode end
- in visual mode (`v` then `]d`), returning `5` → the selection extends to include `5`
- the handler returns `null` → `state.message === 'no diagnostics'` and `messageKind === 'info'`

**Unregistered ids.** An unregistered `emaki.diagnostic.next` or `app.x` binding leaves the document, selection and `message` unchanged, and `onChange` does not fire for that key.

**Handler returning void** (custom id) → the cursor does not move and there is no message.

**Ex aliases.**
- `:eval<CR>` → `actions['emaki.evaluate']` is called.
- `:run` → `emaki.evaluateAll`.
- `:hush` and `:format` likewise.
- With no registry, `:eval` does nothing and shows no E492.

**Schema (via the public `compileKeymap`):**
- `app.x` in `n`, `x` and `i` → no errors
- `app.x` in `o` → an error containing `not allowed`
- `app.x` in `c` → an error
- `hop.nope` and `nodot` → `unknown action id`

**Handler exception** → propagates out of `handleKey` (`expect(() => …).toThrow()`) on the low-level controller.

## Class-2 port: application actions

1. Enumerate the reference cases about application actions (eval, evalAll, hush, format, diagnostics, completion) in `/Users/taco/gits/tacogips/vactr/editor/test/code/vim/*.test.ts` and `/Users/taco/gits/tacogips/vactr/editor/test/canvas/vim-*.test.ts`, for example with `rg -n 'evalAtCursor|evalAll|hush|format|diagnostic|openCompletion' <dir>`. These are read-only.
2. Re-express each case through `actions` keyed by the `emaki.*` ids, keeping the case name in neutral wording.
3. In the progress log, record a table: reference file:line → target case name → ported or excluded, and the reason. An exclusion is allowed only for UI framework rendering assertions.

## Pitfalls

- No `vactr`, `solid-js` or `/editor/` text in the test file.
- Use `.log`/`.txt` evidence only.
- Do not weaken a ported assertion.
- If a case fails because of a source defect, do not edit source. Log the failing case as a blocker; leave it failing rather than skipping it, and report it.

## Verification

- `npx vitest run test/vim/host-actions.test.ts` → exit 0
- `npx tsc --noEmit` → exit 0
- `npx vitest run test/boundary.test.ts` → exit 0

## Done criteria

- Every case above is present and passing.
- The class-2 table is in the progress log.

## Implementation progress

Host-action regression coverage and reference mapping are recorded in `impl-plans/progress/vimhost-p05-actions-tests.md`. Amendment IR-W3-1 parity cases and all three assigned verification gates pass on the shared working tree. Formal review and combined-tree verification follow downstream.

## Amendment 2026-11-11 (blocked-wave-scope-or-contract, round 1)

**Decision for IR-W3-1** (integration review, reference parity).
- `src/vim/mapper.ts` is **not** edited. Its catch-all matches the reference mapper.
- design-vim.md §12.2 says exceptions propagate "as in the reference". In the reference, that holds only on non-mapper paths.

**Replace** the single case `propagates handler exceptions` (around line 57) with two cases. Use neutral names, and do not weaken any other case.

1. **`swallows a keymap-bound handler exception like the reference mapper`.** Bind `Q` → `app.x` with a handler that throws `Error('host failure')`.
   - Pressing `Q` does not throw.
   - The handler was called once.
   - The document is unchanged.
   - `snapshot.pending === ''`.
   - A following `l` on `abc` moves the head from 0 to 1, which proves the mapper reset.
2. **`propagates a handler exception from an ex alias`.** Create `createVimController(host, { actions: { 'emaki.evaluate': () => { throw new Error('host failure') } } })`.
   - After `handleKey(':')`, `expect(() => v.submitPrompt('eval')).toThrow('host failure')`.
   - A later read of `v.snapshot` does not throw.

**Progress log.** Record the disposition with reference evidence (`tmp/vim-host-20261111/reconcile-wave-003/mapper-vs-reference.diff`).

**writePaths are unchanged.** `src/vim/mapper.ts` stays forbidden.

**Verification is unchanged.**
- `npx vitest run test/vim/host-actions.test.ts` → exit 0, with all cases passing.
- `npx tsc --noEmit` → exit 0.
- `npx vitest run test/boundary.test.ts` → exit 0.
