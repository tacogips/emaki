# P06 `vim-p06-tauri-vim`: example vim toggle, mode indicator, ex mapping, guarded `:e {path}`, user keymap

- **Wave:** 3
- **dependsOn:** `vim-p03-adapter` (p04 and p05 are landed at f204032)
- **Design:** `design-docs/specs/design-vim.md` rev 4:
  - §7: Wiring, UI, Persistence, Toggle, Shortcuts, Ex mapping, `openNamed` (DR-01), smoke steps 2–5 and 7
  - §7.1: the user keymap and its smoke steps 1–5
  - §9 D5/D7/D11
- **Contracts:** overview C2 rev 4 (consumer), C4 (consumer), C5 (p06 part), C6 rev 4 (owner), C7 (consumer)
- **writePaths:**
  - `examples/tauri-editor/index.html`
  - `examples/tauri-editor/style.css`
  - `examples/tauri-editor/vite.config.ts`
  - `examples/tauri-editor/tsconfig.json`
  - `examples/tauri-editor/src/main.ts`
  - `examples/tauri-editor/src/mock-ipc.ts`
  - `examples/tauri-editor/scripts/smoke.mjs`
  - `examples/tauri-editor/dist` (artifact)
  - `tmp/vim-20261111/vim-p06-tauri-vim` (artifact)
  - `impl-plans/progress/vim-p06-tauri-vim.md`
- **sharedPaths:** none. p06 is the only plan in its wave that writes under `examples/`.

## Intent

Let users enable vim in the Tauri example from the status bar, and see the mode and the open prompt. The plan covers:
- Map `:w`, `:w path`, `:saveas path`, `:wq`, `:x`, `:q`, `:q!`, `:e` and `:e path` to app actions, without ever losing unsaved edits.
- Keep `Cmd/Ctrl+N/O/S/Shift+S` working in every mode.
- Load a user keymap JSON through a status-bar button and the native dialog. The keymap is persisted, applied live, and its issues are shown.

## Repository context

- **`examples/tauri-editor/src/main.ts`** (p04 state; keep every behavior):
  - `mount(text, id, sel?, keepDirty, live)` with the `token` race guard and the `clean` baseline
  - `guard`, `openPath` (reads before replacing), `newFile`, `openFile`, `save(as)`
  - the window capture `keydown` listener with inline `busy` handling (lines 72-79)
  - the mock-only hooks behind `import.meta.env.MODE === 'mock'`
- **`src/mock-ipc.ts`:**
  - `calls` records every command name, including `plugin:window|destroy`
  - `nextOpen` is the `pick_open_path` result, and `files` is the read source
  - `confirm_open_path` is **not mocked yet**
- **Rust (no edits).** `confirm_open_path`, `pick_open_path` and `read_text_file` already exist in `src-tauri/src/lib.rs`.
- **Wiring to imitate:** the alias pattern in `vite.config.ts` (`{ find: /^emaki\/languages$/, … }`) and the `tsconfig.json` `paths`.
- **Smoke patterns:** `scripts/smoke.mjs` uses `check(name, ok, detail)`, the `state()` helper, and `browser.newPage()` + `addInitScript` seeding (lines 80-96).

## Non-goals

