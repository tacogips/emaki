# Design: opt-in vim modal editing (`emaki/vim`), Tauri example vim toggle, dirty-on-launch fix

**Status.** Accepted for implementation.
- Revision 3 addressed Step 3 findings DR-01 through DR-05.
- **Revision 4 (2026-11-11)** adds the keymap-customization scope from the `emaki-vim-adapter-keymap-tauri` intake. The changes are:
  - public keymap exports and runtime `setKeymap` (§5.5)
  - a generic `KeymapStore` with `LocalKeymapStore` (§5.5)
  - cmdline maps inside the prompt (§5.2)
  - two engine bugs fixed during integration, plus the production timer wiring the adapter owns (§5.6, DR-06)
  - the user keymap in the Tauri example (§7.1)
  - matching tests, README and verification rows

  All revision 3 decisions stand unless a section says otherwise.
- **Revision 5 (2026-11-11, HEAD 6351463)** adds host extension points so a host with its own surface and UI can replace a private vim engine with `emaki/vim` without behavior loss. These are a host action registry, optional host hooks, the full snapshot, the exported low-level `createVimController`, and switchable default renderers. Section 12 holds the whole delta; §9 adds D16–D22, §10 adds V9–V12, and §11 adds the new risks. All revision 4 decisions stand unless §12 says otherwise.

**Scope.**

- A new `src/vim/` module, ported from the vactr vim implementation. vactr is a read-only reference: about 4.2k lines, 25 modules plus `presets/`. The module is published as the `./vim` subpath.
- Ported tests under `test/vim/`.
- The README.
- `examples/tauri-editor`: a vim toggle, a mode indicator, ex commands, and the dirty-on-launch fix.

**Core library files are not modified.** That includes `src/types.ts`, `src/editor.ts`, `src/editor-frame.ts`, `src/index.ts`, `src/input/**` and `src/render/**`. The one exception is the conditional input fix in section 7. vactr and chilla are not modified, and migrating vactr to `emaki/vim` is out of scope.

**Related.** `design-tauri-editor.md` (its section 7 dirty rule is superseded by section 7 here) and `design-docs/user-qa/vim-qa.md`.

## 1. Baseline (HEAD 283d6bc)

**Hook contract (`src/types.ts:9`).** `ModalKeyHook { handleKey(input), allowsTextInput(), overwriteRange(text), noteCompositionDiscarded(), flushPendingInput?() }`.
- It is wired at `src/editor.ts:24,71` to `InputController.setModalHook`.
- In `src/input/input.ts`, keys are resolved in this order: highest keymaps, then `hook.handleKey`, then default keymaps and the keyboard.
- While `allowsTextInput()` is false, the hook gates IME composition and `beforeinput`/`input`.
- `insertText` honours `overwriteRange`, which is what replace mode uses.

**Existing public API covers everything vim needs.** `EditorHandle` already has:
- `state`, `dispatch`, `undo` and `redo`
- `scrollTop`, `scrollTo`, `lineTop` and `lineAtHeight`
- `addPlugin`, `focus` and `onUpdate`

`addPlugin` provides a `PluginHost`, which has:
- `marks(owner)`, where `MarkStyle` supports `background`, `label`, and `minWidth` for empty ranges (`src/decor/marks.ts:33`, `src/render/decoration-pass.ts:73,124-129`)
- `viewport` (with height)
- `coordsAtPos` and `requestFrame`

**Renderer cursor shape.** `RenderFeedback.cursorShape`/`hopLabels` exist, but `editor-frame.ts:47` never sets them. Using them would need core edits, which would change the core bundle (see section 9, D8).

**Exports and bundle size.**
- `package.json` exports `.`, `./engine`, `./diff`, `./json`, `./languages` and `./languages/*`. There is no `./vim`.
- `scripts/bundle-size.mjs` measures `.`, `./engine`, `./json` and `./diff`, plus the languages entries under `--entries all`.

**Boundary test (`test/boundary.test.ts`).** It forbids the text `vactr`, `solid-js` and `/editor/` in `src/`, `test/` and `scripts/`. It also allows only `@codemirror/state` and `@codemirror/commands` as package imports in `src/`. Ported files therefore carry no provenance comments; provenance goes in the commit message only.

**Tauri example (`examples/tauri-editor/src/main.ts`).**
- Line 27: any `docChanged` sets `dirty = true`.
- Line 15: `title()` fires an unordered `void setTitle(...)`.
- Lines 31-34: `openPath` has no guard. Only `openFile` and `newFile` call `guard()`.

### 1.1 Baseline update (HEAD f204032, revision 4)

**Landed.** Plans `vim-p01` (engine), `vim-p02` (packaging), `vim-p04` (dirty fix) and `vim-p05` (Rust `confirm_open_path`) are done.
- `src/vim/` holds the engine: `host.ts` (C1 `VimHost`/`VimController`/`VimEngineOptions`), `controller.ts` (`createVimController`), `keymap-schema.ts` (`compileKeymap`, `KeymapIssue`, `CompiledKeymap`, `KEYMAP_MAX_BYTES`), `keymap-runtime.ts`, `mapper.ts` and `presets/` (`KEYMAP_PRESETS`: `default` and `mise-darwin`).
- There are 34 suites in `test/vim`.
- `package.json` already exports `"./vim": "./src/vim/index.ts"`, and `scripts/bundle-size.mjs` already lists `./vim` under `all`. `src/vim/index.ts` does **not** exist yet.
- The boundary test already has the vim-isolation assertion.
- No core file outside `src/vim` changed after 283d6bc.

**Not done.** p03 (adapter), p06 (Tauri vim) and p07 (docs and verification).

**Facts relevant to keymaps:**
- `ReferenceController.setKeymap(CompiledKeymap | null)` exists internally (`controller.ts:93`). It flushes the pending mapper sequence, closes hints and hop, then swaps the runtime. It is **not** on the public C1 `VimController` facade.
- `createVimController` compiles `options.keymap ?? preset text` and **drops the issues** (`controller.ts:907-912`).
- `CompiledKeymap.cmdline` (the `c`-mode maps, for example `<C-g>` → `<Esc>` in `mise-darwin`) is compiled but consumed nowhere in `src/vim`.

**Ex quirk.** `parseEx` classifies `w`, `q`, `wq`, `x`, `q!`, `w!` and `wq!` as `noop-write`. `applyEx` then forwards `{name: 'q!', bang: false}` to `options.ex` (`controller.ts:655`), so the bang is never split out. Other unknown commands such as `e path` and `saveas path` reach `options.ex` through the E492 branch with `name`, `bang` and `args` parsed correctly (`controller.ts:637-639`).

## 2. Goals and non-goals

**Goals.** These come from the intake acceptance signals. `vim()` from `emaki/vim` is passed to `createEditor` as `modalKeys` and then attached. It provides:

- Modes: normal, insert, replace (if present in the source), visual, visual-line, operator-pending, and the `:`, `/` and `?` prompts.
- Motions, operators, text objects, registers, counts, dot repeat, undo/redo, search, marks and ex commands.

The rest of the goals:

- Ported tests pass.
- Mode and cursor style are available through public API.
- The core bundle is unchanged.
- The Tauri toggle, mode indicator and ex mapping work, and the smoke test is extended.
- The dirty-on-launch fix ships with its root cause documented.
- **Keymap customization (revision 4):**
  - Custom keymap JSON is applied through `vim({keymap | preset})` and replaced at runtime with `setKeymap`, without re-creating the editor.
  - Invalid keymaps report issues without breaking the editor.
  - The compile API and presets are public.
  - A generic `KeymapStore` and `LocalKeymapStore` are provided.
  - The Tauri example loads, persists and clears a user keymap.
- All gates stay green.

**Non-goals.**

- A runtime `setModalKeys` (toggling vim on or off remounts instead; *keymap* replacement does not remount).
- Persisting the vim on/off setting inside `emaki/vim`. That stays app-owned, as in §7.
- Keymap persistence beyond the generic `KeymapStore` interface and its `localStorage` implementation. There is no file- or config-dir-backed store in `emaki/vim` and no keymap editor UI.
- vactr UI: the status component, transport and settings store.
- `isFileBoundary` semantics.
- IME composition inside the `:`/`/`/`?` prompt (composition is discarded there).
- Any feature the source does not have.

## 3. Module layout and packaging

```
src/vim/
  index.ts          public entry: vim(options) -> Vim; re-exports type ModalKeyHook/ModalKeyInput from '../types'
  host.ts           VimHost (engine's editor surface) built from EditorHandle + an internal plugin (§4)
  cursor.ts         block/underline cursor + hop labels as marks (§4)
  prompt.ts         engine-owned prompt line editing (§5.2)
  adapter.ts        createVimHost(editor, pluginHost) (file placement per vim-p03; host.ts stays the C1 type contract)
  keymap-store.ts   KeymapStore interface + LocalKeymapStore (§5.5, revision 4)
  <ported modules>  actions controller ex execute extended keys keymap-runtime keymap-schema mapper marks motions
                    notation operators parser record registers search session surround textobjects types undo words
                    hop, hints (hints only under the §5.4 rule), presets/*
test/vim/*.test.ts  ported suites (§6) + test/support/vim-host.ts (pure EditorState fake VimHost)
```

- **Imports.** `src/vim/**` imports only `@codemirror/state`, `@codemirror/commands`, and emaki **types** by relative path (`import type` from `../types` and `../editor`). It has no value imports from core modules, so the vim bundle does not duplicate core.
- **Isolation from core.** No file outside `src/vim/` may import `src/vim`. A new `test/boundary.test.ts` assertion enforces this: it fails if a non-`src/vim/` file under `src/` has a relative import that resolves into `src/vim`.
- **Purity gate (clarification, 2026-11-11, UF-1).** `test/vim/purity.test.ts` exempts exactly the adapter and persistence files `src/vim/index.ts`, `adapter.ts` and `keymap-store.ts` from its DOM-global and timer-global checks. Those files need host globals by design (C2 `HTMLElement`, D15 timers, C7 `localStorage`). Every other `src/vim` file, including `cursor.ts` and `prompt.ts`, keeps the full checks, and the `@codemirror/view` check applies to all files.
- **Package export.** `package.json` `exports` gains `"./vim": "./src/vim/index.ts"`. Peers are unchanged.
- **Bundle-size script.** `scripts/bundle-size.mjs` adds `'./vim': 'src/vim/index.ts'` to the `all` selection only. The `--entries core` output set is unchanged.

## 4. Attaching without core changes

**Usage.**

