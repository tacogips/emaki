# vimhost-p01-engine-contract: C1 additions, hook wiring, action dispatch, snapshot, coalescing, tapMode, noteUpdate userEvent, render switches

- **Wave:** 1
- **dependsOn:** none
- **Design:** `design-docs/specs/design-vim.md` §12.2 (runtime dispatch), §12.3, §12.4, §12.5 (facade operations), §12.6; D16, D17, D18, D20, D21, D23 and D24
- **writePaths:**
  - `src/vim/host.ts`
  - `src/vim/types.ts`
  - `src/vim/controller.ts`
  - `tmp/vim-host-20261111/vimhost-p01-engine-contract` (artifact)
  - `impl-plans/progress/vimhost-p01-engine-contract.md`
- **sharedPaths:** none

## Intent

The engine (`ReferenceController`) already implements every behavior. The public shim in `createVimController` (`controller.ts:865-952`) hard-codes no-ops. This plan:
- replaces the hard-coded members with `options.hooks`, `options.actions` and `options.render`
- publishes the full snapshot
- adds `tapMode`
- forwards the real `userEvent` through `noteUpdate`

## Step 0 (before any edit): baseline evidence V9

```
node scripts/bundle-size.mjs --entries core --out tmp/vim-host-20261111/vimhost-p01-engine-contract/core-before.json
```

Record the exit status. The core entries do not include `src/vim`, so concurrent p02 edits cannot affect this file.

## Changes

### `src/vim/host.ts`

Add exactly the C-R5-1 types from `impl-plans/active/vimhost-00-overview.md`. Every change is additive; existing members are unchanged.
- **Imports:** `import type` for `EditorState` and `ModalKeyInput`.
- **Hint and hop types:** re-export `HintEntry`, `HintView`, `HopLabel` and `HopView` from `./types` with `export type { … }`. Do not duplicate them.

### `src/vim/types.ts` (internal engine host)

- Replace `actions: VimActions` with `actions: Readonly<Record<string, VimActionHandler>>`, importing the type from `./host`.
- Delete the `VimActions` interface; it is used only by `types.ts` and `controller.ts`.
- Leave every other member unchanged.

### `src/vim/controller.ts`

**`ReferenceController.runMappedAction(id: ActionId)`.** Keep the parameter typed with the imported `ActionId`.
- `isHopAction(id)` → hop, unchanged.
- Otherwise call a new private `runHostAction(id)`.

**`runHostAction(id: string)`:**
1. `handler = Object.prototype.hasOwnProperty.call(this.host.actions, id) ? this.host.actions[id] : undefined`.
2. **No handler:** return with no message and no movement.
3. **Handler:** `result = handler({ id, mode: this.mode, cursor: this.cursor(), state: this.host.state() })`.
4. **`result` is a finite number:** clamp it to `[0, doc.length]`, then use the existing `moveToDiagnostic(pos)` behavior. Split that method so the "move" part does not show the message.
5. **`result === null`:** only for `emaki.diagnostic.next` or `emaki.diagnostic.prev`, call `this.message('no diagnostics', 'info')`.
6. **Anything else, including `undefined` or `NaN`:** nothing.
7. Then `refresh()`.
8. Exceptions thrown by the handler propagate. Do not add `try`/`catch`.

**`applyEx` action branch (`controller.ts:656`).** Map `evalAtCursor` → `emaki.evaluate`, `evalAll` → `emaki.evaluateAll`, `hush` → `emaki.hush` and `format` → `emaki.format`, then call `runHostAction`. Do **not** edit `src/vim/ex.ts`: `test/vim/search-ex.test.ts:107` pins its output.

**`createVimController` shim.** For each hook, `options.hooks?.X ?? <today's default>`. The defaults are the existing literals at lines 880–898:
- `announce: (m, a) => hooks.announce?.(m, a === true)`
- `platform: hooks.platform ?? 'other'`
- `matchesDefaultKeymap`: pass the engine's input object straight to the hook. It is the same `ModalKeyInput` object that `handleKey` received. Cast the type only.
- `actions: options.actions ?? {}`
- Hooks are read once, at construction.

**Renderers (§12.6).**
- `const render = { search: true, hints: true, hop: true, ...options.render }`.
- Call `host.marks(owner)` only for enabled renderers, update only those inside the engine subscription, and clear only those in `dispose`.
- With all three off, `host.marks` is never called.

**Public snapshot mapping.** `toPublic(engineSnapshot): VimSnapshot`:
- `prompt` becomes `{kind, text: initial}`.
- `hints` and `hop` become `?? null`.
- All other fields are copied as they are.

