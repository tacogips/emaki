# P01 `tauri-editor-p01-native`: Rust crate, Tauri config, capabilities, icons

- **Wave:** 1
- **dependsOn:** none
- **Design:** §3, §5, §6, §11 (decisions 1, 4, 6), §12 V3
- **Contracts:** overview C1, C2, C6
- **writePaths:**
  - `examples/tauri-editor/src-tauri/Cargo.toml`
  - `examples/tauri-editor/src-tauri/Cargo.lock`
  - `examples/tauri-editor/src-tauri/build.rs`
  - `examples/tauri-editor/src-tauri/tauri.conf.json`
  - `examples/tauri-editor/src-tauri/capabilities/default.json`
  - `examples/tauri-editor/src-tauri/icons`
  - `examples/tauri-editor/src-tauri/src/main.rs`
  - `examples/tauri-editor/src-tauri/src/lib.rs`
  - `examples/tauri-editor/src-tauri/target` (artifact)
  - `examples/tauri-editor/src-tauri/gen` (artifact)
  - `tmp/tauri-editor-20261110/tauri-editor-p01-native` (artifact)
  - `impl-plans/progress/tauri-editor-p01-native.md`
- **sharedPaths:** none

## Intent

The native half of the standalone editor: a Tauri 2 app whose webview can only read and write files the user chose (through the CLI argument or a native dialog). File IO is limited to two commands, and capabilities are minimal. A CSP without `unsafe-inline` or `unsafe-eval` keeps the webview locked down.

## Non-goals

- Do not write any frontend file, `package.json`, root file, or chilla/vactr file. Chilla is a read-only reference: reading `/Users/taco/gits/tacogips/chilla/src-tauri` is allowed if the sandbox permits it, but copying icons or branding is forbidden.
- Do not add the fs plugin, `tauri-plugin-cli`, serde, tokio, tempfile or any other dependency.
- Do not add an `AppManifest` command allow-list, atomic writes, size limits or encoding detection.
- Do not add `custom-protocol` to default features. `cargo check` must work without `../dist` existing; the Tauri CLI enables custom-protocol itself for `tauri build`.

## Changes

### `Cargo.toml`

- `[package]`: name `emaki-tauri-editor`, version `0.1.0`, edition `2021`, `publish = false`, license `MIT`.
- `[lib]`: name `emaki_tauri_editor_lib`, crate-type `["staticlib", "cdylib", "rlib"]`.
- `[build-dependencies]`: `tauri-build = { version = "2", features = [] }`.
- `[dependencies]`: `tauri = { version = "2", features = [] }` and `tauri-plugin-dialog = "2.7.0"`.

### `build.rs`

Calls `tauri_build::build()`.

### `src/main.rs`

`#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]` followed by `emaki_tauri_editor_lib::run()`.

### `src/lib.rs`

**Pure helpers.** Free functions with no Tauri types, so they are unit-testable:

- `fn cli_path(args: impl Iterator<Item = String>) -> Option<PathBuf>` skips the binary name (`args.skip(1)`) and returns the first argument that does not start with `-`, made absolute with `std::path::absolute`.
- `fn is_granted(set: &HashSet<PathBuf>, path: &Path) -> bool` checks exact `PathBuf` equality. There is no canonicalization, because a Save As target may not exist yet.
- `fn read_text(path: &Path) -> Result<String, String>` calls `fs::read` then `String::from_utf8`. It maps `ErrorKind::NotFound` → `file not found: {path}`, a UTF-8 error → `not valid UTF-8: {path}`, and anything else → `read failed: {path}: {err}`. Use `path.display()`.
- `fn write_text(path: &Path, contents: &str) -> Result<(), String>` calls `fs::write` and maps errors to `write failed: {path}: {err}`.

**State.** `struct AppState { granted: Mutex<HashSet<PathBuf>>, initial: Option<PathBuf> }`. At startup, `initial` is set from `cli_path(std::env::args())` and inserted into `granted`.

**Commands.** All six C1 commands are `#[tauri::command] async fn` returning `Result<_, String>`. They take `app: tauri::AppHandle` and/or `state: tauri::State<'_, AppState>` as needed.

- `read_text_file(path: String)` and `write_text_file(path: String, contents: String)`: check `is_granted` first. On failure return `path not permitted: {path}`, then delegate to the helpers.
- `pick_open_path()`: `app.dialog().file().blocking_pick_file()`.
- `pick_save_path(suggested: Option<String>)`: `app.dialog().file()` plus `set_file_name(suggested)` when present, then `.blocking_save_file()`.
  - For both pickers, convert the `FilePath` with `into_path()`. On success, insert the path into `granted` and return it as a `String`. Cancel returns `Ok(None)`.
- `confirm_discard()`: a `message("Discard unsaved changes?")` dialog with a warning kind and OK/Cancel (or Yes/No) buttons, via `.blocking_show()`.
- `initial_path()`: returns `state.initial` as a `String`.

**`pub fn run()`.** `tauri::Builder::default().plugin(tauri_plugin_dialog::init()).manage(AppState{..}).invoke_handler(tauri::generate_handler![...six...]).run(tauri::generate_context!()).expect(...)`.

**Tests.** `#[cfg(test)] mod tests` covers the cases listed under Tests.

### `tauri.conf.json`

Follow design §6 exactly.