```ts
const v = vim({ ex });
const editor = createEditor(host, { modalKeys: v });
const detach = v.attach(editor, host);   // same host element given to createEditor; call once; detach() before editor.destroy()
```

**Attach.** `attach(editor: EditorHandle, host: HTMLElement): () => void` does three things:
1. It stores the handle.
2. It calls `editor.addPlugin(plugin)`. The plugin is internal, named `emaki-vim`. Its `PluginHost` supplies marks, viewport, `coordsAtPos` and `requestFrame`.
3. It adds capture-phase `paste` and `cut` listeners on `host` for prompt clipboard isolation (§5.2).

The returned `detach` removes the plugin and both listeners.
- Before `attach`, `handleKey` returns `false` and `allowsTextInput()` returns `true`, so the editor behaves as if no hook were set.
- A second `attach` throws.

**`VimHost` (internal) is the only surface the engine uses.** It is built in `host.ts` from `EditorHandle` and the `PluginHost`:
- `state`, `dispatch`, `undo` and `redo`
- `scrollTop`, `scrollTo`, `lineTop` and `lineAtHeight`
- `viewport` (from `PluginHost.viewport`), used for H/M/L and Ctrl-D/U/F/B
- `coordsAtPos`
- `marks(owner)`

Text insertion and default editing keys inside vim (for example `<BS>`/`<CR>` in mappings, `o`/`O`) are implemented in `src/vim` with `dispatch` and `@codemirror/commands` state commands such as `deleteCharBackward` and `insertNewlineAndIndent`, all with `userEvent: 'input.type'`/`'delete'`. Any vactr surface member with no `VimHost` equivalent is likewise implemented inside `src/vim` on top of this list, or dropped and listed in the commit message. No new core API is added.

**Cursor style (`cursor.ts`).** The block cursor is drawn as a mark:
- On a character: `{from: head, to: nextGraphemeEnd, style: {background: palette.cursor with alpha 0.6}}`.
- At end of line or on an empty line: an empty range with `minWidth` equal to one cell width, measured from `coordsAtPos`. Fallback is 8 px.
- Underline (replace mode): `style.underline`.
- Bar mode (insert): the mark is cleared.

The marks are recomputed from the plugin's `docChanged` hook and from `editor.onUpdate` when the selection is set. Hop labels use marks with `style.label`.

**Known limitation.** emaki's own bar caret is still drawn at the left edge of the block. Removing it needs the core wiring that the pending scope amendment `user-qa/vim-qa.md` #1 proposes.

**Key rules.** `handleKey` returns `false` for any input with `metaKey`, so platform and app `Cmd+` shortcuts always fall through. The core key precedence is unchanged.

## 5. `emaki/vim` public API and behavior

### 5.1 API

```ts
export type VimMode = 'normal' | 'insert' | 'replace' | 'visual' | 'visual-line' | 'visual-block' | 'operator-pending';
export interface VimPrompt { kind: ':' | '/' | '?'; text: string }
export interface VimState { mode: VimMode; pending: string; prompt: VimPrompt | null; message: string | null }
export interface VimOptions {
  ex?: (command: { name: string; args: string; bang: boolean; line: string }) => boolean; // app ex; true = handled
  clipboard?: { read(): string | Promise<string>; write(text: string): void };            // '+'/'*' registers
  keymap?: string | object; preset?: KeymapPresetId;                                      // §5.5; keymap wins over preset
}
export interface KeymapApplyResult { applied: boolean; issues: readonly KeymapIssue[] }
export interface Vim extends ModalKeyHook {
  attach(editor: EditorHandle, host: HTMLElement): () => void;
  readonly state: VimState; readonly cursorShape: 'bar' | 'block' | 'underline';
  onChange(cb: (state: VimState) => void): () => void;   // fires once per change of mode/pending/prompt/message (revision 5: payload is VimSnapshot, firing rule per §12.4)
  setKeymap(keymap: string | object | null): KeymapApplyResult;   // §5.5 (revision 4)
  readonly keymapIssues: readonly KeymapIssue[];                    // issues of the last compile (construction or setKeymap)
}
export function vim(options?: VimOptions): Vim;
// revision 4 re-exports from src/vim/index.ts:
export { compileKeymap, KEYMAP_MAX_BYTES } from './keymap-schema';
export type { CompiledKeymap, KeymapIssue } from './keymap-schema';
export { KEYMAP_PRESETS } from './presets';
export type { KeymapPreset, KeymapPresetId } from './presets';
export { LocalKeymapStore } from './keymap-store';
export type { KeymapStore, KeymapStoreSaveResult } from './keymap-store';
```

`index.ts` re-exports only the names above plus the C2 types. Engine internals such as the parser, mapper and runtime classes stay private.

Cursor shape is derived from the mode:
- `block` for normal, visual (all three) and operator-pending
- `bar` for insert
- `underline` for replace

### 5.2 Prompt ownership (`:`, `/`, `?`)

**The engine owns prompt editing; there is no UI component.** The hosting app only *displays* `state.prompt` and `state.message`. This replaces the reference status UI that called `submitPrompt`/`cancelPrompt` (controller.ts:163-187, wired from the reference mount at vim-mount.ts:201-203). Those controller methods are ported unchanged, and their only caller becomes `prompt.ts`.

Data flow: keydown on the input bridge → `InputController` → `vim.handleKey(input)`.

1. In normal or visual mode, `:`, `/` or `?` sets `state.prompt = {kind, text: ''}` and fires `onChange`. For `:` from visual mode, the text is `'<,'>`, as in the source.
2. While the prompt is active, `handleKey` consumes every non-`metaKey` key (returns `true`), and `allowsTextInput()` returns `false`. The core therefore blocks `beforeinput`/`input` document mutation, including `insertFromPaste`/`insertFromDrop`, and discards IME composition.

   **Clipboard isolation (DR-05).** The core `paste`/`cut` listeners are attached to the bridge textarea (`src/input/input.ts:82-84`). They call `replaceSelection` and delete without consulting `allowsTextInput()`, which is a separate path. The vim host listeners therefore intercept clipboard events before they reach the core:
   - **Mechanism.** The listeners are registered on `host` in the capture phase, so they run before the textarea's target-phase listeners for every `paste`/`cut`, whether the event comes from a keyboard shortcut, the app's Edit menu, a context menu, or a synthetic dispatch with no keydown.
   - **Paste while a prompt is active.** `preventDefault()` and `stopPropagation()`, then append the first line of `clipboardData.getData('text/plain')` to `prompt.text` (newlines are cut at the first `\n`; `\r` is removed) and fire `onChange`.
   - **Cut while a prompt is active.** `preventDefault()` and `stopPropagation()` only. The prompt has no selection, so nothing is cut, and the document and selection are untouched.
   - **When no prompt is active,** the listeners return immediately without touching the event. Insert-mode paste/cut and normal/visual clipboard behavior stay exactly as the core implements them today.
   - `copy` is not intercepted, because it never mutates the document.

   This needs no core change, so the core bundle is still unchanged (V2).

   The document cannot change while a prompt is open.
   - A printable key (`key.length === 1` with no ctrl or alt) appends to `text`.
   - `Backspace` removes the last UTF-16 code point pair-safely. On empty text, it cancels.
   - `Ctrl-U` clears the text.
   - `Enter` → `submitPrompt(text)`:
     - `:` runs the ported ex dispatcher (built-ins, otherwise `options.ex`, otherwise `message = 'E492: Not an editor command: …'`).
     - `/` and `?` run a forward or backward search, set the last-search register for `n`/`N`, and set `message` on no match (`E486: Pattern not found: …`).
     - Afterwards `prompt = null` and the mode returns to normal (or visual is left, as in the source).
   - `Escape`, `Ctrl-C` and `Ctrl-[` → `cancelPrompt()`: `prompt = null`, and the cursor, selection and document are unchanged.
   - **Cmdline maps (revision 4).** If the active compiled keymap has `cmdline` entries, the prompt does one lookup per key, before the rules above:
     - The input is normalized to vim key notation with `normalizeKey(input, true)` from `src/vim/keys.ts`.
     - If the normalized key has an entry, the rule runs for the mapped key instead. `<Esc>` cancels, `<CR>` submits, `<BS>` deletes, and a printable key appends.
     - `<Home>`, `<End>`, `<Left>`, `<Right>` and `<Del>` are consumed with no effect, because the prompt is append-only and has no caret.
     - Mapping is single-step: a mapped key is never looked up again.
   - **No cmdline map applies to paste.**
3. `message` is cleared by the next key that starts a command.

### 5.3 Ex commands

- The built-ins ported from the source stay in the engine, for example `:s`, `:noh`, `:{n}`, `:marks` and `:reg`.
- Any other command goes to `options.ex`.
- `emaki/vim` has no file semantics for `:w`, `:q` or `:e`.

### 5.4 Stripped or adapted parts

- **`isFileBoundary`** (controller.ts:2) is dropped. Callers treat it as always `false`. This is an authorized test exclusion; see user-qa #2.
- **`hop`** is kept, with labels drawn as marks.
- **`hints`** is kept only if it can be expressed through `marks(owner)`. Otherwise it is stripped, which is an authorized exclusion stated in the commit message.
- **vactr UI, settings and transport** are stripped. The `clipboard` option replaces the vactr clipboard bridge.
- **Keymap persistence** (revision 4) is no longer stripped. It is ported as the generic §5.5 store, without the app- and Tauri-specific parts.

### 5.5 Keymap customization (revision 4)

**Input forms.** `keymap` is either JSON text or a plain object. An object is serialized with `JSON.stringify` and compiled. `compileKeymap(text)` is the single validator; it is reused unchanged. It returns `{keymap: CompiledKeymap | null, issues}`, where each issue has `{path, severity: 'error' | 'warning', message}`. It enforces `KEYMAP_MAX_BYTES` (262,144 UTF-8 bytes) and `KEYMAP_MAX_ENTRIES`.

**Construction (`vim(options)`).**
- `source = options.keymap ?? presetText(options.preset)`.
  - An unknown `preset` id yields `keymapIssues = [{path: 'preset', severity: 'error', message: 'unknown preset: <id>'}]` and no keymap.
  - With neither option, there is no keymap: the base engine runs and `keymapIssues` is `[]`.
- The adapter compiles `source` itself, in `index.ts`, and stores the issues in `keymapIssues`. It does **not** pass `keymap` or `preset` through to `createVimController`. This avoids a double compile and makes sure the issues are never dropped.
- The compiled keymap is applied with the C1 `setKeymap` (§5.6) when `attach` creates the controller.
- If the result has `keymap === null` (any error), nothing is applied, and the editor still works with the base bindings.
- Issues are available right after `vim()` returns, before `attach`.

