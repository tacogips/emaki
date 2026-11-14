# P04 `tauri-editor-p04-smoke`: Playwright mocked-IPC smoke

- **Wave:** 2
- **dependsOn:** `tauri-editor-p02-frontend`
- **Design:** §8 (`scripts/smoke.mjs` steps 1-10, including the TAURI-DESIGN-001 regression), §12 V4
- **Contracts:** overview C3, C4, C5
- **writePaths:**
  - `examples/tauri-editor/scripts/smoke.mjs`
  - `tmp/tauri-editor-20261110/tauri-editor-p04-smoke` (artifact)
  - `examples/tauri-editor/node_modules` (artifact; the Vite dep cache `node_modules/.vite` is written by the dev server)
  - `impl-plans/progress/tauri-editor-p04-smoke.md`
- **sharedPaths:** none

## Intent

Produce automated browser evidence for the app: open → edit → save round trip, language detection and fallback, the registry-wide language select, the deferred-write dirty protection, discard confirmation, the write-error path and Save As cancel. It runs against the real frontend in Vite `mode: 'mock'`, with no native window.

## Non-goals

- Do not edit any P02 file. If a P02 behavior is wrong, record a blocker that names the P02 file, the symbol and the failing step; do not patch it.
- No `@playwright/test`, no vitest integration and no WebKit run.

## Changes

`scripts/smoke.mjs` is an ES module. Imitate the root `scripts/e2e.mjs`: a `check(name, ok, detail)` accumulator, a JSON summary, and an exit code.

1. **Server.** `createServer({ configFile: new URL('../vite.config.ts', import.meta.url).pathname, mode: 'mock', server: { port: 0, strictPort: false } })`, then `await server.listen()`. The URL is `server.resolvedUrls.local[0]`.
2. **Registry count.** `const { languages } = await server.ssrLoadModule(<absolute repo path>/src/language/registry.ts)`.
3. **Browser.** `chromium.launch()`. Collect `pageerror` events and console `error` messages; any of them fails the run. Then `goto(url)` and wait for `window.__tauriEditorMock` and `document.title === 'Untitled — emaki'`.
4. **Key and text helpers.**
   - Mod keys use Playwright's `ControlOrMeta`. This matches the app's Mac and other-OS rule.
   - Type at the end with `ControlOrMeta+End` followed by `keyboard.type(...)`, after clicking `#editor canvas`.
   - Read text with `page.evaluate(() => window.__tauriEditorMock.text())`.
5. **Steps.** Follow design §8 steps 3-9 exactly:
   1. Open `/mock/hello.ts`. Expect `#lang` to be `typescript` and the title `hello.ts — emaki`.
   2. Type `// edit`. Expect the title to contain `•`.
   3. Save. The file contains `// edit`, the title is clean and `calls` includes `write_text_file`.
   4. Deferred-write regression:
      1. Set `deferWrite`, type ` A`, save.
      2. Wait until a new `write_text_file` call appears, then type ` B`.
      3. Call `releaseWrite()` and wait for `#status-msg` to be `Saved (newer edits unsaved)`.
      4. The file ends with ` A` and has no ` B`. `text()` ends with ` A B` and the title has `•`.
      5. Set `discard = false` and press Mod+N. `confirm_discard` is newly called, and the title and text are unchanged.
      6. Clear `deferWrite` and save. The file ends with ` A B` and the title is clean.
   5. Write error and cancel:
      1. Set `failWrite`, type ` C`, save. The title keeps `•`, `#status-msg` contains `write failed`, and the text ends with ` C`. Then clear `failWrite`.
      2. Set `nextSave = null` and press Mod+Shift+S. The title and text are unchanged and no new `write_text_file` call appears.
      3. Press Mod+S. The title is clean.
   6. Open `/mock/notes.unknownext` (content `x`) with `discard = true`. `#lang` is `plaintext`.
   7. The `#lang` option count equals `languages.length`.
6. **Teardown.** Wrap everything in `try/finally`: `await browser?.close()` and then `await server.close()`. Print `JSON.stringify({ checks, passed, failed })`. `process.exitCode = failed ? 1 : 0`.

## Pitfalls

- **Waiting.** Wait on observable state (`page.waitForFunction` on the title, `calls.length` or `#status-msg`) with a timeout of about 10 seconds. Do not use fixed sleeps. If `ControlOrMeta+End` does not move the caret to the document end in emaki, use repeated `ControlOrMeta+ArrowDown`/`End`, and record which one was used.
- **The edited file is the one written.** Snapshot `calls.length` before each action, to assert "newly called".
- **Process lifecycle.** The script must end its own server and browser; no detached processes. It must not use port 1420, because the config's `strictPort` is overridden.
- **Mock seeding.** Seed `files` and `nextOpen` through `page.evaluate` before pressing Mod+O. `files` is a `Map`; use `.set`.
- **Browsers.** If the Chromium binary is missing, run `npx playwright install chromium` inside `examples/tauri-editor` once, log it, and record it in the progress log.

## Verification

Run in `examples/tauri-editor` with `L=../../tmp/tauri-editor-20261110/tauri-editor-p04-smoke`.

```
node --check scripts/smoke.mjs                 > $L/syntax.log 2>&1   # exit 0
npm run smoke                                  > $L/smoke.log 2>&1    # exit 0; summary failed=0, all design §8 checks present
lsof -nP -iTCP -sTCP:LISTEN | rg node || true  > $L/ports-after.log   # no leftover vite listener from this run
```

## Done when

- `npm run smoke` exits 0 with every check passing, covering steps 3-9.
- The progress log records the intent snapshot, the pre and post hash of `smoke.mjs`, the log paths, the exit codes, and any P02 blockers with precise repro steps.

## Step 6 implementation status

Implemented the assigned smoke and verified 12 checks with zero failures. See `impl-plans/progress/tauri-editor-p04-smoke.md` and `tmp/tauri-editor-20261110/tauri-editor-p04-smoke/`. Formal review remains downstream.

## Completion (Step 8)

This plan is complete and was accepted by the serial integration review. The combined-tree smoke exited 0 with 12 passed and 0 failed (`tmp/tauri-editor-20261110/reconcile-wave-002/smoke.log`); `smoke.mjs` sha256 is f1f21b80…264ab. This plan is archived to `impl-plans/completed/`.
