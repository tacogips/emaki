# P01 `vim-p01-engine`: port the vim engine and its tests

- **Wave:** 1
- **dependsOn:** none
- **Design:** `design-vim.md` §3, §4 (`VimHost`), §5.1, §5.2 (controller side only), §5.3, §5.4, §6 (the reference suites)
- **Contracts:** overview C1 (owner), C3

**writePaths:**
- Source:
  - `src/vim/host.ts`
  - `src/vim/actions.ts`
  - `src/vim/controller.ts`
  - `src/vim/ex.ts`
  - `src/vim/execute.ts`
  - `src/vim/extended.ts`
  - `src/vim/hints.ts`
  - `src/vim/hop.ts`
  - `src/vim/keymap-runtime.ts`
  - `src/vim/keymap-schema.ts`
  - `src/vim/keys.ts`
  - `src/vim/mapper.ts`
  - `src/vim/marks.ts`
  - `src/vim/motions.ts`
  - `src/vim/notation.ts`
  - `src/vim/operators.ts`
  - `src/vim/parser.ts`
  - `src/vim/record.ts`
  - `src/vim/registers.ts`
  - `src/vim/search.ts`
  - `src/vim/session.ts`
  - `src/vim/surround.ts`
  - `src/vim/textobjects.ts`
  - `src/vim/types.ts`
  - `src/vim/undo.ts`
  - `src/vim/words.ts`
  - `src/vim/presets`
- Test fixture: `test/support/vim-host.ts`
- Test suites (`test/vim/`):
  - `actions.test.ts`
  - `controller.test.ts`
  - `controller-io.test.ts`
  - `extended.test.ts`
  - `extended-controller.test.ts`
  - `hints.test.ts`
  - `hop.test.ts`
  - `host-keymap.test.ts`
  - `keymap-controller.test.ts`
  - `keymap-parity.test.ts`
  - `keymap-schema.test.ts`
  - `keys.test.ts`
  - `keys-extended.test.ts`
  - `macro-marks.test.ts`
  - `mapper.test.ts`
  - `marks.test.ts`
  - `motions.test.ts`
  - `notation.test.ts`
  - `operators.test.ts`
  - `parser.test.ts`
  - `parser-extended.test.ts`
  - `presets.test.ts`
  - `purity.test.ts`
  - `record.test.ts`
  - `registers.test.ts`
  - `search-ex.test.ts`
  - `surround.test.ts`
  - `textobjects.test.ts`
  - `undo.test.ts`
  - `undo-repeat.test.ts`
  - `words.test.ts`
  - `clipboard.test.ts`
  - `settings.test.ts`
  - `keymap-store.test.ts`
- Evidence (artifact): `tmp/vim-20261111/vim-p01-engine`
- Progress log: `impl-plans/progress/vim-p01-engine.md`

**sharedPaths:** none

## Intent

Port the reference vim engine (about 4.2k lines) into `src/vim/` as framework-independent TypeScript, and port its tests to `test/vim/`. The engine reaches the editor **only** through the `VimHost` interface (C1). It is exposed as `createVimController(host, options)`, and the p03 adapter wires it to emaki.

## Non-goals

These files belong to other plans or are out of scope:
- `src/vim/index.ts`, `adapter.ts`, `cursor.ts` and `prompt.ts`, and `test/vim/editor-integration.test.ts`, which belong to p03.
- Any core file (`src/*.ts`, `src/input`, `src/render`, …), `package.json`, `scripts/` and `test/boundary.test.ts`.
- Prompt line editing (appending characters, Backspace). That belongs to p03. The controller only opens, submits and cancels prompts.
- Persistence, settings stores, UI components and transport from the reference.
- `isFileBoundary` semantics.
- New features.

## Changes

1. **Read the reference first (read-only).** Read every file in `vactr/editor/src/code/vim/**`, `editor/src/code/surface.ts` (to see what surface members the engine uses), and the 31 suites plus the three `vim-*` suites. Record in the progress log:
   - the module list
   - every surface member the engine uses, with its `VimHost` mapping
   - each test file's case count
2. **`src/vim/host.ts`.** Declare exactly the C1 types, using `import type` only from `@codemirror/state`, `../types` (`ModalKeyInput`, `Range`, `Rect`, `Mark`, `PluginViewport`) and nothing else. It must contain no value code.
3. **Port the modules** to the same file names. Rules:
   - Replace every reference-surface call with a `VimHost` member.
   - Members with no equivalent are implemented inside `src/vim`. For insertion, `<BS>`, `<CR>`, `o` and `O`, use `host.dispatch` with `userEvent: 'input.type'` or `'delete'`, and `@codemirror/commands` state commands such as `deleteCharBackward` and `insertNewlineAndIndent` against `{ state: host.state, dispatch: host.dispatch }`.
   - Otherwise drop the member, and list the drop in the progress log.
   - Remove the `isFileBoundary` import (reference `controller.ts:2`). Every caller behaves as if it returned `false`.
   - Overlays become marks:
     - search highlights use `host.marks('emaki-vim-search')`
     - hop labels use `host.marks('emaki-vim-hop')` with `style.label` and an empty range plus `minWidth`, or a one-character range
     - hints use `host.marks('emaki-vim-hints')`, **only if** they can be expressed this way. Otherwise delete `src/vim/hints.ts` and its suite, and record that.
   - Strip settings and keymap-store persistence. `keymap`/`preset` are plain data options.
   - The clipboard registers `+`/`*` use `options.clipboard` when present, and otherwise the internal register.
