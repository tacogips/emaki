# vimhost-p02-action-schema: host action ids in the keymap schema

- **Wave:** 1
- **dependsOn:** none
- **Design:** `design-vim.md` §12.2 "Keymap schema", D16, user-qa #6 (default)
- **writePaths:**
  - `src/vim/actions.ts`
  - `src/vim/keymap-schema.ts`
  - `test/vim/actions.test.ts`
  - `tmp/vim-host-20261111/vimhost-p02-action-schema` (artifact)
  - `impl-plans/progress/vimhost-p02-action-schema.md`
- **sharedPaths:** none

## Intent

Keymaps must be able to bind any namespaced host action id, for example `{lhs: '<leader>e', action: 'app.explore'}`, without knowing the registry. Existing built-in ids and their mode rules stay exactly the same.

## Changes

### `src/vim/actions.ts` (contract C-R5-2)

- Rename the current union to `BuiltinActionId`, and add `export type ActionId = string`.
- `ACTION_MODES` is keyed by `BuiltinActionId`.
- `isActionId(value: string): value is BuiltinActionId` keeps the same body.
- `isHopAction(id: string)`.
- **New:** `isHostActionId(value: string): boolean`. It is true only when all of these hold:
  - `value.length <= 128`
  - `value` matches `/^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$/`
  - `value` does not start with `hop.`
  - `!isActionId(value)`

### `src/vim/keymap-schema.ts` (around lines 169–174)

The action branch is decided in this order:
1. **`c` mode:** rejected, as today (line 159). Unchanged.
2. **Built-in id** (`isActionId`): the existing mode check and message, and the existing hop-disabled drop.
3. **Starts with `hop.`:** `unknown action id <id>`.
4. **`isHostActionId`:**
   - Allowed modes are `n`, `x` and `i`.
   - In `o`, fail with the existing message format, `action <id> is not allowed in mode o`.
   - Otherwise emit `{kind: 'action', id}`.
5. **Anything else:** `unknown action id <id>`. The message text must keep containing `unknown action id`.

`MapTarget`'s action `id` is now `ActionId` (string). `mapper.ts`, `keymap-runtime.ts` and `hints.ts` import the type only and need no edit. Do not touch them.

## Pitfalls

- `test/vim/keymap-schema.test.ts:69-73` must still pass unedited. `'missing'` has no dot, so it stays an error, and the issue count stays 2.
- `test/vim/actions.test.ts:18` (`isActionId('nope')` is false) must stay as it is.
- Do not edit `controller.ts`; p01 owns it.
- The hop-disabled drop applies only to `hop.*` built-ins.

## Tests (add cases to `test/vim/actions.test.ts`; existing cases unchanged)

- `isHostActionId('app.explore')` → true
- `'a.b-c_d.e'` → true
- `'nodot'` → false
- `'hop.x'` → false
- `'emaki.hush'` → false (built-in)
- `'1app.x'` → false
- a 129-character dotted id → false
- `'app.'` → false

## Verification

- `npx tsc --noEmit` → exit 0
- `npx vitest run test/vim/actions.test.ts test/vim/keymap-schema.test.ts test/vim/hints.test.ts test/vim/keymap-controller.test.ts test/vim/hop.test.ts` → exit 0

## Done criteria

- The commands above pass.
- The progress log records hashes and exit codes.

Implementation-phase criteria met; source hashes and verification evidence are in `impl-plans/progress/vimhost-p02-action-schema.md`. Independent review and serial integration remain pending.