- No edits to `src/**` (the library), `src-tauri/**` or Rust. A defect is recorded as a blocker.
- No config-dir keymap (D11 / user-qa #5) and no keymap editor UI.
- No runtime hook swap (toggling remounts) and no undo preservation across a toggle.
- No README (p10 owns it).

## Changes

### Wiring

- **`vite.config.ts`:** add the alias `{ find: /^emaki\/vim$/, replacement: repoRoot + 'src/vim/index.ts' }`.
- **`tsconfig.json`:** add `"emaki/vim": ["../../src/vim/index.ts"]` to `paths`.

### UI

**`index.html` footer**, with no inline style or script (CSP):
- `<label id="vim-label"><input type="checkbox" id="vim"> vim</label>`
- `<span id="vim-mode" hidden></span>`
- `<button id="vim-keymap" type="button" hidden>keymap…</button>`
- `<button id="vim-keymap-clear" type="button" hidden>reset keymap</button>`

**`style.css`:** minimal rules, imitating the existing footer rules.

### `main.ts`

**Imports.** `vim`, `compileKeymap`, `LocalKeymapStore` and the types `Vim` and `KeymapIssue` from `emaki/vim`.

**State.** Add:
- `vimOn` (read at startup with `try { localStorage.getItem('emaki-tauri-editor.vim') === '1' } catch { false }`)
- `currentVim: Vim | undefined`
- `detachVim: (() => void) | undefined`
- `userKeymap: string | null`
- `keymapStore = new LocalKeymapStore({ key: 'emaki-tauri-editor.vim.keymap' })`

`userKeymap = await keymapStore.load()` runs **before** the initial `mount`.

**Busy helper.** `run(action: () => Promise<unknown>)`:
- if `busy`, return
- otherwise set `busy = true`, run the action with `.catch(err => status.textContent = String(err))`, and clear `busy` in `.finally`

Refactor the keydown listener to use it. Its behavior (`preventDefault`, `stopPropagation`, capture phase) must stay identical.

**`mount`.** Right before `handle?.destroy()`, call `detachVim?.()`. Then:
1. Create `currentVim = vimOn ? vim({ ex, keymap: userKeymap ?? undefined }) : undefined`.
2. Pass `modalKeys: currentVim` to `createEditor`.
3. After creating the editor, set `detachVim = currentVim?.attach(handle, host)`, subscribe `currentVim?.onChange(renderMode)`, and call `renderMode()`.
4. If `currentVim?.keymapIssues.length`, run `showIssues(currentVim.keymapIssues)`.

Create a fresh `vim()` per mount and never reuse an instance.

**Toggle (`#vim` `change`).**
1. Set `vimOn`.
2. `try { setItem('emaki-tauri-editor.vim', vimOn ? '1' : '0') } catch {}`.
3. Live remount: `mount(handle.state.doc.toString(), langId, handle.state.selection.main, dirty, true)`. This keeps `dirty` and `clean`.

**`renderMode()`.**
- The `#vim-mode`, `#vim-keymap` and `#vim-keymap-clear` elements get `.hidden = !vimOn`.
- While a prompt is open, the text is `prompt.kind + prompt.text`. Otherwise use the mode map:

  | mode | label |
  |---|---|
  | `normal`, `operator-pending` | `NORMAL` |
  | `insert` | `INSERT` |
  | `visual` | `VISUAL` |
  | `visual-line` | `VISUAL LINE` |
  | `visual-block` | `VISUAL BLOCK` |
  | `replace` | `REPLACE` |

- If `state.message` is set, write it to `#status-msg`.
- Use `textContent` only.

**`ex(cmd)`.** Returns `true` synchronously for the names below, and `false` for anything else.

| command | action |
|---|---|
| `w` / `write`, no args, no bang | `run(() => save())` |
| `w` / `write` / `saveas` / `sav` with args | `run(() => save(true, basename(args)))` |
| `wq` / `x` | `run(async () => { await save(); if (!dirty) await getCurrentWindow().destroy(); })` |
| `q` / `quit`, `bang: false` | `run(async () => { if (await guard()) await getCurrentWindow().destroy(); })` |
| `q` / `quit`, `bang: true` (`:q!`, via the p08 fix) | `run(() => getCurrentWindow().destroy())` |
| `e` / `edit`, no args | `run(() => openFile())` |
| `e` / `edit` with args | `run(() => openNamed(args))` |

To support the suggested name, extend `save(as = false, suggested?: string)`. The default stays the current basename or `untitled.txt`.

**`openNamed(path)`** (DR-01). The order is exact:
1. `if (!(await guard())) return`
2. `const p = await invoke<string | null>('confirm_open_path', { path }); if (!p) return`
3. `await openPath(p)`

**Keymap load (`#vim-keymap` click)** runs through `run(async () => …)`. It does **not** call `guard()`.
1. `p = await invoke<string | null>('pick_open_path')`. If `!p`, return.
2. `text = await invoke<string>('read_text_file', { path: p })`.
3. `r = compileKeymap(text)`.
4. If `!r.keymap`, `showIssues(r.issues)` and return, leaving the store, `userKeymap` and the live vim untouched.
5. Otherwise:
   1. `s = await keymapStore.save(text)`
   2. `userKeymap = text`
   3. `currentVim?.setKeymap(text)`
   4. the status `Keymap loaded`, plus any warnings in the issues format, plus `(not persisted: <reason>)` when `!s.ok`

**Keymap clear (`#vim-keymap-clear`).** `run(async () => { await keymapStore.clear(); userKeymap = null; currentVim?.setKeymap(null); status 'Keymap reset'; })`.

**`showIssues(issues)`.** The text is `keymap: <e> error(s), <w> warning(s): <path>: <message>; …`, with at most 3 issues and then `…`.

### `mock-ipc.ts`

- Add `confirmOpen: true` to the mock object and its `Window` typing.
- `if (cmd === 'confirm_open_path') return mock.confirmOpen ? data.path : null;`
- Keep the p04 seed, `dispatchIdentity` and `dirtyAtFocus`.

### `smoke.mjs`

Append new pages; keep every existing check and the p04 launch page unchanged.
- Each new page clears `localStorage` in `addInitScript` **only on its first load**. Use a `sessionStorage` flag, so that the reload-persistence checks work.
- Read the text with `__tauriEditorMock.text()`, send keys with `page.keyboard`, and read `#vim-mode` with `textContent`.

**Vim page.** Seed `files` with:
- `/mock/v.txt` = `ab\n`
- `/mock/other.txt` = `other\n`
- `/mock/keymap.json` = `{"version":1,"maps":{"i":[{"lhs":"jj","rhs":"<Esc>"}]}}`
- `/mock/bad.json` = `{"version":2}`

Then open `/mock/v.txt` (`nextOpen` + `Mod+O`). Check names are given in quotes.

1. **`vim basics`.**
   1. Click `#vim` → `NORMAL`.
   2. `i` → `INSERT`. Type `hi`, then `Escape` → `NORMAL`, and the title has `•`.
   3. `:w`: `#vim-mode` reads `:w` before Enter. Enter → `files['/mock/v.txt']` contains `hi`, the title is clean, and `calls` has `write_text_file`.
   4. `x` then `ControlOrMeta+s` → saved and the title is clean.
   5. `/hi` Enter, then `/zz` Escape → the text is unchanged and the mode is `NORMAL`.
2. **`vim prompt shortcut and paste`.**
   1. Make the document dirty (`i`, `z`, `Escape`), then `/ab`, then `ControlOrMeta+s` → `write_text_file` is called again, the title is clean, and `#vim-mode` reads `/ab`.
   2. Dispatch a `ClipboardEvent('paste')` with `DataTransfer` `text/plain` `ZZ` on `#editor textarea` → the text is unchanged and the mode reads `/abZZ`.
   3. `Escape` → the text is unchanged.
3. **`vim :q guard`.** Dirty, `discard = false`, `:q` Enter → `calls` gains `confirm_discard`; the text and title are unchanged.
4. **`vim :q! skips guard`.** Dirty, `discard = false`, `:q!` Enter → the new `calls` include `plugin:window|destroy` and **not** `confirm_discard`.
5. **`vim :e declined discard`**, **`vim :e declined path`**, **`vim :e success`.** These follow design §7 smoke step 4 exactly:
   - declined discard → no `confirm_open_path`, and text, title and `#pos` unchanged
   - declined path → `confirm_open_path` called, no new `read_text_file`, and everything unchanged
   - success → title `other.txt — emaki`, `#lang` `plaintext`, text `other\n`
6. **`vim persistence`.** `page.reload()` → `#vim` is checked and `#vim-mode` is visible.

**Keymap page** (vim on via `#vim`, storage initially clear):

7. **`keymap load`.** `nextOpen = '/mock/keymap.json'`, click `#vim-keymap` → `#status-msg` contains `Keymap loaded`; `localStorage['emaki-tauri-editor.vim.keymap']` equals the file text; then `i`, `keyboard.type('jj')` → `NORMAL`, and the text does not contain `jj`.
8. **`keymap persisted`.** Reload → `i`, `jj` → `NORMAL`, with no new `pick_open_path` in `calls`.
9. **`keymap invalid`.** `nextOpen = '/mock/bad.json'`, click → status contains `version must be the integer 1`; the stored value is unchanged; `i`, `jj` → `NORMAL`.
10. **`keymap reset`.** Click `#vim-keymap-clear` → the key is absent; `i`, `jj` → `INSERT`, and the text contains `jj`.
11. **`keymap cancelled pick`.** `nextOpen = null`, click → storage and `#status-msg` are unchanged, and there is no new `read_text_file`.
12. **`vim off`.** Uncheck `#vim` → `#vim-mode`, `#vim-keymap` and `#vim-keymap-clear` are hidden, and `localStorage['emaki-tauri-editor.vim'] === '0'`.

## Pitfalls

- The window capture shortcut listener must stay first. Do not move it into vim's `ex`.
- A toggle uses the live remount, not `openPath`, so `dirty` and `clean` survive.
- Call `detachVim` before `destroy`. Otherwise the vim timers or listeners outlive the editor.
- Never put prompt characters in the title. Use no `innerHTML` and no inline styles.
- Mock-only code stays behind `MODE === 'mock'`. `dist` must not contain `mockIPC` or `dispatchIdentity`.
- The `jj` smoke relies on the 1000 ms default `timeoutlen` and the p03 real scheduler. Use `keyboard.type('jj')` with no delay.
- The keymap load must not call `guard()` and must not replace the document.

## Verification

Run from `examples/tauri-editor`. Write each log to `../../tmp/vim-20261111/vim-p06-tauri-vim/`.

| command | log | must show |
|---|---|---|
| `npm run check` | `check.log` | exit 0 |
| `npm run build` | `build.log` | exit 0 |
| `rg -n 'mockIPC\|dispatchIdentity' dist` | `dist-grep.log` | no matches (rg exit 1) |
| `npm run smoke` | `smoke.log` | exit 0; the JSON has every old check, every p04 check and checks 1–12 above `ok` |
| `git diff --name-only f204032 -- src-tauri` | `rust-diff.log` | empty |

## Done criteria

- All five verification rows meet their expectation.
- The progress log maps each design §7 / §7.1 smoke step to its check name, and records the exit codes, log paths and per-edit hashes.

## Implementation status

Implemented the p06 scope; required example gates passed on the shared tree. See `impl-plans/progress/vim-p06-tauri-vim.md` for evidence and smoke mapping. Formal reviews and serial integration remain downstream.