4. **`src/vim/controller.ts` exports `createVimController`,** which meets C1:
   - **State.** `mode`, `pending` and `message`, plus `subscribe`, which notifies once per change of mode, pending, message or prompt.
   - **Prompt.** `:`, `/` and `?` in normal or visual mode set `prompt = {kind, initial}`, where `initial` is `'<,'>` for `:` from visual and `''` otherwise.
   - **`submitPrompt(text)`.** For `:`, run the ported ex dispatcher: built-ins first, then `options.ex(command)`; if neither handles it, set `message = 'E492: Not an editor command: <line>'`. For `/` and `?`, run a forward or backward search, set the last-search state used by `n`/`N`, and on no match set `message = 'E486: Pattern not found: <pattern>'`. Then set `prompt = null`.
   - **`cancelPrompt()`.** Sets `prompt = null` without changing the document or the selection.
   - **`message`** is cleared by the next key that starts a command.
   - **`handleKey`** returns `false` for any input with `metaKey` (design §4 key rule).
   - **`noteUpdate`** may be a no-op if the engine does not need it.
5. **Extra reference files.** If the reference has a module that is not listed in writePaths, merge its contents into the closest owned file. Never create unlisted files. Record the merge.
6. **`test/support/vim-host.ts`.** A pure `VimHost` fake over `EditorState`, with no DOM:
   - `dispatch` applies `state.update(spec)`.
   - Undo and redo use `@codemirror/commands` history (`history()` in the state extensions).
   - Scroll and viewport are numeric fields the tests can set.
   - `marks(owner)` records the latest set per owner, for assertions.
7. **Port the tests.** Each reference suite goes to the same-named `test/vim/<name>.test.ts`. The `vim-clipboard`, `vim-settings` and `vim-keymap-store` suites go to `clipboard.test.ts`, `settings.test.ts` and `keymap-store.test.ts` respectively.
   - Keep case names and assertions. Only fixtures and representation change, for example overlay DOM becoming mark ranges.
   - Allowed exclusions are only these: (1) `isFileBoundary`, (2) reference UI, persistence, store or transport, (3) the whole hints suite if hints is stripped.
   - `host-keymap` assertions are re-expressed against emaki's precedence: highest keymaps, then the hook, then default.
   - The UI tests `test/ui/vim-status` and `vim-toggle` are not ported.

## Pitfalls

- **Forbidden strings.** No `vactr`, `/editor/` or `solid-js` text anywhere in `src/` or `test/`, including comments and test names. Check with `rg -n 'vactr|/editor/|solid-js' src/vim test/vim test/support/vim-host.ts`, which must return nothing (exit 1).
- **Imports.** Only `@codemirror/state`, `@codemirror/commands` and relative `src/vim` imports, plus `import type` from `../types`. Never import a value from core modules (`../editor`, `../input/*`, …), because that would duplicate core in the `./vim` bundle.
- **No DOM.** Do not use `window`, `document` or `HTMLElement` values in the engine. The `purity` suite enforces this.
- **Code style.** Keep emaki's terse style. Imitate `src/language/json.ts` and `src/diff/myers.ts` for module shape.
- **Do not weaken assertions.** If a ported case fails because of an emaki representation difference, adapt only the expected representation and note it.

## Tests (`situation -> expected`)

- All portable reference cases → pass under `npx vitest run test/vim`.
- `:foo` submitted → `message` starts with `E492`, and the document is unchanged.
- `/zz` with no match → `E486`.
- `cancelPrompt` after `/pat` → the selection and the document are the same objects as before.
- Meta-modified key → `handleKey` returns `false`.

## Verification

Write each log to `tmp/vim-20261111/vim-p01-engine/`.

| command | log | must show |
|---|---|---|
| `npx vitest run test/vim` | `vitest.log` | exit 0 and 0 failed |
| `npx tsc --noEmit` | `tsc.log` | no errors in owned paths. Errors only in sibling plans' in-progress files are recorded, not fixed |
| `npx vitest run test/boundary.test.ts` | `boundary.log` | exit 0, or failures only from sibling in-progress files |
| `rg -n 'vactr\|/editor/\|solid-js' src/vim test/vim test/support/vim-host.ts` | `forbidden.log` | no matches |

## Done criteria

- Every owned file exists, except `hints.ts`/`hints.test.ts` if hints is stripped, which must be recorded.
- `createVimController` and the C1 types are exported.
- `npx vitest run test/vim` exits 0.
- The progress log contains:
  - the module list
  - the surface-member mapping table
  - a **per-suite table**: reference file → target file, reference case count, ported count, and each excluded case with its exclusion class (1–3)
  - the hints keep/strip decision
  - the logs above with their exit codes

## Implementation checkpoint

Incomplete: see `impl-plans/progress/vim-p01-engine.md` for current files, failing purity gate, and outstanding controller and test work. Done criteria above remain open.