**Runtime replacement (`v.setKeymap(input)`).**

| input | outcome |
|---|---|
| `null` | Clears the custom keymap: the engine goes back to the base bindings. Returns `{applied: true, issues: []}`. |
| compiles with no errors (warnings allowed) | Replaces the active keymap. Returns `{applied: true, issues: <warnings>}`. |
| compile errors | The **previous keymap stays active**. Returns `{applied: false, issues}`. |

- In every case `keymapIssues` is set to the returned issues.
- **Before `attach`,** the latest successful keymap (or `null`) is kept and applied by `attach`.
- **After `attach`,** the keymap is applied immediately through the C1 `setKeymap`.
- **Mid-sequence semantics.** The keys of a pending mapped sequence are flushed as if `timeoutlen` had expired: the unmapped keys run, for example a pending `j` in insert mode inserts `j`. Then hints and hop close and the runtime is swapped. This is the existing `ReferenceController.setKeymap` behavior.
- If the swap changes `pending`, `onChange` fires once.
- An open prompt is unaffected: its text is kept, and later prompt keys use the new `cmdline` map.
- Mode, registers, marks, undo history and the document are unchanged by the swap itself.
- `setKeymap` never throws for bad input. A non-string, non-object, non-null input yields `{applied: false, issues: [{path: '$', severity: 'error', message: 'keymap must be JSON text or an object'}]}`.

**`KeymapStore` (generic persistence).**

```ts
export type KeymapStoreSaveResult = { ok: true } | { ok: false; reason: 'too-large' | 'unavailable' };
export interface KeymapStore {
  load(): Promise<string | null>;               // raw keymap JSON text, or null when absent/unreadable
  save(text: string): Promise<KeymapStoreSaveResult>;
  clear(): Promise<void>;
}
export class LocalKeymapStore implements KeymapStore {
  constructor(options?: { key?: string; storage?: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> });
}
```

- **Why the interface is async.** Apps can back it with a file or IPC store; the Tauri example could later use a config-dir store. `LocalKeymapStore` resolves synchronously-computed values.
- **Defaults.** `key` defaults to `'emaki.vim.keymap'`. `storage` defaults to `globalThis.localStorage`, and that property is read **inside** the `try`, because access throws in some sandboxed contexts.
- **`load`.**
  - Returns `null` on a missing value, a thrown exception, or a stored value over `KEYMAP_MAX_BYTES` UTF-8 bytes. An oversized value is treated as absent and is not deleted.
  - It does not compile. The caller passes the text to `vim({keymap})` or `setKeymap` and gets the issues from there.
- **`save`.**
  - Returns `{ok: false, reason: 'too-large'}` when `text` exceeds `KEYMAP_MAX_BYTES` UTF-8 bytes, without writing.
  - Returns `{ok: false, reason: 'unavailable'}` when `setItem` throws (quota, privacy mode, no storage).
  - Otherwise stores the text verbatim and returns `{ok: true}`.
  - It stores JSON **text**; it does not re-serialize. Callers are expected to save only text that compiled without errors (the Tauri flow in §7.1 does). The store itself stays validation-free so it can hold any keymap version.
- **`clear`.** Calls `removeItem` and swallows exceptions.
- **Ownership.** No `emaki/vim` code calls a store implicitly. `vim()` never reads storage; the app connects store → `vim({keymap})` / `setKeymap`.

### 5.6 C1 additive change and integration bug fixes (revision 4)

**Additive C1 change (`src/vim/host.ts`).** `VimController` gains `setKeymap(keymap: CompiledKeymap | null): void`, plus `readonly cmdline: ReadonlyMap<VimKey, VimKey>` (empty when no keymap) for the prompt lookup in §5.2. The facade in `createVimController` forwards `setKeymap` to `ReferenceController.setKeymap`. The existing `VimEngineOptions.keymap` and `preset` stay for compatibility; existing suites use them. No other C1 member changes.

**Engine bug found during integration (fix in `src/vim/controller.ts` `applyEx`).** A `noop-write` command reaches `options.ex` as `{name: <name without trailing '!'>, bang: <name ends with '!'>, args: '', line: <original command text>}`. With this fix, `:q!` arrives as `{name: 'q', bang: true}`, and `:w!` and `:wq!` likewise. Without it, the §7 `:q!` mapping cannot work.

**Regression coverage.** A case is added to the existing `test/vim/search-ex.test.ts`, or to `controller-io.test.ts` if that is where ex callbacks are already asserted. No other engine suite changes.

**Production timer wiring (DR-06; owned by `vim-p03-adapter`).**

*Defect.* `createVimController`'s fallback `timer` (`controller.ts:899-903`) schedules only `ms === 0` callbacks; positive delays never fire. `KeyMapper.startTimer` (`mapper.ts:119-125`) requests `timeoutlen` (a positive delay) to resolve a pending mapped prefix. Without an `options.timer`, two things go wrong:
- A lone `j` under an insert `jj` map stays pending forever and is never inserted.
- A second `j` typed after any delay still triggers `<Esc>`.

The existing engine suites inject their own scheduler, so they hide this.

*Fix.* No C1 or public API change is needed. In `attach`, the adapter always passes a real, cancelable scheduler through the existing `VimEngineOptions.timer` when it calls `createVimController`:
- **`ms > 0`:** `const id = setTimeout(run, ms)`. The returned cancel calls `clearTimeout(id)`.
- **`ms <= 0`:** `queueMicrotask(run)`, guarded by an `active` flag that cancel clears. This keeps the current zero-delay ordering.
- **`run`** first removes its handle from the adapter's live set and then calls `cb` only if the handle is still active and the adapter is still attached.
- **Live set.** The adapter tracks the outstanding cancel functions. `detach()` cancels them all and marks the adapter detached *before* `controller.dispose()`, so no callback ever runs against a disposed controller or a destroyed editor.

*Cancellation contract.* The mapper already cancels its pending timer when a sequence resolves (`takeBuffer` → `cancelPendingTimer`), when it restarts a sequence, and on replay. `setKeymap` flushes and disposes the runtime. The adapter scheduler must honor those cancels, so that a cancelled callback never resolves a buffer or inserts a duplicate character.

*Scope.* `VimOptions` gains no `timer` option. The scheduler is internal; tests use fake global timers (`vi.useFakeTimers()`, which also fakes `queueMicrotask`) instead of injecting one. The engine's fallback `timer` in `controller.ts` stays as it is, because direct `createVimController` users (the engine suites) keep injecting their own.

## 6. Tests

**Reference inventory.** There are 31 suites under the reference `editor/test/code/vim/*.test.ts`, and every one is accounted for:

- **Fully ported** (same case names; only fixtures adapted): actions, controller, controller-io, extended, extended-controller, keys, keys-extended, macro-marks, marks, mapper, motions, notation, operators, parser, parser-extended, presets, purity, record, registers, search-ex, surround, textobjects, undo, undo-repeat and words.
- **Ported with possible case-level exclusions:**
  - `host-keymap`: its host-keymap precedence assertions are re-expressed against emaki's `runKeymaps('highest')` → hook → default order. Cases about vactr app keymaps are excluded.
  - `keymap-controller`, `keymap-parity` and `keymap-schema`: schema, parity and runtime assertions are ported. Cases about vactr persistence and the store are excluded.
  - `hop`: ported. Overlay rendering assertions become mark assertions.
  - `hints`: ported if hints is kept (§5.4). Otherwise the whole suite is excluded.

**Outside the vim directory.**
- `vim-clipboard`: ported against `VimOptions.clipboard`.
- `vim-settings` and `vim-keymap-store`: only their pure schema and validation cases are ported. Persistence cases are excluded.
- UI tests (`test/ui/vim-status`, `vim-toggle`): reference only. Their behavior is covered by the integration test and the smoke test.

**Authorized exclusions are limited to:**
1. `isFileBoundary` behavior
2. vactr UI, persistence, store and transport
3. hints, if stripped

No assertion may be weakened. Expected values change only where the emaki fixture representation differs, for example mark ranges instead of overlay DOM.

**Fixtures.** `test/support/vim-host.ts` is a pure `VimHost` fake over `EditorState` with no DOM. Suites that need DOM use jsdom with `createEditor` and `attach`.

**Implementation evidence (required).** The commit message includes a table with one row per reference suite: the target `test/vim/*.test.ts` file, the number of reference cases, the number ported, and each excluded case with its exclusion class (1–3).

**New `test/vim/editor-integration.test.ts`** (jsdom). It uses real keydown events dispatched on the input bridge textarea of `createEditor(host, { modalKeys: v })` with `v.attach(editor, host)`, and covers:

- **Insert and undo.** `i`, typing (via `beforeinput` insertText), `Esc`, then `dd` and `u`, checking the document text, `state.mode` and the `cursorShape` transitions (block → bar → block).
- **Ex submit.**
  - `:s/a/b/` then Enter changes the document.
  - `:foo` then Enter sets `message` to `E492…` and leaves the document unchanged.
  - `:w` then Enter calls `options.ex` with `{name: 'w', bang: false}`.
- **Search.**
  - `/pat` then Enter moves the cursor to the next match forward.
  - `?pat` then Enter moves it to the previous match backward.
  - `n` repeats the search.
- **Cancel.**
  - `/pat` then Esc leaves the cursor, selection and document unchanged and sets `prompt = null`.
  - `:` then Backspace on empty text cancels.
  - A `beforeinput` insertText fired while the prompt is open does not change the document.
- **Clipboard during a prompt (DR-05).** Events are real `paste`/`cut` events dispatched on the bridge textarea with no preceding keydown. jsdom lacks `ClipboardEvent`/`DataTransfer`, so each test uses `new Event(type, {bubbles: true, cancelable: true})` with a `clipboardData` stub `{getData, setData}` defined on it.
  - **Paste during a `/` prompt.** On document `abc` (cursor at 0), open `/` and paste `ZZ\nyy`. The document stays `abc`, the selection is unchanged, `prompt.text === 'ZZ'`, and `defaultPrevented` is true. Then Enter: the message is `E486…` and the document is still `abc`.
  - **Cut during a visual `:` prompt.** Select a range with `vl`, then type `:` (the prompt text is `'<,'>`) and fire `cut`. The document and selection are unchanged and `prompt.text` is unchanged. Then Esc: `prompt === null` and the document is unchanged.
  - **Insert mode keeps clipboard behavior.** In insert mode (`i`), paste `QQ`: the document gains `QQ` at the cursor through the core path (not prevented by vim). With a selection in insert mode, `cut` removes the selected text and calls `setData`.
  - **Detach.** After `detach()`, a paste with no prompt follows the core path.
