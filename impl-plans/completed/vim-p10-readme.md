# P10 `vim-p10-readme`: README for `emaki/vim`, keymap customization, Tauri vim/keymap

- **Wave:** 3 (parallel with p06)
- **dependsOn:** `vim-p03-adapter`
- **Design:** `design-docs/specs/design-vim.md` rev 4 §8, plus §5.1, §5.5, §7, §7.1 and §11 for content
- **writePaths:**
  - `README.md`
  - `tmp/vim-20261111/vim-p10-readme` (artifact)
  - `impl-plans/progress/vim-p10-readme.md`
- **sharedPaths:** none

## Intent

Document the shipped API and the Tauri example features. The README must match:
- the exports in `src/vim/index.ts` (p03)
- the behavior specified in design §7/§7.1, which p06 implements in parallel

Use the design's names and keys exactly.

## Non-goals

- No code edits.
- No root-cause or V7 text. p07 appends the dirty-on-launch observation status after the gates run.
- No changelog and no restructuring of the existing README sections.

## Changes: `README.md`

Keep the existing heading style. Insert a `## emaki/vim` section after the language sections. It covers:

1. **Usage.** `import { vim } from 'emaki/vim'`, then `createEditor(host, { modalKeys: v })`, then `const detach = v.attach(editor, host)`. Call `detach()` before `editor.destroy()`.
2. **API.**
   - `state` (`mode`, `pending`, `prompt`, `message`), `onChange` and `cursorShape`
   - the `ex` callback (`{name, args, bang, line}`; return `true` when handled), and that `emaki/vim` has no file semantics
   - the `clipboard` option
3. **Features.** Modes, motions, operators, text objects, registers, counts, dot repeat, undo/redo, search, marks, ex built-ins (`:s`, `:noh`, `:{n}`), hop, and hints if kept (check `impl-plans/progress/vim-p01-engine.md`).
4. **Keymap customization.**
   - the JSON outline (`version: 1`, `leader`, `timeoutlen`, `maps.{n,i,x,v,o,c}` with `lhs`/`rhs`/`action`/`remap`/`desc`, `hints`, `hop`)
   - a `jj`→`<Esc>` example and a `<leader>` example
   - `vim({ keymap })`, `vim({ preset: 'default' | 'mise-darwin' })` and `KEYMAP_PRESETS`
   - `v.setKeymap(textOrObjectOrNull)` → `{applied, issues}`: a failed compile keeps the previous keymap, and `null` resets to the base bindings
   - `v.keymapIssues`
   - `compileKeymap(text)` → `{keymap, issues}`, and the `KEYMAP_MAX_BYTES` limit
   - a mapped prefix resolves after `timeoutlen`
5. **Persistence.**
   - the `KeymapStore` interface and `new LocalKeymapStore({ key?, storage? })`
   - the default key `emaki.vim.keymap`
   - that `save` returns `{ok:false, reason:'too-large'|'unavailable'}`, `load` returns `null` on any failure, and the store never rejects
   - that `vim()` never reads storage by itself; include a short load→`vim({keymap})` snippet
6. **Notes.**
   - Opt-in, with zero core-bundle impact (the core bytes are unchanged).
   - Known limitation: emaki's bar caret stays visible at the left edge of the mark-based block cursor.

In the existing Tauri example section, add:
- the vim checkbox and its `localStorage` key `emaki-tauri-editor.vim`, and the `#vim-mode` indicator
- the ex mapping table: `:w`, `:w path`/`:saveas path`, `:wq`/`:x`, `:q` (guarded), `:q!`, `:e`, and `:e path` (guard, then native "Open {path}?" confirmation, then open)
- that `Cmd/Ctrl+N/O/S` work in every mode
- the "keymap…" button: a native dialog, validated, persisted in `emaki-tauri-editor.vim.keymap`, applied live, issues shown in the status bar
- the "reset keymap" button
- the note that a picked keymap file is granted like any opened file

## Verification

Run from the repository root. Write each log to `tmp/vim-20261111/vim-p10-readme/`.

| command | log | must show |
|---|---|---|
| `rg -n '^## emaki/vim\|setKeymap\|LocalKeymapStore\|keymapIssues\|emaki-tauri-editor.vim.keymap\|:q!' README.md` | `readme-grep.log` | every term matches at least once |
| `rg -c 'LocalKeymapStore\|compileKeymap\|KEYMAP_PRESETS\|KEYMAP_MAX_BYTES\|setKeymap' src/vim/index.ts` | `api-names.log` | count ≥ 5 (the documented names exist in the shipped entry) |
| `git diff --stat -- README.md` | `readme-diff.log` | `README.md` changed. `edits.log` shows that this plan wrote only `README.md` and its progress log |

## Done criteria

- The README sections exist with the content above.
- The grep rows pass.
- The progress log records the commands, exit codes, log paths and per-edit hashes.
