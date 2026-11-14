# P02 `tauri-editor-p02-frontend`: subproject package, Vite/TS config, app and mock IPC

- **Wave:** 1
- **dependsOn:** none
- **Design:** §4, §7 (including the TAURI-DESIGN-001 save rules), §8 mock, §10, §11 (decisions 2, 3, 5)
- **Contracts:** overview C1, C3, C4, C5, C6
- **writePaths:**
  - `examples/tauri-editor/package.json`
  - `examples/tauri-editor/package-lock.json`
  - `examples/tauri-editor/tsconfig.json`
  - `examples/tauri-editor/vite.config.ts`
  - `examples/tauri-editor/index.html`
  - `examples/tauri-editor/style.css`
  - `examples/tauri-editor/src/main.ts`
  - `examples/tauri-editor/src/env.d.ts`
  - `examples/tauri-editor/src/mock-ipc.ts`
  - `examples/tauri-editor/node_modules` (artifact)
  - `examples/tauri-editor/dist` (artifact)
  - `tmp/tauri-editor-20261110/tauri-editor-p02-frontend` (artifact)
  - `impl-plans/progress/tauri-editor-p02-frontend.md`
- **sharedPaths:** none

## Intent

Build the webview app: an emaki editor that fills the window, with a status bar (message, language select, Ln/Col), New/Open/Save/Save As shortcuts, the CLI-path open, a dirty title, discard confirmation, lazy language detection with a plaintext fallback and `defaultTokenColors`. It also includes a mock IPC used only in `mode: 'mock'`, for P04's browser smoke test.

## Non-goals

- Do not write `scripts/smoke.mjs` (P04), anything under `src-tauri` (P01), or root files (P03).
- Do not edit emaki `src/`.
- No frameworks and no `@tauri-apps/plugin-dialog` npm package: dialogs are Rust-side.
- No `@codemirror/*` dependency in this package. emaki source resolves them from the root `node_modules`.
- No CSS imported from TypeScript, no inline `<style>` or `<script>`, no undo history kept across remounts, and no CRLF preservation.

## Changes

### `package.json` and `package-lock.json`

`"name": "emaki-tauri-editor"`, `"private": true`, `"type": "module"`, and the C3 scripts. Install exact versions with these two commands, run from `examples/tauri-editor` only:

- `npm install --save-exact @tauri-apps/api@^2`
- `npm install --save-exact -D @tauri-apps/cli@^2 typescript@7.0.2 vite@8.3.1 playwright@1.62.1`

Record the resolved `@tauri-apps/api` version in the progress log (C6). Before starting, verify that `../../node_modules/@codemirror/state` exists. If it does not, record a blocker and do not run the root install.

### `vite.config.ts`

Imitate the root `vite.config.ts` style, using `new URL(..., import.meta.url).pathname` and no `node:` imports, since `types: []`.

- `base: './'`
- `clearScreen: false`
- `server: { port: 1420, strictPort: true, fs: { allow: [repoRoot] } }`, where `repoRoot = new URL('../..', import.meta.url).pathname`
- `resolve.alias`: `[{ find: /^emaki$/, replacement: repoRoot + 'src/index.ts' }, { find: /^emaki\/languages$/, replacement: repoRoot + 'src/language/registry.ts' }]`
- `build: { target: 'es2022', outDir: 'dist', emptyOutDir: true }`

### `tsconfig.json`

Copy the root `compilerOptions` (strict, bundler resolution, ES2022, DOM and DOM.Iterable, `types: []`, `isolatedModules`, `skipLibCheck`, `noEmit`) and add:

- `"paths": { "emaki": ["../../src/index.ts"], "emaki/languages": ["../../src/language/registry.ts"] }`
- `include: ["src", "vite.config.ts"]`

### `src/env.d.ts`

`/// <reference types="vite/client" />`. Imitate `examples/languages/env.d.ts`.

### `index.html`