- `$schema`: `https://schema.tauri.app/config/2`.
- C2 names and URLs.
- `app.windows`: `[{ "label": "main", "title": "Untitled — emaki", "width": 1000, "height": 700, "resizable": true }]`.
- `app.security.csp`: exactly the design §6 string.
- `app.security.devCsp`: the same string plus `ws://localhost:1420` in `connect-src`.
- `bundle.icon`: lists the 5 committed icon files.

### `capabilities/default.json`

```
{ "identifier": "default", "windows": ["main"], "permissions": [
  "core:event:allow-listen", "core:event:allow-unlisten",
  "core:window:allow-set-title", "core:window:allow-destroy"
] }
```

Nothing else: no `core:default` and no `dialog:*`.

### `icons/`

1. Generate an original placeholder 1024×1024 RGBA PNG under `tmp/tauri-editor-20261110/tauri-editor-p01-native/app-icon.png`, for example with a one-off Node `zlib` script kept in that tmp directory. A plain colored square with a simple glyph or block is fine.
2. Run `npx --yes @tauri-apps/cli@2 icon <that png> -o tmp/tauri-editor-20261110/tauri-editor-p01-native/icons-out`.
3. Copy only `32x32.png`, `128x128.png`, `128x128@2x.png`, `icon.icns` and `icon.ico`, plus `icon.png`, into `src-tauri/icons/`.

`npx --yes` uses the npm cache outside the repository; it must not create `package.json` files.

## Pitfalls

- **Dialog threading.** The `blocking_*` dialog calls must be inside `async` commands. A sync `#[tauri::command]` runs on the main thread and deadlocks. Check the exact dialog API names against the resolved crate source under `~/.cargo/registry/src/*/tauri-plugin-dialog-2.*/src`. If a name differs (for example `MessageDialogButtons`), adapt the call but keep the behavior.
- **Command signatures.** An `async` command that borrows `State<'_, _>` must return `Result`, or it fails to compile.
- **Error mapping.** Do not `unwrap` a poisoned mutex inside a command; map it to an `Err` string.
- **Lockfile.** Run `cargo generate-lockfile` (or let `cargo check` create it). `Cargo.lock` is committed, so do not git-ignore it.
- **Versions.** Record in the progress log the resolved `tauri` and `tauri-plugin-dialog` versions, from `~/.cargo/bin/cargo tree -p tauri --depth 0`, for C6.

## Tests

| case | expected |
|---|---|
| `write_text` then `read_text` of `"hello\nworld\n"` in a unique temp file (`std::env::temp_dir().join(format!("emaki-tauri-editor-{}-{name}", std::process::id()))`) | equal |
| `read_text` of a nonexistent path | `Err` starting with `file not found: ` |
| `"日本語 ✓ 🎉\n"` round trip | the result equals the input, and the bytes on disk equal `.as_bytes()` |
| a file containing bytes `[0xff, 0xfe, 0x41]` | `Err` starting with `not valid UTF-8: ` |
| `is_granted` with the set `{a}` and the path `b` | `false`; path `a` gives `true` |
| `cli_path(["bin", "--flag", "x.txt"])` | `Some(absolute path ending in x.txt)`; `["bin"]` gives `None` |

Each test removes its temp files.

## Verification

Run in `examples/tauri-editor/src-tauri` with `L=../../../tmp/tauri-editor-20261110/tauri-editor-p01-native`. Each command records its exit status in the progress log.

```
~/.cargo/bin/cargo fmt --check                 > $L/fmt.log 2>&1      # exit 0
~/.cargo/bin/cargo check                       > $L/check.log 2>&1    # exit 0
~/.cargo/bin/cargo clippy -- -D warnings       > $L/clippy.log 2>&1   # exit 0
~/.cargo/bin/cargo test                        > $L/test.log 2>&1     # exit 0, "6 passed"
~/.cargo/bin/cargo tree -p tauri --depth 0     > $L/tree.log 2>&1     # records tauri version
rg -n "unsafe-inline|unsafe-eval|core:default|dialog:|fs:" tauri.conf.json capabilities/default.json  # no match (exit 1)
```

The first compile is slow, so use a foreground timeout of at least 20 minutes and run no background processes.

## Done when

- Every listed command has the stated exit status, with complete logs.
- `icons/` contains exactly the 6 files.
- `Cargo.lock` exists.
- The progress log records:
  - the intent snapshot
  - pre and post sha256 for owned files
  - the resolved versions
  - the log paths and exit codes
  - any blockers

## Implementation status (Step 6)

- Implementation complete: six async commands, strict CSP and four permissions, six original generated icons, Cargo.lock and six unit tests.
- Final-source checks pass: cargo fmt --check, cargo check, cargo clippy -- -D warnings, cargo test (6 passed); forbidden-pattern scan returned 1 with no matches. Logs and source hashes are recorded in `impl-plans/progress/tauri-editor-p01-native.md`.
- Formal review, downstream integration, version alignment, staging and commit remain pending.

## Completion (Step 8)

This plan is complete and was accepted by the serial integration review. On the combined tree, cargo fmt, clippy -D warnings and test (6 passed) all exited 0 (`tmp/tauri-editor-20261110/reconcile-wave-002/`). P05 aligned the versions at 2.12. This plan is archived to `impl-plans/completed/`.
