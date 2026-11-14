# P05 `vim-p05-rust-confirm-open`: Rust `confirm_open_path`

- **Wave:** 1
- **dependsOn:** none
- **Design:**
  - `design-vim.md` §7 "New Rust command `confirm_open_path(path) -> Option<String>` (async)" and §9 D7
  - `design-tauri-editor.md` §5 (granted-path boundary)
- **Contracts:** overview C4
- **writePaths:**
  - `examples/tauri-editor/src-tauri/src/lib.rs`
  - `examples/tauri-editor/src-tauri/target` (artifact)
  - `tmp/vim-20261111/vim-p05-rust-confirm-open` (artifact)
  - `impl-plans/progress/vim-p05-rust-confirm-open.md`
- **sharedPaths:** none

## Intent

`:e {path}` needs to open a typed path. The webview must still never read a path the user did not approve. The new command asks natively. On Yes it grants the path and returns the absolute form.

## Non-goals

- No capability or permission changes. App commands are allowed by default.
- No `tauri.conf.json` or `Cargo.toml` edits, and no new crates.
- No frontend edits.
- No `cargo update`. `Cargo.lock` must not change.

## Changes (`lib.rs`)

### `absolutize`

Add `fn absolutize(path: &Path) -> Result<PathBuf, String>`. It wraps `std::path::absolute`, imitating `cli_path` in the same file, and maps errors to `format!("invalid path: {}: {err}", path.display())`.

### `confirm_open_path`

```rust
#[tauri::command]
async fn confirm_open_path(path: String, app: tauri::AppHandle, state: tauri::State<'_, AppState>) -> Result<Option<String>, String>
```

1. Absolutize the path.
2. Ask with `app.dialog().message(format!("Open {}?", abs.display())).kind(MessageDialogKind::Info).buttons(MessageDialogButtons::OkCancel).blocking_show()`. Imitate `confirm_discard`.
3. If the answer is false, return `Ok(None)`.
4. Otherwise insert `abs` into `state.granted` (lock and map the error to a string, as `grant` does) and return `Ok(Some(abs.to_string_lossy().into_owned()))`.
5. Register the command in `tauri::generate_handler![…]`.

### Unit tests

In the existing `#[cfg(test)]` module:
- `absolutize(Path::new("rel/x.txt"))` equals `std::env::current_dir()?.join("rel/x.txt")`.
- An absolute path, for example `temp_dir().join("a.txt")`, is returned unchanged.

## Pitfalls

- **Keep it `async`.** `blocking_show` inside a sync command runs on the main thread and deadlocks.
- **Grant only after Yes.** Never grant before the user answers Yes.
- **Error-string compatibility.** Do not change existing commands or their error prefixes (the overview of the earlier Tauri plan pins them).

## Verification

Run from `examples/tauri-editor/src-tauri` with `PATH="$HOME/.cargo/bin:$PATH"`. Write each log to `tmp/vim-20261111/vim-p05-rust-confirm-open/`.

| command | log | must show |
|---|---|---|
| `~/.cargo/bin/cargo test` | `test.log` | exit 0; the existing 6 tests plus the 2 new tests pass |
| `~/.cargo/bin/cargo clippy -- -D warnings` | `clippy.log` | exit 0 |
| `git diff --stat -- Cargo.lock` | `lock.log` | empty |

## Done criteria

- All three commands meet their expected results.
- The progress log records the exit codes.

Implementation status: criteria met on the shared working tree; see `impl-plans/progress/vim-p05-rust-confirm-open.md` for results. Independent review and finalization remain pending.