**Facade additions:**
- `get snapshot()` returns `toPublic(engine.snapshot)`.
- `tapMode: () => engine.tapMode()`. `ReferenceController.tapMode` at `controller.ts:190` is used unchanged.
- **`subscribe(cb)` with D21 coalescing:**
  - The facade keeps `depth` (a call nesting counter), `lastDelivered` (the serialized public snapshot, initialized at facade creation) and a `listeners` set.
  - **Engine listener:** if `depth > 0`, mark dirty. Otherwise run `deliver()`.
  - **`deliver()`:** serialize the current public snapshot. If it differs from `lastDelivered`, update `lastDelivered` and call each listener with the snapshot.
  - **Wrapped calls:** `handleKey`, `submitPrompt`, `cancelPrompt`, `setKeymap`, `noteUpdate`, `flushPendingInput` and `tapMode` each do `depth++`, then the call inside `try`, then `finally { depth--; if (depth === 0) deliver(); }`.
  - New subscribers are not called on subscribe.
- **`noteUpdate(value)`:** if `dispatching`, ignore, as today. Otherwise:
  - If `'userEvent' in value`, forward `value.userEvent` verbatim. This includes an explicit `null`.
  - Otherwise use today's heuristic: `docChanged && allowsTextInput() ? 'input.type' : null`.

## Pitfalls / do not

- Do not change engine algorithms, `labels`, the cursor-shape computation or `ex.ts`.
- Do not add DOM or timer globals; `controller.ts` stays pure, and `queueMicrotask` is already present.
- **Keep the existing `controller.test.ts` "notifies once for each public state change" case passing without edits.** This is why coalescing is required: one `i` key produces exactly one delivery.
- `subscribe` callbacks that take no argument must keep working. The callback type gains a parameter, which stays compatible.
- **Coalescing applies only to the facade.** Engine-internal subscribers (render marks) still run on every refresh.
- **Do not trust `userEvent`.** `undefined` versus "property absent": use the `in` check, not `??`. `{userEvent: undefined}` counts as present and forwards `null`; normalize `undefined` to `null` when forwarding.
- Do not touch `src/vim/index.ts`. p03 adapts it. The existing `index.ts` must still typecheck after this plan, so all changes stay additive.

## Tests

No new test files. They come in p05–p09, and p01 must not create them. Verification is by the existing suites.

## Verification (logs under the artifact root, `.log` only)

- `npx tsc --noEmit` → exit 0
- `npx vitest run test/vim` → exit 0, with all existing suites passing unmodified
- `npx vitest run test/boundary.test.ts test/vim/purity.test.ts` → exit 0
- `git diff --name-only 6351463 -- src ':!src/vim'` → empty
- `git diff -U0 6351463 -- src/vim/host.ts` → only added lines, apart from the `subscribe` and `noteUpdate` signature lines

## Done criteria

- `core-before.json` exists.
- All verification commands meet their expected results.
- The progress log lists pre/post hashes for each file and the exit status of each command.

## Redispatch progress

IR-W3-2 exposes the wrapped `blur()` facade operation; hashes and renewed checks are recorded in the progress log. The amended, narrowed Vim aggregate passes. The unfiltered aggregate is a serial reconciliation gate after p05; the p07 blur regression and formal reviews remain downstream.

## Amendment 2026-11-11 (blocked-wave-scope-or-contract, round 1)

**Blocker.** The `npx vitest run test/vim` aggregate fails only on `test/vim/host-actions.test.ts › propagates handler exceptions`. Integration review identified this as IR-W3-1. The listed paths are `src/vim/mapper.ts` and `test/vim/host-actions.test.ts`.

**Decision.**
- **`src/vim/mapper.ts` is not authorized for any plan.** Its catch-all in `KeyMapper.feed` (around line 78) matches the reference mapper byte for byte (`tmp/vim-host-20261111/reconcile-wave-003/mapper-vs-reference.diff` is empty). Integration review ruled that reference parity governs, so on the keymap path a host action handler's exception is swallowed and the mapper resets.
- **The failing case belongs to `vimhost-p05-actions-tests`** (`test/vim/host-actions.test.ts`). That plan rewrites it as two parity cases; see the p05 amendment.
- **p01 does not change any code for IR-W3-1.**

**p01 verification is narrowed to exclude the sibling-owned suite.** This replaces the `npx vitest run test/vim` row:
- `npx vitest run test/vim --exclude test/vim/host-actions.test.ts` → exit 0. The log must show zero failures and a positive test count.

All other verification rows are unchanged. The unfiltered aggregate stays a serial reconciliation gate, run after p05 lands.

**IR-W3-2 contract (already implemented; it stays an acceptance criterion).**
- `VimController` gains `blur(): void` in `src/vim/host.ts`. The change is additive: exactly one added line.
- The facade adds `blur: () => wrapped(() => engine.blur())` in `src/vim/controller.ts`.
- `ReferenceController.blur` semantics are unchanged.

**Resume criteria.**
- Both narrowed aggregate and `npx tsc --noEmit` exit 0 on the current tree.
- The progress log records the exit codes and the current hashes of `src/vim/host.ts` and `src/vim/controller.ts`.
