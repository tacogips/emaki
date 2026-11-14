# P04 `vim-p04-tauri-dirty`: clean-baseline dirty tracking, ordered titles, trace, launch regression

- **Wave:** 1
- **dependsOn:** none
- **Design:** `design-vim.md` §7 "Dirty-on-launch fix", the Title paragraph, and smoke step 1. Also `design-tauri-editor.md` §7 (superseded note).
- **Contracts:** overview C5 (p04 part), C6 (`traceDirty` key)
- **writePaths:**
  - `examples/tauri-editor/src/main.ts`
  - `examples/tauri-editor/src/mock-ipc.ts`
  - `examples/tauri-editor/scripts/smoke.mjs`
  - `examples/tauri-editor/dist` (artifact)
  - `tmp/vim-20261111/vim-p04-tauri-dirty` (artifact)
  - `impl-plans/progress/vim-p04-tauri-dirty.md`
- **sharedPaths:** none

## Intent

In the native WKWebView app, the title shows `•` right after launching with a CLI file. The cause: `dirty` is set by *any* `docChanged` (`main.ts:27`), and the native `setTitle` calls are unordered (`main.ts:15`).

Make dirty mean "content differs from the last loaded or saved text". Make the native title converge to the latest value. Add an opt-in trace for native root-cause confirmation. Prove the mitigation in the mocked smoke test.

## Non-goals

- No vim UI or ex commands; p06 does those.
- No Rust changes.
- No emaki `src/` changes. The conditional input fix belongs to p07.
- Do not change the existing smoke checks' expectations.

## Changes (`main.ts`)

### Clean baseline

