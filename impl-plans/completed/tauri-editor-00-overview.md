# Tauri editor example: overview and shared contracts

- **Design (source of truth):** `design-docs/specs/design-tauri-editor.md`. Step 3 accepted it, including the TAURI-DESIGN-001 fix.
- **Issue:** none. This is a local workflowInput request.
- **Evidence root:** `tmp/tauri-editor-20261110/<planId>/`. It is git-ignored through the root `tmp/` rule. Every command writes a complete log there, and the progress log records its exit status.
- **Git policy:**
  - Workers never create branches, worktrees or stashes, and never commit or push.
  - Workflow finalization makes one local commit and does not push (`gitPush=false`).
  - Never commit `examples/tauri-editor/src-tauri/target`, `examples/tauri-editor/src-tauri/gen`, `node_modules` or `dist`.
- **Toolchain:**
  - Rust: `~/.cargo/bin/cargo` (rustup stable 1.97). Never use the mise `cargo` shim.
  - Node: the repository's Node. The root `node_modules` must already exist (the root `npm install` is a prerequisite and is not re-run by plans).

## Plans and waves

| planId | wave | dependsOn | owns |
|---|---|---|---|
| `tauri-editor-p01-native` | 1 | none | `examples/tauri-editor/src-tauri/**` (crate, conf, capabilities, icons, Cargo.lock) |
| `tauri-editor-p02-frontend` | 1 | none | `examples/tauri-editor/` frontend files, `package.json` and `package-lock.json` |
| `tauri-editor-p03-root-wiring` | 1 | none | root `tsconfig.json`, `vite.config.ts`, `.gitignore`, `README.md` |
| `tauri-editor-p04-smoke` | 2 | p02 | `examples/tauri-editor/scripts/smoke.mjs` |
| `tauri-editor-p05-native-build` | 2 | p01, p02, p03 | the native build evidence; may change `src-tauri/Cargo.lock` only to align versions |

## Shared contracts (pinned; do not change without a plan amendment)

### C1. IPC commands (Rust `#[tauri::command]` ↔ TS `invoke`)

All commands are `async` on the Rust side. Each returns `Result<T, String>`; on the JS side an error rejects with the error string. JS argument keys are camelCase forms of the Rust parameter names.

| command | JS call | resolves to |
|---|---|---|
| `initial_path` | `invoke('initial_path')` | `string \| null` |
| `pick_open_path` | `invoke('pick_open_path')` | `string \| null` (null on cancel) |
| `pick_save_path` | `invoke('pick_save_path', { suggested })` | `string \| null` |
| `confirm_discard` | `invoke('confirm_discard')` | `boolean` |
| `read_text_file` | `invoke('read_text_file', { path })` | `string` |
| `write_text_file` | `invoke('write_text_file', { path, contents })` | `null` |

The error strings begin with these exact prefixes:

- `path not permitted: `
- `file not found: `
- `not valid UTF-8: `
- `read failed: `
- `write failed: `

### C2. Names and ports

- Cargo package: `emaki-tauri-editor`. Library crate: `emaki_tauri_editor_lib`. Debug binary: `examples/tauri-editor/src-tauri/target/debug/emaki-tauri-editor`.
- `productName`: `emaki-tauri-editor`. `identifier`: `me.tacogips.emaki-tauri-editor`. Window label: `main`.
- Dev URL: `http://localhost:1420`. `frontendDist`: `../dist`. `beforeDevCommand`: `npm run dev`. `beforeBuildCommand`: `npm run build`.

### C3. Subproject npm scripts

| script | command |
|---|---|
| `dev` | `vite` |
| `build` | `vite build` |
| `check` | `tsc --noEmit` |
| `tauri` | `tauri` |
| `smoke` | `node scripts/smoke.mjs` |

### C4. DOM ids

| id | content |
|---|---|
| `#editor` | the editor host |
| `#status-msg` | status messages |
| `#lang` | the language `<select>`; option `value` is `info.id` |
| `#pos` | `Ln {line}, Col {col}` |

The title format is `${name}${dirty ? ' •' : ''} — emaki`. It is mirrored to `document.title`.

### C5. Mock API

Present only when `import.meta.env.MODE === 'mock'`:

```
window.__tauriEditorMock: {
  files: Map<string,string>,
  nextOpen: string|null,
  nextSave: string|null,
  discard: boolean,
  calls: string[],
  deferWrite: boolean,
  failWrite: boolean,
  releaseWrite(): void,
  text(): string,
}
```

- `src/mock-ipc.ts` `install()` creates the object.
- `main.ts` assigns `text` after the first mount.
- Handled errors go to `#status-msg` and **never** to `console.error`. The smoke test fails on any console error.

**Status messages:**

- `Saved`
- `Saved (newer edits unsaved)`
- otherwise the raw error string

### C6. Version alignment

- `@tauri-apps/api` (npm) and the `tauri` crate must share the same `major.minor`. The Tauri CLI rejects mismatches.
- P01 and P02 each resolve the latest stable 2.x and record the resolved versions in their progress logs.
- P05 reconciles any mismatch by editing only `src-tauri/Cargo.lock`, using `cargo update -p tauri --precise <ver>`.

## Per-edit discipline (every plan)

Plans in a wave share one working directory. For each owned file:

1. Before editing, re-read it fresh and record its sha256 (or `absent`) in the progress log.
2. Edit only owned paths. After editing, record the post-edit sha256.
3. Before finishing, re-hash every owned file. If a hash changed without your edit (drift), stop and record a blocker. Never overwrite another plan's change.
4. Never run broad formatting or `npm install` outside the plan's own package directory.

Serial repair happens after the wave joins.

## Reconcile and integration gates (serial, after all plans)

1. `npm run check && npm test && npm run build` (repository root)
2. `cd examples/tauri-editor && npm run check && npm run build && npm run smoke`
3. `cd examples/tauri-editor/src-tauri && ~/.cargo/bin/cargo check && ~/.cargo/bin/cargo clippy -- -D warnings && ~/.cargo/bin/cargo test`
4. `cd examples/tauri-editor && npx tauri build --debug --no-bundle`
5. `git diff --stat origin/main -- package.json package-lock.json` must be empty.
6. `git status --porcelain --ignored examples/tauri-editor`: `target/` and `gen/` must appear only as ignored, and `src-tauri/Cargo.lock` and `package-lock.json` must be untracked-but-not-ignored, so they get committed.

## Completion (Step 8)

All of P01–P05 are complete and were accepted by the serial integration review on the combined tree. The combined-tree gate logs are in `tmp/tauri-editor-20261110/reconcile-wave-002/`, and every gate exited 0: root check, test and build; subproject check; smoke (12 passed, 0 failed); cargo fmt, clippy and test (6 passed); and `tauri build --debug --no-bundle` with `~/.cargo/bin` first on `PATH`. The native GUI window and `npm run tauri dev` were not observed. This overview and P01–P05 are archived to `impl-plans/completed/`.
