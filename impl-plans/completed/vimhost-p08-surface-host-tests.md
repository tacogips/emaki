# vimhost-p08-surface-host-tests: custom-host low-level path and noteUpdate userEvent classification

- **Wave:** 3
- **dependsOn:** `vimhost-p01-engine-contract`, `vimhost-p03-public-adapter`
- **Design:** `design-vim.md` §12.5 (wrapper, host duties, `noteUpdate`), §12.8 (`surface-host.test.ts`, `note-update.test.ts`); D19 and D24
- **writePaths:**
  - `test/vim/surface-host.test.ts`
  - `test/vim/note-update.test.ts`
  - `tmp/vim-host-20261111/vimhost-p08-surface-host-tests` (artifact)
  - `impl-plans/progress/vimhost-p08-surface-host-tests.md`
- **sharedPaths:** none

## Intent

Prove that an app with its own surface can drive the engine through the exported `createVimController`. This is the equivalent of a host-built surface adapter.

## The custom host (inline in each file; do not edit `test/support/vim-host.ts`)

- It owns a CodeMirror `EditorState` with `history()`.
- It implements every `VimHost` member, imitating `test/support/vim-host.ts:TestVimHost`.
- `marks` is a no-op recorder.
- A host-level `apply(tr)` updates the state, and **for external transactions** calls `controller.noteUpdate({state, changes, docChanged, selectionSet, userEvent: tr.annotation(Transaction.userEvent) ?? null})`.
- **Host dispatches made by the engine** go through `VimHost.dispatch` and must **not** call `noteUpdate`. That matches the shim contract; the facade ignores updates while it is dispatching.

## `surface-host.test.ts` cases

Each case drives `createVimController(host, {hooks: {…all members…}, actions: {…}, render: {search: false, hints: false, hop: false}, keymap: …})`, imported from `../../src/vim/index`.
- `i`, then an external typed transaction (`userEvent 'input.type'`), then `Esc` → the document is updated and `snapshot.mode === 'normal'`
- the host prompt flow: `:` → `snapshot.prompt` is `{kind: ':', text: ''}`; the host calls `submitPrompt('s/a/b/')` → the document changes and `prompt === null`. `cancelPrompt` after `/` → `prompt === null`.
- an external non-vim edit in normal mode reported via `noteUpdate` → `snapshot.displayCursor` is updated and the marks are mapped
- `subscribe` payloads equal `controller.snapshot`
- **Timer:** `vi.useFakeTimers()`, keymap `{version: 1, timeoutlen: 50, maps: {i: [{lhs: 'jj', rhs: '<Esc>'}]}}`, **no `timer` option**. `i`, `j` (the host forwards the typed `j`, if any), then advance 50 → `pending === ''`. Then `dispose()` → `vi.getTimerCount() === 0`. A second `dispose()` does not throw.

## `note-update.test.ts` cases (design §12.8 DR-HOST-02)

On a custom host containing `abc`:
- **`input.type`:** `i`, an external insert of `Z` with `userEvent 'input.type'`, `Esc`, then `.` → `Z` is inserted again
- **`input.format`:** `i`, an external insert of `Z` with `'input.format'`, `Esc`, then `.` → `Z` is **not** replayed (the document is unchanged by `.`, apart from any prior record)
- **`undo`/`redo`:** an external undo transaction reported with `userEvent 'undo'`, then `u` → no double undo. Compare the result against an engine-internal `u` sequence on a fresh host (differential).
- **explicit `null`:** an insert-mode external insert with `userEvent: null` → not recorded (`.` does not replay it)
- **property omitted:** an insert-mode external insert reported without the `userEvent` key → recorded as typed (the legacy heuristic; `.` replays it)
- **`typeText` hook:** a `typeText` hook dispatching through the host with `'input.type'`, forwarding the update, with an `i` map whose rhs contains a printable key → the text is recorded and `.` repeats it

## Pitfalls

- `Transaction.userEvent` comes from `@codemirror/state`.
- Distinguish "omitted" (no key) from `null` explicitly when building the update objects.
- Forbidden strings are not allowed.
- No source edits; log any defects as blockers with the failing case.

## Verification

- `npx vitest run test/vim/surface-host.test.ts test/vim/note-update.test.ts` → exit 0
- `npx tsc --noEmit` → exit 0
- `npx vitest run test/boundary.test.ts` → exit 0

## Done criteria

- All cases pass.
- The progress log has hashes and exit codes.

## Implementation progress

- Assigned custom-host and update-classification tests implemented; required checks passed on the shared working tree. See `impl-plans/progress/vimhost-p08-surface-host-tests.md`.
- Formal review and final integration remain downstream.
