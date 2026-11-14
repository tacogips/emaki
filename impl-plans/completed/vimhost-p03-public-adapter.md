# vimhost-p03-public-adapter: `vim()` options, `tapMode`, full-snapshot state, exported `createVimController` wrapper

- **Wave:** 2
- **dependsOn:** `vimhost-p01-engine-contract`
- **Design:** `design-vim.md` §12.3 (platform default), §12.4, §12.5 (wrapper, `Vim.tapMode`, the `vim()` bridge userEvent), §12.6, §12.7; D18, D19, D21, D23 and D24
- **writePaths:**
  - `src/vim/index.ts`
  - `test/vim/public-api.test.ts`
  - `tmp/vim-host-20261111/vimhost-p03-public-adapter` (artifact)
  - `impl-plans/progress/vimhost-p03-public-adapter.md`
- **sharedPaths:** none

## Intent

Make the new engine surface reachable from `emaki/vim`. Plain `vim()` must behave exactly as before; the only change is that `onChange` fires on more snapshot changes.

## Changes (`src/vim/index.ts`; contract C-R5-3)

**`VimOptions`** gains:
- `actions?: Readonly<Record<string, VimActionHandler>>`
- `hooks?: VimHooks`
- `render?: VimRenderOptions`

**`attach`** passes these to the engine `createVimController(...)` together with the existing `ex`, `clipboard` and `timer: scheduler.timer`. `hooks.platform` is defaulted with `detectPlatform()`.

**`detectPlatform(): VimPlatform`** is a private function in `index.ts`:
- `try`: read `globalThis.navigator`, and test `${platform ?? ''} ${userAgent ?? ''}` against `/Mac|iPhone|iPad|iPod/` → `'apple'`, else `'other'`.
- `catch` → `'other'`.

`navigator` may appear only in this file.

**`Vim.state`** is typed `VimSnapshot`:
- **When attached:** `{...controller.snapshot, prompt: promptOpen ? {kind: prompt.kind, text: prompt.text} : null}`.
- **Before attach, or after detach:** a constant default snapshot: `mode` `'normal'`, `label` `'NORMAL'`, `pending` `''`, `recording`, `search`, `message` and `messageKind` all `null`, `prompt` `null`, `cursorShape` `'block'`, `displayCursor` 0, `displayCursorEnd` 0, `hints` `null`, `hop` `null`.
- `onChange(cb: (state: VimSnapshot) => void)`.
- Keep `export interface VimState` unchanged. Add a type-level check that `VimSnapshot` is assignable to `VimState`, for example a `const _check: (s: VimSnapshot) => VimState = s => s;` unused-safe idiom, or a test-level assignment.

**`notify`'s serialized comparison** now compares the full snapshot. The existing `previous` JSON logic is reused.

**`Vim.cursorShape`** is unchanged: it still comes from `cursorShapeFor(mode)` and still drives the cursor marks.

**`Vim.tapMode()`:**
- Before attach, or while `promptOpen` → no-op.
- Otherwise `controller.tapMode(); notify();`.

**The `editor.onUpdate` bridge (line 122)** stays `activeController.noteUpdate(update)`. The core `EditorUpdate` already carries `userEvent`, and after p01 it is forwarded verbatim. **Verify** that the existing `test/vim/editor-integration.test.ts` passes unedited. If a case regresses, map that specific core event inside `index.ts` before calling `noteUpdate`, and record it in the progress log. Never strip `userEvent`.

**Exported wrapper:**

```ts
export function createVimController(host: VimHost, options?: VimEngineOptions): VimController
```

- Import the engine function under an alias.
- When `options.timer` is absent, inject `createScheduler()` from `./adapter` and wrap `dispose` so it calls `scheduler.cancelAll()` and then the original `dispose`.
- When `options.hooks?.platform` is absent, fill it with `detectPlatform()`.
- Return the facade with every other member intact. Spread getters carefully: build a delegating object or override only `dispose`, so that the `snapshot`, `mode` and `cmdline` getters stay live.

**Type exports:** `VimHost`, `VimController`, `VimEngineOptions`, `VimSnapshot`, `VimHooks`, `VimActionHandler`, `VimActionContext`, `VimRenderOptions` and `VimPlatform` from `./host`; `HintView`, `HintEntry`, `HopView` and `HopLabel` through `./host`.

**`test/vim/public-api.test.ts`.** The value list becomes `['KEYMAP_MAX_BYTES', 'KEYMAP_PRESETS', 'LocalKeymapStore', 'compileKeymap', 'createVimController', 'vim']`. Keep the presets assertion.

## Pitfalls / do not

- **Getters lost to object spread.** Spreading the facade (`{...facade}`) freezes the getter values. Do not do it.
- The wrapper must not double-cancel or throw when `dispose` is called twice.
- Do not change the `attach`/detach lifecycle, the clipboard listeners, the prompt handling or the keymap logic.
- Do not touch `adapter.ts`; `createScheduler` already exists there.
- No edits outside `writePaths`. If `examples/tauri-editor` compiles against `VimState`, it still works, because the change is additive.

## Verification

- `npx tsc --noEmit` → exit 0
- `npx vitest run test/vim` → exit 0. `editor-integration` and `public-api` pass, and `editor-integration` is unedited.
- `npx vitest run test/boundary.test.ts test/vim/purity.test.ts` → exit 0
- `cd examples/tauri-editor && npm run check` → exit 0

## Done criteria

- All of the above pass.
- `rg -n 'navigator' src/vim` matches only `src/vim/index.ts`.
- The progress log has hashes and exit codes.

## Implementation progress

- Source and plan-local verification complete; see `impl-plans/progress/vimhost-p03-public-adapter.md`. Formal review and integration remain downstream.
