# P03 `vim-p03-adapter`: `vim()` public API, attach, cursor marks, prompt, clipboard isolation, keymaps, production timer

- **Wave:** 2
- **dependsOn:** `vim-p08-engine-keymap-contract`, `vim-p09-keymap-store` (p01 and p02 are landed)
- **Design:** `design-docs/specs/design-vim.md` rev 4:
  - §4, §5.1, §5.2 (including DR-05 clipboard isolation and cmdline maps)
  - §5.5 (keymap construction and `setKeymap`)
  - §5.6 (production timer wiring, DR-06)
  - §6 (integration, keymap and keymap-timing cases, public-api test)
  - §9 D1/D1a/D2/D3/D10/D13/D15
- **Contracts:** overview C1 rev 4 (consumer), C2 rev 4 (owner), C3 (`emaki-vim`), C7 (re-export)
- **writePaths:**
  - `src/vim/index.ts`
  - `src/vim/adapter.ts`
  - `src/vim/cursor.ts`
  - `src/vim/prompt.ts`
  - `test/vim/editor-integration.test.ts`
  - `test/vim/public-api.test.ts`
  - `tmp/vim-20261111/vim-p03-adapter` (artifact)
  - `impl-plans/progress/vim-p03-adapter.md`
- **sharedPaths:** none

## Intent

Turn the landed engine into the public, opt-in `emaki/vim` API. There are **zero core changes**.

```ts
const v = vim({ ex, keymap });                // keymap: JSON text | object; or preset
const editor = createEditor(host, { modalKeys: v });
const detach = v.attach(editor, host);
v.setKeymap(text);                             // runtime, no remount
```

`package.json` already exports `./vim` → `./src/vim/index.ts`, and `scripts/bundle-size.mjs` already lists it. This plan creates the missing file.

## Repository context to imitate

- **Hook contract:** `src/types.ts` `ModalKeyHook`/`ModalKeyInput`, wired in `src/editor.ts` → `InputController.setModalHook`.
- **Plugins:** `src/plugin/runtime.ts`. Check that `add` calls `plugin.attach` synchronously. If it does not, create the controller lazily on the first `attach` callback. `PluginHost` provides `marks(owner)`, `viewport`, `coordsAtPos` and `theme.palette.cursor`.
- **Engine:** `src/vim/controller.ts:createVimController(host, options)`, and C1 in `src/vim/host.ts`, including p08's `setKeymap` and `cmdline`.
- **Keymaps:** `src/vim/keymap-schema.ts:compileKeymap`, `KEYMAP_MAX_BYTES`; `src/vim/presets/index.ts:KEYMAP_PRESETS`; `src/vim/keys.ts:normalizeKey(input, true)`.
- **jsdom editor setup:** `test/editor.test.ts:setup` (fake `frameHost`, `recordingGL`, `rasterizer`). The environment is already jsdom (`vitest.config.ts`).

## Non-goals

