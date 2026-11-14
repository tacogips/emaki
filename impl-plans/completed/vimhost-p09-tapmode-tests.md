# vimhost-p09-tapmode-tests: public tapMode regressions and the class-2 tapMode port

- **Wave:** 3
- **dependsOn:** `vimhost-p01-engine-contract`, `vimhost-p03-public-adapter`
- **Design:** `design-vim.md` §12.5 (`tapMode`), §12.8 (`tap-mode.test.ts`); D23
- **writePaths:**
  - `test/vim/tap-mode.test.ts`
  - `tmp/vim-host-20261111/vimhost-p09-tapmode-tests` (artifact)
  - `impl-plans/progress/vimhost-p09-tapmode-tests.md`
- **sharedPaths:** none

## Context

- `ReferenceController.tapMode` lives at `src/vim/controller.ts:190`.
- The existing engine case `test/vim/undo-repeat.test.ts:157` uses a key-sequence substitute. Leave it unchanged.
- Type text the way existing suites do: dispatch with `userEvent 'input.type'` and report it, for example the `type()` helper in `test/vim/undo-repeat.test.ts`. With the exported `createVimController` plus `TestVimHost`, report external typed edits through `noteUpdate` with `userEvent: 'input.type'`.

## Test cases

Run each case through both the exported `createVimController` and `vim().tapMode()` on a jsdom `createEditor` where noted.
- **Toggle:** `tapMode()` in normal → `mode === 'insert'`. `tapMode()` again → `'normal'`. Exactly one `subscribe` delivery per call.
- **Flush first:** with keymap `{version: 1, maps: {i: [{lhs: 'jj', rhs: '<Esc>'}]}}`, `i`, `j` (pending), `tapMode()` → the document gains `j`, `pending === ''` and `mode === 'normal'`.
- **Dot-repeat** (reference undo-repeat): on `|abc`, `tapMode`, type `x`, `tapMode`, `.` → `xxabc`, mode `normal`.
- **Grouping:** after that insert, a single `u` removes the whole `x` insert group.
- **Macro** (reference macro-marks): `qa`, `tapMode`, type `y`, `tapMode`, `q`, `@a` → `y` is inserted twice in total, and the mode ends `normal`.
- **`vim()`:**
  - `v.tapMode()` before `attach` → no throw and no change
  - while a `:` prompt is open → a no-op (the prompt is kept)
  - after `attach` → it toggles `state.mode`

## Class-2 port

Enumerate the tapMode cases, for example `rg -n 'tapMode' /Users/taco/gits/tacogips/vactr/editor/test` (read-only; the controller-io, undo-repeat and macro-marks suites at minimum). Port each case against the public `tapMode()`, keeping its name in neutral wording. The progress log gets a table of reference file:line → target case → ported or excluded, and the reason. Do not substitute key sequences for `tapMode`.

## Pitfalls

- Forbidden strings are not allowed.
- No source edits; log any defects as blockers.
- Do not edit `undo-repeat.test.ts`.

## Verification

- `npx vitest run test/vim/tap-mode.test.ts test/vim/undo-repeat.test.ts` → exit 0
- `npx tsc --noEmit` → exit 0
- `npx vitest run test/boundary.test.ts` → exit 0

## Done criteria

- All cases pass.
- The table is logged.

## Implementation progress

- Implemented the public tapMode regression cases on both surfaces; the class-2 mapping and verification are recorded in `impl-plans/progress/vimhost-p09-tapmode-tests.md`.
- Implementation checks pass on the shared working tree; formal review and serial integration remain downstream.
