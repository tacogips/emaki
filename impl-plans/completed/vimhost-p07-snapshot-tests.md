# vimhost-p07-snapshot-tests: full snapshot, firing rule, render switches, class-2 hints and hop UI data

- **Wave:** 3
- **dependsOn:** `vimhost-p01-engine-contract`, `vimhost-p03-public-adapter`
- **Design:** `design-vim.md` §12.4, §12.6, §12.8 (`snapshot.test.ts`)
- **writePaths:**
  - `test/vim/snapshot.test.ts`
  - `tmp/vim-host-20261111/vimhost-p07-snapshot-tests` (artifact)
  - `impl-plans/progress/vimhost-p07-snapshot-tests.md`
- **sharedPaths:** none

## Context to imitate

- `test/vim/hints.test.ts` (hint keymaps), `test/vim/hop.test.ts:33` (hop keymap) and `test/vim/editor-integration.test.ts` (the jsdom `vim()` path).
- `TestVimHost.markSets`, for inspecting mark owners.

## Test cases

**Snapshot fields:**
- `qa` → `recording === 'a'`, and after `q` → `null`
- `/foo<CR>` on a document containing `foo` → `search === '/foo'`
- `/zzz<CR>` → `messageKind === 'error'`
- `i` → `cursorShape === 'bar'`, `displayCursorEnd === displayCursor` and `label === 'INSERT'`
- `v` → `label === 'VISUAL'`
- normal mode on `abc` at 0 → `displayCursor 0`, `displayCursorEnd 1`
- `d` (operator-pending) → snapshot `cursorShape === 'underline'`, while `vim().cursorShape === 'block'`

**Hints.** Keymap `{version: 1, hints: {enabled: true, delayMs: 100}, maps: {n: [{lhs: 'gx', rhs: 'l', desc: 'custom'}]}}`, with `vi.useFakeTimers()`:
- `g`, then advance 100 ms → `snapshot.hints.prefix` is `'g'`, `entries` contains `{key: 'x', desc: 'custom'}`, and a `subscribe`/`onChange` delivery happened (a timer-driven, immediate delivery)
- `Esc` → `hints === null`

**Hop.** Keymap `{version: 1, hop: {enabled: true, keys: 'ab'}, maps: {n: [{lhs: 'Q', action: 'hop.word'}]}}`:
- `Q` → `snapshot.hop.labels` is non-empty with `text` from the `'ab'` alphabet
- typing a label → the jump happens and `hop === null`

**Delivery:**
- the `onChange` payload deep-equals `v.state`
- no call on subscribe
- exactly one delivery per `handleKey` that changes the snapshot
- zero deliveries for a key that changes nothing
- a cursor move (`l`) delivers (the `displayCursor` change)

**Render switches.** `createVimController(host, {render: {hints: false, hop: false, search: false}, keymap: …})`:
- after `/foo<CR>`, `Q` and a hint prefix, `host.markSets` has no `emaki-vim-search`, `emaki-vim-hop` or `emaki-vim-hints` key, while `snapshot.search`, `hop` and `hints` are populated
- the default render → those owners are set

## Class-2 port: tapMode is in p09; this plan covers hints and hop UI data

Enumerate the reference cases asserting hints and hop data and status-snapshot fields in `/Users/taco/gits/tacogips/vactr/editor/test/code/vim/` and `/Users/taco/gits/tacogips/vactr/editor/test/ui/vim-status.test.tsx` (read-only). Port the data assertions against `snapshot`. Exclude only framework DOM-rendering assertions, with the reason. The progress log gets a table.

## Pitfalls

- Use `vi.useRealTimers()` in `afterEach`.
- Forbidden strings are not allowed.
- No source edits; log any defects.

## Verification

- `npx vitest run test/vim/snapshot.test.ts` → exit 0
- `npx tsc --noEmit` → exit 0
- `npx vitest run test/boundary.test.ts` → exit 0

## Done criteria

- All cases pass.
- The table is logged.

## Implementation progress

- Snapshot, delivery, hints, hop and renderer-switch tests implemented; reference UI-data mapping recorded in `impl-plans/progress/vimhost-p07-snapshot-tests.md`.
- Implementation verification is recorded in the plan-local evidence directory; formal review and serial integration are downstream.
- Continuation added character-hop, operator-hop, mark-argument, disabled-hop and input-flush snapshot cases. Amendment round 1 adds the public hop and operator-pending blur cases; see the progress table.

## Amendment 2026-11-11 (blocked-wave-scope-or-contract, round 1)

**The blur seam (IR-W3-2) is provided by `vimhost-p01-engine-contract`.**
- `VimController.blur(): void` exists in `src/vim/host.ts`.
- It is delegated through the coalescing `wrapped()` in `src/vim/controller.ts`.
- The exported `createVimController` from `src/vim/index.ts` returns the facade, so `blur` is available with no `index.ts` change.
- p07 still does **not** edit any `src` file.

**Add the reference blur snapshot cases** to `test/vim/snapshot.test.ts`, using the exported `createVimController` and `TestVimHost`:
1. **Hop.** Keymap `{version: 1, hop: {enabled: true, keys: 'ab'}, maps: {n: [{lhs: 'Q', action: 'hop.word'}]}}`.
   - Press `Q`: `snapshot.hop` is non-null.
   - `blur()`: `snapshot.hop === null` and `snapshot.pending === ''`.
   - Exactly one `subscribe` delivery happens for the `blur()` call.
2. **Operator-pending.** Press `d` (operator-pending), then `blur()`: `snapshot.mode === 'normal'` and `snapshot.pending === ''`. The document is unchanged.

**Update the class-2 table** in the progress log to mark the blur case as ported.

**Verification is unchanged.**
- `npx vitest run test/vim/snapshot.test.ts` → exit 0.
- `npx tsc --noEmit` → exit 0.
- `npx vitest run test/boundary.test.ts` → exit 0.