- Do not edit `src/vim/host.ts`, `controller.ts`, `keymap-*.ts`, `mapper.ts` or `keymap-store.ts`. A defect in any of them is recorded as a blocker with a failing case.
- No core `src/**` edits outside `src/vim`.
- No new `EditorOptions` or `ModalKeyHook` members.
- No public `timer` option.
- No native cursor shape (user-qa #1), no `copy` interception, and no IME support in prompts.

## Changes

### `src/vim/adapter.ts`

Export `createVimHost(editor: EditorHandle, plugin: PluginHost): VimHost`, mapping C1 onto:
- **`editor`:** `state`, `dispatch`, `undo`, `redo`, `scrollTop`, `scrollTo`, `lineTop`, `lineAtHeight`
- **`plugin`:** `viewport`, `coordsAtPos`, `marks`

Use `import type` only.

Also export `createScheduler()`, which returns `{ timer(ms, cb): () => void; cancelAll(): void }` (DR-06, design §5.6):
- **`ms > 0`:** `setTimeout`. The returned cancel calls `clearTimeout`.
- **`ms <= 0`:** `queueMicrotask`, guarded by an `active` flag.
- Live handles are tracked in a `Set`. A callback first removes its own handle, then runs `cb` only if it is still active and `cancelAll` has not run.
- `cancelAll()` cancels every live handle and blocks future callbacks.

### `src/vim/cursor.ts`

- `cursorShapeFor(mode)`: `insert` → `bar`, `replace` → `underline`, everything else → `block`.
- `cursorMarks(host, shape, color)` returns:
  - **block on a character:** `{from: head, to: findClusterBreak end, style: {background: [r, g, b, 0.6]}}`
  - **block at end of line or on an empty line:** an empty range with `minWidth` equal to the cell width. Width is `coordsAtPos(head + 1).left - coordsAtPos(head).left` when both positions are on the same line and the result is positive; otherwise 8.
  - **underline:** `style.underline {color, thickness: 2}`
  - **bar:** `[]`
- The color is `plugin.theme.palette.cursor`.

### `src/vim/prompt.ts`

`PromptLine`:
- `open(kind, initial)`
- `key(input, cmdline: ReadonlyMap<VimKey, VimKey>) → 'consumed' | 'submit' | 'cancel'`
- `paste(text)`
- `text`, `kind`

`key` steps:
1. `k = normalizeKey(input, true)`.
2. If `cmdline.has(k)`, use the mapped key **once**, with no recursion. A mapped `<Esc>` cancels, `<CR>` submits, `<BS>` deletes, a printable key appends, and `<Home>`/`<End>`/`<Left>`/`<Right>`/`<Del>` are consumed with no effect.
3. Otherwise apply the rev 3 rules:
   - a printable key (`key.length === 1` with no ctrl, alt or meta) appends
   - `Backspace` removes one code point, surrogate-pair safe; on empty text it cancels
   - `Ctrl-U` clears
   - `Enter` submits
   - `Escape`, `Ctrl-C` and `Ctrl-[` cancel
   - anything else is consumed

`paste(text)` appends the first line: cut at `\n` and drop `\r`.

### `src/vim/index.ts`

**Exports (C2 rev 4).**
- `vim`
- types `Vim`, `VimOptions`, `VimState`, `VimPrompt`, `KeymapApplyResult`, plus `ModalKeyHook`, `ModalKeyInput`, `VimMode`, `VimPromptKind` and `VimExCommand`
- re-exports `compileKeymap`, `KEYMAP_MAX_BYTES`, type `CompiledKeymap`, type `KeymapIssue`, `KEYMAP_PRESETS`, types `KeymapPreset` and `KeymapPresetId`, `LocalKeymapStore`, and types `KeymapStore` and `KeymapStoreSaveResult`

Nothing else is exported.

**`VimOptions`:** `{ ex?; clipboard?; keymap?: string | object; preset?: KeymapPresetId }`.

**Construction (`vim(options)`).**
- Compile `source = options.keymap ?? presetText(options.preset)`. An object is turned into text with `JSON.stringify`.
- An unknown preset produces the issue `{path: 'preset', severity: 'error', message: 'unknown preset: <id>'}`.
- Store `keymapIssues`, and `pendingKeymap = compiled.keymap` (`null` when there are errors or no source).
- No controller exists yet. `attach` creates it.

**Before `attach`:**
- `handleKey` → `false`
- `allowsTextInput` → `true`
- `overwriteRange` → `null`
- the other hook methods are no-ops
- `setKeymap` updates `pendingKeymap` and `keymapIssues` only

**`attach(editor, host)`:**
1. Throw if already attached.
2. `editor.addPlugin({ name: 'emaki-vim', attach(ph) {…} })`.
3. Create a new scheduler, then call `createVimController(createVimHost(editor, ph), { ex, clipboard, timer: scheduler.timer })`. Do **not** pass `keymap` or `preset`.
4. `if (pendingKeymap) controller.setKeymap(pendingKeymap)`.
5. Subscribe to the controller. Subscribe to `editor.onUpdate(u => { controller.noteUpdate(u); refreshCursor(); })`.
6. Add capture-phase `paste` and `cut` listeners on `host`.

It returns an idempotent `detach` that runs, in order:
1. `scheduler.cancelAll()`
2. set the detached flag
3. remove the listeners and unsubscribe
4. `controller.dispose()`
5. remove the plugin, which clears the marks

**`setKeymap(input)` after attach.** Validate the input type:
- not a string, object or `null` → issue `{path: '$', severity: 'error', message: 'keymap must be JSON text or an object'}` and `applied: false`
- `null` → `controller.setKeymap(null)` and `{applied: true, issues: []}`
- otherwise compile. On `keymap === null`, the previous keymap stays and the result is `{applied: false, issues}`. Otherwise call `controller.setKeymap(compiled)` and return `{applied: true, issues}` (warnings only).

`keymapIssues` is set to the returned issues. Then run a notify-if-changed, because `pending` may have changed. `setKeymap` never throws.

**`handleKey(input)`:**
1. `metaKey` → `false`.
2. If the prompt is open, use `PromptLine.key(input, controller.cmdline)`: `submit` → `controller.submitPrompt(text)`, `cancel` → `controller.cancelPrompt()`. Return `true`.
3. Otherwise `controller.handleKey`. If `controller.prompt` became non-null, call `PromptLine.open(kind, initial)`.

**`allowsTextInput`:** `false` while the prompt is open; otherwise the controller's value.

**`state`:** `{mode, pending, message}` from the controller, plus `prompt` from the `PromptLine`.

**`onChange`:** fires once per change of `mode`, `pending`, `prompt.kind`, `prompt.text` or `message`, compared against the previous snapshot. It never fires after detach.

**`cursorShape`:** `cursorShapeFor(mode)`. The marks (`ph.marks('emaki-vim')`) are refreshed on mode and selection changes.

**Clipboard listeners.** They act only while the prompt is open; otherwise they return without touching the event.
- `paste` → `preventDefault`, `stopPropagation`, then `PromptLine.paste(clipboardData?.getData('text/plain') ?? '')` and notify.
- `cut` → `preventDefault` and `stopPropagation`.

## Pitfalls

- **DR-06.** Without the scheduler, positive `timeoutlen` delays never fire, because the fallback in `controller.ts:899-903` only runs `ms === 0`. Always pass `timer`. Never "fix" this in `controller.ts`, and never add a public `timer` option.
- **Stale callbacks.** `cancelAll` must run *before* `controller.dispose()`, and callbacks must check the detached flag. A fired timer must never touch a destroyed editor.
- **Clipboard capture.** The listeners are capture-phase on `host`; the core listeners are on the bridge textarea (`src/input/input.ts:82-84`). Never use `stopImmediatePropagation` on the textarea.
- **Prompt keys.** They never reach `controller.handleKey`.
- **`Meta+…`.** Always `false`, even while the prompt is open, so app shortcuts work.
- **Keymap compile ownership.** Do not pass `keymap` or `preset` to `createVimController`. That would compile twice and drop the issues.
- **Imports.** Only `import type` from `../types`, `../editor` and `../plugin/*`. Value imports are allowed only from `src/vim/**` and `@codemirror/*`.
- **Forbidden strings.** No `vactr`, `solid-js` or `/editor/`.

## Tests

### `test/vim/editor-integration.test.ts` (jsdom)

Use real `KeyboardEvent('keydown')` and `InputEvent('beforeinput', {inputType: 'insertText', data, cancelable: true})` on `host.querySelector('textarea')`. For mapped keys, dispatch keydown only.

**Rev 3 rows (keep all):**

| situation | expected |
|---|---|
| `i`, beforeinput `x`, `Esc`, `dd`, `u` | the text at each step; mode `normal` → `insert` → `normal`; `cursorShape` `block` → `bar` → `block` |
| `:s/a/b/` + Enter | the document changes; `prompt === null` |
| `:foo` + Enter | `message` starts with `E492`; the document is unchanged |
| `:w` + Enter with an `ex` spy | spy gets `{name: 'w', bang: false}` |
| `/pat` + Enter | the cursor moves to the next match |
| `?pat` + Enter | the cursor moves to the previous match |
| `n` | repeats the search |
| `/pat` + Esc | cursor, selection and document unchanged; `prompt === null` |
| `:` + Backspace | cancelled |
| beforeinput while the prompt is open | the document is unchanged |
| DR-05: `abc`, `/`, then `paste` (`Event` + `clipboardData` stub returning `'ZZ\nyy'`) | document `abc`; `prompt.text === 'ZZ'`; `defaultPrevented`. Then Enter → `E486…`, and the document is still `abc` |
| DR-05: `vl`, `:` (prompt `'<,'>`), then `cut` | document, selection and prompt text unchanged. Then Esc → `prompt === null` |
| insert-mode paste `QQ` | the core path inserts it |
| insert-mode `cut` with a selection | the selection is removed and `setData` is called |
| `detach()`, then `paste` | the core path applies |
| `Meta+s` | `handleKey` returns `false` |
| typing before `attach` | text is inserted |
| `attach` twice | throws |
| normal mode | an `emaki-vim` mark covers the head (a spy plugin host or the decoration store) |

**Keymap rows (design §6):**

| situation | expected |
|---|---|
| `vim({keymap: {version: 1, maps: {i: [{lhs: 'jj', rhs: '<Esc>'}]}}})` on `abc`: `i`, `j`, `j` | mode `normal`; document `abc`; `keymapIssues` `[]` |
| leader `<Space>`, `<leader>d` → `dd` on `a\nb`: Space, `d` | document `b` |
| no keymap: `i`, `jj` inserts `jj`; then `Esc` and `setKeymap(<jj text>)` → `applied: true`; then `i`, `jj` | mode `normal`, and the editor handle is the same object |
| `setKeymap(null)`, then `i`, `jj` | inserts again |
| `vim({keymap: '{"version":2}'})` | issue `path: 'version'`, error; base vim still works (`i`, type, `Esc`, `dd`) |
| jj active, `setKeymap('not json')` | `{applied: false}` with an `invalid JSON` issue; `jj` still escapes |
| `setKeymap(42 as never)` | `applied: false`, path `$` |
| `vim({preset: 'nope' as never})` | `path: 'preset'` error; `vim({preset: 'default'})` has no error issues |
| empty document, jj active, insert: `j`, then `setKeymap(null)` | document `j`; `pending ''`; mode `insert` |
| cmdline map `<C-g>`→`<Esc>`: `:abc`, `Ctrl-G` | `prompt === null`; document unchanged |
| `:q!` + Enter | `ex` gets `{name: 'q', bang: true}` |

**Keymap timing rows (DR-06).** Use `vi.useFakeTimers()`, **no scheduler injection**, `timeoutlen: 50`, and an insert map `jj`→`<Esc>`, on an empty document. Call `vi.useRealTimers()` in `afterEach`.

| situation | expected |
|---|---|
| `i`, `j`, `advanceTimersByTime(49)` | document `''`; `pending 'j'` |
| then `advanceTimersByTime(1)` | document `'j'`; `pending ''`; mode `insert` |
| `i`, `j`, `advance(20)`, `j`, then `advance(1000)` | mode `normal`; document `''` after the advance; `vi.getTimerCount() === 0` |
| `i`, `j`, `advance(60)`, `j`, `advance(60)` | mode `insert`; document `'jj'` |
| `i`, `j`, `setKeymap(null)`, `advance(1000)` | document `'j'` (no duplicate); timer count `0` |
| `i`, `j`, `detach()`, `advance(1000)` | no throw; document unchanged since the detach; no `onChange` after detach; timer count `0` |

`createScheduler` unit cases can live in the same file:
- `ms = 0` runs on a microtask
- a cancelled handle never runs
- `cancelAll` blocks pending and future callbacks

### `test/vim/public-api.test.ts`

Import `* as api` from `../../src/vim/index`.
- `vim`, `compileKeymap`, `KEYMAP_MAX_BYTES`, `KEYMAP_PRESETS` and `LocalKeymapStore` are defined.
- The `KEYMAP_PRESETS` ids are `['default', 'mise-darwin']`.
- `Object.keys(api).sort()` equals exactly the value exports listed above.

## Verification

Run from the repository root. Write each log to `tmp/vim-20261111/vim-p03-adapter/`.

| command | log | must show |
|---|---|---|
| `npx vitest run test/vim/editor-integration.test.ts test/vim/public-api.test.ts test/vim/keymap-controller.test.ts test/vim/mapper.test.ts` | `focused.log` | exit 0, including every DR-06 timing row |
| `npx vitest run test/vim test/boundary.test.ts` | `vitest.log` | exit 0 |
| `npx tsc --noEmit` | `tsc.log` | exit 0 |
| `node scripts/bundle-size.mjs --out tmp/vim-20261111/vim-p03-adapter/all.json` | `bundle.log` | exit 0; `entries` has `./vim` |
| `git diff --name-only f204032 -- src ':!src/vim'` | `core-diff.log` | empty |
| `rg -n 'vactr\|solid-js\|/editor/' src/vim/index.ts src/vim/adapter.ts src/vim/cursor.ts src/vim/prompt.ts test/vim/editor-integration.test.ts test/vim/public-api.test.ts` | `forbidden.log` | no matches |

## Done criteria

- C2 rev 4 is exported, and nothing more.
- Every test row passes.
- All six verification rows meet their expectation.
- The progress log records the commands, exit codes, log paths and per-edit hashes.

## Amendment 2026-11-11 (integration-paths-outside-writePaths, round 1)

UF-1 changes `test/vim/purity.test.ts`. It is owned by `vim-p09-keymap-store` (wave 1), not by this plan. After that amendment:
- **Exempt from the DOM-global and timer-global checks:** exactly `src/vim/index.ts`, `src/vim/adapter.ts` and `src/vim/keymap-store.ts`.
- **Not exempt:** `src/vim/cursor.ts` and `src/vim/prompt.ts`. They must stay free of `document`, `window`, `navigator`, `localStorage`, `HTMLElement` and timer globals, so put all `setTimeout`/`queueMicrotask` and DOM listener code in `adapter.ts` or `index.ts`.
- Do not edit `test/vim/purity.test.ts`. Do not obfuscate global names.
- Add `npx vitest run test/vim/purity.test.ts` to this plan's focused verification. It must exit 0.

## Implementation phase (2026-11-11)

C2 adapter, prompt, cursor, scheduler and integration tests are implemented. Assigned verification passed on the shared tree; see `impl-plans/progress/vim-p03-adapter.md` for counts, logs and hashes. Formal integrity and adversarial review, serial reconciliation, and workflow finalization remain downstream.