- Add a module-level `let clean: EditorHandle['state']['doc']`. Do **not** import `@codemirror/state` in the example: `design-tauri-editor.md` §4 says the subproject never imports `@codemirror/*`.
- **Where the baseline is set (F1).** `mount()` itself sets `clean = handle.state.doc` whenever `live` is false. It does this immediately after `createEditor` and after the optional selection dispatch, and **before** `handle.onUpdate(...)` registration and **before** `handle.focus()`.
  - Live remounts (`live === true`: language override, Save As language change, and later p06's vim toggle) keep the existing `clean` untouched.
  - Do **not** add post-mount `clean` assignments in `openPath`, `newFile` or launch. They are redundant, and if they were the only assignment they would be wrong.
- In the `onUpdate` callback, on `docChanged`: `rev++`, then `const next = !handle.state.doc.eq(clean)`. Only if `next !== dirty`, set `dirty = next` and call `title()`. Keep the `position()` refresh.

### Save

- Snapshot `{ docId, doc: handle.state.doc }` and write `snap.doc.toString()`.
- On success with an unchanged `docId`: `clean = snap.doc` and `dirty = !handle.state.doc.eq(clean)`. Keep the status messages `Saved` / `Saved (newer edits unsaved)` and `title()`.
- `rev` stays as a counter. It no longer decides `dirty`.

### Title

- `title()` sets `document.title` synchronously.
- The native title goes through a latest-wins chain: keep `pendingTitle` and `inflight`.
  - If a call is in flight, only update `pendingTitle`.
  - Otherwise loop: take `pendingTitle`, `await getCurrentWindow().setTitle(t)` (catching errors to `#status-msg`), and repeat while `pendingTitle` changed.
- There is never more than one `setTitle` in flight.

### Trace

- Read `localStorage.getItem('emaki-tauri-editor.traceDirty') === '1'` once, in `try/catch`; on failure it is off.
- When on, the `onUpdate` callback, for each `docChanged`, logs `console.debug('[dirty-trace]', { userEvent: update.userEvent, changes, eqClean })`. `changes` is collected with `update.changes.iterChanges` as `[fromA, toA, insertedText]`, and `eqClean` is the result of `doc.eq(clean)`.

### Mock hook

In mock mode only, next to the existing `text` registration, add:

```ts
window.__tauriEditorMock.dispatchIdentity = () => handle.dispatch({ changes: { from: 0, to: handle.state.doc.length, insert: handle.state.doc } });
```

## Changes (`mock-ipc.ts`)

- Extend the `Window` typing with `dispatchIdentity(): void` and `__tauriEditorMockSeed?: { initialPath?: string; files?: Record<string, string> }`.
- `install()` copies `seed.files` into `files`.
- `initial_path` returns `seed.initialPath ?? null`.
- The defaults are unchanged when there is no seed.

## Changes (`smoke.mjs`)

Add one **separate page** after the existing flow, using the same browser and server. In the new page:

1. `page.addInitScript(() => { window.__tauriEditorMockSeed = { initialPath: '/mock/hello.rs', files: { '/mock/hello.rs': 'fn main() {}\n' } }; })`, then `goto`.
2. Wait for the title `hello.rs — emaki` and check that it contains no `•`. This launch path runs `mount()`'s own `focus()`, so it covers the mount-time focus vector (F1).
   - Add a further check named `launch baseline set before focus`: in mock mode, `main.ts` also records `window.__tauriEditorMock.dirtyAtFocus = dirty` immediately after `handle.focus()` inside `mount()`. Assert that `dirtyAtFocus === false` once the launch title appears.
   - Add `dirtyAtFocus?: boolean` to the mock typing in `mock-ipc.ts`.
3. Dispatch these events on `#editor textarea`:
   - `focus`
   - a `document` `selectionchange`
   - `new InputEvent('input', { inputType: 'insertText', data: null, bubbles: true })` with the value unchanged
4. Call `__tauriEditorMock.dispatchIdentity()` and wait about 200 ms. Check: the title still has no `•`.
5. Click the canvas, type `x` and wait for `•`. Press Backspace and wait for the title without `•`. Check: an undone edit reads clean.
6. Attach the page error and console error listeners to the new page too. Add the checks to the same `checks` array, so the JSON summary covers them.

## Pitfalls

- **Unchanged smoke expectations.** The existing deferred-write checks must still pass. Edits made during a pending write keep `•`, because `eq` against the snapshot differs.
- **No `rev`-based dirty logic.** Do not compute dirty from `rev`. Do not call `title()` on every keystroke when `dirty` is unchanged.
- **Remount keeps the baseline.** A language-override remount must not reset `clean`.
- **Baseline ordering (F1).** Never set the baseline after `handle.focus()` or after `onUpdate` registration.
  - **Why:** `mount()` (`main.ts:24-28`) runs `createEditor`, then `onUpdate`, then `focus`. The core focus listener runs `flushBeforeHandler` synchronously (`src/input/input.ts:85`). On WKWebView, that or the platform events around it are the suspected source of a `docChanged` during mount. If `clean` still held the previous document (or was unset), that update would compute `dirty = true`, and assigning `clean` afterwards would not recompute it.
  - **Ordering for a fresh mount:** `createEditor` → selection dispatch → `clean = handle.state.doc` (only if `!live`) → `dirty = keepDirty` → `onUpdate` → `position()` and `title()` → `focus()`.
- **Smoke readiness.** The smoke test fails on any console error. `console.debug` is fine.
- **Mock code stays out of production.** Keep the mock-only code behind the existing `import.meta.env.MODE === 'mock'` guards, so `dist` has no `mockIPC` or `dispatchIdentity`.

## Verification

Run from `examples/tauri-editor`. Write each log to `tmp/vim-20261111/vim-p04-tauri-dirty/`.

| command | log | must show |
|---|---|---|
| `npm run check` | `check.log` | exit 0 |
| `npm run build` | `build.log` | exit 0 |
| `rg -n 'mockIPC\|dispatchIdentity\|dirtyAtFocus' dist` | `dist-grep.log` | no match (exit 1). The `dirtyAtFocus` write sits behind `import.meta.env.MODE === 'mock'` |
| `npm run smoke` | `smoke.log` | exit 0; the JSON contains every old check plus the new launch-regression checks, all `ok` |

## Done criteria

- All four commands meet their expected results.
- The progress log contains a short root-cause hypothesis paragraph (taken from design §7) for p07 to use, plus the exit codes.

## Implementation status

Implementation-phase criteria completed on the moving shared tree: check, build, production mock-symbol exclusion and smoke passed; see `impl-plans/progress/vim-p04-tauri-dirty.md` and plan-local logs. Formal reviews and serial reconciliation remain downstream.