- **Cmd passthrough.** `Meta+s` returns `false` from `handleKey`.
- **Before attach.** Typing before `attach` inserts text as with no hook.
- **Cursor mark.** In normal mode, a block mark with owner `emaki-vim` covers the head.
- **Keymap (revision 4).** Mapped keys are sent as keydown events only. A consumed keydown in the real browser produces no `beforeinput`, so the test fires none. Each case:
  - **Insert-mode remap.** `vim({keymap: {version: 1, maps: {i: [{lhs: 'jj', rhs: '<Esc>'}]}}})` on `abc`: `i`, `j`, `j` → mode `normal`, document `abc`, `keymapIssues` is `[]`.
  - **Leader mapping.** `{version: 1, leader: '<Space>', maps: {n: [{lhs: '<leader>d', rhs: 'dd'}]}}` on `a\nb`: `Space`, `d` → document `b`.
  - **Runtime `setKeymap` without re-creating the editor.** Start with no keymap: `i`, `j`, `j` inserts `jj`. After `Esc` and `v.setKeymap(<jj JSON text>)`, which returns `applied: true`, `i`, `j`, `j` → `normal`, and the `EditorHandle` is the same object.
  - **`setKeymap(null)`** restores the base bindings: `jj` in insert inserts again.
  - **Invalid keymap at construction.** `vim({keymap: '{"version":2}'})` gives a `keymapIssues[0]` with `path: 'version'` and `severity: 'error'`. Base vim still works (`i`, typing, `Esc`, `dd`).
  - **Invalid keymap at runtime.** With the jj keymap active, `setKeymap('not json')` returns `{applied: false}` with an `invalid JSON` issue, and `jj` still escapes.
  - **Unknown preset.** `vim({preset: 'nope' as never})` gives a `path: 'preset'` error. The `default` preset compiles with no errors.
  - **Mid-sequence swap.** In insert mode on an empty document with the jj keymap, press `j` (pending), then `setKeymap(null)`. The document is `j`, `state.pending` is `''`, and the mode is still `insert`.
  - **Cmdline map.** With `{version: 1, maps: {c: [{lhs: '<C-g>', rhs: '<Esc>'}]}}`, `:abc` then `Ctrl-G` gives `prompt === null` and an unchanged document.
  - **Ex bang (§5.6).** `:q!` then Enter calls `ex` with `{name: 'q', bang: true}`.
- **Keymap timing (DR-06, §5.6 production timer).**
  - **Setup.** Use `vi.useFakeTimers()` and pass **no** scheduler: the `vim()` options carry no timer, and nothing is injected into the controller. Run on an empty document with `vim({keymap: {version: 1, timeoutlen: 50, maps: {i: [{lhs: 'jj', rhs: '<Esc>'}]}}})` attached to `createEditor`. Keys are keydown only.
  - **Lone prefix times out.** `i`, `j`, then `vi.advanceTimersByTime(49)`: document `''`, `state.pending` `'j'`. Then `advanceTimersByTime(1)`: document `'j'`, `pending` `''`, mode `insert`.
    - This case fails on the current fallback timer (it would stay `''` with `'j'` pending), so it is the regression for the confirmed defect.
  - **Rapid `jj`.** `i`, `j`, `advanceTimersByTime(20)`, `j`: mode `normal`, document `''`. Then `advanceTimersByTime(1000)`: the document is still `''` (the cancelled timer does not fire), and `vi.getTimerCount()` is `0`.
  - **Timeout-separated keys.** `i`, `j`, `advanceTimersByTime(60)`, `j`, `advanceTimersByTime(60)`: mode `insert`, document `'jj'`. The second `j` starts a new sequence and does not escape.
  - **Replacement cancels.** `i`, `j` (pending), then `v.setKeymap(null)`: the document is `'j'` from the §5.5 flush. Then `advanceTimersByTime(1000)`: the document is still `'j'` (no duplicate insert), and `vi.getTimerCount()` is `0`.
  - **Detach cancels.** `i`, `j` (pending), then `detach()`. Then `advanceTimersByTime(1000)`: no exception, the document is unchanged from its value at detach, no `onChange` callback fires after detach, and `vi.getTimerCount()` is `0`.
  - **Timer assertions.** A timer assertion that fails must not be weakened by passing a scheduler.
  - **Location.** These cases live in `test/vim/editor-integration.test.ts`. Engine suites (`keymap-controller`, `mapper`) are unchanged.

**New `test/vim/keymap-store.test.ts` cases (revision 4).** They are added to the existing file, which keeps its current cases. They use an in-memory `storage` stub and cover:
- a `save` → `load` round trip of the exact text
- `load` → `null` when the key is absent
- `getItem` throwing → `load` resolves `null`
- `setItem` throwing → `{ok: false, reason: 'unavailable'}`
- text over `KEYMAP_MAX_BYTES` → `{ok: false, reason: 'too-large'}`, with no write
- a stored oversized value → `load` resolves `null`
- `clear` → a later `load` resolves `null`, and `clear` with a throwing `removeItem` does not reject
- a custom `key` option isolates two stores on one storage
- the default storage being inaccessible (`globalThis.localStorage` getter throws) → `load` resolves `null`

**Public-export test.** `test/vim/public-api.test.ts` imports from `../../src/vim/index`. It asserts that `vim`, `compileKeymap`, `KEYMAP_MAX_BYTES`, `KEYMAP_PRESETS` and `LocalKeymapStore` are exported, and that `KEYMAP_PRESETS` ids are `default` and `mise-darwin`.

**Unchanged tests.** All existing editor tests pass unmodified, and the boundary test adds the vim-isolation assertion from section 3.

## 7. Tauri example (`examples/tauri-editor`)

**Wiring.** Add an exact alias `^emaki/vim$` → `../../src/vim/index.ts` in `vite.config.ts`, plus a matching `tsconfig.json` `paths` entry.

**UI.** The footer gains:
- `<label><input type="checkbox" id="vim"> vim</label>`
- `<span id="vim-mode">`, which shows:
  - `NORMAL`, `INSERT`, `VISUAL`, `VISUAL LINE`, `VISUAL BLOCK` or `REPLACE`, or
  - `{prompt.kind}{prompt.text}` while a prompt is active.

  It is hidden when vim is off.

`message` shows in `#status-msg`.

**Persistence.** The value is stored in `localStorage['emaki-tauri-editor.vim']` as `'1'` or `'0'`. Reads and writes are each wrapped in `try/catch`; a failure reads as off, and a failed write is skipped.

**Toggle.** `mount()` builds `v = vimOn ? vim({ ex, keymap: userKeymap ?? undefined }) : undefined` (where `userKeymap` comes from §7.1) and passes `modalKeys: v`. After `createEditor`, it calls `v.attach(handle, host)` and subscribes to `onChange`. Toggling remounts through the existing live-remount path, which keeps:
- the text
- the clamped selection
- `dirty`
- `clean` (see below)

Undo history is lost on remount, an accepted non-goal of `design-tauri-editor.md`.

**Shortcuts.** The window capture listener is unchanged, so `Mod+N/O/S/Shift+S` work in every vim mode, including an open prompt.

**Ex mapping (`ex` callback).** Every app action runs under the existing `busy` lifecycle: if `busy` is set the action is dropped, otherwise `busy` is set and cleared in `finally`. The callback returns `true` synchronously and runs the action asynchronously. Errors go to `#status-msg`.

| command | action |
|---|---|
| `:w` | Save |
| `:w {path}`, `:saveas {path}` | Save As (picker preselected with the basename) |
| `:wq` | Save. Once it settles, if the document is clean, `destroy` the window |
| `:q` | `if (await guard()) destroy` |
| `:q!` | `destroy` without the guard |
| `:e` | Open (`openFile`: guard → picker → `openPath`) |
| `:e {path}` | `openNamed(path)`, described below |
| anything else | returns `false` |

**`openNamed(path)` flow (DR-01).** The flow runs **guard → native path confirmation → `openPath`**:

1. `if (!(await guard())) return`. Declining discard leaves everything untouched: text, path, selection, `dirty`, `clean`, title, and the vim mode (normal).
2. `const p = await invoke('confirm_open_path', { path })`. On `null` (declined), return, with nothing changed as in step 1. The discard was approved but not acted on, and the document is still the same.
3. `await openPath(p)`. `openPath` reads before it replaces anything (`read_text_file` runs before `docId++`). On a read error, the message goes to `#status-msg` and the document is unchanged.

**New Rust command `confirm_open_path(path) -> Option<String>` (async).**
- It makes the path absolute and shows a native `blocking_show` Yes/No dialog, "Open {path}?".
- Yes grants the path and returns it; No returns `None`.
- The granted-path boundary of `design-tauri-editor.md` section 5 is preserved.
- The absolutizing helper is a plain function with a `cargo test`: relative paths resolve against the cwd, and absolute paths are unchanged.
- The mock implements it, governed by `__tauriEditorMock.confirmOpen: boolean`, and records it in `calls`.

**Dirty-on-launch fix.** This supersedes the dirty rule in `design-tauri-editor.md` section 7.

- **Root cause (hypothesis, not natively observed at design time).** `dirty` is set by *any* `docChanged` update, without comparing content. The native launch path differs from the mocked one only in the platform event stream: WKWebView focus, IME, text-input-client and `beforeinput`/`input` events after `handle.focus()`. The unchanged-value native fallback already returns early (`src/input/input.ts:291`). The remaining candidates are:
  - a non-cancelable `beforeinput`/`input` that reconciles to an identical splice
  - `insertReplacementText` (`input.ts:249-252`)
  - a composition commit (`input.ts:204`) emitted by the platform on focus
  - an out-of-order `setTitle`. This is a secondary contributor only: it cannot add `•` on its own, but it can leave a stale title.
- **Native confirmation (V7).**
  1. In the native debug build, set `localStorage['emaki-tauri-editor.traceDirty'] = '1'`.
  2. With the trace on, `onUpdate` logs each `docChanged` update's `userEvent`, its change ranges, and `doc.eq(clean)` through `console.debug`.
  3. Launch with a CLI file and record the observed event in the commit message and the README.
  4. If the change turns out non-identical and comes from an emaki input path, fix that path in `src/input/input.ts` and add a jsdom regression test under `test/input/` reproducing the observed event sequence. This conditional core change must keep the core bundle unchanged under V2. If it cannot, record it under user-qa #1.
  5. If no GUI session can be observed, the commit message says "root cause analyzed, not natively observed".