- `<link rel="stylesheet" href="./style.css">`.
- Body: a full-height column with `<div id="editor">` and a status bar `<footer>` containing `<span id="status-msg">`, `<select id="lang" aria-label="Language">` and `<span id="pos">`.
- `<script type="module" src="./src/main.ts">`.
- Nothing inline.

### `style.css`

`html,body{margin:0;height:100%}` and a flex column, with `#editor{flex:1;min-height:0}` and a compact status bar. Nothing else.

### `src/main.ts`

Terse, in emaki style; imitate `examples/languages/main.ts`. Imports:

- `createEditor` and `EditorHandle` from `'emaki'`
- `languages`, `resolveLanguage`, `loadLanguage` and `defaultTokenColors` from `'emaki/languages'`
- `invoke` from `'@tauri-apps/api/core'`
- `getCurrentWindow` from `'@tauri-apps/api/window'`

Behavior follows design §7 exactly:

1. **Mock first.** The first statement is `if (import.meta.env.MODE === 'mock') await (await import('./mock-ipc')).install();`. It runs before any `invoke`.
2. **Language select.** Fill `#lang` with every entry of `languages`, in registry order.
3. **State.** `docId`, `rev`, `path`, `dirty`, `langId`, `handle`, `busy` and a mount token.
4. **`mount(text, langId, sel?, keepDirty?)`.**
   - Increment the token.
   - `await loadLanguage(langId)`. If it fails, show the error in `#status-msg` and use `plaintext`.
   - If the token is stale, return.
   - Otherwise destroy the old handle, `createEditor(host, { doc: text, language, theme: { tokens: defaultTokenColors } })`, restore the clamped selection, and subscribe `onUpdate`: `docChanged` → `rev++`, `dirty = true`, title; `docChanged || selectionSet` → `#pos`.
   - Set `#lang.value`, then focus.
   - In mock mode, set `window.__tauriEditorMock.text = () => handle.state.doc.toString()`.
5. **Detection.** `detect(p)` = `resolveLanguage({ filename: basename(p) })?.id ?? 'plaintext'`. `basename` splits on `/` and `\`.
6. **Title.** `title()` builds the C4 title, then calls `document.title = t` and `void getCurrentWindow().setTitle(t)`.
7. **Actions.**
   - New, Open and Launch increment `docId`.
   - Open: if dirty, guard first, then `pick_open_path` → `read_text_file` → mount the detected language with `dirty = false`. Cancel is a no-op. A read error leaves the document unchanged and shows the message.
   - Save and Save As take a snapshot and apply the conditional completion rules of design §7 (see Pitfalls).
   - Save As cancel changes nothing.
   - Save As success with a matching `docId` adopts the path. If detection changes the language, it remounts with the **current** text, selection and dirty flag.
   - Error: change nothing and show the error string.
8. **Guard and close.** `guard()` is `dirty ? await invoke<boolean>('confirm_discard') : true`. Register `getCurrentWindow().onCloseRequested(async e => { if (dirty && !(await guard())) e.preventDefault(); })`.
9. **Shortcuts.** Use `window.addEventListener('keydown', fn, true)`, in the capture phase.
   - `mod = /Mac|iPhone|iPad/.test(navigator.userAgent) ? e.metaKey : e.ctrlKey`.
   - Match `e.key.toLowerCase()` in `n`, `o` and `s`, with `shiftKey` selecting Save As.
   - Matched keys call `preventDefault()` and `stopPropagation()`. Then, if `busy`, return; otherwise set `busy`, run the action, and clear `busy` in `finally`.
10. **Launch.** `initial_path`. If it returns a path, read the file. On a read error, show the message and start untitled `plaintext`. With no path, start untitled.
11. **Language override.** `#lang` `change` remounts with the current text, the selection and `keepDirty`, without changing `docId` or `rev`.

### `src/mock-ipc.ts`

`export function install()` does the following:

