# vimhost-p06-hooks-tests: per-hook tests and the class-2 port (announce, popup escape, platform shortcuts, default-keymap passthrough)

- **Wave:** 3
- **dependsOn:** `vimhost-p01-engine-contract`, `vimhost-p03-public-adapter`
- **Design:** `design-vim.md` §12.3, §12.8 (`host-hooks.test.ts`), user-qa #7 (default)
- **writePaths:**
  - `test/vim/host-hooks.test.ts`
  - `src/vim/keys.ts` (conditional; see "platform")
  - `tmp/vim-host-20261111/vimhost-p06-hooks-tests` (artifact)
  - `impl-plans/progress/vimhost-p06-hooks-tests.md`
- **sharedPaths:** none

## Context to imitate

- `test/vim/controller.test.ts`, `test/support/vim-host.ts:TestVimHost` and the `key()` helpers in existing suites.
- Use the exported `createVimController` from `../../src/vim/index`.

## Test cases

There is one `describe` per hook, each with a **provided** case and a **default** case.

- **`announce`:**
  - `i` → called with `('INSERT', false)`
  - an E492 (`:foo<CR>`) → called with an error message and `true`
  - hop start → called with the hop prompt
  - default: no throw
- **`closePopupWithEscape`:**
  - provided returning `true`, then `Ctrl-[` in insert → `handleKey` returns `true` and the mode stays `insert`
  - default → `Ctrl-[` leaves insert
- **`platform`:**
  - the provided `'apple'` reaches the pass-through. See below.
  - the default is `'other'` when `navigator` is absent: use `// @vitest-environment node` in a separate `describe` file section, or stub `globalThis.navigator` to `undefined` with `vi.stubGlobal`.
- **`matchesDefaultKeymap`:**
  - returning `true` → `handleKey(x)` returns `false` and the document is unchanged
  - default → `x` deletes
- **`compositionActive`:**
  - `true` → `handleKey` returns `false`
  - default → handled
- **`isVisible`:** with hop enabled (`{hop: {enabled: true, keys: 'ab'}, maps: {n: [{lhs: 'Q', action: 'hop.word'}]}}`):
  - a hook hiding positions over 5 → no `snapshot.hop.labels` position over 5
  - default → labels across the visible doc
- **`historyReduced`:** toggle the hook from `false` to `true`, then report an update (`noteUpdate`). The next `u` behaves like a fresh controller with an empty ledger. Run a differential comparison against a fresh controller with the same document and keys. Port the reference case's exact semantics if one exists.
- **`scrollCaret`, `scrollLines`:**
  - provided → called on `n` after a search, and on `zz`/`Ctrl-E`
  - default → `TestVimHost.scrollTop` changes
- **`typeText`, `defaultKey`:** with an `i` map `{lhs: 'jk', rhs: 'x<BS>'}`, or any rhs that replays a printable key plus `<BS>`/`<CR>` in insert:
  - provided → called with `'x'` and `'<BS>'`
  - default → the document is edited

## `platform` and `src/vim/keys.ts` (conditional)

1. Enumerate the reference platform-shortcut and default-keymap pass-through cases, for example `rg -n 'platform|apple|matchesDefaultKeymap|isPassThrough' /Users/taco/gits/tacogips/vactr/editor/test /Users/taco/gits/tacogips/vactr/editor/src/code/vim/keys.ts` (read-only).
2. **If the reference `isPassThrough` uses `platform`:** port that exact branch into `src/vim/keys.ts:isPassThrough`, which stays pure (no globals). Port the cases.
3. **If it does not:** leave `keys.ts` untouched, and assert instead that the provided `platform` value reaches `isPassThrough`, via a `vi.spyOn` on the module namespace or an observable behavior. Record "inert" in the progress log for user-qa #7.

`keys.ts` changes must keep `test/vim/keys.test.ts` and `test/vim/keys-extended.test.ts` passing unedited.

## Class-2 port

Cover the announce, popup-escape, platform-shortcut and default-keymap-passthrough reference cases from `/Users/taco/gits/tacogips/vactr/editor/test/code/vim/`, `test/canvas/input-vim-hook.test.ts` and `test/canvas/vim-*.test.ts`. Re-express them through `hooks`. The progress log gets a table of reference file:line → target case → ported or excluded, and the reason.

## Pitfalls

- Forbidden strings are not allowed in test text.
- Restore stubbed globals (`vi.unstubAllGlobals`).
- Do not edit `controller.ts` or `index.ts`. Source defects are logged as blockers with the failing case.

## Verification

- `npx vitest run test/vim/host-hooks.test.ts test/vim/keys.test.ts test/vim/keys-extended.test.ts` → exit 0
- `npx tsc --noEmit` → exit 0
- `npx vitest run test/boundary.test.ts test/vim/purity.test.ts` → exit 0

## Done criteria

- Every hook has a provided case and a default case.
- The class-2 table is in the progress log.
- The `keys.ts` decision is recorded.

## Implementation progress

Hook tests and reference-case mapping are recorded in `impl-plans/progress/vimhost-p06-hooks-tests.md`. Required scoped checks passed on the shared working tree; formal review and serial integration remain downstream.
