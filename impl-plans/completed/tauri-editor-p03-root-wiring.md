# P03 `tauri-editor-p03-root-wiring`: root tsconfig/vite/.gitignore and README

- **Wave:** 1
- **dependsOn:** none
- **Design:** §1 (root gates), §9, §12 V1/V6
- **Contracts:** overview C2, C3
- **writePaths:**
  - `tsconfig.json`
  - `vite.config.ts`
  - `.gitignore`
  - `README.md`
  - `tmp/tauri-editor-20261110/tauri-editor-p03-root-wiring` (artifact)
  - `dist` (artifact; root vite build output, git-ignored. The serial reconcile rewrites it again.)
  - `node_modules/.vite` (artifact; vite/vitest cache. Declare only this subdirectory, never the whole root `node_modules`.)
  - `impl-plans/progress/tauri-editor-p03-root-wiring.md`
- **sharedPaths:** none

## Intent

Keep the root gates (`npm run check`, `npm test`, `npm run build`) green and isolated from the subproject, keep build artifacts out of git, and document the Tauri editor.

## Non-goals

- Do not touch the root `package.json` or `package-lock.json`, `vitest.config.ts`, `examples/index.html`, `src/`, or anything under `examples/tauri-editor/`.
- No other README restructuring.

## Changes

### `tsconfig.json`

Change `"exclude"` to `["test/fixtures/languages", "examples/tauri-editor"]`. Nothing else.

### `vite.config.ts`

Hoist the five existing `new URL(...).pathname` inputs into a `const inputs = [...]` with the same order and paths. Use it for `build.rollupOptions.input` and `optimizeDeps: { entries: inputs }`. Add `server: { watch: { ignored: ['**/tauri-editor/src-tauri/**'] } }`.

The build output must be byte-for-byte equivalent in file set: compare the `dist/` file lists before and after.

### `.gitignore`

Append `examples/tauri-editor/src-tauri/target/` and `examples/tauri-editor/src-tauri/gen/`. Do not ignore `Cargo.lock` or `package-lock.json`.

### `README.md`

Add a `## Tauri standalone editor` section. Place it after the existing examples/demo section, or before the license section if there is none. Keep it concise. It covers:

1. **What it is.** `examples/tauri-editor`, a native Tauri 2 window running emaki with lazy language detection.
2. **Prerequisites.**
   - `npm install` at the repository root first.
   - rustup stable, using `~/.cargo/bin/cargo`.
   - The Tauri 2 system prerequisites.
3. **Run.**
   - `cd examples/tauri-editor && npm install && npm run tauri dev`
   - To open a file: `npm run tauri dev -- -- path/to/file`
4. **Shortcuts.** A table: Cmd/Ctrl+N New, +O Open, +S Save, +Shift+S Save As.
5. **Checks.**
   - `npm run check`, `npm run build`, `npm run smoke` (browser smoke with mocked IPC)
   - `cd src-tauri && ~/.cargo/bin/cargo test`
   - `npx tauri build --debug --no-bundle`
6. **Security model.**
   - Dialogs run in Rust.
   - `read_text_file` and `write_text_file` accept only paths chosen via the CLI argument or a dialog.
   - No fs plugin, minimal capabilities and a strict CSP.
   - Files must be UTF-8; line endings are saved as LF.

## Verification

Run at the repository root with `L=tmp/tauri-editor-20261110/tauri-editor-p03-root-wiring`.

```
npm run build > $L/build-before.log 2>&1 && (cd dist && find . -type f | sort) > $L/dist-before.txt   # run BEFORE editing vite.config.ts
npm run check > $L/check.log 2>&1        # exit 0
npm test      > $L/test.log 2>&1         # exit 0
npm run build > $L/build.log 2>&1 && (cd dist && find . -type f | sort) > $L/dist-after.txt   # exit 0
diff $L/dist-before.txt $L/dist-after.txt    # empty; no tauri-editor entries
rg -n "tauri-editor" tsconfig.json vite.config.ts .gitignore README.md   # matches in all four files
git diff --stat -- package.json package-lock.json   # empty
```

The asset hashes in `dist` file names may differ only if inputs changed. If names differ, record it and compare the file counts per directory instead. `check` must pass even while P01 and P02 are writing files under `examples/tauri-editor`; that is what the exclude is for.

## Done when

- All the commands above pass.
- The progress log records the intent snapshot, pre and post sha256 for the 4 files, log paths, exit codes and blockers.

## Completion (Step 8)

This plan is complete and was accepted by the serial integration review. On the combined tree, root check, test and build all exited 0, and the root dist list is unchanged (`tmp/tauri-editor-20261110/reconcile-wave-002/`). Step 8 updated the README prerequisites: the Tauri CLI resolves `cargo` from `PATH`, so `~/.cargo/bin` must come ahead of any shim. This plan is archived to `impl-plans/completed/`.