- Calls `mockWindows('main')` and then `mockIPC(handler)`, from `@tauri-apps/api/mocks`. If `mockIPC` accepts an options object with `shouldMockEvents`, pass `{ shouldMockEvents: true }`.
- Creates `window.__tauriEditorMock` with the C5 fields and defaults:
  - `files` is a new `Map`
  - `nextOpen` and `nextSave` are `null`
  - `discard` is `true`
  - `calls` is `[]`
  - `deferWrite` and `failWrite` are `false`
  - `releaseWrite` is a no-op
  - `text` returns `''`

**Handler.** It pushes every `cmd` to `calls`.

| command | behavior |
|---|---|
| `initial_path` | resolves to `null` |
| `pick_open_path` | resolves to `nextOpen` |
| `pick_save_path` | resolves to `nextSave` |
| `confirm_discard` | resolves to `discard` |
| `read_text_file` | resolves to `files.get(path)`, or throws `file not found: ${path}` |
| `write_text_file` | if `failWrite`, throws `write failed: ${path}: mock`; if `deferWrite`, returns a promise and sets `releaseWrite = () => { files.set(path, contents); resolve(null) }`; otherwise sets `files` and resolves to `null` |
| `plugin:window\|*`, `plugin:event\|*` | resolves to `null` |
| anything else | throws `unmocked: ${cmd}` |

Declare the global type in this file with `declare global { interface Window { __tauriEditorMock: ... } }`.

## Pitfalls

- **Save completion.** Clear `dirty` only when `docId === snap.docId && rev === snap.rev`. If `rev` moved, keep `dirty`, show `Saved (newer edits unsaved)` and never reset the editor text. The `busy` flag blocks only shortcuts; typing continues during a write.
- **Revision counter.** A remount must not increment `rev`. `createEditor({ doc })` emits no update, so do not call `setDoc` after creating the editor.
- **Stale mounts.** A slow `loadLanguage` from an older Open must not mount over a newer one. Use the token.
- **Console errors.** Never `console.error` handled errors, because the smoke test treats console errors as failures. Unexpected exceptions may surface.
- **Mock in production.** The mock must vanish from the production build. Keep the dynamic import inside the `MODE` check; never import `mock-ipc` statically.
- **No codemirror imports.** Do not import `@codemirror/state` here. Use `handle.state.doc.lineAt(head)` for `#pos`; `col = head - line.from + 1`.

## Verification

Run in `examples/tauri-editor` with `L=../../tmp/tauri-editor-20261110/tauri-editor-p02-frontend`. Record each exit status.

```
npm install (the two commands above)           > $L/install.log 2>&1   # exit 0
npm run check                                  > $L/check.log 2>&1     # exit 0
npm run build                                  > $L/build.log 2>&1     # exit 0; dist/index.html exists
rg -l "mockIPC|__tauriEditorMock" dist          # no match (exit 1)
rg -n "<style|<script>|<script(?![^>]*src)" dist/index.html -P   # no match (exit 1)
ls dist/assets | wc -l                          # > 2 (lazy language chunks emitted)
git diff --stat -- ../../package.json ../../package-lock.json   # empty
```

## Done when

- All the commands above give the stated results, with complete logs.
- `package.json` has the exact pins and the C3 scripts.
- The progress log records the intent snapshot, pre and post hashes, the resolved Tauri npm versions, logs, exit codes and blockers.

## Implementation status

P02 implementation and its assigned frontend checks are complete; see `impl-plans/progress/tauri-editor-p02-frontend.md` and plan-local evidence. Formal review, P04 smoke and serial integration remain downstream.

## Completion (Step 8)

This plan is complete and was accepted by the serial integration review. On the combined tree, the subproject check and the P04 smoke (12 passed, 0 failed) both exited 0 (`tmp/tauri-editor-20261110/reconcile-wave-002/`). The production dist mock scan found no matches. This plan is archived to `impl-plans/completed/`.