- **Fix (independent of the cause).**
  - The app keeps `clean: Text`: the document as last loaded or saved.
  - On every `docChanged`: `rev++` and `dirty = !handle.state.doc.eq(clean)`. `title()` runs only when `dirty` flips.
  - Open, New and Launch set `clean = handle.state.doc` after mount.
  - Save snapshots `{ docId, doc }`, writes `doc.toString()`, and on success with the same `docId` sets `clean = snap.doc` and `dirty = !current.eq(clean)`. Edits made during a write stay dirty ("Saved (newer edits unsaved)").
  - Remounts keep `clean`.
  - An edit that is undone back to `clean` reads clean.
- **Title.** `title()` sets `document.title` synchronously and applies the native `setTitle` through a latest-wins chain: one call in flight, and the newest pending string is applied when it settles.
- **What the regression tests prove.** The smoke checks below prove the **mitigation**: no-op and identity transactions and focus events cannot mark dirty. They do not prove the native causal mechanism, which only V7 can.

**Smoke additions (`scripts/smoke.mjs`).** The mock gains `initialPath` and `confirmOpen`, seeded before load through `page.addInitScript` (`window.__tauriEditorMockSeed`). The mock also exposes `dispatchIdentity()`, which replaces the whole document with itself through the handle.

1. **Launch regression.**
   1. Seed `initialPath = '/mock/hello.rs'` and load the page. The title is `hello.rs — emaki`, with no `•`.
   2. Fire synthetic `focus`, `selectionchange`, an `input` with the value unchanged, and `dispatchIdentity()`. The title still has no `•`.
   3. Type `x`, then Backspace. The title is clean.
2. **Vim basics.**
   1. Click `#vim`; `#vim-mode` shows `NORMAL`.
   2. `i` gives `INSERT`. Type `hi`, then `Esc` gives `NORMAL`, and the title has `•`.
   3. `:w` then Enter (`#vim-mode` shows `:w` before Enter). `files` contains `hi`, the title is clean, and `calls` has `write_text_file`.
   4. In NORMAL mode, `x` then `Mod+S` saves.
   5. `/hi` then Enter, then Esc during `/zz`. The text is unchanged and `#vim-mode` returns to `NORMAL`.
   6. **App shortcut and clipboard during a prompt (DR-05).**
      1. Make the document dirty. Type `/ab` (prompt open), then press `Mod+S`. `calls` gains `write_text_file`, the title is clean, and `#vim-mode` still shows `/ab`.
      2. Dispatch a `paste` event carrying `ZZ` on the bridge textarea. `text()` is unchanged and `#vim-mode` shows `/abZZ`.
      3. Press Esc. `text()` is unchanged.
3. **`:q` guard.** Make the document dirty, set `discard = false`, then `:q` and Enter. `calls` gains `confirm_discard`, and the text and title are unchanged.
4. **`:e {path}` (DR-01).** The document is dirty with text T and path P.
   1. **Declined discard.** With `discard = false` and `confirmOpen = true`, run `:e /mock/other.txt`. `calls` gains `confirm_discard` but **not** `confirm_open_path`. Text, path, title (with `•`) and the `#pos` selection are unchanged.
   2. **Declined path.** With `discard = true` and `confirmOpen = false`, repeat. `calls` gains `confirm_open_path` but no new `read_text_file`. Text, path, title and selection are unchanged.
   3. **Success.** With `discard = true` and `confirmOpen = true`, repeat. `#lang` is `plaintext`, the title is `other.txt — emaki` with no `•`, and the text is the seeded content.
5. **Persistence.** Reload the page; `#vim` is still checked. Uncheck it; `#vim-mode` is hidden.
6. All existing smoke checks are unchanged.
7. **`:q!` (§5.6).** Make the document dirty and set `discard = false`. Run `:q!` and Enter. `calls` gains `plugin:window|destroy` and **no** `confirm_discard`. The mock already records every command name and answers `plugin:window|*` with `null`, so the page survives the call.
8. **User keymap.** See §7.1 for the steps.

### 7.1 User keymap in the Tauri example (revision 4)

**Source.** The keymap is loaded through a status-bar button and the native file dialog. It reuses the existing grant-checked `pick_open_path` and `read_text_file` commands, so there is **no new Rust command, capability or config-dir IO** (decision D11). The intake allows "dialog *or* app config dir"; the dialog alone meets it without widening the Rust permission surface.

**UI.** The footer gains two elements:
- `<button id="vim-keymap" type="button">keymap…</button>`
- `<button id="vim-keymap-clear" type="button">reset keymap</button>`

Both are `hidden` while vim is off. Issues and results are shown in `#status-msg` with `textContent`.

**Persistence.**
- `const keymapStore = new LocalKeymapStore({ key: 'emaki-tauri-editor.vim.keymap' })`, imported from `emaki/vim`.
- At startup, before the first `mount`: `userKeymap = await keymapStore.load()`.

**Load flow (`#vim-keymap` click).** It runs under the shared `run()` busy helper. It does **not** call `guard()`: the document is not replaced. The steps:
1. `p = await invoke('pick_open_path')`. If `!p`, return with nothing changed.
2. `text = await invoke('read_text_file', {path: p})`.
3. `r = compileKeymap(text)`.
4. **If `r.keymap === null`:** show the issues and return. `userKeymap`, the store and the active vim keymap are unchanged.
5. **Otherwise:** `s = await keymapStore.save(text)`, then `userKeymap = text`, then `currentVim?.setKeymap(text)`. The keymap is applied to the live editor without a remount. The status is `Keymap loaded` plus the warnings. If `!s.ok`, it also shows `(not persisted: <reason>)`, and the keymap still stays active for this session.

**Clear flow (`#vim-keymap-clear`).** `await keymapStore.clear()`, then `userKeymap = null`, then `currentVim?.setKeymap(null)`, then the status `Keymap reset`.

**Issue display.**
- The format is `keymap: <n> error(s)/warning(s): <path>: <message>; …`, with at most 3 issues, then `…`.
- At startup and on each vim mount, if `v.keymapIssues` is non-empty (for example a stored keymap that no longer compiles), the same format is shown. The editor still runs with base bindings.

**Persisted invalid text.** The load flow never stores a keymap that fails to compile. A pre-existing invalid stored value is only reported; it is not deleted automatically. "reset keymap" removes it.

**Pick grant side effect.** `pick_open_path` grants the chosen keymap path for read and write. This is the existing boundary semantics of `design-tauri-editor.md` §5, and is recorded as a risk.

**Mock.** No new IPC command is needed. The smoke test seeds the keymap file in `files` and sets `nextOpen` to its path.

**Smoke additions (keymap).** These run on a fresh page with vim on and storage cleared. Seed `/mock/keymap.json` = `{"version":1,"maps":{"i":[{"lhs":"jj","rhs":"<Esc>"}]}}` and `/mock/bad.json` = `{"version":2}`.
1. **Load.**
   1. Set `nextOpen = '/mock/keymap.json'` and click `#vim-keymap`.
   2. `#status-msg` contains `Keymap loaded`, and `localStorage['emaki-tauri-editor.vim.keymap']` equals the file text.
   3. Press `i`, then type `jj`. `#vim-mode` reads `NORMAL`, and `text()` does not contain `jj`.
2. **Persisted.** Reload the page. `i`, `jj` gives `NORMAL` without loading the keymap again.
3. **Invalid.**
   1. Set `nextOpen = '/mock/bad.json'` and click `#vim-keymap`.
   2. `#status-msg` contains `version must be the integer 1`.
   3. The stored value is still the `keymap.json` text, and `i`, `jj` still gives `NORMAL`.
4. **Reset.** Click `#vim-keymap-clear`. The storage key is absent, and `i`, `jj` leaves `#vim-mode` at `INSERT`, with `text()` containing `jj`.
5. **Cancelled pick.** Set `nextOpen = null` and click `#vim-keymap`. The storage and status are unchanged, and there is no `read_text_file` call.

## 8. README

- **`emaki/vim` section.** It covers:
  - Install and usage: `createEditor(host, { modalKeys: v })` then `v.attach(editor, host)`.
  - The `state`/`prompt`/`message`/`onChange`/`cursorShape` API and the feature list.
  - `ex` delegation.
  - Opt-in, with zero core-bundle impact.
  - The known limitation that the bar caret stays visible behind the block cursor.
  - **Keymap customization (revision 4):**
    - the JSON schema outline (`version`, `leader`, `timeoutlen`, `maps.{n,i,x,v,o,c}`, `hints`, `hop`) with the `jj` and leader examples
    - `vim({keymap | preset})`, `setKeymap` and its `{applied, issues}` result, and `keymapIssues`
    - `compileKeymap` and `KEYMAP_PRESETS`
    - `KeymapStore` / `LocalKeymapStore` with its size limit and failure semantics
    - the fact that `vim()` never reads storage on its own
- **Tauri section.** It covers:
  - the vim toggle and its persistence
  - the ex mapping, including `:q!` and the guarded and confirmed `:e path`
  - the keymap button, reset, persistence key and issue display (§7.1)
  - the dirty-on-launch root cause together with its observation status
- **Host extension points (revision 5).** A new `emaki/vim` subsection covers:
  - `actions`: the handler signature, the context, the return contract, the `emaki.*` ids, the ex aliases and the action-id rule
  - every `hooks` member with its default
  - the `VimSnapshot` field table, plus the `onChange` and `subscribe` firing rule
  - `render` switches, and how to render hints and hop yourself
  - the low-level `createVimController` example with a custom host and prompt UI, including the `noteUpdate` duty (forward `userEvent`, and the fallback when it is omitted) and the `prompt.text` meaning on that path
  - `tapMode()` on `Vim` and `VimController` for mode-toggle controls

## 9. Decisions

1. **D1 — attach by the app.** The app calls `vim.attach(editor, host)` after `createEditor`. There is no core hook extension, so existing hooks are unaffected.
   - **D1a — prompt clipboard isolation** is done by vim-owned capture-phase `paste`/`cut` listeners on `host` (§5.2). They act only while a prompt is open, and need no core change.
2. **D2 — cursor and hop labels as marks.** They are drawn as marks through the plugin API. This needs no core rendering change.
3. **D3 — prompt editing is owned by the engine** inside `handleKey`, and apps only display `state.prompt`.
4. **D4 — ex delegates through the `ex` callback.** `emaki/vim` has no file semantics.
5. **D5 — toggle by remount.**
6. **D6 — `isFileBoundary` is dropped.**
7. **D7 — `:e {path}` order.** The flow is guard → native confirm (grant) → `openPath`, under `busy`.
8. **D8 — core-size acceptance is the effective input.** The core bundle is unchanged:
   - V2 compares `entries['.']` (and `./engine`, `./json`, `./diff`) raw and gzip bytes, which must be **identical** between the before (V0) and after JSON.
   - No core source files change, apart from the conditional input fix in section 7, which is also held to V2.
   - Using the renderer's native cursor shape would need core bytes. It is recorded only as an **unapproved, pending scope-amendment proposal** in user-qa #1, and is not implemented unless explicitly approved.
9. **D9 — dirty means content differs from the clean baseline.**
10. **D10 — keymaps are compiled in the adapter, applied through an additive C1 `setKeymap`, and failed compiles keep the previous keymap** (§5.5, §5.6). Issues are always surfaced through `keymapIssues` and the `setKeymap` result, never dropped.
11. **D11 — the Tauri user keymap uses the dialog only,** through the existing grant-checked `pick_open_path` and `read_text_file`, and is persisted with `LocalKeymapStore`. There is no app-config-dir path and no Rust or capability change (user-qa #5 records the alternative).
12. **D12 — `KeymapStore` is async and validation-free;** `LocalKeymapStore` enforces only the byte limit and exception safety. The app decides what to save, and the Tauri example saves only error-free compiles.
13. **D13 — the prompt applies the `cmdline` (`c`) maps** as a single-step key translation (§5.2), so compiled `c` maps are not silently ignored.
14. **D14 — the `noop-write` ex forwarding splits the trailing `!` into `bang`** (§5.6). This is an engine bug fixed during integration.
15. **D15 — the adapter owns a real, cancelable `setTimeout`/`queueMicrotask` scheduler** and passes it through the existing `VimEngineOptions.timer`. Every pending callback is cancelled on detach. There is no public timer option. This fixes DR-06, where mapped-prefix timeouts never fired.
16. **D16 — application actions go through one host action registry keyed by action id** (§12.2). Built-in `emaki.*` ids are ordinary registry keys. Unregistered ids do nothing. The keymap schema accepts namespaced host ids without knowing the registry.
17. **D17 — the other host hooks are optional `hooks` members.** Each one replaces its default entirely, and the defaults reproduce today's behavior from the C1 host (§12.3).
18. **D18 — `VimSnapshot` extends `VimState`.** `vim().state`, the `onChange` payload and the low-level `snapshot`/`subscribe` payload are the same snapshot type (§12.4).
19. **D19 — the low-level path is the existing C1 contract.** `createVimController(host: VimHost, options)` is exported through an `index.ts` wrapper that adds the real scheduler and the platform default. There is no second host contract (§12.5).
20. **D20 — default renderers stay as marks inside the vim entry and can be switched off one by one** through `render` (§12.6).
21. **D21 — notifications are coalesced per call and deduplicated over the full snapshot** (§12.4).
22. **D22 — no extension point touches core.** Every change is under `src/vim`, the tests, the README and the plan files. Core bytes stay identical to 6351463 (V10).
23. **D23 — `tapMode()` is public on `VimController` and `Vim`** and delegates to the existing engine operation unchanged (§12.5, DR-HOST-01).
24. **D24 — `noteUpdate` accepts an optional `userEvent`.** A present value, including `null`, is forwarded verbatim. When it is absent, the legacy heuristic applies (§12.5, DR-HOST-02).

## 10. Verification

Logs go under `tmp/vim-20261111/`, with each command's exit status recorded.

| # | command | expected |
|---|---|---|
| V0 | before any revision 4 change (at HEAD f204032; the core is unchanged since 283d6bc): `node scripts/bundle-size.mjs --entries core --out tmp/vim-20261111/core-before.json` | exit 0. No `core-before.json` exists yet under `tmp/vim-20261111/` |
| V1 | `npm run check && npm test && npm run build && node scripts/bundle-size.mjs` | exit 0. `test/vim/*` (including `editor-integration`, the keymap cases, `keymap-store` and `public-api`) and boundary pass. The `./vim` entry is reported |
| V1a | `git diff --name-only f204032 -- src ':!src/vim'` | empty, unless the conditional §7 input fix happened |
| V2 | `node scripts/bundle-size.mjs --entries core --out tmp/vim-20261111/core-after.json`, then compare with V0 | `.`, `./engine`, `./json` and `./diff` raw and gzip bytes are identical |
| V3 | `npm run perf` | same verdicts as on `main` |
| V4 | `cd examples/tauri-editor && npm run check && npm run build && npm run smoke` | exit 0. The smoke JSON shows the launch-regression, vim, `:q`, `:q!`, the three `:e` checks and the five keymap checks (§7.1) `ok` |
| V5 | `cd examples/tauri-editor/src-tauri && PATH="$HOME/.cargo/bin:$PATH" ~/.cargo/bin/cargo test` | exit 0, including the absolutize test. Never use the mise cargo shim |
| V6 | `cd examples/tauri-editor && PATH=$HOME/.cargo/bin:$PATH npx tauri build --debug --no-bundle` | exit 0 |
| V7 | native: launch the debug binary with a file argument and the trace on | title has no `•`. The trace is recorded, or reported "not observed" |
| V8 | `ls impl-plans/active \| grep '^vim-'` after archiving | empty. All 9 `vim-*` files (overview, dispatch JSON, p01–p07) are in `impl-plans/completed/` |

**Revision 5 rows.** Logs go under `tmp/vim-host-20261111/`, with each command's exit status recorded.

| # | command | expected |
|---|---|---|
| V9 | before any revision 5 source change, at HEAD 6351463: `node scripts/bundle-size.mjs --entries core --out tmp/vim-host-20261111/core-before.json` | exit 0 |
| V10 | `npm run check && npm test && npm run build && node scripts/bundle-size.mjs`, then `node scripts/bundle-size.mjs --entries core --out tmp/vim-host-20261111/core-after.json` and compare with V9 | exit 0. All §12.8 suites, `test/boundary.test.ts` and `test/vim/purity.test.ts` pass. `.`, `./engine`, `./json` and `./diff` raw and gzip bytes are identical |
| V10a | `git diff --name-only 6351463 -- src ':!src/vim'` | empty |
| V11 | `cd examples/tauri-editor && npm run check && npm run smoke` | exit 0, and every existing smoke check is `ok` |
| V12 | `npm run perf` (optional) | same verdicts as 6351463. If it fails, re-run at 6351463 under the same load before drawing any conclusion |

## 11. Risks

- **Vim surface mapping.** The mapping from the vactr surface to `VimHost` is confirmed only during implementation. Section 4 fixes the member list and requires in-vim shims or a recorded drop.
- **Visual fidelity.** The block cursor drawn as a mark still shows emaki's bar caret. This is documented, and the clean fix is the pending amendment (user-qa #1).
- **Native root cause.** It is unproven without a GUI session (V7). The mitigation is independent of the cause.
- **Boundary text.** Ported text containing `vactr` or `/editor/` fails the boundary test.
- **Mid-sequence keymap swap** (revision 4). The flush-then-swap can run unmapped pending keys, for example inserting a pending `j`. This matches vim's timeout semantics and is pinned by a test (§6).
- **Keymap pick grant.** Choosing a keymap file through `pick_open_path` also grants it for `write_text_file`. This is existing boundary behavior and needs no new Rust surface; it is documented in the README.
- **Stale stored keymap.** A stored keymap that later fails to compile is reported at mount, and the editor runs with base bindings until it is reset or replaced.
- **Smoke timing.** Smoke `jj` checks rely on the default `timeoutlen` of 1000 ms, with the real adapter scheduler from §5.6. Playwright `keyboard.type` sends both keys well inside that window. Exact timeout boundaries are proven only by the fake-timer integration cases in §6.
- **Stale timer callbacks.** A callback that fires after detach or after a keymap swap could touch a destroyed editor. The §5.6 live-set cancellation and the `vi.getTimerCount() === 0` assertions in §6 guard against this.
- **Behavior parity is only as good as the class-2 port (revision 5).** Hook, hint and hop details could diverge subtly from the reference. The class-2 port (§12.8), with every reference case accounted for in the commit evidence table, is the guard. Any case that cannot be expressed is reported, not silently dropped.
- **userEvent forwarding in `vim()` (revision 5, D24).** Real core userEvents now replace the insert-mode heuristic. A core edit path whose event `isTextEvent` does not accept would stop being dot-recorded. The existing `editor-integration` suite and the Tauri smoke guard this. If they fail, the event is mapped in `index.ts`.
- **`platform` may be inert (revision 5).** See §12.3 and user-qa #7.
- **More frequent `onChange` (revision 5).** `onChange` now also fires on cursor moves (D21). The Tauri example re-renders its mode label on each call, which is cheap. V11 confirms it.
- **Public API surface (revision 5).** The exported C1 contract now binds the later migration. Every change is additive, and the existing `public-api` suite is updated in the same commit.
- **Forbidden strings in ported tests (revision 5).** Ported test text containing `vactr`, `solid-js` or `/editor/` fails the boundary test. Ported names use neutral wording.

## 12. Host extension points (revision 5)

### 12.1 Baseline (HEAD 6351463) and the gap

**The engine already has the full surface.** `ReferenceController` in `src/vim/controller.ts` is written against the internal engine host in `src/vim/types.ts`. That host calls:
- `actions.*`
- `announce`, `closePopupWithEscape`, `platform`, `matchesDefaultKeymap`, `compositionActive`
- `isVisible`, `historyReduced`
- `scrollCaret`, `scrollLines`, `typeText` and `defaultKey`

It also keeps an internal `VimSnapshot` with these fields: `mode`, `label`, `pending`, `recording`, `search`, `message`, `messageKind`, `prompt {kind, initial}`, `cursorShape`, `displayCursor`, `displayCursorEnd`, `hints` and `hop`.

**The public layer flattens it.**
- `createVimController(host: C1 VimHost, options)` (`controller.ts:865`) builds a shim that hard-codes most of these members:
  - `actions` are all no-ops, and `diagnosticNext`/`Prev` return `null`. The engine therefore shows `no diagnostics` today.
  - `announce` does nothing.
  - `closePopupWithEscape`, `matchesDefaultKeymap`, `compositionActive` and `historyReduced` always return `false`.
  - `platform` is always `'other'`.
- The C1 facade exposes only `mode`, `pending`, `message` and `prompt`. Its `subscribe(cb)` passes no payload and fires only when those four change.
- `vim().state` is `VimState {mode, pending, message, prompt}`.
- `actions.ts` fixes `ActionId` to seven `emaki.*` ids and four `hop.*` ids. `compileKeymap` rejects any other action id (`unknown action id`).
- `parseEx` maps `:eval`, `:evalall`, `:run`, `:hush` and `:format` to `host.actions[...]` (`controller.ts:656`).
- `isPassThrough(input, _platform, …)` (`keys.ts`) currently ignores `platform`.
- `index.ts` exports only `vim`, `compileKeymap`, `KEYMAP_MAX_BYTES`, `KEYMAP_PRESETS` and `LocalKeymapStore` as values. `test/vim/public-api.test.ts` pins that list.

**The change.** Revision 5 replaces the hard-coded shim members with host-supplied values and keeps today's values as the defaults. It publishes the snapshot the engine already computes. The engine algorithms do not change, except for the action dispatch (§12.2) and notification coalescing (§12.4).

### 12.2 Host action registry

```ts
export interface VimActionContext { id: string; mode: VimMode; cursor: number; state: EditorState }
export type VimActionHandler = (context: VimActionContext) => number | null | void;
// VimOptions.actions and VimEngineOptions.actions:
actions?: Readonly<Record<string, VimActionHandler>>;
```

**Dispatch.** A keymap entry `{lhs, action: id}` and the ex aliases both go through one dispatcher:
- A `hop.*` id stays engine-owned and starts hop. It never consults the registry.
- Any other id is looked up with an own-property check on `actions`.
  - **No handler:** nothing happens. There is no message, the cursor does not move, and the snapshot is unchanged.
  - **Handler:** it is called once with `{id, mode, cursor, state}`, where `cursor` is the engine cursor (normal-clamped outside insert and replace).
- **The handler's return value:**
  - **`number`:** the cursor moves there with the existing `moveToDiagnostic` behavior. The position is clamped to a normal-mode position. In visual mode the visual head is extended. Otherwise the jump context is set first. `scrollCaret` follows.
  - **`null`:** "no target". The info message is `no diagnostics` for `emaki.diagnostic.next` and `emaki.diagnostic.prev`, which keeps parity. Every other id gets no message.
  - **`undefined` (void):** nothing more happens.
  - Either way the snapshot refreshes once.
- **Exceptions** thrown by a handler follow the reference (amendment round 1, IR-W3-1). On the keymap path the existing mapper catch-all (`src/vim/mapper.ts:78-82`) swallows the exception and resets, so pending is cleared and the next key works. On the ex-alias path the exception propagates to the caller of `submitPrompt`.

**Built-in ids.** The registry keys are the existing ids: `emaki.evaluate`, `emaki.evaluateAll`, `emaki.hush`, `emaki.format`, `emaki.completion`, `emaki.diagnostic.next` and `emaki.diagnostic.prev`. The ex aliases dispatch to them:

| ex | id |
|---|---|
| `:eval` | `emaki.evaluate` |
| `:evalall`, `:run` | `emaki.evaluateAll` |
| `:hush` | `emaki.hush` |
| `:format` | `emaki.format` |

An unregistered alias is a no-op, which is the current observable behavior.

**Keymap schema (`keymap-schema.ts`, `actions.ts`).**
- **Built-in ids** keep their `ACTION_MODES` mode restrictions and their messages.
- **`hop.*`** is reserved. Unknown `hop.*` ids still fail with `unknown action id`, and hop ids are still dropped while hop is disabled.
- **Host ids.** Any other id matching `^[A-Za-z][A-Za-z0-9_-]*(\.[A-Za-z0-9_-]+)+$` (namespaced, at least one dot, at most 128 characters) is accepted in modes `n`, `x` and `i`.
  - `o` is rejected with the existing `not allowed in mode` message, because only hop is a valid operator target.
  - `c` stays rejected for all actions.
- An id that matches none of these rules fails with `unknown action id <id>`.

These rules keep the existing `keymap-schema` and `actions` suites unchanged: `missing` has no dot, and `isActionId('nope')` is still false. `isActionId` stays the built-in check. A new `isHostActionId` implements the pattern, and `ActionId` widens to `string` at the mapper and runtime boundary. Hints already describe an action mapping by its `desc`, or by its id when `desc` is missing.

**Validation is registry-independent.** Keymaps are compiled before or without a registry (`compileKeymap` is public, and `vim()` compiles at construction), so the schema cannot check registration.

### 12.3 Optional host hooks

```ts
export type VimPlatform = 'apple' | 'other';
export interface VimHooks {
  announce?(message: string, assertive: boolean): void;
  closePopupWithEscape?(): boolean;
  platform?: VimPlatform;
  matchesDefaultKeymap?(input: ModalKeyInput): boolean;
  compositionActive?(): boolean;
  isVisible?(pos: number): boolean;
  historyReduced?(): boolean;
  scrollCaret?(): void;
  scrollLines?(lines: number): void;
  typeText?(text: string): void;
  defaultKey?(key: string): boolean;
}
// VimOptions.hooks and VimEngineOptions.hooks:
hooks?: VimHooks;
```

**How hooks apply.** Each provided member fully replaces its default, and the engine calls it at the existing reference call sites. Hooks are read once, at construction or `attach`. Hosts that need dynamic behavior close over their own state.

| hook | engine use (unchanged) | default (today's behavior, from the C1 host or EditorHandle) |
|---|---|---|
| `announce` | mode changes (label), messages (`assertive` = error), hop prompt | no-op |
| `closePopupWithEscape` | `Ctrl-[`/`Ctrl+Esc` consumed when it returns `true` | `() => false` |
| `platform` | passed to `isPassThrough` | `vim()` and the exported `createVimController`: detected in `index.ts` from `globalThis.navigator` (`/Mac\|iPhone\|iPad\|iPod/` on `platform` or `userAgent` → `'apple'`), inside `try`, else `'other'`. Engine-internal `controller.ts` callers: `'other'` |
| `matchesDefaultKeymap` | `true` → `handleKey` returns `false` (the core default keymap runs) | `() => false` |
| `compositionActive` | `true` → `handleKey` returns `false` | `() => false` |
| `isVisible` | hop target filtering | `pos => host.coordsAtPos(pos) !== null` |
| `historyReduced` | a false→true edge clears the undo ledger | `() => false` |
| `scrollCaret` | after jumps, search, hop and actions | `host.scrollTo({pos: head})` |
| `scrollLines` | `Ctrl-E/Y`, `zz`, `Ctrl-D/U/F/B` | `host.scrollTo({top: host.lineTop(max(1, viewport.fromLine + lines))})` |
| `typeText` | unmapped printable keys replayed from mappings | the current shim: replace the selection, `userEvent: 'input.type'` |
| `defaultKey` | `<CR>`, `<BS>` and `<Del>` replayed from mappings | the current shim: `insertNewlineAndIndent`, and grapheme-aware delete |

**Wrapping rule.** A host `typeText` or `defaultKey` that dispatches through the C1 host is observed through `noteUpdate` like any other external change. The host must forward the transaction's userEvent (`'input.type'` or `'delete'`) so the text is recorded for dot-repeat and macros (§12.5). The defaults keep dispatching through the shim, so self-dispatch tracking is unchanged.

**`platform` effect.** The current `isPassThrough` ignores the platform. The class-2 platform-shortcut cases (§12.8) define the expected behavior. If a reference case requires a platform-dependent pass-through, that branch is restored inside the pure `keys.ts`. Otherwise the hook is plumbed through and covered by a test showing that the value reaches `isPassThrough`. user-qa #7 records this.

**Purity.** No hook default touches DOM or timer globals outside `index.ts`. The `navigator` probe lives only in `index.ts`, so `test/vim/purity.test.ts` and its exemption list stay unchanged.

### 12.4 Full snapshot

```ts
export interface HintEntry { key: string; desc: string; group: boolean }
export interface HintView { prefix: string; entries: readonly HintEntry[]; summary: string }
export interface HopLabel { pos: number; text: string }
export interface HopView { labels: readonly HopLabel[]; revision: number }
export interface VimSnapshot extends VimState {        // VimState = {mode, pending, message, prompt: {kind, text} | null}
  label: string; recording: string | null; search: string | null;
  messageKind: 'info' | 'error' | null;
  cursorShape: 'bar' | 'block' | 'underline';
  displayCursor: number; displayCursorEnd: number;
  hints: HintView | null; hop: HopView | null;
}
```

**Values.** All values come from the engine snapshot as it is computed today (`refresh()`), with two exceptions:
- `hints` and `hop` are always present: `null`, never `undefined`.
- `prompt` is `{kind, text}`:
  - In `vim()`, `text` is the live `PromptLine` text, as in §5.2.
  - On the low-level controller, `text` is the engine's initial text, `''` or `'<,'>`. The host owns prompt editing and calls `submitPrompt(text)`.

**`cursorShape`.** The snapshot uses the engine's value, which is `underline` for operator-pending. The existing `Vim.cursorShape` getter and the cursor marks keep the §5.1 mapping, which is `block` for operator-pending, so current consumers are unchanged. This difference is listed under intentional divergences.

**Getters.**
- `vim().state` returns `VimSnapshot`. The return type is widened, so this is additive.
- `onChange(cb: (state: VimSnapshot) => void)`. Existing callbacks typed with `VimState` still type-check.
- The C1 facade gains `readonly snapshot: VimSnapshot`, and `subscribe(cb: (snapshot: VimSnapshot) => void)`. The existing zero-argument callers are unaffected.

**Firing rule (D21).** Both `onChange` and `subscribe` fire when the structurally compared full snapshot differs from the last delivered one. They never fire on subscription. They are coalesced:
- **During a call** to `handleKey`, `submitPrompt`, `cancelPrompt`, `setKeymap`, `noteUpdate`, `flushPendingInput` or `tapMode`, delivery is deferred to the end of the call, so there is at most one delivery per call.
- **Changes from timers** are delivered immediately. These are the hint delay, the mapping timeout and the external-change flush.

As a result, the existing `controller.test.ts` "notifies once for each public state change" case stays unmodified and passing. `onChange` now also fires on cursor moves (`displayCursor`) and on hint and hop changes.

**`VimState`** stays exported unchanged as the compatible subset.

### 12.5 Low-level path: exported `createVimController`

`emaki/vim` exports:
- the value `createVimController`
- the types `VimHost` (the C1 host in `host.ts`, unchanged: `state`, `dispatch`, `undo`, `redo`, `scrollTop`, `scrollTo`, `lineTop`, `lineAtHeight`, `viewport`, `coordsAtPos` and `marks`), `VimController`, `VimEngineOptions`, `VimSnapshot`, `VimHooks`, `VimActionHandler`, `VimActionContext`, `VimRenderOptions`, `VimPlatform`, `HintView`, `HintEntry`, `HopView` and `HopLabel`

**`VimEngineOptions` gains** `actions`, `hooks` and `render`. `keymap`, `preset`, `ex`, `clipboard` and `timer` are unchanged.

**The exported function is a wrapper in `index.ts`,** not the raw `controller.ts` function:
- When `options.timer` is absent, it injects `createScheduler()` from `adapter.ts`, so positive mapping delays fire (the DR-06 fix). It also wraps `dispose` to call `cancelAll()` first.
- When `hooks.platform` is absent, it applies the `navigator` platform default (§12.3).

The engine suites keep importing `controller.ts` directly, with their injected timers.

**Additive facade operations (DR-HOST-01, DR-HOST-02).**

- **`tapMode(): void`** is added to `VimController` and forwarded to the existing `ReferenceController.tapMode` (`controller.ts:190`), unchanged:
  1. It calls `flushPendingInput()`, so pending mapped keys resolve as on a timeout.
  2. In insert or replace mode, `exitSession(false)` ends the insert session. That closes the insert undo group, finishes the dot-repeat record, closes the macro token run and returns to normal.
  3. In any other mode, it executes the `insert` action exactly as `i` does. That opens a session and starts the dot record with `i`.

  The same operation is exposed on `Vim` as `tapMode()`, a no-op before `attach` and while a prompt is open. It is the operation a host's mode indicator or toggle control calls. It is not remappable and not a key sequence. It joins the §12.4 coalescing list.
- **`blur(): void`** (amendment round 1, IR-W3-2) is added to `VimController` and delegated through `wrapped()` to the existing engine `blur`, unchanged. It clears hop and pending input (operator-pending returns to normal) with one coalesced delivery. A host with its own surface calls it when the surface loses focus.
- **`noteUpdate` userEvent forwarding.** The parameter becomes `{state, changes, docChanged, selectionSet, userEvent?: string | null}`.
  - **`userEvent` property present,** including an explicit `null`: the value is forwarded verbatim to the engine's `onUpdate`, which drives `isTextEvent` session recording, dot-repeat and macro tokens, and the undo ledger's `undo`/`redo` classification. For example, `'input.format'` is not recorded, `'undo'` and `'redo'` reach `ledger.noteChange(true)`, and `null` is a non-text change.
  - **Property absent** (legacy callers that build the object without it): today's heuristic is kept. That heuristic is `docChanged && allowsTextInput() ? 'input.type' : null` (`controller.ts:937`).
  - **The `vim()` adapter's own bridge** (`index.ts:122`) already passes the core `EditorUpdate`, which carries `userEvent: string | null` (`src/core/editor-core.ts:13`). Under the new rule, that value is forwarded verbatim, with no core change. Core text input reports `input.type*`, `delete*` and `input.paste`, all of which `isTextEvent` accepts, so plain `vim()` typing, dot-repeat and macro recording are unchanged. The existing `editor-integration` suite and the Tauri smoke (V10/V11) must pass without assertion edits. If either regresses, the fix is to map the specific core event inside `index.ts`, never to drop forwarding.
  - Self-dispatched updates stay suppressed by the `dispatching` guard as today.

**The host's duties.** A host with its own surface:
- implements `VimHost`
- reports external document and selection changes with `controller.noteUpdate(...)`, forwarding each transaction's `Transaction.userEvent` annotation (or `null`) as `userEvent`
- renders `snapshot`, and edits the prompt and calls `submitPrompt` or `cancelPrompt`
- may pass a no-op `marks` with every renderer off

This is the equivalent of a host-built surface adapter feeding the engine.

### 12.6 Default renderers

**Today's marks.** `createVimController` draws three sets of marks:
- search matches (`emaki-vim-search`)
- hop labels (`emaki-vim-hop`)
- the which-key summary label at `displayCursor` (`emaki-vim-hints`)

`vim()` additionally draws the cursor (`emaki-vim`).

**`render` option.** `render?: { search?: boolean; hints?: boolean; hop?: boolean }`, on both `VimOptions` and `VimEngineOptions`. Each switch defaults to `true`. With a switch set to `false`, its mark owner is never acquired or set, and the data stays available in the snapshot for the host's own view.

**Overriding a renderer** means turning it off and rendering from the snapshot. There are no renderer callbacks. The cursor mark in `vim()` is not switchable; it belongs to the `vim()` editor integration.

### 12.7 Wiring in `vim()`

`vim(options)` passes `actions`, `hooks` (with the platform default filled in) and `render` to the engine on `attach`. It keeps the C1 host from `createVimHost(editor, pluginHost)`, so plain `vim()` and `vim({ex, clipboard, keymap, preset})` behave exactly as before, apart from the `onChange` firing rule. The Tauri example needs no change and must stay green (V11).

### 12.8 Tests (revision 5)

Each case runs against the public `src/vim/index` exports unless it says otherwise.

- **`test/vim/host-actions.test.ts`:**
  - `vim({keymap: {version: 1, leader: '<Space>', maps: {n: [{lhs: '<leader>e', action: 'app.explore'}]}}, actions: {'app.explore': spy}})` attached to `createEditor`. `Space`, `e` calls `spy` once with `{id: 'app.explore', mode: 'normal', cursor, state}`.
  - `emaki.diagnostic.next` returning `5` moves the cursor to the clamped `5`.
  - In visual mode, the same return extends the selection.
  - `null` gives `message === 'no diagnostics'` with `messageKind: 'info'`.
  - An unregistered `emaki.diagnostic.next` or `app.x` changes nothing and sets no message.
  - `:eval` calls `actions['emaki.evaluate']`.
  - Schema:
    - `app.x` compiles in `n`, `x` and `i`.
    - `app.x` in `o` and in `c` is an error.
    - `hop.nope` is `unknown action id`.
    - `nodot` is `unknown action id`.
- **`test/vim/host-hooks.test.ts`.** One `describe` per hook, each with a provided case and a default case:
  - `announce`: mode label, an error with `assertive: true`, and the hop prompt
  - `closePopupWithEscape`: `true` consumes, the default does not
  - `platform`: the provided value reaches the pass-through, and the default is `'other'` without `navigator`
  - `matchesDefaultKeymap` and `compositionActive`: `true` makes `handleKey` return `false`
  - `isVisible`: it filters hop targets
  - `historyReduced`: the false→true edge clears the ledger, so `u` does not undo across it
  - `scrollCaret` and `scrollLines`: called on `n`/`zz`/`Ctrl-E`; the defaults move `scrollTop`
  - `typeText` and `defaultKey`: called on mapped-rhs replay, and the defaults edit the document
- **`test/vim/snapshot.test.ts`:**
  - every field after `qa` (`recording: 'a'`), `/foo<CR>` (`search: '/foo'`), an E486 (`messageKind: 'error'`), `i` (`cursorShape: 'bar'`, `displayCursorEnd === displayCursor`) and `v` (`label: 'VISUAL'`)
  - `hints` filled after a which-key prefix with `hints.enabled` and the delay advanced on fake timers
  - `hop.labels` filled in hop mode, and `null` after the jump
  - the `onChange` payload deep-equals `state`
  - one delivery per `handleKey`
  - `render: {hints: false, hop: false, search: false}` leaves those mark owners unset while the snapshot data is still present
- **`test/vim/surface-host.test.ts`.** A custom `VimHost` over a plain `EditorState` with no `createEditor`, passing every hook, the actions and all renderers off, drives the exported `createVimController`. The test checks:
  - keys, a prompt opened and submitted by the host, and `noteUpdate` for an external edit
  - `snapshot`/`subscribe` payloads
  - that a mapping timeout fires with real (fake-timer) delays and no injected timer
  - that `dispose` leaves `vi.getTimerCount() === 0`
- **`test/vim/tap-mode.test.ts` (DR-HOST-01).** The public `tapMode` regressions, each driven through the exported `createVimController` and `vim().tapMode()`. The reference tapMode cases from the controller-io, undo-repeat and macro-marks suites map here and keep their names in neutral wording:
  - **controller-io:** `tapMode` from normal enters insert, from insert returns to normal, and flushes a pending mapped prefix first (with the `jj` map, `i`, `j`, `tapMode` gives document `j` and mode `normal`). One delivery happens per call.
  - **undo-repeat:** on `|abc`, `tapMode`, type `x` (forwarded `userEvent: 'input.type'`), `tapMode`, `.` gives `xxabc` in `normal`. A single `u` after the insert removes the whole insert group.
  - **macro-marks:** `qa`, `tapMode`, type `y`, `tapMode`, `q`, `@a` replays the insert and ends in `normal`.

  The existing engine case `undo-repeat.test.ts` "tapMode ends an insert redo record with normal mode" (a key-sequence substitute) stays unchanged. The public test adds the real operation; it does not replace that case.
- **`test/vim/note-update.test.ts` (DR-HOST-02).** A custom-host `noteUpdate` with:
  - `userEvent: 'input.type'` in insert: the edit is recorded and `.` repeats it.
  - `userEvent: 'input.format'` in insert (insert `Z` externally): after `Esc`, `.` does not replay `Z`.
  - `userEvent: 'undo'`/`'redo'`: classified as history, so the ledger state matches the engine-internal undo path. `u` after an external undo does not double-undo.
  - explicit `userEvent: null` while in insert: not recorded.
  - property omitted: the legacy heuristic, so an insert-mode change is recorded as typed, which is the existing behavior pinned for compatibility.
  - a `typeText` hook that dispatches via the host and forwards `'input.type'`: the text is recorded for dot-repeat.
- **Class-2 port.** The reference cases excluded in revision 3 as application actions, announce, popup escape, tapMode/hints/hop UI data, platform shortcuts and default-keymap pass-through are re-expressed in the four files above, keeping their case names in neutral wording. The commit message gets a table row per reference case: target file, ported or excluded, and the reason. An exclusion is allowed only when it asserts UI framework rendering, which stays out of scope (§2). No assertion is weakened.
- **`test/vim/public-api.test.ts`.** The value list becomes `KEYMAP_MAX_BYTES`, `KEYMAP_PRESETS`, `LocalKeymapStore`, `compileKeymap`, `createVimController` and `vim`.
- **Unchanged.** `test/boundary.test.ts`, `test/vim/purity.test.ts` (same exemption list), and all existing suites without assertion edits.
